(() => {
  const stage = document.querySelector('.vortex-stage');
  const canvas = document.getElementById('principles-canvas');
  const label = stage?.querySelector('.vortex-index');
  if (!stage || !canvas || !label) return;

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return;
  window.__vortexReplicaActive = true;

  const initialize = () => {

  // Ring atlas: manifesto + method language (matches Principles / index mono voice).
  // First "." is the hover/dot glyph slot; remaining periods act as separators.
  const text = 'WEN YIFAN. BE REAL. BE CREATIVE. BE BOLD. CONCEPT. FORM. EXPERIENCE.';
  const dotIndex = text.indexOf('.');
  const letterIndices = Array.from(text).map((_, index) => index).filter((index) => index !== dotIndex);
  const atlasColumns = 8;
  const atlasRows = Math.ceil(text.length / atlasColumns);
  const atlasCell = 64;
  const ringCount = 30;
  const rippleSlots = 16;
  const pixelToDesign = 1 / 540;
  const quadPosition = new Float32Array([
    -.5, -.5, .5, -.5, .5, .5,
    -.5, -.5, .5, .5, -.5, .5,
  ]);
  const quadUv = new Float32Array([
    0, 0, 1, 0, 1, 1,
    0, 0, 1, 1, 0, 1,
  ]);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = (edge0, edge1, value) => {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return amount * amount * (3 - 2 * amount);
  };
  const smoothInverse = (value) => {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    let guess = value;
    for (let index = 0; index < 6; index += 1) {
      const squared = guess * guess;
      const error = 3 * squared - 2 * squared * guess - value;
      const derivative = 6 * guess - 6 * squared;
      if (!derivative) break;
      guess -= error / derivative;
    }
    return clamp(guess, 0, 1);
  };
  const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
  const labels = {
    idle: 'HOLD TO CHARGE',
    touch: 'HOLD TO CHARGE',
    holding: 'KEEP HOLDING',
    charged: 'RELEASE',
    reduced: 'METHOD DISC / STATIC',
  };

  const state = {
    width: 1,
    height: 1,
    visible: false,
    pageVisible: !document.hidden,
    motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    frame: 0,
    idleTimer: 0,
    time: 0,
    last: performance.now(),
    holding: false,
    charged: false,
    charge: 0,
    gather: 0,
    scrollVelocity: 0,
    scrollBoost: 0,
    mouseTarget: new Float32Array([999, 999]),
    mouseSmooth: new Float32Array([999, 999]),
    mouseInfluence: 0,
    mouseInfluenceTarget: 0,
    pointerActive: false,
    touchStart: null,
    mode: '',
  };
  const fitScale = new Float32Array([1, 1]);
  const center = new Float32Array([0, 0]);
  const ringCharge = new Float32Array(ringCount);
  const ringGather = new Float32Array(ringCount);
  const rawCharge = new Float32Array(ringCount);
  const rawGather = new Float32Array(ringCount);
  const freezeAccum = new Float32Array(ringCount);
  const spinVelocity = new Float32Array(ringCount);
  const spinPosition = new Float32Array(ringCount);
  const offsets = new Float32Array(ringCount);
  const rippleStarts = new Float32Array(rippleSlots).fill(-1);
  const ripples = [];

  const setMode = (next) => {
    if (state.mode === next) return;
    state.mode = next;
    const idle = isTouch() ? labels.touch : labels.idle;
    label.textContent = state.motion ? (next === 'idle' ? idle : labels[next] || idle) : labels.reduced;
    stage.dataset.discState = next;
    stage.classList.toggle('is-charging', next === 'holding');
    stage.classList.toggle('is-charged', next === 'charged');
    stage.setAttribute('aria-pressed', String(next === 'holding' || next === 'charged'));
    window.__methodDisc = {
      mode: next,
      charge: state.charge,
      gather: state.gather,
      motion: state.motion,
    };
  };

  const monoFont = (size) => {
    const family = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'Cascadia Mono, Consolas, monospace';
    return `400 ${Math.floor(size)}px ${family}`;
  };
  const buildAtlas = () => {
    const atlas = document.createElement('canvas');
    atlas.width = atlasCell * atlasColumns;
    atlas.height = atlasCell * atlasRows;
    const context = atlas.getContext('2d', { alpha: true });
    context.clearRect(0, 0, atlas.width, atlas.height);
    context.fillStyle = '#f3f1eb';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = monoFont(57.6);
    for (let index = 0; index < text.length; index += 1) {
      const x = ((index % atlasColumns) + .5) * atlasCell;
      const y = (Math.floor(index / atlasColumns) + .55) * atlasCell;
      if (text[index] === '.') {
        context.beginPath();
        context.arc(x, y, 5.76, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillText(text[index], x, y);
      }
    }
    return atlas;
  };
  const buildRings = () => Array.from({ length: ringCount }, (_, index) => {
    const progress = index / (ringCount - 1);
    const radius = .06 + 1.39 * progress;
    const speed = (index % 2 ? -1 : 1) * (.006 + (1 - progress) * .029);
    const letterSize = 14 + 16 * progress;
    return {
      radius,
      speed,
      letterSize,
      charsCount: Math.max(8, Math.floor((Math.PI * 2 * radius) / (.6 * letterSize * pixelToDesign))),
      bandCenter: Math.random() < .15 ? Math.random() * Math.PI * 2 : .25 + (Math.random() - .5) * .65 * Math.PI,
      bandHalfWidth: Math.min(.98, (Math.random() < .1 ? .05 + .15 * Math.random() : .25 + .35 * progress + .3 * Math.random())) * Math.PI,
      bandSoftness: Math.PI * (.07 + .13 * Math.random()),
    };
  });
  const packLetters = (count) => {
    const isLetter = new Uint8Array(count);
    const letterIndex = new Uint16Array(count);
    let cursor = 0;
    while (cursor < count) {
      for (let index = 0; index < letterIndices.length && cursor < count; index += 1) {
        isLetter[cursor] = 1;
        letterIndex[cursor] = letterIndices[index];
        cursor += 1;
      }
      cursor += 1 + Math.floor(3 * Math.random());
    }
    return { isLetter, letterIndex };
  };
  const rings = buildRings();
  const buildInstances = () => {
    const total = rings.reduce((sum, ring) => sum + ring.charsCount, 0);
    const radius = new Float32Array(total);
    const theta = new Float32Array(total);
    const speed = new Float32Array(total);
    const size = new Float32Array(total);
    const character = new Float32Array(total);
    const ringIndex = new Float32Array(total);
    let cursor = 0;
    rings.forEach((ring, index) => {
      const packed = packLetters(ring.charsCount);
      const phase = Math.random() * Math.PI * 2;
      const step = Math.PI * 2 / ring.charsCount;
      const outer = ring.bandHalfWidth + ring.bandSoftness;
      const inner = Math.max(0, ring.bandHalfWidth - ring.bandSoftness);
      for (let glyph = 0; glyph < ring.charsCount; glyph += 1) {
        const angle = phase + glyph * step;
        const density = smooth(outer, inner, Math.abs(wrapAngle(angle - ring.bandCenter)));
        const useLetter = packed.isLetter[glyph] && (density > .7 || (density >= .3 && Math.random() < density));
        radius[cursor] = ring.radius;
        theta[cursor] = angle;
        speed[cursor] = ring.speed;
        ringIndex[cursor] = index;
        character[cursor] = useLetter ? packed.letterIndex[glyph] : dotIndex;
        size[cursor] = useLetter ? ring.letterSize * (.85 + .15 * density) : 5;
        cursor += 1;
      }
    });
    return { radius, theta, speed, size, character, ringIndex, total };
  };
  const instance = buildInstances();

  // Site DNA: Soft White #f3f1eb on Cinema Black #101010, Signal Orange #ff5a2f on charge.
  const softWhite = [243 / 255, 241 / 255, 235 / 255];
  const signalOrange = [255 / 255, 90 / 255, 47 / 255];
  const cinemaBlack = [16 / 255, 16 / 255, 16 / 255];

  const vertexShader = `#version 300 es
precision highp float;
in vec2 position; in vec2 uv; in float aRadius; in float aTheta; in float aSpeed; in float aSize; in float aCharacter; in float aRing;
uniform float uTime; uniform vec2 uFitScale; uniform vec2 uCenter; uniform vec2 uAtlasGrid; uniform float uPixelToDesign; uniform vec2 uMouse; uniform float uMouseInfluence; uniform float uMouseRadius; uniform float uRingCharge[30]; uniform float uRingGather[30]; uniform float uRippleStarts[16]; uniform float uRingOffsets[30]; uniform float uRingArrival[30];
out vec2 vUv; out float vAlpha; out float vHeat;
const float PI = 3.14159265359; const float dotCharacter = ${dotIndex}.0;
void main() {
  float ripple = 0.0;
  for (int index = 0; index < 16; index++) {
    float start = uRippleStarts[index]; if (start < 0.0) continue;
    float elapsed = uTime - start; if (elapsed < 0.0 || elapsed >= 1.8) continue;
    float t = elapsed / 1.8; float wave = smoothstep(0.0, 1.0, t) * 1.6;
    float bell = 1.0 - smoothstep(0.0, 0.2125, abs(aRadius - wave));
    float life = smoothstep(0.0, 0.22, t) * (1.0 - smoothstep(0.78, 1.0, t));
    ripple = max(ripple, bell * life);
  }
  int ring = int(aRing); float charge = uRingCharge[ring]; float gather = uRingGather[ring];
  float effectiveRadius = aRadius * (1.0 - gather * 0.12) + ripple * 0.045;
  float angle = aTheta + uTime * aSpeed + uRingOffsets[ring]; float c = cos(angle); float s = sin(angle);
  vec2 ringCenter = vec2(c, s) * effectiveRadius;
  float hover = (1.0 - smoothstep(0.0, uMouseRadius, length(ringCenter - uMouse))) * uMouseInfluence;
  float seed = aTheta * 7.13 + aRadius * 13.97; float threshold = fract(sin(seed * 12.9898) * 43758.5453);
  float dot = step(threshold, max(hover * 2.5, ripple));
  float glitch = fract(sin(seed * 91.7 + floor(uTime * 9.0) * 7.31) * 43758.5453);
  dot = max(dot, step(glitch, charge * 0.15));
  float character = mix(aCharacter, dotCharacter, dot); float glyphSize = mix(aSize, 5.0, dot) * (1.0 + ripple * 0.5);
  vec2 rotated = vec2(-position.x * s - position.y * c, position.x * c - position.y * s) * glyphSize * uPixelToDesign;
  float shakeSeed = fract(sin(aTheta * 91.17 + aRadius * 47.91) * 24634.6345); float shakes = step(shakeSeed, 0.18);
  vec2 tremor = vec2(sin(uTime * (38.0 + shakeSeed * 14.0) + shakeSeed * 271.0), cos(uTime * (34.0 + shakeSeed * 17.0) + shakeSeed * 113.0)) * (charge * shakes * 0.002);
  vec2 world = (ringCenter + rotated + tremor) * uFitScale + uCenter;
  float column = mod(character, uAtlasGrid.x); float row = floor(character / uAtlasGrid.x);
  vUv = vec2((column + uv.x) / uAtlasGrid.x, (row + (1.0 - uv.y)) / uAtlasGrid.y);
  vAlpha = clamp((uTime - uRingArrival[ring]) / 0.5, 0.0, 1.0);
  // Hold heat + ripple edge pick up Signal Orange without washing the idle paper white.
  vHeat = clamp(charge * 0.92 + ripple * 0.55 + hover * 0.18, 0.0, 1.0);
  gl_Position = vec4(world, 0.0, 1.0);
}`;
  const fragmentShader = `#version 300 es
precision mediump float;
uniform sampler2D tAtlas;
uniform vec3 uSoftWhite;
uniform vec3 uSignalOrange;
in vec2 vUv; in float vAlpha; in float vHeat;
out vec4 color;
void main() {
  vec4 glyph = texture(tAtlas, vUv);
  // Slight outer cool-down keeps paper white dominant; charge/ripple push to #ff5a2f.
  float heat = smoothstep(0.05, 0.95, vHeat);
  vec3 rgb = mix(uSoftWhite, uSignalOrange, heat * 0.88);
  color = vec4(rgb, glyph.a * vAlpha);
}`;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Disc shader compile failed');
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(cinemaBlack[0], cinemaBlack[1], cinemaBlack[2], 1);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attribute = (name, size, data, instanced) => {
    const location = gl.getAttribLocation(program, name);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    if (instanced) gl.vertexAttribDivisor(location, 1);
  };
  attribute('position', 2, quadPosition, false);
  attribute('uv', 2, quadUv, false);
  attribute('aRadius', 1, instance.radius, true);
  attribute('aTheta', 1, instance.theta, true);
  attribute('aSpeed', 1, instance.speed, true);
  attribute('aSize', 1, instance.size, true);
  attribute('aCharacter', 1, instance.character, true);
  attribute('aRing', 1, instance.ringIndex, true);

  const arrivals = new Float32Array(ringCount);
  rings.forEach((ring, index) => { arrivals[index] = 1.8 * smoothInverse(Math.min(1, Math.max(0, ring.radius - .425) / 1.6)); });
  const uniform = (name) => gl.getUniformLocation(program, name);
  const uniforms = {
    time: uniform('uTime'), fitScale: uniform('uFitScale'), center: uniform('uCenter'), atlasGrid: uniform('uAtlasGrid'), pixelToDesign: uniform('uPixelToDesign'), mouse: uniform('uMouse'), mouseInfluence: uniform('uMouseInfluence'), mouseRadius: uniform('uMouseRadius'), ringCharge: uniform('uRingCharge[0]'), ringGather: uniform('uRingGather[0]'), rippleStarts: uniform('uRippleStarts[0]'), offsets: uniform('uRingOffsets[0]'), arrivals: uniform('uRingArrival[0]'), atlas: uniform('tAtlas'), softWhite: uniform('uSoftWhite'), signalOrange: uniform('uSignalOrange'),
  };
  gl.uniform2f(uniforms.atlasGrid, atlasColumns, atlasRows);
  gl.uniform1f(uniforms.pixelToDesign, pixelToDesign);
  gl.uniform1f(uniforms.mouseRadius, .35);
  gl.uniform1fv(uniforms.arrivals, arrivals);
  gl.uniform1i(uniforms.atlas, 0);
  gl.uniform3fv(uniforms.softWhite, new Float32Array(softWhite));
  gl.uniform3fv(uniforms.signalOrange, new Float32Array(signalOrange));

  let atlasTexture;
  const uploadAtlas = () => {
    if (atlasTexture) gl.deleteTexture(atlasTexture);
    atlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildAtlas());
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  uploadAtlas();

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(state.width * ratio);
    canvas.height = Math.round(state.height * ratio);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = state.width / state.height;
    fitScale[0] = aspect >= 1 ? 1 : 1 / aspect;
    fitScale[1] = aspect >= 1 ? aspect : 1;
  };
  const designFromLocal = (x, y) => [
    ((x / state.width) * 2 - 1 - center[0]) / fitScale[0],
    (-((y / state.height) * 2 - 1) - center[1]) / fitScale[1],
  ];
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1f(uniforms.time, state.time);
    gl.uniform2fv(uniforms.fitScale, fitScale);
    gl.uniform2fv(uniforms.center, center);
    gl.uniform2fv(uniforms.mouse, state.mouseSmooth);
    gl.uniform1f(uniforms.mouseInfluence, state.mouseInfluence);
    gl.uniform1fv(uniforms.ringCharge, ringCharge);
    gl.uniform1fv(uniforms.ringGather, ringGather);
    gl.uniform1fv(uniforms.rippleStarts, rippleStarts);
    gl.uniform1fv(uniforms.offsets, offsets);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instance.total);
    canvas.dataset.renderState = state.motion ? 'ready' : 'reduced';
  };
  const update = (now) => {
    const delta = Math.min(.05, Math.max(.001, (now - state.last) / 1000));
    state.last = now;
    if (state.motion) state.time += delta;
    while (ripples.length && state.time - ripples[0].start >= 1.8) ripples.shift();
    rippleStarts.fill(-1);
    ripples.forEach((ripple, index) => { rippleStarts[index] = ripple.start; });
    state.mouseInfluence += (state.mouseInfluenceTarget - state.mouseInfluence) * (1 - Math.exp(-6 * delta));
    state.mouseSmooth[0] += (state.mouseTarget[0] - state.mouseSmooth[0]) * (1 - Math.exp(-14 * delta));
    state.mouseSmooth[1] += (state.mouseTarget[1] - state.mouseSmooth[1]) * (1 - Math.exp(-14 * delta));
    if (state.holding) {
      state.charge = Math.min(1, state.charge + delta / .9);
      state.gather = 1 - (1 - state.gather) * Math.exp(-delta / 4);
      if (!state.charged && state.charge >= 1) { state.charged = true; setMode('charged'); }
    } else {
      state.charge *= Math.exp(-10 * delta);
      state.gather *= Math.exp(-10 * delta);
    }
    if (window.__methodDisc) {
      window.__methodDisc.charge = state.charge;
      window.__methodDisc.gather = state.gather;
      window.__methodDisc.mode = state.mode;
    }
    const sinceRelease = ripples.length ? state.time - ripples[ripples.length - 1].start : Infinity;
    const waveEdge = sinceRelease < 1.8 ? 1.6 * smooth(0, 1, sinceRelease / 1.8) + .425 : Infinity;
    for (let index = 0; index < ringCount; index += 1) {
      const ring = rings[index];
      if (state.holding) {
        rawCharge[index] += (state.charge - rawCharge[index]) * (1 - Math.exp(-14 * delta));
        rawGather[index] += (smooth(0, 1, state.charge) * state.gather - rawGather[index]) * (1 - Math.exp(-14 * delta));
      } else if (waveEdge >= ring.radius) {
        rawCharge[index] *= Math.exp(-10 * delta);
        rawGather[index] *= Math.exp(-10 * delta);
      }
      ringGather[index] = rawGather[index];
      ringCharge[index] = smooth(0, 1, rawCharge[index]);
      freezeAccum[index] -= ringCharge[index] * ring.speed * delta;
    }
    state.scrollVelocity *= Math.exp(-5 * delta);
    state.scrollBoost += (Math.min(40, Math.abs(state.scrollVelocity)) - state.scrollBoost) * (1 - Math.exp(-4 * delta));
    for (let index = 0; index < ringCount; index += 1) {
      const ring = rings[index];
      let ripple = 0;
      ripples.forEach((entry) => {
        const elapsed = state.time - entry.start;
        if (elapsed < 0 || elapsed >= 1.8) return;
        const progress = elapsed / 1.8;
        const bell = 1 - smooth(0, .425, Math.abs(ring.radius - 1.6 * smooth(0, 1, progress)));
        const life = smooth(0, .22, progress) * (1 - smooth(.78, 1, progress));
        ripple = Math.max(ripple, bell * life * entry.strength);
      });
      spinVelocity[index] += (.55 * ripple * Math.sign(ring.speed) + ring.speed * state.scrollBoost) * delta;
      spinPosition[index] += (spinVelocity[index] - spinPosition[index]) * (1 - Math.exp(-3 * delta));
      offsets[index] = spinPosition[index] + freezeAccum[index];
    }
    if (window.__methodDisc) window.__methodDisc.motion = state.motion;
    render();
    const busy = state.holding
      || state.charged
      || state.charge > 0.002
      || state.gather > 0.002
      || state.pointerActive
      || state.mouseInfluence > 0.02
      || state.scrollBoost > 0.12
      || ripples.length > 0;
    if (!(state.visible && state.pageVisible && state.motion)) {
      state.frame = 0;
      return;
    }
    if (busy) {
      state.frame = requestAnimationFrame(update);
      return;
    }
    // Idle visible disc: cap ~24fps so scroll/UI keep main-thread headroom.
    const idleDelay = Math.max(0, (1000 / 24) - (performance.now() - now));
    state.frame = 0;
    state.idleTimer = window.setTimeout(() => {
      state.idleTimer = 0;
      state.frame = requestAnimationFrame(update);
    }, idleDelay);
  };
  const ensureLoop = () => {
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = 0;
    }
    if (state.visible && state.pageVisible && state.motion) {
      if (!state.frame) {
        state.last = performance.now();
        state.frame = requestAnimationFrame(update);
      }
    } else {
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
      render();
    }
  };
  const setPointer = (event, snap) => {
    const rect = stage.getBoundingClientRect();
    const point = designFromLocal(event.clientX - rect.left, event.clientY - rect.top);
    state.mouseTarget[0] = point[0]; state.mouseTarget[1] = point[1];
    if (snap) { state.mouseSmooth[0] = point[0]; state.mouseSmooth[1] = point[1]; }
    state.pointerActive = true;
    state.mouseInfluenceTarget = 1;
    canvas.dataset.pointerState = 'active';
  };
  const cancelCharge = () => {
    state.holding = false; state.charged = false; state.charge = 0; state.gather = 0;
    rawCharge.fill(0); rawGather.fill(0); ringCharge.fill(0); ringGather.fill(0);
    setMode('idle');
  };
  const startCharge = () => {
    if (!state.motion || state.holding) return;
    state.holding = true; state.charged = false; setMode('holding'); ensureLoop();
  };
  const releaseCharge = () => {
    if (!state.holding) return;
    state.holding = false;
    if (state.charged) {
      ripples.push({ start: state.time, strength: .7 + .6 * state.gather });
      while (ripples.length > rippleSlots) ripples.shift();
    }
    state.charged = false;
    setMode('idle');
    ensureLoop();
  };
  stage.addEventListener('pointerenter', (event) => { if (!state.motion) return; setPointer(event, true); ensureLoop(); }, { passive: true });
  stage.addEventListener('pointermove', (event) => {
    if (!state.motion) return;
    setPointer(event, false);
    if (event.pointerType === 'touch' && state.holding && state.touchStart && Math.hypot(event.clientX - state.touchStart.x, event.clientY - state.touchStart.y) > 12) cancelCharge();
    ensureLoop();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { state.pointerActive = false; state.mouseInfluenceTarget = 0; canvas.dataset.pointerState = 'idle'; if (state.holding) cancelCharge(); }, { passive: true });
  stage.addEventListener('pointerdown', (event) => { if (!event.isPrimary || !state.motion) return; state.touchStart = { x: event.clientX, y: event.clientY }; setPointer(event, false); stage.setPointerCapture?.(event.pointerId); startCharge(); });
  stage.addEventListener('pointerup', (event) => { state.touchStart = null; stage.releasePointerCapture?.(event.pointerId); releaseCharge(); });
  stage.addEventListener('pointercancel', () => { state.touchStart = null; cancelCharge(); });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { cancelCharge(); return; }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); startCharge(); }
  });
  stage.addEventListener('keyup', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); releaseCharge(); } });
  window.addEventListener('wheel', (event) => { if (state.visible && state.pageVisible) state.scrollVelocity += event.deltaY * .02; }, { passive: true });
  new ResizeObserver(() => { resize(); render(); }).observe(stage);
  new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; ensureLoop(); }, { threshold: .05 }).observe(stage);
  document.addEventListener('visibilitychange', () => { state.pageVisible = !document.hidden; ensureLoop(); });
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (event) => { state.motion = !event.matches; if (!state.motion) state.time = 2.3; setMode('idle'); ensureLoop(); });
  document.fonts?.ready?.then(() => { uploadAtlas(); render(); });
  if (state.motion) ripples.push({ start: 0, strength: 1 }); else state.time = 2.3;
  // Live instrument bridge for paper-side method HUD (must remain writable)
  window.__methodDisc = { mode: 'idle', charge: 0, gather: 0, motion: state.motion };
  resize();
  setMode('idle');
  render();
  ensureLoop();
  };

  if ('IntersectionObserver' in window) {
    const activationObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      activationObserver.disconnect();
      initialize();
    }, { rootMargin: '800px 0px', threshold: 0 });
    activationObserver.observe(stage);
  } else if ('requestIdleCallback' in window) {
    requestIdleCallback(initialize, { timeout: 2400 });
  } else {
    window.setTimeout(initialize, 900);
  }
})();
