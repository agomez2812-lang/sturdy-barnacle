/* Cinco laminas SUELTAS, para intercalar donde convenga en el deck
   principal. No es una presentacion: no lleva portada, separadores ni
   cierre, y no va numerada, porque su numero depende de donde se inserte.

   1. La prima PYME espanola se ha evaporado        -> bloque 1 (precio)
   2. La tasa de rechazo de la SAFE                 -> bloque 1 (apetito)
   3. Reconciliacion del ROE PYME con el de grupo   -> bloque 2 (bancos ES)
   4. Densidad de RWA: estandar frente a IRB        -> bloque 1 (capital)
   5. Irlanda en factoring: el dato esta congelado  -> anexos (limites)
   6. Comparables en % de la inversion               -> sustituye a la lamina 16
   7. Mapa informacion / margen / coste del riesgo   -> bloque 1, tras la 18

   Todos los numeros salen de pres/adicionales.json, que a su vez lo
   construye scripts/datos_adicionales.py desde los CSV del repositorio.
*/
const pptxgen = require("pptxgenjs");
const {sistema} = require("./visual.js");
const A = require("./adicionales.json");
const CR = require("./comparables_ratios.json");
const MP = require("./mapa_info_margen.json");

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
/* Dispersion dibujada a mano con formas, no con addChart: con siete
   puntos hace falta controlar color, tamano y colocacion de cada etiqueta
   una por una, y el motor de graficos de pptxgenjs no deja hacerlo.
   Se dibujan CUADRANTES sobre las medias y NO una recta de ajuste: la
   pendiente no es robusta (ver el pie y notas.md 2.72). */
L.mapa_info_margen = () => {const s=hoja();
 titulo(s,"Información, margen y riesgo de los siete mercados",
   "Cada burbuja es un país · Eje horizontal: cuánto se puede saber del cliente antes de conceder · Eje vertical: margen bruto del préstamo PYME · Tamaño y color: coste del riesgo PD × LGD");

 /* ---- marco del area de dibujo ---- */
 const X0=1.62, X1=8.52, Y0=1.92, Y1=5.72;          // area util
 const XMIN=8, XMAX=96, YMIN=3.2, YMAX=6.2;
 const px = v => X0 + (v-XMIN)/(XMAX-XMIN)*(X1-X0);
 const py = v => Y1 - (v-YMIN)/(YMAX-YMIN)*(Y1-Y0);
 s.addShape(pres.ShapeType.rect,{x:X0, y:Y0, w:X1-X0, h:Y1-Y0,
   fill:{color:"FFFFFF"}, line:{color:G3, width:0.75}});
 /* rejilla */
 [3.5,4.0,4.5,5.0,5.5,6.0].forEach(v=>{
   s.addShape(pres.ShapeType.rect,{x:X0, y:py(v), w:X1-X0, h:0.008,
     fill:{color:LIGHT}, line:{color:LIGHT}});
   s.addText(n1(v,1)+" %",{x:X0-0.88, y:py(v)-0.11, w:0.80, h:0.22,
     fontFace:BF, fontSize:8.5, color:MUT, align:"right", isTextBox:true, margin:0});});
 [20,40,60,80].forEach(v=>{
   s.addText(String(v),{x:px(v)-0.30, y:Y1+0.06, w:0.60, h:0.22, fontFace:BF,
     fontSize:8.5, color:MUT, align:"center", isTextBox:true, margin:0});});

 /* ---- lineas de media = cuadrantes ---- */
 s.addShape(pres.ShapeType.rect,{x:px(MP.media_info), y:Y0, w:0.012, h:Y1-Y0,
   fill:{color:G2}, line:{color:G2}});
 s.addShape(pres.ShapeType.rect,{x:X0, y:py(MP.media_margen), w:X1-X0, h:0.012,
   fill:{color:G2}, line:{color:G2}});
 s.addText("media "+n1(MP.media_info,0),{x:px(MP.media_info)+0.06, y:Y1-0.24,
   w:0.80, h:0.20, fontFace:BF, fontSize:7.5, color:G2, isTextBox:true, margin:0});
 s.addText("media "+n1(MP.media_margen,2)+" %",{x:X0+0.06, y:py(MP.media_margen)-0.22,
   w:1.10, h:0.20, fontFace:BF, fontSize:7.5, color:G2,
   isTextBox:true, margin:0});
 /* rotulos de cuadrante, en esquinas libres */
 s.addText("mucha información\npoco margen",{x:X1-1.55, y:Y1-0.52,
   w:1.45, h:0.42, fontFace:BF, fontSize:7.5, color:ACC, bold:true, align:"right",
   isTextBox:true, margin:0, lineSpacingMultiple:1.05});

 /* ---- burbujas: tamano y color por coste del riesgo ---- */
 const cors = MP.puntos.map(p=>p.cor), cmin=Math.min(...cors), cmax=Math.max(...cors);
 const dia = c => 0.24 + (c-cmin)/(cmax-cmin)*0.28;
 const col = c => c<0.45 ? BLUE : (c<=0.65 ? ORA2 : MAG);
 /* colocacion de cada etiqueta, decidida a mano para que no se pisen */
 const ET = {"España":[-0.24,-0.11,"right"], "Alemania":[ 0.24, 0.02,"left" ],
             "Francia":[ 0.24,-0.20,"left" ], "Italia":[ 0.24,-0.24,"left" ],
             "Portugal":[-0.24,-0.13,"right"], "P. Bajos":[-0.24,-0.45,"right"],
             "Irlanda":[-0.24,-0.20,"right"]};
 MP.puntos.forEach(p=>{
   const cx=px(p.info), cy=py(p.margen), d=dia(p.cor), es=p.pais==="España";
   s.addShape(pres.ShapeType.ellipse,{x:cx-d/2, y:cy-d/2, w:d, h:d,
     fill:{color:col(p.cor)}, line:{color: es?DARK:col(p.cor), width: es?1.75:0.5}});
   /* el desplazamiento se mide desde el BORDE de la burbuja, no desde el
      centro: Italia tiene el circulo mas grande y con un offset fijo la
      etiqueta le entraba dentro. */
   const e=ET[p.pais], ancho=0.85, dx=(d/2+0.09)*(e[0]<0?-1:1);
   /* nombre y coste del riesgo en DOS lineas: en una sola, la etiqueta de
      Italia se salia del area de dibujo y se metia en el panel derecho. */
   s.addText([{text:p.pais, options:{bold:true, color: es?ACC:DARK}},
              {text:"\n"+n1(p.cor,2)+" %", options:{color:MUT, fontSize:8}}],
     {x: e[2]==="left" ? cx+dx : cx+dx-ancho, y: cy+e[1],
      w:ancho, h:0.40, fontFace:BF, fontSize:9, align:e[2],
      isTextBox:true, margin:0, lineSpacingMultiple:0.95});});

 /* ---- rotulos de eje ---- */
 s.addText("Índice de información para la selección (0–100)",
   {x:X0, y:Y1+0.28, w:X1-X0, h:0.24, fontFace:BF, fontSize:9, color:TXT,
    align:"center", isTextBox:true, margin:0});
 s.addText("Margen bruto, % del saldo",{x:X0-1.02, y:Y0-0.30, w:2.40, h:0.24,
   fontFace:BF, fontSize:8.5, color:TXT, isTextBox:true, margin:0});
 [["coste del riesgo < 0,45 %",BLUE],["0,45 a 0,65 %",ORA2],["> 0,65 %",MAG]]
  .forEach((l,i)=>{
   const x=X0+i*2.35;
   s.addShape(pres.ShapeType.ellipse,{x:x, y:6.34, w:0.18, h:0.18,
     fill:{color:l[1]}, line:{color:l[1]}});
   s.addText(l[0],{x:x+0.26, y:6.30, w:2.05, h:0.24, fontFace:BF, fontSize:8,
     color:MUT, isTextBox:true, margin:0});});

 /* ---- panel de lectura ---- */
 const es=MP.puntos[0];
 nota(s,8.82,1.92,3.83,2.38,"España está en el cuadrante malo",
   "Tiene información por encima de la media ("+n1(es.info,1)+" frente a "+n1(MP.media_info,0)+
   ") y el segundo margen más bajo de los siete ("+n1(es.margen,2)+" %). Gana "+
   n1(Math.abs(es.residuo),2)+" pp menos de margen del que le correspondería por su nivel de información: la mayor brecha de los siete. Tiene con qué seleccionar y no lo cobra.");
 nota(s,8.82,4.38,3.83,1.98,"Lo que el mapa NO dice",
   "Que más información dé más margen. La correlación de los siete es "+
   MP.rho.toFixed(2).replace(".",",")+", pero descansa en los dos extremos: quitando Irlanda y Francia a la vez baja a "+
   MP.rho_min.toFixed(2).replace(".",",")+". Por eso hay cuadrantes y no recta de ajuste. Tampoco compra riesgo: información contra coste del riesgo es "+
   MP.rho_info_cor.toFixed(2).replace(".",",")+"; el eje que sí lo explica es el de recobro ("+
   MP.rho_rec_cor.toFixed(2).replace(".",",")+").", ORA3);
 fuente(s,"Información: índice propio 0–100 de cuatro componentes (profundidad de información crediticia y cobertura del bureau, Banco Mundial Doing Business 2020; utilidad del registro público para PYME y disponibilidad de cuentas depositadas, ordinales propios sobre normativa vigente). Margen bruto: ingreso total menos coste de los recursos, lámina 7. Coste del riesgo: PD × LGD de la clase IRB de PYME, EBA COREP C 9.02 2026-Q1 — es pérdida esperada anual, no el stock de dudosos. El residuo de España es negativo en las 22 especificaciones probadas (de −0,92 a −0,11 pp). Siete puntos: lectura descriptiva, no causal. Datos en transversal/mapa_info_margen.csv.", 7);
};

const ORDEN = ["prima","rechazo","reconciliacion","densidad","factoring_ie",
               "comparables_ratios","mapa_info_margen"];
ORDEN.forEach(k=>{ if(!L[k]) throw new Error("lamina desconocida: "+k); L[k](); });
const sobran = Object.keys(L).filter(k=>!ORDEN.includes(k));
if(sobran.length) throw new Error("laminas sin colocar: "+sobran.join(", "));

pres.writeFile({fileName:"rentabilidad_pyme_laminas_adicionales.pptx"})
  .then(f=>console.log("escrito:",f,"|",ORDEN.length,"laminas"));
