// effetti di post-produzione scritti per la resa «cinema» (cinema.ts): colore e striscia anamorfica.
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing'
import * as THREE from 'three'
import { cinema } from './cinema'

/** colore finale, dopo AgX: bianco e nero noir, tranne l’arancione della luce della fessura (colore selettivo) */
export class EffettoColore extends Effect {
  constructor() {
    const c = cinema.colore
    super(
      'ColoreCinema',
      /* glsl */ `
      uniform float saturazione;
      uniform float curva;
      uniform float neri;
      uniform float gamma;
      uniform float soglia;
      uniform float tonalita;
      uniform float ampiezza;
      vec3 hsv(vec3 c) {
        vec4 K = vec4(0., -1. / 3., 2. / 3., -1.);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-10)), d / (q.x + 1e-10), q.x);
      }
      float noir(float l) {
        l = mix(l, l * l * (3. - 2. * l), curva);
        l = pow(max(l - soglia, 0.) / (1. - soglia), gamma);
        return neri + l * (1. - neri);
      }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = clamp(inputColor.rgb, 0., 1.);
        float l = dot(c, vec3(.2126, .7152, .0722));
        float ln = noir(l);
        // quanto il pixel è «luce della fessura»: tonalità vicina all’arancione e abbastanza satura
        vec3 h = hsv(c);
        float distanza = abs(fract(h.x - tonalita + .5) - .5);
        // colore reale (massimo − minimo dei canali), non la saturazione relativa: i grigi scuri appena caldi restano grigi
        float croma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
        float tieni = (1. - smoothstep(ampiezza * .6, ampiezza, distanza)) * smoothstep(.12, .26, croma);
        vec3 grigio = mix(vec3(ln), c * (ln / max(l, 1e-4)), saturazione);
        vec3 colorato = c * (ln / max(l, 1e-4));
        outputColor = vec4(clamp(mix(grigio, colorato, tieni), 0., 1.), inputColor.a);
      }`,
      {
        blendFunction: BlendFunction.SET,
        uniforms: new Map<string, THREE.Uniform>([
          ['saturazione', new THREE.Uniform(c.saturazione)],
          ['curva', new THREE.Uniform(c.curva)],
          ['neri', new THREE.Uniform(c.neri)],
          ['gamma', new THREE.Uniform(cinema.noir.gamma)],
          ['soglia', new THREE.Uniform(cinema.noir.soglia)],
          ['tonalita', new THREE.Uniform(cinema.sole.tonalita / 360)],
          ['ampiezza', new THREE.Uniform(cinema.sole.ampiezza / 360)],
        ]),
      },
    )
  }
}

/** striscia orizzontale sulle luci forti, letta dalla texture già sfocata del bagliore (niente campioni extra della scena) */
export class EffettoStriscia extends Effect {
  constructor(bagliore: THREE.Texture) {
    super(
      'StrisciaAnamorfica',
      /* glsl */ `
      uniform sampler2D bagliore;
      uniform float intensita;
      uniform float lunghezza;
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 s = vec3(0.);
        float peso = 0.;
        for (int i = 1; i <= 12; i++) {
          float t = float(i) / 12.;
          float w = (1. - t) * (1. - t);
          vec2 d = vec2(t * lunghezza, 0.);
          s += (texture2D(bagliore, uv + d).rgb + texture2D(bagliore, uv - d).rgb) * w;
          peso += 2. * w;
        }
        // appena fredda, come le strisce delle lenti anamorfiche
        outputColor = vec4(inputColor.rgb + s / peso * intensita * vec3(.92, .97, 1.08), inputColor.a);
      }`,
      {
        blendFunction: BlendFunction.SET,
        uniforms: new Map<string, THREE.Uniform>([
          ['bagliore', new THREE.Uniform(bagliore)],
          ['intensita', new THREE.Uniform(cinema.striscia.intensita)],
          ['lunghezza', new THREE.Uniform(cinema.striscia.lunghezza)],
        ]),
      },
    )
  }
}

/**
 * glitch della camera (src/lib/glitch.ts): bande spostate a scatti, blocchi, sdoppiamento rgb e righe più scure.
 * Vive in un passaggio a sé, prima di fuoco, tonalità e colore noir: le frange rgb poi tornano quasi grigie.
 * A riposo il passaggio è spento (nessun costo). `zona` (centro e mezza misura in uv) limita il disturbo
 * attorno al logo; `tutto` = 1 per lo schermo intero. Mai più chiaro della scena: solo spostamenti e ombre.
 */
export class EffettoGlitch extends Effect {
  constructor() {
    super(
      'GlitchCamera',
      /* glsl */ `
      uniform float forza;
      uniform float seme;
      uniform float semeLuce;
      uniform float tutto;
      uniform vec4 zona;
      float caso(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        float dentro = max(tutto, step(abs(uv.x - zona.x), zona.z) * step(abs(uv.y - zona.y), zona.w));
        if (forza <= 0. || dentro <= 0.) { outputColor = inputColor; return; }
        vec2 p = uv;
        // bande orizzontali di altezza variabile che scivolano di lato
        float banda = floor(uv.y * (14. + 26. * caso(vec2(seme, 1.))));
        p.x += step(1. - .4 * forza, caso(vec2(banda, seme))) * (caso(vec2(banda, seme + 3.)) - .5) * .1 * forza;
        // blocchi che saltano
        vec2 cella = floor(uv * vec2(16., 9.));
        if (caso(cella + seme * 1.7) > 1. - .12 * forza)
          p += (vec2(caso(cella + seme + 2.), caso(cella + seme + 4.)) - .5) * vec2(.08, .03) * forza;
        // tutto il quadro scivola appena in verticale, come un segnale che perde l’aggancio
        p.y += tutto * (caso(vec2(seme, 9.)) - .5) * .02 * forza;
        p = clamp(p, vec2(0.), vec2(1.));
        float o = (.003 + .006 * caso(vec2(seme, 5.))) * forza;
        vec4 c = texture2D(inputBuffer, p);
        c.r = texture2D(inputBuffer, clamp(p + vec2(o, 0.), 0., 1.)).r;
        c.b = texture2D(inputBuffer, clamp(p - vec2(o, 0.), 0., 1.)).b;
        // righe di scansione e una fascia d’ombra (cambia al ritmo dei lampi): solo più scure, mai più chiare
        float righe = 1. - .12 * forza * step(.5, fract(uv.y / texelSize.y / 4.));
        float ombra = 1. - .25 * forza * step(abs(uv.y - caso(vec2(semeLuce, 7.))), .04);
        outputColor = vec4(c.rgb * righe * ombra, inputColor.a);
      }`,
      {
        attributes: EffectAttribute.CONVOLUTION,
        blendFunction: BlendFunction.SET,
        uniforms: new Map<string, THREE.Uniform>([
          ['forza', new THREE.Uniform(0)],
          ['seme', new THREE.Uniform(0)],
          ['semeLuce', new THREE.Uniform(0)],
          ['tutto', new THREE.Uniform(1)],
          ['zona', new THREE.Uniform(new THREE.Vector4())],
        ]),
      },
    )
  }
}
