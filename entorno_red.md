# entorno_red.md — dominios a permitir en el entorno de ejecución

El entorno actual bloquea las 9 fuentes (0/15 alcanzables). Al recrear el
entorno de ejecución remoto hay que darle una política de red que permita
los dominios de abajo. Referencia:
https://code.claude.com/docs/en/claude-code-on-the-web

Comprobar después con:

```bash
python3 scripts/check_fuentes.py     # debe dar 15/15
```

## Imprescindibles (bloques 1–6, automatizables o semi)

```
data-api.ecb.europa.eu        # API SDMX del ECB Data Portal — bloque 1
data.ecb.europa.eu            # web del portal (títulos de serie)
www.ecb.europa.eu             # SAFE, comunicados MIR — bloque 2
sdw-wsrest.ecb.europa.eu      # endpoint SDMX antiguo, por si acaso
www.eba.europa.eu             # Risk Dashboard y Transparency Exercise — 3 y 4
www.oecd.org                  # Scoreboard PYME — bloque 5
sdmx.oecd.org                 # API de datos de la OCDE
stats.oecd.org                # portal estadístico OCDE
euf.eu.com                    # EU Federation for Factoring — bloque 6
fci.nl                        # FCI Annual Review — bloque 6
www.bde.es                    # Boletín Estadístico — bloque 9
```

## Comparables banco a banco (bloques 7 y 8)

```
www.commerzbank.com           # Corporate Clients
www.caixabank.com
www.grupbancsabadell.com
group.intesasanpaolo.com
istituzionale.bper.it
invest.bnpparibas             # BNP Paribas IR
www.societegenerale.com
www.ing.com
www.abnamro.com
www.santander.com             # Santander Factoring y Confirming
factor.bnpparibas             # BNP Paribas Factor
```

Los PDF de resultados suelen servirse desde CDN propios de cada banco; si
alguna descarga falla con el dominio principal permitido, `check_fuentes.py`
lo señalará y se añade el CDN concreto.

## Orden de trabajo una vez abierto

```bash
python3 scripts/check_fuentes.py                    # verificar acceso
python3 scripts/ecb_mir_harvest.py --desde 2022-01  # bloques 1 y liquidez
# después: SAFE, EBA, OCDE, EUF/FCI y comparables, según fuentes.md
```
