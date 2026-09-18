const pptxgen = require("pptxgenjs");
const D = require("./datos.json");

/* ---------------------------------------------------------------------
   SISTEMA VISUAL

   Naranja, negro, grises y azul salen del manual de marca (Pantone 165 C,
   Hex f56600). El AMARILLO no esta en ese manual: se ha muestreado de las
   laminas que aporto el usuario, donde aparece como acento de bloques y
   destacados. Se documenta asi para que no parezca un color inventado.

   Reglas: titulo en negro corporativo, no en naranja; el naranja manda en
   datos, numeracion y separadores; el amarillo solo en destacados; texto
   siempre oscuro sobre amarillo o pastel, nunca blanco.
   --------------------------------------------------------------------- */
const PRIM="F56600";            // naranja Pantone 165 C
const DARK="2B2B2B";            // negro corporativo
const G1="818181", G2="A1A1A1", G3="CACACA", LIGHT="E5E5E5";
const PAPEL="FAFBFC";           // blanco roto del fondo de lamina
const YEL ="FFD200", YEL2="FFE066", YEL3="FFF4C2";   // amarillo muestreado
const BLUE="77BFEE", BLUE3="C7E3F9";
const MAG ="FF8AC2", MAG3="FFCCE8";
const ORA2="FFAB70", ORA3="FFD6BA";
const OK=BLUE, MED=ORA2, BAD=MAG, ACC=PRIM, TXT=DARK, MUT=G1;
const HF="Verdana", BF="Verdana";
const P = D.paises;
const n1=(v,d=1)=>v.toFixed(d).replace(".",",");
const sg=v=>v>0?"+"+v:(v<0?"−"+Math.abs(v):"0");
const sg2=v=>(v>0?"+":(v<0?"−":""))+n1(Math.abs(v));

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";            // 13.33 x 7.5
pres.author = "Analisis PYME Europa";

const W = 13.33, H = 7.5, M = 0.68;
let NLAM = 0;                           // numero de lamina, lo pone nueva()

/* Marca denominativa. No hay fichero de logotipo en el repositorio, asi que
   se compone con tipografia: "bankinter" en negro y el punto en naranja. */
function logo(s, dark){
  s.addText([{text:"bankinter", options:{color: dark?"FFFFFF":DARK}},
             {text:".", options:{color:PRIM}}],
    {x:W-2.35, y:0.30, w:1.75, h:0.28, fontFace:HF, fontSize:13, bold:true,
     align:"right", isTextBox:true, margin:0});
}

/* Toda lamina de contenido nace aqui: fondo, marca y numeracion. */
function nueva(opts){
  opts = opts || {};
  const s = pres.addSlide();
  NLAM += 1;                 // cuenta TODAS las laminas, tambien portada y separadores
  if(!opts.limpia){
    s.background = {color: opts.fondo || PAPEL};
    logo(s, opts.marcaClara);
    s.addText(String(NLAM), {x:M, y:H-0.30, w:0.6, h:0.20, fontFace:BF,
      fontSize:8, color: opts.marcaClara?G2:G3, isTextBox:true, margin:0});
  }
  return s;
}

/* Titulo de lamina de contenido. */
function titulo(s, t, sub){
  s.addText(t, {x:M, y:0.46, w:W-2*M-1.9, h:0.74, fontFace:HF, fontSize:22,
                bold:true, color:DARK, isTextBox:true, margin:0});
  if(sub) s.addText(sub, {x:M, y:1.16, w:W-2*M, h:0.40, fontFace:BF,
                fontSize:10.5, color:MUT, isTextBox:true, margin:0});
}
function fuente(s, t, sz){
  s.addText(t, {x:M, y:6.62, w:W-2*M, h:0.52, fontFace:BF, fontSize: sz||7.5,
                color:MUT, italic:true, isTextBox:true, margin:0});
}

/* Composicion geometrica de bloques, en lugar de las fotografias del
   original: no hay banco de imagenes con licencia en el proyecto. Cada
   bloque deja hueco para sustituirlo por una foto si se aporta. */
function bloques(s, x, y, w, h){
  s.addShape(pres.ShapeType.rect,{x:x, y:y, w:w, h:h, fill:{color:PRIM}, line:{color:PRIM}});
  s.addShape(pres.ShapeType.rect,{x:x+w*0.55, y:y+h*0.10, w:w*0.30, h:h*0.30,
    fill:{color:YEL}, line:{color:YEL}});
  s.addShape(pres.ShapeType.rect,{x:x+w*0.12, y:y+h*0.58, w:w*0.26, h:h*0.30,
    fill:{color:"FFFFFF"}, line:{color:"FFFFFF"}, transparency:78});
  s.addShape(pres.ShapeType.rect,{x:x+w*0.62, y:y+h*0.55, w:w*0.22, h:h*0.22,
    fill:{color:ORA2}, line:{color:ORA2}});
}

/* Separador de bloque: numero grande, titulo y composicion a la derecha. */
function divisor(num, t, sub){
  const s = nueva({limpia:true});
  s.background = {color:PAPEL};
  s.addShape(pres.ShapeType.rect,{x:0, y:0, w:7.30, h:H, fill:{color:PRIM}, line:{color:PRIM}});
  s.addText(num, {x:M, y:1.10, w:3.0, h:1.30, fontFace:HF, fontSize:58, bold:true,
    color:"FFFFFF", transparency:45, isTextBox:true, margin:0});
  s.addText(t, {x:M, y:2.55, w:6.0, h:1.50, fontFace:HF, fontSize:31, bold:true,
    color:"FFFFFF", isTextBox:true, margin:0});
  if(sub) s.addText(sub, {x:M, y:4.15, w:5.7, h:1.10, fontFace:BF, fontSize:12.5,
    color:"FFFFFF", transparency:18, isTextBox:true, margin:0});
  s.addShape(pres.ShapeType.rect,{x:6.62, y:0.90, w:1.36, h:1.36, fill:{color:YEL}, line:{color:YEL}});
  bloques(s, 8.30, 1.30, 4.35, 4.90);
  logo(s, false);
  return s;
}

/* Destacado amarillo: es el elemento de enfasis del sistema. */
function nota(s, x, y, w, h, tit, txt, col){
  const c = col || YEL3;
  s.addShape(pres.ShapeType.roundRect,{x:x, y:y, w:w, h:h, fill:{color:c},
    rectRadius:0.04, line:{color: c===YEL3?YEL2:c}});
  s.addShape(pres.ShapeType.rect,{x:x, y:y, w:0.07, h:h, fill:{color:PRIM}, line:{color:PRIM}});
  s.addText(tit, {x:x+0.24, y:y+0.10, w:w-0.42, h:0.24, fontFace:HF, fontSize:11,
    bold:true, color:DARK, isTextBox:true, margin:0});
  s.addText(txt, {x:x+0.24, y:y+0.36, w:w-0.42, h:h-0.48, fontFace:BF, fontSize:8.5,
    color:DARK, isTextBox:true, margin:0});
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

/* --- Cada lamina es una funcion; el orden se decide abajo, en ORDEN. --- */
const L = {};

/* 1 — portada */
L.portada = () => {const s=nueva({limpia:true});
 s.background={color:DARK};
 /* Composicion de bloques en el tercio derecho, en lugar de fotografia */
 s.addShape(pres.ShapeType.rect,{x:8.05, y:0, w:5.28, h:H, fill:{color:PRIM}, line:{color:PRIM}});
 s.addShape(pres.ShapeType.rect,{x:11.10, y:0.90, w:1.60, h:1.60, fill:{color:YEL}, line:{color:YEL}});
 s.addShape(pres.ShapeType.rect,{x:8.60, y:3.60, w:1.90, h:1.90, fill:{color:"FFFFFF"},
   line:{color:"FFFFFF"}, transparency:80});
 s.addShape(pres.ShapeType.rect,{x:10.80, y:5.05, w:1.25, h:1.25, fill:{color:ORA2}, line:{color:ORA2}});
 s.addShape(pres.ShapeType.rect,{x:0, y:0, w:0.34, h:H, fill:{color:PRIM}, line:{color:PRIM}});
 logo(s, true);
 s.addText("Rentabilidad\ndel negocio PYME", {x:1.10, y:2.15, w:6.60, h:1.70, fontFace:HF,
   fontSize:37, bold:true, color:"FFFFFF", isTextBox:true, margin:0, lineSpacingMultiple:1.05});
 s.addShape(pres.ShapeType.rect,{x:1.10, y:4.05, w:1.05, h:0.075, fill:{color:YEL}, line:{color:YEL}});
 s.addText("España · Alemania · Francia · Italia · Portugal · Países Bajos · Irlanda",
   {x:1.10, y:4.32, w:6.60, h:0.44, fontFace:BF, fontSize:11.5, color:G3, isTextBox:true, margin:0});
 s.addText("Cinco productos · Datos oficiales 2026\nModelo de ROE con supuestos declarados",
   {x:1.10, y:4.85, w:6.60, h:0.72, fontFace:BF, fontSize:11, color:YEL, isTextBox:true, margin:0});
 s.addText("39.508 observaciones · 13 fuentes · Septiembre 2026",
   {x:1.10, y:6.45, w:6.60, h:0.30, fontFace:BF, fontSize:9.5, color:G2, isTextBox:true, margin:0});
 s.addNotes("Deck construido sobre datos oficiales del BCE, EBA, OCDE, Banco de España, Banca d'Italia, EUF, CESGAR y Central de Balances. El ROE es modelizado, no observado.");
};

/* cierre — laminas de marca */
L.cierre_lema = () => {const s=nueva({limpia:true});
 s.background={color:PRIM};
 s.addShape(pres.ShapeType.rect,{x:8.90, y:1.55, w:1.70, h:1.70, fill:{color:YEL}, line:{color:YEL}});
 s.addShape(pres.ShapeType.rect,{x:10.25, y:3.05, w:1.35, h:1.35, fill:{color:"FFFFFF"},
   line:{color:"FFFFFF"}, transparency:78});
 s.addText("Juntos hacemos crecer\nlo que importa", {x:1.10, y:2.85, w:7.0, h:1.70,
   fontFace:HF, fontSize:31, bold:true, color:"FFFFFF", isTextBox:true, margin:0,
   lineSpacingMultiple:1.08});
 logo(s, true);
};
L.cierre_gracias = () => {const s=nueva({limpia:true});
 s.background={color:PAPEL};
 s.addShape(pres.ShapeType.rect,{x:0, y:0, w:0.34, h:H, fill:{color:PRIM}, line:{color:PRIM}});
 bloques(s, 8.30, 1.70, 4.35, 4.10);
 s.addText([{text:"bankinter", options:{color:DARK}}, {text:".", options:{color:PRIM}}],
   {x:1.10, y:2.95, w:6.0, h:0.70, fontFace:HF, fontSize:38, bold:true, isTextBox:true, margin:0});
 s.addText("Gracias", {x:1.10, y:3.70, w:6.0, h:0.70, fontFace:HF, fontSize:31,
   bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.rect,{x:1.10, y:4.60, w:1.05, h:0.075, fill:{color:YEL}, line:{color:YEL}});
 s.addText("Todos los datos, los extractores y el registro de huecos y decisiones metodológicas están en el repositorio del proyecto, en notas.md.",
   {x:1.10, y:4.90, w:6.0, h:0.60, fontFace:BF, fontSize:10, color:MUT, isTextBox:true, margin:0});
};

/* 2 — objetivo y metodo */
L.objetivo = () => {const s=nueva();
 titulo(s,"Objetivo y método","Qué se mide, con qué datos y dónde están los límites");
 const cajas=[
  ["Objetivo","Comparar la rentabilidad del negocio PYME entre siete países europeos, producto a producto, sobre datos oficiales y no sobre estimaciones de mercado."],
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
};

/* 3 — mapa de fiabilidad */
L.fiabilidad = () => {const s=nueva();
 titulo(s,"Mapa de fiabilidad del dato","Qué se puede afirmar y con qué respaldo, producto a producto y país a país · El circulante es la única fila cuyo perímetro es el total de empresas: el MIR no lo publica por tramo de importe");
 const filas=[["Producto","Precio","Volumen","Comisiones","Riesgo","Capital"],
  ["Préstamo PYME por tramo","OBSERVADO","OBSERVADO","SOLO ESPAÑA","OBSERVADO","OBSERVADO"],
  ["Circulante (todas las empresas)","OBSERVADO","SOLO ESPAÑA","NO EXISTE","OBSERVADO","OBSERVADO"],
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
 s.addText("El mapa de huecos es en sí un resultado. Tras incorporar los parámetros IRB del EBA, el riesgo y el capital de PYME son observados en los siete países. El hueco que queda es la comisión: solo España publica un tipo con comisiones para empresas.",
   {x:M, y:5.55, w:W-2*M, h:0.6, fontFace:BF, fontSize:12, color:TXT, isTextBox:true, margin:0});
 [["OBSERVADO",OK],["PARCIAL o SUPUESTO",MED],["NO EXISTE",BAD]].forEach((l,i)=>chip(s,M+i*2.0,6.35,l[0],l[1]));
 fuente(s,"Fuentes: BCE (MIR), EBA Risk Dashboard, Banco de España (Boletín Estadístico), Banca d'Italia (STACORIS), OCDE, EUF.");
};

/* 4 — precio por tramo */
L.precio = () => {const s=nueva();
 titulo(s,"Precio de Préstamos a Pymes por tramo de importe","Los tres tramos que publica el MIR, sin solapamiento · Media 2026 ponderada por volumen · Fijación inicial total · Sin comisiones");
 s.addChart(pres.ChartType.bar, [
   {name:"Hasta 0,25 M€",     labels:P, values:D.tramos["Hasta 0,25 M EUR"]},
   {name:"0,25 a 1 M€",       labels:P, values:D.tramos["Mas de 0,25 y hasta 1 M EUR"]},
   {name:"Más de 1 M€",       labels:P, values:D.tramos["Mas de 1 M EUR"]}],
   {x:M, y:1.75, w:7.7, h:4.0, barDir:"col", chartColors:[PRIM,ORA2,G2],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:11,
    catAxisLabelColor:TXT, valAxisLabelColor:MUT, catAxisLabelFontSize:11,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:6.0});
 s.addShape(pres.ShapeType.roundRect,{x:8.4, y:1.75, w:4.33, h:2.32, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Peso del tramo ≤1 M€ sobre la nueva producción",{x:8.6, y:1.9, w:3.95, h:0.5,
   fontFace:HF, fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText(P.map((p,i)=>`${p}: ${D.peso1m[i]} %`).join("\n"),
   {x:8.6, y:2.42, w:3.95, h:1.58, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0, lineSpacing:13});
 s.addShape(pres.ShapeType.roundRect,{x:8.4, y:4.22, w:4.33, h:1.53, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText("Un mismo spread no significa lo mismo",{x:8.6, y:4.34, w:3.95, h:0.35,
   fontFace:HF, fontSize:13, bold:true, color:ACC, isTextBox:true, margin:0});
 s.addText("En España y Portugal la mitad de la nueva producción es de importe ≤1 M€. En Países Bajos es el 7,6 % y en Irlanda el 16,8 %. Cualquier comparación de rentabilidad debe normalizar por este peso.",
   {x:8.6, y:4.70, w:3.95, h:0.95, fontFace:BF, fontSize:10.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: BCE, ECB Data Portal, dataset MIR. Tipo anual equivalente (AAR/NDER), que excluye comisiones. Media enero-julio 2026 ponderada por volumen mensual, salvo en los dos tramos pequeños de Alemania, donde el Bundesbank no publica volumen y la media es simple. Los tres tramos no se solapan: el «hasta 1 M€» que se usa en el resto del deck es la suma ponderada de los dos primeros.");
};

/* 5 — Espana: TEDR vs TAE */
L.comisiones_es = () => {const s=nueva();
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
 s.addShape(pres.ShapeType.roundRect,{x:8.1, y:1.8, w:4.63, h:2.42, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
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
};

/* 5b — el autonomo: PYME que la estadistica pone en hogares */
L.autonomos = () => {const s=nueva();
 const A=D.autonomos;
 titulo(s,"El autónomo paga 115 pb más que la sociedad pequeña","El empresario individual es sector HOGARES en el SEC 2010, así que queda fuera de todas las series de sociedades no financieras · España · Media 2026");
 s.addChart(pres.ChartType.bar, [{name:"Tipo de nueva producción",
   labels:["Autónomo\notros fines","Autónomo\nhasta 1 año","Sociedad\n≤0,25 M€","Sociedad\n0,25-1 M€","Sociedad\n>1 M€"],
   values:[A.auto, A.auto_1a, A.snf_025, A.snf_0251, A.snf_1m]}],
   {x:M, y:1.92, w:7.30, h:3.30, barDir:"col", chartColors:[PRIM,ORA2,BLUE,BLUE,BLUE],
    varyColors:true, showTitle:false, showValue:true, dataLabelPosition:"outEnd",
    dataLabelFontSize:11, dataLabelColor:TXT, showLegend:false,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9.5, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:5.0});
 s.addText("Cuadro 19.4 del Boletín, serie 16 (autónomos) y cuadro 19.5, series 3, 7 y 11 (sociedades). Todos son TEDR, sin comisiones.",
   {x:M, y:5.24, w:7.30, h:0.28, fontFace:BF, fontSize:7.5, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.56, w:7.30, h:1.06, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("El modelo se queda corto en el micro",{x:M+0.16, y:5.64, w:7.0, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`El precio que usa el modelo es el ${n1(A.snf_hasta1m,2)} % del tramo ≤1 M€ de sociedades. La financiación empresarial al autónomo se cobra al ${n1(A.auto,2)} %: ${A.dif_vs_025} pb por encima del tramo ≤0,25 M€. Para el segmento más pequeño, el modelo infravalora el precio.`,
   {x:M+0.16, y:5.90, w:7.0, h:0.64, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 const CX=8.10, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:1.92, w:CW, h:1.46, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("Por qué no estaba en el análisis",{x:CX+0.16, y:2.00, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El SEC 2010 clasifica al empresario individual en el sector HOGARES (S.14), no en sociedades no financieras. Todo el crédito a autónomos queda por tanto fuera del dataset MIR de empresas, que es la espina dorsal del deck. La SAFE, en cambio, sí los cuenta como PYME: segmenta por empleados.",
   {x:CX+0.16, y:2.26, w:CW-0.32, h:1.04, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.48, w:CW, h:1.30, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Cuánto pesa",{x:CX+0.16, y:3.56, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`${A.vol_auto.toLocaleString("es-ES")} M€ al mes de nueva producción, frente a ${A.vol_snf_025.toLocaleString("es-ES")} M€ del tramo ≤0,25 M€ de sociedades. Es el 5 % del conjunto: no cambia el agregado, pero sí la lectura del segmento micro.`,
   {x:CX+0.16, y:3.82, w:CW-0.32, h:0.88, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:4.88, w:CW, h:1.74, fill:{color:MAG3},
   rectRadius:0.05, line:{color:MAG}});
 s.addText("Lo que sigue sin existir",{x:CX+0.16, y:4.96, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`El Boletín no publica TAE de autónomos. La única cuña cercana es la de hogares para otros fines, ${A.cuna_hogares} pb (TAE ${n1(A.tae_hogares_of,2)} % contra TEDR ${n1(A.hogares_of,2)} %), pero es de TODOS los hogares, no solo de empresarios. Y nada de esto está por entidad: la publicación por banco del Banco de España se apoya en la Circular 5/2012, que cubre comisiones de servicios y descubiertos de personas físicas, no precios de préstamo.`,
   {x:CX+0.16, y:5.22, w:CW-0.32, h:1.32, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuente: Banco de España, Boletín Estadístico, capítulo 19. Autónomos: cuadro 19.4 serie 16, media 2026 ponderada por el volumen del cuadro 19.12 serie 16; el desglose hasta 1 año (serie 17) no tiene volumen publicado, así que su media es simple. Sociedades: cuadro 19.5, medias ponderadas por el cuadro 19.13. Todos los tipos son TEDR, es decir sin comisiones, de modo que la comparación entre autónomo y sociedad es homogénea en ese sentido.");
};

/* 6 — cuenta de resultados modelizada */
L.cuenta = () => {const s=nueva();
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
};

/* 7 — ROE por pais */
L.roe = () => {const s=nueva();
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
  {text:`España queda en ${n1(D.pl.roe[0])} %`, options:{bold:true, breakLine:true}},
  {text:"con el precio más bajo, una densidad de RWA del 59,5 % y el 30 % de tipo que la banca paga en España.\n\n", options:{breakLine:true}},
  {text:"Irlanda queda cuarta", options:{bold:true, breakLine:true}},
  {text:"pese a la mayor densidad de RWA de los siete (70 %), gracias al 15 % de Pilar Dos frente al 26-30 % del resto.\n\n", options:{breakLine:true}},
  {text:"Francia queda última", options:{bold:true, breakLine:true}},
  {text:`con un ${n1(D.pl.roe[2])} %: precio bajo, recursos caros y la peor eficiencia (65,6 %).`, options:{}}],
  {x:8.5, y:2.32, w:4.05, h:3.52, fontFace:BF, fontSize:9, color:TXT, isTextBox:true, margin:0});
 fuente(s,"ROE modelizado, no observado. Depende del supuesto de comisiones: ver lámina siguiente. Tipo de sociedades aplicable a bancos: ES 30,0 (art. 29 LIS, entidades de crédito) · DE 30,1 · FR 25,8 · IT 27,8 · PT 29,5 · NL 25,8 · IE 15,0 (mínimo de Pilar Dos). En Francia, la contribución excepcional del 36,1 % para grupos de más de 1.500 M€ de cifra de negocio dejaría su ROE en 4,7 %.");
};

/* 8 — sensibilidad */
L.sensibilidad = () => {const s=nueva();
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
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.25, w:W-2*M, h:1.4, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText("Lo que el supuesto cambia y lo que no",{x:M+0.25, y:5.36, w:11.8, h:0.32,
   fontFace:HF, fontSize:14, bold:true, color:ACC, isTextBox:true, margin:0});
 s.addText("El nivel del ROE se mueve mucho: España pasa del 3,5 % al 11,8 % según se asuma cero o 150 pb de comisión. El ordenamiento se mueve menos: Francia es último en todos los escenarios e Italia, Portugal y Países Bajos encabezan en todos. Lo que sí cambia es la posición relativa de España, que sube conforme se asume más comisión — y es el único país donde sabemos que la comisión es alta.",
   {x:M+0.25, y:5.70, w:11.8, h:0.85, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 fuente(s,"87 pb es la cuña observada en España (TAE − TEDR, tramo ≤1 M€, media 2026, Banco de España). Para los otros seis países no existe dato equivalente.");
};

/* 8b — simulacion de entrante eficiente */
L.entrante = () => {const s=nueva();
 titulo(s,"Simulación: entrante eficiente","Un banco extranjero con sus propios ratios de balance, enfrentando el precio, el riesgo, el capital y la fiscalidad de cada mercado local");
 s.addShape(pres.ShapeType.roundRect,{x:M, y:1.72, w:W-2*M, h:0.52, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
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
   {text:`Francia pasa del último puesto (${n1(D.pl.roe[2])} %) al cuarto (${n1(D.ent.roe[2])} %) porque su banca local es la más ineficiente de las siete y la más cara en recursos: ahí es donde más vale entrar eficiente. España es justo lo contrario, solo gana 1,2 puntos, porque su banca ya es eficiente y sus recursos ya son baratos —el entrante incluso pagaría más— y sigue arrastrando una densidad de RWA del 59,5 % y el 30 % de impuesto.`, options:{}}],
   {x:M, y:5.95, w:W-2*M, h:0.72, fontFace:BF, fontSize:10, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Escenario, no observación. Se mantienen del mercado local el precio (MIR), la cuña de comisiones supuesta, el coste del riesgo (PD × LGD), la densidad de RWA (Transparency Exercise) y el tipo impositivo de banca. Se sustituyen coste de los recursos, eficiencia y CET1 por los del entrante. No incorpora coste de entrada, escala mínima ni curva de aprendizaje de riesgo.");
};

/* 9 — coste de recursos */
L.recursos = () => {const s=nueva();
 titulo(s,"Coste de los recursos de empresa","Depósitos de sociedades no financieras, ponderados por la mezcla real de saldos · Media 2026 · No es el coste de financiación del sistema: ver la franja inferior");
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
   [p, n1(D.rec.vista[i],2), n1(D.rec.plazo[i],2),
    D.rec.peso_vista[i].toFixed(0)+" %", n1(D.rec.coste[i],2)]));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9.5})};
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10, bold: ci===0});
   if(ci===4) o.bold=true, o.fill={color:LIGHT}, o.color=PRIM;
   return {text:c, options:o};}));
 s.addTable(rows, {x:8.15, y:1.85, w:4.58, colW:[1.28,0.8,0.8,0.86,0.84], rowH:0.365,
   fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 s.addShape(pres.ShapeType.roundRect,{x:8.15, y:4.84, w:4.58, h:0.70, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 {const iMin=D.rec.coste.indexOf(Math.min(...D.rec.coste)),
        iMax=D.rec.coste.indexOf(Math.max(...D.rec.coste));
  s.addText(`La mezcla decide, no el tipo: Italia paga un ${D.rec.vista[3].toFixed(2).replace(".",",")} % a la vista y España un ${D.rec.vista[0].toFixed(2).replace(".",",")} %, pero Italia tiene un ${D.rec.peso_vista[3].toFixed(0)} % en vista y acaba igual de barata. ${P[iMin]} capta los recursos más baratos, ${D.rec.coste[iMin].toFixed(2).replace(".",",")} %, y ${P[iMax]} los más caros, ${D.rec.coste[iMax].toFixed(2).replace(".",",")} %.`,
   {x:8.32, y:4.92, w:4.26, h:0.56, fontFace:BF, fontSize:9, color:TXT, isTextBox:true, margin:0});}

 /* franja inferior: esto NO es el coste de fondos del sistema */
 const S=D.sistema;
 const CL=[["", "Depósitos de empresa · lo que usa el modelo",
               "Depósitos del sistema · empresas y hogares",
               "Diferencia, pb"]];
 const filas=[P].concat([S.empresas.map(v=>v.toFixed(2).replace(".",",")+" %"),
                         S.sistema.map(v=>v.toFixed(2).replace(".",",")+" %"),
                         S.dif_pb.map(v=>v>0?"+"+v:(v<0?"−"+Math.abs(v):"0"))]);
 const band=filas.map((fila,ri)=>[{text: ri===0?"":CL[0][ri],
     options: ri===0 ? Object.assign({},hdr,{align:"left", fontSize:8.5})
                     : cel(null,{align:"left", fontSize:8.5, bold:ri<3,
                                 fill:{color: ri===3?LIGHT:"FFFFFF"}})}]
   .concat(fila.map((c,ci)=>{
     if(ri===0) return {text:c, options:Object.assign({},hdr,{fontSize:8.5})};
     const o=cel(null,{fontSize:9, bold: ri<3, fill:{color: ri===3?LIGHT:"FFFFFF"}});
     if(ri===3){ const v=S.dif_pb[ci]; o.fill={color: v>0?ORA3:(v<0?BLUE3:LIGHT)}; }
     return {text:c, options:o};})));
 s.addTable(band, {x:M, y:5.64, w:W-2*M, colW:[4.13].concat(new Array(7).fill(1.143)),
   rowH:0.24, fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});
 fuente(s,"Fuentes: BCE, dataset MIR (tipos de depósito, nueva producción, serie de vencimiento total) y dataset BSI (saldos, para la ponderación). El coste que usa el modelo es el de los depósitos de SOCIEDADES NO FINANCIERAS (sector 2240), no el coste de financiación del sistema: los depósitos de empresa son solo entre el 22 % y el 34 % del depósito minorista de cada país, y el depósito del sistema tampoco incluye deuda emitida, repos, financiación del banco central ni capital. Facilidad de depósito del BCE al 2,09 %.");
};

/* 10 — coste del riesgo */
L.npl = () => {const s=nueva();
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
};

/* 10b — PD x LGD */
L.riesgo = () => {const s=nueva();
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
};

/* 11b — spread PYME vs gran empresa en PD y LGD */
L.spread_pd_lgd = () => {const s=nueva();
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
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.95, w:W-2*M, h:0.85, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText([{text:"Cautela con el LGD de gran empresa. ", options:{bold:true, color:DARK}},
   {text:"Está agrupado en el 40,0 % en los siete países y en todo el reparto (percentiles 25, 50 y 75), porque es el valor supervisor del IRB básico bajo CRR3, no una estimación propia. La ventaja de severidad de la PYME es real —viene de mayor garantía real— pero está exagerada por ese efecto: en media ponderada la brecha se reduce a la mitad (PYME 23,6–37,9 % frente a gran empresa 35,0–38,8 %). El spread de PD, en cambio, es sólido: la PD sí es estimación propia en ambas clases.",
    options:{color:TXT}}],
   {x:M+0.22, y:5.88, w:11.85, h:0.64, fontFace:BF, fontSize:9.5, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA, anexo de parámetros de riesgo del Risk Dashboard Q1 2026, origen COREP C 9.02. Clases «Corporates – Of Which: SME» y «Corporates – Of Which: Large corporates».");
};

/* 13b — mitigacion del coste del riesgo: donde esta la palanca */
L.palanca = () => {const s=nueva();
 titulo(s,"Mitigar el coste del riesgo: dónde está la palanca","Cuánto cae el coste del riesgo de cada país si iguala la mejor PD o la mejor LGD de las siete · Puntos básicos");
 s.addChart(pres.ChartType.bar, [
   {name:"Con la mejor PD (1,08 %)", labels:P, values:D.riesgo.ahorro_pd.map(v=>-v)},
   {name:"Con la mejor LGD (29,7 %)", labels:P, values:D.riesgo.ahorro_lgd.map(v=>-v)}],
   {x:M, y:1.78, w:7.5, h:3.55, barDir:"col", chartColors:[PRIM,G2],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:DARK, showLegend:true, legendPos:"b", legendFontSize:9,
    catAxisLabelColor:DARK, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0" pb"', valGridLine:{color:LIGHT, size:1},
    catGridLine:{style:"none"}});
 s.addShape(pres.ShapeType.roundRect,{x:8.15, y:1.78, w:4.58, h:2.05, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText("La selección pesa el triple que la recuperación",{x:8.35, y:1.9, w:4.2, h:0.5,
   fontFace:HF, fontSize:12, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Igualar la PD a la mejor de las siete elimina el 75 % de la dispersión del coste del riesgo entre países. Igualar la LGD solo elimina el 22 %.\n\nLa diferencia entre mercados está en a quién se presta, no en cuánto se recupera.",
   {x:8.35, y:2.4, w:4.2, h:1.3, fontFace:BF, fontSize:9.5, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:8.15, y:3.95, w:4.58, h:1.38, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Dónde más margen hay",{x:8.35, y:4.05, w:4.2, h:0.28, fontFace:HF,
   fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Italia −42 pb y Francia −34 pb mejorando selección. España −22 pb. Irlanda y Países Bajos ya están en la frontera: no tienen recorrido por esa vía.",
   {x:8.35, y:4.36, w:4.2, h:0.85, fontFace:BF, fontSize:9, color:G1, isTextBox:true, margin:0});
 s.addText("Matiz importante: esto mide la dispersión ENTRE países, no el recorrido de un banco concreto. Para un prestamista individual la garantía y el aval sí bajan su LGD propia; lo que dice el dato es que las diferencias de mercado vienen de la calidad de la cartera admitida.",
   {x:M, y:5.55, w:W-2*M, h:0.6, fontFace:BF, fontSize:9.5, color:G1, isTextBox:true, margin:0});
 fuente(s,"Cálculo propio sobre los parámetros IRB del EBA (COREP C 9.02), clase «Corporates – Of Which: SME», mediana de entidades, 2026-Q1. La mejor PD es la irlandesa (1,08 %) y la mejor LGD la neerlandesa (29,7 %).");
};

/* 13c — infraestructura de informacion crediticia */
L.infraestructura = () => {const s=nueva();
 titulo(s,"Infraestructura de información crediticia de PYME","Lo que un prestamista puede saber antes de conceder · Evidencia documental, no estadística");
 const I=D.riesgo.infra;
 const L=[["País","Registro público","Umbral","Bureaus privados","Cuentas depositadas","PD PYME"]].concat(
   P.map((p,i)=>[p].concat(I[p]).concat([D.irb_cmp.pd_pyme[i].toFixed(2).replace(".",",")+" %"])));
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"left", fontSize:8.5})};
   const o=cel(null,{align: ci===5?"center":"left", fontSize:8, bold: ci===0});
   if(ci===5){ const v=D.irb_cmp.pd_pyme[ri-1]; o.bold=true;
     o.fill={color: v<1.3?ORA3:(v<1.8?LIGHT:MAG3)}; }
   if(ci===2 && (String(c).indexOf("1.000.000")>=0 || String(c)==="—")) o.color=G1, o.italic=true;
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.78, colW:[1.25,2.05,1.72,2.72,2.72,1.67], rowH:0.44}));
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.2, w:W-2*M, h:1.45, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText("El registro público NO explica la PD observada",{x:M+0.25, y:5.3, w:11.8, h:0.28,
   fontFace:HF, fontSize:12.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Los dos países con el registro público más débil para PYME —Alemania, que solo cubre exposiciones de más de un millón, y Países Bajos, que no tiene registro de empresas— son los que registran la PD más baja junto con Irlanda. Y España, con uno de los umbrales más bajos de Europa (1.000 €), tiene una PD de 1,73 %. Lo que sí acompaña a las PD bajas es la profundidad del bureau privado (Creditreform en Alemania, Graydon en Países Bajos, activo desde 1888) y la disponibilidad real de cuentas depositadas. Francia arrastra un lastre propio: micro y pequeñas empresas pueden declarar sus cuentas confidenciales, de modo que un entrante sin adhesión a I-FIBEN entra a ciegas.",
   {x:M+0.25, y:5.62, w:11.8, h:0.95, fontFace:BF, fontSize:9.5, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuentes: Banco de España (CIRBE), Banca d'Italia (Centrale dei Rischi), Banco de Portugal (CRC), Central Bank of Ireland (Central Credit Register), Deutsche Bundesbank (Millionenkredite), Banque de France (FIBEN). Umbrales vigentes 2026. Correlación sobre siete países: indicativa, no causal.");
};

/* 13d — los dos ejes: informacion (PD) y recobro (LGD) */
L.dos_ejes = () => {const s=nueva();
 titulo(s,"Los dos ejes: información selecciona, recobro recupera",
        "Índice construido sobre Doing Business 2020 y normativa vigente · 100 = el mejor de los siete, no un óptimo absoluto");
 const MP=D.marco;
 /* --- mapa 2x2 --- */
 const X0=M+0.55, Y0=1.80, GW=6.35, GH=4.05;   // area de trazado
 s.addShape(pres.ShapeType.rect,{x:X0, y:Y0, w:GW, h:GH, fill:{color:"FFFFFF"}, line:{color:G3, width:0.75}});
 /* cuadrantes: el bueno arriba a la derecha */
 s.addShape(pres.ShapeType.rect,{x:X0+GW/2, y:Y0, w:GW/2, h:GH/2, fill:{color:ORA3}, line:{color:"FFFFFF", width:0}});
 s.addShape(pres.ShapeType.rect,{x:X0, y:Y0+GH/2, w:GW/2, h:GH/2, fill:{color:LIGHT}, line:{color:"FFFFFF", width:0}});
 s.addShape(pres.ShapeType.line,{x:X0+GW/2, y:Y0, w:0, h:GH, line:{color:G3, width:0.75, dashType:"dash"}});
 s.addShape(pres.ShapeType.line,{x:X0, y:Y0+GH/2, w:GW, h:0, line:{color:G3, width:0.75, dashType:"dash"}});
 /* etiquetas de cuadrante */
 const ql=[[X0+GW/2+0.08, Y0+0.06, "info alta · recobro alto"],
           [X0+0.08,      Y0+0.06, "info baja · recobro alto"],
           [X0+GW/2+0.08, Y0+GH-0.26, "info alta · recobro bajo"],
           [X0+0.08,      Y0+GH-0.26, "info baja · recobro bajo"]];
 ql.forEach(q=>s.addText(q[2],{x:q[0], y:q[1], w:2.9, h:0.2, fontFace:BF, fontSize:7,
   color:G2, italic:true, isTextBox:true, margin:0}));
 /* ejes */
 s.addText("Índice de información para seleccionar  →  gobierna la PD",
   {x:X0, y:Y0+GH+0.08, w:GW, h:0.22, fontFace:BF, fontSize:9, bold:true, color:DARK,
    align:"center", isTextBox:true, margin:0});
 s.addText("Índice de\nentorno de\nrecobro\n↑\ngobierna\nla LGD",
   {x:M-0.06, y:Y0+1.05, w:0.62, h:1.9, fontFace:BF, fontSize:8, bold:true, color:DARK,
    align:"center", isTextBox:true, margin:0, lineSpacingMultiple:0.95});
 /* puntos: tamano por PD observada */
 const px=v=>X0+0.30+(v/100)*(GW-0.60);
 const py=v=>Y0+GH-0.30-(v/100)*(GH-0.60);
 const pdv=D.irb_cmp.pd_pyme;
 /* La etiqueta se coloca a mano por pais: con siete puntos, una regla
    automatica de lado deja chocar Alemania con Países Bajos. */
 const LADO={"España":"I","Alemania":"I","Francia":"D","Italia":"I",
             "Portugal":"D","P. Bajos":"I","Irlanda":"I"};
 const DY  ={"Portugal":-0.14};
 P.forEach((p,i)=>{
   const d=0.30+ (pdv[i]-1.0)*0.30;             // diametro segun PD
   const cx=px(MP.info[i]), cy=py(MP.recobro[i]);
   const col = pdv[i]<1.30?BLUE : (pdv[i]<1.80?ORA2 : MAG);
   s.addShape(pres.ShapeType.ellipse,{x:cx-d/2, y:cy-d/2, w:d, h:d,
     fill:{color:col}, line:{color:DARK, width:0.75}});
   const der = LADO[p]==="D";
   s.addText(p+"  "+pdv[i].toFixed(2).replace(".",",")+" %",
     {x: der? cx+d/2+0.05 : cx-d/2-1.40, y:cy-0.115+(DY[p]||0), w:1.35, h:0.23,
      fontFace:BF, fontSize:8.5, bold:true, color:DARK,
      align: der?"left":"right", isTextBox:true, margin:0});
 });
 s.addText("El área del círculo crece con la PD PYME observada",
   {x:X0, y:Y0+GH+0.30, w:GW, h:0.2, fontFace:BF, fontSize:7.5, color:MUT,
    align:"center", italic:true, isTextBox:true, margin:0});

 /* --- columna derecha --- */
 const CX=7.78, CW=W-M-CX;
 s.addText("Qué predice cada eje",{x:CX, y:1.80, w:CW, h:0.26, fontFace:HF, fontSize:12.5,
   bold:true, color:PRIM, isTextBox:true, margin:0});
 const C=MP.corr;
 const TT=[["", "con la PD", "con la LGD"],
           ["Índice de información", C.info_pd[1].toFixed(2).replace(".",","), C.info_lgd[1].toFixed(2).replace(".",",")],
           ["Índice de recobro", C.rec_pd[1].toFixed(2).replace(".",","), C.rec_lgd[1].toFixed(2).replace(".",",")],
           ["Índice de recobro, sin Portugal", "—", C.rec_lgd_spt[1].toFixed(2).replace(".",",")]];
 const tr=TT.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{fontSize:8, align: ci===0?"left":"center"})};
   const o=cel(null,{fontSize:8.5, align: ci===0?"left":"center", bold: ci>0});
   if(ci>0 && c!=="—"){ const v=Math.abs(parseFloat(c.replace(",",".")));
     o.fill={color: v>=0.55?ORA3 : (v>=0.30?LIGHT:"FFFFFF")}; }
   return {text:c, options:o};}));
 s.addTable(tr, Object.assign(tOpt(),{x:CX, y:2.12, w:CW, colW:[2.35,1.22,1.23], rowH:0.30}));
 s.addText("ρ de Spearman sobre siete países. Signo esperado: negativo en ambas columnas.",
   {x:CX, y:3.42, w:CW, h:0.24, fontFace:BF, fontSize:7.5, color:MUT, italic:true, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.72, w:CW, h:1.28, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("El eje de recobro predice la PD, no la LGD",{x:CX+0.16, y:3.80, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("ρ = −0,79 contra la PD, la relación más fuerte de todo el ejercicio. Donde ejecutar es lento y caro —Italia, 22 % de la masa y 1,8 años; Portugal, 3,0 años— el impago se enquista y compensa. El entorno de recobro no solo fija cuánto se recupera: fija cuántos dejan de pagar.",
   {x:CX+0.16, y:4.06, w:CW-0.32, h:0.86, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:5.08, w:CW, h:1.52, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("La LGD no es contrastable con dato supervisor",{x:CX+0.16, y:5.16, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Al quitar Portugal, la correlación con la LGD cae de −0,32 a −0,03: toda la relación la sostenía un solo país, y su LGD mediana es 40,00 %, que es exactamente el valor supervisor F-IRB del art. 161 CRR3. La misma cifra aparece en la LGD de gran empresa de seis de los siete países. El suelo regulatorio aplasta la dispersión: el mecanismo es sólido, el dato no lo puede medir.",
   {x:CX+0.16, y:5.42, w:CW-0.32, h:1.10, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 fuente(s,"Eje de información: profundidad de la información crediticia (0-8) y cobertura de bureau privado de Doing Business 2020, más dos ordinales propios sobre el umbral del registro público y el régimen de depósito de cuentas. Eje de recobro: fortaleza de los derechos legales del acreedor (0-12), tasa de recuperación, coste sobre la masa y tiempo de resolución, de la misma fuente. Doing Business se descontinuó en 2021 y su vintage es mayo de 2019; B-READY, su sucesor, solo cubre Portugal de los siete. PD y LGD del EBA, COREP C 9.02, 2026-Q1. n=7: indicativo, no causal. La PD de cada país es un resultado revelado y recoge también el apetito de riesgo del mercado, no solo su información y su entorno: ver la lámina siguiente.");
};

/* 13e — se paga el riesgo? apetito frente a precio */
L.apetito = () => {const s=nueva();
 titulo(s,"¿Se paga el riesgo? Entre mercados, no",
        "Si cobrar más compensara prestar peor, el margen neto de riesgo sería plano entre países · Ordenado por PD creciente");
 const A=D.apetito, pdv=D.irb_cmp.pd_pyme;
 /* orden por PD creciente */
 const ord=P.map((p,i)=>i).sort((a,b)=>pdv[a]-pdv[b]);
 const lab=ord.map(i=>P[i]+"\n"+pdv[i].toFixed(2).replace(".",",")+" %");
 s.addChart(pres.ChartType.bar,
   [{name:"Margen neto de riesgo", labels:lab, values:ord.map(i=>A.mnr[i])}],
   {x:M, y:1.82, w:7.25, h:3.55, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10.5,
    dataLabelColor:TXT, dataLabelFormatCode:'0.00"%"', showLegend:false,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:6});
 s.addText("Precio más comisiones, menos coste de los recursos y menos coste del riesgo. Antes de gastos y de capital.",
   {x:M, y:5.42, w:7.25, h:0.22, fontFace:BF, fontSize:8, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.58, w:7.25, h:1.04, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText(`Va al revés: ρ = −${Math.abs(D.apetito.corr.mnr_pd).toFixed(2).replace(".",",")} contra la PD`,{x:M+0.16, y:5.66, w:6.95, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`Irlanda tiene la mejor PD (1,08 %) y el mayor margen neto de riesgo (${n1(A.mnr[6],2)} %); Francia, la segunda peor PD (2,15 %) y el menor (${n1(A.mnr[2],2)} %). La excepción es Italia: peor PD de las siete y aun así el cuarto mejor margen, porque es la que más cobra el gradiente por tamaño. Los siete no están sobre una misma frontera de riesgo y retorno: prestar peor no suele venir pagado.`,
   {x:M+0.16, y:5.92, w:6.95, h:0.66, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 /* --- columna derecha: el gradiente dentro de cada mercado --- */
 const CX=8.18, CW=W-M-CX;
 s.addText("Dentro de cada mercado sí se paga",{x:CX, y:1.82, w:CW, h:0.26,
   fontFace:HF, fontSize:12.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Sobreprecio del tramo pequeño frente al de más de 1 M€ · Puntos básicos",
   {x:CX, y:2.08, w:CW, h:0.22, fontFace:BF, fontSize:8, color:MUT, isTextBox:true, margin:0});
 const og=P.map((p,i)=>i).sort((a,b)=>A.grad_tot[b]-A.grad_tot[a]);
 let gy=2.36;
 const gmax=150;
 og.forEach(i=>{
   const v=A.grad_tot[i], neg=v<0;
   s.addText(P[i],{x:CX, y:gy, w:1.28, h:0.24, fontFace:BF, fontSize:8.5,
     bold:true, color:DARK, valign:"middle", isTextBox:true, margin:0});
   const x0=CX+1.32, bw=Math.max(0.03, Math.abs(v)/gmax*(CW-2.05));
   s.addShape(pres.ShapeType.rect,{x:x0, y:gy+0.045, w:bw, h:0.15,
     fill:{color: neg?MAG3:(v>=100?ORA2:ORA3)}, line:{color: neg?MAG:ORA2, width:0.5}});
   s.addText((v>0?"+":"")+v,{x:CX+CW-0.68, y:gy, w:0.68, h:0.24, fontFace:BF,
     fontSize:8.5, bold:true, color: neg?DARK:DARK, align:"right",
     valign:"middle", isTextBox:true, margin:0});
   gy+=0.30;});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:4.48, w:CW, h:1.00, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("España es la única que no lo cobra",{x:CX+0.16, y:4.56, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`−4 pb: el préstamo pequeño sale marginalmente más barato que el de más de 1 M€. Italia cobra +143 y Países Bajos +120. Y el gradiente acompaña a la rentabilidad: ρ = +${D.apetito.corr.gradtot_roe.toFixed(2).replace(".",",")} con el ROE.`,
   {x:CX+0.16, y:4.80, w:CW-0.32, h:0.62, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:5.58, w:CW, h:1.04, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Qué corrige esto de la lámina anterior",{x:CX+0.16, y:5.66, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("La PD de un país también es apetito revelado, no solo información y entorno, y con dato público no se separan. Lo que el precio sí descarta es que el apetito sea lo dominante: si lo fuera, los de PD alta cobrarían más, y cobran menos.",
   {x:CX+0.16, y:5.92, w:CW-0.32, h:0.66, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 fuente(s,"Precio por tramo del dataset MIR del BCE, media ponderada por volumen de 2026-01 a 2026-07; Alemania no publica volumen de los tramos pequeños, así que su gradiente mezcla media simple y media ponderada. PD del EBA, COREP C 9.02, 2026-Q1, mediana de entidades. La comisión es un supuesto de 87 pb en los otros seis países, que no la publican. El tramo de más de 1 M€ no es solo gran empresa, pero es el proxy más cercano que publica el MIR. n=7: indicativo, no causal.");
};

/* 10c — consumo de capital */
L.capital = () => {const s=nueva();
 titulo(s,"Consumo de capital de la cartera PYME","RWA sobre valor de exposición · EU-wide Transparency Exercise · Junio 2025 · Incorpora ya el factor de apoyo a PYME del art. 501 CRR");
 s.addChart(pres.ChartType.bar, [{name:"Densidad de RWA", labels:P, values:D.capital.densidad}],
   {x:M, y:1.85, w:7.3, h:3.9, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:70});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:1.85, w:4.53, h:2.1, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
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
};

/* 11 — eficiencia, capital, comisiones */
L.eficiencia = () => {const s=nueva();
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
 s.addShape(pres.ShapeType.roundRect,{x:6.85, y:5.1, w:5.88, h:1.5, fill:{color:YEL3},
   rectRadius:0.06, line:{color:YEL2}});
 s.addText("Advertencia sobre estas cifras",{x:7.07, y:5.25, w:5.45, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Son de grupo consolidado. El coste del riesgo español (1,22 %) está inflado por el negocio internacional: CaixaBank, doméstico, reporta 0,24 %. Por eso el modelo no usa esta fila.",
   {x:7.07, y:5.62, w:5.45, h:0.85, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA Risk Dashboard, anexo de datos Q1 2026, indicadores AQT_3.2, PFT_43, PFT_23, PFT_21, SVC_3 y PFT_26.");
};

/* 12 — circulante */
L.circulante = () => {const s=nueva();
 titulo(s,"Circulante: líneas de crédito y descubiertos","Tipo del saldo vivo a empresas · Media 2026 · Serie A2Z1, que excluye deuda de tarjeta");
 s.addChart(pres.ChartType.bar, [{name:"Tipo circulante", labels:P, values:D.circulante}],
   {x:M, y:1.85, w:7.3, h:4.0, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:12, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:11,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0.0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:6});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:1.85, w:4.53, h:1.9, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Hueco: volumen solo en España",{x:8.42, y:2.0, w:4.1, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El BCE publica el tipo de los siete países, pero el volumen solo del agregado de zona euro. El único dato nacional hallado es el del Banco de España: 57.933 M€ de saldo medio en 2026, con un tipo del 3,58 % idéntico al del BCE. Para los otros seis, el peso del circulante en la cartera no es calculable con fuente oficial.",
   {x:8.42, y:2.4, w:4.1, h:1.28, fontFace:BF, fontSize:9.5, color:TXT, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:8.2, y:3.95, w:4.53, h:1.9, fill:{color:LIGHT},
   rectRadius:0.06, line:{color:G3}});
 s.addText("Dos perímetros distintos",{x:8.42, y:4.1, w:4.1, h:0.32, fontFace:HF,
   fontSize:13, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("A2Z1 son revolving y descubiertos. A2Z añade deuda de tarjeta. La diferencia va de 0 a 4 pb, mayor en Francia y zona euro. Se usa A2Z1, que es el perímetro de circulante de empresa.",
   {x:8.42, y:4.5, w:4.1, h:1.25, fontFace:BF, fontSize:11, color:TXT, isTextBox:true, margin:0});
 fuente(s,"Fuente: BCE, dataset MIR, serie A2Z1 (revolving y descubiertos a sociedades no financieras). En revolving y descubiertos el MIR mide el tipo del saldo vivo, no de nueva producción: no existe el concepto de nueva operación. El dato de julio de 2026 es provisional en España, Alemania, Francia, Italia y zona euro. Volumen de España: Banco de España, Boletín Estadístico, cuadro 19.13, serie 1.");
};

/* 13 — hipotecas */
L.hipotecas = () => {const s=nueva();
 titulo(s,"Hipoteca PYME: no existe estadística oficial","El bloque se cubre con exposición a inmueble comercial, que es el proxy disponible");
 s.addShape(pres.ShapeType.roundRect,{x:M, y:1.8, w:W-2*M, h:1.25, fill:{color:MAG3},
   rectRadius:0.06, line:{color:MAG}});
 s.addText("Qué falta y por qué",{x:M+0.25, y:1.93, w:11.8, h:0.3, fontFace:HF,
   fontSize:14, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El dataset MIR del BCE publica préstamos para adquisición de vivienda solo del sector hogares. No hay desglose de préstamo con garantía inmobiliaria a empresas en ninguno de los siete países. El crédito con garantía real a PYME queda subsumido en la serie genérica por tramo de importe, y su precio no es observable por separado.",
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
};

/* 14 — factoring */
L.factoring = () => {const s=nueva();
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
};

/* 14b — comparables */
L.comparables = () => {const s=nueva();
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
};

/* 14c — ROE PYME de la banca espanola */
L.bancos_es = () => {const s=nueva();
 const B=D.bancos, N=B.nombres;
 titulo(s,"ROE PYME de la banca española, banco a banco","Modelizado, no publicado: ningún banco reporta un segmento PYME · Solo cambia entre bancos lo que cada uno sí publica · Junio 2025");
 s.addChart(pres.ChartType.bar, [{name:"ROE PYME modelizado", labels:N, values:B.roe}],
   {x:M, y:1.92, w:7.05, h:2.62, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:11, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:10.5,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:24});
 {const T=[["","Cartera PYME\nen España, M€","Densidad\nRWA PYME","Mora\nPYME","Cobertura\nPYME","PD\nPYME","LGD\nPYME","CoR\nPYME","CET1","Efic.","ROE"]]
   .concat(N.map((b,i)=>[b, B.exposicion[i].toLocaleString("es-ES"),
     n1(B.densidad[i])+" %", n1(B.mora[i],2)+" %", n1(B.cobertura[i])+" %",
     n1(B.pd[i],2)+" %", n1(B.lgd[i])+" %", n1(B.cor[i],2)+" %",
     n1(B.cet1[i],2)+" %", n1(B.eficiencia[i])+" %", n1(B.roe[i])+" %"]));
  const rows=T.map((r,ri)=>r.map((c,ci)=>{
    if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:7})};
    const o=cel(null,{align: ci===0?"left":"center", fontSize:8, bold: ci===0});
    if(ci>=1 && ci<=7) o.fill={color:BLUE3};     // magnitudes de la cartera PYME
    if(ci===10){ o.bold=true; o.fill={color: B.roe[ri-1]>=20?ORA2:(B.roe[ri-1]>=16?ORA3:LIGHT)}; }
    return {text:c, options:o};}));
  s.addTable(rows, Object.assign(tOpt(),{y:4.72, colW:[1.28,1.42,1.20,0.94,1.15,0.94,0.98,0.98,1.02,0.90,1.32], rowH:0.30}));}
 s.addText("En azul, lo que sale de la cartera PYME ESPAÑOLA de cada banco: exposición, densidad, mora, cobertura y, a partir de ellas, PD, LGD y coste del riesgo. CET1 y eficiencia son de grupo consolidado, que es lo único que publica el ejercicio.",
   {x:M, y:6.24, w:W-2*M, h:0.32, fontFace:BF, fontSize:7.5, color:MUT, italic:true, isTextBox:true, margin:0});

 const CX=7.88, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:1.92, w:CW, h:1.24, fill:{color:MAG3},
   rectRadius:0.05, line:{color:MAG}});
 s.addText("El riesgo sí es de PYME; el precio no existe",{x:CX+0.16, y:2.00, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El riesgo ya no es un escalado: PD y LGD se construyen con la mora y la cobertura de la cartera PYME española de cada banco. Lo que sigue sin existir en fuente pública es el PRECIO de PYME por banco, y por eso es común a los cinco.",
   {x:CX+0.16, y:2.26, w:CW-0.32, h:0.84, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});

 s.addText("Qué le falta a cada uno para llegar a " + N[0],
   {x:CX, y:3.30, w:CW, h:0.24, fontFace:HF, fontSize:11.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Puntos de ROE que ganaría igualando cada palanca al mejor de los cinco",
   {x:CX, y:3.54, w:CW, h:0.22, fontFace:BF, fontSize:7.5, color:MUT, isTextBox:true, margin:0});
 {const T2=[["","Riesgo","Capital","Gastos"]].concat(
    N.slice(1).map((b,k)=>{const i=k+1; return [b, sg2(B.pal_riesgo[i]), sg2(B.pal_capital[i]), sg2(B.pal_gastos[i])];}));
  const rows=T2.map((r,ri)=>r.map((c,ci)=>{
    if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:8})};
    const o=cel(null,{align: ci===0?"left":"center", fontSize:8.5, bold: ci===0});
    if(ci>0){ const v=[B.pal_riesgo,B.pal_capital,B.pal_gastos][ci-1][ri];
      o.bold=true; o.fill={color: v>=3?ORA2:(v>0?ORA3:BLUE3)}; }
    return {text:c, options:o};}));
  s.addTable(rows, {x:CX, y:3.80, w:CW, colW:[1.70,1.05,1.05,1.05], rowH:0.27,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});}
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:5.26, w:CW, h:1.20, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("Sabadell y BBVA son el contraste",{x:CX+0.16, y:5.34, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Sabadell tiene la peor eficiencia y aun así queda segundo, por la densidad de RWA más baja (37,3 %). Y Santander compensa la peor mora PYME (7,80 %) con la menor cobertura (36,5 %): más impagos, pero menos provisionados, así que su coste del riesgo acaba en la media.",
   {x:CX+0.16, y:5.60, w:CW-0.32, h:0.78, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Cálculo propio. Cartera PYME, densidad de RWA, mora y provisiones: EBA, EU-wide Transparency Exercise, partidas 2520503 a 2520553 con contraparte de Country = 28 (España), junio de 2025, el dato armonizado más reciente. PD del banco = PD PYME de España por su mora relativa; LGD del banco = LGD PYME de España por su cobertura relativa: el nivel lo ancla el parámetro IRB de PYME de España (COREP C 9.02) y la dispersión entre bancos la fijan sus dos magnitudes de PYME observadas. No es la PD/LGD interna de cada banco, que solo está en su Pilar 3. La cobertura incluye provisiones de fases 1 y 2, así que sirve para comparar entre bancos, no como nivel absoluto de LGD. CET1 y eficiencia son de GRUPO consolidado; igualar la eficiencia de Santander y BBVA a la del mejor movería su ROE 1,0 y 0,2 puntos, así que no altera el orden. Tipo impositivo del 30 % (art. 29 LIS) para los cinco.", 6.5);
};

/* 14d — cuenta de resultados PYME banco a banco */
L.bancos_es_pl = () => {const s=nueva();
 const B=D.bancos, N=B.nombres;
 titulo(s,"Cuenta de resultados del préstamo PYME, banco a banco","En % del saldo medio · Tramo ≤1 M€ · Junio 2025 · El riesgo y el capital salen de la cartera PYME española de cada banco; el precio y las comisiones no existen por banco en ninguna fuente pública");
 const rep=v=>N.map(()=>v);      // magnitud comun a los cinco
 const F=[
  ["Precio (tipo MIR de España)","Común", rep(n1(B.precio,2)), 0],
  ["+ Comisiones","Común", rep(n1(B.comisiones,2)), 1],
  ["= Ingreso total","Común", B.ingreso.map(v=>n1(v,2)), 2],
  ["− Coste de los recursos","Común", rep(n1(B.fondos,2)), 0],
  ["= Margen bruto","Común", B.margen.map(v=>n1(v,2)), 2],
  ["− Coste del riesgo (PD × LGD)","PYME del banco", B.cor.map(v=>n1(v,2)), 3],
  ["− Gastos","Del banco", B.gastos.map(v=>n1(v,2)), 3],
  ["= Resultado antes de imp.","Del banco", B.bai.map(v=>n1(v,2)), 2],
  ["Capital asignado (RWA PYME × CET1)","PYME del banco", B.capital.map(v=>n1(v,2)), 3],
  ["Tipo impositivo","Común", rep(n1(B.tipo,1)+" %"), 0],
  ["ROE","Resultado", B.roe.map(v=>n1(v)+" %"), 4],
  ["Precio necesario para un ROE del 15 %","Resultado", B.precio_eq.map(v=>n1(v,2)), 5]];
 const L2=[["Concepto","Ámbito"].concat(N)].concat(F.map(f=>[f[0],f[1]].concat(f[2])));
 const rows=L2.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:10})};
   const tipo=F[ri-1][3], propio=F[ri-1][1]!=="Común";
   const o=cel(null,{align: ci===0?"left":"center", fontSize:10.5});
   if(ci===1){ o.fontSize=7.5; o.bold=true;
     o.fill={color: propio?BLUE3:LIGHT}; o.color= propio?DARK:G1; return {text:c, options:o}; }
   if(tipo===1) o.fill={color:ORA3}, o.color=DARK;          // supuesto
   if(tipo===2) o.bold=true, o.fill={color:LIGHT}, o.color=PRIM;   // subtotal
   if(tipo===4) o.bold=true, o.fill={color:PRIM}, o.color="FFFFFF";
   if(tipo===5) o.bold=true, o.fill={color:ORA2}, o.color=DARK;
   if(tipo===0 && ci>1) o.color=G1;                          // comun, sin peso
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.70, colW:[3.10,1.20].concat(Array(5).fill(1.566)), rowH:0.325}));
 [["Común a los cinco",LIGHT],["PYME del banco",BLUE3],["Supuesto",ORA3]].forEach((l,i)=>chip(s,M+i*1.62,6.30,l[0],l[1]));
 s.addText("La última fila da la vuelta a la pregunta: con su propio riesgo, capital, gastos y fondeo, qué precio necesitaría cada banco para un ROE del 15 %. Ese número no depende del precio de PYME, que no es obtenible, y mide la capacidad competitiva de cada uno: Bankinter puede vender 119 pb más barato que BBVA y ganar lo mismo.",
   {x:M+5.1, y:5.99, w:7.1, h:0.56, fontFace:BF, fontSize:8, color:MUT, isTextBox:true, margin:0});
 fuente(s,"Precio, comisiones y coste de los recursos: los de España del modelo de países, comunes a los cinco. Coste del riesgo: PD × LGD, con la PD escalada por la mora PYME española del banco y la LGD por su cobertura PYME, las dos observadas. Gastos: eficiencia del banco sobre el margen. Capital: densidad de RWA de su cartera PYME española por su ratio CET1, ambos del EU-wide Transparency Exercise del EBA con contraparte de Country = 28, junio de 2025. Eficiencia y CET1 son de grupo consolidado. Impuesto del 30 % (art. 29 LIS) para los cinco.");
};

/* 15 — supuestos */
L.supuestos = () => {const s=nueva();
 titulo(s,"Supuestos del modelo","Cada uno declarado, con su origen y su efecto · Dos de los iniciales han dejado de ser supuestos");
 const L=[["Supuesto","Valor","Origen","Efecto si cambia"],
  ["% de comisiones","87 pb","Observada en España (TAE − TEDR, tramo ≤1 M€). Aplicada a los otros seis países","ALTO. Mueve el ROE entre 3 y 12 puntos"],
  ["Coste de los recursos",`${n1(Math.min(...D.pl.fondos),2)} % a ${n1(Math.max(...D.pl.fondos),2)} % por país`,"Observado. Tipos del MIR ponderados por saldos del BSI. Supone financiar el crédito PYME con depósito de empresa","ALTO. Con fondeo en mercado al 2,23 % los ROE caerían entre 6 y 12 puntos"],
  ["Coste del riesgo","PD × LGD por país","YA NO ES SUPUESTO. Parámetros IRB de la clase «Corporates – Of Which: SME», mediana de entidades (COREP C 9.02)","—"],
  ["Densidad de RWA","35 % a 61 % por país","YA NO ES SUPUESTO. RWA sobre exposición de la cartera PYME (EBA Transparency Exercise)","—"],
  ["Tipo impositivo","15,0 % a 30,1 %","YA NO ES SUPUESTO. Tipo aplicable a bancos: España 30 % por el art. 29 LIS, Irlanda 15 % por el mínimo de Pilar Dos, resto combinado 2026","—"],
  ["Eficiencia","EBA por país","Observada, pero de grupo consolidado y no de segmento PYME","MEDIO. Penaliza a países con banca universal compleja"],
  ["Disposición del circulante",`${D.circ.u_base} %`,"SUPUESTO. Ni el BCE ni el EBA ni el Banco de España publican límite y dispuesto de las líneas de crédito","MEDIO. Solo pesa si la comisión de disponibilidad se aparta de la neutral"],
  ["Comisión de disponibilidad",`${n1(D.circ.f_base,2)} %`,"SUPUESTO. Ninguna estadística publica comisiones de líneas de crédito, ni siquiera el cuadro 19.6 del Banco de España","ALTO en el circulante. Mueve su ROE entre el 7 % y el 11 %"],
  ["Conversión del disponible",`CCF ${D.circ.ccf} %`,"YA NO ES SUPUESTO. CRR3, compromiso cancelable incondicionalmente. El no cancelable va al 40 %","MEDIO. Al 40 % el ROE del circulante cae entre 1,1 y 2,5 puntos"],
  ["Perímetro del circulante","Todas las empresas","NO ES SUPUESTO, ES UN LÍMITE DE LA FUENTE. La serie A2Z1 del MIR solo existe en categoría total. Riesgo y capital se toman del mismo perímetro para que cierre","ALTO para comparar con el préstamo PYME: no son el mismo negocio"]];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align:"left", fontSize:11})};
   const o=cel(null,{align:"left", fontSize:10, color:TXT});
   if(ci===0) o.bold=true;
   if(ci===3 && c.startsWith("ALTO")) o.color=DARK, o.bold=true, o.fill={color:MAG3};
   return {text:c, options:o};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.72, colW:[2.7,1.75,4.5,3.17], rowH:0.50}));
 fuente(s,"El modelo completo y reproducible está en scripts/modelo_roe.py del repositorio. Cada fila del CSV de salida declara si el valor es observado o supuesto.");
};

/* 19b — conclusiones y recomendaciones */
L.conclusiones = () => {const s=nueva();
 titulo(s,"Conclusiones: el mercado europeo","Lo que sostienen los datos de los siete países");
 const C=[
  ["1","El capital manda sobre el precio",
   "La densidad de RWA va del 35 % en Alemania al 70 % en Irlanda. Esa horquilla separa más el ROE que el precio, que solo va del 3,41 % al 5,37 %. Irlanda lo demuestra: tiene el precio más alto de las siete y la mejor PD, y aun así queda cuarta entre los bancos locales."],
  ["2","El atractivo para un entrante no coincide con la rentabilidad del local",
   `Francia es el peor mercado para su banca (${n1(D.pl.roe[2])} %) y el cuarto mejor para un entrante eficiente (${n1(D.ent.roe[2])} %). Y es además el más grande (${n1(D.eu_desc.cuota[2])} % de la cartera PYME de los siete) y el único donde la brecha de financiación declarada por las empresas se está abriendo. Lo que se compra al entrar no es el margen del mercado, es la distancia respecto al incumbente.`],
  ["3","Países Bajos y Alemania son los objetivos naturales",
   "37,0 % y 35,0 % de ROE para el entrante. Combinan el menor coste del riesgo (0,35 % y 0,40 %) con la menor densidad de RWA (37 % y 35 %) e incumbentes con eficiencia mediocre (53,5 % y 55,2 %)."],
  ["4","El coste del riesgo se controla seleccionando, no recuperando",
   "Igualar la PD a la mejor de las siete elimina el 75 % de la dispersión del coste del riesgo; igualar la LGD solo el 22 %. Y el eje que mejor predice la PD no es la información (ρ = −0,23) sino el entorno de recobro (ρ = −0,79): donde ejecutar es lento y caro, el impago se enquista."],
  ["5","Prestar peor no viene pagado",
   "Entre mercados el margen neto de riesgo cae con la PD (ρ = −0,76): los países que prestan peor son los que menos cobran. Dentro de cada mercado sí se paga, vía tramo de importe, y ahí España es la única de las siete sin gradiente."],
  ["6","La comisión es el único supuesto material que queda",
   "Solo España publica un tipo con comisiones para empresas, y allí vale 87 pb sobre el tramo ≤1 M€. Aplicarla a los demás es una hipótesis. Mueve el ROE entre 3 y 8 puntos."]];
 let y=1.66;
 C.forEach((c,i)=>{
   s.addShape(pres.ShapeType.ellipse,{x:M, y:y+0.04, w:0.36, h:0.36, fill:{color:PRIM}, line:{color:PRIM}});
   s.addText(c[0], {x:M, y:y+0.04, w:0.36, h:0.36, fontFace:HF, fontSize:13, bold:true,
     color:"FFFFFF", align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(c[1], {x:M+0.55, y:y, w:11.6, h:0.3, fontFace:HF, fontSize:12.5, bold:true,
     color:DARK, isTextBox:true, margin:0});
   s.addText(c[2], {x:M+0.55, y:y+0.30, w:11.6, h:0.50, fontFace:BF, fontSize:9,
     color:G1, isTextBox:true, margin:0});
   y+=0.845;});
 fuente(s,"Las conclusiones 1 a 5 se apoyan en datos observados por país; la 6 señala el supuesto que las condiciona. Las correlaciones son sobre siete países: indicativas, no causales. El escenario de entrante no incorpora coste de entrada, escala mínima ni curva de aprendizaje de riesgo.");
};

/* 19b2 — conclusiones del bloque Espana */
L.conclusiones_es = () => {const s=nueva();
 const B=D.bancos, CB=D.cb, CE=D.cesgar;
 titulo(s,"Conclusiones: España","Lo que añade el bloque español, que no se ve en el agregado europeo");
 const C=[
  ["1","El problema no es el acceso, es el precio",
   `El ${n1(CE.concedida,1)} % de las pymes que pide financiación la obtiene y la acepta, y solo al ${n1(CE.denegada,1)} % no se le concede. Entre las que sí ven obstáculos, el primero es el precio (${n1(CE.obstaculos[1][1],1)} %). Un entrante que compita por disponibilidad se equivoca de eje.`],
  ["2","La pyme pequeña tiene 2,1 puntos de colchón, y ese es el techo",
   `Gana un ${n1(CB.roa[0])} % con su activo y paga un ${n1(CB.coste[0])} % por su deuda. Por encima de esa diferencia, endeudarse deja de crearle valor y la demanda se corta sola. La mediana tiene ${n1(CB.dif[1])} puntos: es otro cliente, no el mismo más grande.`],
  ["3","La demanda va al circulante, que es el producto peor medido",
   `El ${n1(CE.destino[0][1],1)} % de las pymes con necesidades lo quiere para circulante, frente al ${n1(CE.circ_2024,1)} % de 2024. De ese producto no existe comisión de disponibilidad ni tasa de disposición en ninguna estadística, y el tipo del BCE ni siquiera tiene tramo de importe.`],
  ["4","Entre bancos españoles manda el capital, no la eficiencia",
   `Sabadell tiene la peor eficiencia de los cinco (${n1(B.eficiencia[1])} %) y queda segundo en ROE, por una densidad de RWA del ${n1(B.densidad[1])} %. BBVA tiene la segunda mejor eficiencia (${n1(B.eficiencia[3])} %) y queda cuarto, con una densidad del ${n1(B.densidad[3])} %. Misma conclusión que en Europa, pero aquí sin diferencias de mercado que la expliquen.`],
  ["5","La capacidad competitiva se mide en precio, no en ROE",
   `Con su propio riesgo, capital y gastos, Bankinter necesita un ${n1(B.precio_eq[0],2)} % para un ROE del 15 % y BBVA un ${n1(B.precio_eq[3],2)} %. Son ${Math.round((B.precio_eq[3]-B.precio_eq[0])*100)} pb de margen de maniobra en precio, que es lo que de verdad se puede usar para ganar cliente.`],
  ["6","El autónomo es un segmento aparte que la estadística esconde",
   `Paga un ${n1(D.autonomos.auto,2)} %, ${D.autonomos.dif_vs_025} pb más que la sociedad del tramo ≤0,25 M€, y el SEC 2010 lo clasifica en hogares, así que no aparece en ninguna serie de empresas. Son 840 M€ al mes de nueva producción.`]];
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
 fuente(s,"Las conclusiones 1 y 3 salen de la encuesta CESGAR y son porcentajes de empresas, no niveles. La 2 sale de la Central de Balances del Banco de España, ejercicio 2024. Las 4 y 5 salen del modelo por banco, cuyo precio y comisiones son comunes a los cinco porque ninguno los publica por segmento: comparan estructura de riesgo, capital y coste, no habilidad comercial.");
};

/* 19c — recomendaciones accionables */
L.recomendaciones = () => {const s=nueva();
 titulo(s,"Recomendaciones: entrada en el mercado europeo","Qué haría falta para convertir el bloque europeo en una decisión");
 const R=[
  ["Priorizar","Países Bajos y Alemania","37,0 % y 35,0 % de ROE simulado. Incumbentes ineficientes, riesgo bajo y capital barato. Son los dos mercados donde el modelo eficiente rinde más."],
  ["Estudiar","Francia e Irlanda","21,8 % y 27,0 %. Francia por la distancia respecto a un incumbente muy ineficiente; Irlanda por el 15 % de impuesto, aunque con la mayor densidad de RWA y una cartera PYME pequeña (16.964 M€)."],
  ["Descartar","España y Portugal","13,7 % y 16,9 %. El diferencial frente al banco local es de 1,2 y 3,0 puntos: no compensa el coste de entrada."],
  ["Validar antes de decidir","La comisión en el mercado objetivo","Es el único supuesto material. Mueve el ROE entre 3 y 8 puntos y solo está observada en España."],
  ["Completar","Densidad de RWA propia","La del modelo es la del mercado. Un entrante con método estándar o con menos garantía real tendría una densidad distinta, y ese es el factor que más pesa."],
  ["Cerrar","Precio del factoring y del confirming","No es obtenible con fuentes públicas gratuitas. Si el producto entra en el plan, hay que ir a registros de pago o a datos de mercado."],
  ["Riesgo: invertir en","Selección, no en recobro","La PD explica el 75 % de la diferencia de coste del riesgo entre países; la LGD solo el 22 %. El presupuesto va a datos de admisión —bureau privado, cuentas depositadas, alta frecuencia— antes que a recuperaciones."],
  ["Riesgo: descontar","La ejecución del mercado, no solo su información","Italia tiene la segunda mejor información de las siete y la peor PD: ejecutar le cuesta el 22 % de la masa y 1,8 años. En Francia, además, micro y pequeñas pueden declarar sus cuentas confidenciales: sin adhesión a I-FIBEN se entra a ciegas."],
  ["Riesgo: cobrar","El gradiente por tamaño","España es la única de las siete donde el préstamo pequeño no sale más caro que el de más de 1 M€: −4 pb, frente a +143 de Italia y +120 de Países Bajos. Y el gradiente acompaña al ROE (ρ = +0,82)."]];
 let y=1.66;
 R.forEach((r,i)=>{
   const rie = i>=6;                       // las tres ultimas son de riesgo
   s.addShape(pres.ShapeType.roundRect,{x:M, y:y, w:2.25, h:0.50, fill:{color: i<3?ORA3:(rie?BLUE3:LIGHT)},
     rectRadius:0.05, line:{color: i<3?ORA2:(rie?BLUE:G3)}});
   s.addText(r[0], {x:M, y:y, w:2.25, h:0.50, fontFace:HF, fontSize:9.5, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(r[1], {x:M+2.45, y:y+0.02, w:3.3, h:0.46, fontFace:HF, fontSize:10, bold:true,
     color:DARK, valign:"middle", isTextBox:true, margin:0});
   s.addText(r[2], {x:M+5.9, y:y+0.02, w:6.25, h:0.46, fontFace:BF, fontSize:8.5,
     color:G1, valign:"middle", isTextBox:true, margin:0});
   y+=0.555;});
 fuente(s,"ROE simulado del entrante con coste de los recursos 0,80 %, eficiencia 40 % y CET1 12,9 %, sobre el precio, riesgo, capital y fiscalidad de cada mercado. No incorpora coste de entrada ni escala mínima. Las tres recomendaciones de riesgo se apoyan en la descomposición PD/LGD de los parámetros IRB del EBA, en los índices institucionales de Doing Business 2020 y en el precio por tramo del dataset MIR del BCE.");
};

/* 16 — lo que no se puede afirmar */
L.limites = () => {const s=nueva(); s.background={color:DARK};
 s.addText("Lo que estos datos no permiten afirmar", {x:M, y:0.55, w:W-2*M, h:0.6,
   fontFace:HF, fontSize:30, bold:true, color:"FFFFFF", isTextBox:true, margin:0});
 s.addText("Cinco límites que conviene tener delante antes de usar cualquier cifra de este deck",
   {x:M, y:1.18, w:W-2*M, h:0.4, fontFace:BF, fontSize:13, color:G2, isTextBox:true, margin:0});
 const lim=[
  ["Rentabilidad comparable entre países","Riesgo y capital de PYME ya son observados por país. Lo que sigue siendo supuesto es la comisión: solo España e Italia publican un tipo con comisiones para empresas, y con perímetros distintos. El ROE comparado es una hipótesis ordenada, no una medición."],
  ["El negocio PYME de cada banco","De nueve bancos analizados, solo dos publican cuenta de resultados de un segmento de empresas con desglose de comisiones, y ninguno aísla PYME. La NIIF 8 obliga a reportar por los segmentos que usa la dirección, y casi ninguno usa «PYME»."],
  ["El precio del factoring y del confirming","No es obtenible con fuentes públicas gratuitas en ninguno de los siete países. Es el único bloque que se cierra sin ningún dato de su objetivo."],
  ["El precio de PYME de cada banco","El Banco de España publica tipos y comisiones por entidad, pero su base legal es la Circular 5/2012, acotada a clientes «personas físicas». La circular que sí cubre a empresas, la 1/2010, publica solo agregado del sistema. Lo que hay por entidad no cubre empresas, y lo que cubre empresas no está por entidad."],
  ["La hipoteca a PYME","No existe como estadística oficial europea. Lo que se muestra es exposición a inmueble comercial, que es otra cosa."]];
 let y=1.74;
 lim.forEach((l,i)=>{
   s.addShape(pres.ShapeType.ellipse,{x:M, y:y+0.04, w:0.38, h:0.38, fill:{color:ACC}, line:{color:ACC}});
   s.addText(String(i+1), {x:M, y:y+0.04, w:0.38, h:0.38, fontFace:HF, fontSize:13.5, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(l[0], {x:M+0.60, y:y, w:11.5, h:0.30, fontFace:HF, fontSize:13.5, bold:true,
     color:"FFFFFF", isTextBox:true, margin:0});
   s.addText(l[1], {x:M+0.60, y:y+0.31, w:11.5, h:0.64, fontFace:BF, fontSize:10,
     color:G3, isTextBox:true, margin:0});
   y+=0.99;});
};

/* 17 — fuentes */
L.fuentes = () => {const s=nueva();
 titulo(s,"Fuentes","Trece fuentes, 39.508 observaciones, cada fila trazable a su serie de origen");
 const L=[["Bloque","Fuente","Cobertura","Último dato"],
  ["Precio y volumen","BCE, ECB Data Portal, dataset MIR","7 países, mensual","2026-07"],
  ["Tipos oficiales","BCE, dataset FM (facilidad de depósito, MRO, Euríbor)","Zona euro, diario","2026-09"],
  ["Encuesta PYME","BCE, SAFE (Q8B y brecha de financiación)","7 países, semestral","Q8B hasta 2022-S1"],
  ["Riesgo, eficiencia, capital","EBA Risk Dashboard y parámetros IRB (COREP C 9.02)","7 países, trimestral","2026-Q1"],
  ["Capital PYME","EBA, EU-wide Transparency Exercise","7 países, semestral","2025-06"],
  ["Comisiones y volumen España","Banco de España, Boletín Estadístico, cap. 19","España, mensual","2026-07"],
  ["TAEG empresas Italia","Banca d'Italia, STACORIS, tavola TRI30951","Italia, trimestral","2026-Q1"],
  ["Spread PYME","OCDE, Financing SMEs and Entrepreneurs","5 países, sin Alemania","2022"],
  ["Factoring","EUF, AEF y Assifact","7 países, anual","2025"],
  ["Marco institucional","Banco Mundial, Doing Business 2020 (descontinuado)","7 países","2019-05"],
  ["Demanda de la PYME","CESGAR, XV Informe de financiación de la pyme","España, anual","2025"],
  ["Capacidad de pago","Banco de España, Central de Balances Integrada","España, por tamaño","2024"],
  ["Comparables","Cuentas de resultados de 5 bancos","5 bancos de 9","2026-H1"]];
 const rows=L.map((r,ri)=>r.map((c,ci)=>{
   if(ri===0) return {text:c, options:Object.assign({},hdr,{align:"left", fontSize:11})};
   return {text:c, options:cel(null,{align:"left", fontSize:10.5, bold: ci===0,
     fill:{color: ri%2 ? "FFFFFF" : LIGHT}})};}));
 s.addTable(rows, Object.assign(tOpt(),{y:1.74, colW:[2.85,4.65,2.8,1.82], rowH:0.33}));
 s.addText("Todos los datos, los extractores y el registro de huecos y decisiones metodológicas están en el repositorio del proyecto, en notas.md.",
   {x:M, y:6.35, w:W-2*M, h:0.4, fontFace:BF, fontSize:11.5, color:TXT, isTextBox:true, margin:0});
};

/* 12b — precio: prestamo frente a circulante */
L.circulante_precio = () => {const s=nueva();
 titulo(s,"Préstamo frente a circulante: el precio","Media 2026 · En revolving el MIR mide el tipo del saldo vivo, no de nueva producción · El circulante no tiene tramo de importe, así que la única comparación de perímetro homólogo es contra el total de empresas");
 const C=D.circ;
 s.addChart(pres.ChartType.bar, [
   {name:"Préstamo PYME (≤1 M€)", labels:P, values:D.tramos["Hasta 1 M EUR"]},
   {name:"Préstamo, total empresas", labels:P, values:C.prestamo_total},
   {name:"Circulante (todas las empresas)", labels:P, values:C.tipo}],
   {x:M, y:1.92, w:8.05, h:3.55, barDir:"col", chartColors:[PRIM,ORA3,BLUE],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9.5,
    catAxisLabelColor:TXT, catAxisLabelFontSize:10, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:6.0});
 s.addText("Diferencia del circulante frente al préstamo del mismo perímetro, en puntos básicos",
   {x:M, y:5.52, w:8.05, h:0.22, fontFace:BF, fontSize:8, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});
 {const L2=[["", "vs préstamo total", "vs préstamo PYME"]].concat(
    P.map((p,i)=>[p, sg(C.dif_tot[i]), sg(C.dif_pyme[i])]));
  const rows=L2.map((r,ri)=>r.map((c,ci)=>{
    if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:8})};
    const o=cel(null,{align: ci===0?"left":"center", fontSize:8.5, bold: ci===0});
    if(ci>0){ const v= ci===1?C.dif_tot[ri-1]:C.dif_pyme[ri-1];
      o.bold=true; o.fill={color: v>0?ORA3:(v<-50?MAG3:LIGHT)}; }
    return {text:c, options:o};}));
  s.addTable(rows, {x:8.82, y:1.92, w:3.91, colW:[1.35,1.33,1.23], rowH:0.30,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});}
 s.addShape(pres.ShapeType.roundRect,{x:8.82, y:4.40, w:3.91, h:1.24, fill:{color:MAG3},
   rectRadius:0.05, line:{color:MAG}});
 s.addText("Cuidado con el perímetro",{x:8.98, y:4.48, w:3.59, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("La serie A2Z1 del BCE solo existe en categoría total: mezcla PYME y gran empresa. Comparar el circulante contra el tramo ≤1 M€ exagera la diferencia allí donde ese tramo pesa poco. En Países Bajos solo es el 7,6 % de la nueva producción, y ahí el salto es de −204 pb contra PYME pero de −100 pb contra el total.",
   {x:8.98, y:4.74, w:3.59, h:0.84, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:8.82, y:5.74, w:3.91, h:0.88, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("No hay una regla",{x:8.98, y:5.82, w:3.59, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("A perímetro homólogo, el circulante es más caro que el préstamo en cuatro países y más barato en tres. Alemania cobra +138 pb por la línea; Países Bajos, −100.",
   {x:8.98, y:6.08, w:3.59, h:0.48, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuente: BCE, dataset MIR. Circulante: serie A2Z1 (revolving y descubiertos a sociedades no financieras), sin tramo de importe, media simple de 2026-01 a 2026-07. Préstamo: medias ponderadas por volumen del mismo periodo. En revolving el MIR mide el tipo del saldo vivo, no de nueva producción: no existe el concepto de nueva operación. Validación cruzada: el Banco de España publica el mismo dato para España (cuadro 19.5, serie 1) y da 3,58 %, idéntico al del BCE.");
};

/* 12c — ROE del circulante */
L.circulante_roe = () => {const s=nueva();
 titulo(s,"ROE del circulante: se cobra por dos sitios, se consume capital por dos","Perímetro: TOTAL DE EMPRESAS, no PYME · Por euro dispuesto · Disposición 60 % y comisión de disponibilidad 0,30 % son SUPUESTOS, no datos · CCF del 10 % del CRR3");
 const C=D.circ;
 s.addChart(pres.ChartType.bar, [
   {name:"ROE del circulante", labels:P, values:C.roe},
   {name:"ROE del préstamo PYME", labels:P, values:D.pl.roe.map(v=>Math.round(v*10)/10)}],
   {x:M, y:1.92, w:7.35, h:3.05, barDir:"col", chartColors:[BLUE,PRIM],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8.5,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9.5,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9.5, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:22});
 s.addText("Las dos barras NO son el mismo negocio ni llevan las mismas comisiones: la izquierda es circulante a todas las empresas y la derecha préstamo a PYME, y el modelo del préstamo aplica 0,87 % de comisiones sobre el saldo mientras que el del circulante no aplica ninguna sobre el dispuesto. Con esa misma carga, el circulante daría "
   + P.map((p,i)=>`${p} ${n1(C.roe_cuna[i])}`).join(" · ") + " %.",
   {x:M, y:4.98, w:7.35, h:0.60, fontFace:BF, fontSize:8, color:G1, isTextBox:true, margin:0});

 /* rejilla de sensibilidad */
 s.addText("Sensibilidad a los dos supuestos · media de los SIETE países",{x:M, y:5.58, w:7.35, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText(`La fila de ${n1(C.f_base,2)} % sale plana porque cae casi sobre la media de las siete comisiones neutrales (${n1(C.f_neutral_media,2)} %). No es la neutral de ningún país: van del ${n1(Math.min(...C.f_neutral),2)} % de Países Bajos al ${n1(Math.max(...C.f_neutral),2)} % de Irlanda.`,
   {x:M, y:5.82, w:7.35, h:0.24, fontFace:BF, fontSize:7.5, color:MUT, italic:true, isTextBox:true, margin:0});
 {const g=C.grid, fs=Object.keys(g);
  const cab=[{text:"comisión \\ disposición", options:Object.assign({},hdr,{align:"left", fontSize:7.5})}]
    .concat(C.u_grid.map(u=>({text:u+" %", options:Object.assign({},hdr,{fontSize:7.5})})));
  const rows=[cab].concat(fs.map(f=>[{text:n1(parseFloat(f),2)+" %",
      options:cel(null,{align:"left", fontSize:8, bold:true})}]
    .concat(g[f].map(v=>{
      const o=cel(null,{fontSize:8, bold:true});
      o.fill={color: v>=10?ORA2:(v>=8.5?ORA3:LIGHT)};
      return {text:n1(v)+" %", options:o};}))));
  s.addTable(rows, {x:M, y:6.08, w:7.35, colW:[2.10].concat(new Array(6).fill(0.875)),
    rowH:0.185, fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});}

 /* columna derecha */
 const CX=8.15, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:1.92, w:CW, h:1.12, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Cómo se cobra y cómo consume",{x:CX+0.16, y:2.00, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Ingreso = tipo sobre el DISPUESTO + comisión sobre el DISPONIBLE.\nExposición = dispuesto + CCF × disponible.\nSolo se fondea lo dispuesto; riesgo y capital van sobre la exposición.",
   {x:CX+0.16, y:2.26, w:CW-0.32, h:0.72, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.14, w:CW, h:1.30, fill:{color:MAG3},
   rectRadius:0.05, line:{color:MAG}});
 s.addText("Esto no es PYME: es total de empresas",{x:CX+0.16, y:3.22, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El MIR no publica el circulante por tramo de importe, así que riesgo y capital se toman también del total de empresas para que el perímetro cierre: densidad de RWA del "
   + n1(C.dens_emp[0]) + " % frente al " + n1(C.dens_pyme[0]) + " % de la cartera PYME en España. Con los parámetros de PYME el ROE se movería hasta 3 puntos ("
   + P.map((p,i)=>`${p} ${n1(C.roe_par_pyme[i])}`).join(" · ") + " %), pero eso mezclaría perímetros.",
   {x:CX+0.16, y:3.48, w:CW-0.32, h:0.90, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:4.54, w:CW, h:1.24, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("La comisión neutral es el CCF por el margen",{x:CX+0.16, y:4.62, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Imponiendo que el ROE no dependa de la disposición sale f = CCF × (tipo − coste de los recursos). Por debajo de esa comisión, una línea poco dispuesta destruye ROE; por encima, lo crea. Va de "
   + n1(Math.min(...C.f_neutral),2) + " % en Países Bajos a " + n1(Math.max(...C.f_neutral),2) + " % en Irlanda.",
   {x:CX+0.16, y:4.88, w:CW-0.32, h:0.84, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:CX, y:5.88, w:CW, h:0.74, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Dos huecos duros y un cambio regulatorio",{x:CX+0.16, y:5.94, w:CW-0.32, h:0.22,
   fontFace:HF, fontSize:11, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Ni la comisión de disponibilidad ni la disposición las publica nadie. Y el CRR3 subió del 0 % al 10 % el factor de conversión del compromiso cancelable: al 40 % el ROE cae entre 1,1 y 2,5 puntos.",
   {x:CX+0.16, y:6.16, w:CW-0.32, h:0.42, fontFace:BF, fontSize:8, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Cálculo propio. Tipo del circulante del MIR (A2Z1, total de sociedades no financieras); coste del riesgo = PD × LGD de la clase IRB «Empresas, total» y densidad de RWA de la clase de exposición «Corporates» del Transparency Exercise, ambos del mismo perímetro que el precio; coste de los recursos, CET1, eficiencia y tipo impositivo, los mismos que usa el modelo del préstamo. La disposición y la comisión de disponibilidad son supuestos declarados: la rejilla muestra el efecto de moverlos, y promedia los siete países, de modo que ninguna de sus filas corresponde a la comisión neutral de un país concreto. El coste del riesgo se aplica sobre la exposición, no solo sobre el dispuesto, que es como lo trata la NIIF 9 en compromisos.");
};

/* ES — demanda: que pide la pyme espanola */
L.es_demanda = () => {const s=nueva();
 const C=D.cesgar;
 titulo(s,"Qué pide la pyme española y qué le duele","Encuesta CESGAR a pymes · Resultados de 2025 · Porcentajes de EMPRESAS, no niveles de tipo ni volúmenes");
 s.addChart(pres.ChartType.bar, [{name:"% de pymes con necesidades", labels:C.destino.map(d=>d[0]), values:C.destino.map(d=>d[1])}],
   {x:M, y:1.98, w:6.05, h:2.30, barDir:"bar", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:10,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:80});
 s.addText("Destino de la financiación",{x:M, y:1.72, w:6.05, h:0.24, fontFace:HF,
   fontSize:11.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Obstáculos encontrados",{x:6.85, y:1.72, w:6.08, h:0.24, fontFace:HF,
   fontSize:11.5, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addChart(pres.ChartType.bar, [{name:"% de pymes", labels:C.obstaculos.map(d=>d[0]), values:C.obstaculos.map(d=>d[1])}],
   {x:6.85, y:1.98, w:6.08, h:2.30, barDir:"bar", chartColors:[BLUE], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:9,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:55});

 const kpi=[["Tuvo necesidad de financiar", n1(C.necesidad,1)+" %","de las pymes españolas en 2025"],
            ["Acudió al banco", n1(C.bancarizacion[2],1)+" %","bajando desde "+n1(C.bancarizacion[1],1)+" % en 2024"],
            ["Obtuvo y aceptó", n1(C.concedida,1)+" %","máximo de los últimos tres años"],
            ["No se le concedió", n1(C.denegada,1)+" %","más un "+n1(C.rechazada,1)+" % que rechazó las condiciones"]];
 let x=M;
 kpi.forEach(k=>{
   s.addShape(pres.ShapeType.roundRect,{x:x, y:4.50, w:2.95, h:1.02, fill:{color:LIGHT},
     rectRadius:0.05, line:{color:G3}});
   s.addText(k[1],{x:x+0.14, y:4.56, w:2.67, h:0.36, fontFace:HF, fontSize:19, bold:true,
     color:PRIM, isTextBox:true, margin:0});
   s.addText(k[0],{x:x+0.14, y:4.94, w:2.67, h:0.20, fontFace:HF, fontSize:9.5, bold:true,
     color:DARK, isTextBox:true, margin:0});
   s.addText(k[2],{x:x+0.14, y:5.15, w:2.67, h:0.32, fontFace:BF, fontSize:8,
     color:G1, isTextBox:true, margin:0});
   x+=3.11;});

 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.66, w:W-2*M, h:0.96, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("El precio es el obstáculo, y el destino es el circulante",{x:M+0.16, y:5.74, w:11.8, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`El ${n1(C.destino[0][1],1)} % de las pymes que necesitan financiación la quiere para circulante, frente al ${n1(C.circ_2024,1)} % de 2024: es el uso que más crece y el producto cuyo precio peor se conoce. Entre las que sí ven obstáculos, el primero es el precio (${n1(C.obstaculos[1][1],1)} %), muy por delante de la falta de comprensión del negocio por la entidad (${n1(C.obstaculos[2][1],1)} %). El crédito se concede: el problema no es el acceso, es a cuánto.`,
   {x:M+0.16, y:6.00, w:11.8, h:0.56, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuente: CESGAR, XV Informe «La financiación de la pyme en España», resultados anuales de 2025, elaborado con Abay Analistas Económicos. Gráficos 9, 10, 13, 17 y 18. Son porcentajes de empresas encuestadas: no deben agregarse ni compararse con los niveles de tipo del MIR ni con volúmenes. Los porcentajes de destino y de uso de productos no suman 100 porque una misma empresa puede señalar varios.");
};

/* ES — capacidad de pago: Central de Balances */
L.es_capacidad = () => {const s=nueva();
 const C=D.cb;
 titulo(s,"Cuánto puede pagar una pyme: el techo del precio","Central de Balances del Banco de España · Ejercicio "+C.anio+" · Clasificación por tamaño de la Recomendación 2003/361/CE");
 s.addChart(pres.ChartType.bar, [
   {name:"Rentabilidad del activo neto", labels:C.tam, values:C.roa},
   {name:"Tipo efectivo pagado por su deuda", labels:C.tam, values:C.coste}],
   {x:M, y:1.98, w:6.95, h:3.10, barDir:"col", chartColors:[PRIM,BLUE],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9.5,
    catAxisLabelColor:TXT, catAxisLabelFontSize:10.5, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:12});
 {const L2=[["","Pequeñas","Medianas","Grandes"],
   ["Rentabilidad del activo (R.1)"].concat(C.roa.map(v=>n1(v)+" %")),
   ["Tipo pagado por la deuda (R.2)"].concat(C.coste.map(v=>n1(v)+" %")),
   ["Colchón, R.1 − R.2 (R.4)"].concat(C.dif.map(v=>"+"+n1(v)+" pp")),
   ["Rentabilidad de recursos propios (R.3)"].concat(C.roe.map(v=>n1(v)+" %")),
   ["Margen de explotación (R.5)"].concat(C.margen.map(v=>n1(v)+" %"))];
  const rows=L2.map((r,ri)=>r.map((c,ci)=>{
    if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9.5})};
    const o=cel(null,{align: ci===0?"left":"center", fontSize:10, bold: ci===0});
    if(ri===3) o.bold=true, o.fill={color:ORA3}, o.color=DARK;
    return {text:c, options:o};}));
  s.addTable(rows, {x:M, y:5.22, w:6.95, colW:[3.05,1.30,1.30,1.30], rowH:0.27,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});}

 const CX=7.75, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:1.98, w:CW, h:1.58, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("La pequeña tiene 2,1 puntos de colchón",{x:CX+0.16, y:2.06, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`Gana un ${n1(C.roa[0])} % con su activo y paga un ${n1(C.coste[0])} % por su deuda. Ese margen de ${n1(C.dif[0])} puntos es el techo: si el precio del crédito sube por encima, endeudarse deja de crear valor para el cliente y la demanda se corta sola. La mediana tiene ${n1(C.dif[1])} puntos, casi el triple de recorrido.`,
   {x:CX+0.16, y:2.32, w:CW-0.32, h:1.16, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.66, w:CW, h:1.42, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("Y valida el precio por otra vía",{x:CX+0.16, y:3.74, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`El ${n1(C.coste[0])} % que paga la empresa pequeña es muy cercano al ${n1(D.pl.precio[0],2)} % del tramo ≤1 M€ del MIR que usa el modelo. No son lo mismo —el MIR es nueva producción y esto es el coste medio del saldo vivo— pero que dos fuentes independientes den lo mismo es la mejor validación que tiene el deck.`,
   {x:CX+0.16, y:4.00, w:CW-0.32, h:1.00, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:5.18, w:CW, h:1.44, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Lo que no encaja",{x:CX+0.16, y:5.26, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`La pequeña paga MENOS que la mediana (${n1(C.coste[0])} % frente a ${n1(C.coste[1])} %), al revés de lo que dice el riesgo. La Central de Balances no lo explica; las hipótesis razonables son más peso de deuda antigua a tipo fijo y más financiación ICO o avalada. Queda como observación, no como conclusión.`,
   {x:CX+0.16, y:5.52, w:CW-0.32, h:1.02, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuente: Banco de España, Central de Balances Integrada, conjunto cal_ucb_cbl002, ratios R.1 a R.5 del ejercicio "+C.anio+". Más de un millón de empresas. R.2 es el tipo efectivamente pagado sobre el saldo de recursos ajenos con coste, no el de nueva producción. El colchón de la empresa pequeña ha ido de −0,2 puntos en 2015 a "+n1(C.dif[0])+" en "+C.anio+".");
};

/* ES — tamano del mercado y cuota */
L.es_mercado = () => {const s=nueva();
 const B=D.bancos, N=B.nombres;
 const tot=B.exposicion.reduce((a,b)=>a+b,0);
 const cuota=B.exposicion.map(v=>Math.round(v/tot*1000)/10);
 titulo(s,"El mercado: 142.000 M€ de cartera PYME entre los cinco","Exposición a PYME con contraparte española · EU-wide Transparency Exercise del EBA · Junio 2025");
 s.addChart(pres.ChartType.bar, [{name:"Cartera PYME en España", labels:N, values:B.exposicion}],
   {x:M, y:1.98, w:7.10, h:3.05, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:10.5, dataLabelColor:TXT,
    dataLabelFormatCode:'#,##0', showLegend:false, catAxisLabelColor:TXT,
    catAxisLabelFontSize:10.5, valAxisLabelColor:MUT, valAxisLabelFormatCode:'#,##0',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});
 s.addText("Millones de euros de valor de exposición",{x:M, y:5.06, w:7.10, h:0.22,
   fontFace:BF, fontSize:8, color:MUT, italic:true, align:"center", isTextBox:true, margin:0});
 {const L2=[["Banco","Cartera PYME, M€","Cuota entre los cinco","Densidad de RWA","RWA, M€"]]
   .concat(N.map((b,i)=>[b, B.exposicion[i].toLocaleString("es-ES"), n1(cuota[i])+" %",
     n1(B.densidad[i])+" %", Math.round(B.exposicion[i]*B.densidad[i]/100).toLocaleString("es-ES")]));
  const rows=L2.map((r,ri)=>r.map((c,ci)=>{
    if(ri===0) return {text:c, options:Object.assign({},hdr,{align: ci===0?"left":"center", fontSize:9})};
    const o=cel(null,{align: ci===0?"left":"center", fontSize:10, bold: ci===0});
    if(ci===2){ o.bold=true; o.fill={color: cuota[ri-1]>=30?ORA2:(cuota[ri-1]>=17?ORA3:LIGHT)}; }
    return {text:c, options:o};}));
  s.addTable(rows, {x:7.98, y:1.98, w:4.75, colW:[1.15,1.15,1.20,1.05,1.20], rowH:0.42,
    fontFace:BF, border:{pt:0.5,color:G3}, valign:"middle", autoPage:false});}
 s.addShape(pres.ShapeType.roundRect,{x:7.98, y:4.62, w:4.75, h:1.14, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("Concentración moderada",{x:8.14, y:4.70, w:4.43, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`CaixaBank tiene el ${n1(cuota[2])} % de la cartera PYME de los cinco, más que Santander y BBVA juntos en este segmento, pese a ser menor que ambos por balance total. El negocio PYME español no se reparte como el balance.`,
   {x:8.14, y:4.96, w:4.43, h:0.72, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.42, w:7.10, h:1.20, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("Es el perímetro que se puede medir, no todo el mercado",{x:M+0.16, y:5.50, w:6.78, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Son los cinco bancos del ejercicio de transparencia con cartera PYME española relevante. Fuera quedan las entidades no supervisadas directamente, las cooperativas de crédito, los EFC y la financiación no bancaria, que según CESGAR pesa: el crédito de proveedores lo usa el 16 % de las pymes.",
   {x:M+0.16, y:5.76, w:6.78, h:0.78, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuente: EBA, EU-wide Transparency Exercise, partida 2520523 (valor de exposición de PYME) y 2520533 (RWA), con contraparte de Country = 28 (España), junio de 2025. La clase PYME agrega Corporates-SME, Retail-SME y Secured by mortgages-SME. La cuota es sobre el total de estos cinco bancos, no sobre el mercado español de crédito a PYME, que es mayor.");
};

/* ES — mora y cobertura, serie trimestral */
L.es_riesgo_serie = () => {const s=nueva();
 const S=D.bancos_serie, N=D.bancos.nombres;
 const col={Bankinter:PRIM, Sabadell:BLUE, CaixaBank:ORA2, BBVA:G2, Santander:MAG};
 titulo(s,"Mora y cobertura de la cartera PYME española, trimestre a trimestre","El nivel de un trimestre dice poco; la tendencia dice bastante más · EU-wide Transparency Exercise del EBA");
 s.addChart(pres.ChartType.line, N.map(b=>({name:b, labels:S.periodos, values:S.mora[b]})),
   {x:M, y:2.00, w:6.05, h:3.15, chartColors:N.map(b=>col[b]), showTitle:false,
    showValue:false, showLegend:true, legendPos:"b", legendFontSize:9,
    lineSize:2.5, lineSmooth:false, catAxisLabelColor:TXT, catAxisLabelFontSize:9,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"},
    valAxisMinVal:2, valAxisMaxVal:9});
 s.addText("Mora: exposición en default sobre exposición original",{x:M, y:1.74, w:6.05, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Cobertura: provisiones sobre exposición en default",{x:6.85, y:1.74, w:6.08, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addChart(pres.ChartType.line, N.map(b=>({name:b, labels:S.periodos, values:S.cob[b]})),
   {x:6.85, y:2.00, w:6.08, h:3.15, chartColors:N.map(b=>col[b]), showTitle:false,
    showValue:false, showLegend:true, legendPos:"b", legendFontSize:9,
    lineSize:2.5, lineSmooth:false, catAxisLabelColor:TXT, catAxisLabelFontSize:9,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"},
    valAxisMinVal:30, valAxisMaxVal:80});
 const cajas=[
  ["Sabadell limpia, y se nota", BLUE3, BLUE,
   `Su mora PYME baja de ${n1(S.mora.Sabadell[0],2)} % a ${n1(S.mora.Sabadell[3],2)} % en cuatro trimestres, la mejora más clara de los cinco, y además sube cobertura. Es coherente con su densidad de RWA, la más baja del grupo.`],
  ["Santander provisiona cada vez menos", MAG3, MAG,
   `Su cobertura cae de ${n1(S.cob.Santander[0],1)} % a ${n1(S.cob.Santander[3],1)} % mientras mantiene la peor mora. Puede ser cartera más garantizada o puede ser infraprovisión: con dato público no se distingue, y conviene mirarlo.`],
  ["Ojo con el último dato de Bankinter", ORA3, ORA2,
   `Su cobertura salta a ${n1(S.cob.Bankinter[3],1)} % desde una banda de ${n1(S.cob.Bankinter[1],1)}–${n1(S.cob.Bankinter[0],1)} %. El modelo de las láminas siguientes usa ese trimestre, así que su LGD sale alta; con la media de los cuatro su ROE saldría algo mejor, no peor.`]];
 let x=M;
 cajas.forEach(c=>{
   s.addShape(pres.ShapeType.roundRect,{x:x, y:5.34, w:3.98, h:1.28, fill:{color:c[1]},
     rectRadius:0.05, line:{color:c[2]}});
   s.addText(c[0],{x:x+0.14, y:5.42, w:3.70, h:0.24, fontFace:HF, fontSize:10.5,
     bold:true, color:DARK, isTextBox:true, margin:0});
   s.addText(c[3],{x:x+0.14, y:5.68, w:3.70, h:0.88, fontFace:BF, fontSize:8,
     color:DARK, isTextBox:true, margin:0});
   x+=4.16;});
 fuente(s,"Fuente: EBA, EU-wide Transparency Exercise, partidas 2520503, 2520513 y 2520553 con contraparte de Country = 28 (España). La mora es un ratio de stock, no una PD de flujo. La cobertura incluye provisiones de las fases 1 y 2, así que sobreestima la cobertura del default en sí; el sesgo es el mismo para los cinco, de modo que sirve para comparar entre bancos y no como nivel absoluto.");
};

/* ES — circulante en Espana */
L.es_circulante = () => {const s=nueva();
 const C=D.circ, CE=D.cesgar;
 titulo(s,"El circulante en España: el producto más pedido y el peor medido","Serie A2Z1 del BCE validada contra el Boletín del Banco de España · Media 2026");
 const kpi=[["3,58 %","Tipo del circulante","BCE y Banco de España dan el mismo dato"],
            ["57.933 M€","Saldo vivo en España","único volumen por país que existe"],
            [n1(CE.destino[0][1],1)+" %","De las pymes lo pide","para circulante, frente al "+n1(CE.circ_2024,1)+" % de 2024"],
            [n1(CE.productos[0][1],0)+" %","Usa línea de crédito","el instrumento más utilizado, junto al préstamo"]];
 let x=M;
 kpi.forEach(k=>{
   s.addShape(pres.ShapeType.roundRect,{x:x, y:1.90, w:2.95, h:1.08, fill:{color:LIGHT},
     rectRadius:0.05, line:{color:G3}});
   s.addText(k[0],{x:x+0.14, y:1.96, w:2.67, h:0.40, fontFace:HF, fontSize:20, bold:true,
     color:PRIM, isTextBox:true, margin:0});
   s.addText(k[1],{x:x+0.14, y:2.38, w:2.67, h:0.20, fontFace:HF, fontSize:9.5, bold:true,
     color:DARK, isTextBox:true, margin:0});
   s.addText(k[2],{x:x+0.14, y:2.59, w:2.67, h:0.34, fontFace:BF, fontSize:8,
     color:G1, isTextBox:true, margin:0});
   x+=3.11;});
 s.addChart(pres.ChartType.bar, [
   {name:"Préstamo, total empresas", labels:P, values:C.prestamo_total},
   {name:"Circulante", labels:P, values:C.tipo}],
   {x:M, y:3.20, w:7.20, h:2.42, barDir:"col", chartColors:[ORA3,PRIM],
    showTitle:false, showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:8,
    dataLabelColor:TXT, showLegend:true, legendPos:"b", legendFontSize:9,
    catAxisLabelColor:TXT, catAxisLabelFontSize:9, valAxisLabelColor:MUT,
    valAxisLabelFormatCode:'0.0"%"', valGridLine:{color:"E3E9EB", size:1},
    catGridLine:{style:"none"}, valAxisMaxVal:6});
 s.addText("España es de los pocos donde el circulante se cobra por encima del préstamo, y solo por 16 pb",
   {x:M, y:5.64, w:7.20, h:0.22, fontFace:BF, fontSize:8, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});
 const CX=8.05, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.20, w:CW, h:1.62, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("La demanda va donde el dato no llega",{x:CX+0.16, y:3.28, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`Tres de cada cuatro pymes que necesitan financiación la quieren para circulante, y es el destino que más crece. Pero de este producto no existe ni comisión de disponibilidad ni tasa de disposición en ninguna estadística, y el tipo que publica el BCE no tiene tramo de importe: mezcla la póliza de la pyme con la línea del corporativo.`,
   {x:CX+0.16, y:3.54, w:CW-0.32, h:1.20, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:4.94, w:CW, h:1.68, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("Validación cruzada del precio",{x:CX+0.16, y:5.02, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("El Boletín del Banco de España publica el mismo dato por vía nacional, cuadro 19.5 serie 1, y da 3,58 %: idéntico al del BCE. Es la única serie del deck que se ha podido contrastar contra una fuente independiente, y cuadra. El volumen, 57.933 M€ de saldo medio, solo lo publica España.",
   {x:CX+0.16, y:5.28, w:CW-0.32, h:1.26, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuentes: BCE, dataset MIR, serie A2Z1 (revolving y descubiertos a sociedades no financieras), media 2026; Banco de España, Boletín Estadístico, cuadros 19.5 y 19.13, serie 1; CESGAR, XV Informe, gráficos 9 y 13. En revolving el MIR mide el tipo del saldo vivo, no de nueva producción. Los porcentajes de CESGAR son de empresas encuestadas y no se agregan con los tipos.");
};

/* ES — factoring y confirming en Espana */
L.es_factoring = () => {const s=nueva();
 const F=D.factoring, CE=D.cesgar;
 titulo(s,"Factoring y confirming: España es un caso aparte en Europa","Volumen anual sobre PIB · European Union Federation for Factoring · 2025");
 s.addChart(pres.ChartType.bar, [{name:"Volumen sobre PIB", labels:P, values:F.pib}],
   {x:M, y:1.98, w:7.10, h:3.00, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:11, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:10.5,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}, valAxisMaxVal:24});
 s.addText("España mueve 269.885 M€ al año, el 16,5 % del PIB: el segundo de los siete por intensidad, detrás de Portugal",
   {x:M, y:5.02, w:7.10, h:0.22, fontFace:BF, fontSize:8, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});
 const CX=7.98, CW=W-M-CX;
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:1.98, w:CW, h:1.72, fill:{color:MAG3},
   rectRadius:0.05, line:{color:MAG}});
 s.addText("El 52,6 % español es confirming",{x:CX+0.16, y:2.06, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("En Italia es el 1,9 %. España y Portugal son los dos mercados europeos donde el pago confirmado a proveedores domina sobre el factoring clásico. Por eso los totales de la federación europea NO son comparables entre países: se está sumando un producto de financiación de clientes con otro de pago a proveedores.",
   {x:CX+0.16, y:2.32, w:CW-0.32, h:1.30, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:CX, y:3.82, w:CW, h:1.46, fill:{color:LIGHT},
   rectRadius:0.05, line:{color:G3}});
 s.addText("Y la pyme lo usa poco",{x:CX+0.16, y:3.90, w:CW-0.32, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`CESGAR lo sitúa por debajo del leasing (${n1(CE.productos[4][1],0)} %) y de las líneas ICO (${n1(CE.productos[3][1],0)} %) en penetración entre pymes. El volumen agregado es grande porque lo mueven las grandes empresas y sus cadenas de proveedores, no porque la pyme lo contrate.`,
   {x:CX+0.16, y:4.16, w:CW-0.32, h:1.04, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.34, w:W-2*M, h:1.28, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("Volumen sí, precio no: es el único bloque del encargo que se cierra sin ningún dato de su objetivo",
   {x:M+0.16, y:5.42, w:11.8, h:0.24, fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText("Ni el BCE, ni el Banco de España, ni la federación europea, ni las asociaciones nacionales publican un precio del factoring o del confirming. Se buscó en las nueve fuentes del encargo y en las memorias de Santander Factoring y Confirming, BNP Paribas Factor y Eurofactor. El precio de estos productos solo existe en registros de pago o en datos de mercado, y por tanto no entra en el modelo de rentabilidad: cualquier ROE de factoring de este deck sería inventado.",
   {x:M+0.16, y:5.68, w:11.8, h:0.86, fontFace:BF, fontSize:9, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuentes: EU Federation for Factoring and Commercial Finance y asociaciones nacionales (AEF en España, Assifact en Italia); CESGAR, XV Informe, gráfico 9. El reparto entre factoring y confirming procede de las asociaciones nacionales y no está armonizado.");
};

/* EU — descriptiva: tamano del mercado y brecha de financiacion */
L.eu_mercado = () => {const s=nueva();
 const E=D.eu_desc;
 titulo(s,"El mercado: Francia es la mitad, Irlanda es el 0,8 %","Exposición a PYME de la banca supervisada en cada país y VARIACIÓN de la brecha de financiación declarada por las propias empresas");
 s.addChart(pres.ChartType.bar, [{name:"Cartera PYME", labels:P, values:E.exposicion}],
   {x:M, y:1.98, w:6.10, h:2.90, barDir:"col", chartColors:[PRIM], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:9, dataLabelColor:TXT,
    dataLabelFormatCode:'#,##0', showLegend:false, catAxisLabelColor:TXT,
    catAxisLabelFontSize:9.5, valAxisLabelColor:MUT, valAxisLabelFormatCode:'#,##0',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"}});
 s.addText("Cartera PYME, millones de euros",{x:M, y:1.72, w:6.10, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addText("Variación de la brecha de financiación, "+E.periodo,{x:6.90, y:1.72, w:6.03, h:0.24,
   fontFace:HF, fontSize:11, bold:true, color:PRIM, isTextBox:true, margin:0});
 s.addChart(pres.ChartType.bar, [{name:"Brecha", labels:P, values:E.gap}],
   {x:6.90, y:1.98, w:6.03, h:2.90, barDir:"col", chartColors:[BLUE], showTitle:false,
    showValue:true, dataLabelPosition:"outEnd", dataLabelFontSize:9.5, dataLabelColor:TXT,
    showLegend:false, catAxisLabelColor:TXT, catAxisLabelFontSize:9.5,
    valAxisLabelColor:MUT, valAxisLabelFormatCode:'0"%"',
    valGridLine:{color:"E3E9EB", size:1}, catGridLine:{style:"none"},
    valAxisMinVal:-12, valAxisMaxVal:14});
 s.addText("Indicador de CAMBIO, no de nivel. Por empresa y para cada uno de cinco instrumentos vale +1 si sube la necesidad y baja la disponibilidad, −1 al revés, ±0,5 si solo se mueve un lado y 0 si no cambia nada. Positivo = la brecha se ABRE.",
   {x:6.90, y:4.90, w:6.03, h:0.42, fontFace:BF, fontSize:7, color:MUT, italic:true,
    align:"left", isTextBox:true, margin:0});
 s.addText("Los siete suman 2,14 billones de euros. Francia sola es el "+n1(E.cuota[2])+" %.",
   {x:M, y:4.92, w:6.10, h:0.24, fontFace:BF, fontSize:8, color:MUT, italic:true,
    align:"center", isTextBox:true, margin:0});

 s.addShape(pres.ShapeType.roundRect,{x:M, y:5.40, w:6.10, h:1.20, fill:{color:YEL3},
   rectRadius:0.05, line:{color:YEL2}});
 s.addText("El tamaño no se reparte como el PIB",{x:M+0.16, y:5.48, w:5.78, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`Francia tiene ${Math.round(E.exposicion[2]/E.exposicion[6])} veces la cartera PYME de Irlanda y tres veces la de España, muy por encima de lo que dice su economía. Conviene tenerlo delante al leer los ROE: un punto de ROE en Irlanda mueve una cartera de ${E.exposicion[6].toLocaleString("es-ES")} M€ y en Francia, de ${E.exposicion[2].toLocaleString("es-ES")} M€.`,
   {x:M+0.16, y:5.74, w:5.78, h:0.80, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});
 s.addShape(pres.ShapeType.roundRect,{x:6.90, y:5.40, w:6.03, h:1.20, fill:{color:BLUE3},
   rectRadius:0.05, line:{color:BLUE}});
 s.addText("Donde más se abre la brecha es donde menos rinde",{x:7.06, y:5.48, w:5.71, h:0.24,
   fontFace:HF, fontSize:11.5, bold:true, color:DARK, isTextBox:true, margin:0});
 s.addText(`Francia es el único de los siete donde la brecha se abre con claridad (+${n1(E.gap[2])}), y en su micro llega a +${n1(E.gap_micro[2])}. Es el mercado más grande, el único donde la necesidad se despega de la disponibilidad y el de peor ROE para su banca (${n1(D.pl.roe[2])} %). En Portugal la brecha se cierra con fuerza (${n1(E.gap[4])}).`,
   {x:7.06, y:5.74, w:5.71, h:0.80, fontFace:BF, fontSize:8.5, color:DARK, isTextBox:true, margin:0});
 fuente(s,"Fuentes: cartera PYME, EBA EU-wide Transparency Exercise, valor de exposición de la clase PYME de la banca supervisada en cada país, junio de 2025; brecha de financiación, BCE, encuesta SAFE, indicador compuesto financing gap de la PYME de menos de 250 empleados, media ponderada de "+E.periodo+". El indicador combina necesidad y disponibilidad de CINCO instrumentos —préstamo bancario, descubierto, crédito comercial, capital y valores de deuda— así que NO es solo crédito bancario, y mide el CAMBIO percibido, no el tamaño de una necesidad insatisfecha: un país con brecha negativa puede seguir teniendo mucha necesidad sin cubrir. Son dos magnitudes que no se agregan: una es un importe y la otra un saldo neto de respuestas. La SAFE segmenta por EMPLEADOS y el Transparency Exercise por clase de exposición prudencial; el micro de la SAFE solo está publicado para cuatro de los siete.", 6.5);
};

/* 19c2 — recomendaciones del bloque Espana */
L.recomendaciones_es = () => {const s=nueva();
 const B=D.bancos, CB=D.cb, CE=D.cesgar, A=D.autonomos;
 titulo(s,"Recomendaciones: España","Qué haría un banco español con este análisis, hoy");
 const R=[
  ["Atacar","El circulante, por precio y por comisión",
   `Es el destino del ${n1(CE.destino[0][1],1)} % de la demanda y el producto del que nadie publica precio de disponibilidad. La comisión neutral —la que hace el ROE indiferente a la disposición— es el CCF por el margen: ${n1(D.circ.f_neutral[0],2)} % en España. Por debajo de eso, cada línea poco dispuesta destruye ROE.`],
  ["Repreciar","El tramo pequeño y el autónomo",
   `España es la única de las siete sin gradiente de precio por tamaño (−4 pb frente a +143 de Italia), y el gradiente acompaña al ROE (ρ = +${n1(D.apetito.corr.gradtot_roe,2)}). El autónomo ya paga ${A.dif_vs_025} pb más: la disposición a pagar del micro existe y no se está cobrando en sociedades.`],
  ["No pasar de","Los 2,1 puntos de colchón de la pyme pequeña",
   `Es el límite duro que marca la Central de Balances: rentabilidad del activo ${n1(CB.roa[0])} % menos coste de la deuda ${n1(CB.coste[0])} %. Subir precio por encima no encuentra demanda, encuentra sustitución por crédito de proveedores, que ya usa el ${n1(CE.productos[2][1],0)} % de las pymes.`],
  ["Priorizar","Densidad de RWA sobre eficiencia",
   `Sabadell gana 4,9 puntos de ROE a BBVA con un resultado antes de impuestos MENOR, solo por capital (${n1(B.densidad[1])} % frente a ${n1(B.densidad[3])} %). Garantía real, aval SGR e ICO mueven más el ROE que un plan de eficiencia.`],
  ["Medir","La cobertura, no solo la mora",
   `Santander lleva cuatro trimestres bajando cobertura de PYME (${n1(D.bancos_serie.cob.Santander[0],1)} % a ${n1(D.bancos_serie.cob.Santander[3],1)} %) con la peor mora. Es el indicador que antes avisa, y el único de riesgo que el ejercicio de transparencia da por banco y por trimestre.`],
  ["Cerrar antes de decidir","El precio de PYME por banco",
   "No existe en fuente pública: la publicación por entidad del Banco de España se apoya en la Circular 5/2012, limitada a personas físicas. Solo sale con dato interno o comercial. Es el único hueco que impide comparar habilidad comercial y no solo estructura."]];
 let y=1.68;
 R.forEach((r,i)=>{
   s.addShape(pres.ShapeType.roundRect,{x:M, y:y, w:2.45, h:0.62, fill:{color: i<3?BLUE3:LIGHT},
     rectRadius:0.05, line:{color: i<3?BLUE:G3}});
   s.addText(r[0], {x:M, y:y, w:2.45, h:0.62, fontFace:HF, fontSize:11, bold:true,
     color:DARK, align:"center", valign:"middle", isTextBox:true, margin:0});
   s.addText(r[1], {x:M+2.65, y:y+0.03, w:3.35, h:0.56, fontFace:HF, fontSize:10.5, bold:true,
     color:DARK, valign:"middle", isTextBox:true, margin:0});
   s.addText(r[2], {x:M+6.15, y:y+0.03, w:6.0, h:0.56, fontFace:BF, fontSize:8.5,
     color:G1, valign:"middle", isTextBox:true, margin:0});
   y+=0.72;});
 fuente(s,"Las tres primeras recomendaciones se apoyan en la demanda (CESGAR) y en la capacidad de pago (Central de Balances); las tres últimas, en el modelo por banco sobre el EU-wide Transparency Exercise. El modelo compara estructura de riesgo, capital y coste, no habilidad comercial: el precio y las comisiones son comunes a los cinco porque ninguno los publica por segmento.");
};

/* --- orden final de la presentacion --- */
const ORDEN = [
  "portada", "objetivo",
  /* --- Bloque 1: el mercado europeo --- */
  "sep_europa",
  "eu_mercado", "precio", "cuenta", "roe", "sensibilidad", "entrante",
  "recursos", "riesgo", "infraestructura", "dos_ejes", "apetito",
  "capital", "eficiencia",
  "circulante", "circulante_precio", "circulante_roe",
  "comparables",
  /* --- Bloque 2: Espana, mercado y competidores --- */
  "sep_espana",
  "es_demanda", "es_capacidad",            // descriptivo: la pyme
  "comisiones_es", "autonomos",            // descriptivo: el precio
  "es_circulante", "es_factoring",         // descriptivo: los productos
  "es_mercado", "es_riesgo_serie",         // competitivo: los bancos
  "bancos_es", "bancos_es_pl",
  /* --- Cierre y anexos --- */
  "sep_cierre",
  "conclusiones", "conclusiones_es", "recomendaciones", "recomendaciones_es",
  "anexos", "datos", "fuentes", "fiabilidad", "limites", "supuestos",
  "info_relevante", "npl", "spread_pd_lgd", "palanca", "hipotecas",
  "cierre_lema", "cierre_gracias",
];
/* Laminas retiradas a proposito: su contenido lo absorbio otra. */
const RETIRADAS = ["factoring"];   // absorbida por es_factoring
const SEPARADORES = {
  sep_europa:     ["01", "El mercado\neuropeo", "Siete países · Precio, riesgo, capital y rentabilidad del préstamo PYME"],
  sep_espana:     ["02", "España: mercado,\nproductos y\ncompetidores", "La demanda, lo que puede pagar, los productos y los cinco grandes bancos"],
  sep_cierre:     ["03", "Conclusiones y\nrecomendaciones", "Lo que sostienen los datos y lo que se deriva de ellos"],
  anexos:         ["04", "Anexos", "Datos, fuentes, supuestos y los límites de cada cifra"],
  datos:          ["A", "Datos y fuentes", "De dónde sale cada número y con qué respaldo"],
  info_relevante: ["B", "Información\nrelevante", "Material de apoyo sobre riesgo, capital y productos sin precio público"]};
Object.entries(SEPARADORES).forEach(([k,t])=>{ L[k] = () => divisor(t[0], t[1], t[2]); });

ORDEN.forEach(k=>{ if(!L[k]) throw new Error("lamina desconocida: "+k); L[k](); });
const sobran = Object.keys(L).filter(k=>!ORDEN.includes(k) && !RETIRADAS.includes(k));
if(sobran.length) throw new Error("laminas sin colocar: "+sobran.join(", "));

pres.writeFile({fileName:"rentabilidad_pyme.pptx"}).then(f=>console.log("escrito:",f,"|",ORDEN.length,"laminas"));
