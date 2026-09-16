# notas.md — huecos, bloqueos y advertencias metodológicas

Última actualización: 2026-09-16

---

## 1. BLOQUEO CRÍTICO: ninguna fuente primaria es accesible desde este entorno

El entorno de ejecución remoto aplica una **política de egress restrictiva**.
Comprobación ejecutada el 2026-09-16 con `scripts/check_fuentes.py`:

```
0/15 fuentes alcanzables.
```

Dominios verificados y **denegados** por el proxy (respuesta `403 a CONNECT`,
denegación de política, no error del sitio remoto):

| # | Fuente del encargo | Dominio | Estado |
|---|---|---|---|
| 1 | ECB Data Portal (API SDMX) | `data-api.ecb.europa.eu` | BLOQUEADO |
| 1 | ECB Data Portal (web) | `data.ecb.europa.eu` | BLOQUEADO |
| 2 | SAFE (encuesta BCE) | `www.ecb.europa.eu` | BLOQUEADO |
| 3 | EBA Risk Dashboard / RAR | `www.eba.europa.eu` | BLOQUEADO |
| 4 | EBA Transparency Exercise | `www.eba.europa.eu` | BLOQUEADO |
| 5 | OECD Scoreboard | `www.oecd.org`, `stats.oecd.org` | BLOQUEADO |
| 6 | EUF | `euf.eu.com` | BLOQUEADO |
| 6 | FCI | `fci.nl` | BLOQUEADO |
| 7 | IR de los 9 bancos comparables | varios | BLOQUEADO |
| 9 | Banco de España, Boletín Estadístico | `www.bde.es` | BLOQUEADO |

Sólo salen `github.com`, `pypi.org`, `registry.npmjs.org` y la API de Anthropic.

**Consecuencia:** no se ha escrito **ninguna fila de datos** en los CSV. Los
archivos de cada carpeta contienen sólo la cabecera del esquema. No se ha
estimado, interpolado ni reconstruido de memoria ningún valor: hacerlo
produciría cifras con apariencia de oficiales pero no verificables, que es
exactamente lo que el encargo prohíbe.

**Qué sí se ha entregado:** el pipeline completo y probado que rellena los
bloques 1 y 2 (ECB MIR + tipos oficiales BCE) en una sola orden en cuanto
haya red. Ver `README.md`.

**Cómo desbloquear:** la política de red se elige al crear el entorno de
ejecución remoto. Hay que recrearlo con acceso a los dominios de la tabla
(o con política sin restricción). Documentación:
https://code.claude.com/docs/en/claude-code-on-the-web

**Nota sobre WebSearch:** la búsqueda web sí funciona en este entorno, pero
devuelve resúmenes generados sobre fragmentos, no el dato primario. Se ha
usado **sólo** para confirmar identificadores de series y estructura de
claves SDMX (metadatos), nunca para extraer valores. Un tipo de interés
leído de un resumen de buscador no es trazable a período, unidad ni
criterio de ponderación, y es precisamente donde se cuela la confusión
nivel / porcentaje neto que el encargo advierte.

---

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

## 3. Estado de las decisiones

| # | Asunto | Estado |
|---|---|---|
| 1 | Acceso de red a las fuentes | **Resuelto**: se recreará el entorno con política de red abierta a los dominios de `entorno_red.md`. Pendiente de ejecución por parte del usuario. |
| 2 | Tratamiento de `/hipotecas` | **Resuelto**: sólo inmueble comercial vía EBA Transparency Exercise (ver §2.1). Pipeline en `scripts/eba_te_cre.py`. |
| 3 | Alcance de `/prestamos_personales` | **Abierto**: hoy recoge préstamo a empresa por tramo de importe *y* crédito al consumo a hogares (proxy de autónomos). Confirmar si se mantienen ambos. |
| 4 | Ventana temporal | **Abierto**: el pipeline usa `--desde 2022-01` por defecto. |
