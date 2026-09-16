#!/usr/bin/env python3
"""Extrae el Boletin Estadistico del Banco de Espana (capitulo 19, tipos de
interes) y calcula la cuna de comisiones implicita.

Aporta dos cosas que el MIR del BCE no da para Espana:

  1. Volumen de nueva produccion por tramo Y por plazo de vencimiento. El
     MIR solo publica volumen para "fijacion inicial total".
  2. **TAE por tramo para sociedades no financieras** (cuadro 19.6). El MIR
     solo publica TAE para hogares. TAE menos TEDR es la comision implicita,
     y es la unica medida publica de comisiones por producto que se ha
     encontrado en todo el encargo.

Cuadros usados:
    19.5  TEDR nuevas operaciones, SNF, por tramo y plazo
    19.6  TAE nuevas operaciones, SNF, por tramo
    19.13 Importes de nuevas operaciones, SNF, por tramo y plazo

Uso:
    python3 scripts/bde_boletin.py --anio 2026
"""
import argparse
import collections
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRUDO = os.path.join(ROOT, "raw", "bde")
URL = "https://www.bde.es/webbe/es/estadisticas/otras-clasificaciones/publicaciones/boletin-estadistico/capitulo-19.html"
MES = {"ENE": "01", "FEB": "02", "MAR": "03", "ABR": "04", "MAY": "05",
       "JUN": "06", "JUL": "07", "AGO": "08", "SEP": "09", "OCT": "10",
       "NOV": "11", "DIC": "12"}

# alias -> (tramo, plazo, carpeta)
TRAMOS = {
    "3": ("Hasta 0,25 M EUR", "Total", "prestamos_personales"),
    "4": ("Hasta 0,25 M EUR", "Hasta 1 ano", "prestamos_personales"),
    "5": ("Hasta 0,25 M EUR", "Mas de 1 y hasta 5 anos", "prestamos_personales"),
    "6": ("Hasta 0,25 M EUR", "Mas de 5 anos", "prestamos_personales"),
    "7": ("Mas de 0,25 y hasta 1 M EUR", "Total", "prestamos_personales"),
    "8": ("Mas de 0,25 y hasta 1 M EUR", "Hasta 1 ano", "prestamos_personales"),
    "9": ("Mas de 0,25 y hasta 1 M EUR", "Mas de 1 y hasta 5 anos", "prestamos_personales"),
    "10": ("Mas de 0,25 y hasta 1 M EUR", "Mas de 5 anos", "prestamos_personales"),
    "11": ("Mas de 1 M EUR", "Total", "prestamos_personales"),
    "12": ("Mas de 1 M EUR", "Hasta 1 ano", "prestamos_personales"),
    "13": ("Mas de 1 M EUR", "Mas de 1 y hasta 5 anos", "prestamos_personales"),
    "14": ("Mas de 1 M EUR", "Mas de 5 anos", "prestamos_personales"),
}
# cuadro 19.6: alias -> tramo
TAE = {"4": "Hasta 0,25 M EUR", "5": "Mas de 0,25 y hasta 1 M EUR",
       "6": "Mas de 1 M EUR"}


def carga(n):
    """Lee un CSV del Boletin: series en columnas, periodos en filas."""
    ruta = os.path.join(CRUDO, "be%s.csv" % n)
    if not os.path.exists(ruta):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % ruta)
    rows = list(csv.reader(open(ruta, encoding="latin-1")))
    alias = rows[2]
    out = collections.defaultdict(dict)
    for r in rows[6:]:
        if not r or not r[0].strip():
            continue
        p = r[0].strip().strip('"').split()
        if len(p) != 2 or p[0] not in MES:
            continue
        per = "%s-%s" % (p[1], MES[p[0]])
        for i in range(1, len(alias)):
            v = r[i].strip().strip('"')
            if v and v != "_":
                try:
                    out[alias[i]][per] = float(v)
                except ValueError:
                    pass
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anio", default="2026")
    a = ap.parse_args()
    t5, t6, v13 = carga("1905"), carga("1906"), carga("1913")
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0

    def base(**kw):
        d = dict(pais="Espana", producto="prestamo_empresas_por_tramo",
                 fuente="Banco de Espana, Boletin Estadistico, capitulo 19",
                 url=URL, fecha_publicacion=hoy,
                 criterio_segmentacion="tamano_prestamo",
                 ponderacion="media_ponderada_volumen")
        d.update(kw)
        return d

    path = os.path.join(ROOT, "prestamos_personales", "bde_boletin.csv")
    if os.path.exists(path):
        os.remove(path)
    fh, w = schema.writer(path)

    # --- TEDR y volumen por tramo y plazo (cuadros 19.5 y 19.13) ---
    for suf, (tramo, plazo, _) in TRAMOS.items():
        for per, val in sorted(t5.get("BE_19_5.%s" % suf, {}).items()):
            if not per.startswith(a.anio):
                continue
            w.writerow(schema.row(**base(
                metrica="TEDR (tipo sin comisiones)", valor="%.4f" % val,
                unidad="pct_anual", periodo_referencia=per,
                tramo_importe=tramo, plazo_fijacion=plazo,
                tipo_de_dato="nivel",
                notas="cuadro 19.5, serie BE_19_5.%s; plazo = VENCIMIENTO, "
                      "no fijacion del tipo" % suf))); n += 1
        for per, val in sorted(v13.get("BE_19_13.%s" % suf, {}).items()):
            if not per.startswith(a.anio):
                continue
            w.writerow(schema.row(**base(
                metrica="Volumen de nuevas operaciones", valor="%.0f" % val,
                unidad="eur_millones", periodo_referencia=per,
                tramo_importe=tramo, plazo_fijacion=plazo,
                tipo_de_dato="volumen", ponderacion="dato_unico",
                notas="cuadro 19.13, serie BE_19_13.%s" % suf))); n += 1

    # --- TAE y cuna de comisiones (cuadro 19.6 frente a 19.5) ---
    TED = {"4": "3", "5": "7", "6": "11"}
    for suf, tramo in TAE.items():
        for per, val in sorted(t6.get("BE_19_6.%s" % suf, {}).items()):
            if not per.startswith(a.anio):
                continue
            w.writerow(schema.row(**base(
                metrica="TAE (tipo con comisiones)", valor="%.4f" % val,
                unidad="pct_anual", periodo_referencia=per,
                tramo_importe=tramo, plazo_fijacion="Total",
                tipo_de_dato="nivel",
                notas="cuadro 19.6, serie BE_19_6.%s" % suf))); n += 1
            ted = t5.get("BE_19_5.%s" % TED[suf], {}).get(per)
            if ted is not None:
                w.writerow(schema.row(**base(
                    metrica="Cuna de comisiones implicita (TAE menos TEDR)",
                    valor="%.0f" % ((val - ted) * 100), unidad="pb",
                    periodo_referencia=per, tramo_importe=tramo,
                    plazo_fijacion="Total", tipo_de_dato="ratio",
                    notas="calculo propio: BE_19_6.%s menos BE_19_5.%s. Unica "
                          "medida publica de comisiones por producto hallada "
                          "en el encargo" % (suf, TED[suf])))); n += 1
    fh.close()
    print("%d filas -> %s" % (n, path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
