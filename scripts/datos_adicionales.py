#!/usr/bin/env python3
"""Reune en pres/adicionales.json los cinco bloques de las laminas sueltas.

Los cinco bloques salen de sus respectivos CSV del repositorio, no de
numeros escritos a mano:

  prima        prestamos_personales/prima_pyme.csv
  rechazo      transversal/safe_rechazo.csv
  rote         comparables_bancos/reconciliacion_rote.csv
  densidad     transversal/eba_te_pyme_sa_irb.csv
  factoring    factoring_confirming/euf_historico.csv

Uso:
    python3 scripts/datos_adicionales.py
"""
import collections
import csv
import json
import os
import statistics as st
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDEN = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
         "Paises Bajos", "Irlanda"]
CORTO = {"Paises Bajos": "P. Bajos"}


def leer(rel):
    with open(os.path.join(ROOT, rel), newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def bloque_rechazo():
    """SAFE Q7B/Q7A: resultado de la solicitud de prestamo bancario."""
    niv = collections.defaultdict(dict)
    ser = collections.defaultdict(dict)
    for r in leer("transversal/safe_rechazo.csv"):
        if "prestamo bancario" not in r["metrica"]:
            continue
        resp = r["metrica"].split("|")[-2].strip()
        per, v = r["periodo_referencia"], float(r["valor"])
        if per == "2025-S2":
            niv[r["pais"]][resp] = v
        if resp == "solicito y fue RECHAZADA":
            ser[r["pais"]][per] = v
    pers = sorted(p for p in ser["Espana"] if p >= "2022")
    out = {"periodo": "2025-S2", "periodos": pers, "paises": [], "datos": {}}
    for p in ORDEN + ["Zona euro (referencia)"]:
        c = CORTO.get(p, p)
        x, s = niv[p], ser[p]
        xs = [s[k] for k in pers]
        out["paises"].append(c)
        out["datos"][c] = {
            "rechazo": round(x.get("solicito y fue RECHAZADA", 0), 1),
            "parcial": round(x.get("solicito y obtuvo solo una parte", 0), 1),
            "coste": round(x.get("solicito pero rechazo la oferta por coste "
                                 "demasiado alto", 0), 1),
            "todo": round(x.get("solicito y obtuvo todo", 0), 1),
            "pendiente": round(x.get("solicitud aun pendiente", 0), 1),
            "serie": [round(v, 1) for v in xs],
            "min": round(min(xs), 1), "max": round(max(xs), 1),
            "media3a": round(st.mean(xs[-6:]), 1),
        }
    return out


def bloque_rote():
    return json.load(open(os.path.join(
        ROOT, "comparables_bancos", "reconciliacion_rote.json")))


def bloque_factoring():
    ser = collections.defaultdict(dict)
    for r in leer("factoring_confirming/euf_historico.csv"):
        ser[r["pais"]][int(r["periodo_referencia"])] = float(r["valor"])
    out = {}
    for p, s in ser.items():
        anios = sorted(s)
        ult = s[anios[-1]]
        rep = 1
        for a in reversed(anios[:-1]):
            if abs(s[a] - ult) < 0.5:
                rep += 1
            else:
                break
        out[CORTO.get(p, p)] = {
            "anios": anios, "valores": [s[a] for a in anios],
            "congelado": rep, "desde": anios[-1] - rep + 1,
            "ultimo": ult,
            "distintos": len({round(s[a]) for a in anios if a >= 2017}),
        }
    return out


def main():
    d = {
        "prima": json.load(open(os.path.join(ROOT, "pres", "prima_pyme.json"))),
        "rechazo": bloque_rechazo(),
        "rote": bloque_rote(),
        "densidad": json.load(open(os.path.join(ROOT, "pres", "dens_sa_irb.json"))),
        "factoring": bloque_factoring(),
    }
    destino = os.path.join(ROOT, "pres", "adicionales.json")
    json.dump(d, open(destino, "w"), indent=1, ensure_ascii=False)
    print("-> %s" % destino)
    for k, v in d.items():
        print("  %-10s %d claves" % (k, len(v)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
