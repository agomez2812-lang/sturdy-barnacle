# Rentabilidad de productos bancarios PYME en Europa

Recopilación de datos sobre 5 productos bancarios PYME (hipotecas, préstamos
personales, circulante, factoring, confirming) más el coste de los recursos,
en España, Alemania, Francia, Italia, Portugal y Países Bajos.

## ⚠️ Estado actual: sin datos recopilados

El entorno de ejecución **no tiene acceso de red a ninguna de las 9 fuentes**
del encargo (política de egress: 0/15 dominios alcanzables, comprobado el
2026-09-16). Los CSV contienen sólo la cabecera del esquema.

No se ha inventado, estimado ni reconstruido de memoria ningún valor.
Diagnóstico completo y huecos estructurales en **[`notas.md`](notas.md)**.

Para reproducir el diagnóstico:

```bash
python3 scripts/check_fuentes.py
```

## Qué sí está listo

Un pipeline probado que rellena los bloques automatizables en una orden, en
cuanto haya salida HTTPS hacia `data-api.ecb.europa.eu`:

```bash
python3 scripts/ecb_mir_harvest.py --desde 2022-01          # todos los bloques
python3 scripts/ecb_mir_harvest.py --bloque circulante      # uno solo
python3 scripts/ecb_mir_harvest.py --dry-run                # ver las consultas
```

Cubre, para los 6 países más zona euro como referencia:

| Bloque | Contenido | Destino |
|---|---|---|
| `circulante` | tipo y volumen de revolving y descubiertos a empresas | `/circulante` |
| `prestamos_empresas` | tipo y volumen por **tramo de importe** | `/prestamos_personales` |
| `consumo_hogares` | crédito al consumo a hogares (referencia autónomos) | `/prestamos_personales` |
| `hipotecas_hogares` | adquisición de vivienda, hogares (**referencia**, ver `notas.md` §2.1) | `/hipotecas` |
| `liquidez` | depósitos de empresas a la vista y a plazo | `/liquidez` |
| tipos oficiales | facilidad de depósito BCE, MRO, Euríbor 3m | `/liquidez` |

Los bloques de factoring/confirming, riesgo, capital, eficiencia y comparables
banco a banco son extracción manual: hoja de ruta en **[`fuentes.md`](fuentes.md)**.

## Esquema de datos

Las columnas del encargo más cuatro de control metodológico, definidas en
`scripts/schema.py`:

`pais, producto, metrica, valor, unidad, periodo_referencia, fuente, url,
fecha_publicacion, criterio_segmentacion, tipo_de_dato, ponderacion, notas`

Las cuatro últimas existen para que no se puedan mezclar magnitudes distintas:

- **`criterio_segmentacion`** — `tamano_prestamo` (MIR y casi toda la
  estadística oficial UE) frente a `tamano_empresa_empleados` (sólo SAFE,
  <250 empleados). No son comparables línea a línea.
- **`tipo_de_dato`** — `nivel` (un tipo de interés, p. ej. 3,66 %) frente a
  `porcentaje_neto_encuesta` (p. ej. 43 % neto de empresas reporta subida).
  Son cosas distintas y no agregables.
- **`ponderacion`** — `media_ponderada_volumen` (preferente cuando existe),
  `media_simple` o `dato_unico`. Siempre explícito.
- **`unidad`** — vocabulario cerrado; `schema.py` rechaza cualquier otra.

## Estructura

```
hipotecas/  prestamos_personales/  circulante/  factoring_confirming/
liquidez/   transversal/           comparables_bancos/
scripts/    notas.md   fuentes.md
```
