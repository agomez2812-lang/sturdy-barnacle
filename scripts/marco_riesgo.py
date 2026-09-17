# -*- coding: utf-8 -*-
"""Dos ejes institucionales del coste del riesgo PYME.

Hipotesis de trabajo (planteada por el usuario):

  * la **PD** depende de la INFORMACION disponible para seleccionar;
  * la **LGD** depende del ENTORNO DE RECOBRO: derechos del acreedor,
    garantias ejecutables y eficiencia del procedimiento concursal.

El script construye un indice por eje a partir de indicadores publicados,
lo contrasta con la PD y la LGD PYME observadas en los parametros IRB del
EBA, y escribe tanto los componentes como los compuestos y las
correlaciones.

Fuente institucional: Banco Mundial, Doing Business 2020 (dataset
historico completo, vintage mayo-2019). Es la ultima medicion comparable
de los siete paises: el programa se descontinuo en 2021 y su sucesor
B-READY solo cubre Portugal de los siete. Se etiqueta la anadidura en
cada fila.

Los componentes 3 y 4 del eje de informacion NO salen de Doing Business:
son ordinales construidos aqui sobre hechos documentados (umbral del
registro publico y regimen de deposito de cuentas). Se declaran como
`elaboracion_propia` en `fuente` y su escala va en `notas`.

IMPORTANTE: no canalizar la salida por `head`; un BrokenPipeError aborta
el script antes de escribir los bloques finales (ver notas.md 2.39).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema

RAW = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "raw", "db", "db2020.xlsx")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "transversal", "marco_riesgo.csv")

PAISES = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
          "Paises Bajos", "Irlanda"]
ISO = {"ESP": "Espana", "DEU": "Alemania", "FRA": "Francia", "ITA": "Italia",
       "PRT": "Portugal", "NLD": "Paises Bajos", "IRL": "Irlanda"}

FUENTE_DB = "Banco Mundial, Doing Business 2020 (dataset historico)"
URL_DB = ("https://archive.doingbusiness.org/content/dam/doingBusiness/"
          "excel/db2020/Historical-data---COMPLETE-dataset-with-scores.xlsx")
PERIODO_DB = "2019-05"
HOY = "2026-09-17"

# --- parametros IRB observados (EBA COREP C 9.02, 2026-Q1, mediana) ------
PD_OBS = dict(zip(PAISES, [1.73, 1.26, 2.15, 2.26, 1.26, 1.18, 1.08]))
LGD_OBS = dict(zip(PAISES, [34.38, 31.44, 31.51, 35.60, 40.00, 29.70, 37.34]))

# --- ordinales documentados del eje de informacion ----------------------
# 3. Utilidad del registro publico de credito para exposiciones PYME.
#    Se puntua el umbral de declaracion frente al tamano tipico de una
#    operacion PYME, no la existencia del registro.
REGISTRO = {
    "Portugal":     (3, "CRC del Banco de Portugal, umbral 50 EUR"),
    "Irlanda":      (3, "Central Credit Register, umbral 500 EUR y consulta "
                        "obligatoria por encima de 2.000 EUR"),
    "Espana":       (3, "CIRBE del Banco de Espana, umbral 1.000 EUR"),
    "Italia":       (2, "Centrale dei Rischi, umbral 30.000 EUR (250 EUR si "
                        "la exposicion esta deteriorada)"),
    "Francia":      (2, "FIBEN y cotacion del Banque de France: sin umbral "
                        "pero requiere adhesion I-FIBEN"),
    "Alemania":     (0, "Millionenkredite, umbral 1.000.000 EUR: no cubre "
                        "exposiciones PYME"),
    "Paises Bajos": (0, "no existe registro publico de credito a empresas"),
}
# 4. Disponibilidad real de cuentas anuales depositadas.
CUENTAS = {
    "Espana":       (3, "Registro Mercantil, deposito obligatorio y completo"),
    "Alemania":     (3, "Bundesanzeiger, deposito obligatorio"),
    "Italia":       (3, "Registro Imprese, deposito obligatorio"),
    "Portugal":     (3, "IES, deposito obligatorio"),
    "Irlanda":      (3, "Companies Registration Office, deposito obligatorio"),
    "Paises Bajos": (2, "KvK: las pequenas depositan cuentas abreviadas"),
    "Francia":      (0, "confidencialidad opcional: las microempresas pueden "
                        "declarar confidenciales todas las cuentas y las "
                        "pequenas la cuenta de resultados"),
}

# Composicion de cada eje: (clave, etiqueta, sentido)
# sentido = +1 si mas es mejor, -1 si mas es peor.
EJE_INFO = [
    ("depth", "Profundidad de la informacion crediticia (0-8)", +1),
    ("burcov", "Cobertura del bureau privado (% de adultos)", +1),
    ("registro", "Utilidad del registro publico para PYME (0-3)", +1),
    ("cuentas", "Disponibilidad de cuentas depositadas (0-3)", +1),
]
EJE_REC = [
    ("legal", "Fortaleza de los derechos legales del acreedor (0-12)", +1),
    ("recovery", "Tasa de recuperacion (centimos por dolar)", +1),
    ("coste", "Coste del procedimiento (% de la masa)", -1),
    ("tiempo", "Tiempo de resolucion (anos)", -1),
]


def leer_db():
    import openpyxl
    wb = openpyxl.load_workbook(RAW, read_only=True)
    it = wb["All Data"].iter_rows(min_row=3, values_only=True)
    next(it)
    next(it)
    d = {}
    for r in it:
        if r[0] in ISO and r[4] == 2020:
            d[ISO[r[0]]] = {
                "legal": float(r[87]), "depth": float(r[89]),
                "regcov": float(r[92]), "burcov": float(r[93]),
                "recovery": float(r[191]), "tiempo": float(r[189]),
                "coste": float(r[190]), "insolv": float(r[193]),
            }
    falta = [p for p in PAISES if p not in d]
    if falta:
        raise SystemExit("faltan paises en el dataset: %s" % falta)
    return d


def normaliza(vals, sentido):
    """Min-max a 0-100 sobre los siete paises. 100 = el mejor de los siete."""
    lo, hi = min(vals), max(vals)
    if hi == lo:
        return [50.0] * len(vals)
    z = [(v - lo) / (hi - lo) * 100 for v in vals]
    return z if sentido > 0 else [100 - x for x in z]


def rangos(v):
    import collections
    orden = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    for pos, i in enumerate(orden):
        r[i] = pos + 1
    g = collections.defaultdict(list)
    for i, x in enumerate(v):
        g[x].append(i)
    for _, ix in g.items():
        m = sum(r[i] for i in ix) / len(ix)
        for i in ix:
            r[i] = m
    return r


def pearson(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = sum((x - ma) ** 2 for x in a) ** .5
    db = sum((y - mb) ** 2 for y in b) ** .5
    return num / (da * db) if da and db else float("nan")


def spearman(a, b):
    return pearson(rangos(a), rangos(b))


def main():
    db = leer_db()
    for p in PAISES:
        db[p]["registro"] = float(REGISTRO[p][0])
        db[p]["cuentas"] = float(CUENTAS[p][0])

    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)

    def emite(**kw):
        w.writerow(schema.row(**kw))

    # 1. componentes en bruto
    meta = {
        "legal": ("indice", FUENTE_DB, URL_DB, PERIODO_DB, "escala 0-12"),
        "depth": ("indice", FUENTE_DB, URL_DB, PERIODO_DB, "escala 0-8"),
        "regcov": ("pct_adultos", FUENTE_DB, URL_DB, PERIODO_DB,
                   "cobertura del registro publico de credito"),
        "burcov": ("pct_adultos", FUENTE_DB, URL_DB, PERIODO_DB,
                   "cobertura del bureau privado"),
        "recovery": ("pct_recuperacion", FUENTE_DB, URL_DB, PERIODO_DB,
                     "centimos por dolar que recupera el acreedor; NO es un "
                     "tipo de interes"),
        "tiempo": ("anios", FUENTE_DB, URL_DB, PERIODO_DB,
                   "tiempo de resolucion del concurso"),
        "coste": ("pct_masa_concursal", FUENTE_DB, URL_DB, PERIODO_DB,
                  "coste del procedimiento sobre la masa"),
        "insolv": ("indice", FUENTE_DB, URL_DB, PERIODO_DB, "escala 0-16"),
    }
    etiq = {
        "legal": "Fortaleza de los derechos legales del acreedor",
        "depth": "Profundidad de la informacion crediticia",
        "regcov": "Cobertura del registro publico de credito",
        "burcov": "Cobertura del bureau privado de credito",
        "recovery": "Tasa de recuperacion en concurso",
        "tiempo": "Tiempo de resolucion del concurso",
        "coste": "Coste del procedimiento concursal",
        "insolv": "Fortaleza del marco concursal",
    }
    for p in PAISES:
        for k, (unidad, fuente, url, per, nota) in meta.items():
            emite(pais=p, producto="marco_institucional",
                  metrica=etiq[k], valor="%.4f" % db[p][k], unidad=unidad,
                  periodo_referencia=per, fuente=fuente, url=url,
                  fecha_publicacion=HOY, criterio_segmentacion="n/a",
                  tipo_de_dato="indice" if unidad == "indice" else "ratio",
                  ponderacion="dato_unico",
                  notas=nota + "; vintage mayo-2019, ultima medicion "
                               "comparable antes de descontinuarse Doing "
                               "Business")
        for k, tabla, esc in (("registro", REGISTRO, "0-3"),
                              ("cuentas", CUENTAS, "0-3")):
            emite(pais=p, producto="marco_institucional",
                  metrica=("Utilidad del registro publico para PYME"
                           if k == "registro"
                           else "Disponibilidad de cuentas depositadas"),
                  valor="%.4f" % db[p][k], unidad="indice",
                  periodo_referencia="2026",
                  fuente="elaboracion propia sobre normativa vigente",
                  url="", fecha_publicacion=HOY,
                  criterio_segmentacion="n/a", tipo_de_dato="indice",
                  ponderacion="media_simple",
                  notas="ordinal construido, escala %s; %s" % (esc, tabla[p][1]))

    # 2. compuestos normalizados
    comp = {}
    for nombre, eje in (("informacion", EJE_INFO), ("recobro", EJE_REC)):
        partes = []
        for k, _, sentido in eje:
            partes.append(normaliza([db[p][k] for p in PAISES], sentido))
        comp[nombre] = [sum(pt[i] for pt in partes) / len(partes)
                        for i in range(len(PAISES))]

    for nombre, titulo, eje in (
            ("informacion", "Indice de informacion para la seleccion", EJE_INFO),
            ("recobro", "Indice del entorno de recobro", EJE_REC)):
        for i, p in enumerate(PAISES):
            emite(pais=p, producto="marco_institucional", metrica=titulo,
                  valor="%.4f" % comp[nombre][i], unidad="indice",
                  periodo_referencia="2019-05 / 2026",
                  fuente="elaboracion propia sobre Doing Business 2020 y "
                         "normativa vigente",
                  url=URL_DB, fecha_publicacion=HOY,
                  criterio_segmentacion="n/a", tipo_de_dato="indice",
                  ponderacion="media_simple",
                  notas="escala 0-100 normalizada min-max sobre los siete "
                        "paises (100 = el mejor de los siete, no un optimo "
                        "absoluto); media simple de: %s"
                        % "; ".join(e[1] for e in eje))

    # 3. correlaciones con los parametros observados
    pdv = [PD_OBS[p] for p in PAISES]
    lgdv = [LGD_OBS[p] for p in PAISES]
    pares = [
        ("Indice de informacion", comp["informacion"], "PD PYME", pdv),
        ("Indice de informacion", comp["informacion"], "LGD PYME", lgdv),
        ("Indice de recobro", comp["recobro"], "PD PYME", pdv),
        ("Indice de recobro", comp["recobro"], "LGD PYME", lgdv),
    ]
    print("Correlaciones sobre siete paises (indicativas, no causales)")
    print("%-24s %-10s %8s %8s" % ("indice", "contra", "r", "rho"))
    for nom, a, dest, b in pares:
        r, rho = pearson(a, b), spearman(a, b)
        print("%-24s %-10s %8.2f %8.2f" % (nom, dest, r, rho))
        for val, tipo in ((r, "Pearson"), (rho, "Spearman")):
            emite(pais="Zona euro (referencia)",
                  producto="marco_institucional",
                  metrica="Correlacion %s de %s con %s" % (tipo, nom, dest),
                  valor="%.4f" % val, unidad="indice",
                  periodo_referencia="2019-05 / 2026-Q1",
                  fuente="calculo propio", url="", fecha_publicacion=HOY,
                  criterio_segmentacion="n/a", tipo_de_dato="indice",
                  ponderacion="media_simple",
                  notas="n=7; indicativa, no causal; los dos ejes no son "
                        "independientes entre si")

    # 3b. robustez: Portugal tiene LGD 40,00 %, que es exactamente el valor
    #     supervisor F-IRB del art. 161 CRR3 para exposiciones senior a
    #     empresas. No es una LGD modelizada, asi que se repite el contraste
    #     sin ese pais.
    idx = [i for i, p in enumerate(PAISES) if p != "Portugal"]
    rec7 = [comp["recobro"][i] for i in idx]
    lgd6 = [lgdv[i] for i in idx]
    r6, rho6 = pearson(rec7, lgd6), spearman(rec7, lgd6)
    print("%-24s %-10s %8.2f %8.2f"
          % ("Indice de recobro", "LGD s/PT", r6, rho6))
    for val, tipo in ((r6, "Pearson"), (rho6, "Spearman")):
        emite(pais="Zona euro (referencia)", producto="marco_institucional",
              metrica=("Correlacion %s de Indice de recobro con LGD PYME "
                       "excluyendo Portugal" % tipo),
              valor="%.4f" % val, unidad="indice",
              periodo_referencia="2019-05 / 2026-Q1",
              fuente="calculo propio", url="", fecha_publicacion=HOY,
              criterio_segmentacion="n/a", tipo_de_dato="indice",
              ponderacion="media_simple",
              notas="n=6; se excluye Portugal porque su LGD mediana es "
                    "40,00 %, el valor supervisor F-IRB del art. 161 CRR3 "
                    "para exposiciones senior a empresas, no una LGD "
                    "modelizada")

    print()
    print("%-14s %10s %10s %8s %8s" % ("pais", "info", "recobro", "PD", "LGD"))
    for i, p in enumerate(PAISES):
        print("%-14s %10.1f %10.1f %8.2f %8.2f"
              % (p, comp["informacion"][i], comp["recobro"][i],
                 PD_OBS[p], LGD_OBS[p]))

    # 4. correlaciones de cada componente en bruto, para poder auditar
    print()
    print("Componentes en bruto (r de Pearson)")
    print("%-14s %8s %8s" % ("componente", "PD", "LGD"))
    for k in ("depth", "burcov", "regcov", "registro", "cuentas",
              "legal", "recovery", "coste", "tiempo", "insolv"):
        v = [db[p][k] for p in PAISES]
        print("%-14s %8.2f %8.2f" % (k, pearson(v, pdv), pearson(v, lgdv)))

    fh.close()
    print()
    print("escrito: %s" % OUT)


if __name__ == "__main__":
    main()
