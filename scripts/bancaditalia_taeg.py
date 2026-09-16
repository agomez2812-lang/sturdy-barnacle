#!/usr/bin/env python3
"""Extrae el TAEG de prestamos a sociedades no financieras de la publicacion
STACORIS de la Banca d'Italia (tavola TRI30951, fuente AnaCredit).

Italia es, junto con Espana, el unico de los seis paises del encargo que
publica un tipo CON comisiones para empresas, desglosado por clase de
importe. El BCE solo publica TAE para hogares.

Perimetro, que NO coincide con el del MIR ni con el del Boletin espanol:
  - solo prestamos "connessi ad esigenze di investimento"
  - clase de grandezza del "ammontare a disposizione", no importe del prestamo
  - excluye empresarios individuales y operaciones de import/export
  - muestra de bancos declarantes a AnaCredit

Uso:
    python3 scripts/bancaditalia_taeg.py --pdf raw/it/stacoris_2026q1.pdf \
        --periodo 2026-Q1
"""
import argparse
import logging
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

logging.disable(logging.WARNING)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = ("https://www.bancaditalia.it/pubblicazioni/condizioni-rischiosita/"
       "index.html")
DURACIONES = ["Total duraciones", "Hasta 1 ano", "De 1 a 5 anos", "Mas de 5 anos"]
# Clases de importe por pagina del fasciculo, en orden de aparicion.
CLASES = {
    44: ["Total clases", "Hasta 50.000 EUR"],
    45: ["De 50.000 a 125.000 EUR", "De 125.000 a 250.000 EUR"],
    46: ["De 250.000 a 500.000 EUR", "De 500.000 a 1.000.000 EUR"],
    47: ["Mas de 1.000.000 EUR"],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default=os.path.join(ROOT, "raw", "it",
                                                  "stacoris_2026q1.pdf"))
    ap.add_argument("--periodo", default="2026-Q1")
    a = ap.parse_args()
    if not os.path.exists(a.pdf):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % a.pdf)

    from pypdf import PdfReader
    r = PdfReader(a.pdf)
    destino = os.path.join(ROOT, "prestamos_personales", "bancaditalia_taeg.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    n = 0

    for pag, clases in sorted(CLASES.items()):
        txt = re.sub(r"\s+", " ", r.pages[pag].extract_text() or "")
        # La primera linea "di cui: Societa non finanziarie" de cada pagina
        # corresponde al total nacional ITALIA; las siguientes son regiones.
        m = re.search(r"di cui: Societ[^0-9]{0,120}?"
                      r"((?:\d+,\d+\s+){3,7}\d+,\d+)", txt)
        if not m:
            print("  pagina %d: no se encontro la fila nacional" % pag)
            continue
        vals = [float(v.replace(",", ".")) for v in m.group(1).split()]
        esperados = len(clases) * len(DURACIONES)
        if len(vals) != esperados:
            print("  pagina %d: %d valores, esperaba %d; se omite"
                  % (pag, len(vals), esperados))
            continue
        for ci, clase in enumerate(clases):
            for di, dur in enumerate(DURACIONES):
                v = vals[ci * len(DURACIONES) + di]
                w.writerow(schema.row(
                    pais="Italia", producto="prestamo_empresas_por_tramo",
                    metrica="TAEG (tipo con comisiones) | prestamos de inversion",
                    valor="%.2f" % v, unidad="pct_anual",
                    periodo_referencia=a.periodo,
                    fuente="Banca d'Italia, STACORIS, tavola TRI30951 "
                           "(fuente AnaCredit)",
                    url=URL, fecha_publicacion=hoy,
                    tramo_importe=clase, plazo_fijacion=dur,
                    criterio_segmentacion="tamano_prestamo",
                    tipo_de_dato="nivel",
                    ponderacion="media_ponderada_volumen",
                    notas="sociedades no financieras y familias productoras, "
                          "excluidos empresarios individuales; solo prestamos "
                          "de inversion; clase = ammontare a disposizione, no "
                          "importe del prestamo; NO comparable directamente "
                          "con los tramos del MIR")); n += 1
        print("  pagina %d: %s -> %d filas" % (pag, ", ".join(clases), esperados))
    fh.close()
    print("\n%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
