/* Sistema visual compartido del deck Bankinter.
   Extraido literalmente de gen.js para que las laminas sueltas
   (gen_adicionales.js) usen exactamente la misma paleta, tipografia y
   helpers. gen.js NO se ha modificado: sigue llevando su propia copia,
   de forma que el deck principal no depende de este fichero.
   Si se cambia la paleta, hay que cambiarla en los dos sitios. */
const pptxgen = require("pptxgenjs");

function sistema(pres){
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
  const n1=(v,d=1)=>v.toFixed(d).replace(".",",");
  const sg=v=>v>0?"+"+v:(v<0?"−"+Math.abs(v):"0");
  const sg2=v=>(v>0?"+":(v<0?"−":""))+n1(Math.abs(v));

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
      /* `sinNumero`: estas laminas van sueltas, su numero depende de donde
         se inserten en el deck, asi que no se imprime. */
      if(!opts.sinNumero)
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


  return {PRIM,DARK,G1,G2,G3,LIGHT,PAPEL,YEL,YEL2,YEL3,BLUE,BLUE3,MAG,MAG3,
          ORA2,ORA3,OK,MED,BAD,ACC,TXT,MUT,HF,BF,W,H,M,
          n1,sg,sg2,logo,nueva,titulo,fuente,bloques,divisor,nota,chip,
          hdr,cel,tOpt, laminas:()=>NLAM};
}
module.exports = {sistema};
