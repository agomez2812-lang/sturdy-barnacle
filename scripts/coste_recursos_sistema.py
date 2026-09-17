# -*- coding: utf-8 -*-
"""Coste de los depositos: empresa frente a sistema.

Pregunta del usuario: el coste de los recursos que usa el modelo PYME, se
puede comparar con el coste de los recursos del sistema bancario, o es el
mismo numero?

No es el mismo. El modelo usa el coste de los depositos de SOCIEDADES NO
FINANCIERAS (sector 2240), que es el pasivo que aporta el propio cliente
PYME. El coste de los recursos del sistema es otra cosa: incluye hogares,
que son la mayor parte del pasivo minorista, y ademas financiacion
mayorista que el MIR no cubre.

Este script calcula las tres piezas que SI son calculables con dato
publico, con el mismo metodo para todas:

  1. coste de los depositos de empresa      (sector 2240: L21 + L22)
  2. coste de los depositos de hogares      (sector 2250: L21 + L22 + L23)
  3. coste de los depositos del sistema     (los dos anteriores, ponderados)

y el peso de cada sector, para saber cuanto del pasivo representa cada uno.

Diferencia de metodo frente a `coste_recursos.py`: alli el tipo a plazo es
la media simple de todas las variantes de vencimiento que publica el MIR,
que se solapan entre si. Aqui se usa solo la serie de vencimiento TOTAL
(MATURITY = A), que no se solapa. Se imprimen las dos para poder comparar.

Lo que esto NO mide, y por tanto no se puede presentar como coste de
financiacion del sistema: deuda emitida (senior, cedulas), repos,
financiacion del banco central, depositos de otras IFM y capital. En los
sistemas bancarios de los siete, los depositos son la mayor parte del
pasivo, pero no todo.

IMPORTANTE: no canalizar la salida por `head` (ver notas.md 2.39).
"""
import csv
import io
import os
import statistics
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIR = "https://data-api.ecb.europa.eu/service/data/MIR"
BSI = "https://data-api.ecb.europa.eu/service/data/BSI"
PORTAL = "https://data.ecb.europa.eu/data/datasets/BSI"
PAISES = {"ES": "Espana", "DE": "Alemania", "FR": "Francia", "IT": "Italia",
          "PT": "Portugal", "NL": "Paises Bajos", "IE": "Irlanda"}
ANIO = "2026"
DFR = 2.09
HOY = "2026-09-17"

# instrumentos por sector. L23 (disponible con preaviso) solo existe para
# hogares: las empresas no tienen esa figura en la estadistica del BCE.
INSTR = {
    "2240": [("L21", "vista"), ("L22", "plazo")],
    "2250": [("L21", "vista"), ("L22", "plazo"), ("L23", "preaviso")],
}
SECTOR = {"2240": "empresas", "2250": "hogares"}


def baja(url, reintentos=4):
    espera = 2
    for i in range(reintentos + 1):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "pyme-research/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if i < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if i < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
    return None


def tipo(pais, item, sector, maturity="A"):
    """Tipo medio del anio. maturity 'A' = vencimiento total, sin solape."""
    url = "%s/M.%s.B.%s.%s.R.A.%s.EUR.N?startPeriod=%s-01&format=csvdata" % (
        MIR, pais, item, maturity, sector, ANIO)
    txt = baja(url)
    if not txt:
        return None
    v = [float(x["OBS_VALUE"]) for x in csv.DictReader(io.StringIO(txt))
         if x.get("OBS_VALUE")]
    return statistics.mean(v) if v else None


def tipo_media_variantes(pais, item, sector):
    """Media simple de TODAS las variantes de vencimiento (metodo antiguo)."""
    url = "%s/M.%s.B.%s..R..%s.EUR.N?startPeriod=%s-01&format=csvdata" % (
        MIR, pais, item, sector, ANIO)
    txt = baja(url)
    if not txt:
        return None
    v = [float(x["OBS_VALUE"]) for x in csv.DictReader(io.StringIO(txt))
         if x.get("OBS_VALUE")]
    return statistics.mean(v) if v else None


def saldo(pais, item, sector):
    url = "%s/M.%s.N.A.%s.A.1.U2.%s.Z01.E?startPeriod=%s-01&format=csvdata" % (
        BSI, pais, item, sector, ANIO)
    txt = baja(url)
    if not txt:
        return None
    v = [float(x["OBS_VALUE"]) for x in csv.DictReader(io.StringIO(txt))
         if x.get("OBS_VALUE")]
    return statistics.mean(v) if v else None


def coste_sector(cod, sector):
    """Coste ponderado y saldo total de un sector. Devuelve (coste, saldo)."""
    piezas = []
    for item, _ in INSTR[sector]:
        t = tipo(cod, item, sector)
        s = saldo(cod, item, sector)
        if t is None or s is None:
            continue
        piezas.append((t, s))
    if not piezas:
        return None, None
    total = sum(s for _, s in piezas)
    if not total:
        return None, None
    return sum(t * s for t, s in piezas) / total, total


def main():
    destino = os.path.join(ROOT, "liquidez", "coste_recursos_sistema.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    n = 0

    print("%-14s %9s %9s %9s %9s %11s" % (
        "", "empresas", "hogares", "sistema", "dif pb", "% empresas"))
    filas = []
    for cod, pais in PAISES.items():
        c_emp, s_emp = coste_sector(cod, "2240")
        c_hog, s_hog = coste_sector(cod, "2250")
        if c_emp is None or c_hog is None:
            print("  %-14s sin datos completos" % pais)
            continue
        s_tot = s_emp + s_hog
        c_sis = (c_emp * s_emp + c_hog * s_hog) / s_tot
        peso_emp = 100 * s_emp / s_tot
        dif = round((c_emp - c_sis) * 100)
        print("%-14s %8.2f%% %8.2f%% %8.2f%% %8d %10.1f%%"
              % (pais[:13], c_emp, c_hog, c_sis, dif, peso_emp))
        filas.append((pais, c_emp, c_hog, c_sis, dif, peso_emp, s_emp, s_hog))

        base = dict(pais=pais, producto="coste_recursos",
                    periodo_referencia=ANIO, url=PORTAL,
                    fecha_publicacion=HOY, criterio_segmentacion="n/a")
        comun = ("BCE, datasets MIR y BSI (calculo propio)")
        metodo = ("tipos del MIR de vencimiento total, ponderados por los "
                  "saldos del BSI; ")
        for metrica, valor, unidad, td, nota in [
            ("Coste de los depositos de empresa", c_emp, "pct_anual", "nivel",
             metodo + "sector 2240, instrumentos L21 y L22"),
            ("Coste de los depositos de hogares", c_hog, "pct_anual", "nivel",
             metodo + "sector 2250, instrumentos L21, L22 y L23"),
            ("Coste de los depositos del sistema", c_sis, "pct_anual", "nivel",
             metodo + "empresas mas hogares; NO incluye deuda emitida, repos, "
             "financiacion del banco central, depositos interbancarios ni "
             "capital, asi que no es el coste de financiacion total del "
             "sistema"),
            ("Diferencia entre el coste de empresa y el del sistema", dif,
             "pb", "nivel", "positivo = la empresa cuesta mas que el sistema"),
            ("Peso de los depositos de empresa sobre el total minorista",
             peso_emp, "pct_cartera", "ratio",
             "saldos del BSI, empresas sobre empresas mas hogares"),
            ("Saldo de depositos de empresa", s_emp, "eur_millones", "importe",
             "sector 2240, suma de L21 y L22, saldo medio %s" % ANIO),
            ("Saldo de depositos de hogares", s_hog, "eur_millones", "importe",
             "sector 2250, suma de L21, L22 y L23, saldo medio %s" % ANIO),
            ("Margen del sistema sobre la facilidad de deposito del BCE",
             DFR - c_sis, "pct_anual", "nivel",
             "facilidad del BCE %.2f%% menos coste de los depositos del "
             "sistema" % DFR),
        ]:
            w.writerow(schema.row(
                metrica=metrica, valor="%.4f" % valor, unidad=unidad,
                tipo_de_dato=td,
                ponderacion="media_ponderada_volumen", fuente=comun,
                notas=nota, **base))
            n += 1

    # control de metodo: el tipo a plazo de empresa por los dos caminos
    print()
    print("Control de metodo, tipo a plazo de empresa (%):")
    print("%-14s %14s %16s %8s" % (
        "", "vencim. total", "media variantes", "dif pb"))
    for cod, pais in PAISES.items():
        a = tipo(cod, "L22", "2240")
        b = tipo_media_variantes(cod, "L22", "2240")
        if a is None or b is None:
            print("  %-14s sin dato" % pais)
            continue
        print("%-14s %13.2f%% %15.2f%% %8d"
              % (pais[:13], a, b, round((b - a) * 100)))

    fh.close()
    print()
    print("%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
