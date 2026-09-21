"""Serie historica del factoring europeo (EUF) y deteccion de series congeladas.

La EUF publica en su pagina de estadisticas anuales un fichero
"EU Turnover per country since 2007". Ese fichero permite comprobar algo que
la tabla del ano corriente esconde: en varios paises el dato NO se recoge,
se ARRASTRA del ano anterior. La propia tabla del ano corriente lo marca con
la nota (3): "Estimates of the turnover - the previous year's turnover
implemented".

Irlanda es el caso mas extremo de nuestros siete paises: figura como
"EUF member till 2018", de modo que desde 2019 no hay una asociacion
nacional que reporte, y su cifra lleva CONGELADA en 28.617 M EUR desde 2021.
Cualquier lectura de nivel, de crecimiento o de cuota de mercado para
Irlanda es, por tanto, una lectura del arrastre y no del mercado.

Uso:
    python3 scripts/euf_factoring_historico.py
"""
import os
import sys
import time

import openpyxl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "raw", "factoring",
                    "euf_turnover_por_pais_desde_2007.xlsx")
DESTINO = os.path.join(ROOT, "factoring_confirming", "euf_historico.csv")
URL = "https://euf.eu.com/data-statistics/annual-factoring-data.html"

# La fila de 2025 no esta en el xlsx (llega hasta 2024); se toma de la tabla
# publicada en la pagina, edicion a 31-dic-2025, ya recogida en
# scripts/euf_factoring.py.
T2025 = {"Francia": 439430.0, "Alemania": 423472.0, "Italia": 297445.0,
         "Espana": 269885.0, "Paises Bajos": 165399.0, "Portugal": 51509.0,
         "Irlanda": 28617.0}

# etiqueta en el xlsx -> nombre canonico del proyecto
NUESTROS = {
    "Spain*": "Espana",
    "Germany*": "Alemania",
    "France*": "Francia",
    "Italy*": "Italia",
    "Portugal*": "Portugal",
    "Netherlands*": "Paises Bajos",
    "Ireland* (EUF member till 2018)": "Irlanda",
}


def leer():
    ws = openpyxl.load_workbook(XLSX, data_only=True).active
    filas = [list(r) for r in ws.iter_rows(values_only=True)]
    cab = next(f for f in filas if f[0] == "Total Turnover")
    inicio = filas.index(cab) + 1
    anios = [(i, c) for i, c in enumerate(cab) if isinstance(c, int)]
    series = {}
    for f in filas[inicio:]:
        etiqueta = f[0]
        if etiqueta not in NUESTROS:
            continue
        s = {}
        for i, a in anios:
            v = f[i]
            if isinstance(v, (int, float)):
                s[a] = float(v)
        pais = NUESTROS[etiqueta]
        if pais in T2025:
            s[2025] = T2025[pais]
        series[pais] = (etiqueta, s)
    return series


def congelado(s):
    """Anios consecutivos, contando hacia atras desde el ultimo, con el mismo
    valor. 1 = el ultimo dato es nuevo."""
    anios = sorted(s)
    ult = s[anios[-1]]
    n = 1
    for a in reversed(anios[:-1]):
        if abs(s[a] - ult) < 0.5:
            n += 1
        else:
            break
    return n


def main():
    hoy = time.strftime("%Y-%m-%d")
    series = leer()
    if os.path.exists(DESTINO):
        os.remove(DESTINO)
    fh, w = schema.writer(DESTINO)
    n = 0
    print("  %-14s %10s %10s  %s" % ("pais", "2025", "2019", "anios repetidos al final"))
    for pais, (etiqueta, s) in series.items():
        rep = congelado(s)
        for a in sorted(s):
            arrastre = ""
            if a > min(s) and abs(s[a] - s.get(a - 1, -1)) < 0.5:
                arrastre = ("DATO REPETIDO respecto a %d: la EUF arrastra el "
                            "importe del ano anterior (nota (3) de la tabla "
                            "publicada). " % (a - 1))
            w.writerow(schema.row(
                pais=pais, producto="factoring",
                metrica="Volumen cedido (turnover) | serie historica EUF",
                valor="%.1f" % s[a], unidad="eur_millones",
                periodo_referencia=str(a),
                fuente="EUF, EU Federation for Factoring, "
                       "'EU Turnover per country since 2007' (2025 de la tabla anual)",
                url=URL, fecha_publicacion=hoy, criterio_segmentacion="n/a",
                tipo_de_dato="volumen", ponderacion="dato_unico",
                notas=arrastre + "importe CEDIDO en el ano, no saldo vivo. "
                      "Etiqueta EUF del pais: '%s'" % etiqueta))
            n += 1
        print("  %-14s %10.0f %10.0f  %d" % (pais, s[2025], s.get(2019, 0), rep))
    fh.close()
    print("\n%d filas -> %s" % (n, DESTINO))

    ir = series["Irlanda"][1]
    print("\nIrlanda, ultimos anios: %s" % ", ".join(
        "%d: %.0f" % (a, ir[a]) for a in sorted(ir) if a >= 2017))
    print("Congelada en %.0f M EUR desde %d (%d anios consecutivos)." % (
        ir[2025], 2025 - congelado(ir) + 1, congelado(ir)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
