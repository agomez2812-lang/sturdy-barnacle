# entorno_red.md — configurar el acceso de red del entorno

El entorno actual bloquea las 9 fuentes (0/15 alcanzables). **No hace falta
crear un entorno nuevo: basta con editar el que ya usas.**

## Pasos

1. En [claude.ai/code](https://claude.ai/code), pulsa el **icono de nube con
   el nombre del entorno actual**, en la fila justo encima del cuadro de
   mensaje. Es el selector de entornos; no hay página de ajustes ni URL
   directa para llegar a él.
2. Pasa el ratón por encima del entorno y pulsa el **icono de ajustes** que
   aparece a la derecha. (O **Add cloud environment** si prefieres uno nuevo
   y dejar el actual intacto.)
3. En **Network access**, elige nivel. Hay cuatro:

   | Nivel | Qué permite |
   |---|---|
   | **None** | Sin salida de red |
   | **Trusted** | Solo la lista por defecto: registros de paquetes, GitHub, SDK de nube. **Es la que tenemos ahora** y por eso falla todo |
   | **Full** | Cualquier dominio |
   | **Custom** | Tu propia lista, opcionalmente además de la de por defecto |

4. Guarda.

## Qué nivel elegir

**Recomendado para este trabajo: `Full`.** Son fuentes estadísticas públicas
y webs de relación con inversores, sin nada sensible, y los PDF de resultados
se sirven desde CDN propios de cada banco que no se pueden prever de
antemano. Con `Custom` es muy probable acabar añadiendo dominios a mano cada
vez que falle una descarga.

Si prefieres la opción estricta, elige **`Custom`**, pega la lista de abajo
(un dominio por línea) y **marca la casilla «Also include default list of
common package managers»**. Si la dejas sin marcar se permite *sólo* lo que
listes y se rompen pip, npm y demás. Se admite comodín de subdominio con
`*.` delante, por ejemplo `*.ecb.europa.eu`.

## Importante

- El cambio afecta a **las sesiones que arranques después**. Esta sesión
  seguirá sin salida aunque guardes ahora: hay que **abrir una sesión nueva**
  sobre la rama `claude/pyme-banking-profitability-eu-hi18bh`.
- GitHub va por un proxy aparte y funciona en cualquier nivel, así que el
  repo se clona igual.

## Lista para el modo Custom

## Imprescindibles (bloques 1–6, automatizables o semi)

```
*.ecb.europa.eu               # bloques 1 y 2: API SDMX, portal, SAFE
*.eba.europa.eu               # bloques 3 y 4: Risk Dashboard, Transparency Exercise
*.oecd.org                    # bloque 5: Scoreboard PYME (incl. sdmx. y stats.)
euf.eu.com                    # bloque 6: EU Federation for Factoring
fci.nl                        # bloque 6: FCI Annual Review
*.bde.es                      # bloque 9: Boletín Estadístico
```

## Comparables banco a banco (bloques 7 y 8)

```
*.commerzbank.com             # Corporate Clients
*.caixabank.com
*.grupbancsabadell.com
*.intesasanpaolo.com
*.bper.it
*.bnpparibas                  # BNP Paribas IR y BNP Paribas Factor
*.societegenerale.com
*.ing.com
*.abnamro.com
*.santander.com               # Santander Factoring y Confirming
```

Los PDF de resultados suelen servirse desde CDN propios de cada banco, que
no siempre están bajo el dominio principal. Si una descarga falla aun con el
dominio permitido, `check_fuentes.py` lo señala y hay que añadir el CDN
concreto a mano. Es la razón principal para preferir `Full` aquí.

## Orden de trabajo una vez abierto

```bash
python3 scripts/check_fuentes.py                    # verificar acceso
python3 scripts/ecb_mir_harvest.py --desde 2025-01  # bloques 1 y liquidez
# después: SAFE, EBA, OCDE, EUF/FCI y comparables, según fuentes.md
```
