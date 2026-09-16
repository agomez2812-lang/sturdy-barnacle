# fuentes.md — mapa de extracción por bloque

Orden de ataque según el encargo: de lo mecánico (1–2) a lo artesanal (7–8).
Estado de acceso a fecha 2026-09-16: **todas bloqueadas** (ver `notas.md` §1).

## Bloque 1 — ECB Data Portal, dataset MIR  [AUTOMATIZADO]

Cubre `/circulante`, `/prestamos_personales` y `/liquidez`. **No** cubre
`/hipotecas`: ver bloque 4.

API SDMX: `https://data-api.ecb.europa.eu/service/data/MIR/{clave}?format=csvdata`

Estructura de la clave (10 dimensiones):
`FREQ.REF_AREA.BS_REP_SECTOR.BS_ITEM.MATURITY_NOT_IRATE.DATA_TYPE_MIR.AMOUNT_CAT.BS_COUNT_SECTOR.CURRENCY_TRANS.IR_BUS_COV`

| Dimensión | Códigos usados |
|---|---|
| `REF_AREA` | `ES` `DE` `FR` `IT` `PT` `NL` (+ `U2` zona euro como referencia) |
| `BS_REP_SECTOR` | `B` = entidades de depósito excl. banco central (S.122) |
| `BS_ITEM` | `A2A` préstamos excl. revolving · `A2Z` revolving y descubiertos · `A2D` crédito al consumo · `L21` depósitos a la vista · `L22` depósitos a plazo |
| `DATA_TYPE_MIR` | `R` tipo anual equivalente (**nivel**) · `B` volumen de negocio |
| `AMOUNT_CAT` | `A` total · `1` ≤0,25 M€ · `2` 0,25–1 M€ · `3` >1 M€ — *confirmar en el primer volcado* |
| `BS_COUNT_SECTOR` | `2240` sociedades no financieras · `2250` hogares |
| `IR_BUS_COV` | `N` nueva producción · `O` saldos vivos |

El harvester usa **comodines** (dimensión vacía) en `MATURITY_NOT_IRATE` y
`AMOUNT_CAT`, así que no depende de acertar esos códigos: el portal devuelve
todas las combinaciones existentes y se etiquetan con el título de la serie.

Tipos oficiales (dataset `FM`): facilidad de depósito `FM.D.U2.EUR.4F.KR.DFR.LEV`,
operaciones principales `FM.D.U2.EUR.4F.KR.MRR_FR.LEV`, Euríbor 3m.

→ `python3 scripts/ecb_mir_harvest.py --desde 2022-01`

## Bloque 2 — SAFE (encuesta BCE)  [SEMI-MANUAL]

https://www.ecb.europa.eu/stats/ecb_surveys/safe/html/index.en.html
- **Q8B**: nivel del tipo de la línea de crédito / descubierto de la PYME,
  por país y por tamaño (<250 empleados). Es un **nivel**, no un neto.
- Brecha de financiación: **porcentaje neto**, etiquetar como tal.
- Los microdatos y las tablas por país salen en el anexo estadístico (XLSX)
  de cada ronda semestral.

## Bloque 3 — EBA Risk Dashboard / Risk Assessment Report  [SEMI-MANUAL]
https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/risk-monitoring
Ratio de NPL por país, ROE, cost-income. Publicación trimestral con anexo
de datos por país en XLSX. Nivel de grupo consolidado, no de segmento.

## Bloque 4 — EBA Transparency Exercise  [SEMI-AUTOMATIZADO]
Datos banco a banco: EAD, RWA, exposiciones dudosas por cartera. Es la única
vía pública para **densidad de RWA** por segmento y para exposición con
garantía de inmueble comercial. Ficheros XLSX/CSV masivos por plantilla.

**Alimenta el bloque `/hipotecas` completo** (decisión de alcance, `notas.md`
§2.1): no se usa la serie MIR de hogares. Plantilla de riesgo de crédito,
cartera con garantía de inmueble comercial.

→ `scripts/eba_te_cre.py --inspect <csv>` para ver la estructura real de la
edición descargada, rellenar `scripts/mapeo_eba.json`, y luego `--extract`.
Los nombres de columna y los códigos de partida cambian entre ediciones, por
eso el script no los codifica a mano.

## Bloque 5 — OECD Financing SMEs and Entrepreneurs (Scoreboard)  [MANUAL]
Tipos PYME y spread PYME–gran empresa por país, con ficha metodológica
nacional. Ojo: cada país reporta con su propia definición de PYME.

## Bloque 6 — EUF / FCI  [MANUAL]
Volumen de cesión de factoring por país y año, y penetración sobre PIB.
EUF publica el *Annual Factoring Survey*; FCI el *Annual Review*.

## Bloque 7 — Comparables banco a banco  [ARTESANAL, dejar para el final]
Commerzbank (Corporate Clients), Sabadell, CaixaBank, Intesa, BPER,
BNP Paribas, SocGen, ING, ABN AMRO. Buscar en el *reporte por segmentos*:
margen de intereses, comisiones netas, cartera, cost-income, coste del riesgo.
Perímetros de segmento no homogéneos: anotar la definición de cada banco.

## Bloque 8 — Factoring/confirming, filiales especializadas  [ARTESANAL]
Santander Factoring y Confirming, BNP Paribas Factor, Eurofactor. Cuentas
anuales depositadas en registro mercantil: comisión de cesión y volumen cedido.

## Bloque 9 — Banco de España, Boletín Estadístico  [SEMI-MANUAL]
https://www.bde.es/ — capítulo de tipos de interés y de crédito por finalidad.
Mayor granularidad que MIR para España.
