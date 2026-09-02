"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./synthesis-about-page.module.css";

const vertexSource = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }

  float field(vec2 p) {
    float value = 0.0;
    float weight = 0.55;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * weight;
      p = mat2(1.6, -1.2, 1.2, 1.6) * p + 0.17;
      weight *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 mouse = (uPointer * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
    float t = uTime * 0.075;
    vec2 warp = vec2(field(uv * 1.15 + t), field(uv * 1.15 - t + 8.1)) - 0.5;
    float n = field(uv * 1.62 + warp * 1.38 + vec2(t, -t * 0.6));
    float rings = abs(fract((n + length(uv - mouse * 0.16) * 0.1) * 8.0) - 0.5);
    float contour = 1.0 - smoothstep(0.035, 0.12, rings);
    float pulse = 0.5 + 0.5 * sin((uv.x - uv.y + n * 2.8) * 4.0 - uTime * 0.18);
    float ember = pow(max(0.0, contour * (0.52 + pulse * 0.48)), 1.5);
    float focus = exp(-2.3 * dot(uv - mouse * 0.18, uv - mouse * 0.18));
    vec3 black = vec3(0.031, 0.027, 0.023);
    vec3 orange = vec3(0.945, 0.235, 0.055);
    vec3 paper = vec3(0.94, 0.91, 0.85);
    vec3 color = mix(black, orange, ember * (0.42 + focus * 0.5));
    color = mix(color, paper, pow(ember, 5.0) * focus * 0.38);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unable to compile WebGL shader.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function AboutSignalField({ onSettled }: { onSettled: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSettledRef = useRef(onSettled);
  const [status, setStatus] = useState<"initializing" | "ready" | "fallback">("initializing");

  useEffect(() => { onSettledRef.current = onSettled; }, [onSettled]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      setStatus("fallback");
      onSettledRef.current();
      return;
    }

    let disposed = false;
    let frame = 0;
    let statusFrame = 0;
    let visible = true;
    let startedAt = performance.now();
    let pointer: [number, number] = [0.5, 0.5];
    const smoothPointer: [number, number] = [0.5, 0.5];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;

    const settleAsFallback = () => {
      if (disposed) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
      setStatus("fallback");
      onSettledRef.current();
    };

    try {
      vertexShader = compile(gl, gl.VERTEX_SHADER, vertexSource);
      fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error("Unable to create WebGL program.");
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Unable to link WebGL program.");
      gl.useProgram(program);

      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to create WebGL buffer.");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, "uResolution");
      const pointerUniform = gl.getUniformLocation(program, "uPointer");
      const time = gl.getUniformLocation(program, "uTime");

      const resize = () => {
        const rect = host.getBoundingClientRect();
        const scale = Math.min(window.devicePixelRatio || 1, 1.25) * 0.72;
        const width = Math.max(1, Math.round(rect.width * scale));
        const height = Math.max(1, Math.round(rect.height * scale));
        if (canvas.width === width && canvas.height === height) return;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      };

      const draw = (now: number) => {
        frame = 0;
        if (disposed || gl.isContextLost()) return;
        resize();
        smoothPointer[0] += (pointer[0] - smoothPointer[0]) * 0.08;
        smoothPointer[1] += (pointer[1] - smoothPointer[1]) * 0.08;
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform2f(pointerUniform, smoothPointer[0], smoothPointer[1]);
        gl.uniform1f(time, reducedMotion.matches ? 2.4 : (now - startedAt) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!reducedMotion.matches && visible && !document.hidden) frame = window.requestAnimationFrame(draw);
      };

      const resume = () => {
        if (disposed || frame || reducedMotion.matches || !visible || document.hidden) return;
        frame = window.requestAnimationFrame(draw);
      };
      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        pointer = [(event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height];
      };
      const onVisibilityChange = () => {
        if (document.hidden) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        } else resume();
      };
      const onMotionChange = () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        if (reducedMotion.matches) draw(performance.now());
        else resume();
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        settleAsFallback();
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (!visible) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        } else {
          startedAt = performance.now();
          resume();
        }
      });

      host.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.addEventListener("change", onMotionChange);
      canvas.addEventListener("webglcontextlost", onContextLost);
      observer.observe(host);
      draw(performance.now());
      statusFrame = window.requestAnimationFrame(() => {
        if (disposed) return;
        setStatus("ready");
        onSettledRef.current();
      });

      return () => {
        disposed = true;
        window.cancelAnimationFrame(frame);
        window.cancelAnimationFrame(statusFrame);
        observer.disconnect();
        host.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        reducedMotion.removeEventListener("change", onMotionChange);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
      };
    } catch {
      settleAsFallback();
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    }
  }, []);

  return (
    <div ref={hostRef} className={styles.heroField} data-status={status} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.heroCanvas} />
      <div className={styles.heroFallback}><span /><i /></div>
    </div>
  );
}
