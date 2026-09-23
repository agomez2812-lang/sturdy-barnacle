"""Esquema comun para todos los CSV del proyecto.

Una fila = una observacion. Nunca se mezclan niveles (tipos en %) con
porcentajes netos de encuesta: eso se distingue en `unidad` y `metrica`.
"""
import csv
import os

COLUMNS = [
    "pais",
    "producto",
    "metrica",
    "valor",
    "unidad",
    "periodo_referencia",
    "fuente",
    "url",
    "fecha_publicacion",
    # --- desglose de la serie (vacio cuando no aplica) ---
    "tramo_importe",   # tramo de importe del prestamo
    "plazo_fijacion",  # periodo de fijacion inicial del tipo / vencimiento
    # --- columnas de control metodologico (exigidas por el encargo) ---
    "criterio_segmentacion",  # ver CRITERIOS: que se llama PYME en esa fila
    "tipo_de_dato",           # nivel | porcentaje_neto_encuesta | volumen | ratio | importe
    "ponderacion",            # media_ponderada_volumen | media_simple | dato_unico | n/a
    "notas",
]

# Unidades canonicas. `pct_anual` = nivel de tipo de interes (p.ej. 3,66%).
# `pct_neto_encuesta` = saldo neto de respuestas (p.ej. 43% de empresas
# reporta subida). Son magnitudes distintas y NO deben agregarse juntas.
UNITS = {
    "pct_anual", "pct_neto_encuesta", "pct_cartera", "pct_rwa",
    "eur_millones", "eur_miles_millones", "pct_ingresos", "pb",
    "pct_roe", "pct_activos",
    # --- marco institucional (indicadores Doing Business y compuestos) ---
    # `indice` = puntuacion; la escala va SIEMPRE en `notas` (0-8, 0-12,
    # 0-16 o 0-100 normalizado). `pct_recuperacion` = centimos por dolar
    # recuperados por el acreedor, NO un tipo de interes.
    "indice", "anios", "pct_recuperacion", "pct_masa_concursal",
    "pct_adultos",
    # `pct_empresas` = porcentaje de empresas sobre un denominador declarado
    # (p.ej. "% de las que solicitaron"). NO es un saldo neto de respuestas
    # ni un nivel de tipo de interes.
    "pct_empresas",
}

# Criterio con el que la FUENTE define la PYME (o el perimetro) de cada fila.
# Leido en la normativa de cada fuente, no supuesto: ver notas.md 2.77 a 2.80.
# Hay que elegir el de la fila concreta; una misma fuente puede usar varios
# (el Transparency Exercise da la parte estandar y la IRB por separado).
CRITERIOS = {
    # --- definiciones de PYME por tamano de EMPRESA ---
    "definicion_ue_2003_361":
        "Recomendacion 2003/361/CE completa: <250 empleados y facturacion "
        "<=50 M EUR o balance <=43 M EUR, sumando empresas vinculadas. "
        "FINREP (mora de PYME) y Central de Balances",
    "tamano_empresa_empleados":
        "solo numero de empleados, <250. SAFE; CESGAR, que ademas incluye "
        "personas fisicas",
    "pyme_crr_facturacion":
        "solo facturacion <=50 M EUR (art. 501.2.b CRR). COREP, metodo "
        "estandar",
    "pyme_interna_banco":
        "definicion INTERNA de cada banco (instrucciones COREP para IRB). "
        "PD, LGD y parte IRB de la densidad; no armonizada entre bancos",
    "pyme_mixta_estandar_e_irb":
        "mezcla de las dos anteriores en la proporcion estandar/IRB de la "
        "cartera: densidad total del Transparency Exercise",
    "definicion_nacional":
        "la definicion de PYME de cada pais, no armonizada. OCDE Scoreboard",
    # --- perimetros que NO son tamano de empresa ---
    "tamano_prestamo":
        "importe del PRESTAMO, no tamano de la empresa. MIR, Boletin del "
        "Banco de Espana, Banca d'Italia",
    "sector_institucional":
        "sector SEC 2010 (p. ej. hogares para el autonomo), sin tamano",
    "entidad":
        "dato de un banco concreto, no de un segmento de tamano",
    "n/a":
        "sin segmentacion por tamano: todas las empresas, el sistema o un "
        "indicador que no es de segmento",
}

COUNTRIES = {
    "ES": "Espana", "DE": "Alemania", "FR": "Francia",
    "IT": "Italia", "PT": "Portugal", "NL": "Paises Bajos",
    "IE": "Irlanda",
    "U2": "Zona euro (referencia)",
}


def writer(path):
    """Abre un CSV con cabecera, creando directorios si hace falta."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    fresh = not os.path.exists(path) or os.path.getsize(path) == 0
    fh = open(path, "a", newline="", encoding="utf-8")
    w = csv.DictWriter(fh, fieldnames=COLUMNS, extrasaction="raise")
    if fresh:
        w.writeheader()
    return fh, w


def row(**kw):
    """Construye una fila validando unidad y campos obligatorios."""
    r = {c: "" for c in COLUMNS}
    r.update(kw)
    missing = [c for c in ("pais", "producto", "metrica", "valor", "unidad",
                           "periodo_referencia", "fuente") if not r[c]]
    if missing:
        raise ValueError("faltan campos obligatorios: %s" % missing)
    if r["criterio_segmentacion"] and r["criterio_segmentacion"] not in CRITERIOS:
        raise ValueError("criterio_segmentacion no canonico: %r (permitidos: %s)"
                         % (r["criterio_segmentacion"], sorted(CRITERIOS)))
    if r["unidad"] not in UNITS:
        raise ValueError("unidad no canonica: %r (permitidas: %s)"
                         % (r["unidad"], sorted(UNITS)))
    return r
