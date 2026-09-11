# Atril de Locución

Teleprompter que **avanza solo mientras hablas**. Texto grande, para leer desde
lejos con la pantalla detrás de la cámara.

No instala nada. Sin Python, sin Node, sin permisos de administrador: el servidor
va en PowerShell, que viene de serie en Windows.

---

## Instalar

1. Descarga el ZIP: **[última versión](../../releases/latest)**
2. Descomprímelo donde quieras.
3. Doble clic en **`abrir-atril.cmd`**.

Se abre el navegador solo. Deja la ventana negra abierta mientras grabas; al
cerrarla se apaga el atril.

La primera vez viene con un texto de ejemplo. Léelo en voz alta: comprueba que el
micrófono funciona y de paso explica el resto.

> **Requiere Chrome o Edge** para el seguimiento por voz. Firefox y Safari no
> traen reconocimiento de voz; en ellos funciona el modo automático.

## Poner tu guion

Deja un archivo **`guion.txt`** junto a `abrir-atril.cmd`. Se carga solo.

O pulsa `E` dentro de la herramienta, pega el texto y guarda.

Si existe `guion.txt`, manda sobre lo que edites a mano.

### Formato

Texto normal, párrafos separados por una línea en blanco. Una línea que empiece
por `##` es el **nombre de un bloque**: no se lee en voz alta, solo aparece en el
panel para que sepas por dónde vas.

```
## 1 · El gancho
Primer párrafo, que sí se lee.

Segundo párrafo.

## 2 · El desarrollo
Y así.
```

> **No metas indicaciones dentro del texto.** Nada de «(pausa)» ni «leer despacio».
> Lo que esté en el cuerpo del guion se acaba leyendo en voz alta. Pasa siempre.

## Teclas

| | |
|---|---|
| `espacio` | arranca y para |
| `↑` `↓` | mueve una frase entera |
| `+` `−` | tamaño de letra (se recuerda) |
| `R` | reinicia |
| `F` | pantalla completa |
| `E` | cambiar el guion |

## El panel

Transcurrido, duración objetivo, palabras leídas y **ritmo en vivo**, que se pone
verde cuando vas al ritmo previsto. A la derecha, en qué bloque del guion estás.

El piloto de la izquierda dice si el micrófono está cogiendo de verdad. Si no se
pone verde, no te está oyendo.

## Cómo sigue la voz

Reconoce lo que dices y lo casa con el guion palabra a palabra. Si te saltas algo
o te trabas, busca hacia delante en una ventana de catorce palabras y se recoloca
solo.

Las cifras se traducen antes de comparar: el reconocimiento devuelve «42.500» y tu
guion dice «cuarenta y dos mil quinientos». Sin esa traducción el seguimiento se
soltaría en cada número.

## Si algo falla

**No pide micrófono.**
Tiene que abrirse con `abrir-atril.cmd`. Chrome solo concede micrófono en contexto
seguro — https o localhost — y un archivo abierto con doble clic no lo es: falla
sin llegar a preguntar. La página lo detecta y avisa.

**No arranca.**
El puerto puede estar ocupado. Prueba veinte puertos seguidos antes de rendirse; si
aun así falla, el motivo sale en la ventana negra.

## Dos cosas que conviene saber

**Tu voz pasa por Google.** El reconocimiento de Chrome no es local: manda el audio
a sus servidores para transcribirlo. Si eso no encaja, el modo automático no toca el
micrófono.

**Es oscuro a propósito.** Una pantalla clara detrás de la cámara rebota luz en la
cara y estropea la toma.

## Para redistribuirlo

`empaquetar.cmd` genera un ZIP con solo lo que hace falta — deja fuera el `guion.txt`
para que no viaje el texto de nadie.

## Licencia

MIT. Haz lo que quieras con él.
