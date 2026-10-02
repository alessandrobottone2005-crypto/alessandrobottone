// Shader dell’avatar a punti del chi sono: un fotogramma dell’atlante (scripts/prepara-avatar.mjs),
// portato nel bianco della palette, con l’accensione a scansione nel passaggio dal logo
// e il glitch casuale (src/lib/glitch.ts): righe spostate, blocchi, punti persi, copie sfasate.

export const vertice = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const frammento = /* glsl */ `
  uniform sampler2D uAtlante;
  uniform vec2 uGriglia;     // colonne, righe
  uniform float uFotogramma; // indice intero: cella + canale
  uniform float uSpecchio;   // 1 = testa girata verso destra (stessi fotogrammi ribaltati)
  uniform vec3 uColore;
  uniform float uComparsa;   // 0 spento → 1 acceso
  uniform float uTempo;
  uniform float uGlitch;     // 0 = fermo; forza del glitch in corso
  uniform float uSeme;       // cambia a ogni scatto
  uniform float uSemeLuce;   // cambia al massimo 6 volte al secondo (3 lampi): ciò che tocca la luminosità
  varying vec2 vUv;

  float casuale(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
  float caso2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  float leggi(vec2 uv) {
    if (uSpecchio > 0.5) uv.x = 1.0 - uv.x;
    float celle = uGriglia.x * uGriglia.y;
    float canale = floor(uFotogramma / celle);
    float posto = mod(uFotogramma, celle);
    vec2 cella = vec2(mod(posto, uGriglia.x), floor(posto / uGriglia.x));
    // nell’atlante la riga 0 è in alto, nelle uv di three lo 0 è in basso
    vec2 coord = (cella + vec2(clamp(uv.x, 0.001, 0.999), 1.0 - clamp(uv.y, 0.001, 0.999))) / uGriglia;
    coord.y = 1.0 - coord.y;
    vec3 texel = texture2D(uAtlante, coord).rgb;
    return canale < 0.5 ? texel.r : canale < 1.5 ? texel.g : texel.b;
  }

  void main() {
    vec2 uv = vUv;
    // durante il passaggio, una sola fascia sottile che scorre spostata di lato
    float passaggio = step(0.2, uComparsa) * step(uComparsa, 0.8);
    float fascia = step(abs(uv.y - fract(uTempo * 0.9)), 0.03) * passaggio;
    uv.x += fascia * (casuale(floor(uTempo * 12.0)) - 0.5) * 0.08;

    float luce;
    if (uGlitch <= 0.0) {
      luce = leggi(uv);
    } else {
      // righe spostate: fasce orizzontali di altezza variabile che scivolano di lato a scatti
      float riga = floor(uv.y * (18.0 + 22.0 * casuale(uSeme)));
      uv.x += step(1.0 - 0.45 * uGlitch, caso2(vec2(riga, uSeme))) * (caso2(vec2(riga, uSeme + 7.0)) - 0.5) * 0.3 * uGlitch;
      // blocchi: alcune celle pescano il disegno da un altro punto
      vec2 blocco = floor(vUv * vec2(5.0, 8.0));
      if (caso2(blocco + uSeme * 1.31) > 1.0 - 0.3 * uGlitch)
        uv += (vec2(caso2(blocco + uSeme + 3.0), caso2(blocco + uSeme + 5.0)) - 0.5) * vec2(0.25, 0.12) * uGlitch;
      // copie sfasate nel bianco della palette (separazione «cromatica» senza colori nuovi), mai più chiare dell’originale
      float scarto = (0.012 + 0.03 * casuale(uSeme + 2.0)) * uGlitch;
      luce = max(leggi(uv), 0.55 * max(leggi(uv + vec2(scarto, 0.0)), leggi(uv - vec2(scarto, 0.004))));
      // punti persi: blocchi e righe che si spengono (cambiano solo al ritmo dei lampi)
      vec2 zona = floor(vUv * vec2(9.0, 14.0));
      float perso = step(1.0 - 0.35 * uGlitch, caso2(zona + uSemeLuce * 2.17));
      float rigaPersa = step(1.0 - 0.25 * uGlitch, caso2(vec2(floor(vUv.y * 60.0), uSemeLuce)));
      luce *= 1.0 - max(perso, rigaPersa) * 0.85;
    }

    // scansione dall’alto verso il basso, con una riga luminosa sul bordo
    float soglia = 1.0 - uComparsa * 1.08;
    float acceso = smoothstep(soglia - 0.01, soglia + 0.01, uv.y);
    float bordo = smoothstep(0.025, 0.0, abs(vUv.y - soglia)) * step(0.001, uComparsa) * step(uComparsa, 0.999);

    // sfuma in basso e ai lati; i punti chiari superano appena la soglia del bagliore
    float sfuma = smoothstep(0.0, 0.18, vUv.y) * smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    vec3 colore = uColore * (pow(luce, 0.85) * 1.7 * acceso + bordo * 0.8) * sfuma;
    // niente valori fuori scala: un NaN si spargerebbe in tutto il bagliore
    gl_FragColor = vec4(clamp(colore, 0.0, 3.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
