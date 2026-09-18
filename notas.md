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
