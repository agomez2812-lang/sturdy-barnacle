#!/usr/bin/env python3
"""Descompone la densidad de RWA de PYME en sus dos inputs: PD y LGD.

La densidad IRB observada de un pais no dice por que es baja. Aqui se mete
la PD y la LGD observadas de cada pais en la FORMULA IRB de empresas del
art. 153 del CRR y se compara la ponderacion que predice con la densidad
que realmente se observa. Eso permite separar tres cosas:

  CANAL PD    seleccion: a quien se presta
  CANAL LGD   garantia y recobro: cuanto se recupera si falla
  RESIDUO     lo que la formula NO explica con esos dos parametros

Importa el matiz porque bajo IRB la garantia NO es una alternativa al
modelo: entra DENTRO del modelo, por la LGD. La pregunta separable no es
"modelo o garantia", es "PD o LGD".

Formula (art. 153 CRR, exposiciones frente a empresas, con ajuste PYME):

    R = 0,12 k + 0,24 (1-k),  k = (1-e^(-50 PD)) / (1-e^(-50))
    R -= 0,04 (1 - (S-5)/45)                      ajuste por tamano, art. 153.4
    b = (0,11852 - 0,05478 ln PD)^2
    K = [LGD N( (1-R)^-0,5 G(PD) + (R/(1-R))^0,5 G(0,999) ) - PD LGD]
        x (1 + (M-2,5) b) / (1 - 1,5 b)
    RW = 12,5 K x factor de apoyo a PYME (art. 501 CRR, 0,7619)

SUPUESTOS DECLARADOS, que no salen de ningun dato: facturacion S = 25 M EUR
y vencimiento efectivo M = 2,5 anos. Se publica la sensibilidad a los dos.

LIMITACION IMPORTANTE: la PD y la LGD del COREP C 9.02 son MEDIANAS de
entidades declarantes, mientras que la densidad es una media PONDERADA POR
VOLUMEN del Transparency Exercise. Parte del residuo es esa asimetria y no
comportamiento del modelo. No se puede separar con lo publicado.

Uso:
    python3 scripts/descomposicion_rwa.py
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import schema  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(ROOT, "transversal", "descomposicion_rwa.csv")
URL = ("https://www.eba.europa.eu/risk-and-data-analysis/risk-analysis/"
       "eu-wide-transparency-exercise")
S_FACT, M_VENC, FACTOR_PYME = 25.0, 2.5, 0.7619
LARGO = {"España": "Espana", "P. Bajos": "Paises Bajos"}
CLAVE = {"España": "Espana", "P. Bajos": "P. Bajos"}


def ninv(p):
    """Inversa de la normal estandar (Acklam, error < 1,15e-9)."""
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    if p < 0.02425:
        q = math.sqrt(-2 * math.log(p))
        return ((((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])
                / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1))
    if p > 1 - 0.02425:
        q = math.sqrt(-2 * math.log(1 - p))
        return -((((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])
                 / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1))
    q, r = p - 0.5, (p - 0.5) ** 2
    return ((((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q
            / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1))


def ncdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def rw(pd, lgd, s=S_FACT, m=M_VENC, factor=FACTOR_PYME):
    """Ponderacion IRB en %, con PD y LGD en tanto por uno."""
    k = (1 - math.exp(-50 * pd)) / (1 - math.exp(-50))
    r = 0.12 * k + 0.24 * (1 - k)
    r -= 0.04 * (1 - (min(max(s, 5.0), 50.0) - 5) / 45)
    b = (0.11852 - 0.05478 * math.log(pd)) ** 2
    cap = (lgd * ncdf(((1 - r) ** -0.5) * ninv(pd)
                      + ((r / (1 - r)) ** 0.5) * ninv(0.999)) - pd * lgd)
    cap *= (1 + (m - 2.5) * b) / (1 - 1.5 * b)
    return cap * 12.5 * factor * 100


def main():
    D = json.load(open(os.path.join(ROOT, "pres", "datos.json"), encoding="utf-8"))
    dens = json.load(open(os.path.join(ROOT, "pres", "dens_sa_irb.json"),
                          encoding="utf-8"))
    P = D["paises"]
    pd_, lgd = D["irb"]["pd"], D["irb"]["lgd"]
    rec, npl = D["marco"]["recovery"], D["npl_seg"]["pyme"]
    ix = {p: i for i, p in enumerate(P)}

    hoy = time.strftime("%Y-%m-%d")
    if os.path.exists(SALIDA):
        os.remove(SALIDA)
    fh, w = schema.writer(SALIDA)
    filas, n = [], 0
    for i, p in enumerate(P):
        d = dens[CLAVE.get(p, p)]
        pred = rw(pd_[i] / 100, lgd[i] / 100)
        f = {"pais": p, "pd": pd_[i], "lgd": lgd[i], "formula": round(pred, 1),
             "irb": d["irb"], "sa": d["sa"], "total": d["total"],
             "cuota_irb": d["cuota_irb"], "residuo": round(d["irb"] - pred, 1),
             "recuperacion": rec[i], "npl": npl[i],
             "fibr": abs(lgd[i] - 40.0) < 0.05}
        filas.append(f)
        base = dict(pais=LARGO.get(p, p), producto="pyme_total",
                    periodo_referencia="2026-Q1", url=URL,
                    fecha_publicacion=hoy,
                    criterio_segmentacion="pyme_interna_banco",
                    tipo_de_dato="ratio", ponderacion="dato_unico")
        for met, val, fu, nota in [
            ("Ponderacion IRB que predice la formula del art. 153 CRR", pred,
             "Calculo propio sobre EBA (COREP C 9.02), formula del art. 153 CRR",
             "con la PD y la LGD observadas del pais; facturacion %.0f M EUR, "
             "vencimiento %.1f anos y factor de apoyo a PYME %.4f. SUPUESTOS "
             "declarados, no datos" % (S_FACT, M_VENC, FACTOR_PYME)),
            ("Residuo: densidad IRB observada menos la que predice la formula",
             d["irb"] - pred,
             "Calculo propio sobre EBA (Transparency Exercise y COREP C 9.02)",
             "negativo = el agregado pondera MENOS de lo que la formula da con "
             "los parametros medianos. Ojo: PD y LGD son medianas de entidades "
             "y la densidad es media ponderada por volumen; parte del residuo "
             "es esa asimetria"),
        ]:
            w.writerow(schema.row(metrica=met, valor="%.2f" % val,
                                  unidad="pct_rwa", fuente=fu, notas=nota,
                                  **base)); n += 1

    # --- descomposicion PD / LGD de cada pais frente a Espana ---
    pes, les = pd_[ix["España"]] / 100, lgd[ix["España"]] / 100
    for i, p in enumerate(P):
        if p == "España":
            continue
        pp, ll = pd_[i] / 100, lgd[i] / 100
        base_rw = rw(pp, ll)
        total = rw(pes, les) - base_rw
        c_pd = rw(pes, ll) - base_rw
        c_lgd = rw(pp, les) - base_rw
        f = next(x for x in filas if x["pais"] == p)
        # El reparto en PORCENTAJE solo tiene sentido cuando los dos canales
        # empujan en el mismo sentido que la brecha. Si se compensan entre si,
        # la brecha total se acerca a cero y el porcentaje se dispara a
        # cifras absurdas (Francia daria -195 % y +313 %). En esos casos se
        # publican los canales en PUNTOS y el porcentaje se deja vacio.
        coherente = (total != 0 and (c_pd > 0) == (total > 0)
                     and (c_lgd > 0) == (total > 0))
        f.update(brecha=round(total, 1), c_pd=round(c_pd, 1),
                 c_lgd=round(c_lgd, 1),
                 pct_pd=round(100 * c_pd / total) if coherente else None,
                 pct_lgd=round(100 * c_lgd / total) if coherente else None,
                 compensan=not coherente)
        for met, val, nota in [
            ("Brecha de ponderacion frente a Espana | canal PD", c_pd,
             "cuanto subiria la ponderacion del pais si tuviera la PD espanola "
             "con su propia LGD"),
            ("Brecha de ponderacion frente a Espana | canal LGD", c_lgd,
             "cuanto subiria si tuviera la LGD espanola con su propia PD"),
        ]:
            w.writerow(schema.row(
                pais=LARGO.get(p, p), producto="pyme_total", metrica=met,
                valor="%.2f" % val, unidad="pct_rwa",
                periodo_referencia="2026-Q1",
                fuente="Calculo propio sobre EBA (COREP C 9.02), formula del "
                       "art. 153 CRR",
                url=URL, fecha_publicacion=hoy,
                criterio_segmentacion="pyme_interna_banco",
                tipo_de_dato="ratio", ponderacion="dato_unico",
                notas=nota)); n += 1
    fh.close()

    # --- sensibilidad del reparto a los dos supuestos ---
    nl = ix["P. Bajos"]
    pnl, lnl = pd_[nl] / 100, lgd[nl] / 100
    sens = []
    for s_, m_, et in ((25, 2.5, "25 M EUR y 2,5 anos (el usado)"),
                       (5, 2.5, "5 M EUR (micro)"), (50, 2.5, "50 M EUR (mediana)"),
                       (25, 1.0, "vencimiento 1 ano"), (25, 5.0, "vencimiento 5 anos")):
        b0 = rw(pnl, lnl, s_, m_)
        t = rw(pes, les, s_, m_) - b0
        sens.append({"caso": et, "total": round(t, 1),
                     "pct_pd": round(100 * (rw(pes, lnl, s_, m_) - b0) / t),
                     "pct_lgd": round(100 * (rw(pnl, les, s_, m_) - b0) / t)})

    print("Ponderacion IRB: lo que predice la formula frente a lo observado\n")
    print("%-11s %6s %7s %10s %10s %9s | %8s %9s" % (
        "pais", "PD", "LGD", "formula", "IRB obs.", "residuo", "recup.", "NPL PYME"))
    for f in filas:
        print("%-11s %5.2f%% %6.1f%% %9.1f%% %9.1f%% %+8.1f | %6.1f cts %7.2f%%"
              % (f["pais"], f["pd"], f["lgd"], f["formula"], f["irb"],
                 f["residuo"], f["recuperacion"], f["npl"]))
    print("\nBrecha frente a Espana, repartida entre los dos canales:")
    print("%-11s %9s %9s %9s" % ("pais", "brecha", "por PD", "por LGD"))
    print("%-11s %9s %9s %9s %9s %9s" % ("", "", "pp", "pp", "%", "%"))
    for f in filas:
        if "brecha" in f:
            pc = ("%6d %% %6d %%" % (f["pct_pd"], f["pct_lgd"])
                  if f["pct_pd"] is not None else "   se compensan")
            print("%-11s %+8.1f %+8.1f %+8.1f %s" % (
                f["pais"], f["brecha"], f["c_pd"], f["c_lgd"], pc))
    print("\nSensibilidad del reparto de P. Bajos a los supuestos:")
    for x in sens:
        print("   %-32s total %+5.1f · PD %2d %% · LGD %2d %%" % (
            x["caso"], x["total"], x["pct_pd"], x["pct_lgd"]))
    fibr = [f["pais"] for f in filas if f["fibr"]]
    if fibr:
        print("\nLGD de exactamente 40,00 %% (valor supervisor del IRB basico, "
              "art. 161 CRR): %s" % ", ".join(fibr))
    print("\n%d filas -> %s" % (n, SALIDA))

    json.dump({"filas": filas, "sens": sens,
               "supuestos": {"S": S_FACT, "M": M_VENC, "factor": FACTOR_PYME}},
              open(os.path.join(ROOT, "pres", "descomposicion_rwa.json"), "w"),
              indent=1, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
