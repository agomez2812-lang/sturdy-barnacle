# -*- coding: utf-8 -*-
"""Capacidad de pago de la PYME espanola: Central de Balances.

El deck mira el credito desde el lado del banco. Esto lo mira desde el lado
del cliente: que rentabilidad saca una PYME de su activo y que tipo paga de
verdad por su deuda. La diferencia entre las dos (ratio R.4 de la propia
Central de Balances) dice si endeudarse le crea o le destruye valor, y por
tanto donde esta el techo de precio del banco.

Fuente: Banco de Espana, Central de Balances Integrada (CBI), conjunto de
datos `cal_ucb_cbl002`. Ratios por TAMANO de empresa, con la clasificacion
de la Recomendacion 2003/361/CE:

    R.1  Rentabilidad ordinaria del activo neto
    R.2  Intereses por financiacion recibida sobre recursos ajenos con coste
    R.3  Rentabilidad ordinaria de los recursos propios
    R.4  Diferencia rentabilidad - coste financiero (R.1 - R.2)
    R.5  Margen de explotacion (REB / INCN)

R.2 es especialmente util: es el tipo EFECTIVAMENTE PAGADO sobre el saldo
de deuda con coste, asi que sirve de contraste independiente del precio de
nueva produccion del MIR. No son lo mismo y no deben confundirse: el MIR es
flujo nuevo, R.2 es el coste medio del stock vivo, que incorpora operaciones
antiguas y se mueve mas despacio.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import csv
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRUDO = os.path.join(ROOT, "raw", "cb", "cbl002.csv")
OUT = os.path.join(ROOT, "transversal", "cb_pymes.csv")
URL = "https://datos.bde.es/datos/es/datasets/000/016.html"
HOY = "2026-09-18"
MES = {"ENE": "01", "FEB": "02", "MAR": "03", "ABR": "04", "MAY": "05",
       "JUN": "06", "JUL": "07", "AGO": "08", "SEP": "09", "OCT": "10",
       "NOV": "11", "DIC": "12"}

RATIOS = {
    "R.1": ("Rentabilidad ordinaria del activo neto", "pct_activos"),
    "R.2": ("Tipo efectivo pagado por la deuda con coste", "pct_anual"),
    "R.3": ("Rentabilidad ordinaria de los recursos propios", "pct_roe"),
    "R.4": ("Diferencia entre rentabilidad y coste financiero", "pct_activos"),
    "R.5": ("Margen de explotacion", "pct_ingresos"),
}
TAMANOS = {"Empresas pequeñas": "Pequenas", "Empresas medianas": "Medianas",
           "Empresas grandes": "Grandes", "Total": "Total"}


def main():
    if not os.path.exists(CRUDO):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % CRUDO)
    rows = list(csv.reader(open(CRUDO, encoding="latin-1")))
    desc = rows[3]
    alias = rows[2]

    # columnas que interesan: ratio, tamano; solo "Ano actual", que es el
    # dato del ejercicio, no el del anterior repetido
    cols = {}
    for i, d in enumerate(desc):
        m = re.search(r"(R\.[12345])\s", d or "")
        if not m or "Año actual" not in d:
            continue
        tam = None
        for etiqueta, nombre in TAMANOS.items():
            if etiqueta == "Total":
                if re.search(r"\. Total\. ", d):
                    tam = nombre
            elif etiqueta in d:
                tam = nombre
        if tam:
            cols[i] = (m.group(1), tam)

    datos = {}
    for r in rows[8:]:
        if not r or not r[0].strip():
            continue
        p = r[0].strip().split()
        if len(p) != 2 or p[0] not in MES:
            continue
        anio = p[1]
        for i, (ratio, tam) in cols.items():
            if i >= len(r):
                continue
            v = (r[i] or "").strip().replace(",", ".")
            if not v or v == "_":
                continue
            try:
                datos.setdefault((ratio, tam), {})[anio] = float(v)
            except ValueError:
                pass

    if not datos:
        sys.exit("no se ha extraido ninguna serie: revisa el fichero")

    anios = sorted({a for d in datos.values() for a in d})
    ultimo = anios[-1]
    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)
    n = 0
    print("Central de Balances Integrada, ratios por tamano. Ultimo: %s\n"
          % ultimo)
    print("%-52s %10s %10s %10s %10s"
          % ("ratio", "Pequenas", "Medianas", "Grandes", "Total"))
    for ratio in ("R.1", "R.2", "R.4", "R.3", "R.5"):
        nombre, unidad = RATIOS[ratio]
        fila = []
        for tam in ("Pequenas", "Medianas", "Grandes", "Total"):
            v = datos.get((ratio, tam), {}).get(ultimo)
            fila.append("%10.2f" % v if v is not None else "%10s" % "n/d")
        print("%-52s %s" % ("%s %s" % (ratio, nombre[:46]), "".join(fila)))
        for tam in ("Pequenas", "Medianas", "Grandes", "Total"):
            for anio, v in sorted(datos.get((ratio, tam), {}).items()):
                w.writerow(schema.row(
                    pais="Espana", producto="empresas_cb",
                    metrica="%s | %s" % (nombre, tam), valor="%.4f" % v,
                    unidad=unidad, periodo_referencia=anio,
                    fuente="Banco de Espana, Central de Balances Integrada",
                    url=URL, fecha_publicacion=HOY,
                    criterio_segmentacion="definicion_ue_2003_361",
                    tipo_de_dato="ratio", ponderacion="media_ponderada_volumen",
                    notas="ratio %s de la CBI; tamano segun la Recomendacion "
                          "2003/361/CE. %s" % (ratio,
                          "Es el tipo medio del SALDO VIVO de deuda con "
                          "coste, no el de nueva produccion del MIR: "
                          "incorpora operaciones antiguas y se mueve mas "
                          "despacio" if ratio == "R.2" else
                          "R.4 positiva significa que endeudarse crea valor "
                          "para la empresa" if ratio == "R.4" else
                          "dato del ejercicio, no del anterior")))
                n += 1
    fh.close()
    print()
    print("%d filas -> %s" % (n, OUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
