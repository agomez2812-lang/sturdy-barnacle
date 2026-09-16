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
| 2. SAFE | **Hecho** | 10.803 obs. Q8B **descontinuada tras 2022-S1**, ver §2.20 |
| 3. EBA Risk Dashboard | **Hecho** | 2.484 obs, hasta 2026-Q1, con desglose PYME y CRE |
| 4. EBA Transparency Exercise | **Hecho** | densidad de RWA de PYME por país; ver §2.34 |
| 5. OCDE Scoreboard | **Hecho** | 535 obs, 2007-2022. **Sin Alemania**, ver §2.30 |
| 6. EUF / FCI | **Hecho** | EUF y detalle nacional AEF/Assifact. Sin precio |
| 7. Comparables banco a banco | **Parcial** | 5 de 9 bancos; ver §2.27 |
| 8. Filiales de factoring | **Cerrado sin dato** | cuentas de pago; ver §2.33 |
| 9. Banco de España | **Hecho** | cuadros 19.5, 19.6 y 19.13; resuelve §2.22, ver §2.23 |

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

### 2.10 Volúmenes de circulante: casi inexistentes

Las series de volumen de negocio de revolving y descubiertos devuelven 404
para los seis países. Sólo existe volumen para `A2Z` a nivel de zona euro
(`U2`); para `A2Z1` no existe **en ningún país ni en el agregado**. El **tipo** sí está por país. Consecuencia: en
`/circulante` hay precio por país pero no volumen por país. Lo mismo ocurre
con el volumen de depósitos a plazo de empresas en **Países Bajos**
(`NL.L22.B`), que tampoco se publica.

### 2.11 Qué es exactamente un tipo del MIR (no es un dato puntual)

Verificado contra la metadata de la serie y la nota metodológica del BCE:

- `COLLECTION = A` → *Average of observations through period*. Es la **media
  del mes**, no una foto de un día.
- Es **media ponderada por el volumen de nueva producción** contratado en ese
  mes. Por eso el esquema marca `ponderacion = media_ponderada_volumen`.
- `UNIT = PCPA`, tipo anual equivalente (AAR/NDER).
- **Nueva producción** = todo acuerdo nuevo entre banco y cliente, incluidas
  las **renegociaciones** de préstamos existentes. Excluye las prórrogas
  automáticas sin renegociar condiciones. No es el tipo de la cartera viva.
- Se publica el **23º día hábil tras el cierre del mes**, de ahí que a fecha
  2026-09-16 el último mes disponible sea 2026-07.

Implicación: un mes suelto es ruidoso, sobre todo en los tramos bajos donde
se firman menos contratos. Para hablar de nivel de precios conviene la media
de varios meses, no el último dato.

### 2.12 Julio de 2026 no es un mes representativo

Contrastado el dato de julio contra los 12 meses anteriores, **julio está en
el máximo o muy cerca del máximo del año en casi todos los países y tramos**,
al final de una senda alcista continuada durante 2026. Tomarlo como nivel
típico sobreestima el precio.

| País | ≤0,25 M€ jul-26 | media 12m | >1 M€ jul-26 | media 12m |
|---|---|---|---|---|
| España | 3,56 | 3,35 | 3,79 | 3,37 |
| Alemania | 4,71 | 4,53 | 3,61 | 3,30 |
| Francia | 4,06 | 3,96 | 3,53 | 3,44 |
| Italia | 4,75 | 4,56 | 3,55 | 3,18 |
| Portugal | 4,60 | 4,28 | 3,86 | 3,60 |
| Países Bajos | 4,82 | 4,46 | 3,10 | 3,33 |
| Zona euro | 4,22 | 4,06 | 3,60 | 3,36 |

### 2.13 Corrección: el spread invertido de España es en gran medida un
efecto de julio

En la nota anterior se registró un spread PYME de **−23 pb** para España
usando sólo julio de 2026. Sobre media de 12 meses el spread es de **−2 pb**
(3,35 % frente a 3,37 %): prácticamente plano, no invertido.

La diferencia viene del tramo **>1 M€**, que en julio marca 3,79 % siendo su
media anual 3,37 % y su máximo de los 12 meses. Es decir, lo anómalo no es
que el préstamo pequeño esté barato, sino un **repunte puntual del tramo
grande** en ese mes concreto.

Sigue siendo cierto que España es el país con el spread PYME más estrecho de
los seis con diferencia, y eso sí merece contraste con el Boletín Estadístico
del Banco de España. Spread ≤0,25 M€ menos >1 M€, media de 12 meses:

| País | Spread |
|---|---|
| España | **−2 pb** |
| Francia | +52 pb |
| Portugal | +67 pb |
| Países Bajos | +113 pb |
| Alemania | +124 pb |
| Italia | +138 pb |
| Zona euro | +71 pb |
Pero la lectura de «spread invertido» no se sostiene fuera de julio.

### 2.14 Media ponderada de 2026: sí se puede, con dos matices

El tipo mensual del MIR ya viene ponderado por el volumen contratado dentro
de ese mes. Para agregar varios meses hay que **volver a ponderar por el
volumen de cada mes**, no promediar los tipos a secas:

    tipo_periodo = Σ(tipo_m × volumen_m) / Σ(volumen_m)

Implementado en `scripts/medias_ponderadas.py`, salida en
`prestamos_personales/prestamos_empresas_medias_ponderadas.csv`.

**Matiz 1: «2026» son siete meses, de enero a julio.** Agosto y septiembre no
están publicados (23º día hábil tras cierre de mes). Es un año parcial y el
período de referencia de cada fila lo dice explícitamente.

**Matiz 2: Alemania no publica volumen del corte fino.** Sólo publica volumen
para `≤1 M€` y `>1 M€`, no para `≤0,25 M€` ni `0,25–1 M€` (salvo un dato
suelto en 2025-08 que no se usa). Los tipos finos alemanes sí existen. El
script emite esas filas como `media_simple` con nota, en vez de fingir una
ponderación que no se puede hacer.

En la práctica la ponderación cambia poco: entre 0 y 3 pb frente a la media
simple, porque los volúmenes mensuales son bastante estables. La decisión
relevante no es ponderar o no, sino **qué corte de tramos se usa**.

### 2.15 Base comparable recomendada: corte grueso (≤1 M€ vs >1 M€)

Es el único con volumen publicado en los seis países y todos los meses.
2026 YTD (ene-jul), ponderado por volumen:

| País | ≤1 M€ | >1 M€ | Spread | Peso del ≤1 M€ sobre nueva producción |
|---|---|---|---|---|
| España | 3,41 % | 3,46 % | **−5 pb** | 50,5 % |
| Portugal | 3,94 % | 3,71 % | +23 pb | 51,1 % |
| Francia | 3,77 % | 3,49 % | +27 pb | 30,0 % |
| Alemania | 4,39 % | 3,41 % | +98 pb | 17,8 % |
| Italia | 4,25 % | 3,22 % | +103 pb | 34,6 % |
| Países Bajos | 4,50 % | 3,37 % | +113 pb | 7,6 % |
| Zona euro | 3,96 % | 3,44 % | +52 pb | 26,1 % |

Dos lecturas que conviene tener presentes antes de interpretar rentabilidad:

- **El spread plano de España se confirma** también en el corte grueso y
  ponderado (−5 pb), así que no era sólo efecto de julio ni del tramo fino.
  Es un rasgo persistente del mercado español en lo que va de 2026, y sigue
  pendiente de contraste con el Boletín Estadístico.
- **La última columna condiciona todo lo demás.** En España y Portugal la
  mitad de la nueva producción a empresas es de importe ≤1 M€; en Países
  Bajos es el 7,6 % y en Alemania el 17,8 %. Un mismo spread no significa lo
  mismo sobre el 50 % de la cartera que sobre el 8 %. Cualquier comparación
  de rentabilidad entre países tiene que normalizar por esto.

### 2.16 Circulante: `A2Z1` frente a `A2Z`, dos perímetros distintos

Contraste con una descarga independiente del portal (captura aportada por el
usuario, series alemanas, actualización 2026-09-02) que destapó que se
estaba usando el código menos adecuado:

| Código | Perímetro |
|---|---|
| `A2Z1` | Revolving y descubiertos **solo** |
| `A2Z` | Lo anterior **más deuda de tarjeta** (convenience y extended credit card debt) |

Para circulante de empresa el perímetro correcto es **`A2Z1`**: la deuda de
tarjeta no es financiación de circulante en el sentido relevante aquí. El
harvester pasa a recoger `A2Z1` como serie principal y mantiene `A2Z` como
secundaria, etiquetada, para poder trazar la diferencia. **No deben
mezclarse en una misma serie.**

Numéricamente la diferencia es pequeña, de 0 a 4 pb, mayor en Francia y en
el agregado de zona euro y casi nula en España, Portugal y Países Bajos.
Importa por corrección y trazabilidad más que por magnitud.

Contraste de validación (Alemania, `MIR.M.DE.B.A2Z1.A.R.A.2240.EUR.N`,
2026 ene-jul): 4,91 · 4,92 · 4,93 · 4,91 · 4,90 · 5,06 · 5,01. **Coincidencia
exacta** con la descarga independiente. Igual resultado para
`MIR.M.DE.B.A2A.D.R.2.2240.EUR.N` y `MIR.M.DE.B.A2A.D.R.3.2240.EUR.N`.

### 2.17 Julio de 2026 es provisional

`OBS_STATUS = P` en el dato de julio de España, Alemania, Francia, Italia y
el agregado de zona euro. Es revisable en publicaciones posteriores. El
harvester lo marca en la columna `notas` de cada fila afectada. Una razón
más para no apoyar conclusiones en el último mes disponible (ver §2.12).

### 2.18 La dimensión de PLAZO DE FIJACIÓN es una decisión, y mueve mucho

Todas las tablas comparativas de este trabajo usan
`MATURITY_NOT_IRATE = A`, «Total initial rate fixation»: toda la nueva
producción del tramo, sea cual sea el plazo de fijación del tipo, ponderada
por volumen. Es el valor por defecto de `scripts/medias_ponderadas.py`
(`--plazo`).

**Es una decisión, no un hecho de la fuente**, y mueve el resultado tanto o
más que la elección de tramo. Ejemplo alemán, 2026:

| Plazo de fijación | ≤0,25 M€ | 0,25–1 M€ | ≤1 M€ |
|---|---|---|---|
| `A` total | 4,34 → 4,71 | 3,90 → 4,20 | 4,20 → 4,56 |
| `D` hasta 3 meses | 3,91 → 4,23 | 3,91 → 4,19 | no publicado |

Unos 50 pb de diferencia en el tramo bajo. El préstamo a tipo revisable
corto es más barato que la media de todos los plazos, que incluye tipo fijo
a varios años.

Criterio aplicado: `A` responde a «qué paga de media una PYME por su nueva
financiación». Si el análisis se orienta a circulante o a tipo revisable
corto, la base correcta es `D` y **todos los niveles bajan**. Regenerable
con `--plazo "Up to 3 months initial rate fixation"`.

Los doce códigos de plazo disponibles (fijación total, hasta 3 meses, hasta
1 año, de 1 a 5 años, más de 5 años, etc.) están todos descargados en los
CSV mensuales: cambiar de base no exige volver a la fuente.

### 2.19 Comprobación de coherencia interna

Alemania, julio 2026, fijación total: ≤0,25 M€ = 4,71 %; 0,25–1 M€ = 4,20 %;
**≤1 M€ = 4,54 %**, que cae entre ambas, como corresponde a que `≤1 M€` sea
la unión de los dos tramos. La aritmética de la ponderada de 2026 para ese
tramo es 521.987 / 118.869 = 4,3913 %.

### 2.20 Q8B de la SAFE está descontinuada desde 2022-S1

La pregunta **Q8B** («tipo cobrado por la línea de crédito o descubierto»)
**dejó de publicarse tras 2022-S1**. Cubre 2014-S1 a 2022-S1 y no tiene
pregunta sucesora: tras el rediseño de la encuesta, las series trimestrales
nuevas (sufijo `_G1`, hasta 2026-Q2) son Q0B, Q2, Q4, Q5, Q6A, Q7A, Q7B, Q9,
Q10, Q11, Q23 y Q26. Ninguna de Q8.

Se ha descargado igualmente por su valor histórico, pero **no sirve para
precio actual**: el último dato tiene más de cuatro años. Para el tipo
vigente de la línea de crédito PYME la fuente es el MIR (`A2Z1`, §2.16), que
llega a 2026-07.

La **brecha de financiación** (`FG`) sí llega a 2025-S1. Es un **porcentaje
neto**, no un nivel: en 2025-S1 España marca −1,28 y Francia +6,27. Un valor
negativo indica que la brecha se estrecha. Etiquetada como
`pct_neto_encuesta` y `porcentaje_neto_encuesta`, nunca agregable con Q8B.

Cobertura: Q8B no existe para Portugal ni Países Bajos fuera del agregado
PYME (16 combinaciones país-tamaño sin datos).

### 2.21 El EBA Risk Dashboard sí trae desglose PYME y CRE

Mejor de lo esperado. El anexo de datos publica, por país y trimestre, saldo
bruto, importe de NPL, ratio de NPL y ratio de cobertura para seis
segmentos, entre ellos **«…of which SMEs»** y **«…of which CRE»**. Esto
cubre buena parte de `/hipotecas` sin necesidad del Transparency Exercise,
aunque a nivel de país y no de banco.

Indicadores transversales, 2026-Q1 (%):

| País | NPL | Coste riesgo | Cost-income | ROE | NIM | Comis./ingresos | CET1 |
|---|---|---|---|---|---|---|---|
| España | 2,60 | 1,22 | 42,14 | 18,51 | 2,78 | 23,93 | 13,67 |
| Alemania | 1,61 | 0,75 | 55,15 | 7,97 | 1,13 | 31,97 | 16,94 |
| Francia | 2,16 | 0,55 | 65,60 | 6,34 | 0,99 | 33,73 | 15,88 |
| Italia | 1,97 | 0,36 | 46,78 | 14,91 | 2,05 | 33,79 | 15,56 |
| Portugal | 1,91 | 0,29 | 34,83 | 15,98 | 2,55 | 21,79 | 17,82 |
| Países Bajos | 1,35 | 0,21 | 53,48 | 10,11 | 1,55 | 20,42 | 16,38 |
| Unión Europea | 1,82 | 0,56 | 52,96 | 10,49 | 1,61 | 28,92 | 16,16 |

Ratio de NPL por segmento, 2026-Q1 (%):

| País | Total | Hogares | Empresas | **PYME** | **CRE** |
|---|---|---|---|---|---|
| España | 2,60 | 3,77 | 2,99 | **5,38** | 4,25 |
| Alemania | 1,61 | 1,73 | 3,81 | 4,32 | **6,81** |
| Francia | 2,16 | 2,27 | 3,94 | 5,12 | 3,86 |
| Italia | 1,97 | 1,71 | 3,40 | 4,90 | 4,27 |
| Portugal | 1,91 | 1,57 | 3,65 | 4,22 | 3,83 |
| Países Bajos | 1,35 | 1,10 | 2,86 | 3,13 | 3,06 |
| Unión Europea | 1,82 | 2,05 | 3,31 | 4,37 | 4,08 |

Salvedades: es la **muestra de bancos del EBA**, no el sistema completo. Los
indicadores transversales (cost-income, ROE, NIM) son de **grupo
consolidado, no de segmento empresas** (ver §2.8), así que no son el
cost-income del negocio PYME.

### 2.22 RESUELTO: el spread plano de España era un artefacto de excluir comisiones

El contraste registrado antes (España cobra el spread PYME más estrecho
sobre la peor cartera PYME) **queda explicado**. No era una anomalía de
mercado sino una limitación de la métrica.

El MIR del BCE publica el **AAR/NDER**, equivalente al TEDR español: tipo
**sin comisiones**. El Boletín Estadístico del Banco de España publica
además el **TAE por tramo para sociedades no financieras** (cuadro 19.6),
cosa que el MIR no hace para empresas en ningún país. La diferencia entre
ambos es la comisión implícita:

| Tramo | TEDR 2026 | TAE 2026 | Cuña de comisiones |
|---|---|---|---|
| ≤0,25 M€ | 3,42 % | 4,43 % | **+102 pb** |
| 0,25–1 M€ | 3,36 % | 3,72 % | +36 pb |
| >1 M€ | 3,44 % | 3,62 % | +18 pb |

Y por tanto el spread PYME español:

| Métrica | Spread ≤0,25 M€ vs >1 M€ |
|---|---|
| TEDR, sin comisiones (lo que da el MIR) | **−2 pb** |
| TAE, con comisiones | **+81 pb** |

La banca española **sí cobra más caro a la PYME**: 81 pb más en coste total.
Lo hace por comisión (102 pb frente a 18 pb) en vez de por tipo nominal. El
spread negativo que aparecía en el MIR no existe en coste para el cliente ni
en ingreso para el banco.

Descomposición por plazo de vencimiento, con volúmenes del cuadro 19.13, que
además muestra por qué el agregado sale plano en TEDR:

| Plazo | ≤0,25 M€ | >1 M€ | Spread | Volumen ≤0,25 M€ |
|---|---|---|---|---|
| Hasta 1 año | 3,36 % | 3,46 % | −11 pb | 100.423 M€ (**94,9 %**) |
| 1 a 5 años | 4,85 % | 3,25 % | +159 pb | 3.330 M€ (3,1 %) |
| Más de 5 años | 4,35 % | 3,56 % | +79 pb | 2.021 M€ (1,9 %) |

El 95 % de la nueva producción española de importe pequeño es a **menos de
un año**, el único tramo de plazo donde el diferencial de tipo es negativo.
A plazos largos el diferencial es normal y grande.

Las renegociaciones no lo explican: crédito total a SNF 2026 en 3,42 % con
renegociados incluidos frente a 3,41 % excluyéndolos, diferencia de 1 pb.

Validación cruzada: el volumen del tramo ≤0,25 M€ en 2026 es de 105.777 M€
según el Boletín (cuadro 19.13) y 105.779 M€ según el MIR del BCE. Dos
fuentes independientes, diferencia de 2 M€ sobre 105.777. Los datos de
ambos bloques son consistentes.

### 2.23 Consecuencia grave: TODAS las comparaciones entre países son sin comisiones

El TAE (`DATA_TYPE_MIR = C`) **no se publica para sociedades no financieras
en ninguno de los seis países**, sólo para hogares (verificado: 0 filas para
empresas en ES, DE, FR, IT, PT, NL y zona euro; 7 filas para hogares
vivienda en España). El TAE de empresas del cuadro 19.6 es una estadística
**nacional del Banco de España** que va más allá de lo que exige el BCE.

Por tanto:

- Todas las tablas comparativas de este trabajo (§2.15, §2.18) son
  **TEDR/AAR, sin comisiones**. Miden precio nominal, no ingreso del banco
  ni coste del cliente.
- España es el **único** de los seis países donde la cuña de comisiones es
  observable con datos públicos. Si los otros cinco tienen cuñas parecidas,
  los spreads reales de todos están infraestimados; si no las tienen, España
  no es comparable con ellos en términos de ingreso.
- **No se puede concluir nada sobre rentabilidad relativa entre países
  usando sólo el MIR.** Es la limitación más seria detectada hasta ahora.

Revisados los cinco bancos centrales restantes: ver §2.24. Resultado corto,
**solo Italia** publica algo equivalente.

Lo que sí se sostiene de §2.22 en su versión anterior: España tiene el mayor
ratio de NPL de PYME (5,38 %), la mayor prima de riesgo PYME sobre empresas
(+2,39 pp) y el mayor coste del riesgo (1,22 %). Con la cuña de comisiones
incorporada, el precio ya no contradice ese riesgo.

### 2.24 Revisión de los cinco bancos centrales: solo Italia publica TAE de empresas

| País | ¿Tipo con comisiones para empresas? | Verificación |
|---|---|---|
| **España** | **Sí** | Boletín Estadístico, cuadro 19.6. TAE por tramo, mensual. Descargado |
| **Italia** | **Sí** | STACORIS, tavola TRI30951, TAEG por clase de importe y sector, trimestral, fuente AnaCredit. Descargado |
| Alemania | No | API del Bundesbank, dataflow `BBIM1`: APRC para empresas devuelve vacío; para hogares consumo y vivienda, 293 observaciones cada una |
| Francia | No, para PYME operativa | El TEG publicado cubre solo el régimen de usura, que desde las reformas de 2003 y 2005 **no se aplica a empresas comerciales salvo descubiertos**. Las categorías «personnes morales» con tasas del 4,22–4,62 % son entidades **sin** actividad industrial o comercial |
| Portugal | No | BPstat publica TAEG solo para consumo y vivienda; para empresas, únicamente TAA (tipo acordado anualizado) |
| Países Bajos | No | Sin estadística nacional equivalente localizada; el MIR confirma ausencia de TAE de empresas |

Verificación transversal previa: `DATA_TYPE_MIR = C` (APRC) devuelve cero
filas para empresas en los seis países y en zona euro, y sí devuelve datos
para hogares.

**TAEG italiano, sociedades no financieras, préstamos de inversión, 2026-Q1**
(tavola TRI30951, total duraciones):

| Clase de importe | TAEG |
|---|---|
| Hasta 50.000 € | 6,08 % |
| 50.000–125.000 € | 5,62 % |
| 125.000–250.000 € | 4,84 % |
| 250.000–500.000 € | 4,40 % |
| 500.000–1.000.000 € | 3,99 % |
| Más de 1.000.000 € | 3,23 % |

### 2.25 Los dos perímetros no son comparables entre sí

Tentación a evitar: calcular la cuña italiana restando el TAEG de arriba al
tipo del MIR, y compararla con los 102 pb españoles. **No es válido.** Las
diferencias de perímetro son grandes:

| | España (cuadro 19.6) | Italia (TRI30951) |
|---|---|---|
| Frecuencia | Mensual | Trimestral |
| Cobertura | Todo el crédito a SNF | Solo préstamos **de inversión** |
| Clase | Importe del préstamo | *Ammontare a disposizione* (importe dispuesto) |
| Sector | SNF | SNF y familias productoras, **excluidos empresarios individuales** |
| Fuente | Declaración de tipos | AnaCredit |
| Exclusiones | — | Import y export |

Como referencia, no como medida: el TAEG italiano del tramo >1 M€ (3,23 %)
queda prácticamente en el tipo sin comisiones del MIR para Italia en ese
mismo tramo (3,22 % de media 2026), mientras que en los tramos bajos el
TAEG está muy por encima. La dirección coincide con España, comisiones
concentradas en el préstamo pequeño, pero **la magnitud no es comparable** y
no debe citarse como tal.

### 2.26 Conclusión sobre comparabilidad entre países

Cuatro de los seis países **no permiten medir el ingreso por comisiones** con
datos públicos. Para Alemania, Francia, Portugal y Países Bajos solo existe
el tipo sin comisiones del MIR.

Esto deja el encargo con un límite duro que conviene asumir explícitamente:

- La comparación de **precio nominal** entre los seis países es sólida y está
  hecha (§2.15).
- La comparación de **ingreso o rentabilidad** entre los seis **no es
  posible** con fuentes oficiales. España e Italia son los únicos donde se ve
  la parte de comisiones, y ni siquiera entre ellos dos con el mismo
  perímetro.
- Para los otros cuatro países, la vía que queda son las **cuentas anuales de
  los bancos** (bloque 7), donde la comisión aparece agregada por segmento y
  no por producto. Es más débil, pero es lo único que hay.

Esto refuerza la prioridad del bloque 7 sobre el resto de lo pendiente.

### 2.27 Bloque 7: 5 de 9 bancos, y el hallazgo es que casi ninguno publica segmento de empresas

| Banco | Estado | Qué publica |
|---|---|---|
| **Commerzbank** | Segmento | Corporate Clients: ingresos, margen de intereses, comisiones, resultado, cartera |
| **ABN AMRO** | Segmento | Corporate Banking: cuenta completa, cost-income, coste del riesgo, ROE, cartera, RWA |
| **Intesa Sanpaolo** | Segmento parcial | Banca dei Territori: ingresos, costes, cost-income, provisiones, resultado. **Sin desglose de intereses ni comisiones** |
| **CaixaBank** | Solo grupo | **No tiene segmento de empresas.** Segmenta en bancario y seguros, aseguradora, participaciones y BPI |
| **BPER Banca** | Solo grupo | El comunicado **no desglosa por división** |
| Banco Sabadell | Descargado, sin segmento | Segmenta por **geografía**: negocio bancario España y TSB. No hay cuenta de empresas |
| ING | Bloqueado | 403 antibot |
| Société Générale | Bloqueado | 403 antibot |
| BNP Paribas | Bloqueado | 403 antibot en `invest.bnpparibas`, `group.bnpparibas` y el CDN |

**Hallazgo principal del bloque, y no es el que se esperaba:** de nueve
bancos, **solo dos publican una cuenta de resultados de un segmento de
empresas con desglose de comisiones** (Commerzbank y ABN AMRO). Los demás o
segmentan por geografía y línea de negocio sin aislar empresas, o no
desglosan intereses frente a comisiones dentro de la división.

Esto no es una limitación de esta extracción: es cómo reportan los bancos
europeos. Lo exige la NIIF 8, que obliga a informar por los segmentos que
usa la dirección, y en la mayoría de estos grupos esos segmentos no son
"empresas" sino geografías o líneas de negocio.

**Peso de las comisiones sobre el ingreso** (ojo al nivel de cada fila):

| País | Banco | Nivel | Comisiones / ingresos |
|---|---|---|---|
| Italia | BPER | Grupo | 34,9 % |
| Alemania | Commerzbank | **Segmento empresas** | 30,5 % |
| Países Bajos | ABN AMRO | **Segmento corporativo** | 25,3 % |
| España | CaixaBank | Grupo | 24,9 % |

Referencia EBA a nivel de sistema, 2026-Q1 (§2.21): Italia 33,79 %, Alemania
31,97 %, Países Bajos 20,42 %, España 23,93 %. Los cuatro bancos quedan cerca
de la media de su país, lo que da cierta confianza en las cifras, pero no
resuelve la pregunta: **ninguna de estas cifras es el negocio PYME.**

### 2.28 Conclusión del bloque 7: no cierra la pata de ingresos

Se adelantó este bloque esperando que cubriera la medición del ingreso por
comisiones en los cuatro países sin estadística oficial (§2.26). **No lo
consigue**, por tres razones acumuladas:

1. **Solo dos bancos publican segmento de empresas** con comisiones.
2. **Esos dos segmentos no son PYME.** Commerzbank Corporate Clients mezcla
   gran empresa, PYME, sector público e institucionales. ABN AMRO Corporate
   Banking incluye Clearing y Global Markets, y además **la PYME neerlandesa
   no está ahí**, sino en Personal & Business Banking: usarlo como proxy de
   PYME sería un error.
3. **Los perímetros no son comparables entre bancos** ni con los segmentos
   del resto.

Lo que sí aporta el bloque: un orden de magnitud del peso de la comisión en
banca de empresas europea, entre el 25 % y el 35 % del ingreso, consistente
con el dato de sistema del EBA. Es un techo de información, no una medida
del negocio PYME.

**Consecuencia para el encargo:** la pregunta de rentabilidad PYME comparable
entre los seis países **no tiene respuesta con fuentes públicas**. Se puede
responder para España con precisión (MIR + Boletín, con comisiones), de forma
aproximada para Italia (MIR + TAEG de AnaCredit, perímetro distinto), y solo
en precio nominal para los otros cuatro.

### 2.29 Tres bancos bloquean la descarga automatizada

ING, Société Générale y BNP Paribas devuelven 403 a cualquier petición
automatizada, también con user-agent de navegador y en varios dominios. No es
la política de red del entorno: Commerzbank, ABN AMRO, Intesa, CaixaBank,
BPER, la CNMV y el Banco de España descargan sin problema. Es protección
antibot del propio sitio.

Si se quieren esos tres: descargar los PDF a mano y dejarlos en
`raw/bancos/`. El extractor los toma igual, solo hay que añadir sus valores
a la tabla `DATOS` de `scripts/comparables_bancos.py`.

### 2.30 OCDE Scoreboard: dos límites que lo dejan como contraste histórico

Dataset `DSD_SMEE_FINANCING@DF_SMEE_SCOREBOARD` del portal SDMX de la OCDE.
Es la **única fuente del encargo que segmenta por tamaño de EMPRESA con
definición nacional de PYME**, y la única que publica directamente un spread
PYME frente a gran empresa. Pero:

- **El último año es 2022.** Cuatro años de retraso frente al MIR, que llega
  a 2026-07. No sirve para precio actual.
- **Alemania no participa.** Cero filas para `DEU` en todo el dataset, no
  solo en algunas medidas. El mayor mercado de los seis queda fuera.
- El factoring solo tiene dato para Francia y Portugal.
- Cada país reporta con **su propia definición nacional de PYME**, no
  armonizada. Las filas lo declaran en `notas`.

Lo que sí aporta: **corroboración independiente del hallazgo español.**
Spread PYME frente a gran empresa, 2022:

| País | Spread OCDE | Tipo PYME |
|---|---|---|
| **España** | **0,2 pp** | 3,44 % |
| Portugal | 0,52 pp | 3,18 % |
| Francia | 0,58 pp | 1,90 % |
| Países Bajos | 0,9 pp | 3,80 % |
| Italia | 2,0 pp | 5,30 % |
| Alemania | — | — |

España es el spread más estrecho y el de Italia el más amplio, el mismo
orden que sale del MIR en 2026 (§2.15). Dos fuentes independientes, con
definiciones distintas de PYME y cuatro años de separación, coinciden en el
ordenamiento. Refuerza que el spread estrecho español es estructural y no un
efecto del período elegido.

### 2.31 Factoring: hay volumen, no hay precio

**EUF, datos anuales 2025**, volumen cedido por país:

| País | Volumen cedido | Cuota Europa | % del PIB | Var. anual |
|---|---|---|---|---|
| Francia | 439.430 M€ | 17,2 % | 14,8 % | +1,9 % |
| Alemania | 423.472 M€ | 16,6 % | **9,5 %** | +6,2 % |
| Italia | 297.445 M€ | 11,6 % | 13,2 % | +3,8 % |
| España | 269.885 M€ | 10,6 % | 16,5 % | +1,2 % |
| Países Bajos | 165.399 M€ | 6,5 % | 14,0 % | +5,3 % |
| Portugal | 51.509 M€ | 2,0 % | **20,7 %** | **+12,7 %** |

Total europeo 2,055 billones de euros; la EUF cubre el 94,4 %.

Dos lecturas:

- **La penetración invierte el ranking de tamaño.** Alemania es el segundo
  mercado en volumen pero el último en penetración sobre PIB (9,5 %).
  Portugal es el más pequeño en volumen y el que más penetra (20,7 %), y
  además el que más crece (+12,7 %). El factoring pesa mucho más en las
  economías del sur.
- **`turnover` es importe cedido en el año, no saldo vivo.** No debe
  compararse con la cartera de crédito del MIR ni del EBA. Las filas lo
  declaran.

**Lo que no hay: el precio.** Ni la EUF ni la OCDE publican comisión de
cesión ni tipo de descuento. Sigue en pie lo anotado en §2.2: el precio del
factoring solo existe en cuentas anuales de filiales especializadas
(bloque 8), y el confirming no tiene estadística pan-europea comparable
porque en el resto de países se reporta como *reverse factoring* con
perímetro distinto.

### 2.32 El agregado de la EUF no significa lo mismo en cada país

Hallazgo del bloque 8, y el más importante de los dos bloques de factoring.
Contrastando el detalle nacional contra el agregado europeo:

| | España (AEF) | Italia (Assifact) |
|---|---|---|
| Total publicado | 269.885 M€ | 289.105 M€ (EUF da 297.445) |
| Factoring | 127.984 M€ (47,4 %) | ~262.000 M€ |
| **Confirming** | **141.901 M€ (52,6 %)** | **5.370 M€ (1,9 %)** |
| Reverse factoring | (incluido en confirming) | 21.960 M€ |

**Más de la mitad de la cifra española es confirming. En Italia es el 1,9 %.**
Comparar los 269.885 M€ de España con los 297.445 M€ de Italia, como invita
a hacer la tabla de la EUF, es comparar dos cosas distintas: la española es
mayoritariamente pago confirmado a proveedores, la italiana es cesión de
facturas.

Esto confirma con datos lo que se anotó como sospecha en §2.2. Consecuencias:

- **El ranking de la EUF (§2.31) no es un ranking de factoring.** Es de
  "factoring y financiación comercial", con mezcla distinta por país.
- La penetración española sobre PIB del 16,5 % no es comparable con la
  alemana del 9,5 % sin saber cuánto confirming lleva cada una, dato que la
  EUF no publica.
- Para comparar de verdad haría falta el desglose nacional de los seis
  países. Se tiene de España e Italia. Faltan Alemania, Francia, Portugal y
  Países Bajos, cada uno en su asociación nacional.

Ojo también a la magnitud del confirming español más allá del volumen
cedido: **273.000 M€ en órdenes de pago gestionadas** y más de 400.000 M€ de
créditos gestionados, en torno al 24 % del PIB.

### 2.33 Bloque 8: cerrado sin dato de precio

El objetivo era la comisión de cesión de las filiales especializadas
(Santander Factoring y Confirming, BNP Paribas Factor, Eurofactor). **No se
ha obtenido, y no por falta de intentos.**

- Las cuentas anuales de **Santander Factoring y Confirming, S.A.U., E.F.C.**
  están depositadas en el Registro Mercantil de Madrid, de **acceso de pago**.
  Los agregadores que las revenden (Infoempresa, Axesor, Iberinform) también.
- **Ninguna asociación nacional publica precio.** Ni la EUF, ni la AEF, ni
  Assifact, ni la OCDE. Todas publican volumen, crecimiento, penetración y
  calidad de crédito. Assifact se acerca más que nadie con calidad de
  crédito (deteriorados 2 %, sofferenze 1,03 %) pero no da comisión ni tipo.

Vías que quedan abiertas, ninguna gratuita ni automatizable:

1. **Registro Mercantil** español, de pago, para la filial de Santander.
2. **Bundesanzeiger** alemán (alcanzable, `200`), donde BNP Paribas Factor
   GmbH deposita cuentas. Es gratuito pero requiere búsqueda por formulario,
   no automatizable desde aquí.
3. Cuentas de **Eurofactor** dentro de Crédit Agricole Leasing & Factoring.

**Conclusión: el precio del factoring y del confirming no es obtenible con
fuentes públicas gratuitas en ninguno de los seis países.** Es el único
bloque del encargo que se cierra sin ningún dato de su objetivo principal.

### 2.34 PD × LGD de PYME: el coste del riesgo deja de ser un supuesto

Dos extracciones nuevas eliminan los dos supuestos más pesados del modelo.

**Parámetros IRB** (`scripts/eba_parametros_riesgo.py`). El anexo de
parámetros de riesgo del Risk Dashboard del EBA, con origen en **COREP
C 9.02**, publica por país y clase de exposición la tasa de default, la tasa
de pérdida, la **PD ajustada y la LGD**, en percentiles y media ponderada.
Existe la clase **«Corporates – Of Which: SME»**. Mediana de entidades,
2026-Q1:

| País | PD | LGD | PD × LGD |
|---|---|---|---|
| Países Bajos | 1,18 % | 29,7 % | **0,35 %** |
| Alemania | 1,26 % | 31,4 % | 0,40 % |
| Portugal | 1,26 % | 40,0 % | 0,50 % |
| España | 1,73 % | 34,4 % | 0,59 % |
| Francia | 2,15 % | 31,5 % | 0,68 % |
| Italia | 2,26 % | 35,6 % | **0,80 %** |

Se usa la **mediana** y no la media ponderada, que se deja arrastrar por
carteras grandes con parámetros extremos.

**Densidad de RWA** (`scripts/eba_te_pyme.py`). El fichero `tr_cre.csv` de la
base completa del Transparency Exercise, 123 MB, trae partidas específicas
de PYME. Densidad = RWA PYME / valor de exposición PYME, junio 2025:

| País | Densidad de RWA | Exposición PYME |
|---|---|---|
| Portugal | 61,3 % | 30.452 M€ |
| España | 59,5 % | 308.378 M€ |
| Italia | 46,3 % | 252.021 M€ |
| Francia | 43,0 % | 961.184 M€ |
| Países Bajos | 37,2 % | 259.108 M€ |
| Alemania | 35,3 % | 316.561 M€ |

El Transparency Exercise **no publica PD ni LGD** en su edición 2025: solo
exposición, RWA, exposición en default y provisiones. Los parámetros vienen
del anexo del Risk Dashboard, que es otra fuente.

### 2.35 Spread PYME frente a gran empresa: falla más, pero recupera mejor

Mediana de entidades, 2026-Q1, clases IRB «Corporates – Of Which: SME» y
«Corporates – Of Which: Large corporates»:

| País | PD PYME / grande | LGD PYME / grande | Spread PD | Spread LGD | Spread PD×LGD |
|---|---|---|---|---|---|
| España | 1,73 / 0,57 % | 34,4 / 40,0 % | +116 pb | −5,6 pp | +36 pb |
| Alemania | 1,26 / 0,50 % | 31,4 / 39,6 % | +76 pb | −8,1 pp | +20 pb |
| Francia | 2,15 / 0,60 % | 31,5 / 40,0 % | +155 pb | −8,5 pp | +44 pb |
| Italia | 2,26 / 0,67 % | 35,6 / 40,0 % | +159 pb | −4,4 pp | +53 pb |
| Portugal | 1,26 / 0,33 % | 40,0 / 40,0 % | +93 pb | 0,0 pp | +37 pb |
| Países Bajos | 1,18 / 0,52 % | 29,7 / 40,0 % | +66 pb | −10,3 pp | +14 pb |

**La PD de PYME es entre dos y cuatro veces la de gran empresa** en los seis
países. Pero **la LGD de PYME es menor en cinco de los seis**, lo que
compensa parcialmente: el diferencial de pérdida esperada queda entre +14 y
+53 pb, muy por debajo de lo que sugeriría la PD sola.

**Cautela obligatoria con la LGD de gran empresa.** Está agrupada en el
40,0 % en los seis países y en todo el reparto: percentil 25 entre 36,5 y
39,9, mediana entre 39,5 y 40,0, percentil 75 exactamente 40,0 en los seis.
Es el **valor supervisor del IRB básico para exposiciones corporativas senior
bajo CRR3**, no una estimación propia de las entidades.

Consecuencia: la ventaja de severidad de la PYME es real —viene de mayor
garantía real y aval personal— pero **está exagerada por ese efecto
metodológico**. En media ponderada, donde pesan más las carteras con modelos
avanzados, la brecha se reduce a la mitad: PYME entre 23,6 % y 37,9 % frente
a gran empresa entre 35,0 % y 38,8 %. En Italia casi desaparece (37,9 frente
a 38,8).

El **spread de PD sí es sólido**: la PD es estimación propia en ambas clases,
tanto en IRB básico como en avanzado.

### 2.36 Corrección: el ROE cambia de orden al usar datos observados

El modelo anterior suponía un coste del riesgo derivado del NPL de PYME con
un factor calibrado, y una densidad de RWA uniforme del 57 %. Ambos eran
razonables pero **estaban equivocados en magnitud y, sobre todo, en
dispersión entre países**.

| País | ROE con supuestos | ROE con PD×LGD y densidad observadas |
|---|---|---|
| Países Bajos | 10,2 % | **13,7 %** |
| Alemania | 8,6 % | **12,1 %** |
| Portugal | 10,5 % | 8,1 % |
| Italia | 10,5 % | 7,6 % |
| España | 8,3 % | **5,5 %** |
| Francia | 4,3 % | 1,7 % |

Qué cambió y por qué:

- El coste del riesgo supuesto **infravaloraba** el real en torno a la mitad
  (España 0,32 % supuesto frente a 0,59 % observado).
- La densidad de RWA uniforme **ocultaba el factor que más mueve el
  resultado**: va del 35,3 % en Alemania al 61,3 % en Portugal. Un euro de
  préstamo PYME consume casi el doble de capital en España que en Alemania.
- Alemania y Países Bajos suben porque combinan el menor coste del riesgo
  con la menor densidad de RWA. España baja porque junta el precio más bajo
  con la segunda mayor densidad.

**Lectura de negocio:** el ranking de rentabilidad PYME lo decide más el
consumo de capital que el precio. Es lo contrario de lo que sugería el
modelo con supuestos, y cambia dónde conviene mirar.

### 2.37 Irlanda incorporada: séptimo país

Añadida a toda la cadena de extracción y al modelo. Cobertura completa salvo
dos huecos concretos.

| Bloque | Irlanda |
|---|---|
| Precio por tramo (MIR) | Completo, los cuatro tramos |
| Circulante (A2Z1) | Completo |
| Crédito al consumo a hogares (A2D) | **No existe**, 404 en el MIR |
| Volumen de depósito a plazo (L22) | **No existe**, 404 |
| EBA Risk Dashboard | Completo |
| Parámetros IRB (PD, LGD) | Completo |
| Transparency Exercise (capital) | Completo |
| OCDE Scoreboard | Completo, hasta 2022 |
| EUF factoring | Completo |

**Perfil: el precio más alto y el capital más caro.**

| Métrica | Irlanda | Posición entre los siete |
|---|---|---|
| Precio tramo ≤1 M€ | 5,37 % | **el más alto** |
| PD de PYME | 1,08 % | **la más baja** |
| LGD de PYME | 37,3 % | segunda más alta |
| PD × LGD | 0,40 % | empatada con Alemania, segunda más baja |
| **Densidad de RWA** | **70,0 %** | **la más alta**, el doble que Alemania |
| Cost-income | 57,4 % | segunda peor |
| NPL de PYME | 3,77 % | segunda más baja |
| Exposición PYME | 16.964 M€ | **la más pequeña**, 1,8 % de la francesa |
| Peso del tramo ≤1 M€ | 16,8 % | similar a Alemania |
| Factoring sobre PIB | 4,5 % | **la más baja**; crecimiento 0,0 % |
| **ROE modelizado** | **7,7 %** | empatada con Italia, cuarta |

**Lo que aporta Irlanda al argumento central.** Es el caso que confirma, por
el lado contrario, que el ranking lo decide el capital y no el precio:
tiene el precio más alto de los siete y la mejor PD, y aun así queda en
mitad de tabla porque la densidad de RWA del 70 % y un cost-income del 57 %
se comen el margen. España e Irlanda están en los extremos opuestos de
precio y llegan a ROE parecidos por la misma vía: consumo de capital alto.

Es además el país **menos sensible al supuesto de comisiones**: su ROE va
del 5,5 % al 9,2 % entre cero y 150 pb, un recorrido de 3,7 puntos frente a
los 8,4 de Alemania. Su margen de partida es tan amplio que la comisión pesa
poco en términos relativos.

**Cautela sobre el tamaño.** La cartera PYME irlandesa de la muestra del EBA
son 16.964 M€, menos del 2 % de la francesa. Los parámetros medianos salen
de pocas entidades declarantes, así que son más volátiles que los del resto.
La OCDE le atribuía además un NPL del 8,1 % en 2022, muy por encima del
3,77 % actual del EBA: el saneamiento posterior a la crisis bancaria
irlandesa sigue siendo reciente y conviene no extrapolar la serie histórica.

### 2.38 Corrección: el coste de fondos pasa a ser el coste real de los recursos de empresa

El modelo usaba el **Euríbor 3m, 2,23 %, igual para todos los países**. Eso
mide el coste de financiarse en mercado, no el coste de los recursos que
aporta la propia PYME, que es lo que interesa en banca de relación.

Se sustituye por el **coste ponderado del depósito de empresa de cada país**
(`scripts/coste_recursos.py`), combinando dos datasets del BCE:

- **Tipos**: dataset MIR, depósito a la vista y a plazo de sociedades no
  financieras, nueva producción.
- **Saldos**: dataset BSI, series `L21` (vista) y `L22` (plazo), sector
  `2240`, para ponderar la mezcla real de cada país.

| País | Vista | Plazo | % vista | **Coste ponderado** | Margen sobre BCE |
|---|---|---|---|---|---|
| Irlanda | 0,10 % | 1,90 % | 82,6 % | **0,41 %** | 1,68 % |
| Portugal | 0,07 % | 1,77 % | 62,3 % | 0,71 % | 1,38 % |
| España | 0,44 % | 1,90 % | 78,9 % | 0,75 % | 1,34 % |
| Italia | 0,56 % | 2,31 % | 88,6 % | 0,76 % | 1,33 % |
| Países Bajos | 0,85 % | 2,14 % | 83,7 % | 1,06 % | 1,03 % |
| Alemania | 0,72 % | 2,23 % | 71,3 % | 1,16 % | 0,93 % |
| Francia | 0,52 % | 2,58 % | 60,1 % | **1,34 %** | 0,75 % |

**Lo decide la mezcla, no el tipo.** Italia paga más a la vista que España
(0,56 % frente a 0,44 %) y acaba prácticamente igual de barata, porque tiene
el 88,6 % en vista frente al 78,9 % español. Francia paga un tipo a la vista
intermedio pero es la más cara de las siete porque solo el 60 % de sus
recursos son a la vista.

Efecto sobre el ROE:

| País | ROE con Euríbor | ROE con coste real de recursos |
|---|---|---|
| Países Bajos | 13,7 % | **20,4 %** |
| Alemania | 12,1 % | **18,1 %** |
| Italia | 7,7 % | 15,8 % |
| Portugal | 8,1 % | 14,9 % |
| España | 5,5 % | 13,4 % |
| Irlanda | 7,7 % | 12,2 % |
| Francia | 1,7 % | 5,0 % |

Los niveles quedan mucho más cerca de lo que un banco obtiene realmente de
una cartera PYME. **El supuesto asociado hay que declararlo**: se está
financiando el crédito PYME íntegramente con depósito de empresa. Es el
extremo opuesto al fondeo en mercado, y la realidad de cada banco está en
medio según su relación crédito/depósitos. Con fondeo íntegro en mercado los
ROE caerían entre 6 y 12 puntos, como muestra la columna de la izquierda.

### 2.39 Error corregido: el bloque de depósitos no se escribía

La lámina de coste de recursos salía con el gráfico vacío. Causa: al ejecutar
`modelo_roe.py` canalizando la salida a `head`, Python recibía
`BrokenPipeError` al imprimir y moría **antes de escribir el bloque de
depósitos** en el CSV. El fichero quedaba con 112 filas en vez de 133 y la
preparación de datos de la presentación leía ceros.

No era un fallo del modelo ni de los datos, sino de cómo se estaba
ejecutando. Queda anotado porque el mismo patrón puede repetirse con
cualquiera de los extractores: **no canalizar su salida a `head` o `tail` si
escriben ficheros después de imprimir**.

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
