# -*- coding: utf-8 -*-
"""Densidad de RWA de la cartera de EMPRESAS (total, PYME y gran empresa).

`scripts/eba_te_pyme.py` da la densidad de la cartera PYME agregando sus
tres clases de exposicion (Corporates-SME, Retail-SME y Secured by
mortgages-SME). Eso es lo correcto para el prestamo PYME.

Para el CIRCULANTE hace falta otra cosa. El tipo que publica el MIR
(serie A2Z1) es del TOTAL de sociedades no financieras y no tiene tramo de
importe, asi que su perimetro homologo en el lado del capital es la clase
de exposicion `Corporates` completa, no la cartera PYME.

Aqui se extraen las tres, para poder acotar el sesgo:

    Corporates            Exposure 303, partidas 2520522 / 2520532
    Corporates - SME      Exposure 302, partidas 2520523 / 2520533
    gran empresa          la diferencia de las dos anteriores

Y se pondera el coste del riesgo de las dos clases IRB por su exposicion,
para tener un coste del riesgo del perimetro de empresas.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import argparse
import collections
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_TE = os.path.join(ROOT, "raw", "eba_te", "tr_cre.csv")
OUT = os.path.join(ROOT, "transversal", "eba_te_capital_empresas.csv")
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "eu-wide-transparency-exercise")
PAISES = {"ES": "Espana", "DE": "Alemania", "FR": "Francia", "IT": "Italia",
          "PT": "Portugal", "NL": "Paises Bajos", "IE": "Irlanda"}
HOY = "2026-09-17"
# (Item, Exposure) -> clave
CLAVES = {
    ("2520522", "303"): "exp_corp", ("2520532", "303"): "rwa_corp",
    ("2520523", "302"): "exp_pyme", ("2520533", "302"): "rwa_pyme",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--periodo", default="202506")
    a = ap.parse_args()
    if not os.path.exists(CSV_TE):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % CSV_TE)

    acc = collections.defaultdict(lambda: collections.defaultdict(float))
    with open(CSV_TE, encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh):
            if (d["NSA"] not in PAISES or d["Period"] != a.periodo
                    or d["Country"] != "0"):
                continue
            k = CLAVES.get((d["Item"], d["Exposure"]))
            if not k:
                continue
            try:
                acc[d["NSA"]][k] += float(d["Amount"])
            except (TypeError, ValueError):
                continue

    # coste del riesgo por clase IRB, ya extraido
    cor = collections.defaultdict(dict)
    ruta = os.path.join(ROOT, "transversal", "eba_parametros_riesgo.csv")
    for x in csv.DictReader(open(ruta, encoding="utf-8")):
        if x["metrica"].startswith("Coste del riesgo PYME"):
            cor[x["pais"]]["pyme"] = float(x["valor"])
        elif x["metrica"].startswith("Coste del riesgo gran empresa"):
            cor[x["pais"]]["grande"] = float(x["valor"])

    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)
    n = 0
    print("%-14s %11s %11s %11s %11s %11s"
          % ("", "dens corp", "dens PYME", "dens gran", "CoR corp",
             "peso PYME"))
    for cod, pais in PAISES.items():
        d = acc[cod]
        eC, rC = d["exp_corp"], d["rwa_corp"]
        eS, rS = d["exp_pyme"], d["rwa_pyme"]
        eG, rG = eC - eS, rC - rS
        if not (eC and eS and eG > 0):
            print("  %-14s sin datos completos" % pais)
            continue
        dC, dS, dG = 100 * rC / eC, 100 * rS / eS, 100 * rG / eG
        peso = 100 * eS / eC
        c = cor.get(pais, {})
        cC = ((c["pyme"] * eS + c["grande"] * eG) / eC
              if c.get("pyme") is not None and c.get("grande") is not None
              else None)
        print("%-14s %10.1f%% %10.1f%% %10.1f%% %10s %10.1f%%"
              % (pais[:13], dC, dS, dG,
                 "%.2f%%" % cC if cC is not None else "n/d", peso))
        base = dict(pais=pais, producto="capital_empresas",
                    periodo_referencia="2025-06",
                    fuente="EBA, EU-wide Transparency Exercise", url=URL,
                    fecha_publicacion=HOY, criterio_segmentacion="entidad",
                    ponderacion="media_ponderada_volumen")
        filas = [
            ("Densidad de RWA de la cartera de empresas", dC, "pct_rwa",
             "ratio", "clase de exposicion Corporates completa (codigo 303), "
             "que es el perimetro homologo del tipo de circulante del MIR"),
            ("Densidad de RWA de Corporates - SME", dS, "pct_rwa", "ratio",
             "solo la clase Corporates - SME (codigo 302). NO coincide con "
             "la densidad de la cartera PYME del modelo del prestamo, que "
             "agrega ademas Retail - SME y Secured by mortgages - SME"),
            ("Densidad de RWA de gran empresa", dG, "pct_rwa", "ratio",
             "Corporates menos Corporates - SME, por diferencia"),
            ("Peso de la PYME en la exposicion a empresas", peso,
             "pct_cartera", "ratio", "Corporates - SME sobre Corporates"),
            ("Exposicion a empresas", eC / 1e6, "eur_millones", "importe",
             "valor de exposicion, partida 2520522"),
        ]
        if cC is not None:
            filas.append(
                ("Coste del riesgo de la cartera de empresas", cC,
                 "pct_cartera", "nivel",
                 "PD x LGD de PYME y de gran empresa, ponderados por su "
                 "exposicion respectiva en el Transparency Exercise"))
        for metrica, valor, unidad, td, nota in filas:
            w.writerow(schema.row(metrica=metrica, valor="%.4f" % valor,
                                  unidad=unidad, tipo_de_dato=td,
                                  notas=nota, **base))
            n += 1
    fh.close()
    print()
    print("%d filas -> %s" % (n, OUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
