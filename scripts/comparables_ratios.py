#!/usr/bin/env python3
"""Comparables banco a banco, expresados en % DE LA INVERSION CREDITICIA.

La version en importes absolutos de la lamina no se puede comparar entre
bancos -ni con la cuenta del prestamo PYME de la lamina 7, que esta en % del
saldo medio- porque cada banco tiene un tamano distinto y publica un periodo
distinto. Aqui se divide cada partida por la inversion crediticia del mismo
perimetro que la cuenta, y se ANUALIZA segun el periodo publicado:

    Commerzbank  2026-Q2  -> x4
    los demas    2026-H1  -> x2

DOS AVISOS QUE NO SE PUEDEN SALTAR:

1. El denominador es la INVERSION, pero el numerador es el ingreso de TODO
   el segmento, que incluye el margen de los DEPOSITOS y la operativa
   transaccional. Por eso "ingresos / inversion" NO es un margen de
   prestamo y no se puede comparar con el precio del MIR. Banca dei
   Territori lo ensena en caricatura: 5,6 % sobre prestamos, porque es una
   division minorista con gestion de activos y seguros dentro.

   La fila que SI es comparable es COMISIONES / INVERSION, porque es
   exactamente la magnitud que el modelo supone en 87 pb.

2. Los perimetros no son homogeneos y no se pueden ordenar entre si:
   Commerzbank, ABN AMRO e Intesa publican SEGMENTO; CaixaBank y BPER solo
   publican GRUPO, que lleva dentro hipoteca minorista y consumo.

Base del denominador: Commerzbank da cartera MEDIA del periodo; Intesa y
BPER permiten media de los dos cierres; ABN AMRO y CaixaBank solo dan
saldo final. CaixaBank ademas lo da BRUTO y los demas NETO; con su mora
del 1,78 % y la cobertura habitual, el neto seria del orden de un 1,3 %
menor, lo que subiria sus ratios unos 1-2 pb. No se ajusta: se declara.

Uso:
    python3 scripts/comparables_ratios.py
"""
import collections
import csv
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(ROOT, "comparables_bancos", "comparables_bancos.csv")
SALIDA = os.path.join(ROOT, "comparables_bancos", "comparables_ratios.csv")

# banco -> (pais, segmento, factor de anualizacion, periodo, base del saldo)
BANCOS = collections.OrderedDict([
    ("Commerzbank", ("Alemania", "Corporate Clients", 4.0, "2026-Q2",
                     "cartera media del periodo")),
    ("ABN AMRO", ("P. Bajos", "Corporate Banking", 2.0, "2026-H1",
                  "saldo final, neto")),
    ("Intesa Sanpaolo", ("Italia", "Banca dei Territori", 2.0, "2026-H1",
                         "media de los dos cierres, neto")),
    ("CaixaBank", ("Espana", "Grupo consolidado", 2.0, "2026-H1",
                   "saldo final, BRUTO")),
    ("BPER Banca", ("Italia", "Grupo consolidado", 2.0, "2026-H1",
                    "media de los dos cierres, neto")),
])
SEGMENTO = {"Commerzbank", "ABN AMRO", "Intesa Sanpaolo"}

# metricas de las que sale el denominador, por orden de preferencia
SALDO = ["Cartera media de prestamos", "Prestamos a clientes",
         "Prestamos netos a clientes", "Credito a la clientela bruto"]
ANTERIOR = ["Prestamos a clientes al cierre anterior",
            "Prestamos netos a clientes al cierre anterior"]

# El modelo de la lamina 7 supone esta comision sobre el saldo medio.
SUPUESTO_COMISIONES = 0.87


def carga():
    d = collections.defaultdict(dict)
    with open(ENTRADA, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            banco = r["fuente"].split("(")[0].strip()
            met = r["metrica"].split(" | ")[0]
            d[banco][met] = float(r["valor"])
            d[banco].setdefault("_url", r["url"])
            d[banco].setdefault("_doc", r["fuente"])
    return d


def denominador(x):
    fin = next((x[k] for k in SALDO if k in x), None)
    ant = next((x[k] for k in ANTERIOR if k in x), None)
    if fin is None:
        return None
    return (fin + ant) / 2.0 if ant is not None else fin


def main():
    dat = carga()
    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(SALIDA):
        os.remove(SALIDA)
    fh, w = schema.writer(SALIDA)
    filas, n = [], 0

    for banco, (pais, seg, f, per, base) in BANCOS.items():
        x = dat[banco]
        inv = denominador(x)
        if not inv:
            continue
        # costes: publicados, o deducidos de la eficiencia sobre el ingreso
        ing = x.get("Ingresos del segmento")
        cos = x.get("Costes operativos")
        if cos is None and ing is not None and "Ratio de eficiencia (cost-income)" in x:
            cos = ing * x["Ratio de eficiencia (cost-income)"] / 100.0
        # dotaciones: publicadas en importe, o del coste del riesgo en pb
        dot = x.get("Provisiones y saneamientos", x.get("Saneamientos por riesgo de credito"))
        cor = (dot * f / inv * 10000.0 if dot is not None
               else x.get("Coste del riesgo"))

        r = {"banco": banco, "pais": pais, "segmento": seg, "periodo": per,
             "inversion": inv, "base": base,
             "es_segmento": banco in SEGMENTO,
             "ingresos": ing * f / inv * 100.0 if ing is not None else None,
             "mi": (x["Margen de intereses"] * f / inv * 100.0
                    if "Margen de intereses" in x else None),
             "comisiones": (x["Comisiones netas"] * f / inv * 100.0
                            if "Comisiones netas" in x else None),
             "costes": cos * f / inv * 100.0 if cos is not None else None,
             "cor": cor,
             "eficiencia": x.get("Ratio de eficiencia (cost-income)"),
             }
        r["resultado"] = (None if r["ingresos"] is None or r["costes"] is None
                          else r["ingresos"] - r["costes"]
                          - (r["cor"] or 0.0) / 100.0)
        filas.append(r)

        base_fila = dict(
            pais=pais, producto="segmento_empresas", periodo_referencia=per,
            fuente=x["_doc"], url=x["_url"], fecha_publicacion=hoy,
            criterio_segmentacion="entidad", ponderacion="dato_unico")
        aviso = ("denominador: inversion crediticia del mismo perimetro (%s), "
                 "%.0f M EUR. Partidas anualizadas x%.0f desde %s. "
                 "PERIMETRO: %s. " % (base, inv, f, per,
                                      "segmento publicado" if r["es_segmento"]
                                      else "GRUPO, no segmento de empresas"))
        for met, val, uni, nota in [
            ("Ingresos del segmento sobre la inversion", r["ingresos"], "pct_cartera",
             "NO es un margen de prestamo: el ingreso incluye el margen de "
             "depositos y la operativa transaccional del segmento"),
            ("Margen de intereses sobre la inversion", r["mi"], "pct_cartera",
             "incluye el margen de depositos del segmento"),
            ("Comisiones netas sobre la inversion", r["comisiones"], "pct_cartera",
             "esta SI es comparable con el supuesto de %.2f %% del modelo"
             % SUPUESTO_COMISIONES),
            ("Costes operativos sobre la inversion", r["costes"], "pct_cartera",
             "publicados, o deducidos del ratio de eficiencia sobre el ingreso"),
            ("Coste del riesgo sobre la inversion", r["cor"], "pb",
             "dotaciones anualizadas sobre la inversion"),
            ("Resultado antes de impuestos sobre la inversion", r["resultado"],
             "pct_cartera", "ingresos menos costes menos coste del riesgo"),
            ("Inversion crediticia del perimetro", inv, "eur_millones",
             "denominador de todas las filas anteriores; base: %s" % base),
        ]:
            if val is None:
                continue
            w.writerow(schema.row(
                metrica="%s | %s" % (banco, met), valor="%.4f" % val,
                unidad=uni, tipo_de_dato="ratio" if uni != "eur_millones" else "importe",
                notas=aviso + nota, **base_fila)); n += 1
    fh.close()

    nd = lambda v, s="%6.2f%%": "   n/d" if v is None else s % v
    print("En %% de la inversion crediticia, anualizado.\n")
    print("%-16s %-20s %9s %8s %8s %8s %8s %7s %8s" % (
        "banco", "perimetro", "inversion", "ingr.", "m.int.", "COMIS.",
        "costes", "CoR", "BAI"))
    for r in filas:
        print("%-16s %-20s %9.0f %s %s %s %s %s %s" % (
            r["banco"], r["segmento"][:20], r["inversion"],
            nd(r["ingresos"]), nd(r["mi"]), nd(r["comisiones"]),
            nd(r["costes"]), nd(r["cor"], "%5.0f pb"), nd(r["resultado"])))
    com = [r["comisiones"] for r in filas if r["comisiones"] is not None]
    print("\nComisiones sobre inversion: de %.2f %% a %.2f %%; supuesto del "
          "modelo %.2f %%." % (min(com), max(com), SUPUESTO_COMISIONES))
    seg = [r["comisiones"] for r in filas
           if r["comisiones"] is not None and r["es_segmento"]]
    print("Solo segmentos de empresas publicados: %s"
          % ", ".join("%.2f %%" % v for v in seg))
    print("\n%d filas -> %s" % (n, SALIDA))
    json.dump(filas, open(os.path.join(ROOT, "pres", "comparables_ratios.json"),
                          "w"), indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
