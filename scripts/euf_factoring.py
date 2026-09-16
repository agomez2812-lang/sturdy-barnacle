#!/usr/bin/env python3
"""Volumen de factoring por pais, EU Federation for Factoring (EUF).

La EUF no publica un fichero descargable directo: los datos estan en la
tabla de la pagina de estadisticas anuales. Los valores de abajo se han
leido de esa tabla, edicion 2025, y cada fila lo declara en su fuente.

El "turnover" es el importe CEDIDO en el ano, no el saldo vivo. No debe
compararse con la cartera de credito del MIR ni del EBA.

Uso:
    python3 scripts/euf_factoring.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://euf.eu.com/data-statistics/annual-factoring-data.html"
ANIO = "2025"

# pais -> (turnover M EUR, cuota de mercado europeo %, % del PIB, var. anual %)
DATOS = {
    "Francia":      (439430, 17.2, 14.8, 1.9),
    "Alemania":     (423472, 16.6,  9.5, 6.2),
    "Italia":       (297445, 11.6, 13.2, 3.8),
    "Espana":       (269885, 10.6, 16.5, 1.2),
    "Paises Bajos": (165399,  6.5, 14.0, 5.3),
    "Portugal":     ( 51509,  2.0, 20.7, 12.7),
}


def main():
    destino = os.path.join(ROOT, "factoring_confirming", "euf_factoring.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0
    for pais, (turnover, cuota, pib, var) in DATOS.items():
        base = dict(
            pais=pais, producto="factoring", periodo_referencia=ANIO,
            fuente="EUF, EU Federation for Factoring, datos anuales %s" % ANIO,
            url=URL, fecha_publicacion=hoy, criterio_segmentacion="n/a",
            ponderacion="dato_unico")
        for metrica, valor, unidad, td, nota in [
            ("Volumen cedido (turnover)", turnover, "eur_millones", "volumen",
             "importe CEDIDO en el ano, no saldo vivo; no comparable con "
             "cartera de credito"),
            ("Cuota sobre el mercado europeo", cuota, "pct_cartera", "ratio",
             "sobre un total europeo de 2,055 billones de euros"),
            ("Penetracion sobre el PIB", pib, "pct_cartera", "ratio",
             "volumen cedido anual sobre PIB"),
            ("Variacion anual del volumen", var, "pct_cartera", "ratio",
             "frente al ano anterior"),
        ]:
            w.writerow(schema.row(metrica=metrica, valor="%.1f" % valor,
                                  unidad=unidad, tipo_de_dato=td,
                                  notas=nota, **base)); n += 1
    fh.close()
    print("%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
