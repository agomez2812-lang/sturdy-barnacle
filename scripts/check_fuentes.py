#!/usr/bin/env python3
"""Comprueba que dominios de las 9 fuentes del encargo son alcanzables.

Ejecutar ANTES de lanzar los harvesters: si el entorno tiene una politica
de egress restrictiva, esto lo dice en 30 segundos en vez de fallar a medias.

    python3 scripts/check_fuentes.py
"""
import concurrent.futures as cf
import sys
import urllib.error
import urllib.request

FUENTES = [
    ("1. ECB Data Portal (API)", "https://data-api.ecb.europa.eu/service/data/MIR/M.ES.B.A2A.A.R.A.2240.EUR.N?lastNObservations=1&format=csvdata"),
    ("1. ECB Data Portal (web)", "https://data.ecb.europa.eu/"),
    ("2. SAFE (BCE)",            "https://www.ecb.europa.eu/stats/ecb_surveys/safe/html/index.en.html"),
    ("3. EBA Risk Dashboard",    "https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/risk-monitoring"),
    ("4. EBA Transparency Ex.",  "https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/eu-wide-transparency-exercise"),
    ("5. OECD Scoreboard",       "https://www.oecd.org/"),
    ("6. EU Federation Factoring", "https://euf.eu.com/"),
    ("6. FCI",                   "https://fci.nl/"),
    ("7. Commerzbank IR",        "https://www.commerzbank.com/en/hauptnavigation/aktionaere/aktionaere.html"),
    ("7. CaixaBank IR",          "https://www.caixabank.com/en/shareholders-investors.html"),
    ("7. Banco Sabadell IR",     "https://www.grupbancsabadell.com/en/"),
    ("7. Intesa Sanpaolo IR",    "https://group.intesasanpaolo.com/en/investor-relations"),
    ("7. ING IR",                "https://www.ing.com/Investor-relations.htm"),
    ("7. ABN AMRO IR",           "https://www.abnamro.com/en/investor-relations"),
    ("9. Banco de Espana",       "https://www.bde.es/"),
]


def prueba(nombre, url):
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": "pyme-research/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return nombre, "OK", r.status
    except urllib.error.HTTPError as e:
        # 403/405 del sitio (no del proxy) aun indica alcanzabilidad
        return nombre, "OK (HTTP %d)" % e.code, e.code
    except Exception as e:                                  # noqa: BLE001
        return nombre, "BLOQUEADO: %s" % type(e).__name__, None


def main():
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        res = list(ex.map(lambda t: prueba(*t), FUENTES))
    ok = 0
    for nombre, estado, _ in res:
        print("%-30s %s" % (nombre, estado))
        ok += estado.startswith("OK")
    print("\n%d/%d fuentes alcanzables." % (ok, len(res)))
    if ok == 0:
        print("Politica de egress restrictiva: ninguna fuente primaria "
              "es accesible desde este entorno.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
