# -*- coding: utf-8 -*-
"""Reconciliacion: ROE modelizado de PYME Espana frente a la rentabilidad de grupo.

El modelo de `modelo_roe_bancos_es.py` produce un ROE del SEGMENTO PYME EN
ESPANA de cada banco. Esa cifra no es comparable sin mas con el "RoTE" que
cada banco titula en su presentacion de resultados, por tres razones que
esta reconciliacion hace explicitas:

  1. PERIMETRO. El ROE modelizado es de la cartera PYME espanola. El RoTE
     publicado es del GRUPO CONSOLIDADO. Para Santander y BBVA el grupo
     esta dominado por Brasil, Mexico, Reino Unido y Turquia, donde el
     margen y el coste del riesgo no se parecen a los espanoles.
  2. DENOMINADOR. El modelo divide por el capital regulatorio asignado
     (CET1 % del grupo x RWA de la cartera PYME). El RoTE publicado divide
     por el patrimonio neto TANGIBLE contable, que es mayor que el CET1
     (incluye AT1 no computable, reservas no elegibles, minoritarios...).
     A igualdad de beneficio, dividir por CET1 da un ratio MAS ALTO.
  3. COBERTURA DE LA CUENTA. El modelo recoge margen, comisiones, gastos
     y coste del riesgo de la cartera. El resultado de grupo incluye
     ademas ROF, dividendos, resultados por puesta en equivalencia,
     saneamientos extraordinarios y el gravamen a la banca.

Fuente unica y reproducible: EU-wide Transparency Exercise del EBA,
`tr_oth.csv`, periodo 202506. NO se usan cifras de las presentaciones de
resultados de los bancos: esas paginas devuelven 403 desde este entorno y
no se han podido verificar (ver notas.md).

    2520336  Resultado del ejercicio atribuido a la dominante
    2520102  CET1 (importe)
    2520110  (-) Activos intangibles, incluido fondo de comercio
    2521216  Patrimonio neto total
    2520138  RWA totales

Uso:
    python3 scripts/reconciliacion_rote.py
"""
import collections
import csv
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402
from eba_te_bancos_es import BANCOS, DOMESTICO, OTH, URL  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "comparables_bancos", "reconciliacion_rote.csv")
PERIODO = "202506"
HOY = "2026-09-21"

ITEMS = {"2520336": "beneficio_atribuido", "2520102": "cet1",
         "2520110": "intangibles", "2521216": "patrimonio_total",
         "2520138": "rwa_total"}


def main():
    dat = collections.defaultdict(dict)
    trimestres = {}
    with open(OTH, newline="", encoding="utf-8") as fh:
        for d in csv.DictReader(fh):
            if d["LEI_Code"] not in BANCOS or d["Period"] != PERIODO:
                continue
            if d["Item"] not in ITEMS:
                continue
            b = BANCOS[d["LEI_Code"]]
            dat[b][ITEMS[d["Item"]]] = float(d["Amount"])
            if d["Item"] == "2520336":
                trimestres[b] = int(d["n_quarters"])

    # ROE PYME modelizado, de la presentacion (scripts/modelo_roe_bancos_es.py)
    pres = json.load(open(os.path.join(ROOT, "pres", "datos.json"),
                         encoding="utf-8"))["bancos"]
    roe_pyme = dict(zip(pres["nombres"], pres["roe"]))
    cet1_pct = dict(zip(pres["nombres"], pres["cet1"]))
    rwa_pyme = {n: e * de / 100.0 for n, e, de
                in zip(pres["nombres"], pres["exposicion"], pres["densidad"])}

    fh, w = schema.writer(OUT) if not os.path.exists(OUT) else (None, None)
    if fh is None:
        os.remove(OUT)
        fh, w = schema.writer(OUT)

    filas = []
    for b in pres["nombres"]:
        x = dat[b]
        nq = trimestres.get(b, 2)
        anual = x["beneficio_atribuido"] * 4.0 / nq
        tang = x["patrimonio_total"] - abs(x["intangibles"])
        rec = {
            "banco": b,
            "roe_pyme_modelo": roe_pyme[b],
            "roe_grupo_cet1": 100.0 * anual / x["cet1"],
            "rote_grupo": 100.0 * anual / tang,
            "roe_grupo_patrimonio": 100.0 * anual / x["patrimonio_total"],
            "beneficio_anualizado": anual,
            "cet1": x["cet1"],
            "patrimonio_tangible": tang,
            "rwa_pyme_es": rwa_pyme[b],
            "peso_rwa_pyme": 100.0 * rwa_pyme[b] / x["rwa_total"],
            "capital_pyme": cet1_pct[b] / 100.0 * rwa_pyme[b],
        }
        rec["cuna_denominador"] = rec["roe_grupo_cet1"] - rec["rote_grupo"]
        rec["brecha_pyme_grupo"] = rec["roe_pyme_modelo"] - rec["roe_grupo_cet1"]
        filas.append(rec)

        base = dict(pais="Espana", producto="pyme_total",
                    periodo_referencia="2025-06",
                    fuente="EBA, EU-wide Transparency Exercise 2025 (tr_oth.csv), "
                           "y modelo propio de ROE PYME",
                    url=URL, fecha_publicacion=HOY,
                    criterio_segmentacion="entidad", ponderacion="dato_unico")
        alcance = ("negocio practicamente domestico"
                   if b in DOMESTICO else
                   "GRUPO CONSOLIDADO dominado por negocios fuera de Espana; "
                   "no comparable con el ROE de la cartera PYME espanola")
        for met, val, uni, td, nota in [
            ("ROE de la cartera PYME Espana (modelo propio)",
             rec["roe_pyme_modelo"], "pct_roe", "ratio",
             "sobre capital regulatorio asignado = CET1 %% de grupo x RWA PYME Espana"),
            ("ROE de grupo sobre CET1", rec["roe_grupo_cet1"], "pct_roe", "ratio",
             "beneficio atribuido anualizado (x4/%d trimestres) / CET1. %s" % (nq, alcance)),
            ("RoTE de grupo (patrimonio neto tangible)", rec["rote_grupo"],
             "pct_roe", "ratio",
             "beneficio atribuido anualizado / (patrimonio total - intangibles). "
             "Calculo propio sobre el EBA, NO es la cifra titulada por el banco. %s" % alcance),
            ("Cuna por denominador (CET1 frente a tangible)",
             rec["cuna_denominador"], "pct_roe", "ratio",
             "cuanto sube el ratio solo por dividir por CET1 en vez de por "
             "patrimonio tangible, a igual beneficio"),
            ("Peso de la RWA PYME Espana sobre la RWA del grupo",
             rec["peso_rwa_pyme"], "pct_rwa", "ratio",
             "cuanto del grupo representa el segmento que modelizamos"),
        ]:
            w.writerow(schema.row(metrica="%s | %s" % (b, met),
                                  valor="%.2f" % val, unidad=uni,
                                  tipo_de_dato=td, notas=nota, **base))
    fh.close()

    print("Periodo %s. Importes en M EUR.\n" % PERIODO)
    print("%-11s %9s %9s %9s %9s %9s %8s" % (
        "banco", "ROE PYME", "ROEgrCET1", "RoTE gr.", "cuna den.", "brecha", "%RWA gr."))
    for r in filas:
        print("%-11s %8.1f%% %8.1f%% %8.1f%% %8.1f pp %+8.1f pp %7.1f%%" % (
            r["banco"], r["roe_pyme_modelo"], r["roe_grupo_cet1"],
            r["rote_grupo"], r["cuna_denominador"], r["brecha_pyme_grupo"],
            r["peso_rwa_pyme"]))
    print("\n-> %s" % OUT)
    json.dump(filas, open(os.path.join(
        ROOT, "comparables_bancos", "reconciliacion_rote.json"), "w"), indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
