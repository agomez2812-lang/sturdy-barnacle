#!/usr/bin/env python3
"""Densidad de RWA de la cartera PYME separando metodo ESTANDAR de IRB.

Mismo fichero y mismas partidas que eba_te_pyme.py, pero abriendo la
dimension `Portfolio` del EU-wide Transparency Exercise:

    Portfolio = 1  metodo ESTANDAR (SA)
    Portfolio = 2  metodo basado en calificaciones internas (IRB)

Por que importa: la densidad de RWA agregada de un pais no mide solo el
riesgo de sus PYME, mide tambien QUE PROPORCION de la cartera esta
modelizada internamente. Un banco con modelos IRB aprobados consume mucho
menos capital por el mismo riesgo. Comparar densidades agregadas entre
paises sin separar los dos metodos confunde riesgo con permiso supervisor.

Partidas:
    2520503  Original Exposure - SME
    2520523  Exposure value - SME
    2520533  Risk exposure amount - SME

Se agregan las entidades cuyo supervisor nacional (NSA) es cada pais, con
Country = 0 (total de la entidad, todas las contrapartes).

Uso:
    python3 scripts/eba_te_pyme_sa_irb.py [--periodo 202506]
"""
import argparse
import collections
import csv
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402
from eba_te_pyme import CSV_TE, PAISES, URL  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(ROOT, "transversal", "eba_te_pyme_sa_irb.csv")
ITEMS = {"2520503": "exposicion_original", "2520523": "exposicion_valor",
         "2520533": "rwa"}
METODOS = {"1": "estandar (SA)", "2": "IRB"}
ORDEN = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
         "Paises Bajos", "Irlanda"]
CORTO = {"Paises Bajos": "P. Bajos"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--periodo", default="202506")
    a = ap.parse_args()
    if not os.path.exists(CSV_TE):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % CSV_TE)

    acc = collections.defaultdict(lambda: collections.defaultdict(float))
    with open(CSV_TE, encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh):
            if (d["Item"] not in ITEMS or d["NSA"] not in PAISES
                    or d["Period"] != a.periodo or d["Country"] != "0"):
                continue
            met = METODOS.get(d["Portfolio"])
            if met is None:
                continue
            try:
                acc[(d["NSA"], met)][ITEMS[d["Item"]]] += float(d["Amount"])
            except ValueError:
                pass

    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(SALIDA):
        os.remove(SALIDA)
    fh, w = schema.writer(SALIDA)
    res, n = {}, 0
    for cod, pais in PAISES.items():
        fila = {}
        tot_e = tot_r = 0.0
        for met in METODOS.values():
            x = acc.get((cod, met))
            if not x:
                continue
            e, r = x["exposicion_valor"], x["rwa"]
            tot_e += e
            tot_r += r
            fila[met] = {"exposicion": e, "rwa": r, "densidad": 100.0 * r / e}
            for metrica, val, uni, nota in [
                ("Densidad de RWA de PYME | %s" % met, 100.0 * r / e, "pct_rwa",
                 "RWA / valor de exposicion de la cartera PYME calculada por "
                 "%s. Portfolio=%s del Transparency Exercise" % (met, met)),
                ("Exposicion PYME | %s" % met, e, "eur_millones",
                 "valor de exposicion (post CRM y CCF) calculado por %s" % met),
            ]:
                w.writerow(schema.row(
                    pais=pais, producto="pyme_total", metrica=metrica,
                    valor="%.2f" % val, unidad=uni,
                    periodo_referencia=a.periodo,
                    fuente="EBA, EU-wide Transparency Exercise 2025 (tr_cre.csv)",
                    url=URL, fecha_publicacion=hoy,
                    # el metodo estandar define PYME por facturacion (art. 501
                    # CRR); el IRB, con la definicion interna de cada banco
                    criterio_segmentacion=("pyme_crr_facturacion"
                                           if met.startswith("estandar")
                                           else "pyme_interna_banco"),
                    tipo_de_dato="ratio" if uni == "pct_rwa" else "volumen",
                    ponderacion="media_ponderada_volumen",
                    notas=nota)); n += 1
        if not tot_e:
            continue
        sa = fila.get("estandar (SA)", {})
        irb = fila.get("IRB", {})
        cuota_irb = 100.0 * irb.get("exposicion", 0.0) / tot_e
        dens_tot = 100.0 * tot_r / tot_e
        for metrica, val, uni, nota in [
            ("Densidad de RWA de PYME | total", dens_tot, "pct_rwa",
             "media ponderada de los dos metodos; depende tanto del riesgo "
             "como del reparto entre estandar e IRB"),
            ("Cuota de la exposicion PYME calculada por IRB", cuota_irb,
             "pct_cartera",
             "sobre el valor de exposicion PYME total del sistema"),
            ("Ahorro de densidad del IRB frente al estandar",
             sa.get("densidad", 0.0) - irb.get("densidad", 0.0), "pct_rwa",
             "diferencia en puntos de densidad entre los dos metodos, mismo pais"),
        ]:
            w.writerow(schema.row(
                pais=pais, producto="pyme_total", metrica=metrica,
                valor="%.2f" % val, unidad=uni, periodo_referencia=a.periodo,
                fuente="EBA, EU-wide Transparency Exercise 2025 (tr_cre.csv)",
                url=URL, fecha_publicacion=hoy,
                criterio_segmentacion="pyme_mixta_estandar_e_irb",
                tipo_de_dato="ratio", ponderacion="media_ponderada_volumen",
                notas=nota)); n += 1
        res[CORTO.get(pais, pais)] = {
            "sa": round(sa.get("densidad", 0.0), 1),
            "irb": round(irb.get("densidad", 0.0), 1),
            "total": round(dens_tot, 1),
            "cuota_irb": round(cuota_irb, 1),
            "ahorro": round(sa.get("densidad", 0.0) - irb.get("densidad", 0.0), 1),
        }
    fh.close()

    print("Densidad de RWA de PYME, %s. En %% del valor de exposicion.\n" % a.periodo)
    print("%-10s %9s %9s %9s %9s %9s" % (
        "pais", "estandar", "IRB", "total", "% en IRB", "ahorro"))
    for p in [CORTO.get(x, x) for x in ORDEN]:
        r = res[p]
        print("%-10s %8.1f%% %8.1f%% %8.1f%% %8.1f%% %7.1f pp" % (
            p, r["sa"], r["irb"], r["total"], r["cuota_irb"], r["ahorro"]))
    # Descomposicion de la brecha de densidad de Espana frente a cada pais:
    # cuanto viene de tener MENOS cartera en IRB (mix) y cuanto de que los
    # modelos IRB espanoles ahorran MENOS capital (calibracion).
    def mezcla(sa, irb, cuota):
        return sa * (1 - cuota / 100.0) + irb * (cuota / 100.0)

    es = res["Espana"]
    fh, w = schema.writer(SALIDA)
    print("\nBrecha de densidad de Espana, descompuesta (pp):")
    print("  %-10s %8s %8s %8s %8s" % ("frente a", "brecha", "mix IRB", "calibr.", "interac."))
    for p, r in res.items():
        if p == "Espana":
            continue
        brecha = es["total"] - r["total"]
        mix = es["total"] - mezcla(es["sa"], es["irb"], r["cuota_irb"])
        cal = es["total"] - mezcla(es["sa"], r["irb"], es["cuota_irb"])
        r["brecha_es"] = round(brecha, 1)
        r["por_mix"] = round(mix, 1)
        r["por_calibracion"] = round(cal, 1)
        r["interaccion"] = round(brecha - mix - cal, 1)
        print("  %-10s %7.1f %8.1f %8.1f %8.1f" % (
            p, brecha, mix, cal, brecha - mix - cal))
        for metrica, val, nota in [
            ("Brecha de densidad PYME de Espana frente a %s" % p, brecha,
             "diferencia de densidad total de RWA, en puntos"),
            ("... de la cual, por tener menos cartera en IRB", mix,
             "parte de la brecha que desapareceria si Espana tuviera la cuota "
             "IRB de %s con sus propias densidades" % p),
            ("... de la cual, por la calibracion de los modelos IRB", cal,
             "parte de la brecha que desapareceria si los modelos IRB "
             "espanoles dieran la densidad de %s con la cuota IRB espanola" % p),
        ]:
            w.writerow(schema.row(
                pais="Espana", producto="pyme_total", metrica=metrica,
                valor="%.2f" % val, unidad="pct_rwa",
                periodo_referencia=a.periodo,
                fuente="EBA, EU-wide Transparency Exercise 2025 (tr_cre.csv), "
                       "descomposicion propia",
                url=URL, fecha_publicacion=hoy,
                criterio_segmentacion="pyme_mixta_estandar_e_irb",
                tipo_de_dato="ratio", ponderacion="media_ponderada_volumen",
                notas=nota)); n += 1
    fh.close()

    print("\n%d filas -> %s" % (n, SALIDA))
    json.dump(res, open(os.path.join(ROOT, "pres", "dens_sa_irb.json"), "w"),
              indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
