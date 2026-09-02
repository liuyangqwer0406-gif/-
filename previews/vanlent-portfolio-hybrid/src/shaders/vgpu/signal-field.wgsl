struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  speed: f32,
  intensity: f32,
  grain: f32,
  pointerStrength: f32,
  density: f32,
  pulse: f32,
  motion: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(point: vec2f) -> f32 {
  let source = fract(point * vec2f(123.34, 456.21));
  let folded = source + dot(source, source + 45.32);
  return fract(folded.x * folded.y);
}

fn signalLine(value: f32, width: f32) -> f32 {
  return exp(-abs(value) / max(width, 0.0001));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeHeight = max(params.resolution.y, 1.0);
  let aspect = params.resolution.x / safeHeight;
  let aspectScale = vec2f(aspect, 1.0);
  let time = params.time * params.motion;

  var point = (uv - 0.5) * aspectScale;
  let pointerPoint = (params.pointer - 0.5) * aspectScale;
  let pointerDelta = point - pointerPoint;
  let pointerDistance = max(length(pointerDelta), 0.0001);
  let pointerFalloff = exp(-pointerDistance * 5.2) * params.pointerStrength;

  let tangent = vec2f(-pointerDelta.y, pointerDelta.x) / pointerDistance;
  point += tangent * pointerFalloff * (0.055 + 0.022 * sin(time * 1.7));

  let radius = length(point);
  let angle = atan2(point.y, point.x);
  let density = 6.0 + params.density * 8.0;
  let breathing = sin(time * params.speed * 0.65) * 0.025;

  let contourPhase = radius * density - time * params.speed + sin(angle * 4.0 + time * 0.28) * 0.32;
  let contour = signalLine(sin(contourPhase * 3.14159265), 0.085 - params.intensity * 0.025);

  let orbitRadius = 0.215 + breathing + pointerFalloff * 0.035;
  let orbit = signalLine(radius - orbitRadius, 0.0085 + params.intensity * 0.003);
  let secondaryOrbit = signalLine(radius - (orbitRadius * 1.64), 0.0045);

  let pointerRingRadius = 0.105 + 0.018 * sin(time * 1.35);
  let pointerRing = signalLine(pointerDistance - pointerRingRadius, 0.0065) * pointerFalloff;

  let pulseAge = clamp(params.pulse, 0.0, 1.0);
  let pulseEnergy = (1.0 - pulseAge) * step(0.0, params.pulse);
  let pulseRadius = pulseAge * 0.58;
  let pulseRing = signalLine(pointerDistance - pulseRadius, 0.009 + pulseAge * 0.006) * pulseEnergy;

  let diagonal = signalLine(
    sin((point.x * 1.35 + point.y * 0.7) * 12.0 + time * params.speed * 0.7),
    0.12
  ) * 0.12;

  let pixel = floor(uv * params.resolution);
  let noise = hash21(pixel + floor(time * 18.0));
  let grain = (noise - 0.5) * params.grain;

  let background = vec3f(0.022, 0.018, 0.015);
  let signalOrange = vec3f(1.0, 0.255, 0.045);
  let warmOrange = vec3f(1.0, 0.57, 0.21);
  let paperWarm = vec3f(0.95, 0.79, 0.63);

  var light = contour * (0.045 + params.intensity * 0.035);
  light += orbit * (0.55 + params.intensity * 0.34);
  light += secondaryOrbit * 0.22;
  light += pointerRing * 0.58;
  light += pulseRing * 0.9;
  light += diagonal;

  let core = exp(-radius * 8.0) * (0.12 + pointerFalloff * 0.2);
  let edgeFade = 1.0 - smoothstep(0.45, 0.9, length((uv - 0.5) * vec2f(1.0, 0.82)));

  var color = background;
  color += signalOrange * light * edgeFade;
  color += warmOrange * (orbit * orbit + pulseRing * pulseRing) * 0.32;
  color += paperWarm * core;
  color += vec3f(grain);

  return vec4f(max(color, vec3f(0.0)), 1.0);
}
