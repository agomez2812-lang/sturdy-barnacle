#!/usr/bin/env python3
"""Coste de los recursos de empresa por pais: mezcla real de vista y plazo.

El modelo usaba el Euribor 3m como coste de fondos, igual para todos los
paises. Eso mide el coste de financiarse en mercado, no el coste real de los
recursos que aporta la propia PYME.

Aqui se calcula el coste ponderado de los depositos de sociedades no
financieras, combinando:
  - los TIPOS del dataset MIR (deposito a la vista y a plazo, nueva
    produccion), y
  - los SALDOS del dataset BSI (L21 vista y L22 plazo, sector 2240), que se
    descargan aqui, para ponderar la mezcla de cada pais.

El tipo a plazo se toma de la serie de VENCIMIENTO TOTAL (MATURITY = A).
Antes se usaba la media simple de todas las variantes de vencimiento que
publica el MIR, pero esas variantes se solapan entre si (hasta 1 anio, mas
de 1, mas de 2, hasta 2...), igual que ocurre con los tramos de importe del
lado del activo (ver notas.md 2.7). Promediarlas sobrepondera los tramos
largos: la diferencia llegaba a 31 pb en Francia.

La mezcla cambia mucho entre paises (del 60 % de vista en Francia al 89 % en
Italia) y por eso el coste ponderado no es trasladable de uno a otro.

Uso:
    python3 scripts/coste_recursos.py
"""
import collections
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
BSI = "https://data-api.ecb.europa.eu/service/data/BSI"
PORTAL = "https://data.ecb.europa.eu/data/datasets/BSI"
PAISES = {"ES": "Espana", "DE": "Alemania", "FR": "Francia", "IT": "Italia",
          "PT": "Portugal", "NL": "Paises Bajos", "IE": "Irlanda"}
ANIO = "2026"
DFR = 2.09          # facilidad de deposito del BCE, media 2026


def saldo(pais, item, reintentos=4):
    """Saldo medio del anio de un instrumento de deposito de empresas."""
    clave = "M.%s.N.A.%s.A.1.U2.2240.Z01.E" % (pais, item)
    url = "%s/%s?startPeriod=%s-01&format=csvdata" % (BSI, clave, ANIO)
    espera = 2
    for i in range(reintentos + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "pyme-research/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                txt = r.read().decode("utf-8")
            vals = [float(x["OBS_VALUE"]) for x in csv.DictReader(io.StringIO(txt))
                    if x.get("OBS_VALUE")]
            return statistics.mean(vals) if vals else None
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


MIR = "https://data-api.ecb.europa.eu/service/data/MIR"


def tipo(pais, item, reintentos=4):
    """Tipo medio del anio, serie de vencimiento total (sin solape)."""
    url = "%s/M.%s.B.%s.A.R.A.2240.EUR.N?startPeriod=%s-01&format=csvdata" % (
        MIR, pais, item, ANIO)
    espera = 2
    for i in range(reintentos + 1):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "pyme-research/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                txt = r.read().decode("utf-8")
            vals = [float(x["OBS_VALUE"])
                    for x in csv.DictReader(io.StringIO(txt))
                    if x.get("OBS_VALUE")]
            return statistics.mean(vals) if vals else None
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


def main():
    destino = os.path.join(ROOT, "liquidez", "coste_recursos_pyme.csv")
    if os.path.exists(destino):
        os.remove(destino)
    fh, w = schema.writer(destino)
    hoy = time.strftime("%Y-%m-%d")
    n = 0
    print("\n%-14s %8s %8s %9s %11s %10s" % (
        "", "t.vista", "t.plazo", "% vista", "coste pond.", "margen BCE"))
    for cod, pais in PAISES.items():
        tv, tp = tipo(cod, "L21"), tipo(cod, "L22")
        if tv is None or tp is None:
            print("  %-14s sin tipos" % pais); continue
        sv, sp = saldo(cod, "L21"), saldo(cod, "L22")
        if not sv or not sp:
            print("  %-14s sin saldos" % pais); continue
        peso = sv / (sv + sp)
        coste = tv * peso + tp * (1 - peso)
        print("%-14s %7.2f%% %7.2f%% %8.1f%% %10.2f%% %9.2f%%" % (
            pais[:13], tv, tp, 100 * peso, coste, DFR - coste))
        base = dict(pais=pais, producto="coste_recursos_pyme",
                    periodo_referencia=ANIO, url=PORTAL, fecha_publicacion=hoy,
                    criterio_segmentacion="n/a")
        for metrica, valor, unidad, td, pond, fuente, nota in [
            ("Tipo de deposito a la vista", tv, "pct_anual", "nivel", "media_simple",
             "BCE, dataset MIR", "nueva produccion, media %s" % ANIO),
            ("Tipo de deposito a plazo", tp, "pct_anual", "nivel", "media_simple",
             "BCE, dataset MIR", "nueva produccion, media %s; serie de "
             "vencimiento total (MATURITY = A), no la media de las variantes "
             "de vencimiento, que se solapan" % ANIO),
            ("Saldo de deposito a la vista", sv, "eur_millones", "importe", "dato_unico",
             "BCE, dataset BSI", "serie L21, sector 2240, saldo medio %s" % ANIO),
            ("Saldo de deposito a plazo", sp, "eur_millones", "importe", "dato_unico",
             "BCE, dataset BSI", "serie L22, sector 2240, saldo medio %s" % ANIO),
            ("Peso del deposito a la vista", 100 * peso, "pct_cartera", "ratio",
             "media_ponderada_volumen", "BCE, dataset BSI", "sobre vista mas plazo"),
            ("Coste ponderado de los recursos de empresa", coste, "pct_anual", "nivel",
             "media_ponderada_volumen", "BCE, datasets MIR y BSI (calculo propio)",
             "tipos del MIR ponderados por los saldos del BSI"),
            ("Margen sobre la facilidad de deposito del BCE", DFR - coste, "pct_anual",
             "nivel", "media_ponderada_volumen", "BCE, datasets MIR, BSI y FM",
             "facilidad del BCE %.2f%% menos coste ponderado" % DFR),
        ]:
            w.writerow(schema.row(metrica=metrica, valor="%.4f" % valor, unidad=unidad,
                                  tipo_de_dato=td, ponderacion=pond, fuente=fuente,
                                  notas=nota, **base)); n += 1
    fh.close()
    print("\n%d filas -> %s" % (n, destino))
    return 0


if __name__ == "__main__":
    sys.exit(main())
