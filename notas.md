# notas.md — huecos, bloqueos y advertencias metodológicas

Última actualización: 2026-09-16

---

## 1. Acceso a las fuentes: RESUELTO

El entorno se subió a nivel de red `Full` el 2026-09-16. Comprobación con
`scripts/check_fuentes.py`: **15/15 fuentes alcanzables**. El cambio propagó
al proxy de la sesión en caliente, sin necesidad de abrir una sesión nueva.

Algunas responden con 403/503 al HEAD de portada (OCDE, CaixaBank, ING,
ABN AMRO, Commerzbank); es filtrado de bots del propio sitio ante una
petición HEAD, no bloqueo del proxy, y no impide descargar los documentos
concretos. `check_fuentes.py` los cuenta como alcanzables por eso.

### Estado de la extracción

| Bloque | Estado | Observaciones |
|---|---|---|
| 1. ECB MIR + tipos oficiales | **Hecho** | 11.019 observaciones, desde 2025-01 |
| 2. SAFE | Pendiente | |
| 3. EBA Risk Dashboard | Pendiente | |
| 4. EBA Transparency (→ `/hipotecas`) | Pendiente | |
| 5. OCDE Scoreboard | Pendiente | |
| 6. EUF / FCI | Pendiente | |
| 7. Comparables banco a banco | Pendiente | |
| 8. Filiales de factoring | Pendiente | |
| 9. Banco de España | Pendiente | |

## 2. Huecos estructurales de las fuentes (independientes del bloqueo)

Estos no se resuelven abriendo la red: son límites de lo que existe
públicamente. Conviene decidir el tratamiento antes de la extracción.

### 2.1 Hipotecas a PYME — no existe estadística oficial UE
El dataset MIR publica préstamos para **adquisición de vivienda sólo del
sector hogares** (`BS_COUNT_SECTOR = 2250`). **No hay desglose de hipoteca
ni de préstamo con garantía inmobiliaria a sociedades no financieras**
(`2240`). El crédito con garantía real a empresas queda subsumido en la
serie genérica de préstamos a empresas por tramo de importe.

**Decisión de alcance (2026-09-16):** el bloque `/hipotecas` se cubre
**íntegramente con exposición a inmueble comercial banco a banco** desde el
EBA Transparency Exercise. Se descarta la serie MIR de hogares, que no se
recoge ni siquiera como referencia, para no inducir comparaciones con un
producto que no es el estudiado.

Consecuencias a tener presentes:
- La cobertura es la **muestra de bancos del EBA**, no el mercado. No es
  representativa del crédito PYME total de cada país, y los bancos pequeños
  y las cajas quedan fuera.
- El EBA publica **EAD y RWA**, no tipo de interés ni comisión. El tipo de
  la hipoteca a empresa **no existe como dato público** en ninguna fuente
  del encargo: sólo se puede aproximar por el tramo de importe de MIR
  (`A2A`, ya recogido en `/prestamos_personales`) o por memoria anual.
- La **densidad de RWA** no la publica el EBA: se calcula como RWA/EAD y se
  marca como `tipo_de_dato = ratio` con nota de que es cálculo propio.
- El perímetro «inmueble comercial» depende de la plantilla de cada edición;
  fijar el filtro con `--inspect` antes de extraer y anotarlo.

### 2.2 Factoring y confirming — fuera de todo dataset del BCE
No hay serie MIR ni BSI de factoring. Los volúmenes sólo existen en EUF/FCI
(cesión anual por país) y los precios sólo en cuentas anuales de filiales
especializadas. El **confirming** (pago confirmado a proveedores) es además
una denominación comercial de mercado ibérico: no hay estadística pan-europea
comparable; en otros países se reporta como *reverse factoring* / *supply
chain finance*, con perímetros distintos. No agregar ambos sin una nota.

### 2.3 Comisiones — no hay estadística oficial en ningún país
Ni MIR ni EBA publican comisiones por producto. MIR incluye el TAE
(`DATA_TYPE_MIR` con TAE además del tipo anual equivalente estrecho), que
incorpora parte de los costes, pero no desglosa la comisión. La única vía es
la memoria anual / presentación de resultados del segmento empresas, y ahí
la comisión aparece agregada, no por producto. Esperar cobertura parcial y
heterogénea.

### 2.4 Segmentación: tamaño del préstamo ≠ tamaño de la empresa
- MIR (bloques 1): segmenta por **importe del préstamo** (tramos ≤0,25 M€ /
  0,25–1 M€ / >1 M€). Un préstamo pequeño a una gran empresa cae en el tramo
  bajo. Es un *proxy* de PYME, no una definición de PYME.
- SAFE (bloque 2): segmenta por **número de empleados** (<250), que sí es la
  definición de PYME. No es comparable con lo anterior línea a línea.
- Por eso el esquema tiene columna `criterio_segmentacion` obligatoria en
  cada fila. No mezclar series con criterios distintos en una misma media.

### 2.5 SAFE: niveles frente a porcentajes netos
La pregunta **Q8B** de la SAFE da el **nivel** del tipo de la línea de
crédito PYME (p. ej. 3,66 %). Otras preguntas de la misma encuesta dan
**porcentajes netos** de respuestas (p. ej. 43 % neto de empresas reporta
subida de tipos). Son magnitudes distintas y no agregables.
- En el esquema: `unidad = pct_anual` + `tipo_de_dato = nivel` para lo
  primero; `unidad = pct_neto_encuesta` + `tipo_de_dato =
  porcentaje_neto_encuesta` para lo segundo. `scripts/schema.py` rechaza
  cualquier unidad fuera del vocabulario cerrado.
- La **brecha de financiación** (*financing gap*) de la SAFE es también un
  porcentaje neto, no un importe en euros.

### 2.6 Consumo de capital — dato regulatorio, no estadístico
La **densidad de RWA** por segmento no se publica de forma homogénea; se
reconstruye banco a banco desde el EBA Transparency Exercise (EAD y RWA por
cartera, plantilla `CR`). El **SME supporting factor** no es una estadística
sino un coeficiente normativo (CRR art. 501; factor reducido para exposición
PYME, con el umbral ampliado en CRR3). Debe anotarse como parámetro
normativo aplicado, con su base legal, no como dato observado.

### 2.7 Coste de riesgo: stock de NPL ≠ flujo de mora
El EBA Risk Dashboard publica **ratio de NPL** (stock sobre cartera) por país
y, con menos granularidad, por segmento. El **coste del riesgo** (dotación
anual sobre cartera media, en puntos básicos) es una magnitud de flujo y sólo
aparece en resultados de bancos. No sustituir una por otra.

### 2.8 Eficiencia (cost-income) sólo a nivel entidad
El cost-income del EBA es de grupo consolidado, no del segmento empresas. El
cost-income del segmento empresas, cuando se publica, está en el reporte por
segmentos de la memoria anual y con criterios de imputación de costes
distintos entre bancos. Comparabilidad limitada; anotar el perímetro.

---

### 2.9 Los tramos de importe del MIR SE SOLAPAN

Códigos `AMOUNT_CAT` verificados contra la metadata `TITLE_COMPL` del propio
portal (no asumidos):

| Código | Tramo |
|---|---|
| `A` | Total |
| `2` | Hasta 0,25 M€ |
| `3` | Más de 0,25 y hasta 1 M€ |
| `0` | **Hasta 1 M€** = `2` + `3` |
| `1` | Más de 1 M€ |

`0` es un agregado de `2` y `3`, y `A` los engloba todos. **Sumar tramos
entre sí duplica.** Para el spread PYME–gran empresa, la comparación limpia
es `2` (≤0,25 M€) contra `1` (>1 M€).

### 2.10 Volúmenes de circulante: sólo a nivel de zona euro

Las series de volumen de negocio de revolving y descubiertos (`A2Z`,
`DATA_TYPE_MIR = B`) devuelven 404 para los seis países; sólo existen para
el agregado `U2`. El **tipo** sí está por país. Consecuencia: en
`/circulante` hay precio por país pero no volumen por país. Lo mismo ocurre
con el volumen de depósitos a plazo de empresas en **Países Bajos**
(`NL.L22.B`), que tampoco se publica.

### 2.11 Anomalía a verificar: España tiene el spread PYME invertido

Con datos de 2026-07, fijación inicial total, España es el **único** país
de los seis donde el préstamo pequeño sale más barato que el grande:

| País | ≤0,25 M€ | >1 M€ | Spread |
|---|---|---|---|
| España | 3,56 % | 3,79 % | **−23 pb** |
| Alemania | 4,71 % | 3,61 % | +110 pb |
| Francia | 4,06 % | 3,53 % | +53 pb |
| Italia | 4,75 % | 3,55 % | +120 pb |
| Portugal | 4,60 % | 3,86 % | +74 pb |
| Países Bajos | 4,82 % | 3,10 % | +172 pb |
| Zona euro | 4,22 % | 3,60 % | +62 pb |

No se corrige ni se explica aquí: queda anotado como **hallazgo a
contrastar**. Hipótesis a descartar con el Boletín Estadístico del Banco de
España (bloque 9): peso del crédito con aval público en el tramo bajo,
efecto de composición por plazo, o competencia en el segmento. Conviene
confirmarlo antes de construir cualquier conclusión de rentabilidad sobre
el mercado español.

## 3. Estado de las decisiones

| # | Asunto | Estado |
|---|---|---|
| 1 | Acceso de red a las fuentes | **Resuelto**: se recreará el entorno con política de red abierta a los dominios de `entorno_red.md`. Pendiente de ejecución por parte del usuario. |
| 2 | Tratamiento de `/hipotecas` | **Resuelto**: sólo inmueble comercial vía EBA Transparency Exercise (ver §2.1). Pipeline en `scripts/eba_te_cre.py`. |
| 3 | Alcance de `/prestamos_personales` | **Resuelto**: se mantienen los dos ángulos, préstamo a empresa por tramo de importe *y* crédito al consumo a hogares como proxy de autónomos, en ficheros separados y con `criterio_segmentacion` distinto. |
| 4 | Ventana temporal | **Resuelto**: desde `2025-01`. Es el valor por defecto del harvester. |

Con las cuatro decisiones cerradas, no queda nada pendiente de definir: el
único bloqueo vivo es el acceso de red (§1).

### Nota sobre la ventana 2025-01

Da unas 20 observaciones mensuales por serie, suficiente para precio de
nueva producción, que es lo que interesa aquí. Dos salvedades:
- Para **coste de riesgo y NPL** (`/transversal`) una ventana tan corta no
  deja ver el ciclo; esos datos son de extracción manual y ahí conviene
  coger más historia aunque el harvester del BCE vaya desde 2025.
- Los **volúmenes** de nueva producción tienen estacionalidad mensual
  marcada. Con año y medio no hay dos ciclos completos para comparar mismo
  mes contra mismo mes. Si se quiere tasa interanual, hay que ampliar a
  `--desde 2023-01`; el harvester acepta cualquier fecha sin más cambios.
