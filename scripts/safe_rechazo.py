#!/usr/bin/env python3
"""Tasa de rechazo de la SAFE: resultado de la solicitud de credito bancario.

Dataset SAFE del ECB Data Portal, pregunta Q7B ("Financing applied -
outcome"), item FBLN (prestamo bancario) y FOVD (descubierto / linea de
credito). El denominador es el conjunto de empresas QUE SOLICITARON, no el
total de empresas: por eso la unidad es `pct_empresas` y no
`pct_neto_encuesta`. Respuestas recogidas:

  S1  solicito y obtuvo todo
  S2  solicito y obtuvo solo una parte
  S3  solicito pero rechazo la oferta por coste demasiado alto
  S4  SOLICITO Y FUE RECHAZADA     <- la "tasa de rechazo"
  S8  solicitud aun pendiente

Se anade Q7A/R2 ("no solicito por miedo al rechazo"), el desanimo, cuyo
denominador es distinto -el total de empresas- y se etiqueta como tal.

OJO con el criterio de segmentacion: la SAFE segmenta por NUMERO DE
EMPLEADOS (PYME = <250 empleados), no por importe del prestamo como el MIR.
No se pueden promediar filas de las dos fuentes.

Uso:
    python3 scripts/safe_rechazo.py
"""
import csv
import io
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402
from safe_harvest import BASE, PORTAL, clave, fetch  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(ROOT, "transversal", "safe_rechazo.csv")

PAISES = ["ES", "DE", "FR", "IT", "PT", "NL", "IE", "AT", "U2"]

ITEMS = {"FBLN": "prestamo bancario", "FOVD": "descubierto o linea de credito"}

# Q7B: denominador = empresas que SOLICITARON ese instrumento.
RESPUESTAS = {
    "S1": "solicito y obtuvo todo",
    "S2": "solicito y obtuvo solo una parte",
    "S3": "solicito pero rechazo la oferta por coste demasiado alto",
    "S4": "solicito y fue RECHAZADA",
    "S8": "solicitud aun pendiente",
}
# Q7A: denominador = TOTAL de empresas.
DESANIMO = {"R1": "solicito", "R2": "no solicito por miedo al rechazo"}


def serie(pais, pregunta):
    k = clave(FREQ="H", REF_AREA=pais, FIRM_SIZE="SME", SAFE_QUESTION=pregunta)
    txt = fetch("%s/%s?format=csvdata" % (BASE, k))
    return list(csv.DictReader(io.StringIO(txt))) if txt else []


def main():
    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(DESTINO):
        os.remove(DESTINO)
    fh, w = schema.writer(DESTINO)
    resumen, n = {}, 0

    for pais in PAISES:
        nombre = schema.COUNTRIES.get(pais, pais)
        for pregunta, respuestas, denom_txt in (
                ("Q7B", RESPUESTAS, "empresas que solicitaron ese instrumento"),
                ("Q7A", DESANIMO, "total de empresas")):
            for d in serie(pais, pregunta):
                it, ans = d.get("SAFE_ITEM"), d.get("SAFE_ANSWER")
                if pregunta == "Q7B" and it not in ITEMS:
                    continue
                if pregunta == "Q7A" and it != "FBLN":
                    continue
                if ans not in respuestas or d.get("SAFE_DENOM") != "WP":
                    continue
                v, per = (d.get("OBS_VALUE") or "").strip(), (d.get("TIME_PERIOD") or "").strip()
                if not v or not per:
                    continue
                w.writerow(schema.row(
                    pais=nombre,
                    producto="acceso_a_financiacion",
                    metrica="SAFE %s | %s | %s | PYME (<250 empleados)"
                            % (pregunta, ITEMS.get(it, "prestamo bancario"), respuestas[ans]),
                    valor=v,
                    unidad="pct_empresas",
                    periodo_referencia=per,
                    fuente="BCE, encuesta SAFE (ECB Data Portal, dataset SAFE)",
                    url=PORTAL + d.get("KEY", ""),
                    fecha_publicacion=hoy,
                    criterio_segmentacion="tamano_empresa_empleados",
                    tipo_de_dato="ratio",
                    ponderacion="media_ponderada_volumen",
                    notas="denominador: %s. Media ponderada (SAFE_DENOM=WP). "
                          "NO es un saldo neto de respuestas ni un nivel de tipo. "
                          "serie %s" % (denom_txt, d.get("KEY", "")),
                ))
                n += 1
                if pregunta == "Q7B" and it == "FBLN":
                    resumen.setdefault(per, {}).setdefault(pais, {})[ans] = float(v)
                if pregunta == "Q7A" and ans == "R2":
                    resumen.setdefault(per, {}).setdefault(pais, {})["R2"] = float(v)
        print("  %-3s ok" % pais)
    fh.close()

    ult = max(resumen)
    print("\nPrestamo bancario, PYME, %s (%% de las que solicitaron):" % ult)
    print("  %-22s %8s %8s %8s %8s" % ("pais", "rechazo", "parcial", "coste", "desanimo*"))
    for pais in PAISES:
        r = resumen[ult].get(pais, {})
        print("  %-22s %7.1f%% %7.1f%% %7.1f%% %7.1f%%" % (
            schema.COUNTRIES.get(pais, pais), r.get("S4", 0), r.get("S2", 0),
            r.get("S3", 0), r.get("R2", 0)))
    print("  * desanimo: % sobre el TOTAL de empresas, no sobre las solicitantes")
    print("\n-> %s (%d filas)" % (DESTINO, n))

    return 0


if __name__ == "__main__":
    sys.exit(main())
