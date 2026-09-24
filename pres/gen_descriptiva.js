/* El mercado PYME en Europa: lo que dicen los datos.

   Presentacion DESCRIPTIVA: fuente por fuente, que se ha podido obtener, por
   que aplica (o no) a PYME, y al final un analisis descriptivo del mercado.
   Sin ROE ni ninguna cifra que dependa de supuestos: solo datos observados
   y transformaciones aritmeticas directas (medias, diferencias,
   correlaciones). Todo sale de pres/descriptiva.json, que construye
   scripts/datos_descriptiva.py desde los CSV del repositorio.

   Paleta de series validada con el validador de dataviz (daltonismo,
   contraste, croma): naranja F56600, azul 2A6FB0, magenta B8336A. El
   naranja marca siempre el FOCO: Espana en los graficos por pais, y la
   serie PYME en los graficos por segmento. El resto de paises va en gris.
*/
const pptxgen = require("pptxgenjs");
const {sistema} = require("./visual.js");
const X = require("./descriptiva.json");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Analisis PYME Europa";
pres.title = "El mercado PYME en Europa: lo que dicen los datos";
const V = sistema(pres);
const {PRIM,DARK,G1,G2,G3,LIGHT,PAPEL,YEL,YEL2,YEL3,BLUE3,MAG3,ORA2,ORA3,
       TXT,MUT,HF,BF,W,H,M,n1,nueva,titulo,fuente,bloques,logo,hdr,cel} = V;

const AZUL="2A6FB0", MAGE="B8336A", GRIS="B9B9B9";
const SERIES=[PRIM,AZUL,MAGE];
const P = X.paises;
const FOCO = "España";
const men = (v,d)=>(v<0?"−":"")+n1(Math.abs(v),d===undefined?1:d);
const mas = (v,d)=>(v>0?"+":"")+men(v,d);

/* ------------------------------------------------------------------ */
/* ETIQUETA DE DEFINICION: el motivo que se repite en cada lamina.     */
/* ------------------------------------------------------------------ */
const DEF = {
  ue:      {c:BLUE3, t:"PYME · Recomendación 2003/361/CE completa", v:"Definición estándar de la UE"},
  empl:    {c:ORA3,  t:"PYME · menos de 250 empleados",               v:"Un solo criterio de la estándar"},
  emplaut: {c:ORA3,  t:"PYME · <250 empleados, con autónomos",        v:"Un solo criterio de la estándar"},
  fact:    {c:ORA3,  t:"PYME · facturación hasta 50 M€",              v:"Un solo criterio de la estándar"},
  interna: {c:MAG3,  t:"PYME · definición interna de cada banco",     v:"No armonizada"},
  mixta:   {c:MAG3,  t:"PYME · estándar por facturación, IRB interna",v:"Dos definiciones mezcladas"},
  nacional:{c:MAG3,  t:"PYME · definición nacional de cada país",     v:"No armonizada"},
  importe: {c:MAG3,  t:"PROXY · importe del préstamo, no la empresa", v:"No mide el tamaño de la empresa"},
  gestion: {c:MAG3,  t:"PROXY · segmento de gestión del banco",       v:"Mezcla PYME y gran empresa"},
  ninguna: {c:LIGHT, t:"SIN SEGMENTO · todas las empresas",           v:"No distingue tamaño"},
  entorno: {c:LIGHT, t:"CONTEXTO · marco del país, no de la PYME",    v:"No es un dato de segmento"},
};
function etiqueta(s, k, x, y, w){
  const d=DEF[k]; x = x===undefined ? W-M-2.55 : x; y = y===undefined ? 0.70 : y; w = w||2.55;
  s.addShape(pres.ShapeType.roundRect,{x:x, y:y, w:w, h:0.40, fill:{color:d.c},
    rectRadius:0.06, line:{color:d.c}});
  s.addText(d.t,{x:x+0.08, y:y+0.02, w:w-0.16, h:0.36, fontFace:BF, fontSize:7.5,
    bold:true, color:DARK, valign:"middle", isTextBox:true, margin:0});
}
/* titulo de lamina de datos: deja sitio a la etiqueta de la derecha */
function cab(s, t, sub, k){
  s.addText(t,{x:M, y:0.46, w:W-2*M-2.75, h:0.72, fontFace:HF, fontSize:21, bold:true,
    color:DARK, isTextBox:true, margin:0, valign:"top"});
  if(sub) s.addText(sub,{x:M, y:1.20, w:W-2*M, h:0.36, fontFace:BF, fontSize:10,
    color:MUT, isTextBox:true, margin:0});
  if(k) etiqueta(s,k);
}
function nuevaDatos(){ return nueva(); }

/* tarjeta sin franja lateral: fondo tintado */
function tarjeta(s, x, y, w, h, tit, txt, fondo, tam){
  const f=fondo||"F2F4F6";
  s.addShape(pres.ShapeType.roundRect,{x:x, y:y, w:w, h:h, fill:{color:f}, rectRadius:0.05,
    line:{color:f}});
  if(h<0.9){  /* tira baja: titulo en linea con el texto */
    s.addText([{text:tit+"  ",options:{fontFace:HF, bold:true, color:DARK}},
               {text:txt,options:{fontFace:BF, color:TXT}}],
      {x:x+0.22, y:y+0.06, w:w-0.44, h:h-0.12, fontSize:tam||9.5, isTextBox:true, margin:0, valign:"middle"});
    return;}
  /* titulo a dos lineas si no cabe en una (~0,105" por caracter a 11,5 pt) */
  const th = tit.length*0.097 > w-0.44 ? 0.52 : 0.30;
  s.addText(tit,{x:x+0.22, y:y+0.14, w:w-0.44, h:th, fontFace:HF, fontSize:11.5, bold:true,
    color:DARK, isTextBox:true, margin:0, valign:"top"});
  s.addText(txt,{x:x+0.22, y:y+0.18+th, w:w-0.44, h:h-0.30-th, fontFace:BF, fontSize:tam||9.5,
    color:TXT, isTextBox:true, margin:0, valign:"top"});
}
/* cifra grande con etiqueta */
function cifra(s, x, y, w, num, lab, col){
  s.addText(num,{x:x, y:y, w:w, h:0.62, fontFace:HF, fontSize:30, bold:true,
    color:col||PRIM, isTextBox:true, margin:0});
  s.addText(lab,{x:x, y:y+0.64, w:w, h:0.52, fontFace:BF, fontSize:9, color:TXT,
    isTextBox:true, margin:0, valign:"top"});
}
/* leyenda manual */
function leyenda(s, x, y, items){
  let xx=x;
  items.forEach(it=>{
    s.addShape(pres.ShapeType.rect,{x:xx, y:y+0.06, w:0.22, h:0.12, fill:{color:it[1]},
      line:{color:it[1]}});
    s.addText(it[0],{x:xx+0.28, y:y, w:it[2]||1.6, h:0.24, fontFace:BF, fontSize:8.5,
      color:TXT, isTextBox:true, margin:0, valign:"middle"});
    xx += 0.28 + (it[2]||1.6) + 0.2;});
}

/* ------------------------------------------------------------------ */
/* GRAFICOS                                                            */
/* ------------------------------------------------------------------ */
const EJE = {catAxisLabelColor:TXT, catAxisLabelFontSize:9.5, catAxisLabelFontFace:BF,
  valAxisLabelColor:MUT, valAxisLabelFontSize:8.5, valAxisLabelFontFace:BF,
  valGridLine:{color:"E6E9EC", size:0.75}, catGridLine:{style:"none"},
  catAxisLineColor:G3, valAxisLineShow:false};

/* una serie por pais, con Espana resaltada */
function barFoco(s, o){
  const labels=o.labels||P;
  s.addChart(pres.ChartType.bar,[{name:o.nombre||"valor", labels:labels, values:o.values}],
    Object.assign({x:o.x, y:o.y, w:o.w, h:o.h, barDir:o.dir||"col", barGapWidthPct:60,
     chartColors:labels.map(p=> (o.foco||[FOCO]).includes(p) ? PRIM : GRIS), varyColors:true,
     showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:9, dataLabelFontFace:BF,
     dataLabelColor:TXT, dataLabelFormatCode:o.fmt||'0.0"%"', showLegend:false,
     valAxisHidden:!!o.sinEje, valAxisLabelFormatCode:o.fmtEje||o.fmt||'0"%"',
     valAxisMinVal:o.min===undefined?0:o.min, valAxisMaxVal:o.max,
     showTitle:!!o.tit, title:o.tit, titleFontSize:10.5, titleFontFace:HF, titleColor:DARK},
     EJE));
}
/* varias series por pais */
function barras(s, o){
  s.addChart(pres.ChartType.bar, o.series.map(x=>({name:x[0], labels:o.labels||P, values:x[1]})),
    Object.assign({x:o.x, y:o.y, w:o.w, h:o.h, barDir:o.dir||"col", barGapWidthPct:55,
     barGrouping:"clustered", chartColors:o.colors||SERIES.slice(0,o.series.length),
     showValue:o.valores!==false, dataLabelPosition:"outEnd", dataLabelFontSize:8,
     dataLabelFontFace:BF, dataLabelColor:TXT, dataLabelFormatCode:o.fmt||'0.0"%"',
     showLegend:true, legendPos:"b", legendFontSize:9, legendFontFace:BF, legendColor:TXT,
     valAxisLabelFormatCode:o.fmtEje||'0"%"', valAxisMinVal:0, valAxisMaxVal:o.max,
     showTitle:!!o.tit, title:o.tit, titleFontSize:10.5, titleFontFace:HF, titleColor:DARK},
     EJE));
}
/* lineas: el foco en naranja grueso, el resto en gris fino */
function lineasFoco(s, o){
  const nombres=Object.keys(o.series);
  const resto=nombres.filter(n=>n!==(o.foco||FOCO));
  const base = {x:o.x, y:o.y, w:o.w, h:o.h, showLegend:false,
    valAxisLabelFormatCode:o.fmtEje||'0.0', valAxisMinVal:o.min, valAxisMaxVal:o.max,
    catAxisLabelFrequency:o.freq||1};
  s.addChart([
    {type:pres.ChartType.line, data:resto.map(n=>({name:n, labels:o.labels, values:o.series[n]})),
     options:{chartColors:resto.map(()=>GRIS), lineSize:1.25, lineDataSymbol:"none"}},
    {type:pres.ChartType.line, data:[{name:o.foco||FOCO, labels:o.labels, values:o.series[o.foco||FOCO]}],
     options:{chartColors:[PRIM], lineSize:3, lineDataSymbol:"circle", lineDataSymbolSize:6}}],
    Object.assign(base, EJE));
  leyenda(s, o.x+0.1, o.y+o.h+0.02, [[o.foco||FOCO, PRIM, 0.9],["resto de países", GRIS, 1.5]]);
}
/* dos o tres series temporales, colores de serie */
function lineas(s, o){
  s.addChart(pres.ChartType.line, o.series.map(x=>({name:x[0], labels:o.labels, values:x[1]})),
    Object.assign({x:o.x, y:o.y, w:o.w, h:o.h, chartColors:o.colors||SERIES, lineSize:2.25,
     lineDataSymbol:"none", showLegend:true, legendPos:"b", legendFontSize:9, legendFontFace:BF,
     legendColor:TXT, valAxisLabelFormatCode:o.fmtEje||'0.0', valAxisMinVal:o.min,
     valAxisMaxVal:o.max, catAxisLabelFrequency:o.freq||1}, EJE));
}
/* tabla compacta */
function tabla(s, x, y, w, filas, anchos, o){
  o=o||{};
  const rows=filas.map((f,ri)=>f.map((c,ci)=>{
    if(ri===0) return {text:String(c), options:Object.assign({},hdr,{fontSize:8.5,
      align:ci?"center":"left", fill:{color:DARK}})};
    const foco = o.foco && f[0]===o.foco;
    return {text:String(c), options:cel(null,{fontSize:o.fs||9, align:ci?"center":"left",
      bold:foco||ci===0&&o.negrita, color:foco?PRIM:TXT, fill:{color:foco?YEL3:"FFFFFF"}})};
  }));
  s.addTable(rows,{x:x, y:y, w:w, colW:anchos, rowH:o.rh||0.27, fontFace:BF,
    border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,4,1,4]});
}

/* ------------------------------------------------------------------ */
/* FICHA DE FUENTE: abre cada seccion                                  */
/* ------------------------------------------------------------------ */
let NF = 0;
function ficha(o){
  NF += 1;
  const s = nueva({limpia:true});
  s.background={color:PAPEL};
  s.addShape(pres.ShapeType.rect,{x:0, y:0, w:4.55, h:H, fill:{color:PRIM}, line:{color:PRIM}});
  s.addText("FUENTE "+NF,{x:M, y:0.95, w:3.5, h:0.32, fontFace:BF, fontSize:11, bold:true,
    color:"FFFFFF", charSpacing:2, isTextBox:true, margin:0});
  s.addText(o.nombre,{x:M, y:1.35, w:3.6, h:1.55, fontFace:HF, fontSize:26, bold:true,
    color:"FFFFFF", isTextBox:true, margin:0, valign:"top"});
  s.addText(o.inst,{x:M, y:2.95, w:3.5, h:0.62, fontFace:BF, fontSize:10.5, color:"FFFFFF",
    isTextBox:true, margin:0, valign:"top"});
  /* veredicto de definicion sobre el panel */
  const d=DEF[o.def];
  s.addShape(pres.ShapeType.roundRect,{x:M, y:4.55, w:3.45, h:1.45, fill:{color:"FFFFFF"},
    rectRadius:0.06, line:{color:"FFFFFF"}});
  s.addText("QUÉ LLAMA PYME",{x:M+0.2, y:4.67, w:3.1, h:0.24, fontFace:BF, fontSize:8,
    bold:true, color:MUT, charSpacing:1, isTextBox:true, margin:0});
  s.addText(d.t.replace(/^[A-ZÁÉÍÓÚ ]+ · /,""),{x:M+0.2, y:4.93, w:3.1, h:0.55, fontFace:HF,
    fontSize:12, bold:true, color:DARK, isTextBox:true, margin:0, valign:"top"});
  s.addShape(pres.ShapeType.roundRect,{x:M+0.2, y:5.55, w:3.05, h:0.30, fill:{color:d.c},
    rectRadius:0.08, line:{color:d.c}});
  s.addText(d.v,{x:M+0.2, y:5.55, w:3.05, h:0.30, fontFace:BF, fontSize:8.5, bold:true,
    color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
  logo(s, false);
  /* derecha: que es, que hemos obtenido, por que es (o no) de PYME */
  const X0=5.15, WW=W-X0-M;
  const bloque=(y, t, cuerpo, h)=>{
    s.addText(t,{x:X0, y:y, w:WW, h:0.30, fontFace:HF, fontSize:12.5, bold:true, color:PRIM,
      isTextBox:true, margin:0});
    s.addText(cuerpo,{x:X0, y:y+0.34, w:WW, h:h, fontFace:BF, fontSize:10.5, color:TXT,
      isTextBox:true, margin:0, valign:"top", paraSpaceAfter:3});
  };
  bloque(0.95, "Qué es", o.que, 0.80);
  bloque(2.20, "Qué hemos obtenido",
    o.datos.map((t,i)=>({text:t, options:{bullet:true, breakLine:i<o.datos.length-1}})), 1.55);
  bloque(4.25, "Por qué aplica a PYME, y hasta dónde", o.porque, 1.35);
  s.addText(o.cobertura,{x:X0, y:6.35, w:WW, h:0.42, fontFace:BF, fontSize:8.5, italic:true,
    color:MUT, isTextBox:true, margin:0});
  return s;
}

const L = {};

/* ================================================================== */
/* APERTURA                                                            */
/* ================================================================== */
L.portada = () => { const s=nueva({limpia:true});
  s.background={color:DARK};
  s.addShape(pres.ShapeType.rect,{x:8.05, y:0, w:5.28, h:H, fill:{color:PRIM}, line:{color:PRIM}});
  s.addShape(pres.ShapeType.rect,{x:11.10, y:0.90, w:1.60, h:1.60, fill:{color:YEL}, line:{color:YEL}});
  s.addShape(pres.ShapeType.rect,{x:8.60, y:3.60, w:1.90, h:1.90, fill:{color:"FFFFFF"},
    line:{color:"FFFFFF"}, transparency:80});
  s.addShape(pres.ShapeType.rect,{x:10.80, y:5.05, w:1.25, h:1.25, fill:{color:ORA2}, line:{color:ORA2}});
  logo(s, true);
  s.addText("El mercado PYME\nen Europa",{x:1.10, y:1.95, w:6.6, h:1.75, fontFace:HF, fontSize:38,
    bold:true, color:"FFFFFF", isTextBox:true, margin:0, lineSpacingMultiple:1.05});
  s.addText("Lo que dicen los datos, fuente por fuente",{x:1.10, y:3.78, w:6.6, h:0.45,
    fontFace:BF, fontSize:15, color:YEL, isTextBox:true, margin:0});
  s.addText("España · Alemania · Francia · Italia · Portugal · Países Bajos · Irlanda",
    {x:1.10, y:4.45, w:6.6, h:0.40, fontFace:BF, fontSize:11, color:G3, isTextBox:true, margin:0});
  s.addText("Análisis descriptivo sobre datos observados. Sin modelos de rentabilidad: los datos disponibles no tienen la calidad para sostener un ROE.",
    {x:1.10, y:5.05, w:6.4, h:0.70, fontFace:BF, fontSize:10, color:G2, isTextBox:true, margin:0});
  s.addText("Septiembre 2026",{x:1.10, y:6.55, w:4, h:0.30, fontFace:BF, fontSize:9.5,
    color:G2, isTextBox:true, margin:0});
};

L.guia = () => { const s=nueva();
  titulo(s,"Cómo leer esta presentación",
    "Doce fuentes, y cada una llama PYME a una cosa distinta. Por eso cada lámina lo dice");
  const R=[
   ["1  Una fuente, una sección","Cada sección abre con una ficha: qué es la fuente, qué datos hemos obtenido de ella y por qué aplica a PYME, o hasta dónde."],
   ["2  La etiqueta de arriba a la derecha","Cada lámina de datos lleva la definición de PYME de su fuente. El color dice si coincide con la estándar de la UE, con uno solo de sus criterios o con ninguno."],
   ["3  Solo datos observados","No hay ROE ni márgenes: exigirían supuestos, como las comisiones fuera de España, que los datos no soportan. Se describe el mercado, no su rentabilidad."]];
  R.forEach((r,i)=>tarjeta(s, M, 1.80+i*1.52, 6.20, 1.34, r[0], r[1], "F2F4F6", 10));
  /* derecha: la definicion estandar y los colores */
  const x0=7.35;
  s.addText("La definición estándar de la UE",{x:x0, y:1.80, w:5.3, h:0.30, fontFace:HF,
    fontSize:12.5, bold:true, color:PRIM, isTextBox:true, margin:0});
  s.addText("Recomendación 2003/361/CE. No es vinculante: solo obliga donde una norma la adopta.",
    {x:x0, y:2.12, w:5.3, h:0.42, fontFace:BF, fontSize:9, color:MUT, isTextBox:true, margin:0});
  tabla(s, x0, 2.60, 5.30, [["","Micro","Pequeña","Mediana"],["Empleados","< 10","< 50","< 250"],
    ["Facturación","≤ 2 M€","≤ 10 M€","≤ 50 M€"],["o balance","≤ 2 M€","≤ 10 M€","≤ 43 M€"]],
    [1.55,1.25,1.25,1.25],{negrita:true, rh:0.30});
  s.addText("Qué dice el color de la etiqueta",{x:x0, y:4.08, w:5.3, h:0.30, fontFace:HF,
    fontSize:12.5, bold:true, color:PRIM, isTextBox:true, margin:0});
  [["ue","coincide con la estándar de la UE"],["empl","usa uno solo de sus criterios"],
   ["interna","usa otra definición, o mide el préstamo"],["ninguna","no distingue tamaño"]]
   .forEach((e,i)=>{
     const d=DEF[e[0]], y=4.48+i*0.46;
     s.addShape(pres.ShapeType.roundRect,{x:x0, y:y, w:0.55, h:0.32, fill:{color:d.c},
       rectRadius:0.06, line:{color:d.c}});
     s.addText(e[1],{x:x0+0.70, y:y, w:4.5, h:0.32, fontFace:BF, fontSize:10, color:TXT,
       valign:"middle", isTextBox:true, margin:0});});
  fuente(s,"Umbrales: Comisión Europea, DG GROW, «SME definition». Definición de cada fuente leída en su normativa o metodología: notas.md del repositorio, apartados 2.77 a 2.81.");
};

L.mapa = () => { const s=nueva();
  titulo(s,"Las doce fuentes, y qué llama PYME cada una",
    "Orden de la presentación · Solo dos usan la definición estándar completa");
  const F=[["1","BCE · MIR y BSI","Precio del crédito y coste de los depósitos","importe"],
   ["2","BCE · SAFE","Rechazo, resultado de la solicitud, brecha de financiación","empl"],
   ["3","EBA · Risk Dashboard","Tamaño del crédito PYME y mora por segmento","ue"],
   ["4","EBA · COREP, parámetros IRB","Probabilidad de impago y severidad de la PYME","interna"],
   ["5","EBA · Transparency Exercise","Densidad de RWA de la PYME; cartera de 5 bancos españoles","mixta"],
   ["6","OCDE · Scoreboard","Spread PYME frente a gran empresa, 2011–2022","nacional"],
   ["7","Banco de España · Boletín","Precio con y sin comisiones por tramo; autónomos","importe"],
   ["8","Banco de España · Central de Balances","Rentabilidad y coste de la deuda por tamaño de empresa","ue"],
   ["9","CESGAR","Demanda, destino y obstáculos de la financiación","emplaut"],
   ["10","EUF, AEF y Assifact","Volumen de factoring y confirming","ninguna"],
   ["11","Banco Mundial · Doing Business","Información crediticia y recuperación en concurso","entorno"],
   ["12","Informes de resultados de bancos","Cuentas de los segmentos de empresas","gestion"]];
  const rows=[["#","Fuente","Qué hemos obtenido","Qué llama PYME"].map((c,i)=>({text:c,
    options:Object.assign({},hdr,{fontSize:9, align:"left", fill:{color:DARK}})}))];
  F.forEach(f=>{const d=DEF[f[3]];
    rows.push([{text:f[0],options:cel(null,{fontSize:9,bold:true,color:PRIM})},
      {text:f[1],options:cel(null,{fontSize:9,bold:true,align:"left"})},
      {text:f[2],options:cel(null,{fontSize:8.5,align:"left"})},
      {text:d.t,options:cel(null,{fontSize:8,bold:true,align:"left",color:DARK,fill:{color:d.c}})}]);});
  s.addTable(rows,{x:M, y:1.70, w:W-2*M, colW:[0.50,3.35,4.55,3.57], rowH:0.355, fontFace:BF,
    border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,5,1,5]});
  fuente(s,"Estándar completa: mora de PYME (FINREP) y Central de Balances. Un solo criterio: SAFE y CESGAR (empleados), capital por método estándar (facturación). El resto usa otra definición, mide el préstamo o no distingue tamaño.");
};

/* ================================================================== */
/* 1 · BCE, MIR y BSI                                                  */
/* ================================================================== */
L.f_mir = () => ficha({nombre:"MIR y BSI", inst:"Banco Central Europeo · estadísticas de tipos de interés y de balance de los bancos", def:"importe",
  que:"El MIR recoge cada mes el tipo de las operaciones nuevas de los bancos de la zona euro, por producto, plazo y tramo de importe. El BSI da los saldos de préstamos y depósitos por sector.",
  datos:["Tipo de los préstamos a empresas en tres tramos de importe, de enero de 2022 a julio de 2026",
         "Prima PYME: lo que paga de más el préstamo pequeño frente al grande",
         "Tipo del circulante: descubiertos y líneas de crédito",
         "Coste de los depósitos de empresa, de hogares y del sistema, ponderado con los saldos del BSI"],
  porque:"No mide la empresa, mide el PRÉSTAMO. El tramo de hasta 1 M€ es el corte que se usa como aproximación a la PYME, pero entra la gran empresa que pide poco y queda fuera la mediana que pide mucho. Excluye al autónomo, que es un hogar. El circulante y los depósitos no tienen tramo: son de todas las empresas.",
  cobertura:"Siete países · mensual · operaciones nuevas, sin comisiones"});

L.mir_tramos = () => { const s=nueva();
  const t=X.mir.tramos;
  const n=P.filter((p,i)=>t["Hasta 0,25 M EUR"][i]>t["Mas de 1 M EUR"][i]).length;
  cab(s,`El préstamo pequeño es el más caro en ${n===6?"seis":n} de los siete países`,
    "Tipo de los préstamos nuevos a empresas por tramo de importe · Media de 2026 ponderada por volumen · Sin comisiones","importe");
  barras(s,{x:M, y:1.70, w:8.05, h:4.55, series:[["Hasta 0,25 M€",t["Hasta 0,25 M EUR"]],
    ["0,25 a 1 M€",t["Mas de 0,25 y hasta 1 M EUR"]],["Más de 1 M€",t["Mas de 1 M EUR"]]],
    colors:[PRIM,AZUL,GRIS], max:6, fmt:'0.0'});
  const es=P.indexOf(FOCO);
  tarjeta(s, 9.05, 1.70, 3.60, 2.05, "España es la excepción",
    `Su préstamo de hasta 0,25 M€ cuesta ${n1(t["Hasta 0,25 M EUR"][es],2)} % y el de más de 1 M€, ${n1(t["Mas de 1 M EUR"][es],2)} %: el pequeño sale más barato que el grande.`, YEL3);
  s.addText("Peso del préstamo de hasta 1 M€ en la nueva producción",{x:9.05, y:3.95, w:3.60,
    h:0.40, fontFace:HF, fontSize:10.5, bold:true, color:DARK, isTextBox:true, margin:0});
  barFoco(s,{x:8.95, y:4.30, w:3.75, h:2.05, values:X.mir.peso1m, dir:"bar", fmt:'0"%"',
    sinEje:true, max:65});
  fuente(s,"BCE, MIR, préstamos a sociedades no financieras distintos de descubiertos y tarjetas, operaciones nuevas, fijación inicial total, enero–julio de 2026. Los tres tramos no se solapan. El tramo mide el importe del préstamo, no el tamaño de la empresa.");
};

L.mir_prima = () => { const s=nueva();
  const E=X.mir.prima.estrecha, AM=X.mir.prima.amplia;
  const ser={}; P.forEach(p=>{ ser[p]=E.serie[p==="España"?"Espana":p].anual; });
  cab(s,"La prima del préstamo pequeño ha desaparecido en España",
    "Prima PYME: tipo del préstamo de hasta 0,25 M€ menos el de más de 1 M€, en puntos · Media anual ponderada por volumen · 2026 = enero a julio","importe");
  lineasFoco(s,{x:M, y:1.70, w:7.95, h:4.35, labels:E.anios, series:ser, min:-0.5, max:2.0,
    fmtEje:'0.0'});
  const f=[["Últimos 12 meses","≤0,25 M€\nvs >1 M€","≤1 M€\nvs >1 M€"]];
  P.forEach(p=>{const k=p==="España"?"Espana":p;
    f.push([p, mas(E.serie[k].u12,2), mas(AM.serie[k].u12,2)]);});
  tabla(s, 9.05, 1.70, 3.60, f, [1.40,1.10,1.10], {foco:FOCO, rh:0.30});
  const es=E.serie.Espana;
  tarjeta(s, 9.05, 4.40, 3.60, 1.95, "Con las dos definiciones",
    `De ${mas(es.anual[0],2)} pp en 2022 a ${mas(es.u12,2)} pp. En ${es.neg} de los ${es.n} meses el préstamo pequeño fue más barato que el grande.`, YEL3);
  fuente(s,"BCE, MIR. Definición estrecha: tramos extremos, la habitual en los informes del sector. Amplia: corte de 1 M€. La conclusión no cambia con ninguna de las dos. Serie mensual completa en prestamos_personales/prima_pyme.csv.");
};

L.mir_circ = () => { const s=nueva();
  cab(s,"El circulante no es sistemáticamente más caro que el préstamo",
    "Tipo del circulante (descubiertos y líneas de crédito) frente al préstamo a empresas, todas las cuantías · Media de 2026","ninguna");
  barras(s,{x:M, y:1.70, w:8.05, h:4.55, series:[["Circulante",X.mir.circ],
    ["Préstamo, todas las cuantías",X.mir.prestamo_total]], colors:[PRIM,GRIS], max:6, fmt:'0.00'});
  const d=P.map((p,i)=>X.mir.circ[i]-X.mir.prestamo_total[i]);
  const mas_caro=P.filter((p,i)=>d[i]>0.05).length;
  tarjeta(s, 9.05, 1.70, 3.60, 2.30, "Más caro en "+mas_caro+" de siete",
    `Más caro en Alemania (${mas(d[1],2)} pp), Portugal, Italia y España; más barato en Países Bajos (${mas(d[5],2)} pp), Francia e Irlanda.`, "F2F4F6");
  tarjeta(s, 9.05, 4.15, 3.60, 2.10, "Por qué no es un dato de PYME",
    "El MIR no desglosa el circulante por tramo de importe. Es el precio de todas las empresas, y por eso se compara con el préstamo de todas las cuantías, no con el tramo PYME.", "F2F4F6");
  fuente(s,"BCE, MIR: descubiertos y crédito renovable (serie sin tarjetas) y préstamos a sociedades no financieras de todas las cuantías, operaciones nuevas, 2026. Sin comisiones: la de disponibilidad del circulante no la publica ninguna estadística.");
};

L.mir_depositos = () => { const s=nueva();
  const D=X.mir.depositos;
  cab(s,"España es donde más se paga el depósito de empresa frente al del sistema",
    "Coste medio de los depósitos a la vista y a plazo, ponderado por saldos · 2026","ninguna");
  barras(s,{x:M, y:1.70, w:8.05, h:4.55, series:[["Empresas",D.empresa],["Hogares",D.hogares],
    ["Sistema (empresas y hogares)",D.sistema]], max:1.5, fmt:'0.00', fmtEje:'0.0"%"'});
  const es=P.indexOf(FOCO);
  tarjeta(s, 9.05, 1.70, 3.60, 2.25, "España, la mayor distancia",
    `La empresa española cobra ${n1(D.empresa[es],2)} % por sus depósitos y el hogar ${n1(D.hogares[es],2)} %. Es la diferencia más grande de los siete: ${Math.round((D.empresa[es]-D.sistema[es])*100)} pb sobre el sistema.`, YEL3);
  tarjeta(s, 9.05, 4.10, 3.60, 2.15, "Por qué no es un dato de PYME",
    "Es el depósito de todas las sociedades no financieras, incluida la tesorería de la gran empresa. El BCE no lo desglosa por tamaño.", "F2F4F6");
  fuente(s,"BCE, MIR (tipos de depósito de nueva producción, sector 2240 empresas y 2250 hogares) ponderados por los saldos a la vista y a plazo del BSI. El BSI es la estadística de balance de los bancos de la zona euro.");
};

/* ================================================================== */
/* 2 · BCE, SAFE                                                       */
/* ================================================================== */
L.f_safe = () => ficha({nombre:"SAFE", inst:"Banco Central Europeo · Survey on the Access to Finance of Enterprises", def:"empl",
  que:"Encuesta semestral del BCE a empresas de la zona euro sobre su acceso a la financiación: si piden crédito, qué obtienen y cómo cambia su necesidad y su disponibilidad.",
  datos:["Resultado de la solicitud de préstamo bancario: todo, una parte, rechazo por precio o rechazo del banco",
         "Tasa de rechazo, desde 2009",
         "Brecha de financiación: indicador de cambio que cruza necesidad y disponibilidad"],
  porque:"Es la fuente más directamente de PYME: pregunta a la empresa y la clasifica por su número de empleados, menos de 250. No usa facturación ni balance, así que es uno de los dos criterios de la definición estándar. Es una encuesta: da porcentajes de empresas, no importes.",
  cobertura:"Siete países más la zona euro · semestral · 2009-S1 a 2025-S2"});

L.safe_rechazo = () => { const s=nueva();
  const R=X.safe.rechazo.datos, PZ=["Espana","Alemania","Francia","Italia","Portugal","P. Bajos","Irlanda"];
  cab(s,"El crédito se concede; lo que cambia es cómo se raciona",
    "Resultado de la solicitud de préstamo bancario de las PYME, en % de las que lo pidieron · Segundo semestre de 2025","empl");
  barFoco(s,{x:M, y:1.70, w:6.40, h:2.55, values:PZ.map(p=>R[p].rechazo), max:16,
    tit:"Fue rechazada, % de las que solicitaron"});
  const f=[["","Obtuvo\ntodo","Solo\nuna parte","Renunció\npor precio","Fue\nrechazada"]];
  PZ.forEach((p,i)=>f.push([P[i], n1(R[p].todo)+" %", n1(R[p].parcial)+" %", n1(R[p].coste)+" %", n1(R[p].rechazo)+" %"]));
  f.push(["Zona euro", n1(R["Zona euro (referencia)"].todo)+" %", n1(R["Zona euro (referencia)"].parcial)+" %",
          n1(R["Zona euro (referencia)"].coste)+" %", n1(R["Zona euro (referencia)"].rechazo)+" %"]);
  tabla(s, M, 4.40, 6.40, f, [1.40,1.25,1.25,1.25,1.25], {foco:FOCO, rh:0.235, fs:8.5});
  tarjeta(s, 7.35, 1.70, 5.30, 1.55, "Alemania rechaza poco y raciona mucho",
    `Solo rechaza al ${n1(R.Alemania.rechazo)} %, pero el ${n1(R.Alemania.parcial)} % recibe una parte y el ${n1(R.Alemania.coste)} % renuncia por el precio. Italia casi no rechaza: ${n1(R.Italia.rechazo)} %.`, "F2F4F6");
  tarjeta(s, 7.35, 3.40, 5.30, 1.40, "España, en la media",
    `${n1(R.Espana.rechazo)} % de rechazo en el semestre y ${n1(R.Espana.media3a)} % de media en tres años, frente al ${n1(R["Zona euro (referencia)"].media3a)} % de la zona euro.`, YEL3);
  tarjeta(s, 7.35, 4.95, 5.30, 1.35, "Un semestre no es una tendencia",
    `La serie es muy volátil: Irlanda ha ido de ${n1(R.Irlanda.min)} % a ${n1(R.Irlanda.max)} % desde 2022. Hay que leerla en medias.`, "F2F4F6");
  fuente(s,"BCE, SAFE, pregunta Q7B, préstamo bancario, media ponderada. Base: empresas que SOLICITARON. Las filas no suman 100: faltan «pendiente» y «no sabe». Es un porcentaje de empresas, no de importes.");
};

L.safe_brecha = () => { const s=nueva();
  const B=X.safe.brecha;
  /* racha final de semestres negativos, calculada, no contada a ojo */
  let k=B.es.length-1; while(k>=0 && B.es[k]<0) k--;
  const racha=B.es.length-1-k, desde=B.periodos[k+1];
  cab(s,`En España la brecha de financiación se cierra desde ${desde.replace("-S"," S")}`,
    "Brecha de financiación de las PYME, España frente a la zona euro · Semestral","empl");
  lineas(s,{x:M, y:1.70, w:8.05, h:4.45, labels:B.periodos, series:[["España",B.es],["Zona euro",B.u2]],
    colors:[PRIM,AZUL], freq:2, fmtEje:'0'});
  tarjeta(s, 9.05, 1.70, 3.60, 2.35, "Qué mide, y qué no",
    "Es un indicador de CAMBIO: positivo, la brecha se abre; negativo, se cierra. No mide cuánta necesidad queda sin cubrir, y cruza cinco instrumentos, no solo el préstamo bancario.", "F2F4F6");
  const u=B.es.length-1;
  tarjeta(s, 9.05, 4.20, 3.60, 1.95, "España frente a la zona euro",
    `Último dato: ${men(B.es[u])} en España y ${mas(B.u2[u])} en la zona euro. España lleva ${racha} semestres seguidos en negativo; la zona euro, ninguno en ese tiempo.`, YEL3);
  fuente(s,"BCE, SAFE, indicador compuesto de brecha de financiación: por empresa e instrumento vale ±1 o ±0,5 según se muevan la necesidad y la disponibilidad; media ponderada de cinco instrumentos, por 100. PYME: menos de 250 empleados.");
};

/* ================================================================== */
/* 3 · EBA, Risk Dashboard (FINREP)                                    */
/* ================================================================== */
L.f_rd = () => ficha({nombre:"Risk Dashboard", inst:"Autoridad Bancaria Europea (EBA) · indicadores de riesgo trimestrales, con datos contables FINREP", def:"ue",
  que:"Publicación trimestral de la EBA con los indicadores de riesgo de la banca europea, agregados por país a partir del reporting contable (FINREP) de los bancos de su muestra.",
  datos:["Saldo de préstamos a PYME por país: el tamaño del mercado",
         "Tasa de mora (NPL) por segmento: hogares, empresas, PYME e inmueble comercial",
         "Evolución de la mora de la PYME, del primer trimestre de 2024 al primero de 2026",
         "Peso de la PYME dentro del crédito a empresas"],
  porque:"Es una de las dos fuentes que usan la definición estándar COMPLETA: el anexo V del reglamento de reporting remite a la Recomendación 2003/361/CE, con empleados y facturación o balance. Es, por tanto, el dato de PYME más limpio que tenemos. Límite: cubre la muestra de bancos de la EBA, no el sistema entero.",
  cobertura:"Siete países · trimestral · 2024-Q1 a 2026-Q1 · muestra de bancos supervisados por la EBA"});

L.rd_tamano = () => { const s=nueva();
  const T=X.eba_rd.saldo_pyme, te=X.eba_rd.te_exposicion, pe=X.eba_rd.peso_pyme_empresas;
  const tot=T.valores.reduce((a,b)=>a+b,0), mx=P.map((p,i)=>i).sort((a,b)=>T.valores[b]-T.valores[a]);
  const cuota=v=>100*v/tot, mm=v=>Math.round(v).toLocaleString("es-ES");
  const es=P.indexOf(FOCO), rk=mx.indexOf(es)+1, ord=["","primer","segundo","tercer","cuarto","quinto","sexto","séptimo"];
  cab(s,`${P[mx[0]]} tiene casi la mitad del crédito a PYME de los siete; España es el ${ord[rk]} mercado`,
    "Saldo bruto de préstamos a PYME de los bancos de la muestra de la EBA, miles de millones de euros · Primer trimestre de 2026","ue");
  barFoco(s,{x:M, y:1.70, w:6.15, h:4.55, values:T.valores.map(v=>v/1000), max:1000, fmt:'0.0', fmtEje:'0',
    tit:"Préstamos a PYME, miles de millones de €"});
  const hd=t=>({text:t,options:Object.assign({},hdr,{fontSize:8,fill:{color:DARK}})});
  const filas=[[hd("País"),hd("Crédito PYME\nM€, 2026-Q1"),hd("Cuota de\nlos siete"),hd("Peso en crédito\na empresas"),hd("Contraste TE\nM€, jun. 2025")]];
  P.forEach((p,i)=>{ const f=p===FOCO, o=x=>cel(null,Object.assign({fontSize:8.5,bold:f,color:f?PRIM:TXT,fill:{color:f?YEL3:"FFFFFF"}},x||{}));
    filas.push([{text:p,options:o({align:"left"})},{text:mm(T.valores[i]),options:o()},
      {text:n1(cuota(T.valores[i]),1)+" %",options:o()},{text:n1(pe[i],1)+" %",options:o()},
      {text:mm(te[i]),options:o({color:f?PRIM:MUT})}]);});
  s.addTable(filas,{x:7.05, y:1.70, w:5.60, colW:[1.10,1.15,1.00,1.20,1.15], rowH:0.30,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,4,1,4]});
  const sEs=T.serie[FOCO], n=sEs.length;
  tarjeta(s, 7.05, 4.45, 5.60, 1.80, "Cómo leerlo",
    `Los siete suman ${n1(tot/1e6,2)} billones, el ${n1(100*tot/T.ue,0)} % del crédito PYME de la muestra de la UE. Es el saldo de los bancos con sede en cada país, en base consolidada: incluye su negocio PYME fuera de él. España cae ${mm(sEs[n-2]-sEs[n-1])} M€ (${n1(100*(1-sEs[n-1]/sEs[n-2]),1)} %) en el último trimestre. El Transparency Exercise, que mide exposición y no solo préstamo, da cifras parecidas, pero con Alemania por delante de España.`, "F2F4F6", 9);
  fuente(s,"EBA, Risk Dashboard, anexo de datos del primer trimestre de 2026, hoja Loans_1: saldo bruto de préstamos y anticipos a sociedades no financieras, «of which SMEs» (FINREP, Recomendación 2003/361/CE). Contraste: EBA Transparency Exercise 2025, exposición PYME, junio 2025. La muestra de bancos puede variar entre trimestres.");
};

L.rd_segmentos = () => { const s=nueva();
  const S=X.eba_rd.segmentos;
  const peor=P.filter((p,i)=>S.pyme[i]>=Math.max(S.hogares[i],S.empresas[i])).length;
  cab(s,`La PYME es el segmento con más mora en ${peor===7?"los siete":peor+" de los siete"} países`,
    "Tasa de mora (NPL) por segmento, primer trimestre de 2026","ue");
  barras(s,{x:M, y:1.70, w:8.05, h:4.55, series:[["PYME",S.pyme],["Empresas, total",S.empresas],
    ["Hogares",S.hogares]], colors:[PRIM,AZUL,GRIS], max:7, fmt:'0.0'});
  const es=P.indexOf(FOCO);
  tarjeta(s, 9.05, 1.70, 3.60, 1.95, "España, la mora PYME más alta",
    `${n1(S.pyme[es],2)} %, frente a ${n1(Math.min(...S.pyme),2)} % en Países Bajos. Y es el único país donde la mora de los hogares (${n1(S.hogares[es],2)} %) supera la de las empresas.`, YEL3);
  tarjeta(s, 9.05, 3.80, 3.60, 2.45, "Por qué no se usa el «total cartera»",
    "El total de préstamos y anticipos del EBA incluye saldos en bancos centrales, administraciones y otros bancos, casi sin mora, y diluye distinto cada país: en Alemania más de la mitad del total no es crédito a clientes. Por eso se comparan segmentos.", "F2F4F6");
  fuente(s,"EBA, Risk Dashboard, anexo de datos del primer trimestre de 2026, desgloses «of which SMEs» (FINREP, Recomendación 2003/361/CE). Las barras son segmentos anidados: la PYME está dentro de las empresas.");
};

L.rd_serie = () => { const s=nueva();
  const SE=X.eba_rd.serie, q=SE.trimestres;
  cab(s,"La mora PYME española baja; la alemana y la francesa suben",
    "Tasa de mora (NPL) de la PYME, trimestral","ue");
  lineasFoco(s,{x:M, y:1.70, w:7.95, h:4.35, labels:q.map(x=>x.replace("-"," ")), series:SE.valores,
    min:2, max:7, fmtEje:'0.0"%"'});
  const f=[["","2024 T1","2026 T1","Cambio"]];
  P.forEach(p=>{const v=SE.valores[p]; f.push([p, n1(v[0],2)+" %", n1(v[v.length-1],2)+" %", mas(v[v.length-1]-v[0],2)]);});
  tabla(s, 9.05, 1.70, 3.60, f, [1.10,0.85,0.85,0.80], {foco:FOCO, rh:0.30});
  tarjeta(s, 9.05, 4.30, 3.60, 1.95, "Convergencia",
    "Los países que partían con más mora (España, Irlanda, Portugal) son los que más la reducen. Alemania y Francia van en sentido contrario.", "F2F4F6");
  fuente(s,"EBA, Risk Dashboard, anexos de datos trimestrales, «Non-financial corporations — of which SMEs», ratio de NPL. Muestra de bancos de la EBA en cada país.");
};

/* ================================================================== */
/* 4 · EBA, COREP (parametros IRB)                                     */
/* ================================================================== */
L.f_corep = () => ficha({nombre:"Parámetros IRB", inst:"Autoridad Bancaria Europea (EBA) · anexo de parámetros de riesgo, a partir del reporting de solvencia COREP C 9.02", def:"interna",
  que:"Los bancos que usan modelos internos (IRB) declaran al supervisor la probabilidad de impago (PD) y la severidad de la pérdida (LGD) de cada cartera. La EBA publica la mediana por país.",
  datos:["Probabilidad de impago a un año de la PYME (PD)",
         "Severidad de la pérdida si impaga (LGD)",
         "Pérdida esperada: PD por LGD"],
  porque:"Es un dato del segmento, pero NO armonizado: las instrucciones de COREP dicen que, en IRB, cada banco clasifica como PYME según su definición interna. Solo cubre la cartera que va por modelos internos, y es la mediana de los bancos, no una media ponderada.",
  cobertura:"Siete países · primer trimestre de 2026 · clase «Corporates – of which SME» · solo cartera IRB"});

L.corep_pd_lgd = () => { const s=nueva();
  const C=X.corep;
  cab(s,"Italia y Francia, la PD más alta; Portugal, la LGD más alta",
    "Parámetros de riesgo de la cartera IRB de PYME · Mediana de entidades declarantes · Primer trimestre de 2026","interna");
  barFoco(s,{x:M, y:1.70, w:5.90, h:3.95, values:C.pd, max:2.8, fmt:'0.00"%"',
    tit:"Probabilidad de impago a un año (PD)"});
  barFoco(s,{x:6.75, y:1.70, w:5.90, h:3.95, values:C.lgd, max:48, fmt:'0.0"%"',
    tit:"Severidad de la pérdida (LGD)"});
  const es=P.indexOf(FOCO);
  tarjeta(s, M, 5.78, 5.90, 0.72, "España",
    `PD de ${n1(C.pd[es],2)} % y LGD de ${n1(C.lgd[es],1)} %: la tercera PD más alta y una severidad en la media.`, YEL3, 9);
  tarjeta(s, 6.75, 5.78, 5.90, 0.72, "Portugal: exactamente 40,0 %",
    "Es el valor que fija el supervisor en el IRB básico: el banco no estima su propia severidad.", "F2F4F6", 9);
  fuente(s,"EBA, anexo de parámetros de riesgo (COREP C 9.02), clase IRB «Corporates – of which SME», mediana de entidades, 2026-Q1. PYME según la definición interna de cada banco.");
};

/* ================================================================== */
/* 5 · EBA, Transparency Exercise                                      */
/* ================================================================== */
L.f_te = () => ficha({nombre:"Transparency Exercise", inst:"Autoridad Bancaria Europea (EBA) · datos de solvencia banco a banco", def:"mixta",
  que:"Publicación anual de la EBA con los datos de solvencia y cartera de cada banco supervisado, con desglose por país de la contraparte y por método de cálculo del capital.",
  datos:["Densidad de RWA de la PYME: capital regulatorio por euro prestado",
         "Separada por método estándar y por modelos internos (IRB)",
         "Cartera PYME en España de los cinco grandes bancos españoles: exposición, densidad, mora y cobertura"],
  porque:"Mezcla dos definiciones en una sola cifra: la parte estándar define PYME por facturación hasta 50 M€ (art. 501 del CRR); la parte IRB, con la definición interna de cada banco. Además incluye la PYME minorista y la hipotecaria, y se agrega por supervisor, así que entra la PYME extranjera de los bancos del país.",
  cobertura:"Siete países · junio de 2025 · cinco bancos españoles con contraparte en España"});

L.te_densidad = () => { const s=nueva();
  const T=X.te;
  cab(s,"El método pesa más que el país: el IRB español apenas ahorra capital",
    "Densidad de RWA de la cartera PYME (RWA sobre valor de exposición) por método · Junio de 2025","mixta");
  barras(s,{x:M, y:1.70, w:8.05, h:4.55, series:[["Método estándar",T.sa],["Modelos internos (IRB)",T.irb]],
    colors:[GRIS,PRIM], max:90, fmt:'0'});
  const es=P.indexOf(FOCO), de=P.indexOf("Alemania");
  tarjeta(s, 9.05, 1.70, 3.60, 2.25, "Estándar parecido, IRB muy distinto",
    `Por método estándar todos pesan entre ${Math.round(Math.min(...T.sa))} y ${Math.round(Math.max(...T.sa))} %. Por IRB, de ${Math.round(Math.min(...T.irb))} % a ${Math.round(Math.max(...T.irb))} %.`, "F2F4F6");
  tarjeta(s, 9.05, 4.10, 3.60, 2.15, "España",
    `El IRB le rebaja la densidad ${n1(T.sa[es]-T.irb[es],1)} puntos; a Alemania, ${n1(T.sa[de]-T.irb[de],1)}. Y solo el ${n1(T.cuota_irb[es],0)} % de su cartera va por IRB, frente al ${n1(T.cuota_irb[de],0)} % alemán.`, YEL3);
  fuente(s,"EBA, EU-wide Transparency Exercise 2025, tr_cre.csv, junio 2025, Portfolio 1 = estándar y 2 = IRB, partidas 2520523 y 2520533, agregado por supervisor nacional. Incluye el factor de apoyo a PYME del art. 501 del CRR.");
};

L.te_bancos = () => { const s=nueva();
  const B=X.te.bancos;
  cab(s,"CaixaBank concentra un tercio de la PYME española de los cinco grandes",
    "Cartera PYME con contraparte en España de los cinco grandes bancos españoles · Junio de 2025","mixta");
  const tot=B.exposicion.reduce((a,b)=>a+b,0);
  barFoco(s,{x:M, y:1.70, w:6.20, h:4.55, labels:B.nombres, values:B.exposicion.map(v=>v/1000),
    foco:["Bankinter"], max:60, fmt:'0.0', fmtEje:'0', tit:"Exposición PYME en España, miles de millones de €"});
  const f=[["Banco","Cuota","Densidad","Mora","Cobertura"]];
  B.nombres.forEach((b,i)=>f.push([b, n1(100*B.exposicion[i]/tot,1)+" %", n1(B.densidad[i],1)+" %",
    n1(B.mora[i],2)+" %", n1(B.cobertura[i],1)+" %"]));
  tabla(s, 7.20, 1.70, 5.45, f, [1.45,1.00,1.00,1.00,1.00], {foco:"Bankinter", rh:0.34});
  tarjeta(s, 7.20, 3.95, 5.45, 2.30, "Qué se ve",
    `Mora de ${n1(Math.min(...B.mora),2)} % a ${n1(Math.max(...B.mora),2)} %: Bankinter la más baja y Santander la más alta, con la menor cobertura. La densidad va de ${n1(Math.min(...B.densidad),1)} % (Sabadell) a ${n1(Math.max(...B.densidad),1)} % (BBVA), por el peso de sus modelos IRB.`, "F2F4F6");
  fuente(s,"EBA, EU-wide Transparency Exercise 2025, contraparte en España (código 28), partidas SME de exposición, RWA, default y provisiones. Cuota sobre la suma de los cinco, no sobre el mercado.");
};

/* ================================================================== */
/* 6 · OCDE                                                            */
/* ================================================================== */
L.f_ocde = () => ficha({nombre:"Scoreboard", inst:"OCDE · Financing SMEs and Entrepreneurs, cuadro de indicadores anual", def:"nacional",
  que:"Informe anual de la OCDE que recopila, país por país, indicadores de financiación de la PYME a partir de las estadísticas de cada banco central o ministerio.",
  datos:["Spread entre el tipo del préstamo PYME y el de la gran empresa, 2007–2022",
         "Mora, rechazo, retrasos de pago y préstamos con aval público",
         "Volumen de factoring"],
  porque:"Cada país reporta con SU definición nacional de PYME: unos por tamaño de empresa, otros por importe del préstamo. La OCDE lo documenta en una ficha metodológica por país. Sirve para ver tendencias dentro de cada país, no para comparar niveles entre países. Alemania no publica el spread.",
  cobertura:"Seis países, sin Alemania · anual · último dato 2022"});

L.ocde_spread = () => { const s=nueva();
  const O=X.ocde;
  cab(s,"Una fuente distinta confirma lo mismo: el spread PYME español se ha comprimido",
    "Spread entre el tipo del préstamo PYME y el de la gran empresa, en puntos básicos · Definición nacional de cada país","nacional");
  lineasFoco(s,{x:M, y:1.70, w:7.95, h:4.35, labels:O.anios, series:O.spread, min:0, max:320,
    fmtEje:'0'});
  const f=[["","2011","2022"]];
  Object.keys(O.spread).forEach(p=>{const v=O.spread[p]; f.push([p, v[0]==null?"—":Math.round(v[0]), Math.round(v[v.length-1])]);});
  tabla(s, 9.05, 1.70, 3.60, f, [1.40,1.10,1.10], {foco:FOCO, rh:0.30});
  const e=O.spread["España"];
  tarjeta(s, 9.05, 4.00, 3.60, 2.25, "Dos fuentes, dos definiciones, una señal",
    `En España, de ${Math.round(e[0])} pb en 2011 a ${Math.round(e[e.length-1])} pb en 2022, el más bajo de los seis. El MIR, que mide otra cosa, lleva la prima a cero en 2026.`, YEL3);
  fuente(s,"OCDE, Financing SMEs and Entrepreneurs Scoreboard, medida INTEREST_RATE_SPREAD. Definición nacional de PYME, no armonizada: se leen tendencias, no niveles entre países. Países Bajos desde 2011.");
};

/* ================================================================== */
/* 7 · Banco de Espana, Boletin Estadistico                            */
/* ================================================================== */
L.f_bde = () => ficha({nombre:"Boletín Estadístico", inst:"Banco de España · capítulo 19, tipos de interés", def:"importe",
  que:"El Banco de España publica los tipos del crédito nuevo con más detalle que el BCE: con y sin comisiones, y separando a las personas físicas que desarrollan actividades productivas.",
  datos:["Tipo con comisiones (TAE) y sin ellas (TEDR) por tramo de importe: la cuña es la comisión",
         "Tipo, TAE y volumen del crédito a autónomos",
         "Tipo y saldo del circulante en España"],
  porque:"Los tramos son de IMPORTE, como en el MIR: el mismo proxy de PYME, con sus mismos límites. Es la única fuente de los siete países que publica la comisión del crédito a empresas. El autónomo aparece aparte, como persona física: está fuera de todas las estadísticas de sociedades.",
  cobertura:"España · mensual · 2026"});

L.bde_comisiones = () => { const s=nueva();
  const B=X.bde, A=B.autonomos;
  cab(s,"La comisión se concentra en el préstamo pequeño",
    "Tipo con comisiones (TAE) y sin ellas (TEDR) del crédito nuevo a empresas por tramo de importe · España, media de 2026 ponderada por volumen","importe");
  barras(s,{x:M, y:1.70, w:6.50, h:4.20, labels:B.tramos, series:[["Con comisiones (TAE)",B.tae],
    ["Sin comisiones (TEDR)",B.tedr]], colors:[PRIM,GRIS], max:5.5, fmt:'0.00'});
  s.addText("Cuña de comisiones, pb",{x:7.45, y:1.70, w:2.40, h:0.28, fontFace:HF, fontSize:10.5,
    bold:true, color:DARK, isTextBox:true, margin:0});
  B.tramos.forEach((t,i)=>cifra(s, 7.45, 2.05+i*1.28, 2.40, String(B.cuna[i]), t, i===0?PRIM:DARK));
  tarjeta(s, 10.05, 1.70, 2.60, 2.15, "El autónomo paga más",
    `${n1(A.auto,2)} % sin comisiones (TEDR), ${A.dif_vs_025} pb más que la sociedad del tramo pequeño. ${A.vol_auto} M€ nuevos al mes.`, YEL3);
  tarjeta(s, 10.05, 4.00, 2.60, 1.90, "Solo en España",
    "Ningún otro de los siete publica la comisión del crédito a empresas.", "F2F4F6");
  fuente(s,"Banco de España, Boletín Estadístico, capítulo 19: TAE y TEDR de nuevas operaciones con sociedades no financieras por tramo, y crédito a personas físicas para actividades productivas (autónomos). La cuña TAE − TEDR anualiza la comisión.");
};

/* ================================================================== */
/* 8 · Banco de Espana, Central de Balances                            */
/* ================================================================== */
L.f_cb = () => ficha({nombre:"Central de Balances", inst:"Banco de España · Central de Balances Integrada, cuentas de las empresas no financieras", def:"ue",
  que:"Base de datos del Banco de España con las cuentas anuales de las empresas españolas, a partir del Registro Mercantil. Publica ratios de rentabilidad y endeudamiento por tamaño.",
  datos:["Rentabilidad del activo (ROA) por tamaño de empresa",
         "Coste efectivo de la deuda con coste",
         "Diferencia entre los dos, desde 1997"],
  porque:"Es la otra fuente que usa la definición estándar COMPLETA: clasifica por tamaño según la Recomendación 2003/361/CE. Es además la única que mira a la PYME desde su propio balance, no desde el banco: dice cuánto puede pagar.",
  cobertura:"España · anual · 1997–2024"});

L.cb_capacidad = () => { const s=nueva();
  const C=X.cb;
  cab(s,"La pequeña empresa gana 2,1 puntos más de lo que paga por su deuda",
    `Rentabilidad del activo y coste de la deuda por tamaño de empresa · España, ${C.anio}`,"ue");
  barras(s,{x:M, y:1.70, w:5.60, h:4.55, labels:C.tam, series:[["Rentabilidad del activo",C.roa],
    ["Coste de la deuda",C.coste]], colors:[PRIM,GRIS], max:12, fmt:'0.0'});
  lineas(s,{x:6.55, y:1.95, w:6.10, h:2.90, labels:C.dif_serie.map(x=>x[0]),
    series:[["Pequeñas: rentabilidad menos coste, pp",C.dif_serie.map(x=>x[1])]], colors:[PRIM],
    min:-0.5, max:3, fmtEje:'0.0'});
  s.addText("Diferencia de la pequeña empresa, 2015–2024",{x:6.55, y:1.70, w:6.1, h:0.26,
    fontFace:HF, fontSize:10.5, bold:true, color:DARK, isTextBox:true, margin:0});
  tarjeta(s, 6.55, 5.00, 6.10, 1.25, "La mediana es otro cliente",
    `La mediana tiene ${n1(C.dif[1])} puntos de diferencia, casi el triple que la pequeña (${n1(C.dif[0])}), con un ROA del ${n1(C.roa[1])} %.`, "F2F4F6", 9.5);
  fuente(s,"Banco de España, Central de Balances Integrada: rentabilidad ordinaria del activo neto y tipo efectivo pagado por la deuda con coste. Tamaño según la Recomendación 2003/361/CE.");
};

/* ================================================================== */
/* 9 · CESGAR                                                          */
/* ================================================================== */
L.f_cesgar = () => ficha({nombre:"Informe de financiación de la pyme", inst:"CESGAR · Confederación Española de Sociedades de Garantía · XV Informe, 2025", def:"emplaut",
  que:"Encuesta anual a pymes españolas sobre sus necesidades de financiación, el uso que les dan, los productos que usan y los obstáculos que encuentran.",
  datos:["Necesidad de financiación y grado de bancarización",
         "Destino de la financiación y productos usados",
         "Obstáculos para obtenerla y resultado de las solicitudes"],
  porque:"Define la PYME por empleados, menos de 250, e INCLUYE a las personas físicas: es la única fuente del conjunto que cuenta al autónomo como pyme. Es una encuesta: da porcentajes de empresas, nunca tipos de interés ni importes.",
  cobertura:"España · anual · universo DIRCE"});

L.cesgar = () => { const s=nueva();
  const C=X.cesgar;
  const et=x=>x.replace("El precio de la financiacion","El precio").replace("Falta de comprension del negocio por la entidad","El banco no entiende el negocio")
    .replace("Tramites administrativos y otros","Trámites y otros").replace("Escasez de financiacion disponible","Poca financiación disponible");
  cab(s,"La pyme pide para circulante, y lo que más señala es el precio",
    "Encuesta a pymes españolas · Porcentajes de empresas, NO tipos de interés","emplaut");
  barFoco(s,{x:M, y:1.70, w:5.85, h:4.35, dir:"bar", labels:C.destino.map(x=>x[0]),
    values:C.destino.map(x=>x[1]), foco:["Circulante"], max:85, fmt:'0.0"%"', sinEje:true,
    tit:"Destino de la financiación, % de las que la necesitan"});
  barFoco(s,{x:6.80, y:1.70, w:5.85, h:4.35, dir:"bar", labels:C.obstaculos.map(x=>et(x[0])),
    values:C.obstaculos.map(x=>x[1]), foco:["El precio"], max:60, fmt:'0.0"%"', sinEje:true,
    tit:"Obstáculos señalados, % del total de encuestadas"});
  s.addText(`El ${n1(C.concedida,1)} % de las que piden financiación la obtienen y aceptan; solo al ${n1(C.denegada,1)} % se le deniega. El destino circulante sube desde el ${n1(C.circ_2024,1)} % de 2024.`,
    {x:M, y:6.12, w:W-2*M, h:0.40, fontFace:BF, fontSize:9.5, bold:true, color:DARK, isTextBox:true, margin:0});
  fuente(s,"CESGAR, XV Informe «La financiación de la pyme en España», resultados 2025. Obstáculos: base, el total de encuestadas; sobre las que señalan alguno, el precio sería el 42,5 %. Destino: respuesta múltiple.");
};

/* ================================================================== */
/* 10 · EUF, AEF y Assifact (factoring)                                */
/* ================================================================== */
L.f_fact = () => ficha({nombre:"Factoring y confirming", inst:"EUF (federación europea) · AEF (España) · Assifact (Italia)", def:"ninguna",
  que:"Las asociaciones del sector publican el volumen de créditos cedidos cada año. La EUF agrega los países europeos; la AEF y Assifact dan más detalle en España e Italia, incluido el confirming.",
  datos:["Volumen cedido por país y su peso sobre el PIB, 2025",
         "Serie histórica europea desde 2007",
         "Peso del confirming sobre el total en España e Italia"],
  porque:"No aplica: ninguna de las tres distingue por tamaño de empresa. El factoring es un producto muy de PYME, pero los datos son del mercado entero. Tampoco hay un precio público del factoring ni del confirming en ninguno de los siete países.",
  cobertura:"Siete países · anual · 2007–2025 · volumen cedido en el año, no saldo vivo"});

L.factoring = () => { const s=nueva();
  const F=X.factoring, ie=F.irlanda;
  cab(s,"Portugal y España, donde el factoring pesa más sobre la economía",
    "Volumen de créditos cedidos en el año, en % del PIB · 2025","ninguna");
  barFoco(s,{x:M, y:1.70, w:7.60, h:4.55, values:F.pib, max:25, fmt:'0.0"%"',
    tit:"Factoring cedido en 2025, % del PIB"});
  cifra(s, 8.70, 1.75, 1.85, n1(F.confirming["España"],1)+" %", "de las cesiones en España son confirming");
  cifra(s, 10.75, 1.75, 1.85, n1(F.confirming["Italia"],1)+" %", "en Italia", DARK);
  tarjeta(s, 8.70, 3.20, 3.95, 1.40, "El confirming es casi español",
    "España lo usa para más de la mitad de sus cesiones; Italia, casi nada. Es el producto que más distingue al mercado español.", YEL3);
  tarjeta(s, 8.70, 4.75, 3.95, 1.50, "Irlanda: el dato está congelado",
    `La EUF publica ${Math.round(ie.ultimo).toLocaleString("es-ES")} M€ en cada uno de los ${["","","dos","tres","cuatro","cinco","seis"][ie.congelado]} años de ${ie.desde} a 2025, sin cambiar. Su ${n1(F.pib[6],1)} % del PIB no describe el mercado actual.`, "F2F4F6");
  fuente(s,"EUF, datos anuales 2025 (penetración = volumen cedido / PIB); AEF y Assifact, cierre de 2025. Volumen cedido en el año, no saldo vivo. Ninguna de las tres fuentes distingue por tamaño de empresa.");
};

/* ================================================================== */
/* 11 · Banco Mundial                                                  */
/* ================================================================== */
L.f_bm = () => ficha({nombre:"Doing Business", inst:"Banco Mundial · Doing Business 2020, última edición comparable", def:"entorno",
  que:"Indicadores del marco en que se presta: cuánta información crediticia hay, qué derechos tiene el acreedor y cuánto se recupera, y en cuánto tiempo, cuando una empresa quiebra.",
  datos:["Tasa de recuperación en concurso y tiempo que tarda",
         "Profundidad de la información crediticia y derechos del acreedor",
         "Base de los índices de información y de recobro de la presentación anterior"],
  porque:"No es un dato de PYME ni de ningún segmento: describe el país. Se incluye porque explica parte de la diferencia de riesgo entre mercados. Es de 2019: el programa se cerró en 2021 y su sucesor aún no cubre los siete países.",
  cobertura:"Siete países · mayo de 2019"});

L.bm = () => { const s=nueva();
  const Mk=X.marco;
  cab(s,"Países Bajos e Irlanda recuperan más y antes en un concurso; Portugal, menos y más tarde",
    "Tasa de recuperación en concurso y tiempo de resolución · Doing Business 2020","entorno");
  barFoco(s,{x:M, y:1.70, w:5.90, h:4.00, values:Mk.recovery, max:100, fmt:'0.0',
    tit:"Tasa de recuperación, céntimos por dólar"});
  barFoco(s,{x:6.75, y:1.70, w:5.90, h:4.00, values:Mk.tiempo, max:3.5, fmt:'0.0',
    tit:"Tiempo de resolución del concurso, años"});
  tarjeta(s, M, 5.82, W-2*M, 0.70, "Recobro frente a riesgo",
    `Entre los siete países, el índice de recobro de la presentación anterior y el coste del riesgo de la PYME (PD × LGD, EBA) se mueven en sentido contrario: correlación de ${men(X.sintesis.rho_recobro_cor,2)}. La información crediticia, mucho menos (${men(X.sintesis.rho_info_pd,2)} con la PD).`, "F2F4F6", 9);
  fuente(s,"Banco Mundial, Doing Business 2020, dataset histórico, datos de mayo de 2019. Correlaciones sobre siete países: lectura descriptiva, no causal.");
};

/* ================================================================== */
/* 12 · Informes de resultados de bancos                               */
/* ================================================================== */
L.f_bancos = () => ficha({nombre:"Cuentas de los bancos", inst:"Informes de resultados de Commerzbank, ABN AMRO, Intesa Sanpaolo, CaixaBank y BPER · primer semestre de 2026", def:"gestion",
  que:"La cuenta de resultados que cada banco publica de sus segmentos de negocio, junto con la inversión crediticia de cada segmento.",
  datos:["Ingresos, margen de intereses, comisiones y costes por segmento",
         "Inversión crediticia del segmento, para expresarlo todo por euro prestado"],
  porque:"No es PYME: cada banco define sus segmentos para su propia gestión, y ninguno aísla la PYME. «Corporate Clients» o «Corporate Banking» mezclan gran empresa, PYME e institucionales; CaixaBank y BPER solo publican el grupo. Sirven como orden de magnitud, no como dato del segmento.",
  cobertura:"Cinco bancos de cuatro países · primer semestre de 2026 · de nueve analizados, solo dos publican segmento de empresas con comisiones"});

L.bancos = () => { const s=nueva();
  const B=X.bancos_ue.filter(b=>b.comisiones!=null);
  cab(s,"La banca de empresas cobra en comisiones alrededor del 1 % de lo que presta",
    "Comisiones netas anualizadas sobre la inversión crediticia de cada perímetro · Primer semestre de 2026","gestion");
  s.addChart(pres.ChartType.bar,[{name:"Comisiones / inversión", labels:B.map(b=>b.banco+"\n"+b.segmento),
    values:B.map(b=>b.comisiones)}], Object.assign({x:M, y:1.70, w:7.60, h:4.55, barDir:"col",
    chartColors:B.map(b=>b.es_segmento?AZUL:GRIS), varyColors:true, showValue:true,
    dataLabelPosition:"outEnd", dataLabelFontSize:9, dataLabelFormatCode:'0.00"%"', dataLabelColor:TXT,
    showLegend:false, valAxisMinVal:0, valAxisMaxVal:2.5, valAxisLabelFormatCode:'0.0"%"'}, EJE));
  leyenda(s, M+0.1, 6.28, [["segmento de empresas publicado",AZUL,2.6],["grupo, no segmento",GRIS,1.8]]);
  tarjeta(s, 8.70, 1.70, 3.95, 2.15, "Los dos segmentos de empresas",
    `Commerzbank ${n1(B[0].comisiones,2)} % y ABN AMRO ${n1(B[1].comisiones,2)} %. Son los únicos de nueve bancos que publican comisiones de un segmento de empresas.`, "F2F4F6");
  tarjeta(s, 8.70, 4.00, 3.95, 2.25, "Por qué BPER dobla",
    "BPER solo publica el grupo, que incluye comisiones de fondos y seguros de particulares. Por eso no es comparable con un segmento de empresas.", "F2F4F6");
  fuente(s,"Informes de resultados del primer semestre de 2026 e informes semestrales de Intesa y BPER para la inversión. Commerzbank publica trimestre (×4), el resto semestre (×2). Intesa no desglosa comisiones por división.");
};


/* ================================================================== */
/* Eficiencia del sistema y calidad de la informacion                  */
/* ================================================================== */
L.rd_eficiencia = () => { const s=nueva();
  const E=X.eficiencia, v=E.valores["2025"], v0=E.valores["2024"];
  const ord=P.map((p,i)=>i).sort((a,b)=>v[a]-v[b]);
  const abn=X.bancos_ue.find(b=>b.banco==="ABN AMRO");
  cab(s,`${P[ord[0]]} y ${P[ord[1]]}, los sistemas más eficientes; ${P[ord[6]]}, el que más gasta por euro de ingreso`,
    "Ratio de eficiencia (gastos de explotación sobre ingresos) de los bancos de la muestra de la EBA · Año 2025 completo","ninguna");
  barFoco(s,{x:M, y:1.70, w:6.60, h:4.55, values:v, max:80, fmt:'0.0"%"', fmtEje:'0"%"',
    tit:"Ratio de eficiencia 2025: cuanto más bajo, más eficiente"});
  const hd=t=>({text:t,options:Object.assign({},hdr,{fontSize:8.5,fill:{color:DARK}})});
  const filas=[[hd("País"),hd("2024"),hd("2025"),hd("Cambio, pp")]];
  P.concat(["UE, muestra EBA"]).forEach((p,i)=>{
    const f=p===FOCO, ue=i===7, a=ue?E.ue["2024"]:v0[i], b=ue?E.ue["2025"]:v[i];
    const o=x=>cel(null,Object.assign({fontSize:9,bold:f||ue,color:f?PRIM:TXT,fill:{color:f?YEL3:(ue?"F2F4F6":"FFFFFF")}},x||{}));
    filas.push([{text:p,options:o({align:"left"})},{text:n1(a,1)+" %",options:o()},
      {text:n1(b,1)+" %",options:o()},{text:mas(b-a,1),options:o()}]);});
  s.addTable(filas,{x:7.55, y:1.70, w:5.10, colW:[1.60,1.10,1.10,1.30], rowH:0.29,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,4,1,4]});
  tarjeta(s, 7.55, 4.50, 5.10, 1.75, "Es el banco entero, no la banca PYME",
    `Grupo consolidado, todos los negocios. Ni la EBA ni el BCE la publican por segmento. El único dato de un segmento de empresas es el de ABN AMRO Corporate Banking: ${n1(abn.eficiencia,1)} % en el primer semestre de 2026.`, "F2F4F6", 9);
  fuente(s,"EBA, Risk Dashboard, indicador PFT_23 (cost-to-income), acumulado del año al cuarto trimestre, muestra de bancos del EBA, base consolidada. Se usa el año completo porque el primer trimestre suele cargar contribuciones anuales (Irlanda pasa del 51,5 % en 2025 al 57,4 % en 2026-Q1).");
};

L.bm_bureaus = () => { const s=nueva();
  const I=X.info;
  cab(s,"Cada país se informa por un canal distinto: registro público o bureau privado",
    "Cobertura de los sistemas de información crediticia, personas y empresas registradas en % de la población adulta · Doing Business 2020","entorno");
  barras(s,{x:M, y:1.70, w:7.60, h:4.55, series:[["Registro público (banco central)",I.registro],["Bureau privado",I.bureau]],
    colors:[AZUL,MAGE], max:110, fmt:'0'});
  const hd=t=>({text:t,options:Object.assign({},hdr,{fontSize:8.5,fill:{color:DARK}})});
  const filas=[[hd("País"),hd("Índice\n0-8")]];
  P.forEach((p,i)=>{ const f=p===FOCO, o=x=>cel(null,Object.assign({fontSize:9,bold:f,color:f?PRIM:TXT,fill:{color:f?YEL3:"FFFFFF"}},x||{}));
    filas.push([{text:p,options:o({align:"left"})},{text:n1(I.profundidad[i],0),options:o()}]);});
  s.addTable(filas,{x:8.70, y:1.70, w:1.95, colW:[1.05,0.90], rowH:0.29,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,4,1,4]});
  tarjeta(s, 10.85, 1.70, 1.80, 2.32, "Profundidad", "Índice de 0 a 8 sobre qué datos circulan: positivos y negativos, de empresas y personas, historial de 2 años.", "F2F4F6", 8.5);
  const es=P.indexOf(FOCO);
  tarjeta(s, 8.70, 4.20, 3.95, 2.05, "España: sobre todo, registro público",
    `La CIRBE cubre al ${n1(I.registro[es],1)} % y el bureau privado, al ${n1(I.bureau[es],1)} %. Portugal tiene el mismo patrón y Francia no tiene bureau. Alemania, Italia y Países Bajos se apoyan en el bureau privado, que cubre a casi todos.`, YEL3, 9);
  fuente(s,"Banco Mundial, Doing Business 2020 (datos de mayo de 2019), indicadores «Getting Credit»: cobertura del registro público y del bureau privado, e índice de profundidad de la información crediticia (0-8). No distingue PYME: es el marco del país.");
};

L.info_pyme = () => { const s=nueva();
  const I=X.info;
  cab(s,"Lo que el banco puede saber de una PYME cambia mucho de un país a otro",
    "Registro público de crédito y cuentas anuales depositadas, según la normativa vigente de cada país · Puntuación de 0 a 3","entorno");
  const REG={"España":"CIRBE (Banco de España) · desde 1.000 €","Alemania":"Millionenkredite · desde 1 M€: no ve la PYME",
    "Francia":"FIBEN y cotation (Banque de France) · sin umbral, requiere adhesión","Italia":"Centrale dei Rischi · desde 30.000 € (250 € si está deteriorada)",
    "Portugal":"CRC (Banco de Portugal) · desde 50 €","P. Bajos":"No hay registro público de crédito a empresas",
    "Irlanda":"Central Credit Register · desde 500 €; consulta obligatoria desde 2.000 €"};
  const CTA={"España":"Registro Mercantil: depósito obligatorio y completo","Alemania":"Bundesanzeiger: depósito obligatorio",
    "Francia":"Las micro pueden declarar confidenciales sus cuentas; las pequeñas, la cuenta de resultados","Italia":"Registro Imprese: depósito obligatorio",
    "Portugal":"IES: depósito obligatorio","P. Bajos":"KvK: las pequeñas depositan cuentas abreviadas","Irlanda":"Companies Registration Office: depósito obligatorio"};
  const hd=(t,al)=>({text:t,options:Object.assign({},hdr,{fontSize:8.5,fill:{color:DARK},align:al||"center"})});
  const col=v=>v>=3?"D9EAF7":(v>=2?"F2F4F6":"FFD9E6");
  const filas=[[hd("País","left"),hd("Registro público de crédito","left"),hd("0-3"),hd("Cuentas anuales de la PYME","left"),hd("0-3"),hd("Índice de\ninformación")]];
  P.forEach((p,i)=>{ const f=p===FOCO, o=x=>cel(null,Object.assign({fontSize:8.5,bold:f,color:f?PRIM:TXT,fill:{color:f?YEL3:"FFFFFF"}},x||{}));
    filas.push([{text:p,options:o({align:"left"})},{text:REG[p],options:o({align:"left",bold:false,color:TXT})},
      {text:n1(I.util_registro[i],0),options:o({fill:{color:col(I.util_registro[i])},color:DARK})},
      {text:CTA[p],options:o({align:"left",bold:false,color:TXT})},
      {text:n1(I.cuentas[i],0),options:o({fill:{color:col(I.cuentas[i])},color:DARK})},
      {text:n1(I.indice[i],0),options:o()}]);});
  s.addTable(filas,{x:M, y:1.70, w:W-2*M, colW:[1.15,4.10,0.55,4.30,0.55,1.32], rowH:0.40,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false, margin:[1,5,1,5]});
  tarjeta(s, M, 5.15, 3.85, 1.10, "Alemania y Países Bajos",
    "Sin registro público útil para la PYME: el banco depende del bureau privado.", "FFD9E6", 9);
  tarjeta(s, M+4.08, 5.15, 3.85, 1.10, "Francia",
    "Registro sin umbral, pero la pequeña empresa puede ocultar su cuenta de resultados.", "F2F4F6", 9);
  tarjeta(s, M+8.16, 5.15, 3.85, 1.10, "El índice",
    `Media de profundidad, bureau, registro y cuentas, de 0 a 100 entre los siete. Correlación con la PD de la PYME: ${men(X.sintesis.rho_info_pd,2)}.`, YEL3, 9);
  fuente(s,"Elaboración propia sobre la normativa vigente de cada registro y registro mercantil (2026): 3 = cubre a la PYME sin restricciones; 0 = no la cubre. Índice: media simple normalizada de profundidad (Doing Business), cobertura del bureau, registro y cuentas; 100 = el mejor de los siete, no un óptimo.");
};

/* ================================================================== */
/* ANALISIS DESCRIPTIVO                                                */
/* ================================================================== */
L.div_sintesis = () => V.divisor("", "El mercado PYME\neuropeo, en\ndescriptivo",
  "Lo que dicen juntas las doce fuentes, sin calcular rentabilidades");

/* indicadores comparables por pais, todos observados */
function indicadores(){
  const R=X.safe.rechazo.datos, pr=X.mir.prima.estrecha.serie;
  const k=p=>p==="España"?"Espana":p;
  return [
    ["Precio del préstamo ≤1 M€","MIR",X.sintesis.precio_1m,2,"%"],
    ["Prima PYME, últimos 12 meses","MIR",P.map(p=>pr[k(p)].u12),2,"pp"],
    ["Rechazo, media de 3 años","SAFE",P.map(p=>R[k(p)].media3a),1,"%"],
    ["Mora de la PYME","EBA · FINREP",X.eba_rd.segmentos.pyme,2,"%"],
    ["Probabilidad de impago","EBA · COREP",X.corep.pd,2,"%"],
    ["Severidad de la pérdida","EBA · COREP",X.corep.lgd,1,"%"],
    ["Densidad de RWA","EBA · TE",X.te.total,1,"%"],
    ["Factoring sobre PIB","EUF",X.factoring.pib,1,"%"],
    ["Recuperación en concurso","Banco Mundial",X.marco.recovery,1,"cts"]];
}

L.cuadro = () => { const s=nueva();
  titulo(s,"Los siete mercados en nueve datos observados",
    "Cada columna, con su propia fuente y su propia definición de PYME · Sombreado: los dos valores más altos de cada fila, más intensos");
  const I=indicadores();
  const rows=[[{text:"Indicador",options:Object.assign({},hdr,{fontSize:8.5,align:"left",fill:{color:DARK}})},
    {text:"Fuente",options:Object.assign({},hdr,{fontSize:8.5,align:"left",fill:{color:DARK}})}]
    .concat(P.map(p=>({text:p,options:Object.assign({},hdr,{fontSize:8.5,fill:{color:p===FOCO?PRIM:DARK}})})))];
  I.forEach(r=>{
    const vals=r[2], orden=[...vals].sort((a,b)=>b-a);
    rows.push([{text:r[0],options:cel(null,{fontSize:9,bold:true,align:"left"})},
      {text:r[1],options:cel(null,{fontSize:8,color:MUT,align:"left"})}].concat(vals.map((v,i)=>{
        const rk=orden.indexOf(v);
        const f= rk<2 ? ORA2 : (rk<5 ? ORA3 : "F4F5F7");
        return {text:(r[4]==="pp"?mas(v,r[3]):n1(v,r[3]))+(r[4]==="%"?" %":""),
          options:cel(null,{fontSize:9, bold:P[i]===FOCO, color:DARK, fill:{color:f}})};})));});
  s.addTable(rows,{x:M, y:1.72, w:W-2*M, colW:[2.85,1.40].concat(P.map(()=>1.10)), rowH:0.43,
    fontFace:BF, border:{pt:0.5,color:"FFFFFF"}, valign:"middle", autoPage:false, margin:[1,5,1,5]});
  leyenda(s, M, 6.20, [["dos valores más altos de la fila",ORA2,2.4],["siguientes tres",ORA3,1.4],["dos más bajos","F4F5F7",1.3]]);
  fuente(s,"MIR: 2026, préstamos a empresas ≤1 M€ (proxy de importe). SAFE: PYME <250 empleados, 2023–2025. FINREP: Recomendación 2003/361/CE, 2026-Q1. COREP: IRB, definición interna, mediana, 2026-Q1. TE: estándar e IRB, junio 2025. EUF: sin segmento, 2025. Banco Mundial: 2019, céntimos por dólar. Sombreado por magnitud, no por mejor o peor.");
};

/* posicion de Espana en cada indicador: tira de puntos dibujada a mano */
L.posicion = () => { const s=nueva();
  titulo(s,"Dónde está España en cada dato",
    "Cada fila va del valor más bajo al más alto de los siete países · España en naranja, el resto en gris");
  const I=indicadores(), x0=4.35, x1=11.35, y0=1.95, paso=0.50;
  I.forEach((r,j)=>{
    const y=y0+j*paso, v=r[2], mn=Math.min(...v), mx=Math.max(...v);
    const px=val=> x0+(mx===mn?0.5:(val-mn)/(mx-mn))*(x1-x0);
    const fmt=val=>(r[4]==="pp"?mas(val,r[3]):n1(val,r[3]))+(r[4]==="%"?" %":r[4]==="pp"?" pp":"");
    s.addText(r[0],{x:M, y:y-0.13, w:2.55, h:0.26, fontFace:BF, fontSize:9.5, bold:true, color:DARK,
      isTextBox:true, margin:0, valign:"middle"});
    s.addText(fmt(mn),{x:x0-1.05, y:y-0.12, w:0.92, h:0.24, fontFace:BF, fontSize:8, color:MUT,
      align:"right", isTextBox:true, margin:0, valign:"middle"});
    s.addText(fmt(mx),{x:x1+0.13, y:y-0.12, w:0.95, h:0.24, fontFace:BF, fontSize:8, color:MUT,
      isTextBox:true, margin:0, valign:"middle"});
    s.addShape(pres.ShapeType.rect,{x:x0, y:y-0.006, w:x1-x0, h:0.012, fill:{color:G3}, line:{color:G3}});
    v.forEach((val,i)=>{ if(P[i]===FOCO) return;
      s.addShape(pres.ShapeType.ellipse,{x:px(val)-0.07, y:y-0.07, w:0.14, h:0.14,
        fill:{color:GRIS}, line:{color:"FFFFFF", width:0.75}}); });
    const ie=P.indexOf(FOCO), xe=px(v[ie]);
    s.addShape(pres.ShapeType.ellipse,{x:xe-0.11, y:y-0.11, w:0.22, h:0.22,
      fill:{color:PRIM}, line:{color:"FFFFFF", width:1}});
    s.addText(fmt(v[ie]),{x:xe-0.60, y:y-0.36, w:1.20, h:0.20, fontFace:BF, fontSize:8, bold:true,
      color:PRIM, align:"center", isTextBox:true, margin:0});
  });
  const rank=I.map(r=>{const o=[...r[2]].sort((a,b)=>b-a); return o.indexOf(r[2][P.indexOf(FOCO)])+1;});
  const altos=I.filter((r,j)=>rank[j]<=2).map(r=>r[0].charAt(0).toLowerCase()+r[0].slice(1));
  const bajos=I.filter((r,j)=>rank[j]===7).map(r=>r[0].charAt(0).toLowerCase()+r[0].slice(1));
  s.addText("España está entre los dos valores más altos en: "+altos.join("; ")+". Tiene el más bajo de los siete en: "+bajos.join("; ")+".",
    {x:M, y:6.20, w:W-2*M, h:0.40, fontFace:BF, fontSize:9, bold:true, color:DARK, isTextBox:true, margin:0});
  fuente(s,"Mismos nueve indicadores y fuentes que la lámina anterior. La posición es relativa a los siete países: el extremo derecho es el valor más alto, no el mejor.");
};

L.obs1 = () => { const s=nueva();
  const pr=X.mir.prima.estrecha.serie, R=X.safe.rechazo.datos, C=X.cesgar;
  const otros=P.filter(p=>p!==FOCO).map(p=>pr[p==='España'?'Espana':p].u12);
  const media=otros.reduce((a,b)=>a+b,0)/otros.length;
  titulo(s,"Precio y acceso: el crédito llega, pero no se paga igual en todas partes",
    "Tres observaciones sobre datos observados · Cada una con su fuente y su definición de PYME");
  const C3=[
    [mas(pr.Espana.u12,2)+" pp", "Prima del préstamo pequeño en España",
     `En los otros seis, de media, ${mas(media,2)} pp. Dos fuentes con definiciones distintas —MIR y OCDE— muestran la misma compresión.`, "importe"],
    [n1(C.concedida,1)+" %", "de las pymes españolas que pidieron financiación bancaria la obtuvieron",
     `En la SAFE, el rechazo del segundo semestre de 2025 va del ${n1(R.Italia.rechazo)} % de Italia al ${n1(R["P. Bajos"].rechazo)} % de Países Bajos. Alemania raciona por cantidad y precio, no rechazando.`, "emplaut"],
    [men(X.sintesis.rho_precio_pd,2), "correlación entre el precio del préstamo de hasta 1 M€ y la PD de la PYME",
     "Entre los siete países, el precio no sube con el riesgo: los mercados con PD más alta no cobran más.", "interna"]];
  C3.forEach((c,i)=>{
    const x=M+i*4.08, w=3.85;
    s.addShape(pres.ShapeType.roundRect,{x:x, y:1.75, w:w, h:4.55, fill:{color:"F2F4F6"}, rectRadius:0.05, line:{color:"F2F4F6"}});
    s.addText(c[0],{x:x+0.25, y:1.95, w:w-0.5, h:0.85, fontFace:HF, fontSize:34, bold:true, color:PRIM, isTextBox:true, margin:0});
    s.addText(c[1],{x:x+0.25, y:2.85, w:w-0.5, h:0.70, fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0, valign:"top"});
    s.addText(c[2],{x:x+0.25, y:3.62, w:w-0.5, h:1.95, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0, valign:"top"});
    etiqueta(s, c[3], x+0.25, 5.70, w-0.5);
  });
  fuente(s,"Prima: BCE MIR, ≤0,25 M€ frente a >1 M€. Concesión: CESGAR 2025. Rechazo: BCE SAFE, 2025-S2. Correlación: precio MIR del tramo ≤1 M€ (2026) frente a PD de COREP (2026-Q1), siete países: descriptiva, no causal.");
};

L.obs2 = () => { const s=nueva();
  const S=X.eba_rd.segmentos, T=X.te, es=P.indexOf(FOCO), de=P.indexOf("Alemania");
  titulo(s,"Riesgo, capital y producto: lo que distingue a cada mercado",
    "Tres observaciones sobre datos observados · Cada una con su fuente y su definición de PYME");
  const C3=[
    [n1(S.pyme[es],2)+" %", "mora de la PYME española, la más alta de los siete",
     `La PYME es el segmento con más mora en los siete países. Pero la española baja desde 2024 y la alemana y la francesa suben: convergen.`, "ue"],
    [n1(T.sa[es]-T.irb[es],1)+" pp", "rebaja el IRB la densidad de RWA en España",
     `En Alemania, ${n1(T.sa[de]-T.irb[de],1)} pp. Por método estándar los siete van del ${n1(Math.min(...T.sa),0)} al ${n1(Math.max(...T.sa),0)} %; por IRB, del ${n1(Math.min(...T.irb),0)} al ${n1(Math.max(...T.irb),0)} %. El modelo separa más que el país.`, "mixta"],
    [n1(X.factoring.confirming["España"],1)+" %", "de las cesiones de factoring en España son confirming",
     `En Italia, ${n1(X.factoring.confirming["Italia"],1)} %. Portugal y España son donde el factoring pesa más sobre el PIB.`, "ninguna"]];
  C3.forEach((c,i)=>{
    const x=M+i*4.08, w=3.85;
    s.addShape(pres.ShapeType.roundRect,{x:x, y:1.75, w:w, h:4.55, fill:{color:"F2F4F6"}, rectRadius:0.05, line:{color:"F2F4F6"}});
    s.addText(c[0],{x:x+0.25, y:1.95, w:w-0.5, h:0.85, fontFace:HF, fontSize:34, bold:true, color:PRIM, isTextBox:true, margin:0});
    s.addText(c[1],{x:x+0.25, y:2.85, w:w-0.5, h:0.70, fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0, valign:"top"});
    s.addText(c[2],{x:x+0.25, y:3.62, w:w-0.5, h:1.95, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0, valign:"top"});
    etiqueta(s, c[3], x+0.25, 5.70, w-0.5);
  });
  fuente(s,"Mora: EBA Risk Dashboard (FINREP), 2026-Q1. Densidad: EBA Transparency Exercise, junio 2025. Confirming: AEF y Assifact, 2025; factoring sobre PIB: EUF, 2025.");
};

L.limites = () => { const s=nueva();
  titulo(s,"Lo que estos datos no permiten decir",
    "Por qué esta presentación describe el mercado y no calcula su rentabilidad");
  const Lm=[
   ["No hay una PYME común","Cada fuente mide un colectivo distinto: empleados, facturación, importe del préstamo o la definición de cada banco. Los niveles de dos fuentes no se suman ni se restan."],
   ["El riesgo no está armonizado","La PD y la LGD usan la definición interna de cada banco, solo de la cartera IRB, y son medianas, no medias ponderadas."],
   ["Falta la comisión","Solo España publica el tipo con comisiones del crédito a empresas. Sin ella no se puede comparar el coste total del crédito entre países."],
   ["Por eso no hay ROE","Un ROE exigiría suponer comisiones, costes y capital del segmento que ninguna fuente publica. Sería un supuesto con apariencia de dato."],
   ["Producto sin precio","No hay precio público del factoring ni del confirming en ninguno de los siete países, y ninguna asociación separa lo que cede la PYME."],
   ["Datos que envejecen","La OCDE llega a 2022 y Doing Business a 2019. El volumen irlandés de factoring no cambia desde 2021."]];
  Lm.forEach((l,i)=>{
    const col=i%3, fila=Math.floor(i/3);
    tarjeta(s, M+col*4.08, 1.75+fila*2.35, 3.85, 2.15, l[0], l[1], i===3?YEL3:"F2F4F6", 11.5);});
  fuente(s,"Detalle de cada límite, con la cita de la normativa correspondiente, en notas.md del repositorio del proyecto.");
};

L.cierre = () => { const s=nueva({limpia:true});
  s.background={color:PAPEL};
  bloques(s, 8.30, 1.70, 4.35, 4.10);
  s.addText([{text:"bankinter", options:{color:DARK}}, {text:".", options:{color:PRIM}}],
    {x:1.10, y:2.95, w:6.0, h:0.70, fontFace:HF, fontSize:38, bold:true, isTextBox:true, margin:0});
  s.addText("Gracias",{x:1.10, y:3.70, w:6.0, h:0.70, fontFace:HF, fontSize:31, bold:true, color:PRIM,
    isTextBox:true, margin:0});
  s.addText("Los datos, los extractores y el inventario de fuentes con su definición de PYME están en el repositorio del proyecto.",
    {x:1.10, y:4.70, w:6.0, h:0.60, fontFace:BF, fontSize:10, color:MUT, isTextBox:true, margin:0});
};

/* ------------------------------------------------------------------ */
const ORDEN = ["portada","guia","mapa",
  "f_mir","mir_tramos","mir_prima","mir_circ","mir_depositos",
  "f_safe","safe_rechazo","safe_brecha",
  "f_rd","rd_tamano","rd_segmentos","rd_serie","rd_eficiencia",
  "f_corep","corep_pd_lgd",
  "f_te","te_densidad","te_bancos",
  "f_ocde","ocde_spread",
  "f_bde","bde_comisiones",
  "f_cb","cb_capacidad",
  "f_cesgar","cesgar",
  "f_fact","factoring",
  "f_bm","bm","bm_bureaus","info_pyme",
  "f_bancos","bancos",
  "div_sintesis","cuadro","posicion","obs1","obs2","limites","cierre"];
const SOLO = process.env.SOLO ? process.env.SOLO.split(",") : null;
(SOLO||ORDEN).forEach(k=>{ if(!L[k]) throw new Error("lamina desconocida: "+k); L[k](); });
const sobran=Object.keys(L).filter(k=>!ORDEN.includes(k));
if(sobran.length) throw new Error("laminas sin colocar: "+sobran.join(", "));
pres.writeFile({fileName:process.env.SALIDA||"mercado_pyme_europa.pptx"}).then(f=>console.log("escrito:",f,"|",(SOLO||ORDEN).length,"laminas"));
