# -*- coding: utf-8 -*-
"""Se paga el riesgo? Precio contra PD, entre mercados y dentro de cada uno.

Objecion planteada por el usuario: la PD no es solo un resultado de la
informacion disponible, es tambien una decision de apetito. Si presto a
clientes de mas riesgo cobro mas y estoy bien asi.

El planteamiento es correcto como mecanismo. Este script comprueba si se
observa, y separa los dos niveles en que puede operar:

  * ENTRE mercados: correlacion del precio y del margen neto de riesgo con
    la PD de cada pais. Si el riesgo se paga, el margen neto de riesgo
    deberia ser plano.
  * DENTRO de cada mercado: gradiente de precio por tramo de importe, que
    es el unico eje de riesgo que la estadistica oficial permite observar
    dentro de un pais.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELO = os.path.join(BASE, "transversal", "modelo_roe_pyme.csv")
OUT = os.path.join(BASE, "transversal", "apetito_riesgo.csv")

PAISES = ["Espana", "Alemania", "Francia", "Italia", "Portugal",
          "Paises Bajos", "Irlanda"]
HOY = "2026-09-17"
FUENTE = ("calculo propio sobre BCE dataset MIR y parametros IRB del EBA "
          "(COREP C 9.02)")

# Parametros IRB observados, EBA COREP C 9.02, 2026-Q1, mediana de entidades.
PD = dict(zip(PAISES, [1.73, 1.26, 2.15, 2.26, 1.26, 1.18, 1.08]))


def pearson(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    da = sum((x - ma) ** 2 for x in a) ** .5
    db = sum((y - mb) ** 2 for y in b) ** .5
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (da * db)


def rangos(v):
    import collections
    orden = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    for pos, i in enumerate(orden):
        r[i] = pos + 1
    g = collections.defaultdict(list)
    for i, x in enumerate(v):
        g[x].append(i)
    for _, ix in g.items():
        m = sum(r[i] for i in ix) / len(ix)
        for i in ix:
            r[i] = m
    return r


def spearman(a, b):
    return pearson(rangos(a), rangos(b))


def lee_modelo():
    """Recupera del modelo de ROE las piezas de la cuenta del prestamo."""
    d = {p: {} for p in PAISES}
    claves = {
        "Precio (tipo MIR, tramo <=1 M)": "precio",
        "Comisiones": "comisiones",
        "Coste de los recursos de empresa": "fondos",
        "Coste del riesgo": "cor",
        "Margen bruto": "margen",
        "ROE del prestamo PYME": "roe",
    }
    for r in csv.DictReader(open(MODELO, encoding="utf-8")):
        if r["pais"] in d and r["metrica"] in claves:
            d[r["pais"]][claves[r["metrica"]]] = float(r["valor"])
    return d


def lee_tramos():
    """Precio de nueva produccion por tramo.

    Se prefiere la media ponderada por volumen. Alemania no publica el
    volumen de los tramos pequenos, asi que ahi el MIR solo permite media
    simple; se devuelve tambien el metodo para poder etiquetarlo.
    """
    src = os.path.join(BASE, "prestamos_personales",
                       "prestamos_empresas_medias_ponderadas.csv")
    t = {p: {} for p in PAISES}
    for r in csv.DictReader(open(src, encoding="utf-8")):
        if r["pais"] not in t or r["unidad"] != "pct_anual":
            continue
        tramo = r["tramo_importe"]
        pond = r["ponderacion"]
        # el fichero trae la serie duplicada; nos quedamos con la ponderada
        # cuando exista, y si no con la simple
        if tramo in t[r["pais"]] and t[r["pais"]][tramo][1] == \
                "media_ponderada_volumen":
            continue
        t[r["pais"]][tramo] = (float(r["valor"]), pond)
    return t


def main():
    mod = lee_modelo()
    tr = lee_tramos()
    faltan = [p for p in PAISES if len(mod[p]) < 6]
    if faltan:
        raise SystemExit("faltan metricas del modelo para: %s" % faltan)

    T_PEQ = "Hasta 0,25 M EUR"
    T_MED = "Mas de 0,25 y hasta 1 M EUR"
    T_GRA = "Mas de 1 M EUR"
    for p in PAISES:
        for k in (T_PEQ, T_MED, T_GRA):
            if k not in tr[p]:
                raise SystemExit("falta el tramo %r en %s (hay: %s)"
                                 % (k, p, sorted(tr[p])))

    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)

    def emite(**kw):
        w.writerow(schema.row(**kw))

    pdv = [PD[p] for p in PAISES]
    precio = [mod[p]["precio"] for p in PAISES]
    cor = [mod[p]["cor"] for p in PAISES]
    roe = [mod[p]["roe"] for p in PAISES]
    # margen neto de riesgo = ingreso - coste de los recursos - coste del riesgo
    mnr = [mod[p]["margen"] - mod[p]["cor"] for p in PAISES]
    # gradiente de precio dentro del mercado, en puntos basicos
    g_pyme = [round((tr[p][T_PEQ][0] - tr[p][T_MED][0]) * 100) for p in PAISES]
    g_tot = [round((tr[p][T_PEQ][0] - tr[p][T_GRA][0]) * 100) for p in PAISES]
    # metodo de promediado del tramo pequeno, para poder etiquetar el caso
    # aleman, que mezcla media simple con media ponderada
    metodo = {p: tr[p][T_PEQ][1] for p in PAISES}

    for i, p in enumerate(PAISES):
        emite(pais=p, producto="prestamo_pyme",
              metrica="Margen neto de riesgo del prestamo PYME",
              valor="%.4f" % mnr[i], unidad="pct_anual",
              periodo_referencia="2026-07 / 2026-Q1", fuente=FUENTE, url="",
              fecha_publicacion=HOY, tramo_importe="Hasta 1 M EUR",
              criterio_segmentacion="tamano_prestamo", tipo_de_dato="nivel",
              ponderacion="media_ponderada_volumen",
              notas="precio mas comisiones, menos coste de los recursos y "
                    "coste del riesgo; antes de gastos y de capital. La "
                    "comision es un supuesto de 87 pb salvo en Espana")
        emite(pais=p, producto="prestamo_pyme",
              metrica="Gradiente de precio dentro de PYME",
              valor="%d" % g_pyme[i], unidad="pb",
              periodo_referencia="2026-07", fuente=FUENTE, url="",
              fecha_publicacion=HOY,
              tramo_importe="Hasta 0,25 M EUR menos 0,25-1 M EUR",
              criterio_segmentacion="tamano_prestamo", tipo_de_dato="nivel",
              ponderacion=metodo[p],
              notas="sobreprecio del tramo pequeno frente al mediano dentro "
                    "del perimetro PYME; tramo pequeno promediado por %s"
                    % metodo[p])
        emite(pais=p, producto="prestamo_pyme",
              metrica="Gradiente de precio PYME frente a gran empresa",
              valor="%d" % g_tot[i], unidad="pb",
              periodo_referencia="2026-07", fuente=FUENTE, url="",
              fecha_publicacion=HOY,
              tramo_importe="Hasta 0,25 M EUR menos mas de 1 M EUR",
              criterio_segmentacion="tamano_prestamo", tipo_de_dato="nivel",
              ponderacion=metodo[p],
              notas="el tramo de mas de 1 M EUR no es solo gran empresa, "
                    "pero es el proxy mas cercano que publica el MIR; tramo "
                    "pequeno promediado por %s" % metodo[p])

    contrastes = [
        ("Precio del prestamo PYME", precio, "PD PYME", pdv,
         "si el riesgo se pagara, el signo seria positivo"),
        ("Precio del prestamo PYME", precio, "Coste del riesgo", cor,
         "si el riesgo se pagara, el signo seria positivo"),
        ("Margen neto de riesgo", mnr, "PD PYME", pdv,
         "si el riesgo se pagara exactamente, seria cero: el margen neto "
         "de riesgo seria plano entre paises"),
        ("ROE del prestamo PYME", roe, "PD PYME", pdv,
         "si el riesgo se pagara, seria cero"),
        ("Gradiente de precio dentro de PYME", [float(x) for x in g_pyme],
         "PD PYME", pdv, "gradiente dentro del mercado"),
        ("Gradiente de precio PYME frente a gran empresa",
         [float(x) for x in g_tot], "ROE del prestamo PYME", roe,
         "indicativa; la causalidad puede ir en los dos sentidos"),
    ]
    print("Contrastes sobre siete paises (indicativos, no causales)")
    print("%-46s %7s %7s" % ("contraste", "r", "rho"))
    for nom, a, dest, b, nota in contrastes:
        r, rho = pearson(a, b), spearman(a, b)
        print("%-46s %7.2f %7.2f" % ("%s ~ %s" % (nom, dest), r, rho))
        for val, tipo in ((r, "Pearson"), (rho, "Spearman")):
            emite(pais="Zona euro (referencia)", producto="prestamo_pyme",
                  metrica="Correlacion %s de %s con %s" % (tipo, nom, dest),
                  valor="%.4f" % val, unidad="indice",
                  periodo_referencia="2026-07 / 2026-Q1",
                  fuente="calculo propio", url="", fecha_publicacion=HOY,
                  criterio_segmentacion="n/a", tipo_de_dato="indice",
                  ponderacion="media_simple",
                  notas="n=7; " + nota)

    print()
    print("%-14s %7s %7s %7s %9s %8s %9s %7s"
          % ("pais", "precio", "PD", "CoR", "mrg-CoR", "gr.PYME", "gr.total",
             "ROE"))
    for i, p in enumerate(PAISES):
        print("%-14s %7.2f %7.2f %7.2f %9.2f %8d %9d %7.1f"
              % (p, precio[i], pdv[i], cor[i], mnr[i], g_pyme[i], g_tot[i],
                 roe[i]))

    fh.close()
    print()
    print("escrito: %s" % OUT)


if __name__ == "__main__":
    main()
