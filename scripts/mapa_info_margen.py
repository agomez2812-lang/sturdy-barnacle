#!/usr/bin/env python3
"""Mapa informacion / margen / coste del riesgo de los siete mercados.

Cruza los tres ejes que el deck trata por separado:

    X  indice de informacion para la seleccion (marco_riesgo.py, 0-100)
    Y  margen bruto del prestamo PYME (% del saldo medio, lamina 7)
    Z  coste del riesgo PD x LGD (% del saldo), como tamano y color

Lo que sale y lo que NO sale, porque con siete puntos la diferencia importa:

  SI  La posicion relativa de cada pais, que es un hecho descriptivo.
      En particular el residuo de Espana frente al ajuste: gana entre 0,53
      y 0,77 pp menos de margen del que le corresponderia por su nivel de
      informacion, y ese resultado aguanta las cuatro especificaciones
      probadas (con y sin los dos extremos).

  NO  Una ley del tipo "mas informacion, mas margen". La correlacion de
      los siete es +0,68, pero se sostiene sobre los dos extremos: quitando
      Irlanda Y Francia a la vez, cae a +0,18 y el R2 a 0,03. Por eso la
      lamina dibuja CUADRANTES sobre las medias y no una recta de ajuste:
      una recta invitaria a leer una pendiente que no es robusta.

  NO  Que la informacion compre coste del riesgo. La correlacion
      informacion-coste del riesgo es -0,24, practicamente nula. El eje que
      SI lo explica es el de recobro (-0,72), que ya esta en otra lamina.

Uso:
    python3 scripts/mapa_info_margen.py
"""
import itertools
import json
import os
import statistics as st
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(ROOT, "pres", "datos.json")
SALIDA = os.path.join(ROOT, "transversal", "mapa_info_margen.csv")
LARGO = {"P. Bajos": "Paises Bajos", "España": "Espana"}


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    return (sum((x - ma) * (y - mb) for x, y in zip(a, b))
            / ((sum((x - ma) ** 2 for x in a)
                * sum((y - mb) ** 2 for y in b)) ** 0.5))


def ajuste(x, y):
    mx, my = st.mean(x), st.mean(y)
    b = (sum((a - mx) * (c - my) for a, c in zip(x, y))
         / sum((a - mx) ** 2 for a in x))
    a0 = my - b * mx
    ss = sum((c - (a0 + b * v)) ** 2 for v, c in zip(x, y))
    tt = sum((c - my) ** 2 for c in y)
    return a0, b, 1 - ss / tt


def main():
    D = json.load(open(DATOS, encoding="utf-8"))
    P = D["paises"]
    info, margen = D["marco"]["info"], D["pl"]["margen"]
    cor, rec = D["pl"]["cor"], D["marco"]["recobro"]
    neto = [m - c for m, c in zip(margen, cor)]

    mi, mm = st.mean(info), st.mean(margen)
    a0, b, r2 = ajuste(info, margen)

    # Robustez: se repite el ajuste quitando uno y dos paises.
    pruebas = [("los siete", [])]
    pruebas += [("sin %s" % P[i], [i]) for i in range(len(P))]
    pruebas += [("sin %s ni %s" % (P[i], P[j]), [i, j])
                for i, j in itertools.combinations(range(len(P)), 2)]
    res_es, rhos = [], []
    for etiq, fuera in pruebas:
        idx = [i for i in range(len(P)) if i not in fuera]
        if 0 not in idx:            # Espana tiene que estar para el residuo
            continue
        xs = [info[i] for i in idx]
        ys = [margen[i] for i in idx]
        c0, c1, _ = ajuste(xs, ys)
        res_es.append(margen[0] - (c0 + c1 * info[0]))
        rhos.append(pearson(xs, ys))

    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(SALIDA):
        os.remove(SALIDA)
    fh, w = schema.writer(SALIDA)
    n = 0
    puntos = []
    for i, p in enumerate(P):
        esperado = a0 + b * info[i]
        q = ("informacion alta, margen alto" if info[i] >= mi and margen[i] >= mm
             else "informacion alta, margen bajo" if info[i] >= mi
             else "informacion baja, margen alto" if margen[i] >= mm
             else "informacion baja, margen bajo")
        puntos.append({"pais": p, "info": info[i], "margen": margen[i],
                       "cor": cor[i], "neto": round(neto[i], 2),
                       "esperado": round(esperado, 2),
                       "residuo": round(margen[i] - esperado, 2),
                       "cuadrante": q})
        base = dict(pais=LARGO.get(p, p), producto="pyme_total",
                    periodo_referencia="2026", url="",
                    fuente="Calculo propio sobre Banco Mundial (Doing Business "
                           "2020), EBA (COREP C 9.02) y BCE (MIR)",
                    fecha_publicacion=hoy, criterio_segmentacion="n/a",
                    tipo_de_dato="ratio", ponderacion="dato_unico")
        for met, val, uni, nota in [
            ("Indice de informacion para la seleccion", info[i], "indice",
             "escala 0-100; compuesto de cuatro componentes, ver marco_riesgo.py"),
            ("Margen bruto del prestamo PYME", margen[i], "pct_cartera",
             "ingreso total menos coste de los recursos, %% del saldo medio"),
            ("Coste del riesgo PD x LGD", cor[i], "pct_cartera",
             "perdida esperada anual; NO es el ratio de NPL"),
            ("Margen esperado por el nivel de informacion", esperado, "pct_cartera",
             "ajuste lineal sobre los siete paises; R2 %.2f. Indicativo, no causal" % r2),
            ("Residuo de margen frente al ajuste", margen[i] - esperado, "pct_cartera",
             "negativo = gana menos margen del que le corresponderia por su "
             "informacion. Cuadrante: %s" % q),
        ]:
            w.writerow(schema.row(metrica=met, valor="%.4f" % val, unidad=uni,
                                  notas=nota, **base)); n += 1
    fh.close()

    print("Medias (lineas de cuadrante): informacion %.1f · margen %.2f %%\n" % (mi, mm))
    print("%-12s %7s %8s %8s %9s %9s  %s" % (
        "pais", "info", "margen", "CoR", "esperado", "residuo", "cuadrante"))
    for r in puntos:
        print("%-12s %7.1f %7.2f%% %7.2f%% %8.2f%% %+8.2f pp  %s" % (
            r["pais"], r["info"], r["margen"], r["cor"], r["esperado"],
            r["residuo"], r["cuadrante"]))

    print("\nAjuste sobre los siete: margen = %.2f + %.4f x info · "
          "R2 %.2f · rho %+.2f" % (a0, b, r2, pearson(info, margen)))
    print("Pendiente: %+.2f pp de margen por cada 10 puntos de indice." % (b * 10))
    print("\nROBUSTEZ (%d ajustes quitando uno y dos paises):" % len(res_es))
    print("  residuo de Espana: de %+.2f a %+.2f pp, mediana %+.2f · "
          "negativo en %d de %d" % (min(res_es), max(res_es),
                                    st.median(res_es),
                                    sum(1 for v in res_es if v < 0), len(res_es)))
    print("  correlacion info-margen: de %+.2f a %+.2f · "
          "por debajo de +0,40 en %d de %d" % (min(rhos), max(rhos),
                                               sum(1 for v in rhos if v < 0.40),
                                               len(rhos)))
    print("\nOtras correlaciones sobre los siete:")
    for et, a, c in (("informacion vs coste del riesgo", info, cor),
                     ("recobro vs coste del riesgo", rec, cor),
                     ("margen vs coste del riesgo", margen, cor)):
        print("  %-34s %+.2f" % (et, pearson(a, c)))
    print("\n%d filas -> %s" % (n, SALIDA))

    json.dump({"puntos": puntos, "media_info": round(mi, 1),
               "media_margen": round(mm, 2), "r2": round(r2, 2),
               "rho": round(pearson(info, margen), 2),
               "pendiente10": round(b * 10, 2),
               "rho_min": round(min(rhos), 2), "rho_max": round(max(rhos), 2),
               "res_es_min": round(min(res_es), 2),
               "res_es_max": round(max(res_es), 2),
               "rho_info_cor": round(pearson(info, cor), 2),
               "rho_rec_cor": round(pearson(rec, cor), 2)},
              open(os.path.join(ROOT, "pres", "mapa_info_margen.json"), "w"),
              indent=1, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
