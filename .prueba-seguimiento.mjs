// Prueba del seguidor de voz contra una transcripcion REAL.
//
// Reproduce lo que hace el navegador: va soltando lo reconocido palabra a
// palabra y comprueba que el cursor avanza sin pegar saltos. El fallo que
// estamos arreglando era justo ese: saltos de parrafos enteros.
//
//   node .prueba-seguimiento.mjs <transcript.json> <guion.txt>

import fs from "node:fs";

const [, , rutaTranscript, rutaGuion] = process.argv;

const DIACRITICOS = /[̀-ͯ]/g;
const norm = s => s.toLowerCase().normalize("NFD").replace(DIACRITICOS, "").replace(/[^a-z0-9]/g, "");

const U = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciseis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidos","veintitres","veinticuatro","veinticinco","veintiseis","veintisiete","veintiocho","veintinueve"];
const D = {30:"treinta",40:"cuarenta",50:"cincuenta",60:"sesenta",70:"setenta",80:"ochenta",90:"noventa"};
const C = {1:"ciento",2:"doscientos",3:"trescientos",4:"cuatrocientos",5:"quinientos",6:"seiscientos",7:"setecientos",8:"ochocientos",9:"novecientos"};
function centenas(n){
  if(n === 0) return [];
  if(n < 30) return [U[n]];
  if(n < 100){ const d = Math.floor(n/10)*10, r = n%10; return r ? [D[d],"y",U[r]] : [D[d]]; }
  const c = Math.floor(n/100), r = n%100;
  if(n === 100) return ["cien"];
  return [C[c]].concat(centenas(r));
}
function enPalabras(n){
  if(n === 0) return ["cero"];
  if(n < 1000) return centenas(n);
  const miles = Math.floor(n/1000), r = n%1000;
  const cab = miles === 1 ? ["mil"] : centenas(miles).concat(["mil"]);
  return cab.concat(centenas(r));
}
function expandir(tokens){
  const out = [];
  for(const t of tokens){
    const limpio = t.replace(/[.,]/g, "");
    if(/^\d+$/.test(limpio) && limpio.length <= 6) out.push(...enPalabras(parseInt(limpio,10)).map(norm));
    else { const n = norm(t); if(n) out.push(n); }
  }
  return out;
}

// --- guion ---
const indices = [];
for(const bloque of fs.readFileSync(rutaGuion, "utf8").split(/\n\s*\n/)){
  const t = bloque.trim();
  if(!t || t.startsWith("##")) continue;
  for(const p of t.split(/\s+/)) indices.push({clave: norm(p), texto: p});
}

// --- el algoritmo, copiado tal cual de index.html ---
const ANCLA = 5, ACIERTOS = 3, ATRAS = 10, ADELANTE = 60;
let pos = 0, perdido = 0;

function buscar(cola, desde, hasta, minimo){
  let mejor = -1, mejorNota = 0;
  const tope = hasta - cola.length;
  for(let s = desde; s <= tope; s++){
    let aciertos = 0;
    for(let i = 0; i < cola.length; i++) if(indices[s+i].clave === cola[i]) aciertos++;
    if(aciertos < minimo) continue;
    const nota = aciertos - Math.abs(s - pos) / 10000;
    if(nota > mejorNota){ mejorNota = nota; mejor = s; }
  }
  return mejor;
}
function avanzarCon(tokens){
  if(!indices.length || tokens.length < ACIERTOS) return;
  const cola = tokens.slice(-ANCLA);
  let s = buscar(cola, Math.max(0,pos-ATRAS), Math.min(indices.length,pos+ADELANTE), ACIERTOS);
  if(s < 0){
    perdido++;
    if(perdido >= 6) s = buscar(cola, 0, indices.length, Math.min(cola.length, ACIERTOS+1));
    if(s < 0) return;
  }
  perdido = 0;
  pos = s + cola.length;
}

// --- variantes a comparar ---
// Todas barren el guion entero desde el principio en cada evento: esa es la
// propiedad que hace que un enganche erroneo se corrija solo al siguiente.
// Lo que cambia es cuantas palabras seguidas hay que acertar para avanzar.

function hacerBarrido(n, ventana){
  return function(tokens){
    let p = 0;
    for(let i = 0; i + n <= tokens.length; i++){
      const tope = Math.min(p + ventana, indices.length - n);
      for(let k = p; k <= tope; k++){
        let cuadra = true;
        for(let j = 0; j < n; j++){
          if(indices[k + j].clave !== tokens[i + j]){ cuadra = false; break; }
        }
        if(cuadra){ p = k + n; break; }
      }
    }
    if(p > 0) pos = p;
  };
}
const avanzarViejo = hacerBarrido(1, 14);
const avanzarBi    = hacerBarrido(2, 14);
const avanzarTri   = hacerBarrido(3, 20);

// Tope de avance por evento. No importa que produzca un salto disparatado:
// si se pasa del tope, se avanza solo el tope y los eventos siguientes
// terminan de recuperar. Acota el sintoma sin conocer la causa.
function conTope(fn, tope){
  return function(tokens){
    const antes = pos;
    fn(tokens);
    if(pos - antes > tope) pos = antes + tope;
  };
}

// --- simulacion ---
const oido = JSON.parse(fs.readFileSync(rutaTranscript, "utf8")).palabras.map(w => w.text);

function simular(avanzar, nombre, flujo){
  pos = 0; perdido = 0;
  let previa = 0, saltos = [], retrocesos = 0, maxSalto = 0;
  for(let i = 1; i <= flujo.length; i++){
    avanzar(expandir(flujo.slice(0, i)));
    const delta = pos - previa;
    if(delta > maxSalto) maxSalto = delta;
    if(delta > 15) saltos.push({palabra: i, de: previa, a: pos, salto: delta});
    if(delta < -3) retrocesos++;
    previa = pos;
  }
  return {nombre, fin: pos, maxSalto, saltos, retrocesos};
}

// El navegador no entrega una transcripcion limpia: mete palabras fantasma del
// ruido de fondo, se come otras, y reinicia el reconocimiento tras las pausas.
// Sin simular eso, la prueba es demasiado facil y no distingue un algoritmo de
// otro — que es justo lo que paso en la primera version de este banco.
const BASURA = ["de","la","el","que","en","y","a","los","las","un","una","por",
                "con","se","es","al","lo","su","para","mas","este","esa","son"];

function ensuciar(lista, intensidad, semilla){
  let x = semilla;
  const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const out = [];
  for(const p of lista){
    if(rnd() < intensidad) continue;                                  // se come una
    out.push(p);
    if(rnd() < intensidad) out.push(BASURA[Math.floor(rnd()*BASURA.length)]); // fantasma
  }
  return out;
}

console.log(`palabras del guion   : ${indices.length}`);
console.log(`palabras reconocidas : ${oido.length}\n`);
console.log("ruido   algoritmo                    final   salto max   saltos >15");
console.log("-".repeat(70));

const variantes = [
  ["1 palabra  (actual)", avanzarViejo],
  ["1 palabra + tope 10", conTope(hacerBarrido(1, 14), 10)],
  ["1 palabra + tope 6", conTope(hacerBarrido(1, 14), 6)],
  ["secuencia local de 5", avanzarCon],
];
const resumen = new Map(variantes.map(([n]) => [n, {salto: 0, saltos: 0, fin: 1e9}]));

for(const nivel of [0, 0.05, 0.12, 0.20]){
  const et = `${String(Math.round(nivel*100)).padStart(3)} %`;
  let primera = true;
  for(let semilla = 1; semilla <= 4; semilla++){
    const flujo = nivel === 0 ? oido : ensuciar(oido, nivel, semilla * 7919);
    for(const [nombre, fn] of variantes){
      const x = simular(fn, nombre, flujo);
      const acc = resumen.get(nombre);
      acc.salto = Math.max(acc.salto, x.maxSalto);
      acc.saltos += x.saltos.length;
      acc.fin = Math.min(acc.fin, x.fin);
      if(primera){
        console.log(`${primera && fn === variantes[0][1] ? et : "     "}   ${nombre.padEnd(24)} ${String(x.fin).padStart(4)}   ${String(x.maxSalto).padStart(9)}   ${String(x.saltos.length).padStart(10)}`);
      }
    }
    primera = false;
    if(nivel === 0) break;
  }
}

// --- el fallo de verdad: tramos finales reemitidos y por tanto duplicados ---
console.log("\n" + "=".repeat(70));
console.log("ESCENARIO REAL: Chrome reemite resultados y el flujo se duplica\n");

function duplicar(lista, desde, cuantas){
  return lista.slice(0, desde + cuantas).concat(lista.slice(desde, desde + cuantas),
                                                lista.slice(desde + cuantas));
}
console.log("duplicado          final   salto max   saltos >15");
console.log("-".repeat(70));
for(const [etiqueta, flujo] of [
  ["sin duplicar",          oido],
  ["30 palabras repetidas", duplicar(oido, 120, 30)],
  ["60 palabras repetidas", duplicar(oido, 120, 60)],
]){
  const x = simular(avanzarViejo, "v", flujo);
  console.log(`${etiqueta.padEnd(22)} ${String(x.fin).padStart(4)}   ${String(x.maxSalto).padStart(9)}   ${String(x.saltos.length).padStart(10)}`);
  if(x.saltos.length){
    const s = x.saltos[0];
    console.log(`   salta ${s.de} -> ${s.a} (+${s.salto}) y aterriza en: "${indices.slice(s.a, s.a+7).map(y=>y.texto).join(" ")}"`);
  }
}

console.log("\n" + "=".repeat(70));
console.log("peor caso de las 13 pasadas:");
console.log("algoritmo                  peor salto   saltos >15   peor avance");
console.log("-".repeat(70));
let ganador = null;
for(const [nombre, a] of resumen){
  console.log(`${nombre.padEnd(26)} ${String(a.salto).padStart(10)}   ${String(a.saltos).padStart(10)}   ${String(a.fin).padStart(11)}`);
  if(a.saltos === 0 && a.fin > indices.length * 0.85){
    if(!ganador || a.salto < ganador[1].salto) ganador = [nombre, a];
  }
}
console.log("\nveredicto: " + (ganador ? `gana «${ganador[0]}» — cero saltos y avance completo` : "ninguno limpio, revisar"));
