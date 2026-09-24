#!/usr/bin/env python3
"""Datos de la presentacion descriptiva del mercado PYME europeo.

Escribe pres/descriptiva.json. Reglas:

  - SOLO datos observados en su fuente, o transformaciones aritmeticas
    directas de ellos (medias ponderadas, diferencias, correlaciones). Nada
    que dependa del modelo de ROE: ni comisiones supuestas fuera de Espana,
    ni margen bruto, ni capital asignado, ni ROE.
  - Todo sale de los CSV del repositorio (o de bloques de pres/*.json que a
    su vez salen de ellos), nunca de numeros escritos aqui.

Uso:
    python3 scripts/datos_descriptiva.py
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
NOMBRE = {"Espana": "España", "Paises Bajos": "P. Bajos"}


def lee(rel):
    with open(os.path.join(ROOT, rel), newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def js(rel):
    return json.load(open(os.path.join(ROOT, rel), encoding="utf-8"))


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    return (sum((x - ma) * (y - mb) for x, y in zip(a, b))
            / ((sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** .5))


def main():
    D = js("pres/datos.json")
    A = js("pres/adicionales.json")
    out = {"paises": [NOMBRE.get(p, p) for p in ORDEN]}

    # ---------------- BCE, MIR ----------------
    out["mir"] = {
        "tramos": {k: D["tramos"][k] for k in
                   ("Hasta 0,25 M EUR", "Mas de 0,25 y hasta 1 M EUR", "Mas de 1 M EUR")},
        "peso1m": D["peso1m"],
        "prima": A["prima"],
        "circ": D["circ"]["tipo"],
        "prestamo_total": D["circ"]["prestamo_total"],
    }
    rec = collections.defaultdict(dict)
    for r in lee("liquidez/coste_recursos_sistema.csv"):
        rec[r["pais"]][r["metrica"]] = float(r["valor"])
    MET = {"empresa": "Coste de los depositos de empresa",
           "hogares": "Coste de los depositos de hogares",
           "sistema": "Coste de los depositos del sistema"}
    out["mir"]["depositos"] = {k: [round(rec[p][m], 2) for p in ORDEN]
                               for k, m in MET.items()}

    # ---------------- BCE, SAFE ----------------
    R = A["rechazo"]
    out["safe"] = {"rechazo": R}
    fg = collections.defaultdict(dict)
    for r in lee("transversal/safe_fg.csv"):
        m = r["metrica"]
        if "PYME (<250" in m and "media ponderada" in m and r["pais"] in ("Espana", "Zona euro (referencia)"):
            fg[r["pais"]][r["periodo_referencia"]] = float(r["valor"])
    pers = sorted(set(fg["Espana"]) & set(fg["Zona euro (referencia)"]))
    pers = [p for p in pers if p >= "2015"]
    out["safe"]["brecha"] = {"periodos": pers,
                             "es": [round(fg["Espana"][p], 1) for p in pers],
                             "u2": [round(fg["Zona euro (referencia)"][p], 1) for p in pers]}

    # ---------------- EBA, Risk Dashboard (FINREP) ----------------
    npl = collections.defaultdict(dict)
    serie = collections.defaultdict(dict)
    saldo = collections.defaultdict(dict)
    nplimp = collections.defaultdict(dict)
    saldo_serie = collections.defaultdict(dict)
    # el inmueble comercial lo escribe el mismo extractor en hipotecas/
    for r in lee("transversal/eba_cartera.csv") + lee("hipotecas/eba_cartera.csv"):
        met, _, seg = r["metrica"].partition(" | ")
        if met == "Ratio de NPL":
            if r["periodo_referencia"] == "2026-Q1":
                npl[r["pais"]][seg] = float(r["valor"])
            if seg == "Sociedades no financieras, PYME":
                serie[r["pais"]][r["periodo_referencia"]] = float(r["valor"])
        if met == "Saldo bruto" and seg == "Sociedades no financieras, PYME":
            saldo_serie[r["pais"]][r["periodo_referencia"]] = float(r["valor"])
        if r["periodo_referencia"] == "2026-Q1":
            if met == "Saldo bruto":
                saldo[r["pais"]][seg] = float(r["valor"])
            if met == "Importe de NPL":
                nplimp[r["pais"]][seg] = float(r["valor"])
    qs = sorted(serie["Espana"])
    H, E = "Hogares", "Sociedades no financieras"
    out["eba_rd"] = {
        "segmentos": {
            "hogares": [npl[p][H] for p in ORDEN],
            "empresas": [npl[p][E] for p in ORDEN],
            "pyme": [npl[p][E + ", PYME"] for p in ORDEN],
            "cre": [npl[p][E + ", inmueble comercial (CRE)"] for p in ORDEN]},
        "clientela": [round(100 * (nplimp[p][H] + nplimp[p][E]) / (saldo[p][H] + saldo[p][E]), 2)
                      for p in ORDEN],
        "peso_pyme_empresas": [round(100 * saldo[p][E + ", PYME"] / saldo[p][E], 1) for p in ORDEN],
        # tamano del mercado: saldo bruto de prestamos a PYME (FINREP), M EUR
        "saldo_pyme": {
            "periodo": "2026-Q1",
            "valores": [round(saldo[p][E + ", PYME"]) for p in ORDEN],
            "ue": round(saldo["Union Europea"][E + ", PYME"]),
            "empresas": [round(saldo[p][E]) for p in ORDEN],
            "serie": {NOMBRE.get(p, p): [round(saldo_serie[p][q]) for q in qs] for p in ORDEN}},
        # contraste: exposicion PYME del Transparency Exercise (junio 2025)
        "te_exposicion": D["eu_desc"]["exposicion"],
        "serie": {"trimestres": qs,
                  "valores": {NOMBRE.get(p, p): [serie[p][q] for q in qs] for p in ORDEN}},
    }

    # ---------------- EBA, Risk Dashboard: eficiencia del sistema ----------------
    # cost-to-income (PFT_23), acumulado del ano: el cuarto trimestre es el
    # ano completo; el primero carga contribuciones anuales y se evita
    ef = collections.defaultdict(dict)
    for r in lee("transversal/eba_indicadores.csv"):
        if r["metrica"] == "Ratio de eficiencia (cost-to-income)":
            ef[r["pais"]][r["periodo_referencia"]] = round(float(r["valor"]), 1)
    qe = sorted(ef["Espana"])
    out["eficiencia"] = {
        "anios": ["2024", "2025"],
        "valores": {"2024": [ef[p]["2024-Q4"] for p in ORDEN],
                    "2025": [ef[p]["2025-Q4"] for p in ORDEN]},
        "ue": {"2024": ef["Union Europea"]["2024-Q4"], "2025": ef["Union Europea"]["2025-Q4"]},
        "q1_2026": [ef[p]["2026-Q1"] for p in ORDEN],
        "trimestres": qe,
        "serie": {NOMBRE.get(p, p): [ef[p][q] for q in qe] for p in ORDEN + ["Union Europea"]}}

    # ---------------- Informacion crediticia ----------------
    mr = collections.defaultdict(dict)
    for r in lee("transversal/marco_riesgo.csv"):
        mr[r["metrica"]][r["pais"]] = float(r["valor"])
    g = lambda m: [mr[m][p] for p in ORDEN]
    out["info"] = {
        "registro": g("Cobertura del registro publico de credito"),
        "bureau": g("Cobertura del bureau privado de credito"),
        "profundidad": g("Profundidad de la informacion crediticia"),
        "util_registro": g("Utilidad del registro publico para PYME"),
        "cuentas": g("Disponibilidad de cuentas depositadas"),
        "indice": [round(v, 1) for v in g("Indice de informacion para la seleccion")]}

    # ---------------- EBA, COREP C 9.02 (IRB) ----------------
    out["corep"] = {k: D["irb"][k] for k in ("pd", "lgd", "cor")}

    # ---------------- EBA, Transparency Exercise ----------------
    dn = js("pres/dens_sa_irb.json")
    clave = {"España": "Espana"}
    out["te"] = {k: [dn[clave.get(p, p)][k] for p in out["paises"]]
                 for k in ("sa", "irb", "total", "cuota_irb")}
    B = D["bancos"]
    out["te"]["bancos"] = {k: B[k] for k in ("nombres", "exposicion", "densidad",
                                              "mora", "cobertura")}

    # ---------------- OCDE ----------------
    oc = collections.defaultdict(dict)
    for r in lee("prestamos_personales/oecd_scoreboard.csv"):
        if r["metrica"].startswith("Spread"):
            oc[r["pais"]][r["periodo_referencia"]] = float(r["valor"])
    anios = [str(a) for a in range(2011, 2023)]
    out["ocde"] = {"anios": anios,
                   "spread": {NOMBRE.get(p, p): [oc[p].get(a) for a in anios]
                              for p in ORDEN if p in oc}}

    # ---------------- Banco de Espana, Boletin ----------------
    tae, tedr, cuna, vol = (collections.defaultdict(dict) for _ in range(4))
    for r in lee("prestamos_personales/bde_boletin.csv"):
        if not r["periodo_referencia"].startswith("2026") or r["plazo_fijacion"] != "Total":
            continue
        t, per, v = r["tramo_importe"], r["periodo_referencia"], float(r["valor"])
        m = r["metrica"]
        (tae if m.startswith("TAE") else tedr if m.startswith("TEDR")
         else cuna if m.startswith("Cuna") else vol if m.startswith("Volumen")
         else {})[t][per] = v

    def pond(d, t):
        ms = [m for m in d[t] if m in vol[t]]
        return sum(d[t][m] * vol[t][m] for m in ms) / sum(vol[t][m] for m in ms)
    TR = ["Hasta 0,25 M EUR", "Mas de 0,25 y hasta 1 M EUR", "Mas de 1 M EUR"]
    out["bde"] = {"tramos": ["≤0,25 M€", "0,25–1 M€", ">1 M€"],
                  "tedr": [round(pond(tedr, t), 2) for t in TR],
                  "tae": [round(pond(tae, t), 2) for t in TR],
                  "cuna": [round(pond(cuna, t)) for t in TR],
                  "autonomos": D["autonomos"]}

    # ---------------- Central de Balances, CESGAR ----------------
    out["cb"] = dict(D["cb"])
    # La serie historica se reconstruye desde el CSV: en datos.json estaba
    # puesta a mano y ningun extractor la generaba.
    ser = {}
    for r in lee("transversal/cb_pymes.csv"):
        if r["metrica"] == "Diferencia entre rentabilidad y coste financiero | Pequenas":
            ser[r["periodo_referencia"]] = float(r["valor"])
    out["cb"]["dif_serie"] = [[a, ser[a]] for a in sorted(ser) if a >= "2015"]
    out["cesgar"] = D["cesgar"]

    # ---------------- Factoring ----------------
    ef = collections.defaultdict(dict)
    for r in lee("factoring_confirming/euf_factoring.csv"):
        ef[r["pais"]][r["metrica"]] = float(r["valor"])
    fn = {}
    for r in lee("factoring_confirming/factoring_nacional.csv"):
        if r["metrica"] == "Peso del confirming sobre el total":
            fn[r["pais"]] = float(r["valor"])
    out["factoring"] = {
        "pib": [ef[p]["Penetracion sobre el PIB"] for p in ORDEN],
        "volumen": [ef[p]["Volumen cedido (turnover)"] for p in ORDEN],
        "confirming": {NOMBRE.get(p, p): v for p, v in fn.items()},
        "irlanda": A["factoring"]["Irlanda"]}

    # ---------------- Banco Mundial ----------------
    out["marco"] = {k: D["marco"][k] for k in ("info", "recobro", "recovery", "tiempo", "coste", "legal")}

    # ---------------- Bancos ----------------
    out["bancos_ue"] = js("pres/comparables_ratios.json")

    # ---------------- sintesis: relaciones entre datos observados ----------------
    precio = D["tramos"]["Hasta 1 M EUR"]
    out["sintesis"] = {
        "precio_1m": precio,
        "rho_precio_pd": round(pearson(precio, D["irb"]["pd"]), 2),
        "rho_precio_cor": round(pearson(precio, D["irb"]["cor"]), 2),
        "rho_recobro_cor": round(pearson(D["marco"]["recobro"], D["irb"]["cor"]), 2),
        "rho_info_pd": round(pearson(D["marco"]["info"], D["irb"]["pd"]), 2),
        "rho_recobro_lgd": round(pearson(D["marco"]["recobro"], D["irb"]["lgd"]), 2),
    }
    json.dump(out, open(os.path.join(ROOT, "pres", "descriptiva.json"), "w"),
              indent=1, ensure_ascii=False)

    # --- control ---
    print("paises:", out["paises"])
    print("cuna por tramo 2026:", out["bde"]["cuna"], "pb · TAE", out["bde"]["tae"], "· TEDR", out["bde"]["tedr"])
    print("mora 2026-Q1 PYME:", out["eba_rd"]["segmentos"]["pyme"])
    print("mora clientela:", out["eba_rd"]["clientela"])
    print("peso PYME en empresas:", out["eba_rd"]["peso_pyme_empresas"])
    print("trimestres mora:", qs[0], "..", qs[-1])
    print("brecha SAFE:", pers[0], "..", pers[-1])
    print("OCDE paises:", list(out["ocde"]["spread"]))
    print("sintesis:", out["sintesis"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
