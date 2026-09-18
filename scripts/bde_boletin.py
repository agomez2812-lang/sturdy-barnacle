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
import time

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
    t4, v12 = carga("1904"), carga("1912")   # hogares y autonomos
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

    # --- circulante de empresa: el unico volumen por pais que existe ---
    # El MIR publica el tipo de revolving y descubiertos (A2Z1) de los siete
    # paises, pero el volumen solo del agregado de zona euro. Espana si lo
    # publica en su boletin nacional, cuadro 19.13 serie 1. Es el unico
    # ancla de volumen de circulante por pais del encargo.
    path2 = os.path.join(ROOT, "circulante", "bde_circulante.csv")
    if os.path.exists(path2):
        os.remove(path2)
    fh2, w2 = schema.writer(path2)
    n2 = 0
    for alias, metrica, unidad, td, pond, nota in [
            ("BE_19_5.1", "TEDR de descubiertos y lineas de credito",
             "pct_anual", "nivel", "media_ponderada_volumen",
             "cuadro 19.5, serie BE_19_5.1; sin comisiones. El boletin no "
             "publica TAE de este producto, asi que la comision de "
             "disponibilidad no es observable ni siquiera en Espana"),
            ("BE_19_13.1", "Saldo de descubiertos y lineas de credito",
             "eur_millones", "volumen", "dato_unico",
             "cuadro 19.13, serie BE_19_13.1. En revolving y descubiertos el "
             "MIR mide SALDO VIVO, no nueva produccion: no existe el "
             "concepto de nueva operacion")]:
        tabla = t5 if alias.startswith("BE_19_5") else v13
        for per, val in sorted(tabla.get(alias, {}).items()):
            if not per.startswith(a.anio):
                continue
            w2.writerow(schema.row(
                pais="Espana", producto="circulante", metrica=metrica,
                valor=("%.4f" if unidad == "pct_anual" else "%.0f") % val,
                unidad=unidad, periodo_referencia=per,
                fuente="Banco de Espana, Boletin Estadistico, capitulo 19",
                url=URL, fecha_publicacion=time.strftime("%Y-%m-%d"),
                criterio_segmentacion="n/a", tipo_de_dato=td,
                ponderacion=pond, notas=nota)); n2 += 1
    fh2.close()
    print("%d filas -> %s" % (n2, path2))

    # --- autonomos: el unico precio de financiacion empresarial que la
    # estadistica coloca en el sector HOGARES -------------------------------
    # En el SEC 2010 el empresario individual es sector S.14, hogares, no
    # sociedad no financiera. Todo el credito a autonomos queda por tanto
    # fuera de las series de SNF que usa el modelo. El Boletin si lo aisla:
    # cuadro 19.4 serie 16 (tipo) y cuadro 19.12 serie 16 (volumen).
    path3 = os.path.join(ROOT, "prestamos_personales", "bde_autonomos.csv")
    if os.path.exists(path3):
        os.remove(path3)
    fh3, w3 = schema.writer(path3)
    n3 = 0
    AUT = [
        ("BE_19_4.16", t4, "TEDR de credito a otros fines | Empresarios "
         "individuales", "pct_anual", "nivel", "media_ponderada_volumen",
         "cuadro 19.4, serie 16. Financiacion de fines empresariales a "
         "autonomos; el SEC 2010 los clasifica en HOGARES, no en sociedades "
         "no financieras, asi que no estan en las series de SNF del modelo"),
        ("BE_19_4.17", t4, "TEDR de credito a otros fines hasta 1 ano | "
         "Empresarios individuales", "pct_anual", "nivel", "media_simple",
         "cuadro 19.4, serie 17. El boletin no publica volumen de este "
         "desglose, asi que la media del anio es simple"),
        ("BE_19_4.12", t4, "TEDR de credito a otros fines | Hogares",
         "pct_anual", "nivel", "media_ponderada_volumen",
         "cuadro 19.4, serie 12. Incluye a los empresarios individuales y "
         "ademas otros fines no empresariales"),
        ("BE_19_6.3", t6, "TAE de credito a otros fines | Hogares",
         "pct_anual", "nivel", "media_simple",
         "cuadro 19.6, serie 3. Es de TODOS los hogares para otros fines, "
         "no solo de empresarios individuales: la cuna que se deriva de "
         "ella no es especifica de autonomos"),
    ]
    VOL = {"BE_19_4.16": ("BE_19_12.16", "Volumen de credito a otros fines | "
                          "Empresarios individuales"),
           "BE_19_4.12": ("BE_19_12.12", "Volumen de credito a otros fines | "
                          "Hogares")}
    for alias, tabla, metrica, unidad, td, pond, nota in AUT:
        for per, val in sorted(tabla.get(alias, {}).items()):
            if not per.startswith(a.anio):
                continue
            w3.writerow(schema.row(
                pais="Espana", producto="credito_autonomos", metrica=metrica,
                valor="%.4f" % val, unidad=unidad, periodo_referencia=per,
                fuente="Banco de Espana, Boletin Estadistico, capitulo 19",
                url=URL, fecha_publicacion=time.strftime("%Y-%m-%d"),
                criterio_segmentacion="sector_institucional",
                tipo_de_dato=td, ponderacion=pond, notas=nota)); n3 += 1
        if alias in VOL:
            va, vm = VOL[alias]
            for per, val in sorted(v12.get(va, {}).items()):
                if not per.startswith(a.anio):
                    continue
                w3.writerow(schema.row(
                    pais="Espana", producto="credito_autonomos", metrica=vm,
                    valor="%.0f" % val, unidad="eur_millones",
                    periodo_referencia=per,
                    fuente="Banco de Espana, Boletin Estadistico, capitulo 19",
                    url=URL, fecha_publicacion=time.strftime("%Y-%m-%d"),
                    criterio_segmentacion="sector_institucional",
                    tipo_de_dato="volumen", ponderacion="dato_unico",
                    notas="cuadro 19.12, serie %s" % va.split(".")[-1]))
                n3 += 1
    fh3.close()
    print("%d filas -> %s" % (n3, path3))
    return 0


if __name__ == "__main__":
    sys.exit(main())
