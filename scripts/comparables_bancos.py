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
        "doc": "Intesa Sanpaolo, resultados consolidados a 30 junio 2026, p. 16; prestamos por division, informe semestral a 30 junio 2026, p. 72",
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
            # Del INFORME SEMESTRAL (30062026_Half-yearly_report.pdf, p. 72
            # del pdf), no del comunicado: es la tabla de prestamos a la
            # clientela por division. 219.992 a 31.12.2025, practicamente
            # plana, asi que el saldo medio del semestre es el mismo.
            ("Prestamos a clientes", 219940, "eur_millones", "importe"),
            ("Prestamos a clientes al cierre anterior", 219992,
             "eur_millones", "importe"),
        ],
    },
    {
        "pais": "Espana", "banco": "CaixaBank", "segmento": "Grupo consolidado",
        "periodo": "2026-H1",
        "doc": "CaixaBank, Actividad y Resultados enero-junio 2026, p. 6 y 66",
        "url": "https://www.caixabank.com/es/accionistas-inversores.html",
        "perimetro": "NO publica cuenta de resultados de un segmento de "
                     "empresas. Sus segmentos son bancario y seguros, "
                     "actividad aseguradora, participaciones y BPI.",
        "filas": [
            ("Margen de intereses", 5390, "eur_millones", "importe"),
            ("Comisiones netas", 2075, "eur_millones", "importe"),
            ("Comisiones bancarias mayoristas", 193, "eur_millones", "importe"),
            ("Ingresos del segmento", 8338, "eur_millones", "importe"),
            ("Ratio de eficiencia (cost-income)", 39.6, "pct_ingresos", "ratio"),
            ("Coste del riesgo", 24, "pb", "ratio"),
            ("ROE del segmento", 15.4, "pct_roe", "ratio"),
            ("Ratio de morosidad", 1.78, "pct_cartera", "ratio"),
            ("Credito a la clientela bruto", 406233, "eur_millones", "importe"),
        ],
    },
    {
        "pais": "Italia", "banco": "BPER Banca", "segmento": "Grupo consolidado",
        "periodo": "2026-H1",
        "doc": "BPER, resultados consolidados a 30 junio 2026, p. 19; prestamos a la clientela, informe intermedio consolidado a 30 junio 2026, p. 34",
        "url": "https://group.bper.it/en/investor-relations/group-results/financial-statements-reports",
        "perimetro": "El comunicado NO desglosa por division ni segmento. "
                     "Incluye la integracion de Banca Popolare di Sondrio.",
        "filas": [
            ("Margen de intereses", 2211.8, "eur_millones", "importe"),
            ("Comisiones netas", 1353.4, "eur_millones", "importe"),
            ("Ingresos del segmento", 3876.2, "eur_millones", "importe"),
            ("Costes operativos", 1605.3, "eur_millones", "importe"),
            ("Ratio de eficiencia (cost-income)", 41.4, "pct_ingresos", "ratio"),
            ("Saneamientos por riesgo de credito", 177.0, "eur_millones", "importe"),
            # Del INFORME INTERMEDIO CONSOLIDADO a 30 junio 2026 (p. 34), no
            # del comunicado. NETOS de provisiones; el bruto es 132.119,6.
            ("Prestamos netos a clientes", 129693.8, "eur_millones", "importe"),
            ("Prestamos netos a clientes al cierre anterior", 128738.1,
             "eur_millones", "importe"),
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
                valor=("%.1f" % valor) if (td == "ratio" or valor % 1) else ("%.0f" % valor),
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
