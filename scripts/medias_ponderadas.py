#!/usr/bin/env python3
"""Calcula medias de tipo ponderadas por volumen de nueva produccion a
partir de los CSV mensuales del MIR, y las escribe como filas derivadas.

El tipo mensual del MIR ya viene ponderado por el volumen contratado DENTRO
de ese mes. Para agregar varios meses hay que volver a ponderar por el
volumen de cada mes, no promediar los tipos a secas:

    tipo_periodo = sum(tipo_m * volumen_m) / sum(volumen_m)

Uso:
    python3 scripts/medias_ponderadas.py --anio 2026
    python3 scripts/medias_ponderadas.py --anio 2025 --plazo "Total initial rate fixation"
"""
import argparse
import collections
import csv
import os
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(ROOT, "prestamos_personales",
                       "prestamos_empresas_ecb_mir.csv")
SALIDA = os.path.join(ROOT, "prestamos_personales",
                      "prestamos_empresas_medias_ponderadas.csv")
# Tramos disjuntos. "Hasta 1 M EUR" es la suma de los dos primeros, por eso
# no debe mezclarse con ellos en un mismo agregado.
FINO = ["Hasta 0,25 M EUR", "Mas de 0,25 y hasta 1 M EUR", "Mas de 1 M EUR"]
GRUESO = ["Hasta 1 M EUR", "Mas de 1 M EUR"]
# "Mas de 1 M EUR" pertenece a los dos cortes; se emite una sola vez.
TRAMOS = FINO + [t for t in GRUESO if t not in FINO]


def carga(plazo):
    tip, vol = collections.defaultdict(dict), collections.defaultdict(dict)
    for x in csv.DictReader(open(ENTRADA, encoding="utf-8")):
        if x["plazo_fijacion"] != plazo:
            continue
        k = (x["pais"], x["tramo_importe"])
        if x["unidad"] == "pct_anual":
            tip[k][x["periodo_referencia"]] = float(x["valor"])
        elif x["unidad"] == "eur_millones":
            vol[k][x["periodo_referencia"]] = float(x["valor"])
    return tip, vol


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anio", default="2026")
    ap.add_argument("--plazo", default="Total initial rate fixation")
    a = ap.parse_args()

    tip, vol = carga(a.plazo)
    if not tip:
        print("sin datos para plazo %r; ejecuta antes ecb_mir_harvest.py"
              % a.plazo)
        return 1
    paises = sorted({p for p, _ in tip})
    fh, w = schema.writer(SALIDA)
    n = 0
    hoy = __import__("time").strftime("%Y-%m-%d")

    for pais in paises:
        for tramo in TRAMOS:
            t, v = tip.get((pais, tramo), {}), vol.get((pais, tramo), {})
            meses = [k for k in sorted(t) if k.startswith(a.anio)]
            if not meses:
                continue
            con_vol = [k for k in meses if k in v]
            base = dict(
                pais=pais, producto="prestamo_empresas_por_tramo",
                unidad="pct_anual",
                periodo_referencia="%s (%s a %s)" % (a.anio, meses[0], meses[-1]),
                fuente="BCE, ECB Data Portal, dataset MIR (calculo propio)",
                url="https://data.ecb.europa.eu/data/datasets/MIR",
                fecha_publicacion=hoy, tramo_importe=tramo,
                plazo_fijacion=a.plazo,
                criterio_segmentacion="tamano_prestamo",
                tipo_de_dato="nivel",
            )
            if len(con_vol) == len(meses):
                W = sum(v[k] for k in meses)
                val = sum(t[k] * v[k] for k in meses) / W
                w.writerow(schema.row(
                    metrica="Tipo medio ponderado por volumen", valor="%.4f" % val,
                    ponderacion="media_ponderada_volumen",
                    notas="%d meses; volumen agregado %.0f M EUR" % (len(meses), W),
                    **base)); n += 1
                w.writerow(schema.row(
                    metrica="Volumen de nueva produccion acumulado",
                    valor="%.0f" % W, ponderacion="dato_unico",
                    notas="%d meses" % len(meses),
                    **{**base, "unidad": "eur_millones",
                       "tipo_de_dato": "volumen"})); n += 1
            else:
                # Sin volumen completo no se puede ponderar: se deja media
                # simple, marcada como tal para que no se confunda.
                val = statistics.mean([t[k] for k in meses])
                w.writerow(schema.row(
                    metrica="Tipo medio simple (sin volumen publicado)",
                    valor="%.4f" % val, ponderacion="media_simple",
                    notas="%d meses; el pais no publica volumen de este tramo "
                          "en %d de ellos, no se puede ponderar"
                          % (len(meses), len(meses) - len(con_vol)),
                    **base)); n += 1
    fh.close()
    print("%d filas -> %s" % (n, SALIDA))
    return 0


if __name__ == "__main__":
    sys.exit(main())
