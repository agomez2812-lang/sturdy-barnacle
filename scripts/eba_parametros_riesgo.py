#!/usr/bin/env python3
"""Parametros de riesgo IRB de PYME: PD, LGD, tasa de default y tasa de
perdida, por pais, desde el anexo de parametros de riesgo del EBA.

Fuente primaria COREP C 9.02, que es la misma que se usa habitualmente para
calcular coste del riesgo como PD x LGD. Sustituye al CoR supuesto que
usaba el modelo, y al CoR del EBA de grupo, que esta contaminado por el
negocio internacional y de consumo de los grandes grupos.

Clase de exposicion: "Corporates - Of Which: SME".

Se recoge el percentil 50 (entidad mediana) y la media ponderada. Para el
modelo se usa la MEDIANA, porque la media ponderada se deja arrastrar por
carteras grandes con parametros extremos.

Uso:
    python3 scripts/eba_parametros_riesgo.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "raw", "eba", "credit_risk_q1_2026.xlsx")
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "risk-monitoring/risk-dashboard")
PAISES = {"Spain": "Espana", "Germany": "Alemania", "France": "Francia",
          "Italy": "Italia", "Portugal": "Portugal", "Netherlands": "Paises Bajos",
          "Ireland": "Irlanda"}
CLASES = {
    "Corporates - Of Which: SME": "Empresas, del cual PYME",
    "Corporates - Of Which: Large corporates": "Empresas, del cual gran empresa",
    "Corporates": "Empresas, total",
    "Retail - Of Which: Secured by immovable property": "Minorista con garantia inmobiliaria",
}
# columna base de cada bloque (N, 25th, 50th, 75th, W.A)
BLOQUES = {"Tasa de default": 3, "Tasa de perdida": 8, "PD ajustada": 13, "LGD": 18}


def main():
    if not os.path.exists(XLSX):
        sys.exit("falta %s; descargalo primero (ver fuentes.md)" % XLSX)
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    rows = list(wb["2026 Q1"].iter_rows(values_only=True))
    wb.close()

    destino = os.path.join(ROOT, "transversal", "eba_parametros_riesgo.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = __import__("time").strftime("%Y-%m-%d")
    pais = None
    n = 0
    res = {}
    for r in rows[13:]:
        if r[1]:
            pais = str(r[1]).strip()
        clase = str(r[2]).strip() if r[2] else ""
        if pais not in PAISES or clase not in CLASES:
            continue
        for bloque, c0 in BLOQUES.items():
            for etiqueta, off in (("mediana", 2), ("media ponderada", 4)):
                v = r[c0 + off]
                if v is None or not isinstance(v, (int, float)):
                    continue
                w.writerow(schema.row(
                    pais=PAISES[pais], producto="parametros_riesgo_irb",
                    metrica="%s (%s) | %s" % (bloque, etiqueta, CLASES[clase]),
                    valor="%.4f" % (100 * v), unidad="pct_cartera",
                    periodo_referencia="2026-Q1",
                    fuente="EBA, anexo de parametros de riesgo (COREP C 9.02)",
                    url=URL, fecha_publicacion=hoy,
                    criterio_segmentacion="pyme_interna_banco",
                    tipo_de_dato="ratio", ponderacion=(
                        "media_ponderada_volumen" if etiqueta == "media ponderada"
                        else "media_simple"),
                    notas="clase de exposicion IRB: %s; N = numero de "
                          "entidades declarantes" % clase)); n += 1
                if clase == "Corporates - Of Which: SME" and etiqueta == "mediana":
                    res.setdefault(PAISES[pais], {})[bloque] = 100 * v

    # Coste del riesgo derivado: PD x LGD, como en la practica habitual.
    print("\nPYME, clase IRB 'Corporates - Of Which: SME', mediana de entidades\n")
    print("%-14s %10s %9s %12s %12s" % ("", "PD", "LGD", "PD x LGD", "tasa perdida"))
    for p, d in res.items():
        pd_, lgd = d.get("PD ajustada"), d.get("LGD")
        tp = d.get("Tasa de perdida")
        if pd_ is None or lgd is None:
            continue
        cor = pd_ * lgd / 100.0
        print("%-14s %9.2f%% %8.1f%% %11.2f%% %11s" % (
            p[:13], pd_, lgd, cor, ("%.2f%%" % tp) if tp is not None else "-"))
        w.writerow(schema.row(
            pais=p, producto="parametros_riesgo_irb",
            metrica="Coste del riesgo PYME (PD x LGD, mediana)",
            valor="%.4f" % cor, unidad="pct_cartera", periodo_referencia="2026-Q1",
            fuente="EBA, anexo de parametros de riesgo (COREP C 9.02), calculo propio",
            url=URL, fecha_publicacion=hoy,
            criterio_segmentacion="pyme_interna_banco", tipo_de_dato="ratio",
            ponderacion="media_simple",
            notas="PD ajustada %.2f%% por LGD %.1f%%, ambas mediana de "
                  "entidades declarantes" % (pd_, lgd))); n += 1
    fh.close()
    print("\n%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
