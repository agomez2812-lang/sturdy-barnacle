# -*- coding: utf-8 -*-
"""Precio y ROE del circulante, frente al prestamo PYME.

Dos cosas:

1. COMPARATIVA DE PRECIO. El MIR publica el tipo de revolving y descubiertos
   (serie A2Z1) y el tipo del prestamo por tramo de importe. Se comparan,
   con una advertencia de perimetro que hay que mantener siempre a la vista:
   **A2Z1 no tiene tramo de importe**. Solo existe la categoria total, asi
   que el circulante mezcla PYME y gran empresa mientras que el prestamo
   PYME es el tramo <=1 M EUR. Por eso se compara contra los dos: el tramo
   PYME y el total de empresas, que es el perimetro homologo.

2. ROE DEL CIRCULANTE. Una linea de credito se cobra por dos sitios: un tipo
   sobre el DISPUESTO y una comision de disponibilidad sobre el DISPONIBLE.
   Y consume capital por los dos: el disponible entra en la exposicion por
   un factor de conversion (CCF).

   Todo se expresa POR EURO DISPUESTO, para que sea comparable con el
   modelo del prestamo. Con u = tasa de disposicion (dispuesto / limite), el
   disponible por euro dispuesto es (1-u)/u.

       ingreso = tipo + f_disp * (1-u)/u
       EAD     = 1 + CCF * (1-u)/u
       margen  = ingreso - coste de los recursos        (solo se fondea lo dispuesto)
       CoR     = coste del riesgo PYME * EAD
       gastos  = margen * eficiencia
       BAI     = margen - CoR - gastos
       capital = densidad de RWA * CET1 * EAD
       ROE     = BAI * (1 - t) / capital

DOS HUECOS DUROS, que son supuestos declarados y no datos:

  * la COMISION DE DISPONIBILIDAD no la publica ninguna estadistica. Ni
    siquiera el Boletin del Banco de Espana, que si publica TAE de prestamo
    por tramo (cuadro 19.6) pero NO de descubiertos y lineas de credito.
  * la TASA DE DISPOSICION tampoco. Se busco en el catalogo de series del
    Banco de Espana (ninguna serie de riesgo disponible o limite) y en el
    Transparency Exercise del EBA, cuyo unico dato fuera de balance
    (2520606) es del banco entero y sin desglose por sector.

Por eso el script emite una REJILLA de sensibilidad sobre los dos, ademas
del caso base. El caso base no es una estimacion: es un punto de la rejilla.

El CCF si es un parametro regulatorio, no un hueco: el CRR3, en vigor desde
2025, subio del 0 % al 10 % el factor de los compromisos cancelables
incondicionalmente, que es la figura tipica de la poliza de credito a PYME.
Los compromisos no cancelables van al 40 %. Se calculan los dos.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import collections
import csv
import os
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAISES = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
          "Paises Bajos", "Irlanda"]
ANIO = "2026"
PLAZO = "Total initial rate fixation"
HOY = "2026-09-17"

TIPO_IMPOSITIVO = {
    "Espana": 0.300, "Alemania": 0.301, "Francia": 0.258, "Italia": 0.278,
    "Portugal": 0.295, "Paises Bajos": 0.258, "Irlanda": 0.150,
}

# --- supuestos del caso base, los dos declarados en cada fila de salida ---
U_BASE = 0.60          # tasa de disposicion: dispuesto / limite
F_DISP_BASE = 0.30     # comision de disponibilidad, % anual sobre disponible
CCF_UCC = 0.10         # compromiso cancelable incondicionalmente, CRR3
CCF_NO_UCC = 0.40      # compromiso no cancelable

U_GRID = [0.40, 0.50, 0.60, 0.70, 0.80, 1.00]
F_GRID = [0.00, 0.15, 0.30, 0.50, 0.75]


def lee(rel):
    ruta = os.path.join(ROOT, rel)
    if not os.path.exists(ruta):
        sys.exit("falta %s" % rel)
    return list(csv.DictReader(open(ruta, encoding="utf-8")))


def media_ponderada(tipos, vols):
    """Media del anio ponderada por volumen; simple si no hay volumen."""
    meses = [k for k in tipos if k.startswith(ANIO)]
    if not meses:
        return None
    con = [k for k in meses if k in vols and vols[k]]
    if con:
        return (sum(tipos[k] * vols[k] for k in con)
                / sum(vols[k] for k in con)), "media_ponderada_volumen"
    return statistics.mean(tipos[k] for k in meses), "media_simple"


def precios():
    """Tipo de circulante y de prestamo, por tramo, de cada pais."""
    circ = collections.defaultdict(dict)
    for x in lee("circulante/circulante_ecb_mir.csv"):
        if (x["unidad"] == "pct_anual"
                and x["metrica"].startswith("tipo (revolving y descubiertos)")):
            circ[x["pais"]][x["periodo_referencia"]] = float(x["valor"])

    tip = collections.defaultdict(lambda: collections.defaultdict(dict))
    vol = collections.defaultdict(lambda: collections.defaultdict(dict))
    for x in lee("prestamos_personales/prestamos_empresas_ecb_mir.csv"):
        if x["plazo_fijacion"] != PLAZO:
            continue
        d = (tip if x["unidad"] == "pct_anual"
             else vol if x["unidad"] == "eur_millones" else None)
        if d is not None:
            d[x["pais"]][x["tramo_importe"]][x["periodo_referencia"]] = \
                float(x["valor"])

    out = {}
    for p in PAISES:
        if p not in circ:
            continue
        mc = [v for k, v in circ[p].items() if k.startswith(ANIO)]
        fila = {"circulante": statistics.mean(mc) if mc else None}
        for tr, clave in (("Hasta 1 M EUR", "prestamo_pyme"),
                          ("Total", "prestamo_total")):
            r = media_ponderada(tip[p].get(tr, {}), vol[p].get(tr, {}))
            fila[clave] = r[0] if r else None
            fila[clave + "_pond"] = r[1] if r else None
        out[p] = fila
    return out


def entradas():
    """Coste de los recursos, riesgo, capital, eficiencia y fiscalidad.

    Se devuelven DOS juegos de riesgo y capital, porque el perimetro del
    precio obliga a ello:

      `cor` / `densidad`            cartera PYME. Es lo que usa el modelo
                                    del prestamo, cuyo precio SI es del
                                    tramo <=1 M EUR.
      `cor_emp` / `densidad_emp`    total de empresas. Es el perimetro
                                    HOMOLOGO del tipo de circulante, que el
                                    MIR solo publica para el total de
                                    sociedades no financieras.
    """
    e = collections.defaultdict(dict)
    for x in lee("liquidez/coste_recursos_pyme.csv"):
        if x["metrica"].startswith("Coste ponderado"):
            e[x["pais"]]["coste_rec"] = float(x["valor"])
    pd_lgd = collections.defaultdict(dict)
    for x in lee("transversal/eba_parametros_riesgo.csv"):
        if x["metrica"].startswith("Coste del riesgo PYME"):
            e[x["pais"]]["cor"] = float(x["valor"])
        elif x["metrica"] == "PD ajustada (mediana) | Empresas, total":
            pd_lgd[x["pais"]]["pd"] = float(x["valor"])
        elif x["metrica"] == "LGD (mediana) | Empresas, total":
            pd_lgd[x["pais"]]["lgd"] = float(x["valor"])
    for pais, v in pd_lgd.items():
        if "pd" in v and "lgd" in v:
            e[pais]["cor_emp"] = v["pd"] * v["lgd"] / 100.0
    for x in lee("transversal/eba_te_capital_pyme.csv"):
        if x["metrica"].startswith("Densidad de RWA"):
            e[x["pais"]]["densidad"] = float(x["valor"]) / 100.0
    for x in lee("transversal/eba_te_capital_empresas.csv"):
        if x["metrica"] == "Densidad de RWA de la cartera de empresas":
            e[x["pais"]]["densidad_emp"] = float(x["valor"]) / 100.0
    for x in lee("transversal/eba_indicadores.csv"):
        if x["periodo_referencia"] != "2026-Q1":
            continue
        if x["metrica"].startswith("Ratio de eficiencia"):
            e[x["pais"]]["eficiencia"] = float(x["valor"]) / 100.0
        elif x["metrica"].startswith("Ratio CET1"):
            # en PUNTOS PORCENTUALES, no en tanto por uno: asi el capital
            # asignado sale ya en % del saldo y el ROE en % sin conversiones,
            # igual que en scripts/modelo_roe.py
            e[x["pais"]]["cet1"] = float(x["valor"])
    return e


def cuenta(tipo_circ, ent, u, f_disp, ccf, t, perimetro="empresas"):
    """Cuenta del circulante por euro DISPUESTO.

    `perimetro` elige el juego de riesgo y capital:
      "empresas" (por defecto) es el HOMOLOGO del precio del MIR;
      "pyme" replica los parametros del modelo del prestamo, para poder
      ver cuanto del resultado viene del perimetro y no del negocio.
    """
    suf = "_emp" if perimetro == "empresas" else ""
    libre = (1.0 - u) / u                      # disponible por euro dispuesto
    ingreso = tipo_circ + f_disp * libre
    ead = 1.0 + ccf * libre
    margen = ingreso - ent["coste_rec"]
    cor = ent["cor" + suf] * ead
    gastos = margen * ent["eficiencia"]
    bai = margen - cor - gastos
    capital = ent["densidad" + suf] * ent["cet1"] * ead
    roe = bai * (1.0 - t) / capital * 100.0 if capital else float("nan")
    return {"libre": libre, "ingreso": ingreso, "ead": ead, "margen": margen,
            "cor": cor, "gastos": gastos, "bai": bai, "capital": capital,
            "roe": roe}


def main():
    pr = precios()
    ent = entradas()
    falta = [p for p in PAISES
             if p not in pr or any(k not in ent[p] for k in
                                   ("coste_rec", "cor", "cor_emp",
                                    "densidad", "densidad_emp",
                                    "eficiencia", "cet1"))]
    if falta:
        sys.exit("faltan entradas para: %s" % falta)

    destino = os.path.join(ROOT, "circulante", "modelo_roe_circulante.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    n = 0

    def emite(pais, metrica, valor, unidad, td, nota, pond="dato_unico",
              producto="circulante_modelo", tramo=""):
        nonlocal n
        w.writerow(schema.row(
            pais=pais, producto=producto, metrica=metrica,
            valor="%.4f" % valor, unidad=unidad, periodo_referencia=ANIO,
            fuente="calculo propio sobre BCE (MIR), EBA (COREP C 9.02, "
                   "Transparency Exercise y Risk Dashboard)",
            url="", fecha_publicacion=HOY, tramo_importe=tramo,
            criterio_segmentacion="tamano_prestamo" if tramo else "n/a",
            tipo_de_dato=td, ponderacion=pond, notas=nota))
        n += 1

    # --- 1. comparativa de precio ---
    print("PRECIO: circulante frente a prestamo, en %%, media %s\n" % ANIO)
    print("%-14s %11s %12s %12s %11s %11s"
          % ("", "circulante", "prest.<=1M", "prest.total",
             "dif vs PYME", "dif vs tot"))
    for p in PAISES:
        c, a, b = (pr[p]["circulante"], pr[p]["prestamo_pyme"],
                   pr[p]["prestamo_total"])
        print("%-14s %10.2f%% %11.2f%% %11.2f%% %10d %10d"
              % (p[:13], c, a, b, round((c - a) * 100), round((c - b) * 100)))
        emite(p, "Tipo del circulante", c, "pct_anual", "nivel",
              "MIR serie A2Z1, revolving y descubiertos a sociedades no "
              "financieras. SIN tramo de importe: el MIR solo publica la "
              "categoria total, asi que mezcla PYME y gran empresa",
              pond="media_simple")
        emite(p, "Diferencia de precio del circulante frente al prestamo PYME",
              round((c - a) * 100), "pb", "nivel",
              "circulante (todas las empresas) menos prestamo del tramo "
              "<=1 M EUR; los perimetros NO coinciden",
              pond=pr[p]["prestamo_pyme_pond"])
        emite(p, "Diferencia de precio del circulante frente al prestamo "
                 "total de empresas", round((c - b) * 100), "pb", "nivel",
              "unica comparacion de perimetro homologo: las dos series son "
              "del total de sociedades no financieras",
              pond=pr[p]["prestamo_total_pond"])

    # --- 2. ROE del circulante, caso base ---
    print()
    print("ROE DEL CIRCULANTE (perimetro: TOTAL DE EMPRESAS, el del precio): "
          "disposicion %.0f%%, comision de disponibilidad %.2f%%, CCF %.0f%%\n"
          % (100 * U_BASE, F_DISP_BASE, 100 * CCF_UCC))
    print("%-14s %8s %8s %8s %7s %7s %7s %8s %7s"
          % ("", "tipo", "ingreso", "EAD", "margen", "CoR", "gastos",
             "capital", "ROE"))
    base = {}
    for p in PAISES:
        t = TIPO_IMPOSITIVO[p]
        c = cuenta(pr[p]["circulante"], ent[p], U_BASE, F_DISP_BASE,
                   CCF_UCC, t)
        base[p] = c
        print("%-14s %7.2f%% %7.2f%% %8.2f %6.2f%% %6.2f%% %6.2f%% %7.2f%% "
              "%6.1f%%" % (p[:13], pr[p]["circulante"], c["ingreso"],
                           c["ead"], c["margen"], c["cor"], c["gastos"],
                           c["capital"], c["roe"]))
        sup = ("PERIMETRO: total de sociedades no financieras, no PYME. El "
               "MIR no publica el tipo de circulante por tramo de importe, "
               "asi que el riesgo y el capital se toman tambien del total de "
               "empresas para que el perimetro sea coherente. SUPUESTO: "
               "disposicion %.0f%% y comision de disponibilidad %.2f%% anual "
               "sobre el disponible; ninguna de las dos es observable. CCF "
               "del %.0f%% (CRR3, compromiso cancelable incondicionalmente)"
               % (100 * U_BASE, F_DISP_BASE, 100 * CCF_UCC))
        for metrica, valor, unidad, td in [
                ("Ingreso total del circulante", c["ingreso"], "pct_anual",
                 "nivel"),
                ("Exposicion por euro dispuesto", c["ead"], "indice", "ratio"),
                ("Margen bruto del circulante", c["margen"], "pct_anual",
                 "nivel"),
                ("Coste del riesgo del circulante", c["cor"], "pct_cartera",
                 "nivel"),
                ("Gastos de explotacion del circulante", c["gastos"],
                 "pct_cartera", "nivel"),
                ("Resultado antes de impuestos del circulante", c["bai"],
                 "pct_cartera", "nivel"),
                ("Capital asignado al circulante", c["capital"], "pct_rwa",
                 "nivel"),
                ("ROE del circulante", c["roe"], "pct_roe", "nivel")]:
            emite(p, metrica, valor, unidad, td, sup, pond="media_simple")

    # --- 3. rejilla de sensibilidad sobre los dos supuestos ---
    print()
    print("SENSIBILIDAD DEL ROE DEL CIRCULANTE (media de los siete paises)")
    print("filas: comision de disponibilidad | columnas: tasa de disposicion")
    print("%-8s" % "" + "".join("%9.0f%%" % (100 * u) for u in U_GRID))
    for f in F_GRID:
        fila = []
        for u in U_GRID:
            vals = [cuenta(pr[p]["circulante"], ent[p], u, f, CCF_UCC,
                           TIPO_IMPOSITIVO[p])["roe"] for p in PAISES]
            fila.append(statistics.mean(vals))
        print("%7.2f%%" % f + "".join("%9.1f%%" % v for v in fila))
        for u, v in zip(U_GRID, fila):
            emite("Zona euro (referencia)",
                  "ROE medio del circulante con disposicion %.0f%% y "
                  "comision %.2f%%" % (100 * u, f), v, "pct_roe", "nivel",
                  "media simple de los siete paises; barrido sobre los dos "
                  "supuestos no observables", pond="media_simple")

    # --- 4. variante de CCF: compromiso no cancelable ---
    print()
    print("EFECTO DEL CCF sobre el ROE, caso base de disposicion y comision")
    print("%-14s %12s %12s %9s" % ("", "CCF 10%", "CCF 40%", "dif pp"))
    for p in PAISES:
        t = TIPO_IMPOSITIVO[p]
        a = base[p]["roe"]
        b = cuenta(pr[p]["circulante"], ent[p], U_BASE, F_DISP_BASE,
                   CCF_NO_UCC, t)["roe"]
        print("%-14s %11.1f%% %11.1f%% %8.1f" % (p[:13], a, b, b - a))
        emite(p, "ROE del circulante con compromiso no cancelable", b,
              "pct_roe", "nivel",
              "mismo caso base pero con CCF del %.0f%%: compromiso no "
              "cancelable incondicionalmente" % (100 * CCF_NO_UCC),
              pond="media_simple")

    # --- 4c. contraste de perimetro: empresas frente a parametros PYME
    # El caso base usa riesgo y capital del TOTAL DE EMPRESAS, que es el
    # perimetro del precio. Aqui se recalcula con los parametros de PYME
    # que usa el modelo del prestamo, para ver cuanto del resultado viene
    # del perimetro y no del negocio.
    print()
    print("CONTRASTE DE PERIMETRO (caso base de disposicion y comision)")
    print("%-14s %13s %13s %9s %11s %11s"
          % ("", "ROE empresas", "ROE c/par.PYME", "dif pp", "CoR emp.",
             "CoR PYME"))
    for p in PAISES:
        b2 = cuenta(pr[p]["circulante"], ent[p], U_BASE, F_DISP_BASE,
                    CCF_UCC, TIPO_IMPOSITIVO[p], perimetro="pyme")
        print("%-14s %12.1f%% %12.1f%% %8.1f %10.2f%% %10.2f%%"
              % (p[:13], base[p]["roe"], b2["roe"],
                 b2["roe"] - base[p]["roe"], ent[p]["cor_emp"],
                 ent[p]["cor"]))
        emite(p, "ROE del circulante con parametros de riesgo y capital de "
                 "PYME", b2["roe"], "pct_roe", "nivel",
              "mismo precio, que es del total de empresas, pero con el coste "
              "del riesgo y la densidad de RWA de la cartera PYME. NO es "
              "coherente de perimetro: sirve solo para acotar el sesgo",
              pond="media_simple")

    # --- 4b. comparacion homologa: mismo peso de comisiones que el prestamo
    # El caso base deja el circulante sin ninguna comision sobre el
    # dispuesto, mientras que el modelo del prestamo si le aplica la cuna
    # espanola de 87 pb. Comparar los dos ROE tal cual mezcla el efecto
    # estructural (capital sobre el disponible) con el del supuesto de
    # comisiones. Aqui se le da al circulante la misma carga.
    CUNA = 0.87
    print()
    print("CIRCULANTE CON LA MISMA CARGA DE COMISIONES QUE EL PRESTAMO "
          "(%.2f%% sobre el dispuesto)" % CUNA)
    print("%-14s %12s %12s %12s" % ("", "circ. base", "circ. +cuna",
                                    "prestamo"))
    roe_prestamo = {}
    for x in lee("transversal/modelo_roe_pyme.csv"):
        if x["metrica"] == "ROE del prestamo PYME":
            roe_prestamo[x["pais"]] = float(x["valor"])
    for p in PAISES:
        c = cuenta(pr[p]["circulante"] + CUNA, ent[p], U_BASE, F_DISP_BASE,
                   CCF_UCC, TIPO_IMPOSITIVO[p])
        print("%-14s %11.1f%% %11.1f%% %11.1f%%"
              % (p[:13], base[p]["roe"], c["roe"],
                 roe_prestamo.get(p, float("nan"))))
        emite(p, "ROE del circulante con la cuna de comisiones del prestamo",
              c["roe"], "pct_roe", "nivel",
              "mismo caso base mas %.2f%% de comisiones sobre el dispuesto, "
              "la misma cuna que el modelo del prestamo aplica a los siete "
              "paises. Aisla el efecto estructural del supuesto de "
              "comisiones" % CUNA, pond="media_simple")

    # --- 5. comision neutral y comision de equilibrio ---
    # NEUTRAL: la que hace el ROE invariante a la tasa de disposicion.
    # Sale de imponer que el BAI sea proporcional a la EAD; despejando,
    #     f_neutral = CCF * (tipo - coste de los recursos)
    # es decir, el CCF por el margen del dispuesto. Se comprueba
    # numericamente contra la propia cuenta.
    #
    # EQUILIBRIO: la que igualaria el ROE del circulante al del prestamo
    # PYME del mismo pais. El ROE del prestamo se lee del modelo ya hecho.
    def equilibrio(p, objetivo):
        """Comision de disponibilidad que iguala el ROE al del prestamo."""
        lo, hi = 0.0, 10.0
        for _ in range(80):
            mid = (lo + hi) / 2
            r = cuenta(pr[p]["circulante"], ent[p], U_BASE, mid, CCF_UCC,
                       TIPO_IMPOSITIVO[p])["roe"]
            if r < objetivo:
                lo = mid
            else:
                hi = mid
        return (lo + hi) / 2

    print()
    print("COMISION DE DISPONIBILIDAD: neutral y de equilibrio (%)")
    print("%-14s %9s %9s %11s %11s %11s"
          % ("", "neutral", "control", "ROE prest.", "ROE circ.",
             "equilibrio"))
    for p in PAISES:
        neutral = CCF_UCC * (pr[p]["circulante"] - ent[p]["coste_rec"])
        # control numerico: con la comision neutral el ROE no debe moverse
        # entre una disposicion del 40 % y una del 100 %
        r40 = cuenta(pr[p]["circulante"], ent[p], 0.40, neutral, CCF_UCC,
                     TIPO_IMPOSITIVO[p])["roe"]
        r100 = cuenta(pr[p]["circulante"], ent[p], 1.00, neutral, CCF_UCC,
                      TIPO_IMPOSITIVO[p])["roe"]
        obj = roe_prestamo.get(p)
        eq = equilibrio(p, obj) if obj is not None else float("nan")
        print("%-14s %8.3f%% %8.2f %10.1f%% %10.1f%% %10.3f%%"
              % (p[:13], neutral, abs(r40 - r100), obj, base[p]["roe"], eq))
        emite(p, "Comision de disponibilidad neutral", neutral, "pct_anual",
              "nivel",
              "la que hace el ROE invariante a la tasa de disposicion; sale "
              "de imponer BAI proporcional a EAD y equivale al CCF por el "
              "margen del dispuesto. Comprobado: con ella el ROE varia "
              "%.2f pp entre disposicion del 40 %% y del 100 %%"
              % abs(r40 - r100), pond="media_simple")
        if obj is not None:
            emite(p, "Comision de disponibilidad de equilibrio con el "
                     "prestamo PYME", eq, "pct_anual", "nivel",
                  "la que igualaria el ROE del circulante (%.1f %%) al del "
                  "prestamo PYME (%.1f %%) con disposicion del %.0f %% y CCF "
                  "del %.0f %%" % (base[p]["roe"], obj, 100 * U_BASE,
                                   100 * CCF_UCC), pond="media_simple")

    fh.close()
    print()
    print("%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
