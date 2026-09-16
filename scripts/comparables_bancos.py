#!/usr/bin/env python3
"""Comparables banco a banco: cuenta de resultados del segmento empresas.

Este bloque no se puede automatizar como los anteriores. Cada banco publica
su reporte por segmentos con un perimetro y un nivel de detalle distintos, y
en formatos que no comparten estructura. Los valores de DATOS se han leido
uno a uno de los documentos primarios descargados en raw/bancos/, y cada
fila lleva el documento y la pagina de la que sale.

El objetivo principal es el **peso de las comisiones sobre el ingreso del
segmento**, que es la unica via para los cuatro paises donde ningun banco
central publica un tipo con comisiones (ver notas.md 2.24-2.26).

Uso:
    python3 scripts/comparables_bancos.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (metrica, valor, unidad, tipo_de_dato)
DATOS = [
    {
        "pais": "Alemania", "banco": "Commerzbank", "segmento": "Corporate Clients",
        "periodo": "2026-Q2",
        "doc": "Commerzbank, comunicado de resultados Q2 2026, p. 4",
        "url": "https://www.commerzbank.de/group/newsroom/press-releases/2026/20260806-pr-q2-2026.pdf",
        "perimetro": "Grandes empresas, PYME alemana, sector publico aleman, "
                     "clientes internacionales e institucionales. No aisla PYME.",
        "filas": [
            ("Ingresos del segmento", 1232, "eur_millones", "importe"),
            ("Margen de intereses", 660, "eur_millones", "importe"),
            ("Comisiones netas", 376, "eur_millones", "importe"),
            ("Resultado operativo", 490, "eur_millones", "importe"),
            ("Cartera media de prestamos", 123000, "eur_millones", "importe"),
        ],
    },
    {
        "pais": "Paises Bajos", "banco": "ABN AMRO", "segmento": "Corporate Banking",
        "periodo": "2026-H1",
        "doc": "ABN AMRO, Interim Report & Quarterly Report Q2 2026, p. 12",
        "url": "https://www.abnamro.com/en/investor-relations",
        "perimetro": "Banca corporativa, incluye Clearing y Global Markets. "
                     "La PYME neerlandesa esta en Personal & Business Banking, "
                     "segmento distinto.",
        "filas": [
            ("Ingresos del segmento", 1694, "eur_millones", "importe"),
            ("Margen de intereses", 1093, "eur_millones", "importe"),
            ("Comisiones netas", 429, "eur_millones", "importe"),
            ("Resultado operativo", 855, "eur_millones", "importe"),
            ("Ratio de eficiencia (cost-income)", 49.5, "pct_ingresos", "ratio"),
            ("Coste del riesgo", 15, "pb", "ratio"),
            ("ROE del segmento", 10.8, "pct_roe", "ratio"),
            ("Prestamos a clientes", 86900, "eur_millones", "importe"),
            ("Activos ponderados por riesgo", 77400, "eur_millones", "importe"),
        ],
    },
    {
        "pais": "Italia", "banco": "Intesa Sanpaolo", "segmento": "Banca dei Territori",
        "periodo": "2026-H1",
        "doc": "Intesa Sanpaolo, resultados consolidados a 30 junio 2026, p. 16",
        "url": "https://group.intesasanpaolo.com/en/investor-relations",
        "perimetro": "Retail, clientes exclusive, empresas con necesidades "
                     "complejas (generalmente PYME) y no lucrativas. "
                     "NO desglosa intereses ni comisiones por division.",
        "filas": [
            ("Ingresos del segmento", 6205, "eur_millones", "importe"),
            ("Costes operativos", 2898, "eur_millones", "importe"),
            ("Resultado operativo", 3307, "eur_millones", "importe"),
            ("Ratio de eficiencia (cost-income)", 46.7, "pct_ingresos", "ratio"),
            ("Provisiones y saneamientos", 528, "eur_millones", "importe"),
            ("Resultado neto", 1727, "eur_millones", "importe"),
        ],
    },
]


def main():
    destino = os.path.join(ROOT, "comparables_bancos", "comparables_bancos.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0
    for b in DATOS:
        ingresos = dict((m, v) for m, v, _, _ in b["filas"]).get("Ingresos del segmento")
        for metrica, valor, unidad, td in b["filas"]:
            w.writerow(schema.row(
                pais=b["pais"], producto="segmento_empresas",
                metrica="%s | %s" % (metrica, b["segmento"]),
                valor=("%.1f" % valor) if td == "ratio" else ("%.0f" % valor),
                unidad=unidad, periodo_referencia=b["periodo"],
                fuente="%s (%s)" % (b["banco"], b["doc"]), url=b["url"],
                fecha_publicacion=hoy, criterio_segmentacion="entidad",
                tipo_de_dato=td, ponderacion="dato_unico",
                notas="perimetro: %s" % b["perimetro"])); n += 1
        # Peso de las comisiones, que es el objeto de este bloque.
        com = dict((m, v) for m, v, _, _ in b["filas"]).get("Comisiones netas")
        if com and ingresos:
            w.writerow(schema.row(
                pais=b["pais"], producto="segmento_empresas",
                metrica="Comisiones netas sobre ingresos del segmento | %s" % b["segmento"],
                valor="%.1f" % (100.0 * com / ingresos), unidad="pct_ingresos",
                periodo_referencia=b["periodo"],
                fuente="%s (%s)" % (b["banco"], b["doc"]), url=b["url"],
                fecha_publicacion=hoy, criterio_segmentacion="entidad",
                tipo_de_dato="ratio", ponderacion="dato_unico",
                notas="calculo propio sobre las dos filas anteriores")); n += 1
    fh.close()
    print("%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
