# -*- coding: utf-8 -*-
"""Refresca en pres/datos.json los bloques que derivan de los CSV.

`pres/datos.json` es el puente entre los extractores y el generador de la
presentacion. Los bloques que salen del modelo se mantenian a mano, y eso
ya provoco un error (notas.md 2.39: el grafico de depositos quedo vacio
porque el CSV se habia escrito a medias). Aqui se reconstruyen desde los
CSV, de modo que rehacer el modelo y rehacer el deck sean el mismo gesto.

Bloques que toca: `pl`, `sens`, `ent`, `rec`, `sistema`, `apetito` y
`marco`. El resto se deja como esta, porque vienen de extractores distintos.

Uso:
    python3 scripts/modelo_roe.py
    python3 scripts/apetito_riesgo.py
    python3 scripts/datos_presentacion.py
"""
import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(ROOT, "pres", "datos.json")

# nombre del pais en los CSV -> nombre corto que usa la presentacion
PAISES = [("Espana", "España"), ("Alemania", "Alemania"),
          ("Francia", "Francia"), ("Italia", "Italia"),
          ("Portugal", "Portugal"), ("Paises Bajos", "P. Bajos"),
          ("Irlanda", "Irlanda")]


def lee(rel):
    ruta = os.path.join(ROOT, rel)
    if not os.path.exists(ruta):
        sys.exit("falta %s" % rel)
    return list(csv.DictReader(open(ruta, encoding="utf-8")))


def serie(filas, metrica, dec=2, producto=None):
    d = {}
    for x in filas:
        if x["metrica"] != metrica:
            continue
        if producto and x["producto"] != producto:
            continue
        d[x["pais"]] = round(float(x["valor"]), dec)
    falta = [a for a, _ in PAISES if a not in d]
    if falta:
        sys.exit("falta %r para: %s" % (metrica, falta))
    return [d[a] for a, _ in PAISES]


def main():
    mod = lee("transversal/modelo_roe_pyme.csv")
    rec = lee("liquidez/coste_recursos_pyme.csv")
    sis = lee("liquidez/coste_recursos_sistema.csv")

    pl = {
        "precio": serie(mod, "Precio (tipo MIR, tramo <=1 M)"),
        "comisiones": serie(mod, "Comisiones"),
        "ingreso": serie(mod, "Ingreso total"),
        "fondos": serie(mod, "Coste de los recursos de empresa"),
        "margen": serie(mod, "Margen bruto"),
        "cor": serie(mod, "Coste del riesgo"),
        "opex": serie(mod, "Gastos de explotacion",
                      producto="prestamo_pyme_modelo"),
        "bai": serie(mod, "Resultado antes de impuestos",
                     producto="prestamo_pyme_modelo"),
        "capital": serie(mod, "Capital asignado",
                         producto="prestamo_pyme_modelo"),
        "roe": serie(mod, "ROE del prestamo PYME"),
        "tipo": serie(mod, "Tipo impositivo aplicado", 1),
    }
    sens = {str(pb): serie(mod, "ROE con cuna de comisiones de %d pb" % pb)
            for pb in (0, 25, 50, 87, 100, 150)}
    ent = {
        "roe": serie(mod, "ROE del entrante eficiente"),
        "dif": serie(mod, "Diferencia de ROE frente al banco local"),
        "bai": serie(mod, "Resultado antes de impuestos, entrante"),
        "capital": serie(mod, "Capital asignado, entrante"),
        "opex": serie(mod, "Gastos de explotacion, entrante"),
    }
    recb = {
        "vista": serie(rec, "Tipo de deposito a la vista"),
        "plazo": serie(rec, "Tipo de deposito a plazo"),
        "peso_vista": serie(rec, "Peso del deposito a la vista"),
        "coste": serie(rec, "Coste ponderado de los recursos de empresa"),
        "margen": serie(rec, "Margen sobre la facilidad de deposito del BCE"),
    }
    sistema = {
        "empresas": serie(sis, "Coste de los depositos de empresa"),
        "hogares": serie(sis, "Coste de los depositos de hogares"),
        "sistema": serie(sis, "Coste de los depositos del sistema"),
        "dif_pb": [int(v) for v in serie(
            sis, "Diferencia entre el coste de empresa y el del sistema", 0)],
        "peso_empresas": serie(
            sis, "Peso de los depositos de empresa sobre el total minorista", 1),
    }

    ap = lee("transversal/apetito_riesgo.csv")
    mar = lee("transversal/marco_riesgo.csv")

    def corr(filas, metrica):
        hit = [x for x in filas if x["metrica"] == metrica]
        if not hit:
            sys.exit("falta la correlacion %r" % metrica)
        return round(float(hit[0]["valor"]), 2)

    apetito = {
        "mnr": serie(ap, "Margen neto de riesgo del prestamo PYME"),
        "grad_pyme": [int(v) for v in serie(
            ap, "Gradiente de precio dentro de PYME", 0)],
        "grad_tot": [int(v) for v in serie(
            ap, "Gradiente de precio PYME frente a gran empresa", 0)],
        "corr": {
            "precio_pd": corr(ap, "Correlacion Spearman de Precio del "
                                  "prestamo PYME con PD PYME"),
            "precio_cor": corr(ap, "Correlacion Spearman de Precio del "
                                   "prestamo PYME con Coste del riesgo"),
            "mnr_pd": corr(ap, "Correlacion Spearman de Margen neto de "
                               "riesgo con PD PYME"),
            "roe_pd": corr(ap, "Correlacion Spearman de ROE del prestamo "
                               "PYME con PD PYME"),
            "gradtot_roe": corr(ap, "Correlacion Spearman de Gradiente de "
                                    "precio PYME frente a gran empresa con "
                                    "ROE del prestamo PYME"),
        },
    }
    marco = {
        "info": serie(mar, "Indice de informacion para la seleccion", 1),
        "recobro": serie(mar, "Indice del entorno de recobro", 1),
        "recovery": serie(mar, "Tasa de recuperacion en concurso", 1),
        "tiempo": serie(mar, "Tiempo de resolucion del concurso", 1),
        "coste": serie(mar, "Coste del procedimiento concursal", 1),
        "legal": serie(mar, "Fortaleza de los derechos legales del acreedor", 1),
        "depth": serie(mar, "Profundidad de la informacion crediticia", 1),
        "corr": {
            "info_pd": [corr(mar, "Correlacion Pearson de Indice de "
                                  "informacion con PD PYME"),
                        corr(mar, "Correlacion Spearman de Indice de "
                                  "informacion con PD PYME")],
            "info_lgd": [corr(mar, "Correlacion Pearson de Indice de "
                                   "informacion con LGD PYME"),
                         corr(mar, "Correlacion Spearman de Indice de "
                                   "informacion con LGD PYME")],
            "rec_pd": [corr(mar, "Correlacion Pearson de Indice de recobro "
                                 "con PD PYME"),
                       corr(mar, "Correlacion Spearman de Indice de recobro "
                                 "con PD PYME")],
            "rec_lgd": [corr(mar, "Correlacion Pearson de Indice de recobro "
                                  "con LGD PYME"),
                        corr(mar, "Correlacion Spearman de Indice de recobro "
                                  "con LGD PYME")],
            "rec_lgd_spt": [
                corr(mar, "Correlacion Pearson de Indice de recobro con LGD "
                          "PYME excluyendo Portugal"),
                corr(mar, "Correlacion Spearman de Indice de recobro con LGD "
                          "PYME excluyendo Portugal")],
        },
    }

    D = json.load(open(DESTINO, encoding="utf-8"))
    claves = ("pl", "sens", "ent", "rec", "sistema", "apetito", "marco")
    antes = {k: D.get(k) for k in claves}
    D["pl"], D["sens"], D["ent"] = pl, sens, ent
    D["rec"], D["sistema"] = recb, sistema
    # el bloque `riesgo` (tabla documental de infraestructura crediticia)
    # no deriva de ningun CSV y no se toca aqui
    D["apetito"], D["marco"] = apetito, marco
    D.pop("dep", None)          # bloque muerto: quedo a cero y no se usa
    json.dump(D, open(DESTINO, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    cambios = [k for k in antes if antes[k] != D.get(k)]
    print("bloques reescritos: %s" % ", ".join(sorted(cambios))
          if cambios else "sin cambios")
    print("%-14s %8s %8s" % ("", "ROE", "fondos"))
    for i, (_, corto) in enumerate(PAISES):
        print("%-14s %7.1f%% %7.2f%%" % (corto, pl["roe"][i], pl["fondos"][i]))
    print()
    print("escrito: %s" % DESTINO)
    return 0


if __name__ == "__main__":
    sys.exit(main())
