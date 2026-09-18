#!/usr/bin/env python3
"""Descarga la encuesta SAFE del BCE (dataset SAFE del ECB Data Portal).

Recoge las dos magnitudes pedidas en el encargo y las etiqueta de forma que
NO puedan confundirse entre si:

  Q8B  tipo cobrado por la linea de credito o descubierto -> NIVEL (%)
  FG   brecha de financiacion                             -> PORCENTAJE NETO
       Indicador COMPUESTO y de CAMBIO, no de nivel. El BCE lo define asi
       (guia metodologica de la SAFE, apartado 6.3): combina necesidad y
       disponibilidad de CINCO instrumentos -prestamo bancario, descubierto
       bancario, credito comercial, capital y valores de deuda-; por empresa
       e instrumento vale 1 (-1) si la necesidad sube (baja) y la
       disponibilidad baja (sube), 0,5 (-0,5) si solo se mueve un lado, y 0
       si nada cambia; el compuesto es la media ponderada de los cinco y se
       multiplica por 100. Positivo = la brecha SE ABRE. NO mide el tamano
       de una necesidad insatisfecha ni es solo credito bancario.

SAFE segmenta por NUMERO DE EMPLEADOS (PYME = <250), a diferencia del MIR,
que segmenta por importe del prestamo. Las filas lo declaran en
`criterio_segmentacion` y no deben promediarse con las del MIR.

Uso:
    python3 scripts/safe_harvest.py
"""
import csv
import io
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

BASE = "https://data-api.ecb.europa.eu/service/data/SAFE"
PORTAL = "https://data.ecb.europa.eu/data/datasets/SAFE/SAFE."
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DIMS = ["FREQ", "REF_AREA", "FIRM_SIZE", "FIRM_SECTOR", "FIRM_TURNOVER",
        "FIRM_AGE", "FIRM_OWNERSHIP", "SAFE_QUESTION", "SAFE_ITEM",
        "SAFE_ANSWER", "SAFE_FILTER", "SAFE_DENOM"]

PAISES = ["ES", "DE", "FR", "IT", "PT", "NL", "IE", "U2"]
TAMANOS = {"SME": "PYME (<250 empleados)", "MIC": "Micro (1-9)",
           "SML": "Pequena (10-49)", "MED": "Mediana (50-249)",
           "LAR": "Grande (250+)"}
# Denominadores que interesan. UN y WN son tamanos de muestra, no magnitudes.
DENOM = {"WA": "media ponderada", "WM": "mediana ponderada",
         "UN": "n respuestas (sin ponderar)", "WN": "n respuestas (ponderado)"}

PREGUNTAS = {
    "Q8B": {
        "etiqueta": "Q8B. Tipo cobrado por la linea de credito o descubierto",
        "producto": "linea_credito_circulante",
        "carpeta": "circulante",
        "unidad": "pct_anual",
        "tipo_de_dato": "nivel",
    },
    "FG": {
        "etiqueta": "Brecha de financiacion (financing gap)",
        "producto": "acceso_a_financiacion",
        "carpeta": "transversal",
        "unidad": "pct_neto_encuesta",
        "tipo_de_dato": "porcentaje_neto_encuesta",
    },
}


def clave(**kw):
    return ".".join(kw.get(d, "") for d in DIMS)


def fetch(url, reintentos=4):
    espera = 2
    for i in range(reintentos + 1):
        try:
            req = urllib.request.Request(
                url, headers={"Accept": "text/csv", "User-Agent": "pyme-research/1.0"})
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504) and i < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if i < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
    return None


def main():
    hoy = time.strftime("%Y-%m-%d")
    total, vacias = 0, []
    for q, cfg in PREGUNTAS.items():
        destino = os.path.join(ROOT, cfg["carpeta"], "safe_%s.csv" % q.lower())
        if os.path.exists(destino):
            os.remove(destino)
        fh, w = schema.writer(destino)
        for pais in PAISES:
            for tam, tam_txt in TAMANOS.items():
                k = clave(REF_AREA=pais, FIRM_SIZE=tam, SAFE_QUESTION=q)
                txt = fetch("%s/%s?format=csvdata" % (BASE, k))
                if not txt:
                    vacias.append((pais, tam, q)); continue
                n = 0
                for d in csv.DictReader(io.StringIO(txt)):
                    v = (d.get("OBS_VALUE") or "").strip()
                    per = (d.get("TIME_PERIOD") or "").strip()
                    den = (d.get("SAFE_DENOM") or "").strip()
                    if not v or not per or den not in DENOM:
                        continue
                    muestra = den in ("UN", "WN")
                    w.writerow(schema.row(
                        pais=schema.COUNTRIES.get(pais, pais),
                        producto=cfg["producto"],
                        metrica="%s | %s | %s" % (cfg["etiqueta"], tam_txt, DENOM[den]),
                        valor=v,
                        unidad="pct_anual" if muestra else cfg["unidad"],
                        periodo_referencia=per,
                        fuente="BCE, encuesta SAFE (ECB Data Portal, dataset SAFE)",
                        url=PORTAL + d.get("KEY", ""),
                        fecha_publicacion=hoy,
                        criterio_segmentacion="tamano_empresa_empleados",
                        tipo_de_dato="importe" if muestra else cfg["tipo_de_dato"],
                        ponderacion=("media_ponderada_volumen" if den == "WA"
                                     else "dato_unico"),
                        notas=("TAMANO DE MUESTRA, no es una magnitud economica; "
                               if muestra else "") + "serie %s" % d.get("KEY", ""),
                    )); n += 1
                total += n
                print("  %-4s %-4s %-4s %4d filas" % (q, pais, tam, n))
        fh.close()
        print("-> %s\n" % destino)
    print("Total: %d observaciones" % total)
    if vacias:
        print("Sin datos (%d combinaciones): %s%s" % (
            len(vacias), vacias[:6], " ..." if len(vacias) > 6 else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
