/* Cinco laminas SUELTAS, para intercalar donde convenga en el deck
   principal. No es una presentacion: no lleva portada, separadores ni
   cierre, y no va numerada, porque su numero depende de donde se inserte.

   1. La prima PYME espanola se ha evaporado        -> bloque 1 (precio)
   2. La tasa de rechazo de la SAFE                 -> bloque 1 (apetito)
   3. Reconciliacion del ROE PYME con el de grupo   -> bloque 2 (bancos ES)
   4. Densidad de RWA: estandar frente a IRB        -> bloque 1 (capital)
   5. Irlanda en factoring: el dato esta congelado  -> anexos (limites)

   Todos los numeros salen de pres/adicionales.json, que a su vez lo
   construye scripts/datos_adicionales.py desde los CSV del repositorio.
*/
const pptxgen = require("pptxgenjs");
const {sistema} = require("./visual.js");
const A = require("./adicionales.json");

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

const ORDEN = ["prima","rechazo","reconciliacion","densidad","factoring_ie"];
ORDEN.forEach(k=>{ if(!L[k]) throw new Error("lamina desconocida: "+k); L[k](); });
const sobran = Object.keys(L).filter(k=>!ORDEN.includes(k));
if(sobran.length) throw new Error("laminas sin colocar: "+sobran.join(", "));

pres.writeFile({fileName:"rentabilidad_pyme_laminas_adicionales.pptx"})
  .then(f=>console.log("escrito:",f,"|",ORDEN.length,"laminas"));
