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
    "criterio_segmentacion",  # tamano_prestamo | tamano_empresa_empleados | entidad | n/a
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
    if r["unidad"] not in UNITS:
        raise ValueError("unidad no canonica: %r (permitidas: %s)"
                         % (r["unidad"], sorted(UNITS)))
    return r
