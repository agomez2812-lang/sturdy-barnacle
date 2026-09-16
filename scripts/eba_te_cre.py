#!/usr/bin/env python3
"""Extrae exposicion a inmueble comercial y densidad de RWA banco a banco
desde los ficheros del EBA Transparency Exercise, hacia /hipotecas.

El EBA publica los datos en formato largo (una fila por banco / pais /
cartera / partida / valor), pero los nombres de columna y los codigos de
partida cambian entre ediciones. Por eso este script NO codifica nombres a
mano: se trabaja en dos pasos.

    # 1) inspeccionar el fichero descargado y ver su estructura real
    python3 scripts/eba_te_cre.py --inspect raw/eba_te_credit_risk.csv

    # 2) rellenar mapeo_eba.json con lo que muestre el paso 1 y extraer
    python3 scripts/eba_te_cre.py --extract raw/eba_te_credit_risk.csv \
        --mapeo scripts/mapeo_eba.json --periodo 2025-12

Metrica objetivo: EAD y RWA de la cartera con garantia de inmueble
comercial, y su cociente (densidad de RWA), por banco y pais.
"""
import argparse
import collections
import csv
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_TE = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
          "eu-wide-transparency-exercise")

# Codigos ISO de los seis paises del encargo.
PAISES = {"ES", "DE", "FR", "IT", "PT", "NL"}


def lee(path):
    """Lee CSV detectando el delimitador (el EBA alterna ',' y ';')."""
    with open(path, encoding="utf-8-sig", errors="replace") as fh:
        muestra = fh.read(65536)
        fh.seek(0)
        try:
            dial = csv.Sniffer().sniff(muestra, delimiters=",;\t|")
        except csv.Error:
            dial = csv.excel
        return list(csv.DictReader(fh, dialect=dial))


def inspect(path, max_vals=25):
    """Muestra columnas y valores distintos de las columnas categoricas."""
    filas = lee(path)
    if not filas:
        print("fichero vacio"); return 1
    print("filas: %d" % len(filas))
    print("columnas: %s\n" % list(filas[0]))
    for col in filas[0]:
        vals = collections.Counter(
            (f.get(col) or "").strip() for f in filas)
        if len(vals) <= max_vals:
            print("-- %s  (%d distintos)" % (col, len(vals)))
            for v, n in vals.most_common():
                print("     %-55s %8d" % (v[:55] or "(vacio)", n))
        else:
            ej = [v for v, _ in vals.most_common(3)]
            print("-- %s  (%d distintos, alta cardinalidad) ej: %s"
                  % (col, len(vals), ej))
    print("\nRellena scripts/mapeo_eba.json con los nombres y codigos "
          "que veas arriba.")
    return 0


def num(x):
    """Convierte importes del EBA a float; admite coma decimal y miles."""
    s = (x or "").strip().replace(" ", "").replace(" ", "")
    if not s or s.upper() in {"NA", "N/A", "-", "NULL"}:
        return None
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")     # 1.234,56
    elif "," in s:
        s = s.replace(",", ".")                      # 1234,56
    try:
        return float(s)
    except ValueError:
        return None


def extract(path, mapeo, periodo, salida):
    m = json.load(open(mapeo, encoding="utf-8"))
    req = ["columna_banco", "columna_pais", "columna_cartera",
           "columna_item", "columna_valor", "items", "filtro_cartera"]
    falta = [k for k in req if not m.get(k)]
    if falta:
        print("mapeo incompleto, faltan claves: %s" % falta); return 1

    patron = re.compile(m["filtro_cartera"], re.I)
    cod_ead, cod_rwa = m["items"].get("ead"), m["items"].get("rwa")
    escala = float(m.get("escala_a_millones", 1))

    # (banco, pais) -> {item: importe}
    acc = collections.defaultdict(dict)
    for f in lee(path):
        cartera = (f.get(m["columna_cartera"]) or "").strip()
        if not patron.search(cartera):
            continue
        pais = (f.get(m["columna_pais"]) or "").strip().upper()[:2]
        if pais not in PAISES:
            continue
        v = num(f.get(m["columna_valor"]))
        if v is None:
            continue
        item = (f.get(m["columna_item"]) or "").strip()
        clave = ((f.get(m["columna_banco"]) or "").strip(), pais)
        acc[clave][item] = acc[clave].get(item, 0.0) + v

    fh, w = schema.writer(salida)
    n = 0
    for (banco, pais), items in sorted(acc.items()):
        ead = items.get(cod_ead)
        rwa = items.get(cod_rwa)
        base = dict(
            pais=schema.COUNTRIES.get(pais, pais),
            producto="inmueble_comercial_garantia_hipotecaria",
            periodo_referencia=periodo,
            fuente="EBA, EU-wide Transparency Exercise (%s)" % banco,
            url=URL_TE,
            fecha_publicacion=m.get("fecha_publicacion", periodo),
            criterio_segmentacion="entidad",
            ponderacion="dato_unico",
        )
        if ead is not None:
            w.writerow(schema.row(metrica="EAD | %s" % banco,
                                  valor="%.2f" % (ead * escala),
                                  unidad="eur_millones", tipo_de_dato="importe",
                                  notas="cartera: %s" % m["filtro_cartera"],
                                  **base)); n += 1
        if rwa is not None:
            w.writerow(schema.row(metrica="RWA | %s" % banco,
                                  valor="%.2f" % (rwa * escala),
                                  unidad="eur_millones", tipo_de_dato="importe",
                                  notas="cartera: %s" % m["filtro_cartera"],
                                  **base)); n += 1
        if ead and rwa is not None:
            w.writerow(schema.row(metrica="Densidad de RWA | %s" % banco,
                                  valor="%.2f" % (100.0 * rwa / ead),
                                  unidad="pct_rwa", tipo_de_dato="ratio",
                                  notas="RWA/EAD calculado; no publicado "
                                        "directamente por el EBA",
                                  **base)); n += 1
    fh.close()
    print("%d observaciones -> %s" % (n, salida))
    if not n:
        print("Sin resultados: revisa 'filtro_cartera' y los codigos de "
              "'items' con --inspect.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inspect", metavar="CSV")
    ap.add_argument("--extract", metavar="CSV")
    ap.add_argument("--mapeo", default=os.path.join(ROOT, "scripts", "mapeo_eba.json"))
    ap.add_argument("--periodo", default="")
    ap.add_argument("--salida", default=os.path.join(ROOT, "hipotecas", "hipotecas.csv"))
    a = ap.parse_args()
    if a.inspect:
        return inspect(a.inspect)
    if a.extract:
        if not a.periodo:
            ap.error("--extract requiere --periodo (p.ej. 2025-12)")
        return extract(a.extract, a.mapeo, a.periodo, a.salida)
    ap.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
