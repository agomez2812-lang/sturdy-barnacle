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

### 2.40 Aclaraciones de cálculo pedidas sobre la presentación

**Spread de comisiones en España.** Se calcula entre los **dos tramos
extremos**, no contra el intermedio:

    Spread = tramo ≤0,25 M€ − tramo >1 M€
    TEDR:  3,4173 − 3,4404 = −0,0231 pp = −2,3 pb
    TAE:   4,4348 − 3,6220 = +0,8129 pp = +81,3 pb

Las cifras del gráfico van redondeadas a dos decimales; el spread sale del
valor completo. Si en su lugar se compara el tramo bajo contra el intermedio
(0,25–1 M€) el resultado es distinto: +5,9 pb en TEDR y +71,7 pb en TAE. La
lámina 5 lleva ahora la fórmula y los cuatro decimales.

**Capital asignado.** Es el producto de dos magnitudes observadas, sin
supuesto:

    Capital asignado = densidad de RWA × ratio CET1

| País | Densidad de RWA | × CET1 | = Capital |
|---|---|---|---|
| España | 59,46 % | 13,67 % | 8,13 % |
| Alemania | 35,34 % | 16,94 % | 5,99 % |
| Francia | 43,00 % | 15,88 % | 6,83 % |
| Italia | 46,35 % | 15,56 % | 7,21 % |
| Portugal | 61,33 % | 17,82 % | 10,93 % |
| Países Bajos | 37,20 % | 16,38 % | 6,09 % |
| Irlanda | 69,97 % | 18,31 % | 12,81 % |

La densidad viene del Transparency Exercise y el CET1 del Risk Dashboard. La
lámina 13 lleva ahora la descomposición en tabla.

**NPL frente a coste del riesgo.** Son dos cosas distintas y estaban en
láminas contiguas sin decirlo:

- **Ratio de NPL** (lámina 10): **stock** de dudosos sobre cartera. No entra
  en el modelo.
- **Coste del riesgo** (lámina 11): **flujo** anual de pérdida esperada,
  calculado como **PD × LGD**. Ejemplo España: 1,73 % × 34,38 % = 0,59 %. Es
  la línea de riesgo de la cuenta de resultados.

Ambas láminas llevan ahora el aviso y la fórmula.

**Gráfico de la lámina de hipotecas.** Muestra el **ratio de NPL de la
cartera de inmueble comercial**, es decir el porcentaje en mora. No es precio
ni margen: es calidad de activo. El gráfico lleva ahora título propio.

### 2.41 Identidad visual: paleta corporativa de Bankinter

La presentación pasa a la paleta de marca, tomada del manual de marca de
mayo de 2021 (Fundación Innovación Bankinter, 83 páginas), que incluye una
página específica de **colores para gráficos**:

| Uso | Color | Hex | Pantone |
|---|---|---|---|
| Primario | Naranja | `#F56600` | 165 C |
| Secundario | Azul | `#237DFF` | 2727 C |
| Secundario | Magenta | `#DC005F` | 2040 C |
| Negro | Negro | `#2B2B2B` | — |
| Terciarios | Grises | `#818181` `#A1A1A1` `#CACACA` `#E5E5E5` | — |
| Ampliada | Naranja 2 / Azul 2 | `#FFAB70` `#77BFEE` | — |

Criterio aplicado: naranja dominante, azul para la serie de contraste,
magenta reservado a avisos y huecos, grises para neutralizar.

**Tipografía.** La de marca es Bankinter Sans, que no está disponible ni
aquí ni en un PowerPoint estándar. El propio manual fija la sustituta:
**«En caso de no poder utilizar Bankinter Sans se sustituirá por la
tipografía de sistema: Verdana»**. Se usa Verdana. Al ser más ancha que la
tipografía anterior hubo que bajar los títulos de 30 a 25 puntos y acortar
cuatro de ellos.

**Salvedad honesta:** el manual accesible es el de la **Fundación**
Innovación Bankinter, una submarca. El brand center corporativo
(`marca.bankinter.com`) devuelve 403 a descarga automatizada. Los colores
nucleares coinciden con lo que describe la documentación corporativa
(naranja PMS 165 como principal, más blanco, azul y negro), pero la
corporativa menciona **amarillo** donde la de la Fundación usa magenta.
Si se quiere precisión total conviene contrastar contra el manual
corporativo.

### 2.42 El ROE, paso a paso, y el cambio a tipo impositivo por país

**Fórmulas**, todo en porcentaje del saldo medio de la cartera PYME:

```
ingreso  = precio + comisiones
margen   = ingreso − coste de los recursos
gastos   = margen × (cost-income / 100)
BAI      = margen − coste del riesgo − gastos
capital  = densidad de RWA × ratio CET1 / 100
ROE      = BAI × (1 − tipo impositivo) / capital × 100
```

Comprobación para España: ingreso 3,41 + 0,87 = 4,28; margen 4,28 − 0,75 =
3,54; gastos 3,54 × 0,4214 = 1,49; BAI 3,54 − 0,59 − 1,49 = 1,45; capital
59,46 % × 13,67 % = 8,13; ROE 1,45 × 0,75 / 8,13 × 100 = **13,4 %**.

**Cambio: del 25 % uniforme al tipo que paga la banca en cada país.** No es
el tipo general de sociedades: dos países tienen regla propia para el sector
y usar la genérica los deja mal.

| País | Tipo | Base legal | ROE |
|---|---|---|---|
| Países Bajos | 25,8 % | combinado 2026 | **20,2 %** |
| Alemania | 30,1 % | combinado 2026 | 16,9 % |
| Italia | 27,8 % | combinado 2026 | 15,2 % |
| Portugal | 29,5 % | combinado 2026 | 14,0 % |
| Irlanda | **15,0 %** | **mínimo de Pilar Dos** para grupos >750 M€, en vigor desde 2024. El 12,5 % histórico solo aplica a los que quedan fuera, y los bancos irlandeses no | 13,8 % |
| España | **30,0 %** | **art. 29 LIS**: las entidades de crédito tributan al 30 %, no al 25 % general | 12,5 % |
| Francia | 25,8 % | tipo **ordinario**, confirmado | 5,0 % |

Las dos correcciones sectoriales las señaló el usuario y son acertadas: con
el tipo genérico, España salía 0,9 puntos de ROE por encima de lo que le
corresponde e Irlanda 0,4 por debajo.

**Francia: aplicado el tipo ordinario del 25,8 %**, por decisión expresa. La
contribución excepcional que lo eleva al 36,1 % solo alcanza a grupos con
cifra de negocio superior a 1.500 M€; con ella el ROE francés sería 4,3 %.
Queda documentada como variante, no aplicada.

Con esto el modelo conserva **un solo supuesto material: la cuña de
comisiones fuera de España**. Precio, recursos, riesgo, capital, eficiencia
e impuesto son todos observados por país.

### 2.43 Ajuste de la paleta: pastel en vez de secundarios saturados

El azul `#237DFF` y el magenta `#DC005F` del manual resultan estridentes en
pantalla proyectada. Se sustituyen por los **matices pastel de la propia
paleta ampliada**, que el manual define precisamente en su página de
«colores para gráficos», de modo que el deck sigue siendo cien por cien
corporativo:

| Antes | Ahora | Nombre en el manual |
|---|---|---|
| `#237DFF` azul | `#77BFEE` / `#C7E3F9` | Azul 2 y Azul 3 |
| `#DC005F` magenta | `#FF8AC2` / `#FFCCE8` | Magenta 2 y Magenta 3 |
| — | `#FFAB70` / `#FFD6BA` | Naranja 2 y Naranja 3 |

Regla aplicada: **el color vive en los rellenos pastel y el texto va en
negro corporativo**; nunca texto blanco sobre pastel, que era lo que obligaba
a usar tonos saturados. El naranja `#F56600` queda como único acento fuerte
y se reserva para la serie principal de cada gráfico y para los totales.

Verificación automática del fichero: **los 13 colores presentes en las 21
láminas pertenecen todos a la paleta del manual**, sin ninguno fuera.

### 2.44 Escenario de entrante eficiente

Simulación pedida: un banco extranjero que entra con **sus** ratios de
balance y coste, pero enfrentando el mercado local tal y como es.

**Del entrante** (parámetros del escenario, no observados): coste de los
recursos 0,80 %, eficiencia 40 %, CET1 12,9 %.
**Del mercado local** (observado): precio, coste del riesgo PD × LGD,
densidad de RWA y tipo impositivo de banca. La cuña de comisiones sigue
siendo el supuesto de siempre.

| País | ROE local | ROE entrante | Gana |
|---|---|---|---|
| Países Bajos | 20,2 % | **37,0 %** | +16,8 |
| Alemania | 16,9 % | **35,0 %** | +18,1 |
| Irlanda | 13,8 % | 27,0 % | +13,1 |
| Francia | 5,0 % | 21,8 % | +16,8 |
| Italia | 15,2 % | 21,6 % | +6,4 |
| Portugal | 14,0 % | 16,9 % | +3,0 |
| **España** | 12,5 % | **13,7 %** | **+1,2** |

**El orden de atractivo cambia por completo:**

- Local: P. Bajos > Alemania > Italia > Portugal > Irlanda > España > Francia
- Entrante: P. Bajos > Alemania > **Irlanda > Francia** > Italia > Portugal > España

**Francia pasa del último puesto al cuarto.** Es el mercado peor para su
propia banca y de los mejores para un entrante, porque el incumbente es el
más ineficiente de los siete (65,6 % de cost-income) y el más caro en
recursos (1,34 %). Lo que compra el entrante no es el margen del mercado
sino **la distancia respecto al incumbente**.

**España es donde menos vale entrar eficiente: solo 1,2 puntos.** Su banca
ya es la segunda más eficiente (42,1 %) y sus recursos ya son más baratos
que los del entrante (0,75 % frente a 0,80 %: el entrante pagaría *más*).
Y siguen pesando la densidad de RWA del 59,5 % y el 30 % de impuesto, que
el entrante no puede cambiar.

**Lo que el escenario NO incluye**, y hay que decirlo antes de usarlo para
decidir: coste de entrada, escala mínima viable, curva de aprendizaje del
riesgo en un mercado nuevo, y el hecho de que la densidad de RWA usada es la
del mercado local; un entrante con método estándar o con menos garantía real
tendría una densidad distinta, y es el factor que más pesa en el resultado.

### 2.45 Conclusiones incorporadas a la presentación

Cinco conclusiones y seis recomendaciones, en dos láminas nuevas. Las cuatro
primeras conclusiones se apoyan en datos observados por país; la quinta
señala el supuesto que las condiciona.

1. **El capital manda sobre el precio.** La densidad de RWA va del 35 % al
   70 %; el precio solo del 3,41 % al 5,37 %.
2. **El atractivo para un entrante no coincide con la rentabilidad del
   local.** Se compra la distancia respecto al incumbente, no el margen.
3. **España es el mercado donde menos vale entrar eficiente.**
4. **Países Bajos y Alemania son los objetivos naturales.**
5. **La comisión es el único supuesto material que queda.**

Recomendaciones: priorizar Países Bajos y Alemania; estudiar Francia e
Irlanda; descartar España y Portugal por diferencial insuficiente; validar
la comisión en el mercado objetivo antes de decidir; recalcular la densidad
de RWA con el método propio del entrante; y cerrar el precio del factoring
por vía no pública si el producto entra en el plan.

### 2.46 Mitigación del coste del riesgo: la palanca es la PD, no la LGD

Pregunta del usuario: cómo mitigar el coste del riesgo en PYME (bureaus de
crédito, cuentas auditadas, etc.) y qué países están mejor posicionados.

**Descomposición.** Sobre los parámetros IRB del EBA (COREP C 9.02, clase
«Corporates – Of Which: SME», mediana de entidades, 2026-Q1), se recalcula
el coste del riesgo `PD x LGD` de cada país sustituyendo primero la PD por
la mejor de las siete y después la LGD por la mejor de las siete:

```
Dispersión del coste del riesgo entre países:
  real                                : 0,45 pp
  igualando la PD a la mejor  (1,08 %): 0,11 pp  -> queda el 25 %
  igualando la LGD a la mejor (29,7 %): 0,35 pp  -> queda el 78 %
```

Es decir, **igualar la PD elimina el 75 % de la dispersión entre países;
igualar la LGD solo el 22 %**. Ahorro por país en puntos básicos
(ES, DE, FR, IT, PT, NL, IE):

```
con la mejor PD : [22,  6, 34, 42,  7,  3,  0]
con la mejor LGD: [ 8,  3,  4, 13, 13,  0,  8]
```

Italia (−42 pb) y Francia (−34 pb) son los que más recorrido tienen por
selección; Irlanda y Países Bajos ya están en la frontera.

**Matiz que hay que mantener siempre junto al dato.** Esto mide la
dispersión *entre países*, no el recorrido de un banco concreto. Para un
prestamista individual la garantía, el aval y el SGR sí bajan su LGD propia.
Lo que el dato dice es que las diferencias *de mercado* vienen de la calidad
de la cartera admitida, no de la capacidad de recobro del sistema.

**Infraestructura de información crediticia (evidencia documental, no
estadística).** Umbrales de declaración obligatoria al registro público
vigentes en 2026:

| País | Registro público | Umbral | Bureaus privados | Cuentas depositadas |
|---|---|---|---|---|
| España | CIRBE (BdE) | 1.000 € | Informa D&B, Axesor, Iberinform | Registro Mercantil, obligatorio |
| Alemania | Millionenkredite (Bundesbank) | 1.000.000 € | Creditreform, Schufa, CRIF | Bundesanzeiger, obligatorio |
| Francia | FIBEN + cotación BdF | adhesión I-FIBEN | Altares D&B, Ellisphere, Coface | confidencialidad opcional para micro y pequeña |
| Italia | Centrale dei Rischi | 30.000 € (250 € si deteriorado) | Cerved, CRIF | Registro Imprese, obligatorio |
| Portugal | CRC (BdP) | 50 € | Informa D&B, Iberinform | IES, obligatorio |
| Países Bajos | no existe para empresas | — | Graydon (desde 1888), Altares D&B | KvK, abreviado para pequeñas |
| Irlanda | Central Credit Register | 500 €, consulta obligatoria > 2.000 € | Vision-net, CRIF, Creditsafe | CRO, obligatorio |

**Hallazgo contraintuitivo: el registro público NO explica la PD observada.**
Los dos países con el registro público más débil para PYME —Alemania, que
solo cubre exposiciones de más de un millón, y Países Bajos, que no tiene
registro de empresas— están entre las PD más bajas (1,26 % y 1,18 %), junto
con Irlanda (1,08 %). España, con uno de los umbrales más bajos de Europa
(1.000 €), tiene 1,73 %. Lo que sí acompaña a las PD bajas es la profundidad
del *bureau* privado y la disponibilidad real de cuentas depositadas.

Con siete observaciones esto es **indicativo, no causal**: no se puede
descartar que la PD baja de Alemania y Países Bajos venga de la composición
sectorial de su tejido empresarial y no de la información disponible. Se
etiqueta como evidencia documental y se presenta como tal en la lámina.

**Lastre específico de Francia.** Las microempresas pueden declarar
confidencial la totalidad de sus cuentas, y las pequeñas su cuenta de
resultados. Un entrante sin adhesión a I-FIBEN entra a ciegas, lo que
refuerza la lectura de la lámina 9 (Francia es atractiva para un entrante
eficiente, 21,8 %, pero el acceso a información es una barrera real de
entrada, no un detalle operativo).

**Salidas:** dos láminas nuevas en la presentación (14 «Mitigar el coste del
riesgo: dónde está la palanca» y 15 «Infraestructura de información
crediticia de PYME»), y el bloque `riesgo` en `pres/datos.json` con
`ahorro_pd`, `ahorro_lgd`, `mejor_pd`, `mejor_lgd` e `infra`.

### 2.47 Los dos ejes del riesgo: la hipótesis del usuario, contrastada

Hipótesis planteada por el usuario: la **LGD** depende del entorno
regulatorio (poder ejercer o no el derecho de recobro, y las garantías
disponibles) y la **PD** depende de la información para seleccionar. Se
pide clasificar a los países en esas dos dimensiones y ver las
correlaciones.

**Fuente institucional elegida.** Banco Mundial, *Doing Business 2020*,
dataset histórico completo. Es la última medición comparable de los siete
países: el programa se descontinuó en 2021 y su sucesor **B-READY solo
cubre Portugal** de los siete (comprobado contra la API del Banco Mundial:
`IC.BRE.BI.OS` devuelve únicamente PT). El *vintage* es **mayo de 2019** y
se etiqueta como tal en cada fila. Los indicadores `IC.CLS.REC.CD` e
`IC.ISV.DURS` ya no se sirven por la API; hubo que bajar el Excel del
archivo. Extractor en `scripts/marco_riesgo.py`, salida en
`transversal/marco_riesgo.csv`.

**Construcción de los dos índices.** Media simple de cuatro componentes
normalizados min-max a 0-100 sobre los siete países. **100 = el mejor de
los siete, no un óptimo absoluto.** Los componentes se fijaron por
mecanismo *antes* de mirar las correlaciones, para no ajustar el índice al
resultado:

- *Información*: profundidad de la información crediticia (0-8) y cobertura
  del bureau privado, ambos de Doing Business; más dos ordinales propios
  (0-3) sobre el umbral del registro público frente al tamaño típico de una
  operación PYME y sobre el régimen real de depósito de cuentas.
- *Recobro*: fortaleza de los derechos legales del acreedor (0-12), tasa de
  recuperación, coste sobre la masa (invertido) y tiempo de resolución
  (invertido).

| País | Información | Recobro | PD | LGD |
|---|---|---|---|---|
| Irlanda | 87,5 | 88,6 | 1,08 | 37,34 |
| Alemania | 75,0 | 71,0 | 1,26 | 31,44 |
| Italia | 79,2 | 12,3 | 2,26 | 35,60 |
| España | 64,4 | 56,8 | 1,73 | 34,38 |
| Portugal | 64,5 | 17,6 | 1,26 | 40,00 |
| P. Bajos | 53,8 | 68,3 | 1,18 | 29,70 |
| Francia | 16,7 | 48,0 | 2,15 | 31,51 |

**Correlaciones (ρ de Spearman, n=7).** El signo esperado es negativo en
los cuatro casos:

| | con la PD | con la LGD |
|---|---|---|
| Índice de información | −0,23 | +0,54 |
| Índice de recobro | **−0,79** | −0,32 |
| Índice de recobro, sin Portugal | — | **−0,03** |

**Resultado 1: el mecanismo es correcto pero el mapeo está cruzado.** El
eje que mejor predice la PD no es el de información (ρ = −0,23) sino el de
**recobro** (ρ = −0,79), la relación más fuerte de todo el ejercicio.
Interpretación —y se declara como interpretación, no como resultado—: donde
ejecutar es lento y caro, el impago se enquista y el impago estratégico
compensa, de modo que un marco de recobro débil eleva también la tasa de
default medida. Italia (22 % de la masa, 1,8 años) y Portugal (3,0 años)
son los dos peores del eje de recobro.

**Resultado 2: la LGD no es contrastable con dato supervisor.** Al excluir
Portugal, la correlación del índice de recobro con la LGD cae de −0,32 a
−0,03: **toda la relación la sostenía un solo país**. Y la LGD mediana
portuguesa es 40,00 %, que es exactamente el valor supervisor F-IRB del
art. 161 CRR3 para exposiciones senior a empresas — el mismo 40,00 % que
aparece en la LGD de gran empresa de seis de los siete países (ver
`irb_cmp.lgd_grande`). El suelo regulatorio aplasta la dispersión. La
conclusión honesta es que **con datos supervisores no se puede clasificar a
los países por LGD**: el mecanismo del usuario es sólido, pero el dato
público no lo puede medir. Para medirlo harían falta datos internos de
recuperación por entidad.

**Resultado 3: Italia es el contraejemplo del eje de información.** Tiene
la segunda mejor información de las siete (79,2, con Cerved y CRIF y
depósito obligatorio en el Registro Imprese) y la **peor PD** (2,26 %).
Saber a quién se presta no basta si después no se puede ejecutar. Francia
es el contraejemplo simétrico: la peor información (16,7, arrastrada por la
confidencialidad opcional de cuentas y por una cobertura de bureau privado
de 0 % en la medición de Doing Business) y la segunda peor PD (2,15 %).

**Irlanda es el caso que no encaja.** Está en la frontera de los dos ejes
(87,5 y 88,6) y tiene la mejor PD (1,08 %), pero una LGD alta (37,34 %).
Lo único observado que acompaña a eso es que sus modelos IRB son los más
conservadores de los siete: densidad de RWA del 70,0 % frente al 35,3 %
alemán. Se anota como hipótesis, no como explicación.

**Advertencias que acompañan siempre a este bloque.** (i) n=7: indicativo,
no causal. (ii) Los dos ejes **no son independientes** entre sí: la calidad
institucional viene en paquete, y el índice de recobro correlaciona con la
PD casi tanto como con la LGD. (iii) Hay correlaciones espurias evidentes
en los componentes en bruto —la cobertura del registro público contra la
LGD da r = 0,86 sin ningún mecanismo detrás— que ilustran lo poco que
aguanta una muestra de siete. (iv) El *vintage* institucional es 2019 y los
parámetros IRB son de 2026-Q1: siete años de distancia.

**Fuente descartada.** La OCDE publica «préstamos con aval público a PYME»,
que sería la medida directa de la dimensión de garantías. No es utilizable:
solo hay cuatro de los siete países y las definiciones nacionales no son
comparables (España declara 30 M€ en 2018 frente a 53.860 M€ de Italia en
2022, órdenes de magnitud que solo se explican por perímetros distintos).

**Salidas:** lámina 16 «Los dos ejes: información selecciona, recobro
recupera»; conclusión 5 añadida a la lámina de conclusiones y dos
recomendaciones de riesgo añadidas a la de recomendaciones; bloque `marco`
en `pres/datos.json`; unidades `indice`, `anios`, `pct_recuperacion`,
`pct_masa_concursal` y `pct_adultos` añadidas al vocabulario cerrado de
`scripts/schema.py`.

**Corrección de arrastre.** Al revisar la presentación se detectaron textos
que seguían diciendo «seis países» y «25.370 observaciones» desde antes de
incorporar Irlanda. Corregidos a siete países y 38.451 filas, y la lámina
de fuentes actualizada con el EU-wide Transparency Exercise y Doing
Business, que ya se usaban pero no estaban listados.

### 2.48 ¿La PD depende también del precio? Apetito de riesgo, contrastado

Objeción del usuario: la PD no es solo un resultado de la información
disponible, es también una decisión de **apetito**. Si presto a clientes de
más riesgo, cobro más y estoy bien así.

El mecanismo es correcto y la objeción es pertinente: obliga a matizar
§2.47. Se contrasta en los dos niveles en que puede operar. Extractor en
`scripts/apetito_riesgo.py`, salida en `transversal/apetito_riesgo.csv`.

**El test.** Si el riesgo se pagara, el **margen neto de riesgo** —precio
más comisiones, menos coste de los recursos, menos coste del riesgo, antes
de gastos y de capital— sería plano entre países. No lo es:

| País | Precio | PD | CoR | Margen neto de riesgo | ROE |
|---|---|---|---|---|---|
| Irlanda | 5,37 | 1,08 | 0,40 | **5,43** | 13,8 |
| P. Bajos | 4,50 | 1,18 | 0,35 | 3,97 | 20,2 |
| Alemania | 4,39 | 1,26 | 0,40 | 3,71 | 16,9 |
| Portugal | 3,94 | 1,26 | 0,50 | 3,59 | 14,0 |
| Italia | 4,25 | 2,26 | 0,80 | 3,56 | 15,2 |
| España | 3,41 | 1,73 | 0,59 | 2,94 | 12,5 |
| Francia | 3,77 | 2,15 | 0,68 | **2,62** | 5,0 |

**Resultado 1: entre mercados el precio va en contra del riesgo.**
ρ(precio, PD) = **−0,72** y ρ(precio, coste del riesgo) = −0,64. Los
mercados que prestan peor son los que menos cobran. El margen neto de
riesgo cae con la PD: ρ = **−0,88**. Es decir, no solo no se compensa:
se castiga dos veces.

**Consecuencia analítica.** Los siete países **no están sobre una misma
frontera de riesgo y retorno**. Bajo una historia de puro apetito,
seleccionar clientes más seguros significa aceptar menos rendimiento, y los
países de PD baja cobrarían menos. Cobran más. Eso no prueba que el apetito
no influya, pero sí **descarta que sea la explicación dominante** de la
dispersión de PD entre países.

**Excepción honesta: Italia.** Peor PD de las siete (2,26 %) y aun así el
cuarto mejor margen neto de riesgo (3,56 %). Es el único país donde la
lectura del usuario se sostiene parcialmente, y es coherente con que sea el
que más cobra el gradiente por tamaño (ver abajo).

**Resultado 2: dentro de cada mercado sí se paga.** El único eje de riesgo
observable dentro de un país en la estadística oficial es el tramo de
importe. Sobreprecio del tramo pequeño frente al de más de 1 M€, en pb:

```
Italia +143 · P. Bajos +120 · Alemania +115 · Portugal +65
Irlanda  +59 · Francia  +49 · Espana     -4
```

**España es la única de las siete donde el préstamo pequeño no sale más
caro que el grande.** Dentro del perímetro PYME (≤0,25 M€ frente a
0,25–1 M€) el gradiente español es de +5 pb, contra +109 de Italia y +94 de
Portugal. Y el gradiente acompaña a la rentabilidad: ρ(gradiente, ROE) =
**+0,86**. La causalidad puede ir en los dos sentidos —un mercado rentable
puede permitirse discriminar precio— así que se etiqueta como indicativa.

**Qué corrige de §2.47.** La PD mediana de un país es un **resultado
revelado**: mezcla entorno, información y apetito, y con dato público no se
pueden separar. La lámina de los dos ejes lleva ahora esa salvedad
explícita. Lo que el contraste de precio aporta es que la vía del apetito
no explica el patrón observado, porque produciría el signo contrario.

**Salvedades.** (i) n=7, indicativo y no causal. (ii) La comisión es un
supuesto de 87 pb en los seis países que no la publican, así que el nivel
del margen neto de riesgo depende de ese supuesto; el **orden** no, porque
la cuña es la misma para todos salvo España. (iii) Alemania no publica
volumen de los tramos pequeños, de modo que su gradiente mezcla media
simple y media ponderada; se etiqueta en la fila. (iv) El tramo de más de
1 M€ no es solo gran empresa, pero es el proxy más cercano que publica el
MIR.

**Salidas:** lámina 17 «¿Se paga el riesgo? Entre mercados, no»; salvedad
añadida al pie de la lámina 16; conclusión 5 ampliada; tercera
recomendación de riesgo («Riesgo: cobrar — el gradiente por tamaño»);
bloque `apetito` en `pres/datos.json`.

### 2.49 Corrección: faltaba el tramo 0,25–1 M€ en la lámina de precio

Detectado por el usuario. La lámina «Precio por tramo de importe» mostraba
solo dos series, ≤0,25 M€ y >1 M€, dejando fuera el tramo intermedio
0,25–1 M€ pese a estar disponible en `D.tramos` y usarse en la lámina de
comisiones de España. Era una omisión, no una decisión: no había ninguna
nota que la justificara.

Corregido a las **tres series que publica el MIR sin solapamiento**. El
«hasta 1 M€» que se usa en el resto del deck es la suma ponderada de los
dos primeros y por eso no se grafica aquí (ver §2.7 sobre el solapamiento
de los códigos `AMOUNT_CAT`).

**Dos defectos adicionales encontrados al corregirlo:**

1. **El eje estaba cortando una barra.** `valAxisMaxVal` era 5,5 y el tramo
   ≤0,25 M€ de Irlanda vale 5,64 %. La barra más alta del gráfico se
   truncaba. Subido a 6,0.
2. **El pie decía «ponderada por volumen» sin excepción.** El Bundesbank no
   publica volumen de los dos tramos pequeños, así que en Alemania esos dos
   valores son media simple. Ya estaba etiquetado en el CSV y en §2.48,
   pero no en esta lámina. Añadido al pie.

El tramo intermedio es además el que hace visible el gradiente por tamaño
que sostiene la lámina 17: el escalón ≤0,25 M€ frente a 0,25–1 M€ va de
+5 pb en España a +109 pb en Italia.

### 2.50 El coste de los recursos no es el del sistema, y un error de método

Pregunta del usuario: el coste de los recursos de la lámina de liquidez,
¿se puede comparar con el coste de los recursos del sistema bancario, o es
el mismo número?

**No es el mismo.** El modelo usa el coste de los depósitos de **sociedades
no financieras** (BSI sector 2240), que es el pasivo que aporta el propio
cliente PYME. El coste de los recursos del sistema es otra cosa.
`scripts/coste_recursos_sistema.py` calcula las tres piezas que sí son
comparables con dato público, con el mismo método para todas:

| País | Empresa | Hogares | Sistema | Dif. pb | % empresa |
|---|---|---|---|---|---|
| España | 0,76 | 0,40 | 0,49 | **+27** | 25,4 |
| Alemania | 1,09 | 0,88 | 0,93 | +17 | 22,2 |
| Francia | 1,21 | 1,18 | 1,19 | +2 | 31,3 |
| Italia | 0,74 | 0,60 | 0,64 | +10 | 25,1 |
| Portugal | 0,74 | 0,83 | 0,80 | −7 | 27,1 |
| P. Bajos | 1,04 | 1,24 | 1,18 | **−14** | 30,3 |
| Irlanda | 0,37 | 0,36 | 0,36 | +1 | 33,5 |

Tres conclusiones:

1. **El signo cambia según el país.** En España el depósito de empresa es
   27 pb **más caro** que el depósito minorista total; en Países Bajos es
   14 pb **más barato**. No hay una regla general.
2. **El depósito de empresa es solo entre el 22 % y el 34 %** del depósito
   minorista. Usarlo como coste de fondos del negocio PYME es coherente con
   el modelo —el negocio se financia con el pasivo que trae su cliente—
   pero no es trasladable al banco entero.
3. **Ni siquiera «sistema» es el coste de financiación del sistema.** No
   incluye deuda emitida (senior, cédulas), repos, financiación del banco
   central, depósitos interbancarios ni capital. Los depósitos son la mayor
   parte del pasivo de estos siete sistemas, pero no todo.

Nota sobre hogares: solo el sector 2250 tiene el instrumento L23
(disponible con preaviso), que en Alemania y Países Bajos pesa mucho. Las
empresas no tienen esa figura en la estadística del BCE, así que su coste
se compone solo de vista (L21) y plazo (L22).

**Error de método encontrado al hacer la comparación.** El tipo de depósito
a plazo se calculaba como **media simple de todas las variantes de
vencimiento** que publica el MIR (hasta 1 año, más de 1, más de 2, hasta
2...). Esas variantes **se solapan entre sí**, exactamente el mismo problema
que ya estaba documentado en §2.7 para los tramos de importe del activo.
Promediarlas sobrepondera los plazos largos. Diferencia contra la serie de
vencimiento total (`MATURITY = A`), que es la correcta:

```
FR +31 pb · DE +22 · IT +22 · IE +21 · NL +13 · ES -6 · PT -6
```

Corregido en `scripts/coste_recursos.py` y en el bloque de depósito de
`scripts/modelo_roe.py`, que leía del mismo volcado en bruto.

**Impacto en el modelo.** El coste de los recursos y el ROE se mueven poco
y ninguna conclusión cambia:

| País | Fondos antes | Fondos ahora | ROE antes | ROE ahora |
|---|---|---|---|---|
| España | 0,75 | 0,76 | 12,50 | 12,44 |
| Alemania | 1,16 | 1,09 | 16,88 | 17,21 |
| Francia | 1,34 | 1,21 | 4,97 | 5,44 |
| Italia | 0,76 | 0,74 | 15,18 | 15,31 |
| Portugal | 0,71 | 0,74 | 13,98 | 13,88 |
| P. Bajos | 1,06 | 1,04 | 20,20 | 20,32 |
| Irlanda | 0,41 | 0,37 | 13,82 | 13,93 |

El único cambio de orden es entre el cuarto y el quinto puesto: **Irlanda
pasa por delante de Portugal** por 5 pb de ROE, que es ruido. Las
correlaciones de §2.48 se mueven también: el margen neto de riesgo contra
la PD pasa de ρ = −0,88 a **−0,76**, y el gradiente contra el ROE de +0,86
a **+0,82**. El sentido de ambas se mantiene.

**Corrección de arrastre detectada al revisar.** La conclusión 1 decía que
Irlanda «queda sexta entre los bancos locales». Era falso ya antes de este
cambio: con los datos anteriores era quinta, y ahora es cuarta. Corregido.

**Deuda técnica saldada: `pres/datos.json` deja de mantenerse a mano.**
Los bloques que derivan de los CSV (`pl`, `sens`, `ent`, `rec`, `sistema`,
`apetito`, `marco`) los reconstruye ahora `scripts/datos_presentacion.py`.
Era la causa del error de §2.39 y de que tres láminas llevasen cifras
obsoletas escritas en el propio texto. Las cifras de esos textos pasan
también a leerse de `D` mediante plantillas. El bloque muerto `dep`, que
estaba a cero y no se usaba, se elimina.

**Salidas:** `scripts/coste_recursos_sistema.py`,
`liquidez/coste_recursos_sistema.csv`, `scripts/datos_presentacion.py`,
franja comparativa al pie de la lámina 10 y su título y pie reescritos para
decir explícitamente qué mide y qué no.

### 2.51 Circulante: precio frente al préstamo y ROE

Petición del usuario: comparar el precio del circulante con el del préstamo
PYME y estimar un ROE del circulante, teniendo en cuenta que se cobra por el
dispuesto y por el disponible. Extractor en
`scripts/modelo_roe_circulante.py`, salida en
`circulante/modelo_roe_circulante.csv`.

**Advertencia de perímetro, la principal.** La serie A2Z1 del MIR **no
tiene tramo de importe**: se comprobó contra la API y solo existe
`AMOUNT_CAT = A`. El circulante mezcla, por tanto, PYME y gran empresa,
mientras que el préstamo PYME del modelo es el tramo ≤1 M€. Por eso la
lámina compara contra los dos: el tramo PYME y el **total de sociedades no
financieras**, que es el único perímetro homólogo.

| País | Circulante | Préstamo ≤1 M€ | Préstamo total | vs PYME | vs total |
|---|---|---|---|---|---|
| España | 3,58 | 3,41 | 3,42 | +17 | +16 |
| Alemania | 4,95 | 4,39 | 3,57 | +56 | **+138** |
| Francia | 3,39 | 3,77 | 3,57 | −38 | −18 |
| Italia | 4,11 | 4,25 | 3,57 | −14 | +54 |
| Portugal | 4,41 | 3,94 | 3,82 | +47 | +58 |
| P. Bajos | 2,46 | 4,50 | 3,47 | **−204** | −100 |
| Irlanda | 4,92 | 5,37 | 5,01 | −45 | −9 |

No hay una regla: a perímetro homólogo el circulante es más caro en cuatro
países y más barato en tres. Y el perímetro importa mucho donde el tramo
PYME pesa poco: en Países Bajos el salto es de −204 pb contra el tramo
≤1 M€ pero de −100 pb contra el total, porque allí ese tramo es solo el
7,6 % de la nueva producción.

**Dato nuevo: volumen de circulante para España.** El deck decía que no
existe volumen por país. Es cierto en el BCE, pero el Boletín del Banco de
España sí lo publica (cuadro 19.13, serie 1): **57.933 M€** de saldo medio
2026, con un TEDR del **3,58 %**, idéntico al que da el MIR. Sirve de
validación cruzada del precio y es el único ancla de volumen por país.
Añadido en `circulante/bde_circulante.csv`. Corregida también la lámina, que
además decía «nueva producción»: en revolving y descubiertos el MIR mide el
tipo del **saldo vivo**, porque no existe el concepto de nueva operación.

**Modelo del ROE.** Todo por euro **dispuesto**, para que sea comparable con
el préstamo. Con `u` = tasa de disposición, el disponible por euro dispuesto
es `(1−u)/u`:

```
ingreso = tipo + f_disp * (1-u)/u
EAD     = 1 + CCF * (1-u)/u
margen  = ingreso - coste de los recursos     (solo se fondea lo dispuesto)
CoR     = coste del riesgo PYME * EAD
BAI     = margen - CoR - margen * eficiencia
capital = densidad de RWA * CET1 * EAD
```

El coste del riesgo se aplica sobre la EAD y no solo sobre el dispuesto,
que es como trata la NIIF 9 la pérdida esperada de un compromiso.

**Dos huecos duros.** Ni la **comisión de disponibilidad** ni la **tasa de
disposición** las publica ninguna estadística. Se buscó: el cuadro 19.6 del
Banco de España da TAE de préstamo por tramo pero **no de descubiertos y
líneas de crédito**; el catálogo completo de series del Boletín (10 MB, 
descargado y rastreado) no tiene ninguna serie de riesgo disponible, límite
ni compromisos; y el único dato fuera de balance del Transparency Exercise
del EBA (ítem 2520606) es del banco entero y sin desglose por sector —da una
cota de orden de magnitud, del 27,8 % de los préstamos en Países Bajos al
60,7 % en Italia, pero no una tasa de disposición de PYME. Por eso el caso
base **no es una estimación, es un punto de una rejilla** que se publica
entera.

**El CCF sí es un parámetro, no un hueco.** El CRR3, en vigor desde 2025,
subió del 0 % al **10 %** el factor de conversión de los compromisos
cancelables incondicionalmente, que es la figura típica de la póliza de
crédito a PYME. El disponible consume capital por primera vez. Con
compromiso no cancelable (40 %) el ROE cae entre 1,3 y 3,1 puntos.

**Resultado, caso base (disposición 60 %, comisión 0,30 %, CCF 10 %):**

| País | ROE circulante | ROE préstamo | Circulante con la misma cuña de 87 pb |
|---|---|---|---|
| España | 9,0 | 12,4 | **13,0** |
| Alemania | 15,3 | 17,2 | **19,5** |
| Francia | 0,9 | 5,4 | 4,0 |
| Italia | 9,8 | 15,3 | 14,1 |
| Portugal | 12,0 | 13,9 | **15,4** |
| P. Bajos | 4,4 | 20,3 | 9,0 |
| Irlanda | 9,9 | 13,9 | 12,2 |

La tercera columna es la comparación que hay que mirar: el modelo del
préstamo aplica 87 pb de comisiones sobre el saldo y el del circulante no
aplica ninguna sobre el dispuesto, así que comparar las dos primeras mezcla
el efecto estructural con el del supuesto. **A igual carga de comisiones, el
circulante gana al préstamo en España, Alemania y Portugal**, y pierde en
los otros cuatro. Países Bajos pierde por precio, no por estructura: su
circulante está a 2,46 %.

**Resultado analítico: la comisión de disponibilidad neutral.** Imponiendo
que el ROE no dependa de la tasa de disposición —es decir, que el BAI sea
proporcional a la EAD— sale una expresión cerrada:

```
f_neutral = CCF x (tipo - coste de los recursos)
```

el CCF por el margen del dispuesto. Comprobado numéricamente: con esa
comisión el ROE no se mueve nada entre una disposición del 40 % y una del
100 %. Va del **0,14 %** en Países Bajos al **0,46 %** en Irlanda; España,
0,28 %. Por debajo de ella, una línea poco dispuesta destruye ROE; por
encima, lo crea. Es la lectura más accionable del bloque, porque no depende
de ninguno de los dos huecos: solo del precio y del coste de los recursos,
que sí son observados.

**Salidas:** dos láminas nuevas, «Préstamo frente a circulante: el precio» y
«ROE del circulante»; tres filas nuevas en la lámina de supuestos; la de
fiabilidad pasa el volumen de circulante de «NO EXISTE» a «SOLO ESPAÑA»;
bloque `circ` en `pres/datos.json`, reconstruido por
`scripts/datos_presentacion.py`.

### 2.52 Reestructuración de la presentación: narrativa y anexos

El usuario devolvió la versión 8 reordenada, y se reproduce esa estructura.
`pres/gen.js` pasa de ser una secuencia de bloques a un diccionario de
funciones `L` más un array `ORDEN`, de modo que reordenar sea cambiar una
lista y no mover cientos de líneas. El generador falla si una lámina de `L`
no está en `ORDEN` o al revés, para que no se pierda ninguna en un futuro
reorden.

Orden nuevo: 21 láminas de narrativa, separador **Anexos**, separador
**Datos** (fuentes, mapa de fiabilidad, límites, supuestos), separador
**Información relevante** (NPL, spread PD/LGD, palanca del riesgo, hipoteca,
factoring). Los separadores son solo el título en naranja, sin subtítulo.

Cambio de título pedido: «Precio por tramo de importe» pasa a «Precio de
Préstamos a Pymes por tramo de importe».

Se reaplican encima las correcciones de §2.50, que la versión 8 no llevaba:
coste de los recursos por vencimiento total, ROE actualizados, franja
comparativa empresa frente a sistema y la conclusión 1 corregida.

### 2.53 Corrección: el circulante era total de empresas, no PYME

Pregunta del usuario sobre §2.51. Respuesta corta: **total de empresas**. La
advertencia de perímetro estaba en la lámina y en la nota, pero el modelo
del ROE la contradecía sin decirlo: usaba un **precio del total de
sociedades no financieras** con un **coste del riesgo y una densidad de RWA
de la cartera PYME**. Era un híbrido incoherente, y el sesgo iba en la
dirección de castigar al circulante.

**Qué entraba de cada perímetro, antes de corregir:**

| Entrada | Perímetro | Fuente |
|---|---|---|
| Tipo del circulante | **Todas las empresas** | MIR A2Z1, sector 2240, sin tramo |
| Coste de los recursos | Todas las empresas | Depósitos sector 2240 |
| Coste del riesgo | **PYME** | COREP C 9.02, «Corporates – Of Which: SME» |
| Densidad de RWA | **PYME** | Transparency Exercise, cartera PYME |
| Eficiencia, CET1, fiscalidad | Grupo / sector bancario | EBA Risk Dashboard |

**Corrección aplicada.** El caso base pasa a ser coherente de perímetro:
riesgo y capital del **total de empresas**, igual que el precio.

- Coste del riesgo: PD × LGD de la clase IRB **«Empresas, total»**, que ya
  estaba extraída pero no se usaba (España: PD 0,94 % × LGD 38,57 % =
  **0,36 %**, frente al 0,59 % de PYME).
- Densidad de RWA: clase de exposición **`Corporates` (código 303)** del
  Transparency Exercise. Extractor nuevo, `scripts/eba_te_corporates.py`,
  salida en `transversal/eba_te_capital_empresas.csv`.

| País | Densidad empresas | Densidad PYME del modelo | Peso PYME |
|---|---|---|---|
| España | 63,9 % | 59,5 % | 17,2 % |
| Alemania | 44,8 % | 35,3 % | 18,4 % |
| Francia | 52,6 % | 43,0 % | 17,5 % |
| Italia | 51,5 % | 46,3 % | 21,1 % |
| Portugal | 72,9 % | 61,3 % | 38,0 % |
| P. Bajos | 37,3 % | 37,2 % | 20,4 % |
| Irlanda | 85,2 % | 70,0 % | 7,7 % |

La densidad de empresas es **mayor** que la de la cartera PYME en los siete
países. No es una paradoja: la «cartera PYME» del modelo del préstamo agrega
tres clases de exposición —Corporates-SME, Retail-SME y Secured by mortgages
- SME— y las dos últimas tienen densidades bajas por el tratamiento minorista
y por la garantía real. Se deja anotado en el CSV para que no se confunda
`Densidad de RWA de Corporates - SME` con `Densidad de RWA de la cartera
PYME`: son cosas distintas y difieren mucho (España, 71,8 % frente a 59,5 %).

**Efecto de la corrección en el ROE del circulante:**

| País | Antes (híbrido) | Ahora (empresas) | Dif. |
|---|---|---|---|
| España | 9,0 | **10,2** | +1,2 |
| Alemania | 15,3 | **12,6** | −2,7 |
| Francia | 0,9 | **3,6** | +2,6 |
| Italia | 9,8 | **12,8** | +3,0 |
| Portugal | 12,0 | **11,7** | −0,3 |
| P. Bajos | 4,4 | **5,1** | +0,7 |
| Irlanda | 9,9 | **9,3** | −0,6 |

Hasta 3 puntos, y cambia el orden: Italia pasa de quinta a primera entre las
siete. El caso con parámetros de PYME se conserva en el CSV, etiquetado como
incoherente de perímetro, para poder acotar el sesgo.

**Lo que esto obliga a decir en la lámina.** La comparación entre el ROE del
circulante y el del préstamo PYME **no es entre dos productos del mismo
negocio**: es circulante a todas las empresas frente a préstamo a PYME. Dos
diferencias a la vez, perímetro y producto, más el supuesto de comisiones.
Añadido como caja propia en la lámina, como fila nueva en la de supuestos y
en el subtítulo del mapa de fiabilidad.

**Lo que no se puede arreglar.** No existe un ROE del circulante de PYME con
fuentes públicas, porque no existe el precio: el MIR solo publica A2Z1 en
categoría total y se comprobó contra la API (`AMOUNT_CAT` solo admite `A`).
Cualquier cifra de circulante PYME exigiría dato interno.

### 2.54 ROE PYME de los cinco grandes bancos españoles

Petición del usuario: construir el ROE de PYME de BBVA, CaixaBank,
Santander, Sabadell y Bankinter, con datos de 2026 o cierre de 2025.

**Lo primero, qué NO existe.** Ningún banco español publica una cuenta de
resultados de PYME con capital asignado. Ya estaba comprobado en el bloque
de comparables: la NIIF 8 obliga a reportar por los segmentos que usa la
dirección y ninguno usa «PYME». Así que un ROE PYME **observado** no se
puede construir, ni para 2025 ni para 2026.

**Lo que sí existe, y resulta ser bastante.** El EU-wide Transparency
Exercise del EBA publica por **entidad** y con desglose por **país de la
contraparte**. Filtrando `Country = 28` se aísla la cartera PYME
**española** de cada banco, que es justo lo que interesa: el agregado de
grupo de Santander y BBVA está dominado por México, Brasil, Reino Unido y
Turquía y no dice nada de su negocio PYME en España. Extractor en
`scripts/eba_te_bancos_es.py`. Se descargó además `tr_oth.csv` del mismo
ejercicio, que da capital y cuenta de resultados por entidad.

| Banco | Cartera PYME España, M€ | Densidad RWA | CET1 | Eficiencia | Mora PYME |
|---|---|---|---|---|---|
| Bankinter | 14.553 | 53,3 % | 12,57 % | 33,7 % | 2,34 % |
| Sabadell | 22.324 | **37,3 %** | 13,06 % | 41,0 % | 5,91 % |
| CaixaBank | 48.736 | 49,2 % | 12,25 % | 40,5 % | 5,30 % |
| BBVA | 24.410 | **71,0 %** | 13,34 % | 34,3 % | 3,98 % |
| Santander | 32.325 | 62,7 % | 12,98 % | 37,0 % | **7,80 %** |

**Qué es propio de cada banco y qué es común.** Esto define lo que el
ejercicio puede y no puede decir:

- *Propio*: densidad de RWA de su cartera PYME española, mora de esa misma
  cartera, CET1 y eficiencia.
- *Común a los cinco*: precio (MIR de España, tramo ≤1 M€), cuña de
  comisiones (87 pb del Boletín), coste de los recursos y tipo impositivo
  (30 %, art. 29 LIS). **Ningún banco publica esas magnitudes por segmento.**

Por tanto **esto no compara la habilidad comercial de cada banco, que no es
observable: compara su estructura de riesgo, capital y coste.** Los cinco
ingresan el mismo 4,28 %.

**Resultado (junio 2025):**

| Banco | ROE PYME | CoR | Capital asignado | ROE sin escalar el riesgo |
|---|---|---|---|---|
| Bankinter | **21,7 %** | 0,26 % | 6,71 % | 18,2 % |
| Sabadell | **20,5 %** | 0,65 % | 4,88 % | 21,3 % |
| CaixaBank | 17,6 % | 0,58 % | 6,02 % | 17,5 % |
| BBVA | 13,9 % | 0,43 % | 9,47 % | 12,7 % |
| Santander | 11,8 % | 0,85 % | 8,14 % | 14,0 % |

**El contraste que más enseña: Sabadell frente a BBVA.** Sabadell tiene la
**peor eficiencia** de los cinco (41,0 %) y aun así queda segundo, por una
densidad de RWA del 37,3 %, la más baja. BBVA tiene la **segunda mejor
eficiencia** (34,3 %) y queda cuarto, por una densidad del 71,0 %, la más
alta. Es la misma conclusión que en el análisis por países —el capital manda
sobre lo demás— pero ahora dentro de un mismo mercado, con el mismo precio y
la misma fiscalidad, lo que la hace más limpia: aquí no hay diferencias de
mercado que la expliquen.

**Descomposición de palancas contra el mejor (puntos de ROE):**

```
              riesgo   capital   gastos
Sabadell        +5,6      -5,6     +3,7
CaixaBank       +3,8      -1,8     +2,8
BBVA            +1,3      +5,7     +0,2
Santander       +5,1      +2,5     +1,0
```

**Supuestos y límites, todos en la lámina:**

1. El coste del riesgo se escala: se parte del PD × LGD de PYME de España
   (0,59 %) y se ajusta por la mora relativa de cada banco frente al
   agregado de los cinco (5,43 %). Es un supuesto; se publica también el
   caso sin escalar, que cambia el orden entre Bankinter y Sabadell.
2. La mora es un ratio de **stock** (exposición en default sobre exposición
   original), no una PD de flujo.
3. **CET1 y eficiencia son de grupo consolidado**, porque el Transparency
   Exercise no los desglosa por país. Para CaixaBank, Sabadell y Bankinter
   el grupo es casi el negocio doméstico; para Santander y BBVA no. Ahora
   bien, el sesgo está acotado: igualar la eficiencia de Santander y BBVA a
   la del mejor solo movería su ROE **1,0 y 0,2 puntos**, así que no altera
   el orden. Las dos palancas que sí mandan —riesgo y capital— son de
   contraparte española.
4. **La fecha es junio de 2025**, no cierre de 2025 ni 2026. Es el dato
   armonizado más reciente del ejercicio de transparencia de 2025. Se
   intentó completar CET1 y eficiencia a diciembre de 2025 desde las
   presentaciones de resultados de Santander y BBVA y las dos descargas
   fallaron (404 y respuesta vacía), igual que había pasado con ING, Société
   Générale y BNP Paribas. Queda como pendiente de aportación manual, como
   los otros tres.

**Salidas:** dos láminas tras la de comparables, «ROE PYME de la banca
española, banco a banco» y «Cuenta de resultados del préstamo PYME, banco a
banco» —esta última con el mismo formato que la de países, a petición del
usuario, con una columna «Ámbito» que marca fila a fila si la magnitud es
común a los cinco o propia de cada banco: de once filas, seis son comunes
por construcción y solo cinco discriminan—; `scripts/eba_te_bancos_es.py`,
`scripts/modelo_roe_bancos_es.py`,
`comparables_bancos/eba_te_bancos_es.csv`,
`comparables_bancos/modelo_roe_bancos_es.csv`; bloque `bancos` en
`pres/datos.json`.

### 2.55 Datos de PYME por banco: qué existe y qué no, tras rastrearlo

El usuario rechazó §2.54 con razón: precio, comisiones y coste del riesgo
tenían que ser de PYME, no comunes ni escalados. Se rastrearon las fuentes
una por una. Este es el resultado, incluidos los fracasos.

**Fuentes comprobadas para PD/LGD de PYME por banco:**

| Fuente | Resultado |
|---|---|
| Transparency Exercise, `tr_cre.csv` | **No tiene PD ni LGD.** Se recorrieron los 89 ítems del fichero buscando `PD`, `LGD`, `probability`, `loss given` y `expected loss`: ninguno |
| EBA Pillar 3 Data Hub | **Inaccesible.** `pillar3.eba.europa.eu` y `pillar3datahub.eba.europa.eu` los rechaza el proxy de salida por política; la página del EBA sí carga pero solo enlaza guías de uso |
| Pilar 3 de cada banco (plantilla EU CR6, que sí trae PD y LGD por clase de exposición) | **Bloqueado.** Bankinter y Sabadell devuelven 403 incluso con user-agent de navegador; CaixaBank 404 |
| Chromium para saltar el anti-bot | **Fallido.** El navegador no confía en la CA del proxy («Privacy error») y no hay `certutil` ni paquete instalable para importarla al almacén NSS |
| CNMV | Accesible, pero su registro no publica el Informe con Relevancia Prudencial de forma localizable sin navegación interactiva |

**Lo que sí se encontró y no se estaba usando: las provisiones de PYME.**
La partida **2520553** del Transparency Exercise da las correcciones de
valor y provisiones de la cartera PYME, y con `Country = 28` sale la de la
cartera **española** de cada banco. Con ella y con la exposición en default
se obtiene la **cobertura de PYME**, que es una magnitud de PYME, del banco
y española.

**Cómo queda ahora el coste del riesgo.** Ya no es un escalado de un solo
factor. Se construyen PD y LGD por separado, cada una anclada en el
parámetro IRB de PYME de España (observado) y dispersada por una magnitud
de PYME del propio banco (observada):

```
PD_banco  = PD PYME de Espana  x (mora PYME del banco / mora media)
LGD_banco = LGD PYME de Espana x (cobertura del banco / cobertura media)
CoR       = PD_banco x LGD_banco
```

| Banco | Mora PYME | Cobertura | PD | LGD | CoR |
|---|---|---|---|---|---|
| Bankinter | 2,34 % | 74,1 % | 0,74 % | 46,9 % | 0,35 % |
| Sabadell | 5,91 % | 56,1 % | 1,88 % | 35,5 % | 0,67 % |
| CaixaBank | 5,30 % | 53,6 % | 1,68 % | 34,0 % | 0,57 % |
| BBVA | 3,98 % | 65,6 % | 1,27 % | 41,5 % | 0,53 % |
| Santander | 7,80 % | 36,5 % | 2,48 % | 23,1 % | 0,57 % |

**Hallazgo:** los dos efectos se compensan. **Santander tiene la peor mora
de los cinco (7,80 %) y la menor cobertura (36,5 %)**, de modo que su coste
del riesgo acaba en la media. La lectura económica es que provisiona menos
porque espera recuperar más —cartera más garantizada—; la lectura
alternativa es que está infraprovisionado. Con dato público no se pueden
separar y se anota como tal.

**Dos salvedades del método.** (i) La cobertura incluye provisiones de las
fases 1 y 2, no solo del default, así que **sobreestima el nivel** de LGD;
el sesgo es el mismo para los cinco, de modo que sirve para comparar entre
bancos y no como nivel absoluto. (ii) No es la PD/LGD interna de cada banco:
eso solo está en su Pilar 3.

**El precio de PYME por banco NO EXISTE en fuente pública.** Ni el MIR (es
agregado por país), ni el Boletín del Banco de España (agregado), ni el
Transparency Exercise (su única partida de ingresos, 2520303, es de
préstamos totales). AnaCredit lo tendría, pero no es público. Y **no vale
usar el rendimiento medio de la inversión crediticia** de cada banco como
sustituto: mezcla hipoteca, consumo y empresa en proporciones muy distintas
entre bancos, así que introduciría sesgo en vez de información.

**Lo que sí se puede hacer sin ese dato: darle la vuelta a la pregunta.**
Con su propio riesgo, capital, gastos y coste de los recursos, ¿qué precio
necesitaría cada banco para un ROE dado? Ese número **no depende del precio
no observable** y mide capacidad competitiva:

| Banco | Precio para un ROE del 15 % | ROE al precio común |
|---|---|---|
| Bankinter | **2,58 %** | 20,7 % |
| Sabadell | 2,79 % | 20,2 % |
| CaixaBank | 3,02 % | 17,7 % |
| Santander | 3,57 % | 14,2 % |
| BBVA | **3,77 %** | 13,2 % |

**Bankinter puede vender 119 pb más barato que BBVA y ganar lo mismo.** Es
la conclusión más accionable del bloque y la única que no arrastra el hueco
del precio.

**Comisiones de PYME por banco:** tampoco existen. Solo el Boletín del Banco
de España publica una cuña de comisiones de empresa, y es agregada del
sistema (§2.23).

**Pendiente, si se aporta el dato manualmente:** los Informes con Relevancia
Prudencial de los cinco bancos (plantilla EU CR6) cerrarían PD y LGD de PYME
reales por banco. Se suma a la lista de ING, Société Générale, BNP Paribas e
Intesa.

**Salidas:** `scripts/eba_te_bancos_es.py` amplía la extracción con
provisiones y cobertura; `scripts/modelo_roe_bancos_es.py` construye PD y
LGD por banco y el precio de equilibrio; las dos láminas de bancos pasan a
marcar en azul lo que es de la cartera PYME española y la de cuenta de
resultados añade la fila del precio necesario.

### 2.56 El precio del activo de PYME por banco: por qué no existe

Segunda pasada sobre la pregunta, esta vez buscando específicamente el
PRECIO. El resultado deja de ser «no lo he encontrado» y pasa a ser una
razón normativa concreta.

**El Banco de España sí publica tipos y comisiones POR ENTIDAD.** Existe una
consulta comparativa entre entidades, con descarga en Excel, alimentada por
la declaración trimestral que hacen los bancos. Parecía la fuente buena.

**Pero su base legal la deja fuera de PYME.** Esa publicación se apoya en la
**Circular 5/2012**, cuya norma segunda acota el ámbito a los «servicios
bancarios dirigidos o prestados en España por las entidades de crédito
españolas y las sucursales en España de entidades de crédito extranjeras
[...] a los clientes, o clientes potenciales, **personas físicas**». La
propia circular prevé además que, cuando el cliente actúa en su actividad
profesional o empresarial, las partes puedan pactar no aplicar la normativa.
Es decir: **el dato por entidad existe, pero por norma solo cubre a personas
físicas**.

**Y la circular que sí cubre a empresas publica solo agregado.** La
**Circular 1/2010** obliga a declarar los tipos de depósitos y créditos de
hogares y sociedades no financieras, pero «a efectos estadísticos», y su
salida son los cuadros **19.3 a 19.17** del Boletín Estadístico, que son del
**sistema**, no por entidad. Es exactamente la fuente que ya usa el modelo
para el precio de España.

Las dos piezas no se cruzan: **lo que hay por entidad no cubre empresas, y
lo que cubre empresas no está por entidad.**

**Resto de vías, todas cerradas:**

| Vía | Resultado |
|---|---|
| Transparency Exercise del EBA | Su única partida de ingresos (2520303) es de préstamos totales, sin desglose por sector |
| Pillar 3 Data Hub del EBA | Rechazado por el proxy de salida; además el Pilar 3 no incluye precios, solo parámetros de riesgo |
| Webs de los bancos | 403 y 404 (§2.55) |
| CNMV, portal de datos abiertos | 403 |
| AnaCredit | Tiene el dato operación a operación, pero **no es público**: acceso restringido a bancos centrales y supervisores |

**Lo que NO vale como sustituto, y por qué.** (i) Los tipos de los
escaparates comerciales («ejemplo representativo» de un préstamo online) son
precios de oferta de un producto estandarizado, no la media ponderada de lo
realmente formalizado, y no representan la cartera. (ii) El rendimiento
medio de la inversión crediticia de cada banco mezcla hipoteca, consumo y
empresa en proporciones muy distintas entre entidades: metería sesgo, no
información.

**Conclusión operativa.** El precio de PYME por banco solo es obtenible con
dato interno o comercial de pago. Mientras tanto, la vuelta a la pregunta de
§2.55 —qué precio necesita cada banco para un ROE dado— sigue siendo la
única lectura competitiva que no depende de ese hueco.

### 2.57 Los autónomos: la PYME que la estadística guarda en hogares

El usuario preguntó si los precios por entidad del Banco de España, aunque
sean de personas físicas, podrían corresponder a PYME de autónomos. La
intuición apuntaba a un hueco real del análisis, aunque no por esa vía.

**Sobre la tabla por entidad: no sirve, y por su contenido, no solo por su
ámbito.** La publicación por banco de la Circular 5/2012 cubre las
comisiones de los servicios bancarios más frecuentes y los tipos de
**descubiertos en cuenta y excedidos en cuenta de crédito**. No son precios
de préstamo: son tarifas de servicio y tipos de penalización. Aunque su
ámbito incluyera a empresas, no habría precio de activo que contrastar. La
consulta además es una aplicación JavaScript sin endpoint de datos
localizable sin navegador, y el navegador no atraviesa el proxy TLS (§2.55).

**Pero la pregunta de fondo sí tenía razón, y destapó una serie que faltaba.**
En el SEC 2010 el **empresario individual es sector HOGARES (S.14)**, no
sociedad no financiera. Todo el crédito a autónomos queda por tanto **fuera
del dataset MIR de empresas**, que es la espina dorsal del deck. Y el
Boletín del Banco de España **sí lo aísla**: cuadro 19.4 serie 16 (tipo) y
cuadro 19.12 serie 16 (volumen). No se estaba usando.

**Precios, media 2026, ponderada por volumen:**

| Serie | TEDR | Volumen mensual |
|---|---|---|
| **Autónomo, otros fines** | **4,57 %** | 840 M€ |
| Autónomo, otros fines hasta 1 año | 3,84 % | sin volumen publicado |
| Hogares, otros fines (incluye autónomos) | 4,46 % | 1.638 M€ |
| Sociedad, ≤0,25 M€ | 3,42 % | 15.111 M€ |
| Sociedad, 0,25–1 M€ | 3,37 % | 4.635 M€ |
| Sociedad, >1 M€ | 3,45 % | 19.320 M€ |

**El autónomo paga 115 pb más que la sociedad del tramo más pequeño.** Y el
modelo usa el 3,41 % del tramo ≤1 M€: para el segmento micro **infravalora
el precio**. Todos los tipos son TEDR, sin comisiones, así que la
comparación es homogénea en ese sentido.

**Cuánto pesa.** 840 M€ al mes frente a 15.111 M€ del tramo ≤0,25 M€: en
torno al 5 % del conjunto. No mueve el agregado, pero sí la lectura del
segmento micro, y explica parte de por qué el precio español del tramo
pequeño parece bajo comparado con Alemania o Italia: **en España una parte
del negocio micro está contabilizada en hogares y no se ve en la serie de
empresas.** Queda como hipótesis: no se ha comprobado si los otros seis
países tienen la misma composición, porque el MIR del BCE no publica el
desglose de empresarios individuales.

**Lo que sigue sin existir.** El Boletín no publica TAE de autónomos, así
que no hay cuña de comisiones propia del segmento. La más cercana es la de
hogares para otros fines, **59 pb** (TAE 5,05 % contra TEDR 4,46 %), pero es
de todos los hogares y no solo de empresarios individuales, de modo que no
se usa en el modelo. Y nada de esto está por entidad.

**Salidas:** `prestamos_personales/bde_autonomos.csv` y la extracción
correspondiente en `scripts/bde_boletin.py`; lámina «El autónomo paga
115 pb más que la sociedad pequeña» tras la de comisiones de España; bloque
`autonomos` en `pres/datos.json`.

### 2.58 Reestructuración en dos bloques y bloque España

Estructura acordada con el usuario: **Bloque 1, el mercado europeo**, tal
como estaba; **Bloque 2, España**, con parte descriptiva y parte
competitiva; y anexos. Cada bloque abre con un separador con subtítulo.
`pres/gen.js` ya era un diccionario de láminas más un array `ORDEN`
(§2.52), así que reordenar fue cambiar la lista. Se añade `RETIRADAS` para
poder jubilar una lámina sin que salte el control de integridad.

La lámina del autónomo (§2.57) pasa al bloque España, como pidió el usuario.
La lámina europea de factoring se retira: su contenido lo absorbe la nueva
lámina española, que además lleva el reparto factoring/confirming.

Orden del bloque España: primero la pyme (demanda y capacidad de pago),
luego el precio (comisiones y autónomos), luego los productos (circulante y
factoring), y solo al final los bancos (mercado, riesgo, ROE y cuenta de
resultados).

**Seis láminas nuevas, con dos fuentes que no estaban en el encargo.**

**1. Qué pide la pyme española y qué le duele.** CESGAR, XV Informe, datos
de 2025. Descarga libre. En 2025 el **51,2 %** de las pymes tuvo necesidad
de financiación; el **70,9 %** acudió al banco, bajando desde el 76,5 % de
2024; el **92,8 %** obtuvo y aceptó la financiación, y solo al **3,2 %** no
se le concedió. El destino es lo más relevante para este deck: el **73,0 %**
lo quiere para **circulante**, frente al 64,6 % de 2024. Y entre las que ven
obstáculos, el primero es **el precio (21,6 %)**, muy por delante de la
falta de comprensión del negocio por la entidad (10,5 %). Lectura: el
crédito se concede, el problema no es el acceso sino a cuánto. Extractor en
`scripts/cesgar_demanda.py`; las cifras se transcriben a mano porque el PDF
está maquetado, y cada fila cita su gráfico. Son porcentajes de encuesta y
así se etiquetan, con la unidad `pct_neto_encuesta`, para que no se mezclen
con niveles de tipo (regla del encargo).

**2. Cuánto puede pagar una pyme: el techo del precio.** Banco de España,
**Central de Balances Integrada**, conjunto `cal_ucb_cbl002`, ratios por
tamaño según la Recomendación 2003/361/CE. Ejercicio 2024:

| Ratio | Pequeñas | Medianas | Grandes |
|---|---|---|---|
| R.1 Rentabilidad del activo neto | 5,4 % | 10,4 % | 6,8 % |
| R.2 Tipo efectivo pagado por su deuda | 3,3 % | 4,4 % | 4,2 % |
| **R.4 Colchón (R.1 − R.2)** | **+2,1 pp** | +6,1 pp | +2,6 pp |
| R.3 Rentabilidad de recursos propios | 6,0 % | 12,7 % | 8,5 % |
| R.5 Margen de explotación | 9,9 % | 9,7 % | 10,2 % |

Dos cosas. **(i) El techo de precio.** La empresa pequeña gana un 5,4 % con
su activo y paga un 3,3 % por su deuda: **2,1 puntos de colchón**. Si el
precio sube por encima, endeudarse deja de crear valor para el cliente y la
demanda se corta sola. La mediana tiene 6,1 puntos, casi el triple.
**(ii) Validación independiente del precio.** El 3,3 % que paga la pequeña
está muy cerca del 3,41 % del tramo ≤1 M€ del MIR que usa el modelo. No son
la misma magnitud —el MIR es nueva producción, R.2 es coste medio del saldo
vivo— pero que dos fuentes independientes den lo mismo es la mejor
validación que tiene el deck. Extractor en `scripts/cb_pymes.py`.

**Anomalía anotada:** la empresa pequeña paga **menos** que la mediana
(3,3 % frente a 4,4 %), al revés de lo que diría el riesgo. La Central de
Balances no lo explica. Hipótesis razonables: más peso de deuda antigua a
tipo fijo y más financiación ICO o avalada. Se deja como observación, no
como conclusión. El colchón de la pequeña ha pasado de −0,2 puntos en 2015 a
+2,1 en 2024.

**3. El circulante en España.** Junta lo que ya había —tipo 3,58 %, saldo
57.933 M€, validación cruzada BCE contra Boletín— con el dato de CESGAR de
que es el destino del 73 % de la demanda. Es el producto más pedido y el
peor medido: no existe ni comisión de disponibilidad ni tasa de disposición,
y el tipo del BCE no tiene tramo de importe.

**4. Factoring y confirming en España.** España mueve 269.885 M€, el 16,5 %
del PIB, segundo de los siete por intensidad. Pero **el 52,6 % español es
confirming frente al 1,9 % italiano**, así que los totales europeos no son
comparables. Y CESGAR lo sitúa por debajo del leasing y de las líneas ICO en
penetración entre pymes: el volumen lo mueven las grandes empresas y sus
cadenas de proveedores.

**5. El mercado y la cuota.** 142.348 M€ de cartera PYME española entre los
cinco. **CaixaBank tiene el 34,2 %**, más que Santander y BBVA juntos en
este segmento, pese a ser menor que ambos por balance total: el negocio PYME
español no se reparte como el balance. Se advierte que el perímetro son
estos cinco bancos, no el mercado español completo.

**6. Mora y cobertura, trimestre a trimestre.** Cuatro trimestres, de
sep-2024 a jun-2025. Tres lecturas: **Sabadell** baja su mora de 7,32 % a
5,91 % y sube cobertura, la mejora más clara; **Santander** baja cobertura
de 43,2 % a 36,5 % manteniendo la peor mora; y **Bankinter** salta a 74,1 %
de cobertura desde una banda de 51,9–56,1 %. Este último punto importa
porque el modelo de §2.55 usa ese trimestre: la LGD de Bankinter sale alta,
y con la media de los cuatro su ROE saldría algo mejor, no peor. Se dice en
la propia lámina. Extracción con `--serie` en
`scripts/eba_te_bancos_es.py`.

**Informes de consultoras: revisado, con resultado escaso.** Se rastrearon
McKinsey, Deloitte, KPMG, PwC y Oliver Wyman. Lo que publican en abierto
sobre banca europea es agregado y de segmento mayorista o de banca privada
(el Global Banking Annual Review de McKinsey, el CEO Outlook de KPMG), sin
dato de PYME por país ni por banco que aporte algo a este modelo. El
Observatorio de Digitalización Financiera FUNCAS-KPMG es temático de
digitalización. El Informe PYME 2025 del Consejo General de Economistas
devuelve 403 a la descarga automática. **No se ha buscado material de pago
en foros ni repositorios no oficiales**: ni por la licencia ni porque una
copia suelta no es citable, y el deck vive de que cada cifra sea trazable.
Conclusión: para este encargo **CESGAR y la Central de Balances valen más
que cualquier informe de consultora**, porque son dato primario y español.

**Salidas:** `scripts/cesgar_demanda.py`, `scripts/cb_pymes.py`, la opción
`--serie` de `scripts/eba_te_bancos_es.py`;
`transversal/cesgar_demanda.csv`, `transversal/cb_pymes.csv`,
`comparables_bancos/eba_te_bancos_es_serie.csv`; bloques `cesgar`, `cb` y
`bancos_serie` en `pres/datos.json`; dos fuentes nuevas en la lámina de
fuentes, que pasa de once a trece.

### 2.59 Cierre por bloques y lámina descriptiva europea

**Conclusiones y recomendaciones, ahora una de cada por bloque.** Cuatro
láminas de cierre en lugar de dos. Meter lo español en las europeas habría
obligado a recortar las dos, y el arco de decisión es distinto: el bloque
europeo responde a «dónde entrar» y el español a «qué hacer aquí».

Las conclusiones europeas cambian poco: se corrige la 1 —Irlanda queda
**cuarta** entre los bancos locales, no sexta— y la 2 incorpora que Francia
es además el mercado más grande y el único con brecha de financiación
positiva. Se separa en 5 lo de que prestar peor no viene pagado, que antes
iba pegado a la conclusión de riesgo.

Las seis conclusiones españolas son nuevas: el acceso no es el problema y el
precio sí (CESGAR), los 2,1 puntos de colchón como techo (Central de
Balances), la demanda concentrada en circulante, el capital por delante de
la eficiencia también dentro de un mismo mercado, la capacidad competitiva
medida en precio (119 pb entre Bankinter y BBVA) y el autónomo como segmento
escondido en hogares.

Las recomendaciones españolas son seis y todas accionables sin dato nuevo,
salvo la última, que es precisamente el hueco: el precio de PYME por banco.

**Lámina descriptiva europea: sí hacía falta.** El bloque europeo abría
directamente con el precio por tramo, sin decir de qué tamaño es cada
mercado. Eso importa porque la horquilla es enorme y condiciona cómo se lee
todo lo que viene después:

| País | Cartera PYME, M€ | Cuota | Brecha de financiación 2025-S1 |
|---|---|---|---|
| Francia | 961.184 | 44,8 % | **+6,3 %** (micro **+12,4 %**) |
| Alemania | 316.561 | 14,8 % | +2,3 % |
| España | 308.378 | 14,4 % | −1,3 % |
| P. Bajos | 259.108 | 12,1 % | −4,0 % |
| Italia | 252.021 | 11,8 % | −0,7 % |
| Portugal | 30.452 | 1,4 % | −9,4 % |
| Irlanda | 16.964 | 0,8 % | −2,1 % |

**Francia tiene 57 veces la cartera PYME de Irlanda.** Un punto de ROE no
vale lo mismo en los dos sitios, y hasta ahora el deck los ponía en la misma
barra sin decirlo.

Y el dato de la SAFE cierra el argumento francés que venía suelto por todo
el deck: Francia es el mercado **más grande**, el **peor atendido por
declaración de las propias empresas** (único con brecha claramente positiva,
y +12,4 % en el micro) y el de **peor ROE para su banca** (5,4 %). Las tres
cosas a la vez explican por qué sale cuarta para un entrante eficiente
pese a ser la última para el incumbente.

Fuente de la brecha: BCE, encuesta SAFE, indicador *financing gap* de la
PYME de menos de 250 empleados, media ponderada de 2025-S1. Es un
**porcentaje neto de encuesta** y se etiqueta como tal: no se agrega con la
cartera, que es un importe. La SAFE segmenta por **empleados** y el
Transparency Exercise por clase de exposición prudencial, de modo que las
dos mitades de la lámina no comparten criterio de segmentación; se dice en
el pie. El desglose micro solo está publicado para cuatro de los siete.

**Salidas:** lámina «El mercado: Francia es la mitad, Irlanda es el 0,8 %»
como apertura del bloque europeo; láminas «Conclusiones: el mercado
europeo», «Conclusiones: España», «Recomendaciones: entrada en el mercado
europeo» y «Recomendaciones: España»; bloque `eu_desc` en
`pres/datos.json`. La presentación queda en 46 láminas.

### 2.60 Repaso de consistencia antes de la revisión completa

Barrido automático de todo el texto de las 46 láminas buscando cifras y
redacciones que hubieran quedado obsoletas tras los cambios de estructura y
de modelo. Cuatro incidencias reales, todas corregidas:

1. **La portada decía «38885 observaciones · 11 fuentes».** El número había
   perdido el separador de millares en una sustitución anterior y el recuento
   de fuentes no se había actualizado al añadir CESGAR y la Central de
   Balances. Correcto: **39.508 observaciones y 13 fuentes**. Misma
   corrección en el subtítulo de la lámina de fuentes, que además seguía
   diciendo «Once fuentes».
2. **«Para los otros cinco países no existe dato equivalente»** en el pie de
   la lámina de sensibilidad, de cuando el encargo eran seis países. Son
   **seis** los otros.
3. **La misma expresión en la lámina de supuestos**, fila de comisiones.
4. **«La comisión es un supuesto de 87 pb en los seis países que no la
   publican»** en la lámina de apetito de riesgo: ambiguo, porque podía
   leerse como que seis de siete no la publican y España sí, que es lo
   correcto, o como el recuento antiguo. Reescrito a «en los otros seis
   países, que no la publican».

Comprobaciones que pasan limpias: 28 gráficos sin ninguna serie vacía ni a
cero, 22 tablas, ninguna lámina de contenido sin línea de fuente, validador
OOXML correcto y el control propio de desbordamiento, solape, lienzo y
pureza de paleta sin incidencias.

**Sigue sin poder hacerse QA visual**: LibreOffice no arranca en este
entorno y falla también con ficheros ajenos, así que todo el control de
maquetación es programático (ver §2.31).

### 2.61 Corrección: qué es exactamente la «brecha de financiación» de la SAFE

El usuario preguntó qué se está llamando brecha de financiación. Al ir a la
definición oficial resultó que **la lámina la describía mal en dos puntos**,
uno de ellos material.

**Definición literal del BCE** (guía metodológica de la SAFE, apartado 6.3,
«Financing gap indicator»):

> «It combines both financing needs and the availability of **bank loans,
> bank overdrafts, trade credit, equity and debt securities** at the
> enterprise level. For each of the five financing instruments, an indicator
> of a perceived financing gap change takes the value of 1 (-1) if the need
> increases/decreases and availability decreases/increases. If enterprises
> perceive only a one-sided increase/decrease in the financing gap, the
> variable is assigned a value of 0.5 (-0.5). The composite indicator is the
> weighted average of the financing gap related to the five instruments. A
> positive value suggests an increasing financing gap. Values are multiplied
> by 100 to obtain weighted net balances in percentages.»

Confirmado además contra los metadatos de la propia serie
`SAFE.H.ES.SME.A.0.0.0.FG.ZZZZ.NT.FL.WA`: `SAFE_ITEM = ZZZZ` (no desglosado
por instrumento, es decir el compuesto), `SAFE_DENOM = WA` (media ponderada)
y `UNIT = PURE_NUMB`.

**Error 1, de forma.** El pie decía «empresas que declaran más necesidad
menos las que declaran más disponibilidad». Eso describe un saldo neto
entre dos porcentajes de empresas, y no es así: es la **media ponderada de
una puntuación por empresa e instrumento** que vale ±1, ±0,5 o 0.
Corregido.

**Error 2, de fondo, y este sí importa.** Se estaba leyendo como un
indicador de **nivel** —«el mercado peor atendido»— cuando es un indicador
de **cambio**. El +6,3 de Francia significa que allí la brecha **se abre**
más que en ningún otro de los siete, no que su necesidad insatisfecha sea la
mayor en términos absolutos. Y al revés: el −9,4 de Portugal dice que la
brecha se está cerrando con fuerza, no que no haya necesidad sin cubrir.
Corregido en el título de la lámina, en el rótulo del gráfico, en la caja de
Francia y en la conclusión 2 del bloque europeo.

**Tercer matiz, que tampoco estaba dicho.** El indicador **no es solo
crédito bancario**: incorpora crédito comercial, capital y valores de deuda.
Para un deck que va de rentabilidad bancaria, eso hay que declararlo, porque
una brecha que se abre puede estarse abriendo en capital y no en préstamo.
Añadido al pie.

La dirección del argumento sobre Francia se mantiene —mercado más grande,
brecha abriéndose y peor ROE para su banca— pero ahora dice lo que el dato
dice y no más.

**Salidas:** lámina europea descriptiva y conclusión 2 corregidas; la
definición completa se incorpora a `scripts/safe_harvest.py` y a la columna
`notas` de las 6.162 filas de `transversal/safe_fg.csv`, para que ningún uso
posterior del fichero repita el error.

### 2.62 Rediseño: sistema visual sobre las láminas aportadas por el usuario

El usuario aportó una captura de un deck con el sistema visual que quiere.
Se reconstruye el generador para reproducirlo. La estructura y los datos no
cambian: cambia la capa de presentación.

**Paleta.** El naranja (#f56600, Pantone 165 C), el negro (#2b2b2b), los
grises y el azul salen del manual de marca que hay en el repositorio. **El
amarillo NO está en ese manual**: se ha muestreado de la propia imagen que
aportó el usuario, donde aparece como acento de bloques y destacados. Los
valores dominantes del muestreo son #FDD602 y #FFDF34, de donde salen
`YEL #FFD200`, `YEL2 #FFE066` y `YEL3 #FFF4C2`. Queda documentado como
muestreo y no como dato de manual, porque el manual que tengo es el de la
Fundación Innovación Bankinter y no el de la entidad.

**Cambios de sistema:**

- Toda lámina nace en `nueva()`, que pone fondo blanco roto (#FAFBFC), la
  marca arriba a la derecha y el número abajo a la izquierda. Antes cada
  lámina llamaba directamente a `pres.addSlide()` y no había ni marca ni
  numeración.
- **El título deja de ser naranja y pasa a negro corporativo**, como en las
  láminas aportadas. El naranja se reserva para datos, numeración y
  separadores.
- **Los 22 destacados pasan de naranja claro a amarillo**, con una barra
  naranja de 0,07" a la izquierda. Las celdas de tabla que codifican
  intensidad siguen en naranja: ahí el color significa algo y cambiarlo
  habría roto la lectura.
- **Separadores numerados**: panel naranja a dos tercios con el número en
  blanco al 45 % de transparencia, título grande y composición geométrica a
  la derecha. Sustituyen a los separadores de solo título.
- **Portada** rehecha: fondo negro, franja naranja a la derecha con bloques
  amarillo y naranja, filete amarillo bajo el título.
- **Dos láminas de cierre**: «Juntos hacemos crecer lo que importa» sobre
  naranja y una de agradecimiento con la marca.

**Lo que no se ha podido reproducir, y por qué.**

1. **Las fotografías.** El deck aportado usa fotografía de archivo en
   portada, separadores y cierre. No hay banco de imágenes con licencia en
   el proyecto y no se han descargado imágenes de terceros, porque su uso
   exigiría una licencia que no consta. En su lugar se compone una
   **geometría de bloques** naranja, amarillo y blanco translúcido, que es
   también un recurso del deck original (se ve en sus láminas 30 a 32). La
   función `bloques()` deja el hueco delimitado para sustituirlo por una
   imagen si se aporta.
2. **El logotipo.** No hay fichero de marca en el repositorio, así que se
   compone tipográficamente: «bankinter» en negro y el punto en naranja, en
   la tipografía del deck. Es una aproximación, no el logotipo oficial.
3. **La tipografía.** Se mantiene Verdana, que es la sustituta de sistema
   que fija el propio manual cuando Bankinter Sans no está disponible.

**Numeración: error detectado y corregido.** Al principio el contador se
incrementaba dos veces en portada, separadores y cierre —una en `nueva()` y
otra en la propia función—, de modo que las láminas de contenido salían
desfasadas. Corregido para que `nueva()` sea el único sitio donde se cuenta.
Comprobado que el número impreso coincide con la posición real en las 49
láminas.

**La presentación pasa de 46 a 49 láminas**: tres separadores nuevos
(cierre, datos e información relevante pasan a numerados) y dos de cierre,
menos uno por la fusión de separadores previos.

**Control de calidad ampliado.** El verificador de paleta se actualiza con
los amarillos muestreados y el blanco roto; si no, marcaba como error de
marca los colores nuevos. Sigue sin haber QA visual: LibreOffice no arranca
en este entorno (§2.31), así que el rediseño está comprobado
programáticamente —desbordamiento, solape, lienzo, paleta y numeración—
pero **no visualmente**. Conviene una primera pasada de ojo.

### 2.63 La rejilla del circulante: el cálculo estaba bien, el rótulo no

Al maquetar la presentación, otro asistente señaló una aparente
inconsistencia en la rejilla de sensibilidad del circulante: el ROE de 9,3 %
a 60 % de disposición con 0,30 % de comisión coincide con el de Irlanda,
pero la comisión neutral de Irlanda es 0,455 % y no 0,30 %, luego la fila
plana parecía estar en el sitio equivocado.

**Verificado: no hay error de cálculo.** La rejilla es la **media simple de
los siete países**, no la de ninguno en particular. Que 9,3 coincida con
Irlanda es casualidad de redondeo: Irlanda da 9,31 % y la media 9,34 %.

**Por qué la fila de 0,30 % sale plana.** Porque la media de las siete
comisiones neutrales es **0,312 %**, y 0,30 cae prácticamente encima:

| País | Tipo circulante | Coste recursos | Neutral |
|---|---|---|---|
| P. Bajos | 2,46 % | 1,04 % | **0,143 %** |
| Francia | 3,39 % | 1,21 % | 0,217 % |
| España | 3,58 % | 0,76 % | 0,281 % |
| Italia | 4,11 % | 0,74 % | 0,337 % |
| Portugal | 4,41 % | 0,74 % | 0,367 % |
| Alemania | 4,95 % | 1,09 % | 0,385 % |
| Irlanda | 4,92 % | 0,37 % | **0,455 %** |
| **Media** | | | **0,312 %** |

**Prueba de que la fórmula es correcta.** Con la comisión neutral de cada
país, su ROE no se mueve nada entre disposición del 40 % y del 100 %:
variación de **0,000 pp** en los siete. Con 0,30 % plano para todos, sí se
mueve, y en la dirección esperada: Países Bajos −1,16 pp (su neutral es
0,143, muy por debajo), Irlanda +0,47 pp (su neutral es 0,455, por encima).
Es exactamente lo que predice `f = CCF × (tipo − coste de los recursos)`.

**Lo que sí estaba mal: el rótulo.** La rejilla no decía con suficiente
claridad que promedia los siete países, y eso invita precisamente a la
lectura errónea de leerla como si fuera de un país. Corregido:

- el rótulo pasa a «Sensibilidad a los dos supuestos · media de los SIETE
  países»;
- se añade bajo la rejilla una línea que explica que la fila de 0,30 % sale
  plana por caer sobre la media de las neutrales (0,31 %) y que esa media no
  es la neutral de ningún país, que van del 0,14 % de Países Bajos al 0,46 %
  de Irlanda;
- el pie de la lámina lo repite.

`scripts/modelo_roe_circulante.py` imprime ahora la media de las neutrales y
su rango junto a la rejilla, y emite la media como fila propia del CSV, de
modo que el dato que explica la planitud queda en el fichero y no solo en la
lámina. Nuevo campo `f_neutral_media` en el bloque `circ` de
`pres/datos.json`.

**Lección de método.** El aviso era incorrecto en el diagnóstico pero
acertado en el olfato: una rejilla cuya fila plana no se explica es una
rejilla mal rotulada, aunque los números sean exactos.

### 2.64 Prima PYME: dos definiciones, y la que usan los informes no es la convencional

Al reconstruir la serie de prima PYME (diferencial de tipo entre préstamo
pequeño y grande, MIR) aparecieron **dos definiciones posibles** que no dan
lo mismo:

| Definición | Tramos | España, últimos 12 m | Alemania, 2023 |
|---|---|---|---|
| **Estrecha** (extremos) | ≤ 0,25 M€ vs > 1 M€ | −0,03 pp | +1,40 pp |
| **Amplia** (corte PYME) | ≤ 1 M€ vs > 1 M€ | −0,05 pp | +1,04 pp |

La **estrecha** es la que reproduce exactamente las cifras que publican los
informes de sector. La **amplia** es la que se corresponde con el corte de
1 M€ que el BCE usa convencionalmente para separar «préstamo PYME» de
«préstamo corporativo». La diferencia entre las dos llega a 0,36 pp en
Alemania, porque el tramo 0,25–1 M€ es sensiblemente más barato que el de
≤ 0,25 M€ y al incluirlo el diferencial se estrecha.

Se emiten **las dos**, etiquetadas en `metrica` y en `tramo_importe`
(`prestamos_personales/prima_pyme.csv`, 830 filas). La lámina muestra la
estrecha en el gráfico y las dos en la tabla lateral, porque la conclusión
—la prima española se ha ido a cero— se sostiene con cualquiera de ellas y
enseñar las dos es lo que impide que la objeción metodológica tumbe el
mensaje.

**Sobre la ponderación.** Se comprobaron tres formas de promediar el año:
media simple de los diferenciales mensuales, ponderación por el volumen
conjunto de los dos tramos, y ponderación de cada pata por su propio
volumen. Las tres coinciden dentro de ±0,10 pp salvo en Irlanda (hasta
0,16 pp en 2024). Se usa la **ponderación por volumen conjunto**, porque
ponderar cada pata por su propio volumen mete un artefacto de composición
en la *diferencia*: los meses en que la producción de importe grande se
dispara pesan más en una pata que en la otra.

**Lo que esta prima NO es.** El MIR segmenta por **importe del préstamo**,
no por tamaño de empresa. Es una prima de tamaño de *operación*. Un
préstamo de 800.000 € a una empresa grande cuenta como «pequeño». La única
fuente que segmenta por empleados es la SAFE.

---

### 2.65 Tasa de rechazo de la SAFE: la dimensión de cantidad que faltaba

El deck medía el precio del crédito PYME, no la **cantidad denegada**. La
SAFE la publica: pregunta **Q7B** («Financing applied — outcome»), ítem
**FBLN** (préstamo bancario), respuesta **S4** («Applied but was
rejected»), denominador **WP** (porcentaje ponderado).

Clave SDMX (12 dimensiones, ni una menos):
`SAFE.H.<país>.SME.A.0.0.0.Q7B.FBLN.S4.AL.WP`

Una clave con menos de 12 componentes devuelve **HTTP 400** con una página
de error de «security concerns», no un mensaje de clave inválida: fácil de
confundir con un bloqueo del proxy.

**Resultado, 2025-S2** (% de las que solicitaron): P. Bajos 13,6 · España
9,7 · Zona euro 9,6 · Irlanda 9,2 · Francia 8,2 · Alemania 5,5 · Portugal
4,1 · Italia 0,7. Reproduce exactamente las cifras publicadas.

**Unidad nueva en el esquema.** Se añadió `pct_empresas` a `schema.UNITS`.
No es `pct_neto_encuesta`: aquello es un *saldo neto* de respuestas
(subidas menos bajadas) y esto es una *proporción* sobre un denominador
declarado. Mezclarlas sería exactamente el error que el encargo prohíbe. El
denominador va escrito en `notas` fila a fila, porque **cambia entre
preguntas**: Q7B se calcula sobre las empresas que *solicitaron*, y Q7A/R2
(el desánimo, «no solicitó por miedo al rechazo») sobre el *total* de
empresas.

**Tres avisos que la lámina recoge:**

1. **La tasa de rechazo sola engaña.** Alemania es la que menos rechaza
   (5,5 %) y la que más raciona por otras vías: 20,4 % obtiene solo una
   parte y 7,7 % renuncia porque el precio le parece alto. Sumando, un
   33,6 % no obtiene todo lo que pidió, frente al 18,0 % de España.
   Rechazar y encarecer son **sustitutos**: la correlación entre la tasa de
   rechazo media de los tres últimos años y la prima PYME de los siete
   países es **ρ = −0,49**. Con n = 7 es indicativa, no concluyente, y así
   se rotula.
2. **Las filas de la tabla no suman 100 %.** «No obtuvo todo» se calcula
   como la suma de las tres columnas visibles (parcial + renunció por coste
   + rechazada), no como 100 − «obtuvo todo» − pendiente, para que la fila
   cuadre a la vista. Las dos definiciones coinciden salvo por las
   respuestas «no sabe», que en Portugal valen 3,8 pp y en Francia 0,7 pp.
   Queda dicho en el pie de la lámina.

3. **Un semestre no es una tendencia.** La serie es muy volátil: Irlanda ha
   oscilado entre 2,1 % y 20,1 % desde 2022 (desviación típica 6,7 pp) y
   Francia entre 4,6 % y 17,3 %. Leer un dato suelto como señal estructural
   es un error. La lámina da también la media de los tres últimos años.

---

### 2.66 Densidad de RWA por método: el capital español no es un problema de riesgo

Abriendo la dimensión `Portfolio` del Transparency Exercise (1 = estándar,
2 = IRB) sobre las partidas PYME, junio de 2025:

| País | Estándar | IRB | Total | Cartera en IRB | Ahorro del IRB |
|---|---|---|---|---|---|
| **España** | 63,0 % | **55,4 %** | 59,5 % | 46,2 % | **7,6 pp** |
| Alemania | 66,0 % | 30,1 % | 35,3 % | 85,5 % | 35,9 pp |
| Francia | 67,3 % | 35,3 % | 43,0 % | 76,0 % | 31,9 pp |
| Italia | 66,3 % | 37,7 % | 46,3 % | 69,7 % | 28,6 pp |
| Portugal | 72,7 % | 47,5 % | 61,3 % | 45,3 % | 25,2 pp |
| P. Bajos | 69,9 % | 34,9 % | 37,2 % | 93,5 % | 34,9 pp |
| Irlanda | 77,3 % | 64,7 % | 70,0 % | 58,2 % | 12,5 pp |

Las densidades **estándar** son casi idénticas entre países (63–73 %), como
cabe esperar: las pondera el mismo reglamento. Toda la dispersión de la
densidad agregada viene del IRB.

**El dato que cambia el mensaje**: la densidad IRB española (55,4 %) está
**por encima** de la densidad *estándar* de Alemania, Francia o Italia
(30–38 % en IRB). Un banco español con modelo aprobado consume más capital
por la misma exposición que un banco alemán con modelo aprobado, y casi
tanto como uno sin modelo.

**Descomposición de la brecha frente a Alemania (24,2 pp):**

- 3,0 pp por tener **menos cartera en IRB** (46,2 % frente a 85,5 %)
- 11,7 pp por la **calibración** de los modelos
- 9,5 pp de **interacción** entre ambas

Es decir: el problema no es cuánta cartera está modelizada, es qué devuelve
el modelo.

**Una afirmación que estaba mal y se corrigió antes de cerrar.** El primer
borrador de esta lámina decía que la densidad IRB española (55,4 %) está
«por encima de la densidad ESTÁNDAR de Alemania, Francia o Italia». Es
falso: las densidades estándar de esos tres países son 66,0 %, 67,3 % y
66,3 %, todas por encima. Lo cierto, y además más fuerte, es que la
densidad IRB española está por encima de la densidad **total** de los tres
(35,3 %, 43,0 % y 46,3 %): el banco español con modelo aprobado consume más
capital que el banco alemán medio. Queda anotado porque el error consistía
en comparar contra la columna equivocada de una tabla propia, que es
justamente lo que el repaso final tiene que cazar. La descomposición es un contrafactual simple (sustituir una
variable cada vez) y por eso deja un término de interacción grande; se
publica con los tres componentes a la vista en lugar de repartir la
interacción, que exigiría elegir un orden arbitrario.
`transversal/eba_te_pyme_sa_irb.csv`.

---

### 2.67 Reconciliación del ROE PYME con la rentabilidad de grupo

El ROE modelizado del segmento PYME España se compara con la rentabilidad
de grupo para que nadie lo lea como si fueran la misma magnitud. Todo sale
del mismo Transparency Exercise (`tr_oth.csv`, 202506): resultado atribuido
(2520336), CET1 (2520102), patrimonio total (2521216), intangibles
(2520110), RWA (2520138). Beneficio anualizado con el número de trimestres
que declara la propia columna `n_quarters`.

| Banco | ROE PYME ES (modelo) | ROE grupo / CET1 | RoTE grupo | Cuña denominador | Brecha | Peso RWA PYME |
|---|---|---|---|---|---|---|
| Bankinter | 20,7 % | 19,6 % | 18,2 % | 1,4 pp | +1,1 pp | 17,6 % |
| Sabadell | 20,2 % | 18,8 % | 15,9 % | 3,0 pp | +1,4 pp | 10,5 % |
| CaixaBank | 17,7 % | 19,9 % | 17,4 % | 2,5 pp | −2,2 pp | 9,9 % |
| BBVA | 13,2 % | 21,0 % | 18,4 % | 2,7 pp | −7,8 pp | 4,5 % |
| Santander | 14,2 % | 16,8 % | 14,6 % | 2,2 pp | −2,6 pp | 3,2 % |

Tres razones por las que las columnas no son comparables sin más:
**perímetro** (cartera PYME española frente a grupo consolidado: la brecha
de −7,8 pp de BBVA dice que su grupo rinde más que su PYME española, no
menos), **denominador** (CET1 frente a patrimonio tangible: solo por eso el
ratio sube entre 1,4 y 3,0 pp) y **cobertura de la cuenta** (el resultado
de grupo añade ROF, puesta en equivalencia, saneamientos extraordinarios y
el gravamen a la banca).

**Hueco declarado.** El `RoTE` de la tabla es **cálculo propio sobre el
EBA**, no la cifra que titula cada banco. Las páginas de relación con
inversores (CaixaBank, ING, ABN AMRO, Commerzbank) devuelven 403/503/555
desde este entorno, y los PDF descargados resultaron ser páginas de error
de 1–75 KB, no los informes. No se ha puesto ninguna cifra de presentación
de resultados en el repositorio sin poder verificarla contra su fuente.
`comparables_bancos/reconciliacion_rote.csv`.

---

### 2.68 Irlanda en factoring: la cifra lleva cinco años congelada

La tabla anual de la EUF marca a Irlanda con la nota **(3)**, cuyo texto
literal en la propia página es: *«Estimates of the turnover — the previous
year's turnover implemented»*. Es decir, se arrastra el importe del año
anterior. El fichero histórico de la EUF («EU Turnover per country since
2007», guardado en `raw/factoring/`) lo confirma y lo agrava:

| Año | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|
| Irlanda (M€) | 26.294 | 26.294 | 28.424 | 28.424 | 28.617 | 28.617 | 28.617 | 28.617 | 28.617 |

**Desde 2017 la EUF ha publicado tres importes distintos para Irlanda**, y
el actual lleva **cinco años consecutivos** sin moverse. La serie histórica
etiqueta además al país como *«EUF member till 2018»*: desde 2019 no hay
asociación nacional que reporte el dato.

Consecuencia: de Irlanda no se puede leer el nivel, ni el crecimiento (es
0,0 % **por construcción**), ni la cuota europea (1,1 %), ni la penetración
sobre PIB (4,5 %, la menor de los siete) — porque el numerador está
congelado y el denominador no. Irlanda sale de cualquier ranking de
factoring o lleva la marca del arrastre.

Mismo arrastre, con menos años, en **Estonia, Finlandia, Luxemburgo, Malta
y Suecia** (todas con variación 0,0 % y nota (3)).
`factoring_confirming/euf_historico.csv`, 133 filas, cada una con el aviso
de arrastre en `notas` cuando repite el año anterior.

---

### 2.69 Láminas sueltas: fichero aparte y sin numerar

Las cinco láminas de §2.64–§2.68 se generan en
`pres/gen_adicionales.js` → `pres/rentabilidad_pyme_laminas_adicionales.pptx`,
**no** dentro del deck principal, porque el usuario decide dónde insertar
cada una. Por eso **no llevan número de lámina** (se añadió la opción
`sinNumero` a `nueva()`): el número depende del punto de inserción.

El sistema visual se extrajo a `pres/visual.js` copiando literalmente el
bloque de `gen.js`. **`gen.js` no se ha tocado**: conserva su propia copia,
de modo que el deck principal (49 láminas, `md5 a3d6517…` antes y después)
no depende del fichero nuevo. El coste es que la paleta está duplicada; si
se cambia, hay que cambiarla en los dos sitios, y así está anotado en la
cabecera de `visual.js`.

**QA.** `qa_deck.py` pasa sin incidencias sobre los dos ficheros
(desbordamiento, solape, fuera de lienzo, paleta). **No hay QA visual**:
LibreOffice sigue roto en este entorno (`Error: source file could not be
loaded` al convertir a PDF), así que la comprobación de maquetación es
geométrica, no de aspecto.

### 2.70 La ventana del MIR pasa a 2022-01 y el recuento de la portada deja de escribirse a mano

Para construir la serie de prima PYME hacia atrás hubo que rearmar el
bloque `prestamos_empresas` del MIR desde **2022-01** (antes arrancaba en
2025-01). El fichero pasa de ~8.900 a **39.610 filas** y el repositorio de
39.508 a **71.061 observaciones**.

Se comprobó que la ampliación **no mueve ninguna cifra del deck**: se
regeneró `pres/datos.json` y el diff frente a la versión anterior es vacío.
Era lo esperable —el deck promedia 2026 y los meses nuevos son de 2022 a
2024— pero convenía verificarlo y no suponerlo.

Lo que sí quedaba obsoleto era el **recuento de la portada**, que estaba
escrito a mano y ya había fallado una vez (§2.55, «38885 observaciones»).
Ahora `datos_presentacion.py` cuenta las filas de todos los CSV y escribe
un bloque `meta` en `datos.json`; la portada y la lámina de fuentes leen de
ahí. El número no puede volver a desincronizarse sin que alguien borre el
bloque. El recuento de **fuentes sigue en 13**: los datos nuevos
(SAFE Q7A/Q7B, Portfolio del Transparency Exercise, histórico de la EUF)
vienen de fuentes que ya estaban contadas.

Como efecto colateral se hizo reproducible `circ.f_neutral_media`, que
estaba puesto a mano en `datos.json` tras §2.63 y que la regeneración
borraba: ahora `datos_presentacion.py` lo lee de
`circulante/modelo_roe_circulante.csv`.

### 2.71 Los comparables banco a banco, en % de la inversión

La lámina de comparables daba las cuentas en **importes absolutos**, que no
se pueden comparar ni entre bancos (tamaños muy distintos) ni con la cuenta
del préstamo PYME de la lámina 7, que está en % del saldo medio. Se
reexpresa todo sobre la **inversión crediticia del mismo perímetro**,
anualizando según el periodo que publica cada banco (Commerzbank da
trimestre, ×4; el resto semestre, ×2).

| Banco | Perímetro | Inversión M€ | Ingresos | M. int. | **Comisiones** | Costes | CoR | BAI |
|---|---|---|---|---|---|---|---|---|
| Commerzbank | Corporate Clients | 123.000 | 4,01 % | 2,15 % | **1,22 %** | n/d | n/d | n/d |
| ABN AMRO | Corporate Banking | 86.900 | 3,90 % | 2,52 % | **0,99 %** | 1,93 % | 15 pb | 1,82 % |
| Intesa Sanpaolo | Banca dei Territori | 219.966 | 5,64 % | n/d | n/d | 2,63 % | 48 pb | 2,53 % |
| CaixaBank | Grupo | 406.233 | 4,11 % | 2,65 % | 1,02 % | 1,63 % | 24 pb | 2,24 % |
| BPER Banca | Grupo | 129.216 | 6,00 % | 3,42 % | 2,09 % | 2,48 % | 27 pb | 3,24 % |

**Dos denominadores que faltaban, ahora obtenidos de la fuente primaria.**
El comunicado de resultados de Intesa y el de BPER no traen la inversión,
pero sus informes sí:

- Intesa, **Banca dei Territori: 219.940 M€** a 30-jun-2026 (219.992 a
  31-dic-2025, prácticamente plano). *Half-yearly report* a 30-jun-2026,
  tabla de préstamos a la clientela por división, p. 72 del PDF.
- BPER, **préstamos netos a la clientela: 129.693,8 M€** a 30-jun-2026
  (128.738,1 a 31-dic-2025). *Consolidated Interim Financial Report* a
  30-jun-2026, p. 34. El bruto es 132.119,6 M€.

Ambos descargan sin problema desde este entorno; el bloqueo que quedó
anotado en §2.26 afectaba a otras páginas de esos grupos, no a estas.

**Lo que aporta la reexpresión.** La fila de comisiones sobre inversión es
la única directamente comparable con el supuesto del modelo, que son
**87 pb**. Los dos únicos segmentos de empresas publicados dan **99 pb**
(ABN AMRO) y **122 pb** (Commerzbank): el supuesto está en el extremo bajo
del rango, de modo que **no está regalando ROE al modelo**. Ésa era la
duda que la lámina en importes no podía despejar.

**Lo que NO aporta, y hay que decirlo en la lámina.** «Ingresos /
inversión» no es un margen de préstamo: el numerador es el ingreso de todo
el segmento —margen de depósitos y transaccional incluidos— y el
denominador solo los préstamos. Banca dei Territori lo enseña en
caricatura con un 5,64 %, porque es una división minorista con gestión de
activos y seguros dentro. Por lo mismo, BPER, que es grupo y no segmento,
dobla en comisiones (2,09 %) a los segmentos de empresas: son comisiones de
fondos y seguros repartidas sobre una cartera de crédito. La lámina marca
con color distinto las filas de segmento y las de grupo, y no las ordena
entre sí.

**Bases del denominador, no homogéneas.** Commerzbank publica cartera
**media** del periodo, que es la base correcta; Intesa y BPER permiten
media de los dos cierres; ABN AMRO y CaixaBank solo dan **saldo final**.
CaixaBank además lo da **bruto** y los demás **neto**: con su mora del
1,78 % y la cobertura habitual, el neto sería del orden de un 1,3 % menor,
lo que subiría sus ratios uno o dos puntos básicos. No se ajusta, se
declara en el pie.

**Un hueco que se mantiene.** De Commerzbank no salen costes ni coste del
riesgo, porque no publica ratio de eficiencia del segmento y su «resultado
operativo» no permite separar gastos de dotaciones: en su formato esa
partida va después del *risk result*, mientras que en ABN AMRO e Intesa va
antes (verificado: ingresos − resultado operativo coincide con el ratio de
eficiencia publicado en los dos). Restar sin más daría un dato falso, así
que quedan en `n/d`.
`comparables_bancos/comparables_ratios.csv`, extractor
`scripts/comparables_ratios.py`.

### 2.72 ¿Se paga el riesgo? Dos nubes con el mismo eje vertical

Primer intento: una sola dispersión con información en X, margen en Y y el
coste del riesgo como tamaño de burbuja. **Descartada por el usuario: no
aportaba valor.** Tenía razón — mezclaba tres magnitudes en un gráfico y no
contestaba ninguna pregunta de forma limpia.

La versión buena son **dos paneles con el coste del riesgo en el eje
vertical de los dos**, de modo que cada uno responde a una pregunta:

| País | Coste del riesgo | Margen bruto | Información |
|---|---|---|---|
| España | 0,59 % | 3,52 % | 64,4 |
| Alemania | 0,40 % | 4,17 % | 75,0 |
| Francia | 0,68 % | 3,43 % | 16,7 |
| Italia | **0,80 %** | 4,39 % | 79,2 |
| Portugal | 0,50 % | 4,07 % | 64,5 |
| P. Bajos | **0,35 %** | 4,34 % | 53,8 |
| Irlanda | 0,40 % | **5,87 %** | 87,5 |

**Panel 1 — ¿cobra más quien más riesgo tiene? No.** ρ = **−0,42**: la nube
baja. Y la robustez es inusualmente buena para siete puntos: recalculando
la correlación al quitar uno y dos países, **los 28 casos dan signo
negativo**, de −0,97 a −0,02. En ninguna submuestra el riesgo se paga.
Italia es la excepción —el mayor coste del riesgo y el segundo mayor
margen—; España y Francia hacen lo contrario, riesgo alto y margen bajo.

**Panel 2 — ¿baja el riesgo donde hay más información? Tampoco, pero por
otro motivo: no hay relación.** ρ = **−0,24**, y el signo no aguanta: al
quitar uno y dos países va de **−0,90 a +0,64**, y sale **positivo en 6 de
los 28**. Italia lo enseña de un vistazo: la segunda mayor información de
los siete y el peor coste del riesgo. El eje que sí explica el coste del
riesgo es el de **recobro (ρ = −0,72)**, que ya estaba en la lámina de los
dos ejes.

La diferencia entre los dos paneles es la que hace útil la lámina: en el
primero hay un patrón robusto (y desfavorable); en el segundo no hay
patrón, y eso también es un resultado.

**Sin variable mecánica.** El margen bruto es ingreso menos coste de los
recursos, **antes** de riesgo, así que no hay dependencia aritmética entre
los dos ejes del panel 1. Además vienen de fuentes distintas: el precio del
MIR y los parámetros PD/LGD del COREP del EBA.

**Notas de fabricación.** Se dibuja con formas y no con `addChart`, porque
pptxgenjs comparte el eje X entre series y no deja un punto por país con su
propia X. La colocación de cada etiqueta va en una tabla por panel, con
tres opciones (izquierda, derecha y centrada encima); la centrada existe
solo para Irlanda en el panel 2, donde comparte coste del riesgo con
Alemania (0,40 % las dos) y están pegadas en el eje de información. Además
del QA habitual se comprueba por geometría que ninguna etiqueta pisa un
punto, que ninguna se sale del área y que no se solapan entre sí.
`transversal/mapa_info_margen.csv`, extractor
`scripts/mapa_info_margen.py`.

### 2.73 El «21,6 %» parecía un tipo de interés, y además tenía mal el denominador

El usuario preguntó por qué en la lámina de conclusiones de España decíamos
que el obstáculo principal es «el precio (21,6 %)», porque **parecía una
tarifa de tarjeta de crédito**. Tenía razón: la frase tenía **dos errores**
y aparecía en **dos láminas** (conclusiones de España y demanda española).

**Error 1: no es un nivel, es un porcentaje de empresas.** El 21,6 % es la
proporción de pymes que **señala el precio como obstáculo** en la encuesta
CESGAR, no un tipo de interés. El dato estaba bien etiquetado en el CSV
—`unidad = pct_neto_encuesta`, y la nota de cada fila dice literalmente
«ENCUESTA: porcentaje de empresas, no un nivel de tipo ni un volumen»— pero
la lámina lo escribía como «el precio (21,6 %)», que se lee como un precio.
Es exactamente la confusión que el encargo prohíbe.

**Error 2: el denominador estaba mal.** La lámina decía «entre las que sí
ven obstáculos, el primero es el precio (21,6 %)». Falso: las cinco
categorías de esa pregunta se miden sobre el **total de encuestadas**, y la
prueba es que la categoría «ninguno» (49,2 %) está en la misma escala.
Sobre las pymes que sí señalan algún obstáculo, el precio sería el
**42,5 %** (21,6 / 50,8), casi el doble de lo que decía la lámina.

Corregido en las dos láminas. El texto ahora dice el reparto completo
—«el 49,2 % no señala ninguno y el 21,6 % señala el precio»— y añade en la
propia frase que ese 21,6 % es porcentaje de empresas y no un tipo. El pie
declara las dos bases y da la cifra de 42,5 % para quien quiera la otra
lectura.

**Lección de método.** Etiquetar bien el CSV no basta si la lámina redacta
el número como si fuera otra cosa. El barrido de §2.55 buscaba cifras
obsoletas; hace falta también un barrido de cifras **bien calculadas y mal
redactadas**, que es un error más difícil de ver porque el dato cuadra
contra su fuente.

---

### 2.74 De «Conclusiones: España» a «Observaciones: España»

A petición del usuario, la lámina pasa a ser de **observaciones**: hechos
medidos, sin la inferencia. Se quitaron las frases que derivaban una
decisión y que pertenecen a la lámina de recomendaciones:

- «Un entrante que compita por disponibilidad se equivoca de eje.»
- «Por encima de esa diferencia, endeudarse deja de crearle valor y la
  demanda se corta sola.»
- «…es lo que de verdad se puede usar para ganar cliente.»
- «El autónomo es un segmento aparte que la estadística **esconde**»
  → «…está **fuera** de las series de empresas» (describe, no acusa).

Los titulares también se reescriben en modo descriptivo: «El problema no es
el acceso, es el precio» → «El crédito se concede; lo que las pymes señalan
es el precio»; «La capacidad competitiva se mide en precio, no en ROE» →
«Entre el primero y el último hay 119 pb de precio de equilibrio».

Ningún número cambia: cambia lo que se afirma a partir de ellos. La
observación 2 gana además el contraste con la mediana (ROA 10,4 % frente a
5,4 %) y la nota de que la diferencia lleva en 2,1 puntos desde 2023, que
son hechos y estaban implícitos.

La lámina está en los dos sitios: `gen.js` (deck principal, sustituye a la
50) y `gen_adicionales.js` (lámina suelta, para insertar en la versión
formateada del usuario). El bloque se **copia literalmente** de uno a otro,
como la paleta: si se toca uno, hay que tocar el otro.

**Pendiente de decidir.** La lámina europea equivalente sigue llamándose
«Conclusiones». O se convierten las dos o el deck queda incoherente.

### 2.75 Por qué la densidad de RWA es la que es: PD, LGD y residuo

Pregunta del usuario: la densidad tan baja de Países Bajos, ¿viene de los
modelos IRB o de las garantías reales? La pregunta tiene una trampa
—**bajo IRB la garantía no compite con el modelo, entra dentro, por la
LGD**— así que lo separable no es «modelo o garantía» sino **PD o LGD**.

Se mete la PD y la LGD observadas de cada país en la fórmula IRB de
empresas del **art. 153 CRR**, con el ajuste PYME del 153.4 y el factor de
apoyo del art. 501 (0,7619), y se compara con la densidad IRB observada:

| País | PD | LGD | RW fórmula | IRB observada | Residuo | Recuperación | NPL PYME |
|---|---|---|---|---|---|---|---|
| España | 1,73 % | 34,4 % | 56,0 % | 55,4 % | **−0,6** | 77,5 % | 5,38 % |
| Alemania | 1,26 % | 31,4 % | 46,6 % | 30,1 % | −16,5 | 79,8 % | 4,32 % |
| Francia | 2,15 % | 31,5 % | 54,5 % | 35,3 % | −19,2 | 74,8 % | 5,12 % |
| Italia | 2,26 % | 35,6 % | 62,3 % | 37,7 % | **−24,6** | 65,6 % | 4,90 % |
| Portugal | 1,26 % | **40,0 %** | 59,3 % | 47,5 % | −11,8 | 64,8 % | 4,22 % |
| P. Bajos | 1,18 % | 29,7 % | 43,1 % | 34,9 % | −8,2 | **90,1 %** | **3,13 %** |
| Irlanda | 1,08 % | 37,3 % | 52,7 % | 64,7 % | **+12,0** | 86,1 % | 3,77 % |

**Respuesta a la pregunta.** Países Bajos consume 12,9 pp menos que España
en la fórmula, y el reparto es **53 % LGD y 41 % PD** (6 % de interacción).
Aguanta el tamaño de empresa (52–54 % la LGD con facturación de 5 a 50 M€)
y solo se mueve con el vencimiento (47 % a un año, 60 % a cinco).

**Los dos inputs están corroborados fuera del modelo**, que es lo que evita
que esto sea una lectura circular: la LGD más baja de los siete va con la
**tasa de recuperación concursal más alta** (90,1 % frente al 77,5 %
español) y la PD segunda más baja va con el **NPL de PYME más bajo**
(3,13 % frente al 5,38 %). Los parámetros holandeses son bajos de verdad,
no solo en el modelo.

**El residuo, y por qué hay que leerlo con cuidado.** España es el único
país donde la densidad observada coincide con la que da la fórmula (55,4
frente a 56,0). En los demás el agregado pondera hasta 24,6 pp por debajo
(Italia). Tentador concluir que los modelos de los demás «ganan» frente a
la fórmula y el español no, pero **no se puede afirmar**: la PD y la LGD
son **medianas de entidades declarantes** (COREP C 9.02) y la densidad es
una **media ponderada por volumen** (Transparency Exercise). Parte del
residuo es esa asimetría —una cartera concentrada en exposiciones mejores
que la entidad mediana— y no comportamiento del modelo. No es separable
con lo publicado, y así se dice en la lámina.

**Cuándo el reparto porcentual NO se publica.** Solo tiene sentido cuando
los dos canales empujan en el mismo sentido que la brecha. En Francia,
Portugal e Irlanda se compensan entre sí —Francia llega casi a la misma
ponderación que España con una PD mucho peor y una LGD mucho mejor— y el
porcentaje se dispara a cifras absurdas (−195 % y +313 %). En esos casos el
CSV publica los canales en **puntos** y deja el porcentaje vacío.

**Hallazgo lateral: la LGD de Portugal es exactamente 40,00 %.** Es el
valor **supervisor del IRB básico** (art. 161 CRR) para exposiciones
corporativas senior no garantizadas. Portugal está mayoritariamente en
F-IRB, donde el banco **no estima su propia severidad** y por tanto no
puede reconocer su garantía en el parámetro. Explica que tenga la segunda
peor densidad IRB (47,5 %) teniendo la PD más baja empatada de los siete.
Va marcado con asterisco en la lámina.

**Contraprueba que apunta al modelo y no a la garantía.** La densidad
**estándar** holandesa es 69,9 %, la segunda más alta de los siete (España
63,0 %). Bajo el reglamento —donde la garantía también reduce, vía técnicas
de mitigación— la cartera PYME holandesa no sale barata. Es indicio y no
prueba, porque el 6,5 % del libro holandés que va por estándar no es la
misma cartera que el 93,5 % que va por IRB.

**Supuestos que no son datos**, declarados en el pie de la lámina:
facturación de 25 M€ y vencimiento efectivo de 2,5 años. La sensibilidad a
los dos está en la salida del extractor.

**Hueco: la vía directa no existe.** El Transparency Exercise trae una
plantilla de valoración de garantías (partidas 2521701 a 2521707: colateral
hasta el valor de la exposición, del cual inmueble, y garantías
financieras) que contestaría esto sin pasar por la LGD. **No sirve**: solo
reportan Alemania, Francia, Italia y Portugal —España, Países Bajos e
Irlanda no aparecen—, la muestra es parcial (el importe alemán son
35.972 M€, imposible para un sistema entero) y **no hay desglose por PYME**:
las partidas de colateral solo existen con `Exposure = 0`, el total de
préstamos y anticipos.
`transversal/descomposicion_rwa.csv`, extractor
`scripts/descomposicion_rwa.py`.

### 2.76 Lámina de supuestos del ROE: qué es de PYME y qué es proxy

A petición del usuario, una lámina con el formato de la de fuentes pero una
fila por **partida de la cuenta del ROE**, clasificada en cuatro tipos:

| Partida | Fuente | Tipo | Por qué |
|---|---|---|---|
| Precio | BCE, MIR, tramo ≤1 M€ | **PROXY** | Segmenta por importe del préstamo, no por tamaño de empresa; deja fuera al autónomo |
| Comisiones | Banco de España, cuña TAE − TEDR | **SUPUESTO** | Solo España la publica; su cuña de 87 pb se aplica a los siete |
| Coste de los recursos | BCE, MIR + BSI, sector 2240 | **PROXY** | Depósito de sociedades no financieras, no de PYME |
| Coste del riesgo | EBA, COREP C 9.02 | **PYME** | Clase «of which SME»; solo IRB, mediana, pérdida esperada |
| Densidad de RWA | EBA, Transparency Exercise | **PYME** | Pero agregada por supervisor: incluye PYME extranjera |
| Gastos | EBA Risk Dashboard | **DEL BANCO** | Eficiencia de grupo aplicada al margen |
| CET1 | EBA Risk Dashboard | **DEL BANCO** | Solvencia del grupo |
| Tipo impositivo | Legislación nacional | **DEL BANCO** | Nominal aplicable a bancos, no efectivo |

Solo dos de las ocho líneas son de PYME, y las dos por la definición del
CRR (facturación hasta 50 M€), que no coincide ni con la Recomendación
2003/361/CE ni con los tramos de importe del MIR. **Las tres fuentes que
dicen «PYME» miden tres perímetros distintos**, y así se dice en el pie.

**Hallazgo al hacerla: la densidad de RWA incluye PYME extranjera.** El
extractor (`eba_te_pyme.py`) suma, para las entidades de cada supervisor,
la contraparte **total** (`Country = 0`). Para los bancos españoles eso
mete la PYME de Santander y BBVA fuera de España: solo el **53,8 %** de su
exposición PYME es española. Comparación con solo contraparte local:

| Supervisor | Densidad total (la del modelo) | Solo contraparte local | Diferencia | % local |
|---|---|---|---|---|
| España | 59,5 % | 55,7 % | −3,8 | 53,8 % |
| Alemania | 35,3 % | 32,5 % | −2,9 | 55,9 % |
| Francia | 43,0 % | 39,8 % | −3,2 | 82,4 % |
| Italia | 46,3 % | 41,9 % | −4,4 | 51,2 % |
| Portugal | 61,3 % | 58,0 % | −3,3 | 82,9 % |
| P. Bajos | 37,2 % | 35,5 % | −1,7 | 56,5 % |
| Irlanda | 70,0 % | 70,1 % | +0,1 | 79,9 % |

**Material en nivel, inmaterial en orden.** La densidad local es 1,7–4,4 pp
más baja en seis de los siete, pero el sesgo es casi uniforme y el ranking
queda **idéntico**. España está en la media del sesgo, así que no sale
especialmente penalizada frente a los demás. **No se ha cambiado el
modelo**: pasar a contraparte local bajaría el capital de todos los países
y subiría todos los ROE unos puntos, lo que movería cifras en varias
láminas. Queda como decisión pendiente del usuario.

### 2.77 La definición de PYME en los datos del EBA: no hay una, hay tres

Pregunta del usuario: para los datos de PYME del EBA, ¿cuál es la
definición de PYME? Se contestó **leyendo la normativa**, no de memoria, y
la respuesta dejó inexacta una frase que el propio deck afirmaba.

Fuentes leídas (copias en `raw/normativa/`, no versionadas):
- **CRR**, Reglamento (UE) 575/2013, texto original (CELEX 32013R0575).
- **Reglamento de Ejecución (UE) 2021/451**, normas técnicas de reporting:
  Anexo II (instrucciones COREP) y Anexo V (instrucciones FINREP).

**1. Mora por segmento — FINREP (lo que usa el Risk Dashboard).** Anexo V,
Parte 1, punto 5(i): *«‘SME’: micro, small and medium-sized enterprises as
defined in Commission Recommendation C(2003)1422»*, es decir, la
**Recomendación 2003/361/CE completa**: menos de 250 empleados **y**
facturación hasta 50 M€ **o** balance hasta 43 M€. Las plantillas FINREP
lo citan como «SME Art 1 2(a)».

**2. Capital por método estándar — COREP C 07.00.** La fila 0020
*«of which: SME»* dice solo *«All exposures to SME shall be reported
here»*, sin definir PYME. El CRR de la UE no tiene definición general de
PYME en su art. 4; la única que da es la del **art. 501.2.b**, a efectos
del factor de apoyo: *«an SME is defined in accordance with Commission
Recommendation 2003/361/EC […] only the annual turnover shall be taken
into account»*, es decir, **solo facturación hasta 50 M€**, sin el
criterio de empleados. **No verificado**: que los bancos apliquen esa
misma definición a la fila 0020 (y no solo a la 0030, la del factor de
apoyo) es la lectura natural, pero las instrucciones no lo dicen.

**3. Todo lo IRB — COREP C 08.01 y C 09.02.** Clase *«Corporate – SME»*
(y *«Retail – SME»*): *«For the purpose of classification to this
sub-exposure class the reporting entities shall use their **internal
definition of SME** as applied in internal risk management processes»*.
**Cada banco usa la suya.** No hay definición común.

Y aparte, la fórmula IRB tiene su propio umbral de tamaño (art. 153.4):
*«total annual sales for the consolidated group […] less than EUR 50
million»* — **grupo consolidado**, no la empresa sola.

**Qué dato del deck usa cada definición:**

| Dato del deck | Fuente | Definición de PYME |
|---|---|---|
| NPL de PYME | Risk Dashboard (FINREP) | Recomendación 2003/361/CE completa |
| Densidad de RWA, parte estándar | Transparency Exercise (COREP C 07.00) | CRR art. 501: facturación ≤ 50 M€ (lectura natural, no explícita) |
| Densidad de RWA, parte IRB | Transparency Exercise (COREP C 08.01) | Interna de cada banco |
| Coste del riesgo, PD × LGD | COREP C 09.02, IRB | Interna de cada banco |
| Factor de apoyo 0,7619 | CRR art. 501 | Facturación ≤ 50 M€ |
| Ajuste por tamaño de la fórmula | CRR art. 153.4 | Ventas del grupo consolidado < 50 M€ |

**Tres consecuencias para el deck.**

1. **El coste del riesgo de PYME no es comparable al milímetro entre
   países**, porque cada banco clasifica como PYME lo que su gestión de
   riesgos llama PYME. La PD y la LGD de «PYME» de un banco alemán y de uno
   español pueden cubrir empresas distintas. Es el dato de PYME más
   específico que existe, pero no está armonizado.
2. **La densidad de RWA mezcla dos definiciones** en una sola cifra (la
   estándar y la interna, en la proporción de cartera IRB de cada país), y
   además incluye **PYME minorista** (exposiciones pequeñas tratadas como
   retail, que ponderan menos) y **PYME con garantía hipotecaria**, porque
   la partida del Transparency Exercise es «SME — by exposure class».
3. **La mora de PYME y el capital de PYME no miden el mismo colectivo.** La
   mora exige además menos de 250 empleados; el capital, no.

**Corrección aplicada.** La lámina de supuestos del ROE (la décima suelta)
decía «De PYME según el CRR (facturación hasta 50 M€)» en el coste del
riesgo y en la densidad, y el pie decía que «PYME» significaba la
definición del art. 501. Era **inexacto**: en todo lo IRB la definición es
la interna de cada banco. Corregidas las dos filas y el pie, que ahora
dice las tres definiciones.

### 2.78 Sí existe una definición europea estándar; casi ninguna estadística bancaria la usa entera

Pregunta del usuario tras §2.77: ¿no hay una definición estándar de PYME
europea? **Sí: la Recomendación 2003/361/CE.** Umbrales según la página
oficial de la Comisión (DG GROW, *SME definition*, copia en
`raw/normativa/`):

| | Micro | Pequeña | Mediana |
|---|---|---|---|
| Empleados | < 10 | < 50 | < 250 |
| Facturación | ≤ 2 M€ | ≤ 10 M€ | ≤ 50 M€ |
| **o** balance | ≤ 2 M€ | ≤ 10 M€ | ≤ 43 M€ |

Empleados **siempre**, más facturación **o** balance. Y los umbrales se
aplican a la empresa sola **salvo que forme parte de un grupo**, en cuyo
caso hay que sumar los datos de las empresas asociadas o vinculadas.

**Por qué no la usa todo el mundo.** Es una **recomendación**, no una norma
vinculante: obliga solo donde un acto jurídico la adopta (ayudas de Estado,
programas de financiación de la UE). La regulación bancaria la adoptó a
medias: el CRR se queda solo con la facturación (art. 501) y el IRB deja a
cada banco su definición interna. La razón práctica habitual —no una
justificación oficial que se haya leído— es que el recuento de empleados y
la agregación con las empresas del grupo son difíciles de verificar para
un prestamista, que en su expediente de riesgo tiene la facturación.

**Mapa de las fuentes del deck frente a la definición estándar:**

| Fuente | ¿Usa la 2003/361/CE? |
|---|---|
| Central de Balances (Banco de España) | Sí, completa |
| NPL de PYME (EBA, FINREP) | Sí, completa |
| SAFE (BCE) | No: solo empleados (< 250) |
| Densidad, parte estándar (COREP C 07.00) | Solo el criterio de facturación (≤ 50 M€) |
| Coste del riesgo y densidad, parte IRB | No: definición interna de cada banco |
| Precio (MIR) | No: tamaño del **préstamo**, no de la empresa |

De las fuentes de la cuenta del ROE, **ninguna** usa la definición estándar
completa: la única que la usa y entra en el deck como riesgo es el NPL, que
el modelo no utiliza (usa PD × LGD).

**Novedad en curso.** La Comisión está introduciendo una categoría nueva,
la **small mid-cap (SMC)**, para empresas que superan los umbrales de PYME
(ficha de 2025 en la misma página). Aún sin umbrales publicados en esa
página a la fecha de consulta.

### 2.79 Definición de PYME por fuente: columna en la tabla de supuestos y lámina propia

A petición del usuario:

1. **La tabla de supuestos del ROE** (lámina suelta 10) lleva ahora una
   columna **«Definición de PYME»** para cada partida: ninguna (préstamo
   ≤1 M€) en precio y comisiones; ninguna (todas las empresas) en coste de
   los recursos; interna de cada banco en coste del riesgo; dos en la
   densidad (estándar: facturación ≤50 M€; IRB: interna); «no aplica» en
   gastos, CET1 e impuesto. Los textos de la columna «qué se usa» se
   acortaron para que la tabla siga cabiendo (fondo estimado 5,98").

2. **Lámina nueva, «Qué es una PYME depende de a quién se pregunte»**
   (suelta 11): una fila por fuente de la presentación, con qué datos del
   deck salen de ella, qué criterio usa, qué llama PYME y si coincide con
   la estándar. Trece filas, la primera la propia Recomendación como
   referencia.

**Verificado en su texto de origen en esta sesión**: Recomendación
2003/361/CE (página de la Comisión), FINREP y COREP (Reglamento de
Ejecución 2021/451), CRR arts. 153.4 y 501, y **CESGAR**, cuyo informe dice
literalmente que su universo son empresas *«también personas físicas, con
menos de 250 empleados»*: es por empleados y **añade al autónomo**, al
revés que las estadísticas de sociedades no financieras.

**Tomado del propio repositorio, no releído hoy**: la SAFE (menos de 250
empleados; la etiqueta del extractor desde el principio del proyecto; las
series del BCE no traen los tramos en su metadato y la página de
metodología da 404), Banca d'Italia (cabecera de `bancaditalia_taeg.py`:
clase de importe disponible, excluye empresarios individuales) y OCDE
(definición nacional, `oecd_scoreboard.py`).

**Lectura de la lámina**: solo dos fuentes usan la definición estándar
completa —Central de Balances y FINREP— y ninguna de las dos entra en la
cuenta del ROE. Va en el subtítulo.

### 2.80 La columna `criterio_segmentacion` estaba mal en 15 ficheros, y ya no

Al preparar el inventario de datos (§2.81) se vio que la columna que el
encargo exige en cada fila —el criterio con que se segmenta— tenía
etiquetas que contradecían lo leído en la normativa (§2.77). Corregido en
dos pasos, sin tocar ningún valor.

**1. Definiciones de PYME mal atribuidas (1.909 filas, 12 ficheros).**

| Fichero | Decía | Dice ahora |
|---|---|---|
| Mora de PYME (Risk Dashboard, FINREP) | empleados | `definicion_ue_2003_361` |
| Central de Balances | empleados | `definicion_ue_2003_361` |
| PD, LGD y coste del riesgo (COREP C 9.02) | empleados | `pyme_interna_banco` |
| Descomposición de la densidad | «definición CRR» | `pyme_interna_banco` |
| Densidad de RWA de PYME (total) | empleados | `pyme_mixta_estandar_e_irb` |
| Densidad por método | «definición CRR» | estándar `pyme_crr_facturacion`, IRB `pyme_interna_banco`, resto mixta |
| OCDE Scoreboard (tres ficheros) | empleados | `definicion_nacional` |
| Cartera PYME de los 5 bancos españoles (y su serie) | entidad | `pyme_mixta_estandar_e_irb`; CET1 y eficiencia siguen `entidad` |
| Capital de empresas por país | entidad | es agregado por país: PYME y gran empresa `pyme_mixta…`, total `n/a` |

**2. Filas sin tramo etiquetadas «por importe» (12.443 filas, 3 ficheros).**
El recolector del MIR ponía al bloque entero el criterio del bloque. Pero
los **totales** de todas las cuantías, el **circulante** y los
**depósitos** no tienen tramo de importe: no están segmentados. Ahora
`tamano_prestamo` solo va en filas con tramo; el resto, `n/a`.

**Cómo se hizo.** Se corrigió cada extractor (y la regla del recolector
del MIR) y se aplicó el mismo cambio a los CSV **en el sitio, solo en esa
columna**, para no reescribir la fecha de extracción de miles de filas.
Tres comprobaciones:

- en los 15 ficheros tocados **no cambia ninguna otra columna** ni el
  formato de ninguna línea;
- los nueve extractores que corren sin red, ejecutados en una copia aparte,
  generan **exactamente las mismas etiquetas** que el parche, fila a fila;
  y una descarga real del BCE (bloque de circulante) da también `n/a`;
- `pres/datos.json` regenerado es **idéntico**: ninguna cifra del deck se
  mueve.

**Para que no vuelva a pasar**, `schema.CRITERIOS` define los diez valores
válidos, cada uno con lo que significa, y `schema.row()` rechaza cualquier
otro. El valor impreciso `tamano_empresa_definicion_crr` desaparece.

---

### 2.81 Inventario de datos en Excel

`pres/inventario_datos_pyme.xlsx`, generado por
`scripts/inventario_datos.py`. Tres hojas:

- **Inventario**: 43 datos, con las tres columnas pedidas —dato, fuente,
  definición de PYME usada— y detrás si coincide con la estándar de la UE,
  un matiz, el bloque, el código de la columna `criterio_segmentacion`, el
  fichero, el periodo, los países y el número de filas.
- **Definiciones**: los diez códigos con su significado y cuántas filas de
  los CSV llevan cada uno, más los umbrales de la Recomendación
  2003/361/CE.
- **Fuentes**: glosario de siglas (MIR, BSI, FM, SAFE, COREP, FINREP…).

Periodo, países y filas se leen de los CSV, no se escriben. Y el script
**falla** si un dato del inventario apunta a un fichero que no existe o le
atribuye un código que ese fichero no contiene: así se detectó que los
depósitos y el circulante estaban mal etiquetados (punto 2 de §2.80).

Recuento: de 43 datos, **2** usan la definición estándar completa (mora de
PYME y Central de Balances), **5** solo uno de sus criterios, **16** otra
definición o ninguna de tamaño de empresa, y **20** no son datos de
segmento.

### 2.82 Presentación descriptiva del mercado PYME, fuente por fuente

`pres/mercado_pyme_europa.pptx` (40 láminas), generada por
`pres/gen_descriptiva.js` a partir de `pres/descriptiva.json`, que produce
`scripts/datos_descriptiva.py` leyendo los CSV del repositorio.

- **Estructura.** Doce fuentes, cada una con una ficha: qué es, qué se ha
  obtenido, qué llama PYME y hasta dónde aplica. Después, sus gráficos.
  Cierra con un análisis descriptivo: cuadro de nueve indicadores, posición
  de España, seis observaciones y una lámina de límites.
- **Solo datos observados.** No hay ROE, margen bruto, capital ni la
  comisión supuesta de 87 pb. Lo único calculado son medias ponderadas,
  diferencias y correlaciones entre siete países; estas últimas se rotulan
  como descriptivas, no causales.
- **Etiqueta de definición en cada lámina de datos**, con el mismo criterio
  que `criterio_segmentacion` (§2.79–2.80).
- **Titulares calculados desde los datos**, no escritos a mano: el número
  de países donde el préstamo pequeño es el más caro, la racha negativa de
  la brecha SAFE, los años sin cambio del factoring irlandés y los extremos
  de España en la lámina de posición.
- **Serie de la Central de Balances** (diferencia entre rentabilidad y
  coste de la deuda, pequeñas empresas, 2015–2024): reconstruida desde
  `transversal/cb_pymes.csv`. Coincide con la que antes se escribía a mano
  en `datos.json`.
- **Doing Business** se incluye como contexto del país, no como dato PYME.
  Es de 2019 y no tiene sucesor que cubra los siete países.
- **Informes de bancos:** solo Commerzbank y ABN AMRO publican las
  comisiones de un segmento de empresas. CaixaBank y BPER aparecen en gris,
  como grupo.

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
