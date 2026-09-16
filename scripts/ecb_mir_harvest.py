#!/usr/bin/env python3
"""Descarga tipos y volumenes del ECB Data Portal (dataset MIR) y los
normaliza al esquema comun del proyecto.

Usa comodines SDMX (dimensiones vacias) en lugar de claves de serie
codificadas a mano: asi no hay que adivinar los codigos de maturity ni de
amount category, el portal devuelve todas las combinaciones existentes.

Uso:
    python3 scripts/ecb_mir_harvest.py --desde 2025-01
    python3 scripts/ecb_mir_harvest.py --bloque circulante --dry-run

Requiere salida HTTPS hacia data-api.ecb.europa.eu.
"""
import argparse
import csv
import io
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

BASE = "https://data-api.ecb.europa.eu/service/data"
PORTAL = "https://data.ecb.europa.eu/data/datasets/MIR/MIR."
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAISES = ["ES", "DE", "FR", "IT", "PT", "NL", "U2"]

# Estructura de clave MIR (10 dimensiones):
#   FREQ.REF_AREA.BS_REP_SECTOR.BS_ITEM.MATURITY_NOT_IRATE
#   .DATA_TYPE_MIR.AMOUNT_CAT.BS_COUNT_SECTOR.CURRENCY_TRANS.IR_BUS_COV
# BS_COUNT_SECTOR: 2240 = sociedades no financieras, 2250 = hogares.
# DATA_TYPE_MIR:   R = tipo anual equivalente (nivel), B = volumen de negocio.
# IR_BUS_COV:      N = nueva produccion, O = saldos vivos.
# Dimension vacia = comodin.

BLOQUES = {
    # Circulante: lineas de credito y descubiertos a empresas. No tiene
    # tramos de importe en MIR (amount category solo aplica a A2A).
    "circulante": {
        "carpeta": "circulante",
        "producto": "linea_credito_circulante",
        "claves": [
            ("M.{p}.B.A2Z..R..2240.EUR.N", "tipo", "pct_anual"),
            ("M.{p}.B.A2Z..B..2240.EUR.N", "volumen", "eur_millones"),
        ],
        "criterio": "tamano_prestamo",
    },
    # Prestamos a empresas por tramo de importe (proxy oficial de PYME).
    # A2A = prestamos distintos de revolving/descubiertos.
    "prestamos_empresas": {
        "carpeta": "prestamos_personales",
        "producto": "prestamo_empresas_por_tramo",
        "claves": [
            ("M.{p}.B.A2A..R..2240.EUR.N", "tipo", "pct_anual"),
            ("M.{p}.B.A2A..B..2240.EUR.N", "volumen", "eur_millones"),
        ],
        "criterio": "tamano_prestamo",
    },
    # Credito al consumo a hogares: referencia para prestamo personal de
    # autonomos/microempresas que se financian como hogar.
    "consumo_hogares": {
        "carpeta": "prestamos_personales",
        "producto": "credito_consumo_hogares_referencia",
        "claves": [
            ("M.{p}.B.A2D..R..2250.EUR.N", "tipo", "pct_anual"),
            ("M.{p}.B.A2D..B..2250.EUR.N", "volumen", "eur_millones"),
        ],
        "criterio": "n/a",
    },
    # NOTA: no hay bloque de hipotecas aqui. MIR solo publica adquisicion de
    # vivienda por HOGARES (2250), no hay desglose de prestamo con garantia
    # inmobiliaria a empresas (2240). Por decision de alcance, /hipotecas se
    # cubre integramente con exposicion a inmueble comercial banco a banco
    # desde el EBA Transparency Exercise: ver scripts/eba_te_cre.py.
    # Coste de los recursos: depositos de empresas (vista y a plazo).
    "liquidez": {
        "carpeta": "liquidez",
        "producto": "depositos_empresas",
        "claves": [
            ("M.{p}.B.L21..R..2240.EUR.N", "tipo_deposito_vista", "pct_anual"),
            ("M.{p}.B.L22..R..2240.EUR.N", "tipo_deposito_plazo", "pct_anual"),
            ("M.{p}.B.L22..B..2240.EUR.N", "volumen_deposito_plazo", "eur_millones"),
        ],
        "criterio": "tamano_prestamo",
    },
}

# Tipos oficiales del BCE (dataset FM) -> rendimiento de la liquidez
# aparcada en el banco central. Clave completa, sin comodines.
FM_SERIES = [
    ("FM.D.U2.EUR.4F.KR.DFR.LEV", "tipo_facilidad_deposito_BCE"),
    ("FM.D.U2.EUR.4F.KR.MRR_FR.LEV", "tipo_operaciones_principales_BCE"),
    ("FM.M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA", "euribor_3m"),
]


def fetch(url, reintentos=4):
    """GET con reintentos y backoff exponencial (2s, 4s, 8s, 16s)."""
    espera = 2
    for intento in range(reintentos + 1):
        try:
            req = urllib.request.Request(
                url, headers={"Accept": "text/csv", "User-Agent": "pyme-research/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None  # combinacion de dimensiones inexistente
            if e.code in (429, 500, 502, 503, 504) and intento < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if intento < reintentos:
                time.sleep(espera); espera *= 2; continue
            raise
    return None


def normaliza(texto_csv, pais, producto, metrica_base, unidad, criterio,
              dataset, hoy):
    """Convierte la respuesta csvdata del portal en filas del esquema."""
    filas = []
    for d in csv.DictReader(io.StringIO(texto_csv)):
        valor = (d.get("OBS_VALUE") or "").strip()
        periodo = (d.get("TIME_PERIOD") or "").strip()
        if not valor or not periodo:
            continue
        clave = d.get("KEY", "")
        # El titulo del portal ya describe tramo y vencimiento; lo usamos
        # como etiqueta para no perder el desglose del comodin.
        titulo = (d.get("TITLE_COMPL") or d.get("TITLE") or "").strip()
        metrica = "%s | %s" % (metrica_base, titulo or clave)
        filas.append(schema.row(
            pais=schema.COUNTRIES.get(pais, pais),
            producto=producto,
            metrica=metrica,
            valor=valor,
            unidad=unidad,
            periodo_referencia=periodo,
            fuente="BCE, ECB Data Portal, dataset %s" % dataset,
            url=PORTAL + clave if dataset == "MIR" else
                "https://data.ecb.europa.eu/data/datasets/%s" % dataset,
            fecha_publicacion=hoy,
            criterio_segmentacion=criterio,
            tipo_de_dato="nivel" if unidad == "pct_anual" else "volumen",
            ponderacion="media_ponderada_volumen" if unidad == "pct_anual"
                        else "dato_unico",
            notas="serie %s; nueva produccion" % clave,
        ))
    return filas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--desde", default="2025-01", help="periodo inicial, AAAA-MM")
    ap.add_argument("--bloque", action="append",
                    help="limitar a un bloque (repetible); por defecto todos")
    ap.add_argument("--dry-run", action="store_true",
                    help="imprime las URLs que se consultarian y sale")
    a = ap.parse_args()

    hoy = time.strftime("%Y-%m-%d")
    bloques = a.bloque or list(BLOQUES)
    total, fallos = 0, []

    for nombre in bloques:
        cfg = BLOQUES[nombre]
        destino = os.path.join(ROOT, cfg["carpeta"], "%s_ecb_mir.csv" % nombre)
        if not a.dry_run:
            fh, w = schema.writer(destino)
        for pais in PAISES:
            for plantilla, metrica, unidad in cfg["claves"]:
                clave = plantilla.format(p=pais)
                url = ("%s/MIR/%s?startPeriod=%s&format=csvdata"
                       % (BASE, clave, a.desde))
                if a.dry_run:
                    print(url); continue
                try:
                    txt = fetch(url)
                except Exception as e:                      # noqa: BLE001
                    fallos.append((clave, repr(e))); continue
                if not txt:
                    fallos.append((clave, "sin datos (404)")); continue
                filas = normaliza(txt, pais, cfg["producto"], metrica, unidad,
                                  cfg["criterio"], "MIR", hoy)
                for f in filas:
                    w.writerow(f)
                total += len(filas)
                print("  %-34s %5d filas" % (clave, len(filas)))
        if not a.dry_run:
            fh.close(); print("-> %s" % destino)

    # Tipos oficiales del BCE al bloque de liquidez.
    if not a.dry_run and (not a.bloque or "liquidez" in bloques):
        destino = os.path.join(ROOT, "liquidez", "tipos_oficiales_bce.csv")
        fh, w = schema.writer(destino)
        for clave, metrica in FM_SERIES:
            ds, resto = clave.split(".", 1)
            url = "%s/%s/%s?startPeriod=%s&format=csvdata" % (BASE, ds, resto, a.desde)
            try:
                txt = fetch(url)
            except Exception as e:                          # noqa: BLE001
                fallos.append((clave, repr(e))); continue
            if not txt:
                fallos.append((clave, "sin datos (404)")); continue
            filas = normaliza(txt, "U2", "liquidez_banco_central", metrica,
                              "pct_anual", "n/a", ds, hoy)
            for f in filas:
                w.writerow(f)
            total += len(filas)
            print("  %-34s %5d filas" % (clave, len(filas)))
        fh.close(); print("-> %s" % destino)

    print("\nTotal observaciones: %d" % total)
    if fallos:
        print("Claves sin datos o con error (%d):" % len(fallos))
        for c, m in fallos:
            print("  %-36s %s" % (c, m))
    return 0


if __name__ == "__main__":
    sys.exit(main())
