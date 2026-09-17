# -*- coding: utf-8 -*-
"""Cartera PYME en Espana de los cinco grandes bancos espanoles.

Del EU-wide Transparency Exercise del EBA, que publica por ENTIDAD y con
desglose por PAIS DE LA CONTRAPARTE. Eso permite aislar la cartera PYME
espanola de cada banco, que es lo que aqui interesa: el agregado de grupo
de Santander y BBVA esta dominado por Mexico, Brasil, Reino Unido y Turquia
y no dice nada del negocio PYME en Espana.

De `tr_cre.csv`, con Country = 28 (Espana):
    2520503  Original Exposure - SME
    2520513  Original Exposure - SME, del cual en default
    2520523  Exposure value - SME
    2520533  Risk exposure amount - SME

De `tr_oth.csv`, a nivel de GRUPO (no hay desglose por pais):
    2520102  CET1, importe. Se usa el importe y no el ratio porque el
             ratio (2520146, fully loaded) solo esta informado en los
             cierres de diciembre; el fully loaded en importe (2520143)
             tampoco se informa en los periodos intermedios
    2520138  RWA totales
    2520316  Total operating income, net
    2520317  Administrative expenses
    2520324  Deterioro de activos financieros

El CET1 y la eficiencia son, por tanto, de grupo consolidado. Para
CaixaBank, Sabadell y Bankinter eso es casi domestico; para Santander y
BBVA no lo es, y hay que decirlo en cada fila.

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
CRE = os.path.join(ROOT, "raw", "eba_te", "tr_cre.csv")
OTH = os.path.join(ROOT, "raw", "eba_te", "tr_oth.csv")
OUT = os.path.join(ROOT, "comparables_bancos", "eba_te_bancos_es.csv")
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "eu-wide-transparency-exercise")
HOY = "2026-09-17"
ES = "28"          # codigo de pais de la contraparte, Espana

BANCOS = {
    "K8MS7FD7N5Z2WQ51AZ71": "BBVA",
    "5493006QMFDDMYWIAM13": "Santander",
    "SI5RG2M0WQQLZCXKRM20": "Sabadell",
    "VWMYAEQSTOPNV0SUGU82": "Bankinter",
    "7CUNS533WID6K7DGFI87": "CaixaBank",
}
# los tres primeros son practicamente domesticos; los dos grandes no
DOMESTICO = {"CaixaBank", "Sabadell", "Bankinter"}

CRE_ITEMS = {"2520503": "exp_original", "2520513": "exp_default",
             "2520523": "exp_valor", "2520533": "rwa"}
OTH_ITEMS = {"2520102": "cet1_importe", "2520316": "ingresos",
             "2520317": "gastos_admin", "2520324": "deterioro",
             "2520138": "rwa_total"}
# Los importes del fichero vienen en MILLONES de euros; no se reescalan.
# Las partidas de la cuenta de resultados son acumuladas del ejercicio
# (columna n_quarters), asi que el ratio de eficiencia es homogeneo aunque
# el periodo sea un semestre.


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--periodo", default="202506")
    a = ap.parse_args()
    for f in (CRE, OTH):
        if not os.path.exists(f):
            sys.exit("falta %s; descargalo primero (ver fuentes.md)" % f)

    cre = collections.defaultdict(lambda: collections.defaultdict(float))
    with open(CRE, encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh):
            if (d["LEI_Code"] not in BANCOS or d["Period"] != a.periodo
                    or d["Country"] != ES or d["Item"] not in CRE_ITEMS):
                continue
            try:
                cre[BANCOS[d["LEI_Code"]]][CRE_ITEMS[d["Item"]]] += \
                    float(d["Amount"])
            except (TypeError, ValueError):
                continue

    oth = collections.defaultdict(lambda: collections.defaultdict(float))
    with open(OTH, encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh):
            if (d["LEI_Code"] not in BANCOS or d["Period"] != a.periodo
                    or d["Item"] not in OTH_ITEMS):
                continue
            try:
                oth[BANCOS[d["LEI_Code"]]][OTH_ITEMS[d["Item"]]] += \
                    float(d["Amount"])
            except (TypeError, ValueError):
                continue

    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)
    n = 0
    per = "%s-%s" % (a.periodo[:4], a.periodo[4:])
    print("Cartera PYME en Espana, %s\n" % per)
    print("%-11s %13s %13s %10s %10s %9s %9s"
          % ("banco", "exposicion", "RWA", "densidad", "default", "CET1",
             "eficiencia"))
    for banco in sorted(BANCOS.values()):
        c, o = cre[banco], oth[banco]
        if not c.get("exp_valor") or not c.get("rwa"):
            print("  %-11s sin cartera PYME en Espana" % banco)
            continue
        dens = 100 * c["rwa"] / c["exp_valor"]
        defa = (100 * c["exp_default"] / c["exp_original"]
                if c.get("exp_original") else float("nan"))
        cet1 = (100 * o["cet1_importe"] / o["rwa_total"]
                if o.get("rwa_total") else float("nan"))
        efi = (100 * abs(o["gastos_admin"]) / o["ingresos"]
               if o.get("ingresos") else float("nan"))
        print("%-11s %13.0f %13.0f %9.1f%% %9.2f%% %8.2f%% %8.1f%%"
              % (banco, c["exp_valor"], c["rwa"], dens, defa, cet1, efi))
        alcance = ("grupo consolidado; para este banco el grupo es "
                   "practicamente el negocio domestico"
                   if banco in DOMESTICO else
                   "GRUPO CONSOLIDADO, no Espana: incluye el negocio "
                   "internacional, que en este banco es mayoritario")
        base = dict(pais="Espana", producto="banco_pyme",
                    periodo_referencia=per,
                    fuente="EBA, EU-wide Transparency Exercise", url=URL,
                    fecha_publicacion=HOY, criterio_segmentacion="entidad",
                    ponderacion="dato_unico")
        filas = [
            ("Exposicion PYME en Espana | %s" % banco, c["exp_valor"],
             "eur_millones", "importe",
             "valor de exposicion, partida 2520523, contraparte con "
             "Country = 28 (Espana). Solo cartera espanola del grupo"),
            ("Activos ponderados por riesgo, PYME en Espana | %s" % banco,
             c["rwa"], "eur_millones", "importe",
             "partida 2520533, contraparte espanola"),
            ("Densidad de RWA de la cartera PYME en Espana | %s" % banco,
             dens, "pct_rwa", "ratio",
             "OBSERVADO. RWA sobre valor de exposicion de la cartera PYME "
             "espanola; incorpora ya el factor de apoyo a PYME del art. 501 "
             "CRR"),
            ("Ratio CET1 | %s" % banco, cet1, "pct_rwa",
             "ratio", "CET1 (2520102, con ajustes transitorios) sobre RWA "
             "totales (2520138); " + alcance),
            ("Ratio de eficiencia (cost-to-income) | %s" % banco, efi,
             "pct_ingresos", "ratio",
             "gastos de administracion sobre margen bruto, partidas 2520317 "
             "y 2520316; " + alcance),
        ]
        if defa == defa:
            filas.append(
                ("Tasa de exposicion PYME en default en Espana | %s" % banco,
                 defa, "pct_cartera", "ratio",
                 "exposicion original en default sobre exposicion original "
                 "de PYME, contraparte espanola. Es un ratio de STOCK, no "
                 "una PD de flujo"))
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
