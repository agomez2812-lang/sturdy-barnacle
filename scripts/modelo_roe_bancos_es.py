# -*- coding: utf-8 -*-
"""ROE del negocio PYME en Espana, banco a banco.

NINGUN banco espanol publica una cuenta de resultados de PYME con capital
asignado. Se comprobo en el bloque de comparables: la NIIF 8 obliga a
reportar por los segmentos que usa la direccion, y ninguno usa "PYME".
Asi que este ROE es MODELIZADO, igual que el de paises, y lo que cambia
entre bancos es solo lo que cada uno publica de verdad.

OBSERVADO Y PROPIO DE CADA BANCO (EU-wide Transparency Exercise del EBA,
contraparte espanola donde el dato lo permite):
    densidad de RWA de su cartera PYME espanola   PYME + banco
    mora de su cartera PYME espanola              PYME + banco
    cobertura de esa mora con provisiones         PYME + banco
    ratio CET1                                    banco (grupo)
    ratio de eficiencia                           banco (grupo)

EL COSTE DEL RIESGO SE CONSTRUYE CON LAS DOS PIEZAS DE PYME DEL BANCO:

    PD_banco  = PD PYME de Espana x (mora PYME del banco / mora media)
    LGD_banco = LGD PYME de Espana x (cobertura del banco / cobertura media)
    CoR       = PD_banco x LGD_banco

El NIVEL lo fija el parametro IRB de PYME de Espana (COREP C 9.02), que es
observado; la DISPERSION entre bancos la fijan su propia mora y su propia
cobertura de PYME, las dos observadas y las dos de la cartera espanola. No
es la PD/LGD interna de cada banco, que solo esta en su Pilar 3 y no se ha
podido obtener (ver notas.md 2.55), pero ya no es un simple escalado.

COMUN A LOS CINCO, porque ningun banco lo publica por segmento:
    precio del prestamo PYME        MIR de Espana, tramo <=1 M EUR
    cuna de comisiones              87 pb, la observada en el Boletin
    coste de los recursos           deposito de empresa en Espana
    tipo impositivo                 30 %, art. 29 LIS

Es decir: **este ejercicio NO compara la habilidad comercial de cada banco,
que no es observable. Compara su estructura de riesgo, capital y coste.**
Dos bancos con el mismo precio y las mismas comisiones rinden distinto aqui
solo por densidad de RWA, mora, CET1 y eficiencia.

El coste del riesgo se escala: se parte del PD x LGD de PYME de Espana y se
ajusta por la mora relativa de cada banco frente al agregado de los cinco.
Es un SUPUESTO, y se publica tambien el caso sin escalar.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import collections
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "comparables_bancos", "modelo_roe_bancos_es.csv")
HOY = "2026-09-17"
PERIODO = "2025-06"
TIPO = 0.30                 # art. 29 LIS, entidades de credito
BANCOS = ["Santander", "BBVA", "CaixaBank", "Sabadell", "Bankinter"]
DOMESTICO = {"CaixaBank", "Sabadell", "Bankinter"}


def lee(rel):
    ruta = os.path.join(ROOT, rel)
    if not os.path.exists(ruta):
        sys.exit("falta %s" % rel)
    return list(csv.DictReader(open(ruta, encoding="utf-8")))


def comunes():
    """Precio, comisiones y coste de los recursos de Espana."""
    c = {}
    for x in lee("transversal/modelo_roe_pyme.csv"):
        if x["pais"] != "Espana":
            continue
        if x["metrica"] == "Precio (tipo MIR, tramo <=1 M)":
            c["precio"] = float(x["valor"])
        elif x["metrica"] == "Comisiones":
            c["cuna"] = float(x["valor"])
        elif x["metrica"] == "Coste de los recursos de empresa":
            c["coste_rec"] = float(x["valor"])
    for x in lee("transversal/eba_parametros_riesgo.csv"):
        if x["pais"] != "Espana":
            continue
        if x["metrica"].startswith("Coste del riesgo PYME"):
            c["cor_es"] = float(x["valor"])
        elif x["metrica"] == "PD ajustada (mediana) | Empresas, del cual PYME":
            c["pd_es"] = float(x["valor"])
        elif x["metrica"] == "LGD (mediana) | Empresas, del cual PYME":
            c["lgd_es"] = float(x["valor"])
    falta = [k for k in ("precio", "cuna", "coste_rec", "cor_es", "pd_es",
                         "lgd_es") if k not in c]
    if falta:
        sys.exit("faltan entradas comunes: %s" % falta)
    return c


def por_banco():
    d = collections.defaultdict(dict)
    campos = {
        "Densidad de RWA de la cartera PYME en Espana": "densidad",
        "Tasa de exposicion PYME en default en Espana": "default",
        "Cobertura de la exposicion PYME en default en Espana": "cobertura",
        "Ratio CET1": "cet1",
        "Ratio de eficiencia (cost-to-income)": "eficiencia",
        "Exposicion PYME en Espana": "exposicion",
    }
    for x in lee("comparables_bancos/eba_te_bancos_es.csv"):
        met, _, banco = x["metrica"].partition(" | ")
        if banco not in BANCOS or met not in campos:
            continue
        d[banco][campos[met]] = float(x["valor"])
    falta = [b for b in BANCOS if len(d.get(b, {})) < 6]
    if falta:
        sys.exit("faltan datos de: %s" % falta)
    return d


def cuenta(c, e, cor, cuna=None):
    cuna = c["cuna"] if cuna is None else cuna
    ingreso = c["precio"] + cuna
    margen = ingreso - c["coste_rec"]
    gastos = margen * e["eficiencia"] / 100.0
    bai = margen - cor - gastos
    capital = e["densidad"] / 100.0 * e["cet1"]
    roe = bai * (1 - TIPO) / capital * 100.0 if capital else float("nan")
    return {"ingreso": ingreso, "margen": margen, "cor": cor,
            "gastos": gastos, "bai": bai, "capital": capital, "roe": roe}


def main():
    c = comunes()
    b = por_banco()

    # agregados ponderados por exposicion de los cinco, para relativizar
    exp = sum(b[x]["exposicion"] for x in BANCOS)
    mora_agg = sum(b[x]["default"] * b[x]["exposicion"] for x in BANCOS) / exp
    cob_agg = sum(b[x]["cobertura"] * b[x]["exposicion"]
                  for x in BANCOS) / exp

    def riesgo(e):
        """PD y LGD de PYME del banco, y su coste del riesgo."""
        pd_b = c["pd_es"] * e["default"] / mora_agg
        lgd_b = c["lgd_es"] * e["cobertura"] / cob_agg
        return pd_b, lgd_b, pd_b * lgd_b / 100.0

    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)
    n = 0

    def emite(banco, metrica, valor, unidad, td, nota):
        nonlocal n
        w.writerow(schema.row(
            pais="Espana", producto="banco_pyme_modelo",
            metrica="%s | %s" % (metrica, banco), valor="%.4f" % valor,
            unidad=unidad, periodo_referencia=PERIODO,
            fuente="calculo propio sobre EBA (Transparency Exercise y COREP "
                   "C 9.02), BCE (MIR) y Banco de Espana (Boletin, cuadro "
                   "19.6)", url="", fecha_publicacion=HOY,
            tramo_importe="Hasta 1 M EUR",
            criterio_segmentacion="entidad", tipo_de_dato=td,
            ponderacion="dato_unico", notas=nota))
        n += 1

    print("Entradas propias de cada banco (%s)\n" % PERIODO)
    print("%-11s %11s %9s %8s %11s %11s"
          % ("banco", "exposicion", "densidad", "CET1", "eficiencia",
             "mora PYME"))
    for x in BANCOS:
        e = b[x]
        print("%-11s %10.0f %8.1f%% %7.2f%% %10.1f%% %10.2f%%"
              % (x, e["exposicion"], e["densidad"], e["cet1"],
                 e["eficiencia"], e["default"]))

    print()
    print("ROE MODELIZADO DEL PRESTAMO PYME EN ESPANA, banco a banco")
    print("Mora agregada de los cinco: %.2f%%; coste del riesgo base de "
          "Espana: %.2f%%\n" % (mora_agg, c["cor_es"]))
    print("%-11s %8s %8s %7s %7s %8s %9s %8s %9s"
          % ("banco", "ingreso", "margen", "CoR", "gastos", "BAI",
             "capital", "ROE", "ROE s/esc"))
    res = {}
    for x in BANCOS:
        e = b[x]
        pd_b, lgd_b, cor = riesgo(e)
        r = cuenta(c, e, cor)
        r0 = cuenta(c, e, c["cor_es"])
        res[x] = (r, r0, cor)
        print("%-11s %7.2f%% %7.2f%% %6.2f%% %6.2f%% %7.2f%% %8.2f%% "
              "%7.1f%% %8.1f%%"
              % (x, r["ingreso"], r["margen"], r["cor"], r["gastos"],
                 r["bai"], r["capital"], r["roe"], r0["roe"]))
        alcance = ("" if x in DOMESTICO else
                   " La eficiencia y el CET1 son de grupo consolidado y en "
                   "este banco el negocio internacional es mayoritario, asi "
                   "que no representan a su banca espanola.")
        comun = ("Precio, comisiones, coste de los recursos y tipo "
                 "impositivo son COMUNES a los cinco: ningun banco publica "
                 "esas magnitudes por segmento PYME." + alcance)
        for metrica, valor, unidad, td, nota in [
                ("Ingreso total del prestamo PYME", r["ingreso"],
                 "pct_anual", "nivel", comun),
                ("Margen bruto del prestamo PYME", r["margen"], "pct_anual",
                 "nivel", comun),
                ("PD PYME", pd_b, "pct_cartera", "nivel",
                 "PD PYME de Espana (%.2f %%) por la mora PYME espanola de "
                 "este banco (%.2f %%) sobre la media de los cinco (%.2f %%)"
                 % (c["pd_es"], e["default"], mora_agg)),
                ("LGD PYME", lgd_b, "pct_cartera", "nivel",
                 "LGD PYME de Espana (%.2f %%) por la cobertura PYME de este "
                 "banco (%.1f %%) sobre la media de los cinco (%.1f %%)"
                 % (c["lgd_es"], e["cobertura"], cob_agg)),
                ("Coste del riesgo PYME", cor, "pct_cartera", "nivel",
                 "PD x LGD, ambas construidas sobre datos de la cartera PYME "
                 "espanola de este banco. El nivel lo ancla el parametro IRB "
                 "de PYME de Espana; la dispersion entre bancos es suya"),
                ("Gastos de explotacion del prestamo PYME", r["gastos"],
                 "pct_cartera", "nivel",
                 "eficiencia observada del banco aplicada al margen." +
                 alcance),
                ("Resultado antes de impuestos del prestamo PYME", r["bai"],
                 "pct_cartera", "nivel", comun),
                ("Capital asignado al prestamo PYME", r["capital"],
                 "pct_rwa", "nivel",
                 "densidad de RWA de su cartera PYME espanola por su ratio "
                 "CET1, ambos observados"),
                ("ROE modelizado del prestamo PYME", r["roe"], "pct_roe",
                 "nivel", comun),
                ("ROE modelizado del prestamo PYME sin escalar el riesgo",
                 r0["roe"], "pct_roe", "nivel",
                 "variante con el coste del riesgo de PYME de Espana igual "
                 "para los cinco; aisla el efecto de la mora relativa")]:
            emite(x, metrica, valor, unidad, td, nota)

    # --- precio de equilibrio -------------------------------------------
    # El precio de PYME por banco NO es obtenible (ver notas.md 2.55). Lo que
    # si se puede dar la vuelta es la pregunta: con su propio riesgo, capital,
    # gastos y fondeo, que precio necesitaria cada banco para un ROE dado.
    # Eso no depende del precio no observable y es directamente accionable.
    OBJETIVO = 15.0
    print()
    print("PRECIO QUE NECESITA CADA BANCO PARA UN ROE DEL %.0f%%" % OBJETIVO)
    print("%-11s %13s %14s %11s"
          % ("banco", "precio comun", "precio equil.", "diferencia"))
    for x in BANCOS:
        e = b[x]
        cor = riesgo(e)[2]
        # ROE es lineal en el precio: se despeja en un paso
        r1 = cuenta(c, e, cor)
        r2 = cuenta(c, e, cor, cuna=c["cuna"] + 1.0)   # +100 pb de ingreso
        pend = (r2["roe"] - r1["roe"])                 # pp de ROE por 100 pb
        preciso = c["precio"] + (OBJETIVO - r1["roe"]) / pend
        print("%-11s %12.2f%% %13.2f%% %10.0f pb"
              % (x, c["precio"], preciso, (preciso - c["precio"]) * 100))
        emite(x, "Precio del prestamo PYME para un ROE del %.0f%%" % OBJETIVO,
              preciso, "pct_anual", "nivel",
              "precio que necesitaria este banco con su propio riesgo, "
              "capital, gastos y coste de los recursos. No depende del "
              "precio real de PYME del banco, que no es obtenible")
        emite(x, "Sensibilidad del ROE a 100 pb de precio", pend, "pct_roe",
              "ratio", "puntos de ROE por cada 100 pb de precio o comision")

    # descomposicion: que separa a cada banco del mejor
    print()
    print("QUE EXPLICA LA DIFERENCIA (frente al mejor de los cinco)")
    mejor = max(BANCOS, key=lambda x: res[x][0]["roe"])
    em = b[mejor]
    print("mejor: %s\n" % mejor)
    print("%-11s %9s %11s %11s %11s"
          % ("banco", "dif ROE", "por riesgo", "por capital", "por gastos"))
    for x in BANCOS:
        if x == mejor:
            continue
        e = b[x]
        r = res[x][0]
        base_roe = r["roe"]
        # se sustituye una palanca cada vez por la del mejor
        def con(**kw):
            e2 = dict(e); e2.update(kw)
            return cuenta(c, e2, riesgo(e2)[2])["roe"]
        d_riesgo = con(default=em["default"],
                       cobertura=em["cobertura"]) - base_roe
        d_capital = con(densidad=em["densidad"], cet1=em["cet1"]) - base_roe
        d_gastos = con(eficiencia=em["eficiencia"]) - base_roe
        print("%-11s %8.1f %10.1f %10.1f %10.1f"
              % (x, base_roe - res[mejor][0]["roe"], d_riesgo, d_capital,
                 d_gastos))
        for metrica, valor, nota in [
                ("Mejora de ROE igualando el riesgo al mejor de los cinco",
                 d_riesgo, "sustituye la mora de este banco por la de %s"
                 % mejor),
                ("Mejora de ROE igualando el capital al mejor de los cinco",
                 d_capital, "sustituye densidad de RWA y CET1 por los de %s"
                 % mejor),
                ("Mejora de ROE igualando la eficiencia al mejor de los "
                 "cinco", d_gastos,
                 "sustituye la eficiencia por la de %s" % mejor)]:
            emite(x, metrica, valor, "pct_roe", "nivel",
                  "descomposicion de palancas; " + nota)

    fh.close()
    print()
    print("%d filas -> %s" % (n, OUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
