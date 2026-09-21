#!/usr/bin/env python3
"""Prima PYME: cuanto mas caro paga el prestamo pequeno que el grande.

El MIR permite DOS definiciones y no dan lo mismo, asi que se calculan las
dos y cada fila declara cual usa:

  ESTRECHA  tipo(hasta 0,25 M EUR) - tipo(mas de 1 M EUR)
            Compara los EXTREMOS. Es la definicion que usan la mayoria de
            los informes de sector. Da primas mas altas.
  AMPLIA    tipo(hasta 1 M EUR)    - tipo(mas de 1 M EUR)
            El corte en 1 M EUR es el que el BCE usa convencionalmente para
            separar "prestamo PYME" de "prestamo corporativo". Da primas
            mas bajas porque el tramo pequeno incluye ya operaciones de
            0,25-1 M, mas baratas.

IMPORTANTE: el MIR segmenta por IMPORTE DEL PRESTAMO, no por tamano de la
empresa. Un prestamo de 800.000 EUR a una empresa grande cuenta como
"pequeno". Es una prima de tamano de OPERACION, no de tamano de cliente; la
que segmenta por empleados es la SAFE.

Se usa el plazo "Total initial rate fixation" (todos los periodos de
fijacion) para que el diferencial no recoja diferencias de plazo entre
tramos. La media anual pondera el diferencial mensual por el volumen de
nueva produccion de los dos tramos en ese mes; se comprobo que ponderar o
no cambia el resultado en menos de 0,1 pp salvo en Irlanda.

Uso:
    python3 scripts/prima_pyme.py
"""
import collections
import csv
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(ROOT, "prestamos_personales",
                       "prestamos_empresas_ecb_mir.csv")
SALIDA = os.path.join(ROOT, "prestamos_personales", "prima_pyme.csv")
PLAZO = "Total initial rate fixation"
URL = "https://data.ecb.europa.eu/data/datasets/MIR"
PAISES = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
          "Paises Bajos", "Irlanda"]
CORTO = {"Espana": "Espana", "Paises Bajos": "P. Bajos"}

DEFINICIONES = {
    "estrecha": ("Hasta 0,25 M EUR", "Mas de 1 M EUR",
                 "hasta 0,25 M frente a mas de 1 M (extremos)"),
    "amplia": ("Hasta 1 M EUR", "Mas de 1 M EUR",
               "hasta 1 M frente a mas de 1 M (corte convencional PYME)"),
}


def carga():
    tip = collections.defaultdict(dict)
    vol = collections.defaultdict(dict)
    with open(ENTRADA, newline="", encoding="utf-8") as fh:
        for x in csv.DictReader(fh):
            if x["plazo_fijacion"] != PLAZO:
                continue
            k = (x["pais"], x["tramo_importe"])
            if x["unidad"] == "pct_anual":
                tip[k][x["periodo_referencia"]] = float(x["valor"])
            elif x["unidad"] == "eur_millones":
                vol[k][x["periodo_referencia"]] = float(x["valor"])
    return tip, vol


def media(dif, peso, meses):
    ms = [m for m in meses if m in dif]
    if not ms:
        return None, "n/a"
    w = [peso.get(m, 0.0) for m in ms]
    if all(x > 0 for x in w):
        return sum(dif[m] * x for m, x in zip(ms, w)) / sum(w), \
            "media_ponderada_volumen"
    return sum(dif[m] for m in ms) / len(ms), "media_simple"


def main():
    tip, vol = carga()
    if not tip:
        print("sin datos; ejecuta antes ecb_mir_harvest.py --desde 2022-01")
        return 1
    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(SALIDA):
        os.remove(SALIDA)
    fh, w = schema.writer(SALIDA)
    salida, n = {}, 0

    for clave, (peq, gra, etiqueta) in DEFINICIONES.items():
        resumen = {}
        anios = None
        for pais in PAISES:
            tp, tg = tip.get((pais, peq), {}), tip.get((pais, gra), {})
            vp, vg = vol.get((pais, peq), {}), vol.get((pais, gra), {})
            dif = {m: tp[m] - tg[m] for m in sorted(tp) if m in tg}
            if not dif:
                continue
            peso = {m: vp.get(m, 0.0) + vg.get(m, 0.0) for m in dif}
            meses = sorted(dif)
            anios = sorted({m[:4] for m in meses})

            base = dict(pais=pais, producto="prestamos_empresas",
                        unidad="pct_anual",
                        fuente="BCE, MIR (ECB Data Portal)", url=URL,
                        fecha_publicacion=hoy, tramo_importe=etiqueta,
                        plazo_fijacion=PLAZO,
                        criterio_segmentacion="tamano_prestamo",
                        tipo_de_dato="nivel")
            aviso = ("DIFERENCIAL de dos niveles de tipo, no un saldo neto de "
                     "encuesta. Prima de tamano de OPERACION, no de empresa. "
                     "Definicion %s." % clave)

            for m in meses:
                w.writerow(schema.row(
                    metrica="Prima PYME (%s) | mensual" % clave,
                    valor="%.4f" % dif[m], periodo_referencia=m,
                    ponderacion="dato_unico", notas=aviso, **base))
                n += 1

            anual = []
            for a in anios:
                v, pond = media(dif, peso, [m for m in meses if m.startswith(a)])
                anual.append(round(v, 2))
                w.writerow(schema.row(
                    metrica="Prima PYME (%s) | media del ano" % clave,
                    valor="%.4f" % v, periodo_referencia=a, ponderacion=pond,
                    notas=aviso + " Media del diferencial mensual ponderada "
                                  "por el volumen de nueva produccion de los "
                                  "dos tramos.", **base))
                n += 1

            u12 = meses[-12:]
            v12, pond = media(dif, peso, u12)
            neg = sum(1 for m in dif if dif[m] < 0)
            w.writerow(schema.row(
                metrica="Prima PYME (%s) | ultimos 12 meses" % clave,
                valor="%.4f" % v12,
                periodo_referencia="%s a %s" % (u12[0], u12[-1]),
                ponderacion=pond,
                notas=aviso + " %d de los %d meses de la serie tienen prima "
                              "NEGATIVA (el prestamo pequeno sale mas barato "
                              "que el grande)." % (neg, len(dif)), **base))
            n += 1
            resumen[CORTO.get(pais, pais)] = {
                "anual": anual, "u12": round(v12, 2), "neg": neg,
                "n": len(dif), "min": round(min(dif.values()), 2),
                "max": round(max(dif.values()), 2),
                "primero": meses[0], "ultimo": meses[-1]}
        salida[clave] = {"anios": anios, "etiqueta": etiqueta,
                         "serie": resumen}
    fh.close()

    for clave, blo in salida.items():
        print("\nPrima PYME, definicion %s (%s). En pp." % (clave, blo["etiqueta"]))
        print("%-10s %s %8s %9s" % (
            "pais", " ".join("%7s" % a for a in blo["anios"]), "ult.12m", "meses<0"))
        for p, r in blo["serie"].items():
            print("%-10s %s %+7.2f %6d/%d" % (
                p, " ".join("%+7.2f" % v for v in r["anual"]),
                r["u12"], r["neg"], r["n"]))
    print("\n%d filas -> %s" % (n, SALIDA))
    json.dump(salida, open(os.path.join(ROOT, "pres", "prima_pyme.json"), "w"),
              indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
