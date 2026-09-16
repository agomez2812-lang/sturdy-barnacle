#!/usr/bin/env python3
"""Modelo de rentabilidad del prestamo PYME por pais.

TRAZABILIDAD. Cada linea del modelo es OBSERVADA o SUPUESTA, y el CSV de
salida lo declara en la columna `tipo_de_dato` y en `notas`:

  OBSERVADO  precio, coste de recursos, coste del riesgo del sistema, NPL de
             PYME y del total, eficiencia y CET1.
  SUPUESTO   la cuna de comisiones fuera de Espana, el escalado del coste del
             riesgo a PYME, la densidad de RWA y el tipo impositivo.

El supuesto que mas pesa es la cuna de comisiones: solo Espana publica un
tipo con comisiones para empresas (notas.md 2.23-2.24). Para los otros cinco
paises se APLICA LA CUNA ESPANOLA. El ranking entre paises depende de ese
supuesto, y por eso el script emite tambien un barrido de sensibilidad.

Uso:
    python3 scripts/modelo_roe.py
"""
import collections
import csv
import os
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAISES = ["Espana", "Alemania", "Francia", "Italia", "Portugal", "Paises Bajos", "Irlanda"]
ANIO = "2026"
TRAMO = "Hasta 1 M EUR"
PLAZO = "Total initial rate fixation"

# --- supuestos, todos declarados en el CSV de salida ---
TASA_IMPOSITIVA = 0.25          # tipo efectivo uniforme
# La densidad de RWA y el coste del riesgo ya NO son supuestos: se leen de
# las dos extracciones nuevas. DENSIDAD_RWA solo queda como respaldo si
# faltara el dato de algun pais.
DENSIDAD_RWA = 0.57             # respaldo: 75% retail PYME x factor CRR 501
CUNA_ES_FALLBACK = 60.0         # pb, si no se puede calcular de los datos
# El coste del riesgo del EBA es de GRUPO y esta contaminado por el negocio
# internacional y de consumo de los grandes grupos: para Espana da 1,22%
# frente al 0,24% que reporta CaixaBank, domestica. No sirve como CoR de
# PYME. Se modela desde el NPL de PYME, que si es del segmento, con un factor
# flujo/stock calibrado para reproducir los dos costes de riesgo de segmento
# que si estan observados: ABN AMRO Corporate Banking 0,15% y CaixaBank 0,24%.
FACTOR_FLUJO_STOCK = 0.06       # ya no se usa; se conserva por trazabilidad
EURIBOR_3M = 2.23               # media 2026; alternativa de fondeo en mercado
DFR_BCE = 2.09                  # facilidad de deposito del BCE, media 2026


def lee(path):
    p = os.path.join(ROOT, path)
    return list(csv.DictReader(open(p, encoding="utf-8"))) if os.path.exists(p) else []


def media_ponderada(tip, vol, anio):
    m = [k for k in sorted(tip) if k.startswith(anio) and k in vol]
    if not m:
        return None
    W = sum(vol[k] for k in m)
    return sum(tip[k] * vol[k] for k in m) / W if W else None


def cuna_espanola():
    """Cuna TAE-TEDR del tramo <=1 M, ponderada por volumen de los dos
    subtramos que lo componen (<=0,25 M y 0,25-1 M)."""
    r = lee("prestamos_personales/bde_boletin.csv")
    cu, vo = collections.defaultdict(dict), collections.defaultdict(dict)
    for x in r:
        if not x["periodo_referencia"].startswith(ANIO):
            continue
        if x["metrica"].startswith("Cuna"):
            cu[x["tramo_importe"]][x["periodo_referencia"]] = float(x["valor"])
        elif x["metrica"].startswith("Volumen") and x["plazo_fijacion"] == "Total":
            vo[x["tramo_importe"]][x["periodo_referencia"]] = float(x["valor"])
    num = den = 0.0
    for tr in ("Hasta 0,25 M EUR", "Mas de 0,25 y hasta 1 M EUR"):
        meses = [k for k in cu.get(tr, {}) if k in vo.get(tr, {})]
        for k in meses:
            num += cu[tr][k] * vo[tr][k]; den += vo[tr][k]
    return num / den if den else CUNA_ES_FALLBACK


def recoge():
    """Devuelve el cuadro de entradas observadas por pais."""
    mir = lee("prestamos_personales/prestamos_empresas_ecb_mir.csv")
    tip, vol = collections.defaultdict(dict), collections.defaultdict(dict)
    for x in mir:
        if x["tramo_importe"] != TRAMO or x["plazo_fijacion"] != PLAZO:
            continue
        d = tip if x["unidad"] == "pct_anual" else vol if x["unidad"] == "eur_millones" else None
        if d is not None:
            d[x["pais"]][x["periodo_referencia"]] = float(x["valor"])

    dep = collections.defaultdict(list)
    for x in lee("liquidez/liquidez_ecb_mir.csv"):
        if (x["unidad"] == "pct_anual" and x["periodo_referencia"].startswith(ANIO)
                and "plazo" in x["metrica"]):
            dep[x["pais"]].append(float(x["valor"]))

    ind = collections.defaultdict(dict)
    for x in lee("transversal/eba_indicadores.csv"):
        if x["periodo_referencia"] == "2026-Q1":
            ind[x["pais"]][x["metrica"]] = float(x["valor"])

    npl = collections.defaultdict(dict)
    for x in lee("transversal/eba_cartera.csv"):
        if x["periodo_referencia"] == "2026-Q1" and x["metrica"].startswith("Ratio de NPL"):
            npl[x["pais"]][x["metrica"].split("| ")[1]] = float(x["valor"])

    # Coste del riesgo OBSERVADO: PD x LGD de la clase IRB de PYME.
    cor_obs = {}
    for x in lee("transversal/eba_parametros_riesgo.csv"):
        if x["metrica"].startswith("Coste del riesgo PYME"):
            cor_obs[x["pais"]] = float(x["valor"])
    # Coste de los recursos de empresa, ponderado por la mezcla real de
    # vista y plazo de cada pais (scripts/coste_recursos.py).
    coste_rec = {}
    for x in lee("liquidez/coste_recursos_pyme.csv"):
        if x["metrica"].startswith("Coste ponderado"):
            coste_rec[x["pais"]] = float(x["valor"])

    # Densidad de RWA OBSERVADA de la cartera PYME.
    dens_obs = {}
    for x in lee("transversal/eba_te_capital_pyme.csv"):
        if x["metrica"].startswith("Densidad de RWA"):
            dens_obs[x["pais"]] = float(x["valor"]) / 100.0

    out = {}
    for p in PAISES:
        precio = media_ponderada(tip.get(p, {}), vol.get(p, {}), ANIO)
        if precio is None:
            continue
        i = ind.get(p, {})
        n = npl.get(p, {})
        out[p] = {
            "precio": precio,
            "coste_recursos": statistics.mean(dep[p]) if dep.get(p) else None,
            "cor_sistema": i.get("Coste del riesgo"),
            "eficiencia": i.get("Ratio de eficiencia (cost-to-income)"),
            "cet1": i.get("Ratio CET1"),
            "npl_pyme": n.get("Sociedades no financieras, PYME"),
            "npl_total": n.get("Total prestamos y anticipos"),
            "cor_pyme": cor_obs.get(p),
            "densidad": dens_obs.get(p, DENSIDAD_RWA),
            "coste_rec": coste_rec.get(p),
        }
    return out


def modelo(e, cuna_pb, k=FACTOR_FLUJO_STOCK):
    """Cuenta de resultados del prestamo, en % del saldo medio, y ROE.

    Todo en PORCENTAJE sobre saldo medio. El capital asignado tambien, para
    que el ROE salga en porcentaje sin conversiones adicionales.
    """
    ingreso = e["precio"] + cuna_pb / 100.0
    # Coste de fondos = coste ponderado de los recursos de empresa del pais,
    # no el Euribor. Supone que el credito PYME se financia con el deposito
    # de empresa, que es el planteamiento de banca de relacion. El fondeo en
    # mercado (Euribor) seria el otro extremo y da ROE mucho menores.
    fondos = e["coste_rec"] if e.get("coste_rec") is not None else EURIBOR_3M
    margen = ingreso - fondos
    # Coste del riesgo: PD x LGD de la clase IRB de PYME (observado).
    cor = e["cor_pyme"] if e.get("cor_pyme") is not None else e["npl_pyme"] * k
    opex = margen * (e["eficiencia"] / 100.0)
    bai = margen - cor - opex
    capital_pct = e["densidad"] * e["cet1"]        # en % del saldo
    roe = (bai * (1 - TASA_IMPOSITIVA)) / capital_pct * 100 if capital_pct else None
    return dict(ingreso=ingreso, comisiones=cuna_pb / 100.0, margen=margen,
                fondos=fondos, cor=cor, opex=opex, bai=bai,
                capital=capital_pct, roe=roe)


def main():
    cuna_es = cuna_espanola()
    ent = recoge()
    faltan = [p for p in PAISES if p not in ent or any(v is None for v in ent[p].values())]
    if faltan:
        print("aviso: entradas incompletas en %s" % faltan)

    destino = os.path.join(ROOT, "transversal", "modelo_roe_pyme.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0

    print("\nCuna de comisiones observada en Espana, tramo <=1 M, %s: %.0f pb\n"
          % (ANIO, cuna_es))
    print("%-14s %7s %7s %7s %7s %7s %7s %8s" % (
        "", "precio", "comis", "fondos", "CoR", "gastos", "BAI", "ROE"))
    for p in PAISES:
        if p not in ent or any(v is None for v in ent[p].values()):
            continue
        m = modelo(ent[p], cuna_es)
        print("%-14s %7.2f %7.2f %7.2f %7.2f %7.2f %7.2f %7.1f%%" % (
            p[:13], ent[p]["precio"], m["comisiones"], m["fondos"],
            m["cor"], m["opex"], m["bai"], m["roe"]))
        obs = p == "Espana"
        for metrica, valor, unidad, td, nota in [
            ("Precio (tipo MIR, tramo <=1 M)", ent[p]["precio"], "pct_anual", "nivel",
             "OBSERVADO. MIR, media 2026 ponderada por volumen"),
            ("Comisiones", m["comisiones"], "pct_anual", "nivel",
             ("OBSERVADO. Cuna TAE-TEDR del Boletin Estadistico"
              if obs else
              "SUPUESTO. Se aplica la cuna espanola de %.0f pb; este pais no "
              "publica tipo con comisiones para empresas" % cuna_es)),
            ("Ingreso total", m["ingreso"], "pct_anual", "nivel",
             "precio mas comisiones"),
            ("Coste de los recursos de empresa", m["fondos"], "pct_anual", "nivel",
             "OBSERVADO. Tipos de deposito del MIR ponderados por los saldos "
             "del BSI. SUPUESTO asociado: el credito PYME se financia con "
             "deposito de empresa. Con fondeo en mercado (Euribor %.2f%%) el "
             "ROE seria muy inferior" % EURIBOR_3M),
            ("Margen bruto", m["margen"], "pct_anual", "nivel", "ingreso menos coste"),
            ("Coste del riesgo", m["cor"], "pct_cartera", "ratio",
             "OBSERVADO. PD por LGD de la clase IRB 'Corporates - Of Which: "
             "SME', mediana de entidades declarantes, COREP C 9.02"),
            ("Gastos de explotacion", m["opex"], "pct_cartera", "ratio",
             "SUPUESTO parcial. Eficiencia del EBA (grupo) aplicada al margen"),
            ("Resultado antes de impuestos", m["bai"], "pct_cartera", "ratio",
             "margen menos riesgo menos gastos"),
            ("Capital asignado", m["capital"], "pct_rwa", "ratio",
             "OBSERVADO. Densidad de RWA de la cartera PYME %.1f%% (EBA "
             "Transparency Exercise) sobre CET1 observado"
             % (100 * ent[p]["densidad"])),
            ("ROE del prestamo PYME", m["roe"], "pct_roe", "ratio",
             "MODELIZADO. Tipo impositivo supuesto %.0f%%" % (100 * TASA_IMPOSITIVA)),
        ]:
            w.writerow(schema.row(
                pais=p, producto="prestamo_pyme_modelo", metrica=metrica,
                valor="%.4f" % valor, unidad=unidad, periodo_referencia=ANIO,
                fuente="Modelo propio sobre BCE (MIR), EBA y Banco de Espana",
                url="", fecha_publicacion=hoy,
                tramo_importe=TRAMO, plazo_fijacion=PLAZO,
                criterio_segmentacion="tamano_prestamo", tipo_de_dato=td,
                ponderacion="media_ponderada_volumen", notas=nota)); n += 1

    # --- sensibilidad: como cambia el ROE segun la cuna asumida ---
    print("\nSENSIBILIDAD DEL ROE A LA CUNA DE COMISIONES (pb)\n")
    barrido = [0, 25, 50, int(round(cuna_es)), 100, 150]
    print("%-14s %s" % ("", "".join("%9s" % ("%d pb" % c) for c in barrido)))
    for p in PAISES:
        if p not in ent or any(v is None for v in ent[p].values()):
            continue
        fila = []
        for c in barrido:
            m = modelo(ent[p], c)
            fila.append("%8.1f%%" % m["roe"])
            w.writerow(schema.row(
                pais=p, producto="prestamo_pyme_modelo",
                metrica="ROE con cuna de comisiones de %d pb" % c,
                valor="%.4f" % m["roe"], unidad="pct_roe",
                periodo_referencia=ANIO,
                fuente="Modelo propio, analisis de sensibilidad", url="",
                fecha_publicacion=hoy, tramo_importe=TRAMO, plazo_fijacion=PLAZO,
                criterio_segmentacion="tamano_prestamo", tipo_de_dato="ratio",
                ponderacion="media_ponderada_volumen",
                notas="SENSIBILIDAD. Cuna supuesta, no observada salvo en "
                      "Espana")); n += 1
        print("%-14s %s" % (p[:13], "".join(fila)))
    # --- negocio de deposito: lo que el banco gana por la liquidez de las
    # empresas frente a lo que puede obtener en el BCE ---
    dep = collections.defaultdict(lambda: collections.defaultdict(list))
    for x in lee("liquidez/liquidez_ecb_mir.csv"):
        if x["unidad"] == "pct_anual" and x["periodo_referencia"].startswith(ANIO):
            k = "vista" if "vista" in x["metrica"] else "plazo"
            dep[x["pais"]][k].append(float(x["valor"]))
    print("\nNEGOCIO DE DEPOSITO: margen sobre la facilidad del BCE (%.2f%%)\n"
          % DFR_BCE)
    print("%-14s %10s %10s %12s" % ("", "vista", "plazo", "margen vista"))
    for p2 in PAISES:
        v = dep.get(p2, {})
        if not v.get("vista"):
            continue
        mv = statistics.mean(v["vista"])
        mp = statistics.mean(v["plazo"]) if v.get("plazo") else float("nan")
        margen = DFR_BCE - mv
        print("%-14s %10.2f %10.2f %11.2f%%" % (p2[:13], mv, mp, margen))
        for metrica, valor, nota in [
            ("Tipo pagado por deposito a la vista", mv,
             "OBSERVADO. MIR, media 2026"),
            ("Tipo pagado por deposito a plazo", mp,
             "OBSERVADO. MIR, media 2026"),
            ("Margen sobre la facilidad de deposito del BCE", margen,
             "facilidad del BCE %.2f%% menos tipo de vista pagado" % DFR_BCE),
        ]:
            if valor != valor:
                continue
            w.writerow(schema.row(
                pais=p2, producto="deposito_empresas", metrica=metrica,
                valor="%.4f" % valor, unidad="pct_anual",
                periodo_referencia=ANIO,
                fuente="BCE, datasets MIR y FM", url="", fecha_publicacion=hoy,
                criterio_segmentacion="n/a", tipo_de_dato="nivel",
                ponderacion="media_simple", notas=nota)); n += 1

    fh.close()
    print("\n%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
