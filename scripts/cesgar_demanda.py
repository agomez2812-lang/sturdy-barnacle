# -*- coding: utf-8 -*-
"""Lado de la demanda: que pide la PYME espanola y a quien.

Fuente: CESGAR, XV Informe "La financiacion de la pyme en Espana",
resultados anuales de 2025, publicado en 2026. Encuesta a pymes espanolas,
en colaboracion con Abay Analistas Economicos. Descarga libre.

Las cifras se transcriben a mano del informe porque es un PDF maquetado sin
tablas extraibles; cada fila lleva en `notas` el grafico o el apartado del
que sale, para que sea verificable. Es una ENCUESTA: son porcentajes de
empresas, no niveles de tipos ni volumenes, y no deben mezclarse con las
series del MIR (ver notas.md, regla de niveles frente a porcentajes de
encuesta).

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "transversal", "cesgar_demanda.csv")
URL = ("http://cesgar.es/wp-content/uploads/2026/04/"
       "XV_Informe-financiacion-pyme_Cesgar-2025.pdf")
FUENTE = ("CESGAR, XV Informe La financiacion de la pyme en Espana, "
          "resultados 2025")
HOY = "2026-09-18"

# (metrica, valor, periodo, nota)
FILAS = [
    ("Pymes con necesidades de financiacion", 51.2, "2025",
     "grafico 10; las haya buscado activamente o no. Unos 1,8 millones de "
     "empresas"),
    ("Grado de bancarizacion de la pyme", 70.9, "2025",
     "grafico 18; pymes con necesidades que recurren a financiacion "
     "bancaria"),
    ("Grado de bancarizacion de la pyme", 76.5, "2024", "grafico 18"),
    ("Grado de bancarizacion de la pyme", 69.0, "2023", "grafico 18"),
    ("Solicitudes que obtienen la financiacion y la aceptan", 92.8, "2025",
     "apartado 3; el valor mas alto de los ultimos tres anos"),
    ("Solicitudes no concedidas", 3.2, "2025", "apartado 3"),
    ("Financiacion concedida pero rechazada por condiciones", 2.7, "2025",
     "apartado 3"),
    # destino
    ("Destino de la financiacion | Circulante", 73.0, "2025",
     "grafico 13; sube desde el 64,6 % de 2024"),
    ("Destino de la financiacion | Circulante", 64.6, "2024", "grafico 13"),
    ("Destino de la financiacion | Inversion en equipo productivo", 33.2,
     "2025", "grafico 13"),
    ("Destino de la financiacion | Inversion en inmuebles", 12.0, "2025",
     "grafico 13"),
    ("Destino de la financiacion | Inversion en innovacion", 4.3, "2025",
     "grafico 13"),
    # instrumentos
    ("Uso de productos | Lineas de credito", 22.0, "2025",
     "grafico 9; el informe da porcentajes cercanos al 22 %"),
    ("Uso de productos | Prestamo bancario", 22.0, "2025", "grafico 9"),
    ("Uso de productos | Credito de proveedores", 16.0, "2025",
     "grafico 9; credito comercial, no bancario"),
    ("Uso de productos | Lineas ICO", 13.0, "2025", "grafico 9"),
    ("Uso de productos | Leasing", 11.0, "2025", "grafico 9"),
    ("Uso de productos | Avales y garantias de SGR", 3.0, "2025",
     "grafico 9"),
    # obstaculos
    ("Obstaculos | Ninguno", 49.2, "2025",
     "grafico 17; el resultado mas frecuente"),
    ("Obstaculos | El precio de la financiacion", 21.6, "2025",
     "grafico 17; el principal obstaculo identificado"),
    ("Obstaculos | Falta de comprension del negocio por la entidad", 10.5,
     "2025", "grafico 17"),
    ("Obstaculos | Tramites administrativos y otros", 8.6, "2025",
     "grafico 17"),
    ("Obstaculos | Escasez de financiacion disponible", 5.7, "2025",
     "grafico 17"),
]


def main():
    if os.path.exists(OUT):
        os.remove(OUT)
    fh, w = schema.writer(OUT)
    for metrica, valor, per, nota in FILAS:
        w.writerow(schema.row(
            pais="Espana", producto="demanda_pyme", metrica=metrica,
            valor="%.4f" % valor, unidad="pct_neto_encuesta",
            periodo_referencia=per, fuente=FUENTE, url=URL,
            fecha_publicacion=HOY,
            criterio_segmentacion="tamano_empresa_empleados",
            tipo_de_dato="porcentaje_neto_encuesta", ponderacion="dato_unico",
            notas="ENCUESTA: porcentaje de empresas, no un nivel de tipo ni "
                  "un volumen. " + nota))
    fh.close()
    print("%d filas -> %s" % (len(FILAS), OUT))
    for metrica, valor, per, _ in FILAS:
        print("  %-62s %s  %5.1f %%" % (metrica[:62], per, valor))
    return 0


if __name__ == "__main__":
    sys.exit(main())
