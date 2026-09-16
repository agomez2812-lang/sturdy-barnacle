#!/usr/bin/env python3
"""Extrae el EBA Risk Dashboard (anexo de datos) hacia /transversal e
/hipotecas.

Cubre las tres magnitudes transversales del encargo (coste de riesgo,
calidad de activo y eficiencia) mas los desgloses de cartera PYME y de
inmueble comercial, que el anexo publica como "...of which SMEs" y
"...of which CRE".

Los ratios del anexo vienen en tanto por uno y se convierten a porcentaje.
Los saldos vienen en euros y se convierten a millones.

Uso:
    python3 scripts/eba_dashboard.py --xlsx raw/eba/dashboard_q1_2026.xlsx \
        --periodo 202603
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "risk-monitoring/risk-dashboard")
PAISES = {"ES", "DE", "FR", "IT", "PT", "NL", "IE", "EU"}

# Indicadores de la hoja "KRIs by country and EU" -> (etiqueta, unidad, tipo)
KRIS = {
    "AQT_3.2":  ("Ratio de NPL (prestamos y anticipos)", "pct_cartera", "ratio"),
    "AQT_3.1":  ("Ratio de NPE (instrumentos de deuda)", "pct_cartera", "ratio"),
    "AQT_41.2": ("Ratio de cobertura de NPL", "pct_cartera", "ratio"),
    "AQT_42.2": ("Ratio de refinanciaciones (forbearance)", "pct_cartera", "ratio"),
    "PFT_43":   ("Coste del riesgo", "pct_cartera", "ratio"),
    "PFT_23":   ("Ratio de eficiencia (cost-to-income)", "pct_ingresos", "ratio"),
    "PFT_21":   ("ROE", "pct_roe", "ratio"),
    "PFT_41":   ("Margen de intereses (NIM)", "pct_activos", "ratio"),
    "PFT_25":   ("Margen de intereses sobre ingresos operativos", "pct_ingresos", "ratio"),
    "PFT_26":   ("Comisiones netas sobre ingresos operativos", "pct_ingresos", "ratio"),
    "SVC_3":    ("Ratio CET1", "pct_rwa", "ratio"),
    "SVC_13":   ("Ratio de apalancamiento", "pct_activos", "ratio"),
}

# Hojas Loans_*: (hoja, prefijo de lbl, etiqueta, unidad, tipo, escala)
LOANS = [
    ("Loans_1", "T20", "Saldo bruto", "eur_millones", "importe", 1e-6),
    ("Loans_2", "T21", "Importe de NPL", "eur_millones", "importe", 1e-6),
    ("Loans_4", "T22", "Ratio de NPL", "pct_cartera", "ratio", 100),
    ("Loans_3", "T23", "Ratio de cobertura", "pct_cartera", "ratio", 100),
]
# Sufijo del lbl -> (segmento, carpeta de destino)
SEG = {
    "1": ("Total prestamos y anticipos", "transversal"),
    "2": ("Hogares", "transversal"),
    "3": ("Hogares, hipotecario", "transversal"),
    "4": ("Sociedades no financieras", "transversal"),
    "5": ("Sociedades no financieras, PYME", "transversal"),
    "6": ("Sociedades no financieras, inmueble comercial (CRE)", "hipotecas"),
}


def per_txt(p):
    p = str(p)
    return "%s-Q%d" % (p[:4], int(p[4:6]) // 3) if len(p) == 6 else p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", default=os.path.join(ROOT, "raw", "eba",
                                                   "dashboard_q1_2026.xlsx"))
    ap.add_argument("--periodo", default="", help="AAAAMM; vacio = todos")
    ap.add_argument("--desde", default="202401", help="periodo minimo")
    a = ap.parse_args()

    import openpyxl
    wb = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)
    hoy = __import__("time").strftime("%Y-%m-%d")
    salidas, n = {}, 0

    def esc(carpeta, fichero):
        k = (carpeta, fichero)
        if k not in salidas:
            path = os.path.join(ROOT, carpeta, fichero)
            if os.path.exists(path):
                os.remove(path)
            salidas[k] = schema.writer(path)
        return salidas[k][1]

    def ok(p):
        p = str(p)
        return (not a.periodo or p == a.periodo) and p >= a.desde

    # --- indicadores por pais ---
    for r in wb["KRIs by country and EU"].iter_rows(min_row=2, values_only=True):
        per, pais, cod, _, val = r[0], r[1], r[2], r[3], r[4]
        if cod not in KRIS or pais not in PAISES or val is None or not ok(per):
            continue
        et, un, td = KRIS[cod]
        esc("transversal", "eba_indicadores.csv").writerow(schema.row(
            pais=schema.COUNTRIES.get(pais, "Union Europea" if pais == "EU" else pais),
            producto="agregado_sector_bancario", metrica=et,
            valor="%.4f" % (val * 100), unidad=un,
            periodo_referencia=per_txt(per),
            fuente="EBA, Risk Dashboard (anexo de datos)", url=URL,
            fecha_publicacion=hoy, criterio_segmentacion="n/a",
            tipo_de_dato=td, ponderacion="media_ponderada_volumen",
            notas="indicador %s; muestra de bancos del EBA, consolidado de "
                  "grupo, no de segmento" % cod)); n += 1

    # --- desgloses de cartera, incluidos PYME y CRE ---
    for hoja, pref, et, un, td, escala in LOANS:
        for r in wb[hoja].iter_rows(min_row=2, values_only=True):
            lbl, per, pais, _, val = r[0], r[1], r[2], r[3], r[4]
            if not lbl or pais not in PAISES or val is None or not ok(per):
                continue
            suf = str(lbl).split("_")[-1]
            if str(lbl).split("_")[0] != pref or suf not in SEG:
                continue
            seg, carpeta = SEG[suf]
            esc(carpeta, "eba_cartera.csv").writerow(schema.row(
                pais=schema.COUNTRIES.get(pais, "Union Europea" if pais == "EU" else pais),
                producto=("inmueble_comercial_garantia_hipotecaria"
                          if suf == "6" else "cartera_credito"),
                metrica="%s | %s" % (et, seg),
                valor="%.4f" % (val * escala), unidad=un,
                periodo_referencia=per_txt(per),
                fuente="EBA, Risk Dashboard (anexo de datos)", url=URL,
                fecha_publicacion=hoy,
                criterio_segmentacion=("tamano_empresa_empleados"
                                       if suf == "5" else "n/a"),
                tipo_de_dato=td, ponderacion="media_ponderada_volumen",
                notas="hoja %s, %s; muestra de bancos del EBA" % (hoja, lbl)))
            n += 1

    # --- exposicion a actividades inmobiliarias y construccion ---
    ws = wb["Exposures to Real Estate activ"]
    CAMPOS = [(2, "Saldo bruto | Actividades inmobiliarias (NACE L)", "eur_miles_millones", "importe", 1),
              (5, "Ratio de NPL | Actividades inmobiliarias (NACE L)", "pct_cartera", "ratio", 100),
              (6, "Saldo bruto | Construccion (NACE F)", "eur_miles_millones", "importe", 1),
              (9, "Ratio de NPL | Construccion (NACE F)", "pct_cartera", "ratio", 100)]
    for r in ws.iter_rows(min_row=2, values_only=True):
        pais, per = r[0], r[1]
        if pais not in PAISES or not ok(per):
            continue
        for idx, et, un, td, escala in CAMPOS:
            if idx >= len(r) or r[idx] is None:
                continue
            esc("hipotecas", "eba_cartera.csv").writerow(schema.row(
                pais=schema.COUNTRIES.get(pais, "Union Europea" if pais == "EU" else pais),
                producto="inmueble_comercial_garantia_hipotecaria", metrica=et,
                valor="%.4f" % (r[idx] * escala), unidad=un,
                periodo_referencia=per_txt(per),
                fuente="EBA, Risk Dashboard (anexo de datos)", url=URL,
                fecha_publicacion=hoy, criterio_segmentacion="n/a",
                tipo_de_dato=td, ponderacion="media_ponderada_volumen",
                notas="por pais de la contraparte; muestra de bancos del EBA"))
            n += 1

    wb.close()
    for (c, f), (fh, _) in salidas.items():
        fh.close(); print("-> %s/%s" % (c, f))
    print("Total: %d observaciones" % n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
