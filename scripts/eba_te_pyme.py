#!/usr/bin/env python3
"""Consumo de capital de la cartera PYME, desde el EU-wide Transparency
Exercise del EBA (fichero tr_cre.csv de la base completa).

Da la DENSIDAD DE RWA de PYME observada por pais, que sustituye al supuesto
uniforme que usaba el modelo, y la tasa de exposicion en default.

Partidas usadas (columna Item del fichero):
    2520503  Original Exposure - SME
    2520513  Original Exposure - SME, del cual en default
    2520523  Exposure value - SME
    2520533  Risk exposure amount - SME

Se agregan todas las clases de exposicion con Country = 0, que es el total
de la entidad, y se suman las entidades cuyo supervisor nacional (NSA) es
cada uno de los seis paises.

Uso:
    python3 scripts/eba_te_pyme.py [--periodo 202506]
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
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "eu-wide-transparency-exercise")
PAISES = {"ES": "Espana", "DE": "Alemania", "FR": "Francia",
          "IT": "Italia", "PT": "Portugal", "NL": "Paises Bajos"}
ITEMS = {"2520503": "exposicion_original", "2520513": "exposicion_default",
         "2520523": "exposicion_valor", "2520533": "rwa"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--periodo", default="202506")
    a = ap.parse_args()
    if not os.path.exists(CSV_TE):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % CSV_TE)

    acc = collections.defaultdict(lambda: collections.defaultdict(float))
    with open(CSV_TE, encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh):
            if (d["Item"] not in ITEMS or d["NSA"] not in PAISES
                    or d["Period"] != a.periodo or d["Country"] != "0"):
                continue
            try:
                acc[d["NSA"]][ITEMS[d["Item"]]] += float(d["Amount"])
            except ValueError:
                pass

    destino = os.path.join(ROOT, "transversal", "eba_te_capital_pyme.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh2, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    per = "%s-Q%d" % (a.periodo[:4], int(a.periodo[4:6]) // 3)
    n = 0
    print("\nCartera PYME, %s (millones de euros y %%)\n" % per)
    print("%-14s %13s %10s %12s" % ("", "exposicion", "densidad", "en default"))
    for nsa, v in sorted(acc.items()):
        ev, rwa = v.get("exposicion_valor"), v.get("rwa")
        oe, de = v.get("exposicion_original"), v.get("exposicion_default")
        if not ev or not rwa:
            continue
        dens = 100 * rwa / ev
        tdef = 100 * de / oe if oe else None
        print("%-14s %13.0f %9.1f%% %11s" % (
            PAISES[nsa][:13], ev, dens,
            ("%.2f%%" % tdef) if tdef is not None else "-"))
        filas = [("Exposicion PYME (valor de exposicion)", ev, "eur_millones", "importe",
                  "suma de entidades cuyo supervisor es este pais"),
                 ("Activos ponderados por riesgo, PYME", rwa, "eur_millones", "importe",
                  "partida 2520533 del Transparency Exercise"),
                 ("Densidad de RWA de la cartera PYME", dens, "pct_rwa", "ratio",
                  "OBSERVADO. RWA sobre valor de exposicion; incorpora ya el "
                  "factor de apoyo a PYME del art. 501 CRR")]
        if tdef is not None:
            filas.append(("Exposicion PYME en default", tdef, "pct_cartera", "ratio",
                          "exposicion original en default sobre exposicion original"))
        for metrica, valor, unidad, td, nota in filas:
            w.writerow(schema.row(
                pais=PAISES[nsa], producto="capital_pyme", metrica=metrica,
                valor="%.4f" % valor, unidad=unidad, periodo_referencia=per,
                fuente="EBA, EU-wide Transparency Exercise 2025 (tr_cre.csv)",
                url=URL, fecha_publicacion=hoy,
                criterio_segmentacion="tamano_empresa_empleados",
                tipo_de_dato=td, ponderacion="media_ponderada_volumen",
                notas=nota)); n += 1
    fh2.close()
    print("\n%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
