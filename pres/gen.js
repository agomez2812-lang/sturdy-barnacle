const pptxgen = require("pptxgenjs");
const D = require("./datos.json");

/* Paleta corporativa Bankinter (manual de marca, mayo 2021).
   Primario naranja PMS 165 C; secundarios azul PMS 2727 C y magenta
   PMS 2040 C; terciarios, gama de grises para neutralizar. */
const PRIM="F56600";            // naranja, color principal y unico acento fuerte
const DARK="2B2B2B";            // negro corporativo
const G1="818181", G2="A1A1A1", G3="CACACA", LIGHT="E5E5E5";
/* Paleta ampliada del manual, pagina "colores para graficos": se usan los
   matices pastel en lugar de los secundarios saturados, que resultan
   demasiado estridentes en pantalla. */
const BLUE="77BFEE", BLUE3="C7E3F9";   // azul 2 y 3
const MAG ="FF8AC2", MAG3="FFCCE8";    // magenta 2 y 3
const ORA2="FFAB70", ORA3="FFD6BA";    // naranja 2 y 3
/* Semantica: relleno pastel + texto negro. Nunca texto blanco sobre pastel. */
const OK=BLUE, MED=ORA2, BAD=MAG, ACC=PRIM, TXT=DARK, MUT=G1;
/* Bankinter Sans es la tipografia de marca; el propio manual fija Verdana
   como sustituta de sistema cuando no esta disponible. */
const HF="Verdana", BF="Verdana";
const P = D.paises;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";            // 13.33 x 7.5
pres.author = "Analisis PYME Europa";

const W = 13.33, M = 0.6;

function titulo(s, t, sub){
  s.addText(t, {x:M, y:0.32, w:W-2*M, h:0.82, fontFace:HF, fontSize:25, bold:true,
                color:PRIM, isTextBox:true, margin:0});
  if(sub) s.addText(sub, {x:M, y:1.08, w:W-2*M, h:0.42, fontFace:BF, fontSize:11,
                color:MUT, isTextBox:true, margin:0});
}
function fuente(s, t){
  s.addText(t, {x:M, y:6.76, w:W-2*M, h:0.56, fontFace:BF, fontSize:7.5,
                color:MUT, italic:true, isTextBox:true, margin:0});
}
function chip(s, x, y, txt, col){
  s.addShape(pres.ShapeType.roundRect, {x:x, y:y, w:1.5, h:0.28, fill:{color:col},
             rectRadius:0.12, line:{color:col}});
  s.addText(txt, {x:x, y:y, w:1.5, h:0.28, fontFace:BF, fontSize:8.5, bold:true,
                  color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
}
const hdr = {fill:{color:PRIM}, color:"FFFFFF", bold:true, fontSize:11, align:"center"};
const cel = (v,o)=>Object.assign({fontSize:11, align:"center", color:TXT}, o||{});
const tOpt = ()=>({x:M, y:1.7, w:W-2*M, fontFace:BF, border:{pt:0.5,color:G3},
                   autoPage:false, valign:"middle"});

/* 1 — portada */
{const s=pres.addSlide(); s.background={color:DARK};
 s.addText("Rentabilidad del negocio PYME", {x:M, y:2.5, w:10.5, h:0.9, fontFace:HF,
   fontSize:42, bold:true, color:"FFFFFF", isTextBox:true, margin:0});
 s.addText("España · Alemania · Francia · Italia · Portugal · Países Bajos",
   {x:M, y:3.45, w:10.5, h:0.5, fontFace:BF, fontSize:18, color:G2, isTextBox:true, margin:0});
 s.addText("Cinco productos · Datos oficiales 2026 · Modelo de ROE con supuestos declarados",
   {x:M, y:4.15, w:10.5, h:0.4, fontFace:BF, fontSize:13, color:ACC, isTextBox:true, margin:0});
 s.addText("25.370 observaciones · 9 fuentes · Septiembre 2026",
   {x:M, y:6.5, w:10.5, h:0.35, fontFace:BF, fontSize:11, color:MUT, isTextBox:true, margin:0});
 s.addNotes("Deck construido sobre datos oficiales del BCE, EBA, OCDE, Banco de España, Banca d'Italia, EUF y cuentas de resultados de bancos. El ROE es modelizado, no observado.");
}

/* 2 — objetivo y metodo */
{const s=pres.addSlide();
 titulo(s,"Objetivo y método","Qué se mide, con qué datos y dónde están los límites");
 const cajas=[
  ["Objetivo","Comparar la rentabilidad del negocio PYME entre seis países europeos, producto a producto, sobre datos oficiales y no sobre estimaciones de mercado."],
  ["Alcance","Hipotecas, préstamos, circulante, factoring y confirming, más el coste de los recursos. Segmentación por tramo de importe del préstamo, que es como segmenta la estadística oficial europea."],
  ["Método","Cuenta de resultados en porcentaje del saldo medio: precio más comisiones, menos coste de fondos, riesgo y gastos. El capital se asigna por densidad de RWA sobre el CET1 observado."],
  ["Límite principal","Solo España e Italia publican un tipo con comisiones para empresas. Para los otros cuatro países la comisión es un supuesto, no un dato. El ROE de esos países depende de ese supuesto."]];
 let y=1.75;
 cajas.forEach((c,i)=>{
   s.addShape(pres.ShapeType.roundRect,{x:M, y:y, w:W-2*M, h:1.17, fill:{color: i===3?ORA3:LIGHT},
     rectRadius:0.06, line:{color: i===3?ACC:G3}});
   s.addText(c[0], {x:M+0.25, y:y+0.12, w:2.5, h:0.32, fontFace:HF, fontSize:14, bold:true,
     color: i===3?ACC:PRIM, isTextBox:true, margin:0});
   s.addText(c[1], {x:M+2.9, y:y+0.12, w:W-2*M-3.2, h:0.92, fontFace:BF, fontSize:12,
     color:TXT, isTextBox:true, margin:0});
   y+=1.30;});
 fuente(s,"Detalle completo de fuentes, supuestos y huecos en notas.md del repositorio del proyecto.");
}

/* 3 — mapa de fiabilidad */
{const s=pres.addSlide();
 titulo(s,"Mapa de fiabilidad del dato","Qué se puede afirmar y con qué respaldo, producto a producto y país a país");
 const filas=[["Producto","Precio","Volumen","Comisiones","Riesgo","Capital"],
  ["Préstamo PYME por tramo","OBSERVADO","OBSERVADO","SOLO ESPAÑA","OBSERVADO","OBSERVADO"],
  ["Circulante","OBSERVADO","NO EXISTE","NO EXISTE","OBSERVADO","OBSERVADO"],
  ["Hipoteca PYME","NO EXISTE","PROXY CRE","NO EXISTE","OBSERVADO","OBSERVADO"],
  ["Factoring","NO EXISTE","OBSERVADO","NO EXISTE","PARCIAL","NO EXISTE"],
  ["Confirming","NO EXISTE","SOLO ES e IT","NO EXISTE","NO EXISTE","NO EXISTE"],
  ["Depósitos de empresa","OBSERVADO","PARCIAL","n/a","n/a","n/a"]];
 const col=v=>v==="OBSERVADO"?OK:(v==="NO EXISTE"?BAD:(v==="n/a"?G3:MED));
 const rows=filas.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center"})};
   if(ci===0) return {text:c, options:cel(null,{align:"left", bold:true, fontSize:11})};
   return {text:c, options:cel(null,{color:DARK, bold:true, fontSize:8.5, fill:{color:col(c)}})};
 }));
 s.addTable(rows, Object.assign(tOpt(),{y:1.78, colW:[3.3,1.77,1.77,1.77,1.77,1.75], rowH:0.44}));
 s.addText("El mapa de huecos es en sí un resultado. Tras incorporar los parámetros IRB del EBA, el riesgo y el capital de PYME son observados en los seis países. El hueco que queda es la comisión: solo España publica un tipo con comisiones para empresas.",
   {x:M, y:5.55, w:W-2*M, h:0.6, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0});
 [["OBSERVADO",OK],["PARCIAL o SUPUESTO",MED],["NO EXISTE",BAD]].forEach((l,i)=>chip(s,M+i*2.0,6.35,l[0],l[1]));
 fuente(s,"Fuentes: BCE (MIR), EBA Risk Dashboard, Banco de España (Boletín Estadístico), Banca d'Italia (STACORIS), OCDE, EUF.");
}

/* 4 — precio por tramo */
{const s=pres.addSlide();
 titulo(s,"Precio por tramo de importe","Media 2026 ponderada por volumen · Fijación inicial total · Sin comisiones");
 s.addChart(pres.ChartType.bar, [
   {name:"Hasta 0,25 M€", labels:P, values:D.tramos["Hasta 0,25 M EUR"]},
   {name:"Más de 1 M€",   labels:P, values:D.tramos["Mas de 1 M EUR"]}],
   {x:M, y:1.75, w:7.5, h:4.0, barDir:"col", chartColors:[PRIM,G2],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:11,
    catAxisLabelColor:TXT, valAxisLabelColor:MUT, catAxisLabelFontSize:11,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:5.5});
 s.addShape(pres.ShapeType.roundRect,{x:8.4, y:1.75, w:4.33, h:2.32, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Peso del tramo ≤1 M€ sobre la nueva producción",{x:8.6, y:1.9, w:3.95, h:0.5,
   fontFace:HF, fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText(P.map((p,i)=>`${p}: ${D.peso1m[i]} %`).join("\n"),
   {x:8.6, y:2.42, w:3.95, h:1.58, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0, lineSpacing:13});
 s.addShape(pres.ShapeType.roundRect,{x:8.4, y:4.22, w:4.33, h:1.53, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("Un mismo spread no significa lo mismo",{x:8.6, y:4.34, w:3.95, h:0.35,
   fontFace:HF, fontSize:13, bold:true, color:ACC, isTextBox:true, margin:0});
 s.addText("En España y Portugal la mitad de la nueva producción es de importe ≤1 M€. En Países Bajos es el 7,6 % y en Irlanda el 16,8 %. Cualquier comparación de rentabilidad debe normalizar por este peso.",
   {x:8.6, y:4.70, w:3.95, h:0.95, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: BCE, ECB Data Portal, dataset MIR. Tipo anual equivalente (AAR/NDER), que excluye comisiones. Media enero-julio 2026 ponderada por volumen mensual.");
}

/* 5 — Espana: TEDR vs TAE */
{const s=pres.addSlide();
 titulo(s,"Las comisiones son muy relevantes: impacto en España","Único país de los siete donde existe un tipo con comisiones para empresas · Media 2026");
 const T=D.es_tae, tr=["Hasta 0,25 M EUR","Mas de 0,25 y hasta 1 M EUR","Mas de 1 M EUR"];
 const nom=["≤0,25 M€","0,25–1 M€",">1 M€"];
 s.addChart(pres.ChartType.bar, [
   {name:"TEDR (sin comisiones)", labels:nom, values:tr.map(t=>T[t].tedr)},
   {name:"TAE (con comisiones)",  labels:nom, values:tr.map(t=>T[t].tae)}],
   {x:M, y:1.8, w:7.2, h:3.8, barDir:"col", chartColors:[PRIM,G2],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:11,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:11,
    catAxisLabelColor:TXT, valAxisLabelColor:MUT, catAxisLabelFontSize:12,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:5.0});
 const E=D.es_spread;
 s.addShape(pres.ShapeType.roundRect,{x:8.1, y:1.8, w:4.63, h:2.42, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("Cómo se calcula el spread",{x:8.3, y:1.92, w:4.25, h:0.3, fontFace:HF,
   fontSize:12, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Spread = tramo ≤0,25 M€ − tramo >1 M€\n(los dos tramos extremos, no el intermedio)",
   {x:8.3, y:2.26, w:4.25, h:0.5, fontFace:BF, fontSize:9, color:TXT, italic:true,
    isTextBox:true, margin:0});
 s.addText([
   {text:"TEDR   ", options:{bold:true, breakLine:false}},
   {text:E.tedr_a.toFixed(4)+" − "+E.tedr_b.toFixed(4)+" = ", options:{breakLine:false}},
   {text:E.spread_tedr_pb.toFixed(1)+" pb", options:{bold:true, color:DARK, breakLine:true}},
   {text:"TAE      ", options:{bold:true, breakLine:false}},
   {text:E.tae_a.toFixed(4)+" − "+E.tae_b.toFixed(4)+" = ", options:{breakLine:false}},
   {text:"+"+E.spread_tae_pb.toFixed(1)+" pb", options:{bold:true, color:PRIM}}],
   {x:8.3, y:2.82, w:4.25, h:0.75, fontFace:BF, fontSize:10, color:TXT,
    isTextBox:true, margin:0, lineSpacing:19});
 s.addText("Las cifras del gráfico van redondeadas a dos decimales; el spread se calcula sobre el valor completo.",
   {x:8.3, y:3.62, w:4.25, h:0.5, fontFace:BF, fontSize:8.5, color:MUT, isTextBox:true, margin:0});
 s.addText("La banca española sí cobra más caro a la PYME: 81 pb más en coste total. Lo hace por comisión, no por tipo nominal. El MIR del BCE, que publica solo el tipo sin comisiones, no lo ve.",
   {x:M, y:5.85, w:W-2*M, h:0.7, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: Banco de España, Boletín Estadístico, cuadros 19.5 (TEDR), 19.6 (TAE) y 19.13 (volúmenes). Cuña = TAE − TEDR, cálculo propio. Media enero-julio 2026.");
}

/* 6 — cuenta de resultados modelizada */
{const s=pres.addSlide();
 titulo(s,"Cuenta de resultados del préstamo PYME","En % del saldo medio · Tramo ≤1 M€ · 2026 · Las filas en ocre son supuestos, no observaciones");
 const L=[["Concepto"].concat(P),
   ["Precio (tipo MIR)"].concat(D.pl.precio.map(v=>v.toFixed(2))),
   ["+ Comisiones"].concat(D.pl.comisiones.map(v=>v.toFixed(2))),
   ["= Ingreso total"].concat(D.pl.ingreso.map(v=>v.toFixed(2))),
   ["− Coste de los recursos"].concat(D.pl.fondos.map(v=>v.toFixed(2))),
   ["= Margen bruto"].concat(D.pl.margen.map(v=>v.toFixed(2))),
   ["− Coste del riesgo"].concat(D.pl.cor.map(v=>v.toFixed(2))),
   ["− Gastos"].concat(D.pl.opex.map(v=>v.toFixed(2))),
   ["= Resultado antes de imp."].concat(D.pl.bai.map(v=>v.toFixed(2))),
   ["Capital asignado (RWA × CET1)"].concat(D.pl.capital.map(v=>v.toFixed(2))),
   ["Tipo impositivo"].concat(D.pl.tipo.map(v=>v.toFixed(1)+" %")),
   ["ROE"].concat(D.pl.roe.map(v=>v.toFixed(1)+" %"))];
 const sup=[2], tot=[3,5,8,11];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center"})};
   const o=cel(null,{align: ci===0?"left":"center"});
   if(sup.includes(ri)) o.fill={color:ORA3}, o.color=DARK;
   if(tot.includes(ri)) o.bold=true, o.fill={color: ri===11?PRIM:LIGHT}, o.color= ri===11?"FFFFFF":PRIM;
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.78, colW:[2.7].concat(Array(7).fill(1.347)), rowH:0.345}));
 [["Observado",PRIM],["Supuesto",MED]].forEach((l,i)=>chip(s,M+i*1.7,6.15,l[0],l[1]));
 s.addText("Solo la fila de comisiones es supuesto. Precio, recursos, riesgo, capital e impuesto son observados por país.",
   {x:M+3.7, y:6.15, w:8.5, h:0.3, fontFace:BF, fontSize:10, color:MUT, isTextBox:true, margin:0});
 fuente(s,"Precio: BCE MIR. Comisiones: cuña española de 87 pb aplicada a los siete (único supuesto material). Recursos: tipos de depósito de empresa del MIR ponderados por los saldos del BSI. Riesgo: PD × LGD de la clase IRB de PYME (COREP C 9.02). Gastos: eficiencia EBA sobre margen. Capital: densidad de RWA observada sobre CET1. Impuesto: tipo combinado de sociedades 2026 de cada país.");
}

/* 7 — ROE por pais */
{const s=pres.addSlide();
 titulo(s,"ROE modelizado del préstamo PYME","Cuña de comisiones española aplicada a los siete países · Tipo impositivo real de cada uno · 2026");
 s.addChart(pres.ChartType.bar, [{name:"ROE", labels:P, values:D.pl.roe}],
   {x:M, y:1.8, w:7.4, h:4.1, barDir:"col", chartColors:[PRIM],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12,
    dataLabelColor:TXT, showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:22});
 s.addShape(pres.ShapeType.roundRect,{x:8.3, y:1.8, w:4.43, h:4.1, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Cómo leerlo",{x:8.5, y:1.95, w:4.05, h:0.32, fontFace:HF, fontSize:15,
   bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText([
  {text:"Países Bajos y Alemania encabezan", options:{bold:true, breakLine:true}},
  {text:"por coste del riesgo bajo (0,35 % y 0,40 %) y la menor densidad de RWA (37 % y 35 %), que reduce el capital a inmovilizar.\n\n", options:{breakLine:true}},
  {text:"España queda en 12,5 %", options:{bold:true, breakLine:true}},
  {text:"con el precio más bajo, una densidad de RWA del 59,5 % y el 30 % de tipo que la banca paga en España.\n\n", options:{breakLine:true}},
  {text:"Irlanda queda cuarta", options:{bold:true, breakLine:true}},
  {text:"pese a la mayor densidad de RWA de los siete (70 %), gracias al 15 % de Pilar Dos frente al 26-30 % del resto.\n\n", options:{breakLine:true}},
  {text:"Francia queda última", options:{bold:true, breakLine:true}},
  {text:"con un 5,0 %: precio bajo, recursos caros y la peor eficiencia (65,6 %).", options:{}}],
  {x:8.5, y:2.32, w:4.05, h:3.52, fontFace:BF, fontSize:9, color:TXT, isTextBox:true, margin:0});
 fuente(s,"ROE modelizado, no observado. Depende del supuesto de comisiones: ver lámina siguiente. Tipo de sociedades aplicable a bancos: ES 30,0 (art. 29 LIS, entidades de crédito) · DE 30,1 · FR 25,8 · IT 27,8 · PT 29,5 · NL 25,8 · IE 15,0 (mínimo de Pilar Dos). En Francia, la contribución excepcional del 36,1 % para grupos de más de 1.500 M€ de cifra de negocio dejaría su ROE en 4,3 %.");
}

/* 8 — sensibilidad */
{const s=pres.addSlide();
 titulo(s,"Sensibilidad al supuesto de comisiones","Cuánto depende el ROE de la cuña que se asuma · Solo la columna de 87 pb está observada, y solo para España");
 const cols=["0","25","50","87","100","150"];
 const L=[["País"].concat(cols.map(c=>c+" pb"))].concat(
   P.map((p,i)=>[p].concat(cols.map(c=>D.sens[c][i].toFixed(1)+" %"))));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center",
     fill:{color: ci===4?DARK:PRIM}})};
   const o=cel(null,{align: ci===0?"left":"center", bold: ci===0});
   if(ci===4) o.fill={color:ORA3}, o.bold=true, o.color=DARK;
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.82, colW:[2.7].concat(Array(6).fill(1.572)), rowH:0.40}));
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.25, w:W-2*M, h:1.4, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("Lo que el supuesto cambia y lo que no",{x:M+0.25, y:5.36, w:11.8, h:0.32,
   fontFace:HF, fontSize:14, bold:true, color:ACC, isTextBox:true, margin:0});
 s.addText("El nivel del ROE se mueve mucho: España pasa del 3,5 % al 11,8 % según se asuma cero o 150 pb de comisión. El ordenamiento se mueve menos: Francia es último en todos los escenarios e Italia, Portugal y Países Bajos encabezan en todos. Lo que sí cambia es la posición relativa de España, que sube conforme se asume más comisión — y es el único país donde sabemos que la comisión es alta.",
   {x:M+0.25, y:5.70, w:11.8, h:0.85, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 fuente(s,"87 pb es la cuña observada en España (TAE − TEDR, tramo ≤1 M€, media 2026, Banco de España). Para los otros cinco países no existe dato equivalente.");
}

/* 8b — simulacion de entrante eficiente */
{const s=pres.addSlide();
 titulo(s,"Simulación: entrante eficiente","Un banco extranjero con sus propios ratios de balance, enfrentando el precio, el riesgo, el capital y la fiscalidad de cada mercado local");
 s.addShape(pres.ShapeType.roundRect,{x:M, y:1.72, w:W-2*M, h:0.52, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText([{text:"Parámetros del entrante:   ", options:{bold:true}},
   {text:"coste de los recursos 0,80 %     ·     eficiencia 40 %     ·     CET1 12,9 %", options:{}},
   {text:"          Del mercado local: precio, comisiones, PD × LGD, densidad de RWA y tipo impositivo.", options:{color:MUT}}],
   {x:M+0.25, y:1.83, w:11.8, h:0.32, fontFace:BF, fontSize:10, color:DARK, isTextBox:true, margin:0});
 s.addChart(pres.ChartType.bar, [
   {name:"ROE del banco local", labels:P, values:D.pl.roe},
   {name:"ROE del entrante eficiente", labels:P, values:D.ent.roe}],
   {x:M, y:2.4, w:7.6, h:3.45, barDir:"col", chartColors:[G2,PRIM],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:DARK, showLegend:true, legendPos:"b", legendFontSize:9,
    catAxisLabelColor:DARK, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:LIGHT, size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:40});
 const L=[["","Local","Entrante","Gana"]].concat(
   P.map((p,i)=>[p, D.pl.roe[i].toFixed(1)+" %", D.ent.roe[i].toFixed(1)+" %",
                 "+"+D.ent.dif[i].toFixed(1)]));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9.5})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10, bold: ci===0});
   if(ci===2) o.bold=true, o.fill={color:ORA3};
   if(ci===3){ const g=parseFloat(String(c).replace("+",""));
     o.bold=true; o.fill={color: g>10?ORA2:(g>5?ORA3:LIGHT)}; }
   return {text:c, options:o};}));
 s.addTable(rows, {x:8.25, y:2.4, w:4.48, colW:[1.38,1.02,1.08,1.00], rowH:0.34,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 s.addShape(pres.ShapeType.roundRect,{x:8.25, y:5.18, w:4.48, h:0.68, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Ranking del entrante:\nP. Bajos > Alemania > Irlanda > Francia > Italia > Portugal > España",
   {x:8.42, y:5.26, w:4.15, h:0.55, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});
 s.addText([{text:"El orden de atractivo cambia por completo. ", options:{bold:true}},
   {text:"Francia pasa del último puesto (5,0 %) al cuarto (21,8 %) porque su banca local es la más ineficiente de las siete y la más cara en recursos: ahí es donde más vale entrar eficiente. España es justo lo contrario, solo gana 1,2 puntos, porque su banca ya es eficiente y sus recursos ya son baratos —el entrante incluso pagaría más— y sigue arrastrando una densidad de RWA del 59,5 % y el 30 % de impuesto.", options:{}}],
   {x:M, y:5.95, w:W-2*M, h:0.72, fontFace:BF, fontSize:10, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Escenario, no observación. Se mantienen del mercado local el precio (MIR), la cuña de comisiones supuesta, el coste del riesgo (PD × LGD), la densidad de RWA (Transparency Exercise) y el tipo impositivo de banca. Se sustituyen coste de los recursos, eficiencia y CET1 por los del entrante. No incorpora coste de entrada, escala mínima ni curva de aprendizaje de riesgo.");
}

/* 9 — coste de recursos */
{const s=pres.addSlide();
 titulo(s,"Coste de los recursos de empresa","Tipos del MIR ponderados por la mezcla real de saldos del BSI · Media 2026 · Es el coste de fondos que usa el modelo");
 s.addChart(pres.ChartType.bar, [
   {name:"Coste ponderado de los recursos", labels:P, values:D.rec.coste},
   {name:"Margen sobre la facilidad del BCE", labels:P, values:D.rec.margen}],
   {x:M, y:1.85, w:7.45, h:3.85, barDir:"col", barGrouping:"stacked",
    chartColors:[PRIM,BLUE], showTitle:false, showValue:true, dataLabelPosition:"ctr",
    dataLabelFontSize:9, dataLabelColor:DARK, showLegend:true, legendPos:"b",
    legendFontSize:10, catAxisLabelColor:TXT, catAxisLabelFontSize:10,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0.0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:2.4});
 const L=[["","Vista","Plazo","% vista","Ponderado"]].concat(P.map((p,i)=>
   [p, D.rec.vista[i].toFixed(2), D.rec.plazo[i].toFixed(2),
    D.rec.peso_vista[i].toFixed(0)+" %", D.rec.coste[i].toFixed(2)]));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9.5})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10, bold: ci===0});
   if(ci===4) o.bold=true, o.fill={color:LIGHT}, o.color=PRIM;
   return {text:c, options:o};}));
 s.addTable(rows, {x:8.15, y:1.85, w:4.58, colW:[1.28,0.8,0.8,0.86,0.84], rowH:0.365,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 s.addShape(pres.ShapeType.roundRect,{x:8.15, y:4.9, w:4.58, h:0.85, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("La mezcla decide, no el tipo: Italia paga un 0,56 % a la vista y España un 0,44 %, pero Italia tiene un 89 % en vista y acaba igual de barata.",
   {x:8.35, y:5.0, w:4.2, h:0.68, fontFace:BF, fontSize:10, color:TXT, isTextBox:true, margin:0});
 s.addText("Irlanda capta los recursos más baratos de los siete, un 0,41 %, y Francia los más caros, un 1,34 %: tres veces más. Es el segundo factor que más separa el ROE, por detrás del capital.",
   {x:M, y:5.9, w:W-2*M, h:0.6, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuentes: BCE, dataset MIR (tipos de depósito de sociedades no financieras, nueva producción) y dataset BSI (saldos L21 vista y L22 plazo, sector 2240) para la ponderación. Facilidad de depósito del BCE al 2,09 %.");
}

/* 10 — coste del riesgo */
{const s=pres.addSlide();
 titulo(s,"NPL por segmento","La PYME es el peor segmento en los siete países · Ratio de NPL, stock de dudosos · 2026-Q1 · Muestra de bancos del EBA");
 s.addChart(pres.ChartType.bar, [
   {name:"Total cartera", labels:P, values:D.npl_seg.total},
   {name:"Empresas",      labels:P, values:D.npl_seg.empresas},
   {name:"PYME",          labels:P, values:D.npl_seg.pyme},
   {name:"Inmueble comercial", labels:P, values:D.npl_seg.cre}],
   {x:M, y:1.8, w:8.0, h:4.1, barDir:"col",
    chartColors:[G3,BLUE,PRIM,ORA2], showTitle:false, showValue:true,
    dataLabelPosition:"outEnd", dataLabelFontSize:8, dataLabelColor:TXT,
    showLegend:true, legendPos:"b", legendFontSize:10,
    catAxisLabelColor:TXT, catAxisLabelFontSize:11, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:8});
 s.addShape(pres.ShapeType.roundRect,{x:8.85, y:1.8, w:3.88, h:4.1, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Prima de riesgo PYME",{x:9.05, y:1.95, w:3.5, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Diferencia entre el NPL de PYME y el de empresas, en puntos:\n\nEspaña  +2,39\nItalia  +1,50\nFrancia  +1,19\nPortugal  +0,58\nAlemania  +0,51\nP. Bajos  +0,27\n\nEspaña tiene el peor NPL de PYME de los seis (5,38 %) y a la vez el spread de precio más estrecho.",
   {x:9.05, y:2.4, w:3.5, h:3.3, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 s.addText("ATENCIÓN: esto es el ratio de NPL, un STOCK de dudosos sobre cartera. NO es el coste del riesgo que usa el modelo, que es un flujo anual calculado como PD × LGD (lámina siguiente).",
   {x:M, y:5.98, w:8.0, h:0.55, fontFace:BF, fontSize:10, color:DARK, bold:true, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA Risk Dashboard, anexo de datos Q1 2026, desgloses «of which SMEs» y «of which CRE». Es la muestra de bancos del EBA, no el sistema completo.");
}

/* 10b — PD x LGD */
{const s=pres.addSlide();
 titulo(s,"Coste del riesgo = PD × LGD","Parámetros IRB de la clase «Corporates – Of Which: SME» · Mediana de entidades declarantes · 2026-Q1 · Es la línea de riesgo de la cuenta de resultados");
 s.addChart(pres.ChartType.bar, [{name:"PD × LGD", labels:P, values:D.irb.cor}],
   {x:M, y:1.8, w:7.1, h:3.9, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0.00"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:1.0});
 const L=[["","PD","LGD","PD × LGD"]].concat(P.map((p,i)=>
   [p, D.irb.pd[i].toFixed(2)+" %", D.irb.lgd[i].toFixed(1)+" %", D.irb.cor[i].toFixed(2)+" %"]));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:10})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10.5, bold: ci===0});
   if(ci===3) o.bold=true, o.fill={color:ORA3}, o.color=DARK;
   return {text:c, options:o};}));
 s.addTable(rows, {x:8.0, y:1.8, w:4.73, colW:[1.6,1.02,1.02,1.09], rowH:0.385,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 s.addText([{text:"Fórmula: ", options:{bold:true}},
   {text:"coste del riesgo = PD (probabilidad de impago a un año) × LGD (severidad de la pérdida). Ejemplo España: 1,73 % × 34,38 % = 0,59 %. Es pérdida esperada anual sobre el saldo, no el stock de dudosos de la lámina anterior.", options:{}}],
   {x:M, y:5.80, w:W-2*M, h:0.45, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0});
 s.addText("Italia tiene la peor combinación y Países Bajos la mejor. Irlanda tiene la PD más baja de los siete, 1,08 %, pero una LGD del 37,3 %.",
   {x:M, y:6.28, w:W-2*M, h:0.35, fontFace:BF, fontSize:10.5, color:MUT, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA, anexo de parámetros de riesgo del Risk Dashboard Q1 2026, origen COREP C 9.02. Se usa la mediana de entidades y no la media ponderada, que se deja arrastrar por carteras grandes con parámetros extremos.");
}

/* 11b — spread PYME vs gran empresa en PD y LGD */
{const s=pres.addSlide();
 titulo(s,"Spread PYME frente a gran empresa: PD y LGD","Parámetros IRB, mediana de entidades · 2026-Q1 · La PYME falla más pero recupera mejor");
 const C=D.irb_cmp;
 s.addChart(pres.ChartType.bar, [
   {name:"PD PYME", labels:P, values:C.pd_pyme},
   {name:"PD gran empresa", labels:P, values:C.pd_grande}],
   {x:M, y:1.75, w:6.5, h:2.35, barDir:"col", chartColors:[PRIM,G3],
    showTitle:true, title:"Probabilidad de impago (PD)", titleFontSize:12,
    titleColor:PRIM, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:2.6});
 s.addChart(pres.ChartType.bar, [
   {name:"LGD PYME", labels:P, values:C.lgd_pyme},
   {name:"LGD gran empresa", labels:P, values:C.lgd_grande}],
   {x:6.95, y:1.75, w:5.78, h:2.35, barDir:"col", chartColors:[ORA2,G3],
    showTitle:true, title:"Severidad de la pérdida (LGD)", titleFontSize:12,
    titleColor:PRIM, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:48});
 const L=[["Spread PYME − gran empresa"].concat(P),
   ["PD (puntos básicos)"].concat(C.spread_pd.map(v=>(v>0?"+":"")+v)),
   ["LGD (puntos porcentuales)"].concat(C.spread_lgd.map(v=>(v>0?"+":"")+v.toFixed(1))),
   ["PD × LGD (puntos básicos)"].concat(C.spread_cor.map(v=>(v>0?"+":"")+v))];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:10})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10.5, bold: ci===0});
   if(ci>0){ const neg=String(c).startsWith("-");
     o.color=DARK; o.bold=true; o.fill={color: neg?BLUE3:MAG3}; }
   if(ri===3) o.fill={color: ci===0?LIGHT:ORA3};
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:4.32, colW:[2.9].concat(Array(7).fill(1.319)), rowH:0.36}));
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.95, w:W-2*M, h:0.85, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText([{text:"Cautela con el LGD de gran empresa. ", options:{bold:true, color:DARK}},
   {text:"Está agrupado en el 40,0 % en los siete países y en todo el reparto (percentiles 25, 50 y 75), porque es el valor supervisor del IRB básico bajo CRR3, no una estimación propia. La ventaja de severidad de la PYME es real —viene de mayor garantía real— pero está exagerada por ese efecto: en media ponderada la brecha se reduce a la mitad (PYME 23,6–37,9 % frente a gran empresa 35,0–38,8 %). El spread de PD, en cambio, es sólido: la PD sí es estimación propia en ambas clases.",
    options:{color:TXT}}],
   {x:M+0.22, y:6.05, w:11.85, h:0.68, fontFace:BF, fontSize:10, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA, anexo de parámetros de riesgo del Risk Dashboard Q1 2026, origen COREP C 9.02. Clases «Corporates – Of Which: SME» y «Corporates – Of Which: Large corporates».");
}

/* 10c — consumo de capital */
{const s=pres.addSlide();
 titulo(s,"Consumo de capital de la cartera PYME","RWA sobre valor de exposición · EU-wide Transparency Exercise · Junio 2025 · Incorpora ya el factor de apoyo a PYME del art. 501 CRR");
 s.addChart(pres.ChartType.bar, [{name:"Densidad de RWA", labels:P, values:D.capital.densidad}],
   {x:M, y:1.85, w:7.3, h:3.9, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:70});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:1.85, w:4.53, h:2.1, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("El capital manda sobre el precio",{x:8.42, y:2.0, w:4.1, h:0.55,
   fontFace:HF, fontSize:13, bold:true, color:ACC, isTextBox:true, margin:0});
 s.addText("Va del 35,3 % en Alemania al 70,0 % en Irlanda: un euro de préstamo PYME consume el doble de capital en Irlanda que en Alemania. Sobre el mismo margen, eso divide el ROE por dos. Es el factor que más mueve el ranking, por delante del precio.",
   {x:8.42, y:2.58, w:4.1, h:1.25, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 const LC=[["","Densidad","× CET1","= Capital"]].concat(P.map((p,i)=>
   [p, D.capital.densidad[i].toFixed(1)+" %", D.eba.cet1[i].toFixed(2)+" %",
    D.pl.capital[i].toFixed(2)+" %"]));
 const rc=LC.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:9.5, bold: ci===0});
   if(ci===3) o.bold=true, o.fill={color:ORA3}, o.color=DARK;
   return {text:c, options:o};}));
 s.addTable(rc, {x:8.2, y:4.02, w:4.53, colW:[1.33,1.09,1.05,1.06], rowH:0.235,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 s.addText("Capital asignado = densidad de RWA × ratio CET1. Ambos observados por país; no hay supuesto en esta línea.",
   {x:M, y:5.9, w:W-2*M, h:0.55, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA, EU-wide Transparency Exercise 2025, fichero tr_cre.csv, partidas 2520523 (valor de exposición PYME) y 2520533 (RWA PYME), agregadas por supervisor nacional. La diferencia refleja el peso de modelos internos frente a método estándar y la garantía aportada.");
}


/* 11 — eficiencia, capital, comisiones */
{const s=pres.addSlide();
 titulo(s,"Eficiencia, capital y comisiones en Sistema Bancario","2026-Q1 · Nivel de grupo consolidado, no de segmento PYME");
 const L=[["Indicador"].concat(P),
   ["Ratio de NPL"].concat(D.eba.npl.map(v=>v.toFixed(2)+" %")),
   ["Coste del riesgo"].concat(D.eba.cor.map(v=>v.toFixed(2)+" %")),
   ["Eficiencia (cost-income)"].concat(D.eba.ci.map(v=>v.toFixed(1)+" %")),
   ["ROE del sistema"].concat(D.eba.roe.map(v=>v.toFixed(1)+" %")),
   ["Ratio CET1"].concat(D.eba.cet1.map(v=>v.toFixed(1)+" %")),
   ["Comisiones / ingresos"].concat(D.eba.com.map(v=>v.toFixed(1)+" %"))];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center"})};
   return {text:c, options:cel(null,{align: ci===0?"left":"center", bold: ci===0,
     fill:{color: ri%2 ? "FFFFFF" : LIGHT}})};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.8, colW:[2.7].concat(Array(7).fill(1.347)), rowH:0.46}));
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.1, w:6.0, h:1.5, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Por qué España rinde pese al spread estrecho",{x:M+0.22, y:5.25, w:5.55, h:0.32,
   fontFace:HF, fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Segunda mejor eficiencia (42,1 %) y el mayor ROE de sistema (18,5 %). Compensa por volumen y coste operativo, no por precio.",
   {x:M+0.22, y:5.62, w:5.55, h:0.85, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:6.85, y:5.1, w:5.88, h:1.5, fill:{color:ORA3},
   rectRadius:0.06, line:{color:ORA2}});
 s.addText("Advertencia sobre estas cifras",{x:7.07, y:5.25, w:5.45, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Son de grupo consolidado. El coste del riesgo español (1,22 %) está inflado por el negocio internacional: CaixaBank, doméstico, reporta 0,24 %. Por eso el modelo no usa esta fila.",
   {x:7.07, y:5.62, w:5.45, h:0.85, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA Risk Dashboard, anexo de datos Q1 2026, indicadores AQT_3.2, PFT_43, PFT_23, PFT_21, SVC_3 y PFT_26.");
}

/* 12 — circulante */
{const s=pres.addSlide();
 titulo(s,"Circulante: líneas de crédito y descubiertos","Tipo de nueva producción a empresas · Media 2026 · Serie A2Z1, que excluye deuda de tarjeta");
 s.addChart(pres.ChartType.bar, [{name:"Tipo circulante", labels:P, values:D.circulante}],
   {x:M, y:1.85, w:7.3, h:4.0, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0.0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:6});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:1.85, w:4.53, h:1.9, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Hueco: no hay volumen por país",{x:8.42, y:2.0, w:4.1, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El BCE publica el tipo de circulante por país, pero el volumen de nueva producción solo existe para el agregado de zona euro. No se puede calcular el peso del circulante en la cartera de cada país con fuentes oficiales.",
   {x:8.42, y:2.4, w:4.1, h:1.25, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:3.95, w:4.53, h:1.9, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Dos perímetros distintos",{x:8.42, y:4.1, w:4.1, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("A2Z1 son revolving y descubiertos. A2Z añade deuda de tarjeta. La diferencia va de 0 a 4 pb, mayor en Francia y zona euro. Se usa A2Z1, que es el perímetro de circulante de empresa.",
   {x:8.42, y:4.5, w:4.1, h:1.25, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: BCE, dataset MIR, serie A2Z1 (revolving y descubiertos a sociedades no financieras). El dato de julio de 2026 es provisional en España, Alemania, Francia, Italia y zona euro.");
}

/* 13 — hipotecas */
{const s=pres.addSlide();
 titulo(s,"Hipoteca PYME: no existe estadística oficial","El bloque se cubre con exposición a inmueble comercial, que es el proxy disponible");
 s.addShape(pres.ShapeType.roundRect,{x:M, y:1.8, w:W-2*M, h:1.25, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Qué falta y por qué",{x:M+0.25, y:1.93, w:11.8, h:0.3, fontFace:HF,
   fontSize:14, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El dataset MIR del BCE publica préstamos para adquisición de vivienda solo del sector hogares. No hay desglose de préstamo con garantía inmobiliaria a empresas en ninguno de los seis países. El crédito con garantía real a PYME queda subsumido en la serie genérica por tramo de importe, y su precio no es observable por separado.",
   {x:M+0.25, y:2.28, w:11.8, h:0.7, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0});
 s.addText("Proxy disponible: ratio de NPL de la cartera de inmueble comercial (CRE)", {x:M, y:3.28,
   w:11.8, h:0.35, fontFace:HF, fontSize:15, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("El gráfico muestra el porcentaje de la cartera de inmueble comercial que está en mora. No es un precio ni un margen: es calidad de activo.",
   {x:M, y:3.62, w:11.8, h:0.3, fontFace:BF, fontSize:10, color:MUT, isTextBox:true, margin:0});
 s.addChart(pres.ChartType.bar, [{name:"Ratio de NPL, cartera CRE", labels:P, values:D.npl_seg.cre}],
   {x:M, y:3.98, w:11.8, h:2.22, barDir:"col", chartColors:[PRIM],
    showTitle:true, title:"Ratio de NPL de la cartera de inmueble comercial (%)",
    titleFontSize:11, titleColor:TXT,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:12,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:8});
 fuente(s,"Fuente: EBA Risk Dashboard Q1 2026, desglose «of which CRE». Alemania destaca con el peor NPL de inmueble comercial de los seis (6,81 %), muy por encima de su NPL total (1,61 %).");
}

/* 14 — factoring */
{const s=pres.addSlide();
 titulo(s,"Factoring y confirming: volumen sí, precio no","Volumen cedido 2025 y penetración sobre PIB · El precio no es obtenible con fuentes públicas");
 s.addChart(pres.ChartType.bar, [{name:"Penetración sobre PIB", labels:P, values:D.factoring.pib}],
   {x:M, y:1.85, w:6.9, h:3.6, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:11, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:24});
 s.addShape(pres.ShapeType.roundRect,{x:7.8, y:1.85, w:4.93, h:1.95, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("La tabla de la EUF no es comparable",{x:8.02, y:1.98, w:4.5, h:0.32,
   fontFace:HF, fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El 52,6 % de la cifra española es confirming. En Italia el confirming es el 1,9 %. Comparar los 269.885 M€ de España con los 297.445 M€ de Italia es comparar pago confirmado a proveedores contra cesión de facturas.",
   {x:8.02, y:2.38, w:4.5, h:1.3, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:7.8, y:3.98, w:4.93, h:1.47, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Sin precio en ninguna fuente",{x:8.02, y:4.11, w:4.5, h:0.3, fontFace:HF,
   fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Ni EUF, ni AEF, ni Assifact, ni la OCDE publican comisión de cesión o tipo de descuento. Las cuentas de las filiales especializadas están en registros de pago.",
   {x:8.02, y:4.48, w:4.5, h:0.9, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 s.addText("Volumen cedido 2025 (M€):  " + P.map((p,i)=>`${p} ${Math.round(D.factoring.volumen[i]/1000)}k`).join("  ·  "),
   {x:M, y:5.6, w:W-2*M, h:0.4, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuentes: EUF (datos anuales 2025), AEF para el desglose español, Assifact para el italiano. El turnover es importe cedido en el año, no saldo vivo: no comparable con cartera de crédito.");
}

/* 14b — comparables */
{const s=pres.addSlide();
 titulo(s,"Comparables banco a banco","Cuentas de resultados 2026 · De nueve bancos analizados, solo dos publican segmento de empresas con desglose de comisiones");
 const C=D.comparables;
 const g=n=>{const c=C.find(x=>x.banco===n); return c?c.m:{};};
 const L=[["Banco","País","Segmento publicado","Ingresos M€","Comisiones M€","Com./ing.","Eficiencia"],
  ["Commerzbank","Alemania","Corporate Clients","1.232","376","30,5 %","—"],
  ["ABN AMRO","P. Bajos","Corporate Banking","1.694","429","25,3 %","49,5 %"],
  ["Intesa Sanpaolo","Italia","Banca dei Territori","6.205","no desglosa","—","46,7 %"],
  ["CaixaBank","España","no tiene segmento empresas","8.338","2.075","24,9 %","39,6 %"],
  ["BPER Banca","Italia","no desglosa por división","3.876","1.353","34,9 %","41,4 %"],
  ["ING · SocGen · BNP","—","no accesible: bloqueo antibot","—","—","—","—"]];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci<3?"left":"center", fontSize:10})};
   const o=cel(null,{align: ci<3?"left":"center", fontSize:10, bold: ci===0});
   if(ri===6) o.color=MUT, o.italic=true;
   else if(ci===2 && c.startsWith("no")) o.color=G1, o.italic=true;
   else if(ci===2) o.color=PRIM, o.bold=true;
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.82, colW:[2.4,1.5,3.3,1.6,1.6,1.25,1.48], rowH:0.5}));
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.25, w:W-2*M, h:1.35, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Por qué esto no cierra la pata de comisiones",{x:M+0.25, y:5.38, w:11.8, h:0.3,
   fontFace:HF, fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("La NIIF 8 obliga a reportar por los segmentos que usa la dirección, y casi ninguno usa «PYME». El segmento de Commerzbank mezcla gran empresa, PYME, sector público e institucionales. En ABN AMRO la PYME neerlandesa ni siquiera está en Corporate Banking, sino en Personal & Business Banking. El peso de comisiones del 25 % al 35 % sirve como orden de magnitud de la banca de empresas, no como medida del negocio PYME.",
   {x:M+0.25, y:5.72, w:11.8, h:0.8, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuentes: comunicado de resultados Q2 2026 de Commerzbank; informe intermedio Q2 2026 de ABN AMRO; resultados 1H26 de Intesa Sanpaolo; Actividad y Resultados 1S26 de CaixaBank; resultados 1H26 de BPER. Cifras de segmento donde existe, de grupo en el resto.");
}

/* 15 — supuestos */
{const s=pres.addSlide();
 titulo(s,"Supuestos del modelo","Cada uno declarado, con su origen y su efecto · Dos de los iniciales han dejado de ser supuestos");
 const L=[["Supuesto","Valor","Origen","Efecto si cambia"],
  ["% de comisiones","87 pb","Observada en España (TAE − TEDR, tramo ≤1 M€). Aplicada a los otros cinco países","ALTO. Mueve el ROE entre 3 y 12 puntos"],
  ["Coste de los recursos","0,41 % a 1,34 % por país","Observado. Tipos del MIR ponderados por saldos del BSI. Supone financiar el crédito PYME con depósito de empresa","ALTO. Con fondeo en mercado al 2,23 % los ROE caerían entre 6 y 12 puntos"],
  ["Coste del riesgo","PD × LGD por país","YA NO ES SUPUESTO. Parámetros IRB de la clase «Corporates – Of Which: SME», mediana de entidades (COREP C 9.02)","—"],
  ["Densidad de RWA","35 % a 61 % por país","YA NO ES SUPUESTO. RWA sobre exposición de la cartera PYME (EBA Transparency Exercise)","—"],
  ["Tipo impositivo","15,0 % a 30,1 %","YA NO ES SUPUESTO. Tipo aplicable a bancos: España 30 % por el art. 29 LIS, Irlanda 15 % por el mínimo de Pilar Dos, resto combinado 2026","—"],
  ["Eficiencia","EBA por país","Observada, pero de grupo consolidado y no de segmento PYME","MEDIO. Penaliza a países con banca universal compleja"]];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align:"left", fontSize:11})};
   const o=cel(null,{align:"left", fontSize:10, color:TXT});
   if(ci===0) o.bold=true;
   if(ci===3 && c.startsWith("ALTO")) o.color=DARK, o.bold=true, o.fill={color:MAG3};
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.78, colW:[2.7,1.75,4.5,3.17], rowH:0.62}));
 fuente(s,"El modelo completo y reproducible está en scripts/modelo_roe.py del repositorio. Cada fila del CSV de salida declara si el valor es observado o supuesto.");
}

/* 19b — conclusiones y recomendaciones */
{const s=pres.addSlide();
 titulo(s,"Conclusiones y recomendaciones","Lo que sostienen los datos y lo que se deriva para una decisión de entrada");
 const C=[
  ["1","El capital manda sobre el precio",
   "La densidad de RWA va del 35 % en Alemania al 70 % en Irlanda. Esa horquilla separa más el ROE que el precio, que solo va del 3,41 % al 5,37 %. Irlanda lo demuestra: tiene el precio más alto de las siete y la mejor PD, y aun así queda sexta entre los bancos locales."],
  ["2","El atractivo para un entrante no coincide con la rentabilidad del local",
   "Francia es el peor mercado para su banca (5,0 %) y el cuarto mejor para un entrante eficiente (21,8 %). Lo que se compra al entrar no es el margen del mercado, es la distancia respecto al incumbente."],
  ["3","España es el mercado donde menos vale entrar eficiente",
   "Solo gana 1,2 puntos de ROE. Su banca ya es la segunda más eficiente (42,1 %), sus recursos ya son baratos (0,75 %, por debajo del 0,80 % del entrante) y arrastra una densidad de RWA del 59,5 % y el 30 % de impuesto del art. 29 LIS."],
  ["4","Países Bajos y Alemania son los objetivos naturales",
   "37,0 % y 35,0 % de ROE para el entrante. Combinan el menor coste del riesgo (0,35 % y 0,40 %) con la menor densidad de RWA (37 % y 35 %) e incumbentes con eficiencia mediocre (53,5 % y 55,2 %)."],
  ["5","La comisión es el único supuesto material que queda",
   "Solo España publica un tipo con comisiones para empresas, y allí vale 87 pb sobre el tramo ≤1 M€. Aplicarla a los demás es una hipótesis. Antes de decidir, conviene validarla en el mercado objetivo: mueve el ROE entre 3 y 8 puntos."]];
 let y=1.72;
 C.forEach((c,i)=>{
   s.addShape(pres.ShapeType.ellipse,{x:M, y:y+0.04, w:0.36, h:0.36, fill:{color:PRIM}, line:{color:PRIM}});
   s.addText(c[0], {x:M, y:y+0.04, w:0.36, h:0.36, fontFace:HF, fontSize:13, bold:true,
     color:"FFFFFF", align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(c[1], {x:M+0.55, y:y, w:11.6, h:0.3, fontFace:HF, fontSize:12.5, bold:true,
     color:DARK, isTextBox:true, margin:0});
   s.addText(c[2], {x:M+0.55, y:y+0.31, w:11.6, h:0.62, fontFace:BF, fontSize:9.5,
     color:G1, isTextBox:true, margin:0});
   y+=1.03;});
 fuente(s,"Las conclusiones 1 a 4 se apoyan en datos observados por país; la 5 señala el supuesto que las condiciona. El escenario de entrante no incorpora coste de entrada, escala mínima ni curva de aprendizaje de riesgo.");
}

/* 19c — recomendaciones accionables */
{const s=pres.addSlide();
 titulo(s,"Recomendaciones","Qué haría falta para convertir este análisis en una decisión");
 const R=[
  ["Priorizar","Países Bajos y Alemania","37,0 % y 35,0 % de ROE simulado. Incumbentes ineficientes, riesgo bajo y capital barato. Son los dos mercados donde el modelo eficiente rinde más."],
  ["Estudiar","Francia e Irlanda","21,8 % y 27,0 %. Francia por la distancia respecto a un incumbente muy ineficiente; Irlanda por el 15 % de impuesto, aunque con la mayor densidad de RWA y una cartera PYME pequeña (16.964 M€)."],
  ["Descartar","España y Portugal","13,7 % y 16,9 %. El diferencial frente al banco local es de 1,2 y 3,0 puntos: no compensa el coste de entrada."],
  ["Validar antes de decidir","La comisión en el mercado objetivo","Es el único supuesto material. Mueve el ROE entre 3 y 8 puntos y solo está observada en España."],
  ["Completar","Densidad de RWA propia","La del modelo es la del mercado. Un entrante con método estándar o con menos garantía real tendría una densidad distinta, y ese es el factor que más pesa."],
  ["Cerrar","Precio del factoring y del confirming","No es obtenible con fuentes públicas gratuitas. Si el producto entra en el plan, hay que ir a registros de pago o a datos de mercado."]];
 let y=1.75;
 R.forEach((r,i)=>{
   s.addShape(pres.ShapeType.roundRect,{x:M, y:y, w:2.25, h:0.72, fill:{color: i<3?ORA3:LIGHT},
     rectRadius:0.05, line:{color: i<3?ORA2:G3}});
   s.addText(r[0], {x:M, y:y, w:2.25, h:0.72, fontFace:HF, fontSize:11, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(r[1], {x:M+2.45, y:y+0.03, w:3.3, h:0.66, fontFace:HF, fontSize:11, bold:true,
     color:DARK, valign:"middle", isTextBox:true, margin:0});
   s.addText(r[2], {x:M+5.9, y:y+0.03, w:6.25, h:0.66, fontFace:BF, fontSize:9,
     color:G1, valign:"middle", isTextBox:true, margin:0});
   y+=0.84;});
 fuente(s,"ROE simulado del entrante con coste de los recursos 0,80 %, eficiencia 40 % y CET1 12,9 %, sobre el precio, riesgo, capital y fiscalidad de cada mercado. No incorpora coste de entrada ni escala mínima.");
}

/* 16 — lo que no se puede afirmar */
{const s=pres.addSlide(); s.background={color:DARK};
 s.addText("Lo que estos datos no permiten afirmar", {x:M, y:0.55, w:W-2*M, h:0.6,
   fontFace:HF, fontSize:30, bold:true, color:"FFFFFF", isTextBox:true, margin:0});
 s.addText("Cuatro límites que conviene tener delante antes de usar cualquier cifra de este deck",
   {x:M, y:1.18, w:W-2*M, h:0.4, fontFace:BF, fontSize:13, color:G2, isTextBox:true, margin:0});
 const lim=[
  ["Rentabilidad comparable entre países","Riesgo y capital de PYME ya son observados por país. Lo que sigue siendo supuesto es la comisión: solo España e Italia publican un tipo con comisiones para empresas, y con perímetros distintos. El ROE comparado es una hipótesis ordenada, no una medición."],
  ["El negocio PYME de cada banco","De nueve bancos analizados, solo dos publican cuenta de resultados de un segmento de empresas con desglose de comisiones, y ninguno aísla PYME. La NIIF 8 obliga a reportar por los segmentos que usa la dirección, y casi ninguno usa «PYME»."],
  ["El precio del factoring y del confirming","No es obtenible con fuentes públicas gratuitas en ninguno de los seis países. Es el único bloque que se cierra sin ningún dato de su objetivo."],
  ["La hipoteca a PYME","No existe como estadística oficial europea. Lo que se muestra es exposición a inmueble comercial, que es otra cosa."]];
 let y=1.8;
 lim.forEach((l,i)=>{
   s.addShape(pres.ShapeType.ellipse,{x:M, y:y+0.06, w:0.42, h:0.42, fill:{color:ACC}, line:{color:ACC}});
   s.addText(String(i+1), {x:M, y:y+0.06, w:0.42, h:0.42, fontFace:HF, fontSize:15, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(l[0], {x:M+0.65, y:y, w:11.5, h:0.32, fontFace:HF, fontSize:15, bold:true,
     color:"FFFFFF", isTextBox:true, margin:0});
   s.addText(l[1], {x:M+0.65, y:y+0.36, w:11.5, h:0.72, fontFace:BF, fontSize:11.5,
     color:G3, isTextBox:true, margin:0});
   y+=1.22;});
}

/* 17 — fuentes */
{const s=pres.addSlide();
 titulo(s,"Fuentes","Nueve fuentes, 25.370 observaciones, cada fila trazable a su serie de origen");
 const L=[["Bloque","Fuente","Cobertura","Último dato"],
  ["Precio y volumen","BCE, ECB Data Portal, dataset MIR","6 países, mensual","2026-07"],
  ["Tipos oficiales","BCE, dataset FM (facilidad de depósito, MRO, Euríbor)","Zona euro, diario","2026-09"],
  ["Encuesta PYME","BCE, SAFE (Q8B y brecha de financiación)","6 países, semestral","Q8B hasta 2022-S1"],
  ["Riesgo, eficiencia, capital","EBA Risk Dashboard, anexo de datos","6 países, trimestral","2026-Q1"],
  ["Comisiones y volumen España","Banco de España, Boletín Estadístico, cap. 19","España, mensual","2026-07"],
  ["TAEG empresas Italia","Banca d'Italia, STACORIS, tavola TRI30951","Italia, trimestral","2026-Q1"],
  ["Spread PYME","OCDE, Financing SMEs and Entrepreneurs","5 países, sin Alemania","2022"],
  ["Factoring","EUF, AEF y Assifact","6 países, anual","2025"],
  ["Comparables","Cuentas de resultados de 5 bancos","5 bancos de 9","2026-H1"]];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align:"left", fontSize:11})};
   return {text:c, options:cel(null,{align:"left", fontSize:10.5, bold: ci===0,
     fill:{color: ri%2 ? "FFFFFF" : LIGHT}})};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.78, colW:[2.85,4.65,2.8,1.82], rowH:0.44}));
 s.addText("Todos los datos, los extractores y el registro de huecos y decisiones metodológicas están en el repositorio del proyecto, en notas.md.",
   {x:M, y:6.35, w:W-2*M, h:0.4, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
}

pres.writeFile({fileName:"rentabilidad_pyme.pptx"}).then(f=>console.log("escrito:",f));
