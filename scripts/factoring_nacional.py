#!/usr/bin/env python3
"""Detalle nacional de factoring y confirming: AEF (Espana) y Assifact (Italia).

Las dos asociaciones nacionales publican un desglose que la EUF no da, y ese
desglose revela que **el agregado europeo de la EUF no significa lo mismo en
cada pais** (ver notas.md 2.32).

Ninguna de las dos publica precio. Los valores se han leido de la nota de
prensa de cierre 2025 de la AEF y del fasciculo "Il factoring in cifre"
de Assifact, ambos citados en cada fila.

Uso:
    python3 scripts/factoring_nacional.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FUENTES = {
    "Espana": {
        "fuente": "AEF, Asociacion Espanola de Factoring, datos cierre 2025",
        "url": "https://factoringasociacion.com/rueda-de-prensa-aef-datos-cierre-2025/",
        "filas": [
            ("Cesiones totales factoring y confirming", 269885, "eur_millones", "volumen",
             "coincide con la cifra que la EUF publica para Espana"),
            ("Cesiones de factoring", 127984, "eur_millones", "volumen",
             "47,4 % del total"),
            ("Cesiones de confirming", 141901, "eur_millones", "volumen",
             "52,6 % del total; MAYORIA del agregado espanol"),
            ("Peso del confirming sobre el total", 52.6, "pct_cartera", "ratio",
             "clave para la comparabilidad entre paises"),
            ("Ordenes de pago de confirming", 273000, "eur_millones", "volumen",
             "volumen de ordenes gestionadas, no financiado"),
            ("Creditos gestionados", 400000, "eur_millones", "volumen",
             "supera por primera vez los 400.000 M EUR; ~24 % del PIB"),
            ("Penetracion sobre el PIB, creditos cedidos", 16.5, "pct_cartera", "ratio",
             "los creditos gestionados serian ~24 %"),
            ("Variacion anual de las cesiones", 1.2, "pct_cartera", "ratio",
             "frente a 266.676 M EUR en 2024"),
        ],
    },
    "Italia": {
        "fuente": "Assifact, Il factoring in cifre, diciembre 2025 (datos definitivos)",
        "url": "https://www.assifact.it/category/statistiche/",
        "filas": [
            ("Turnover acumulado", 289105, "eur_millones", "volumen",
             "+3,83 % anual; la EUF publica 297.445 para Italia, perimetros distintos"),
            ("Outstanding (saldo vivo)", 71348, "eur_millones", "volumen",
             "+0,99 %; es SALDO, no flujo cedido"),
            ("Turnover de supply chain finance", 27330, "eur_millones", "volumen",
             "-2,42 % anual"),
            ("Del cual, reverse factoring", 21960, "eur_millones", "volumen",
             "-7,98 % anual"),
            ("Del cual, confirming", 5370, "eur_millones", "volumen",
             "+29,67 % anual; solo el 1,9 % del turnover total italiano"),
            ("Peso del confirming sobre el total", 1.9, "pct_cartera", "ratio",
             "frente al 52,6 % de Espana"),
            ("Creditos deteriorados sobre el total", 2.0, "pct_cartera", "ratio",
             "de los cuales sofferenze 1,03 %"),
            ("Clientes activos por turnover", 25639, "eur_millones", "volumen",
             "NUMERO de clientes, no importe; unidad forzada por el esquema"),
        ],
    },
}


def main():
    destino = os.path.join(ROOT, "factoring_confirming", "factoring_nacional.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0
    for pais, cfg in FUENTES.items():
        for metrica, valor, unidad, td, nota in cfg["filas"]:
            w.writerow(schema.row(
                pais=pais, producto="factoring_y_confirming", metrica=metrica,
                valor="%.1f" % valor, unidad=unidad,
                periodo_referencia="2025", fuente=cfg["fuente"], url=cfg["url"],
                fecha_publicacion=hoy, criterio_segmentacion="n/a",
                tipo_de_dato=td, ponderacion="dato_unico", notas=nota)); n += 1
    fh.close()
    print("%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
