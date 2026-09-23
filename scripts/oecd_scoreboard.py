#!/usr/bin/env python3
"""Extrae el Scoreboard de la OCDE (Financing SMEs and Entrepreneurs).

Es la unica fuente del encargo que segmenta por TAMANO DE EMPRESA con una
definicion nacional de PYME, y la unica que publica directamente un spread
PYME frente a gran empresa. Dos limitaciones fuertes, ver notas.md 2.30:
el ultimo ano es 2022 y **Alemania no participa**.

Uso:
    python3 scripts/oecd_scoreboard.py
"""
import csv
import io
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLOW = "OECD.CFE.SMEE,DSD_SMEE_FINANCING@DF_SMEE_SCOREBOARD,1.0"
URL = "https://sdmx.oecd.org/public/rest/data/%s/all" % FLOW
PORTAL = "https://data-explorer.oecd.org/"
PAISES = {"ESP": "Espana", "DEU": "Alemania", "FRA": "Francia",
          "ITA": "Italia", "PRT": "Portugal", "NLD": "Paises Bajos", "IRL": "Irlanda"}
TAM = {"SME": "PYME", "LRG": "Gran empresa", "T": "Total"}

# medida -> (etiqueta, carpeta, unidad, tipo, factor)
MEDIDAS = {
    "INTEREST_RATE": ("Tipo de interes", "prestamos_personales", "pct_anual", "nivel", 1),
    "INTEREST_RATE_SPREAD": ("Spread PYME frente a gran empresa",
                             "prestamos_personales", "pb", "ratio", 100),
    "NPL": ("Ratio de NPL", "transversal", "pct_cartera", "ratio", 1),
    "FACTORING": ("Volumen de factoring", "factoring_confirming",
                  "eur_millones", "volumen", 1),
    "LOAN_GOV_GUARANTEED": ("Prestamos con aval publico", "transversal",
                            "eur_millones", "volumen", 1),
    "LOAN_REJECTION": ("Tasa de rechazo de solicitudes", "transversal",
                       "pct_cartera", "ratio", 1),
    "PAYMENT_DELAYS": ("Retrasos de pago", "transversal", "pct_cartera", "ratio", 1),
}


def main():
    req = urllib.request.Request(URL, headers={
        "Accept": "application/vnd.sdmx.data+csv; charset=utf-8",
        "User-Agent": "pyme-research/1.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        txt = r.read().decode("utf-8")
    filas = list(csv.DictReader(io.StringIO(txt)))
    hoy = __import__("time").strftime("%Y-%m-%d")

    salidas, n = {}, 0
    for x in filas:
        pais = x["REF_AREA"]
        med = x["MEASURE"]
        val = (x.get("OBS_VALUE") or "").strip()
        if pais not in PAISES or med not in MEDIDAS or not val:
            continue
        et, carpeta, unidad, td, factor = MEDIDAS[med]
        # UNIT_MULT indica potencias de 10 sobre el valor publicado.
        mult = 10 ** int(x.get("UNIT_MULT") or 0)
        try:
            v = float(val) * factor * (mult if unidad == "eur_millones" else 1)
        except ValueError:
            continue
        if unidad == "eur_millones":
            v = v / 1e6 if x.get("UNIT_MEASURE") == "EUR" else v
        tam = TAM.get(x.get("ENTR_SIZE", ""), x.get("ENTR_SIZE", ""))
        if carpeta not in salidas:
            path = os.path.join(ROOT, carpeta, "oecd_scoreboard.csv")
            if os.path.exists(path):
                os.remove(path)
            salidas[carpeta] = schema.writer(path)
        salidas[carpeta][1].writerow(schema.row(
            pais=PAISES[pais], producto="financiacion_pyme",
            metrica="%s | %s" % (et, tam), valor="%.4f" % v, unidad=unidad,
            periodo_referencia=x["TIME_PERIOD"],
            fuente="OCDE, Financing SMEs and Entrepreneurs (Scoreboard)",
            url=PORTAL, fecha_publicacion=hoy,
            criterio_segmentacion="definicion_nacional",
            tipo_de_dato=td, ponderacion="dato_unico",
            notas="medida %s; definicion nacional de PYME, no armonizada "
                  "entre paises; unidad original %s"
                  % (med, x.get("UNIT_MEASURE", "")))); n += 1
    for c, (fh, _) in salidas.items():
        fh.close(); print("-> %s/oecd_scoreboard.csv" % c)
    print("%d observaciones" % n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
