/* Cinco laminas SUELTAS, para intercalar donde convenga en el deck
   principal. No es una presentacion: no lleva portada, separadores ni
   cierre, y no va numerada, porque su numero depende de donde se inserte.

   1. La prima PYME espanola se ha evaporado        -> bloque 1 (precio)
   2. La tasa de rechazo de la SAFE                 -> bloque 1 (apetito)
   3. Reconciliacion del ROE PYME con el de grupo   -> bloque 2 (bancos ES)
   4. Densidad de RWA: estandar frente a IRB        -> bloque 1 (capital)
   5. Irlanda en factoring: el dato esta congelado  -> anexos (limites)
   6. Comparables en % de la inversion               -> sustituye a la lamina 16
   7. Se paga el riesgo? Dos nubes                   -> bloque 1, tras la 18
   8. Observaciones: Espana                          -> sustituye a la lamina 50
   9. Densidad de RWA abierta en PD y LGD            -> bloque 1, tras la 10
  10. Supuestos del ROE: fuente y perimetro          -> anexos, junto a Fuentes

   Todos los numeros salen de pres/adicionales.json, que a su vez lo
   construye scripts/datos_adicionales.py desde los CSV del repositorio.
*/
const pptxgen = require("pptxgenjs");
const {sistema} = require("./visual.js");
const A = require("./adicionales.json");
/* toFixed devuelve un guion ASCII; el resto del deck usa el menos «−» */
const men = (v,d)=>(v>0?"+":"")+v.toFixed(d).replace(".",",").replace("-","−");
const CR = require("./comparables_ratios.json");
const MP = require("./mapa_info_margen.json");
const D  = require("./datos.json");
const DR = require("./descomposicion_rwa.json");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Analisis PYME Europa";
const V = sistema(pres);
const {PRIM,DARK,G1,G2,G3,LIGHT,PAPEL,YEL,YEL2,YEL3,BLUE,BLUE3,MAG,MAG3,
       ORA2,ORA3,OK,MED,BAD,ACC,TXT,MUT,HF,BF,W,H,M,
       n1,sg2,nueva,titulo,fuente,nota,chip,hdr,cel,tOpt} = V;

const PA = ["España","Alemania","Francia","Italia","Portugal","P. Bajos","Irlanda"];
/* adicionales.json viene sin tildes (esquema de los CSV); se traduce aqui */
const K  = p => p==="España" ? "Espana" : p;
/* sg2 redondea a un decimal y convierte −0,03 en «−0,0»: para la prima,
   que se mueve en centesimas de punto, hacen falta dos. */
const sg2d = v => (v>0?"+":(v<0?"−":"")) + n1(Math.abs(v),2);

const L = {};
/* ninguna lamina lleva numero: van sueltas */
const hoja = () => nueva({sinNumero:true});

/* ------------------------------------------------------------------ 1 */
L.prima = () => {const s=hoja();
 titulo(s,"La prima PYME española se ha evaporado",
   "Diferencial de tipo entre el préstamo pequeño y el grande, préstamos a sociedades no financieras · Media anual ponderada por volumen de nueva producción · Fijación inicial total · Sin comisiones");
 const E=A.prima.estrecha, AM=A.prima.amplia, an=E.anios;
 s.addChart(pres.ChartType.line, PA.map(p=>({name:p, labels:an, values:E.serie[K(p)].anual})),
   {x:M, y:1.82, w:7.55, h:3.72,
    chartColors:[PRIM,G2,BLUE,MAG,ORA2,"6FBF9B",G3],
    lineSize:2.4, lineDataSymbol:"circle", lineDataSymbolSize:5,
    showTitle:false, showLegend:true, legendPos:"b", legendFontSize:9.5,
    catAxisLabelColor:TXT, catAxisLabelFontSize:10.5,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0.0" pp"',
    valAxisMinVal:-0.4, valAxisMaxVal:1.8,
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});
 /* panel derecho: las dos definiciones */
 s.addShape(pres.ShapeType.roundRect,{x:8.42, y:1.82, w:4.23, h:2.72, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Dos definiciones, misma conclusión",{x:8.62, y:1.93, w:3.85, h:0.30,
   fontFace:HF, fontSize:12.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Prima de los últimos 12 meses, en pp",{x:8.62, y:2.22, w:3.85, h:0.22,
   fontFace:BF, fontSize:8, color:MUT, isTextBox:true, margin:0});
 const f=[[{text:"", options:Object.assign({},hdr,{fontSize:8})},
           {text:"≤0,25 M€\nvs >1 M€", options:Object.assign({},hdr,{fontSize:8})},
           {text:"≤1 M€\nvs >1 M€", options:Object.assign({},hdr,{fontSize:8})}]];
 PA.forEach(p=>{const e=E.serie[K(p)].u12, a=AM.serie[K(p)].u12;
   const es = p==="España";
   f.push([{text:p, options:cel(null,{align:"left", fontSize:9, bold:es,
              color:es?ACC:TXT})},
           {text:sg2d(e), options:cel(null,{fontSize:9, bold:es,
              color:e<0.1?ACC:TXT, fill:{color:es?YEL3:"FFFFFF"}})},
           {text:sg2d(a), options:cel(null,{fontSize:9, bold:es,
              color:a<0.1?ACC:TXT, fill:{color:es?YEL3:"FFFFFF"}})}]);});
 s.addTable(f,{x:8.62, y:2.46, w:3.85, colW:[1.55,1.15,1.15], rowH:0.238,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});

 nota(s,8.42,4.66,4.23,1.80,"Dejamos de cobrar por el tamaño",
   "España es el único de los siete donde la prima llega a cero: de "+sg2d(E.serie.Espana.anual[0])+
   " pp en 2022 a "+sg2d(E.serie.Espana.u12)+" pp en los últimos 12 meses. "+
   E.serie.Espana.neg+" de los "+E.serie.Espana.n+" meses de la serie tienen prima NEGATIVA: el préstamo pequeño sale más barato que el grande. "+
   "Italia va en sentido contrario ("+sg2d(A.prima.estrecha.serie.Italia.anual[0])+" → "+sg2d(A.prima.estrecha.serie.Italia.u12)+" pp).");

 s.addText("Es una prima de tamaño de OPERACIÓN, no de tamaño de empresa: el MIR segmenta por importe del préstamo. Un préstamo de 800.000 € a una empresa grande cuenta como «pequeño».",
   {x:M, y:5.62, w:7.55, h:0.70, fontFace:BF, fontSize:9.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"BCE, MIR (ECB Data Portal), enero 2022 a julio 2026. Media anual del diferencial mensual, ponderada por el volumen de nueva producción de los dos tramos. Serie completa en prestamos_personales/prima_pyme.csv.");
};

/* ------------------------------------------------------------------ 2 */
L.rechazo = () => {const s=hoja();
 titulo(s,"Cuánto crédito se deniega: la tasa de rechazo de la SAFE",
   "Empresas de menos de 250 empleados que solicitaron un préstamo bancario y fueron rechazadas, en % de las que solicitaron · Segunda mitad de 2025");
 const R=A.rechazo.datos, PZ=PA.concat(["Zona euro (referencia)"]);
 const etiq=PZ.map(p=>p==="Zona euro (referencia)"?"Zona euro":p);
 s.addChart(pres.ChartType.bar, [{name:"Tasa de rechazo", labels:etiq,
     values:PZ.map(p=>R[K(p)].rechazo)}],
   {x:M, y:1.80, w:7.55, h:2.35, barDir:"col",
    chartColors:PZ.map(p=>p==="España"?PRIM:(p==="Zona euro (referencia)"?G3:G2)),
    varyColors:true, showTitle:false, showValue:true, dataLabelPosition:"outEnd",
    dataLabelFontSize:9, dataLabelColor:TXT, dataLabelFormatCode:'0.0"%"',
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:9.5,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"', valAxisMaxVal:16,
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});

 /* lo que el rechazo esconde */
 s.addText("Lo que la tasa de rechazo no ve: el resultado completo de la solicitud",
   {x:M, y:4.24, w:7.55, h:0.28, fontFace:HF, fontSize:12.5, bold:true, color:PRIM,
    isTextBox:true, margin:0});
 const cab=["","Obtuvo\ntodo","Obtuvo\nsolo parte","Rechazó por\ncoste alto","Fue\nrechazada","No obtuvo\ntodo"];
 const tb=[cab.map((c,i)=>({text:c, options:Object.assign({},hdr,{fontSize:8, align:i?"center":"left"})}))];
 /* «No obtuvo todo» = suma de las tres columnas visibles, para que la
    fila cuadre a la vista; equivale a 100 − obtuvo todo − pendiente
    salvo redondeo. */
 PA.forEach(p=>{const r=R[K(p)], not=Math.round((r.parcial+r.coste+r.rechazo)*10)/10;
   const es=p==="España";
   tb.push([{text:p, options:cel(null,{align:"left", fontSize:9, bold:es, color:es?ACC:TXT})},
     {text:n1(r.todo)+" %", options:cel(null,{fontSize:9})},
     {text:n1(r.parcial)+" %", options:cel(null,{fontSize:9})},
     {text:n1(r.coste)+" %", options:cel(null,{fontSize:9})},
     {text:n1(r.rechazo)+" %", options:cel(null,{fontSize:9, bold:true, fill:{color:es?YEL3:"FFFFFF"}})},
     {text:n1(not)+" %", options:cel(null,{fontSize:9, bold:true, color:DARK,
        fill:{color: not>25?MAG3:(not>18?ORA3:BLUE3)}})}]);});
 s.addTable(tb,{x:M, y:4.56, w:7.55, colW:[1.70,1.17,1.17,1.17,1.17,1.17], rowH:0.225,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});

 nota(s,8.42,1.80,4.23,2.35,"Rechazar y encarecer son sustitutos",
   "Alemania es la que menos rechaza ("+n1(R.Alemania.rechazo)+" %) y la que más raciona: "+
   n1(R.Alemania.parcial)+" % recibe solo una parte y "+n1(R.Alemania.coste)+
   " % renuncia porque el precio le parece alto. Entre las dos, un "+
   n1(R.Alemania.parcial+R.Alemania.coste+R.Alemania.rechazo)+" % no obtiene todo lo que pidió, casi el doble que en España. "+
   "Italia casi no rechaza ("+n1(R.Italia.rechazo)+" %) y es la que más prima de precio cobra.");
 nota(s,8.42,4.24,4.23,2.10,"Un semestre no es una tendencia",
   "La serie es muy volátil: Irlanda ha ido de "+n1(R.Irlanda.min)+" % a "+n1(R.Irlanda.max)+
   " % desde 2022 y Francia de "+n1(R.Francia.min)+" % a "+n1(R.Francia.max)+
   " %. La media de los tres últimos años deja a España en "+n1(R.Espana.media3a)+
   " %, en línea con la zona euro. Leer un dato suelto como señal estructural es un error.",
   ORA3);
 fuente(s,"BCE, encuesta SAFE, preguntas Q7B (resultado de la solicitud) y Q7A. Denominador: empresas que SOLICITARON ese instrumento, no el total de empresas; media ponderada. Las filas no suman 100 %: se omiten la solicitud aún pendiente y la respuesta «no sabe», que en Portugal y Francia pesan varios puntos. La SAFE segmenta por número de empleados (<250), no por importe del préstamo como el MIR: no son filas promediables. Datos en transversal/safe_rechazo.csv.");
};

/* ------------------------------------------------------------------ 3 */
L.reconciliacion = () => {const s=hoja();
 titulo(s,"Reconciliación: el ROE de PYME frente a la rentabilidad de grupo",
   "Por qué el ROE modelizado del segmento PYME España no es comparable sin más con el RoTE que titula cada banco · Datos a junio de 2025, beneficio anualizado");
 const R=A.rote;
 const cab=["Banco","ROE PYME\nEspaña (modelo)","ROE de grupo\nsobre CET1","RoTE de grupo\n(patr. tangible)",
            "Cuña por\ndenominador","Brecha\nPYME − grupo","Peso de la RWA\nPYME en el grupo"];
 const tb=[cab.map((c,i)=>({text:c, options:Object.assign({},hdr,{fontSize:8.5, align:i?"center":"left"})}))];
 R.forEach(r=>{const bk=r.banco==="Bankinter";
   tb.push([
     {text:r.banco, options:cel(null,{align:"left", fontSize:10.5, bold:bk, color:bk?ACC:TXT})},
     {text:n1(r.roe_pyme_modelo)+" %", options:cel(null,{fontSize:10.5, bold:true,
        fill:{color:bk?YEL3:"FFFFFF"}})},
     {text:n1(r.roe_grupo_cet1)+" %", options:cel(null,{fontSize:10.5})},
     {text:n1(r.rote_grupo)+" %", options:cel(null,{fontSize:10.5, color:MUT})},
     {text:n1(r.cuna_denominador)+" pp", options:cel(null,{fontSize:10.5, color:MUT})},
     {text:sg2(r.brecha_pyme_grupo)+" pp", options:cel(null,{fontSize:10.5, bold:true,
        color:DARK, fill:{color: r.brecha_pyme_grupo>0?BLUE3:(r.brecha_pyme_grupo<-5?MAG3:ORA3)}})},
     {text:n1(r.peso_rwa_pyme)+" %", options:cel(null,{fontSize:10.5})}]);});
 s.addTable(tb,{x:M, y:1.82, w:W-2*M, colW:[1.85,1.85,1.68,1.75,1.63,1.73,1.48],
   rowH:0.40, fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});

 const cajas=[
  ["Perímetro","El ROE modelizado es de la cartera PYME ESPAÑOLA. El RoTE de grupo incluye México, Brasil, Reino Unido y Turquía. Por eso la brecha de BBVA es de "+n1(Math.abs(R[3].brecha_pyme_grupo))+" pp: su grupo rinde más que su negocio PYME en España, no menos."],
  ["Denominador","El modelo divide por capital regulatorio asignado (CET1 % × RWA PYME). El RoTE divide por patrimonio neto tangible, que es mayor. A igual beneficio, dividir por CET1 sube el ratio entre "+n1(Math.min(...R.map(r=>r.cuna_denominador)))+" y "+n1(Math.max(...R.map(r=>r.cuna_denominador)))+" pp."],
  ["Cobertura de la cuenta","El modelo recoge margen, comisiones, gastos y coste del riesgo de la cartera. El resultado de grupo añade ROF, puesta en equivalencia, saneamientos extraordinarios y el gravamen a la banca."]];
 let y=4.32;
 cajas.forEach(c=>{
   s.addShape(pres.ShapeType.roundRect,{x:M, y:y, w:W-2*M, h:0.62, fill:{color:LIGHT},
     rectRadius:0.05, line:{color:G3}});
   s.addShape(pres.ShapeType.rect,{x:M, y:y, w:0.06, h:0.62, fill:{color:PRIM}, line:{color:PRIM}});
   s.addText(c[0],{x:M+0.22, y:y+0.07, w:2.30, h:0.28, fontFace:HF, fontSize:11,
     bold:true, color:PRIM, isTextBox:true, margin:0});
   s.addText(c[1],{x:M+2.60, y:y+0.06, w:W-2*M-2.85, h:0.50, fontFace:BF, fontSize:9,
     color:TXT, isTextBox:true, margin:0});
   y+=0.70;});

 s.addText("Para los tres bancos domésticos la brecha cabe en ±1,5 pp: el segmento PYME español rinde como el grupo. La lectura correcta de la tabla es esa, no el ranking.",
   {x:M, y:6.40, w:W-2*M, h:0.22, fontFace:BF, fontSize:9, bold:true, color:ACC,
    isTextBox:true, margin:0});
 fuente(s,"EBA, EU-wide Transparency Exercise 2025 (tr_oth.csv), periodo 202506: resultado atribuido (2520336), CET1 (2520102), patrimonio total (2521216), intangibles (2520110), RWA (2520138). El RoTE de la tabla es CÁLCULO PROPIO sobre el EBA, no la cifra titulada por cada banco: las páginas de relación con inversores no son accesibles desde este entorno (ver notas.md). ROE PYME: modelo propio, comparables_bancos/reconciliacion_rote.csv.", 7);
};

/* ------------------------------------------------------------------ 4 */
L.densidad = () => {const s=hoja();
 titulo(s,"El capital de la PYME no lo fija el riesgo, lo fija el modelo",
   "Densidad de RWA de la cartera PYME separando método estándar de IRB · Sistemas bancarios supervisados por cada país · Junio de 2025");
 const DZ=A.densidad;
 s.addChart(pres.ChartType.bar, [
   {name:"Método estándar", labels:PA, values:PA.map(p=>DZ[K(p)].sa)},
   {name:"Modelos internos (IRB)", labels:PA, values:PA.map(p=>DZ[K(p)].irb)}],
   {x:M, y:1.82, w:7.55, h:2.80, barDir:"col", chartColors:[G2,PRIM],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, dataLabelFormatCode:'0.0"%"',
    showLegend:true, legendPos:"b", legendFontSize:10,
    catAxisLabelColor:TXT, catAxisLabelFontSize:10,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"', valAxisMaxVal:90,
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});

 s.addText("Cuánto ahorra el IRB frente al estándar, y cuánta cartera lo usa",
   {x:M, y:4.70, w:7.55, h:0.26, fontFace:HF, fontSize:12, bold:true, color:PRIM,
    isTextBox:true, margin:0});
 const tb=[["","Ahorro del IRB","Cartera en IRB","Densidad total"].map((c,i)=>
   ({text:c, options:Object.assign({},hdr,{fontSize:8.5, align:i?"center":"left"})}))];
 PA.forEach(p=>{const r=DZ[K(p)], es=p==="España";
   tb.push([{text:p, options:cel(null,{align:"left", fontSize:9, bold:es, color:es?ACC:TXT})},
     {text:n1(r.ahorro)+" pp", options:cel(null,{fontSize:9, bold:true, color:DARK,
        fill:{color: r.ahorro<15?MAG3:(r.ahorro<28?ORA3:BLUE3)}})},
     {text:n1(r.cuota_irb)+" %", options:cel(null,{fontSize:9, fill:{color:es?YEL3:"FFFFFF"}})},
     {text:n1(r.total)+" %", options:cel(null,{fontSize:9, fill:{color:es?YEL3:"FFFFFF"}})}]);});
 s.addTable(tb,{x:M, y:5.02, w:7.55, colW:[2.11,1.82,1.82,1.80], rowH:0.18,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});

 nota(s,8.42,1.82,4.23,2.35,"El IRB español apenas ahorra",
   "En España el modelo interno rebaja la densidad solo "+n1(DZ.Espana.ahorro)+
   " pp ("+n1(DZ.Espana.sa)+" % → "+n1(DZ.Espana.irb)+" %). En Alemania la rebaja "+
   n1(DZ.Alemania.ahorro)+" pp. La densidad IRB española ("+n1(DZ.Espana.irb)+
   " %) es la segunda más alta de los siete, solo por detrás de Irlanda, y está por encima de la densidad TOTAL de Alemania ("+
   n1(DZ.Alemania.total)+" %), Francia ("+n1(DZ.Francia.total)+" %) o Italia ("+n1(DZ.Italia.total)+
   " %): el banco español con modelo aprobado consume más capital que el alemán medio.");
 nota(s,8.42,4.30,4.23,2.04,"Los "+n1(DZ.Alemania.brecha_es)+" pp frente a Alemania",
   "Solo "+n1(DZ.Alemania.por_mix)+" pp vienen de tener menos cartera en IRB ("+
   n1(DZ.Espana.cuota_irb)+" % frente a "+n1(DZ.Alemania.cuota_irb)+" %). "+
   n1(DZ.Alemania.por_calibracion)+" pp vienen de la CALIBRACIÓN de los modelos y "+
   n1(DZ.Alemania.interaccion)+" pp de la interacción de las dos cosas. "+
   "No es un problema de volumen modelizado: es un problema de qué devuelve el modelo.", ORA3);
 fuente(s,"EBA, EU-wide Transparency Exercise 2025 (tr_cre.csv), junio 2025, dimensión Portfolio (1 = estándar, 2 = IRB), partidas 2520523 (valor de exposición PYME) y 2520533 (RWA PYME), contraparte total. Densidad = RWA / valor de exposición. Descomposición propia. Datos en transversal/eba_te_pyme_sa_irb.csv.");
};

/* ------------------------------------------------------------------ 5 */
L.factoring_ie = () => {const s=hoja();
 titulo(s,"Irlanda en factoring: el dato está congelado, no es un mercado plano",
   "Volumen cedido anual publicado por la EU Federation for Factoring · La serie irlandesa repite el mismo importe desde 2021");
 const F=A.factoring, ie=F.Irlanda;
 const desde=2015, idx=ie.anios.map((a,i)=>i).filter(i=>ie.anios[i]>=desde);
 const lab=idx.map(i=>String(ie.anios[i]));
 s.addChart(pres.ChartType.line, [
   {name:"Irlanda", labels:lab, values:idx.map(i=>ie.valores[i])}],
   {x:M, y:1.82, w:7.55, h:2.85, chartColors:[PRIM], lineSize:2.6,
    lineDataSymbol:"circle", lineDataSymbolSize:7,
    showTitle:false, showValue:true, dataLabelPosition:"t", dataLabelFontSize:8,
    dataLabelColor:TXT, dataLabelFormatCode:'#,##0',
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:10,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'#,##0',
    valAxisMinVal:18000, valAxisMaxVal:32000,
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});
 s.addText("Volumen cedido, millones de euros",{x:M, y:4.70, w:4.0, h:0.24,
   fontFace:BF, fontSize:8.5, color:MUT, isTextBox:true, margin:0});

 /* la banda congelada */
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.02, w:7.55, h:1.30, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addShape(pres.ShapeType.rect,{x:M, y:5.02, w:0.07, h:1.30, fill:{color:PRIM}, line:{color:PRIM}});
 s.addText("Desde 2017 la EUF solo ha publicado "+ie.distintos+" importes distintos para Irlanda",
   {x:M+0.24, y:5.12, w:7.1, h:0.28, fontFace:HF, fontSize:12, bold:true, color:DARK,
    isTextBox:true, margin:0});
 s.addText("26.294 en 2017 y 2018 · 28.424 en 2019 y 2020 · "+
   Math.round(ie.ultimo).toLocaleString("es-ES")+" en 2021, 2022, 2023, 2024 y 2025. "+
   ie.congelado+" años consecutivos con el mismo número. La variación anual que publica la tabla es 0,0 % por construcción, no por comportamiento del mercado.",
   {x:M+0.24, y:5.44, w:7.1, h:0.78, fontFace:BF, fontSize:9.5, color:TXT, isTextBox:true, margin:0});

 nota(s,8.42,1.82,4.23,2.22,"La propia EUF lo advierte",
   "La tabla marca a Irlanda con la nota (3): «Estimates of the turnover — the previous year's turnover implemented». Es decir, se arrastra el importe del año anterior. Y la serie histórica la etiqueta como «EUF member till 2018»: desde 2019 no hay asociación nacional que reporte el dato irlandés.");
 nota(s,8.42,4.12,4.23,2.20,"Qué no se puede decir con este dato",
   "No se puede leer el nivel irlandés como medida del mercado, ni su crecimiento (es cero por construcción), ni su cuota europea (1,1 %), ni su penetración sobre el PIB (4,5 %, la menor de los siete), porque el numerador está congelado y el denominador no. Irlanda debe salir de cualquier ranking de factoring o llevar la marca del arrastre.",
   ORA3);
 fuente(s,"EUF, EU Federation for Factoring: tabla anual a 31 de diciembre de 2025 y fichero «EU Turnover per country since 2007». Mismo arrastre, con menos años, en Estonia, Finlandia, Luxemburgo, Malta y Suecia. Serie completa en factoring_confirming/euf_historico.csv.");
};

/* ------------------------------------------------------------------ 6 */
/* Sustituye a la lamina 16 del deck, que daba las mismas cuentas en
   importes absolutos y por tanto no se podian comparar ni entre bancos ni
   con la cuenta del prestamo PYME de la lamina 7. */
L.comparables_ratios = () => {const s=hoja();
 titulo(s,"Lo que publican los bancos, en % de la inversión",
   "Las mismas cuentas de la lámina anterior divididas por la inversión crediticia de su propio perímetro y anualizadas · Commerzbank publica trimestre (×4), el resto semestre (×2)");
 const cab=["Banco","País","Perímetro publicado","Inversión\nM€","Ingresos","M. intereses",
            "Comisiones","Costes","Coste riesgo","BAI"];
 const nd=(v,d)=>v==null?"n/d":(n1(v,d===undefined?2:d)+(d===0?" pb":" %"));
 const tb=[cab.map((c,i)=>({text:c, options:Object.assign({},hdr,
    {fontSize:8.5, align:i<3?"left":"center", fill:{color: c==="Comisiones"?DARK:PRIM}})}))];
 CR.forEach(r=>{
   const seg=r.es_segmento;
   tb.push([
    {text:r.banco, options:cel(null,{align:"left", fontSize:9.5, bold:true})},
    {text:r.pais==="Espana"?"España":r.pais,
       options:cel(null,{align:"left", fontSize:9.5, color:MUT})},
    {text:r.segmento, options:cel(null,{align:"left", fontSize:9,
       color: seg?ACC:MUT, italic:!seg})},
    {text:Math.round(r.inversion).toLocaleString("es-ES"),
       options:cel(null,{fontSize:9.5, color:MUT})},
    {text:nd(r.ingresos), options:cel(null,{fontSize:9.5})},
    {text:nd(r.mi),       options:cel(null,{fontSize:9.5})},
    {text:nd(r.comisiones), options:cel(null,{fontSize:10, bold:true, color:DARK,
       fill:{color: r.comisiones==null?"FFFFFF":(seg?YEL:YEL3)}})},
    {text:nd(r.costes),   options:cel(null,{fontSize:9.5})},
    {text:nd(r.cor,0),    options:cel(null,{fontSize:9.5})},
    {text:nd(r.resultado),options:cel(null,{fontSize:9.5})}]);});
 s.addTable(tb,{x:M, y:1.82, w:W-2*M,
   colW:[1.55,1.00,2.05,1.25,1.05,1.05,1.15,1.00,0.92,0.95], rowH:0.34,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 [["perímetro = segmento de empresas publicado",YEL],
  ["perímetro = grupo, no segmento",YEL3]].forEach((l,i)=>{
   s.addShape(pres.ShapeType.rect,{x:M+i*4.55, y:4.02, w:0.16, h:0.16,
     fill:{color:l[1]}, line:{color:G3}});
   s.addText(l[0],{x:M+0.24+i*4.55, y:3.96, w:4.2, h:0.26, fontFace:BF,
     fontSize:8.5, color:MUT, isTextBox:true, margin:0});});

 const sup=0.87;
 const segs=CR.filter(r=>r.es_segmento && r.comisiones!=null);
 nota(s,M,4.36,5.82,1.92,"El supuesto de 87 pb no infla el modelo",
   "La cuenta de la lámina 7 supone "+n1(sup,2)+" % de comisiones sobre el saldo medio. Los dos únicos segmentos de empresas publicados ganan MÁS: "+
   segs.map(r=>r.banco+" "+n1(r.comisiones,2)+" %").join(" y ")+
   ". El supuesto está en el extremo bajo de lo que una franquicia de banca de empresas cobra por euro prestado, así que no está regalando ROE al modelo.");
 nota(s,M+6.15,4.36,5.82,1.92,"«Ingresos / inversión» NO es un margen de préstamo",
   "El numerador es el ingreso de TODO el segmento -margen de depósitos y transaccional incluidos- y el denominador solo los préstamos. Banca dei Territori lo enseña en caricatura: "+
   n1(CR[2].ingresos,2)+" % sobre préstamos, porque lleva dentro gestión de activos y seguros. Por eso BPER, que es grupo, dobla en comisiones ("+
   n1(CR[4].comisiones,2)+" %) a los segmentos de empresas.", ORA3);
 fuente(s,"Comunicado Q2 2026 de Commerzbank; informe intermedio Q2 2026 de ABN AMRO; resultados 1S26 de Intesa Sanpaolo e informe semestral a 30-jun-2026 (p. 72) para los préstamos de Banca dei Territori; Actividad y Resultados 1S26 de CaixaBank; resultados 1S26 de BPER e informe intermedio consolidado a 30-jun-2026 (p. 34) para los préstamos. Denominador: cartera media en Commerzbank; media de los dos cierres en Intesa y BPER; saldo final en ABN AMRO y CaixaBank. CaixaBank lo publica BRUTO y el resto NETO: con su mora del 1,78 %, el neto subiría sus ratios uno o dos puntos básicos. Datos en comparables_bancos/comparables_ratios.csv.", 7);
};


/* ------------------------------------------------------------------ 7 */
/* Dos dispersiones con el MISMO eje vertical -el coste del riesgo- para
   que se lean como dos respuestas a la misma pregunta: quien acaba
   pagando el riesgo y que lo explica.
   Se dibuja con formas y no con addChart porque pptxgenjs comparte el eje
   X entre series y no deja un punto por pais con su propia X. */
L.riesgo_nubes = () => {const s=hoja();
 titulo(s,"¿Se paga el riesgo? ¿Lo compra la información?",
   "Coste del riesgo PD × LGD de la cartera PYME contra el margen bruto y contra la información disponible · Un punto por país · 2026");

 const Y0=2.42, Y1=5.00, CMIN=0.25, CMAX=0.85;
 const py = c => Y1 - (c-CMIN)/(CMAX-CMIN)*(Y1-Y0);

 /* --- un panel --- */
 function panel(X0, X1, campo, xmin, xmax, ticks, fmt, cabecera, sub, ET){
   const px = v => X0 + (v-xmin)/(xmax-xmin)*(X1-X0);
   s.addText(cabecera,{x:X0-0.72, y:1.74, w:(X1-X0)+0.72, h:0.26, fontFace:HF,
     fontSize:12.5, bold:true, color:PRIM, isTextBox:true, margin:0});
   s.addShape(pres.ShapeType.rect,{x:X0, y:Y0, w:X1-X0, h:Y1-Y0,
     fill:{color:"FFFFFF"}, line:{color:G3, width:0.75}});
   [0.3,0.4,0.5,0.6,0.7,0.8].forEach(v=>{
     s.addShape(pres.ShapeType.rect,{x:X0, y:py(v), w:X1-X0, h:0.008,
       fill:{color:LIGHT}, line:{color:LIGHT}});
     s.addText(n1(v,1)+" %",{x:X0-0.76, y:py(v)-0.11, w:0.68, h:0.22,
       fontFace:BF, fontSize:8, color:MUT, align:"right", isTextBox:true, margin:0});});
   ticks.forEach(v=>s.addText(fmt(v),{x:px(v)-0.35, y:Y1+0.06, w:0.70, h:0.22,
     fontFace:BF, fontSize:8, color:MUT, align:"center", isTextBox:true, margin:0}));
   s.addText(sub,{x:X0, y:Y1+0.30, w:X1-X0, h:0.22, fontFace:BF, fontSize:8.5,
     color:TXT, align:"center", isTextBox:true, margin:0});
   MP.puntos.forEach(p=>{
     const cx=px(p[campo]), cy=py(p.cor), es=p.pais==="España", d=es?0.24:0.19;
     s.addShape(pres.ShapeType.ellipse,{x:cx-d/2, y:cy-d/2, w:d, h:d,
       fill:{color: es?PRIM:G2}, line:{color: es?DARK:G2, width: es?1.5:0.5}});
     const e=ET[p.pais], ancho=0.82;
     const dx = e[1]==="center" ? -ancho/2
              : (d/2+0.08)*(e[1]==="left"?1:-1) - (e[1]==="right"?ancho:0);
     s.addText(p.pais,{x: cx+dx, y: cy+e[0],
       w:ancho, h:0.22, fontFace:BF, fontSize:8.5, bold:es, color: es?ACC:DARK,
       align: e[1]==="center"?"center":e[1], isTextBox:true, margin:0});});
 }

 panel(1.44, 6.24, "margen", 3.2, 6.2, [3.5,4.0,4.5,5.0,5.5,6.0],
   v=>n1(v,1)+" %", "1 · ¿Cobra más quien más riesgo tiene?",
   "Margen bruto del préstamo PYME, % del saldo",
   {"España":[-0.11,"left"], "Alemania":[-0.11,"right"], "Francia":[-0.11,"left"],
    "Italia":[-0.11,"left"], "Portugal":[-0.11,"left"], "P. Bajos":[-0.11,"left"],
    "Irlanda":[-0.11,"right"]});

 panel(7.85, 12.65, "info", 8, 96, [20,40,60,80],
   v=>String(v), "2 · ¿Baja el riesgo donde hay más información?",
   "Índice de información para la selección (0–100)",
   {"España":[-0.11,"left"], "Alemania":[ 0.14,"left"], "Francia":[-0.11,"left"],
    "Italia":[-0.11,"right"], "Portugal":[-0.11,"right"], "P. Bajos":[-0.11,"right"],
    "Irlanda":[-0.36,"center"]});

 s.addText("Coste del riesgo, % del saldo",{x:0.68, y:2.12, w:2.60, h:0.22,
   fontFace:BF, fontSize:8, color:MUT, isTextBox:true, margin:0});

 /* --- veredicto de cada panel --- */
 const R=MP.robust;
 nota(s,0.68,5.62,5.56,0.94,"No. El riesgo NO se paga",
   "ρ = "+men(R.margen.rho,2)+": quien más riesgo tiene, menos margen cobra, y en los "+
   R.margen.n+" recortes probados ni uno da signo positivo. Italia es la excepción —mayor riesgo, segundo mayor margen—; España y Francia hacen lo contrario.");
 nota(s,7.09,5.62,5.56,0.94,"Tampoco. La información no compra riesgo",
   "ρ = "+men(R.info.rho,2)+", y el signo ni siquiera aguanta: va de "+men(R.info.min,2)+" a +"+men(R.info.max,2)+
   " según qué país se quite, y sale positivo en "+R.info.positivos+" de los "+R.info.n+
   ". No hay relación: Italia tiene la segunda mayor información y el peor riesgo.", ORA3);

 fuente(s,"Coste del riesgo: PD × LGD de la clase IRB «Corporates – of which SME», EBA COREP C 9.02 2026-Q1 — pérdida esperada anual, NO el stock de dudosos. Margen bruto: ingreso total menos coste de los recursos, lámina 7. Información: índice propio 0–100 (Banco Mundial Doing Business 2020 más dos ordinales propios sobre normativa vigente). Robustez: se recalcula cada correlación quitando uno y dos países, 28 casos. El eje que sí explica el coste del riesgo es el de recobro (ρ = −0,72), en la lámina de los dos ejes. Siete puntos: lectura descriptiva, no causal. Datos en transversal/mapa_info_margen.csv.", 7);
};


/* ------------------------------------------------------------------ 8 */
/* Sustituye a la lamina 50, "Conclusiones: Espana". Dos cambios:
   - Son OBSERVACIONES: se quitan las frases que derivaban una decision
     ("un entrante que compita por disponibilidad se equivoca de eje",
     "la demanda se corta sola"...). Eso va en recomendaciones.
   - Se corrige el 21,6 %: no es un precio, es el porcentaje de
     empresas que senala el precio como obstaculo, y la base es el
     TOTAL de encuestadas, no las que ven obstaculos (ver notas.md).
   Copia literal del bloque de gen.js: si se toca uno, tocar el otro. */
L.observaciones_es = () => {const s=hoja();
 const B=D.bancos, CB=D.cb, CE=D.cesgar;
 titulo(s,"Observaciones: España","Lo que se observa en el bloque español y no se ve en el agregado europeo · Hechos medidos; lo que se deriva de ellos va en la lámina de recomendaciones");
 const C=[
  ["1","El crédito se concede; lo que las pymes señalan es el precio",
   `El ${n1(CE.concedida,1)} % de las pymes que pide financiación la obtiene y la acepta, y solo al ${n1(CE.denegada,1)} % no se le concede. Preguntadas por obstáculos, el ${n1(CE.obstaculos[0][1],1)} % no señala ninguno y el ${n1(CE.obstaculos[1][1],1)} % señala el precio, que es el más citado. Ese ${n1(CE.obstaculos[1][1],1)} % es el porcentaje de empresas que lo menciona sobre el total encuestado, NO un tipo de interés.`],
  ["2","La pyme pequeña tiene 2,1 puntos entre lo que gana y lo que paga",
   `Gana un ${n1(CB.roa[0])} % con su activo y paga un ${n1(CB.coste[0])} % por su deuda: ${n1(CB.dif[0])} puntos de diferencia. La mediana tiene ${n1(CB.dif[1])} puntos, casi el triple, con un ROA del ${n1(CB.roa[1])} %. En la serie de la Central de Balances esa diferencia lleva en ${n1(CB.dif[0])} puntos desde 2023.`],
  ["3","El destino declarado es el circulante, el producto con menos estadística",
   `El ${n1(CE.destino[0][1],1)} % de las pymes con necesidades lo quiere para circulante, frente al ${n1(CE.circ_2024,1)} % de 2024. De ese producto no existe comisión de disponibilidad ni tasa de disposición en ninguna estadística, y el tipo del BCE ni siquiera tiene tramo de importe.`],
  ["4","Entre los cinco bancos españoles el orden lo marca el capital, no la eficiencia",
   `Sabadell tiene la peor eficiencia de los cinco (${n1(B.eficiencia[1])} %) y queda segundo en ROE, con una densidad de RWA del ${n1(B.densidad[1])} %. BBVA tiene la segunda mejor eficiencia (${n1(B.eficiencia[3])} %) y queda cuarto, con una densidad del ${n1(B.densidad[3])} %. Es el mismo patrón del agregado europeo, y aquí los cinco operan en el mismo mercado.`],
  ["5","Entre el primero y el último hay 119 pb de precio de equilibrio",
   `Con su propio riesgo, capital y gastos, Bankinter necesita un ${n1(B.precio_eq[0],2)} % para un ROE del 15 % y BBVA un ${n1(B.precio_eq[3],2)} %: ${Math.round((B.precio_eq[3]-B.precio_eq[0])*100)} pb de diferencia. El precio y las comisiones del modelo son comunes a los cinco, así que la distancia es de estructura, no de política comercial.`],
  ["6","El autónomo paga 115 pb más y está fuera de las series de empresas",
   `Paga un ${n1(D.autonomos.auto,2)} %, ${D.autonomos.dif_vs_025} pb más que la sociedad del tramo ≤0,25 M€. El SEC 2010 lo clasifica en hogares, así que no aparece en ninguna serie de sociedades no financieras. Son 840 M€ al mes de nueva producción.`]];
 let y=1.66;
 C.forEach((c,i)=>{
   s.addShape(pres.ShapeType.ellipse,{x:M, y:y+0.04, w:0.36, h:0.36, fill:{color:BLUE}, line:{color:BLUE}});
   s.addText(c[0], {x:M, y:y+0.04, w:0.36, h:0.36, fontFace:HF, fontSize:13, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(c[1], {x:M+0.55, y:y, w:11.6, h:0.3, fontFace:HF, fontSize:12.5, bold:true,
     color:DARK, isTextBox:true, margin:0});
   s.addText(c[2], {x:M+0.55, y:y+0.30, w:11.6, h:0.50, fontFace:BF, fontSize:9,
     color:G1, isTextBox:true, margin:0});
   y+=0.845;});
 fuente(s,"Las observaciones 1 y 3 salen de la encuesta CESGAR: son PORCENTAJES DE EMPRESAS sobre el total encuestado, no niveles de tipo de interés ni saldos netos de respuesta. En la pregunta de obstáculos las categorías se miden sobre esa misma base, la de «ninguno» incluida; sobre las pymes que sí señalan alguno, el precio sería el 42,5 %. La 2 sale de la Central de Balances Integrada del Banco de España, ejercicio 2024, ratios por tamaño según la Recomendación 2003/361/CE. Las 4 y 5 salen del modelo por banco, cuyo precio y comisiones son comunes a los cinco porque ninguno los publica por segmento: comparan estructura de riesgo, capital y coste, no habilidad comercial.");
};

/* ------------------------------------------------------------------ 9 */
/* Por que la densidad de un pais es la que es. Se mete su PD y su LGD
   observadas en la formula IRB del art. 153 CRR y se compara con la
   densidad que de verdad se observa. Separa tres cosas: seleccion (PD),
   garantia y recobro (LGD) y lo que la formula no explica. */
L.descomposicion_rwa = () => {const s=hoja();
 titulo(s,"De dónde sale el capital: selección, garantía y modelo",
   "Ponderación que predice la fórmula IRB del art. 153 CRR con la PD y la LGD observadas de cada país, frente a la densidad IRB que realmente se observa · Junio 2025");

 const F=DR.filas, sup=DR.supuestos;
 const cab=["País","PD","LGD","RW que da\nla fórmula","Densidad IRB\nobservada","Residuo",
            "Tasa de\nrecuperación","NPL PYME"];
 const tb=[cab.map((c,i)=>({text:c, options:Object.assign({},hdr,
    {fontSize:8.5, align:i?"center":"left",
     fill:{color: c==="Residuo"?DARK:PRIM}})}))];
 F.forEach(r=>{
   const es=r.pais==="España", nl=r.pais==="P. Bajos";
   const marca = es?YEL3 : (nl?YEL:"FFFFFF");
   const cres = Math.abs(r.residuo)<3 ? BLUE3 : (Math.abs(r.residuo)<15 ? ORA3 : MAG3);
   tb.push([
    {text:r.pais, options:cel(null,{align:"left", fontSize:10, bold:es||nl,
       color: es?ACC:DARK, fill:{color:marca}})},
    {text:n1(r.pd,2)+" %",  options:cel(null,{fontSize:10})},
    {text:n1(r.lgd,1)+" %"+(r.fibr?" *":""), options:cel(null,{fontSize:10})},
    {text:n1(r.formula,1)+" %", options:cel(null,{fontSize:10, color:MUT})},
    {text:n1(r.irb,1)+" %", options:cel(null,{fontSize:10, bold:true, fill:{color:marca}})},
    {text:men(r.residuo,1)+" pp", options:cel(null,{fontSize:10, bold:true,
       color:DARK, fill:{color:cres}})},
    {text:n1(r.recuperacion,1)+" %", options:cel(null,{fontSize:10, color:MUT})},
    {text:n1(r.npl,2)+" %", options:cel(null,{fontSize:10, color:MUT})}]);});
 s.addTable(tb,{x:M, y:1.82, w:W-2*M,
   colW:[1.62,1.10,1.15,1.68,1.68,1.40,1.62,1.72], rowH:0.34,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});

 const nl=F.find(r=>r.pais==="P. Bajos");
 nota(s,M,4.70,5.82,1.82,"Países Bajos: mitad garantía, mitad selección",
   "Consume "+n1(Math.abs(nl.brecha),1)+" pp menos que España: "+nl.pct_lgd+" % por la LGD y "+
   nl.pct_pd+" % por la PD. El reparto aguanta el tamaño de empresa ("+DR.sens[2].pct_lgd+" a "+
   DR.sens[1].pct_lgd+" % la LGD) y solo se mueve con el vencimiento ("+DR.sens[3].pct_lgd+" % a un año, "+
   DR.sens[4].pct_lgd+" % a cinco). Los dos inputs están corroborados fuera del modelo: tasa de recuperación concursal del "+
   n1(nl.recuperacion,1)+" %, la más alta de los siete, y el NPL de PYME más bajo ("+n1(nl.npl,2)+
   " %). Bajo IRB la garantía no compite con el modelo: entra dentro, por la LGD.");

 const esp=F.find(r=>r.pais==="España");
 nota(s,M+6.15,4.70,5.82,1.82,"Lo que la fórmula no explica",
   "España es el único país donde la densidad observada coincide con la que da la fórmula ("+
   n1(esp.irb,1)+" % frente a "+n1(esp.formula,1)+" %). En los demás el agregado pondera hasta "+
   n1(Math.abs(Math.min(...F.map(r=>r.residuo))),0)+" pp por debajo. Cuidado al leerlo: la PD y la LGD son MEDIANAS de entidades y la densidad es media ponderada por volumen, así que parte del residuo es esa asimetría y no comportamiento del modelo. No se puede separar con lo publicado.",
   ORA3);

 fuente(s,"PD y LGD: EBA, COREP C 9.02, clase «Corporates – of which SME», mediana de entidades declarantes, 2026-Q1. Densidad IRB observada: EBA, EU-wide Transparency Exercise, junio 2025, Portfolio = 2. Fórmula del art. 153 CRR con ajuste PYME del 153.4 y factor de apoyo del art. 501 (0,7619); SUPUESTOS declarados y no observados: facturación "+n1(sup.S,0)+" M€ y vencimiento efectivo "+n1(sup.M,1)+" años — la sensibilidad a los dos está en el CSV. Tasa de recuperación: Banco Mundial, Doing Business 2020 — céntimos por dólar que recupera el acreedor garantizado en un concurso, no un tipo de interés. NPL PYME: EBA Risk Dashboard 2026-Q1. (*) LGD de exactamente 40,00 %: es el valor supervisor del IRB BÁSICO (art. 161 CRR), donde el banco no estima su propia severidad. Datos en transversal/descomposicion_rwa.csv.", 7);
};


/* ----------------------------------------------------------------- 10 */
/* Mismo formato que la lamina de Fuentes, pero una fila por PARTIDA de la
   cuenta del ROE, diciendo si el dato es de PYME o no:
     PYME      el dato es del segmento (definicion CRR, facturacion <=50 M)
     PROXY     el dato existe pero de otro perimetro que se usa en su lugar
     SUPUESTO  no hay dato: se aplica un valor de otro sitio
     BANCO     es del banco entero por diseno; no tiene sentido por segmento
   Las cifras de la fila de densidad salen de tr_cre.csv (ver notas.md). */
L.supuestos_roe = () => {const s=hoja();
 titulo(s,"Supuestos del ROE",
   "De dónde sale cada línea de la cuenta del préstamo PYME, y si el dato es de verdad de PYME o un proxy");
 const TIPO = {PYME:[BLUE,"PYME"], PROXY:[ORA2,"PROXY"], SUPUESTO:[MAG,"SUPUESTO"], BANCO:[G3,"DEL BANCO"]};
 const F = [
  ["Precio del préstamo",
   "BCE, MIR: tipo de nueva producción a sociedades no financieras, tramo ≤1 M€, fijación total, sin comisiones",
   "Segmenta por IMPORTE DEL PRÉSTAMO, no por tamaño de empresa: una gran empresa que pide 800.000 € entra, y una mediana que pide 3 M€ no. Deja fuera al autónomo, que está en hogares.",
   "PROXY","2026-07"],
  ["Comisiones",
   "Banco de España, Boletín Estadístico, cap. 19: cuña TAE − tipo sin comisiones, tramo ≤1 M€",
   "Solo España publica un tipo con comisiones para empresas; su cuña de 87 pb se aplica a los siete. Fuera de España no es un dato. Contraste: los segmentos de empresas que se publican cobran de 99 a 122 pb.",
   "SUPUESTO","2026-07"],
  ["Coste de los recursos",
   "BCE, MIR: depósitos a la vista y a plazo del sector 2240, ponderados por los saldos del BSI",
   "Depósito de SOCIEDADES NO FINANCIERAS, no de PYME: incluye la tesorería de la gran empresa. Supone además que el préstamo se financia con depósito de empresa y no en mercado.",
   "PROXY","2026-07"],
  ["Coste del riesgo",
   "EBA, COREP C 9.02: PD × LGD de la clase IRB «Corporates – of which SME»",
   "De PYME según el CRR (facturación hasta 50 M€). Matices: solo la cartera IRB, mediana de entidades y pérdida esperada, no dotación contable.",
   "PYME","2026-Q1"],
  ["Densidad de RWA",
   "EBA, Transparency Exercise: RWA sobre valor de exposición de la cartera PYME, estándar más IRB",
   "De PYME según el CRR, con el factor de apoyo del art. 501. Pero se agrega por supervisor e incluye PYME extranjera (el 46 % en España). Con solo la local, la densidad baja entre 1,7 y 4,4 pp en seis de los siete; el orden entre países no cambia.",
   "PYME","2025-06"],
  ["Gastos de explotación",
   "EBA Risk Dashboard: ratio de eficiencia (cost-to-income), grupo consolidado",
   "Eficiencia del banco entero aplicada al margen del préstamo. Supone que la PYME cuesta lo mismo por euro de margen que el resto del negocio.",
   "BANCO","2026-Q1"],
  ["CET1",
   "EBA Risk Dashboard: ratio CET1, grupo consolidado",
   "Solvencia del banco: el capital que se exige a cada euro de RWA, venga del segmento que venga.",
   "BANCO","2026-Q1"],
  ["Tipo impositivo",
   "Legislación de cada país: España 30 % (art. 29 LIS, entidades de crédito), Irlanda 15 % (mínimo de Pilar Dos)",
   "Tipo NOMINAL aplicable a bancos, no el efectivo. El resto de países, tipo combinado estatal más local.",
   "BANCO","2026"]];

 const cab=["Partida","Fuente","Qué se usa y por qué es, o no, de PYME","Tipo","Último dato"];
 const tb=[cab.map((c,i)=>({text:c, options:Object.assign({},hdr,
    {fontSize:9.5, align: (i===3||i===4)?"center":"left"})}))];
 F.forEach((f,i)=>{
   const par = i%2 ? "F4F4F4" : "FFFFFF";
   const t = TIPO[f[3]];
   tb.push([
    {text:f[0], options:cel(null,{align:"left", fontSize:9.5, bold:true, fill:{color:par}})},
    {text:f[1], options:cel(null,{align:"left", fontSize:7.5, color:MUT, fill:{color:par}})},
    {text:f[2], options:cel(null,{align:"left", fontSize:7.5, color:TXT, fill:{color:par}})},
    {text:t[1], options:cel(null,{fontSize:8, bold:true, color:DARK, fill:{color:t[0]}})},
    {text:f[4], options:cel(null,{fontSize:9, fill:{color:par}})}]);});
 s.addTable(tb,{x:M, y:1.66, w:W-2*M, colW:[1.62,3.05,4.83,1.12,1.35],
   rowH:[0.32].concat(F.map(()=>0.50)), fontFace:BF,
   border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[2,5,2,5]});

 /* leyenda */
 [["PYME","el dato es del segmento"],["PROXY","otro perímetro en su lugar"],
  ["SUPUESTO","no hay dato: se importa"],["DEL BANCO","del banco entero, por diseño"]]
  .forEach((l,i)=>{
    const x=M+i*3.0, c=TIPO[l[0]==="DEL BANCO"?"BANCO":l[0]][0];
    s.addShape(pres.ShapeType.roundRect,{x:x, y:6.14, w:0.95, h:0.22, fill:{color:c},
      rectRadius:0.08, line:{color:c}});
    s.addText(l[0],{x:x, y:6.14, w:0.95, h:0.22, fontFace:BF, fontSize:7, bold:true,
      color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
    s.addText(l[1],{x:x+1.02, y:6.14, w:1.95, h:0.22, fontFace:BF, fontSize:7.5,
      color:MUT, valign:"middle", isTextBox:true, margin:0});});

 fuente(s,"«PYME» significa aquí la definición del CRR (art. 501: facturación hasta 50 M€), que no coincide con la de la Recomendación 2003/361/CE ni con los tramos de importe del MIR. Las tres fuentes que dicen «PYME» miden, por tanto, tres perímetros distintos. El detalle de cada supuesto y su sensibilidad está en notas.md.");
};


const ORDEN = ["prima","rechazo","reconciliacion","densidad","factoring_ie",
               "comparables_ratios","riesgo_nubes","observaciones_es","descomposicion_rwa","supuestos_roe"];
ORDEN.forEach(k=>{ if(!L[k]) throw new Error("lamina desconocida: "+k); L[k](); });
const sobran = Object.keys(L).filter(k=>!ORDEN.includes(k));
if(sobran.length) throw new Error("laminas sin colocar: "+sobran.join(", "));

pres.writeFile({fileName:"rentabilidad_pyme_laminas_adicionales.pptx"})
  .then(f=>console.log("escrito:",f,"|",ORDEN.length,"laminas"));
