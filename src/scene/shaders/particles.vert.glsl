// Particle drift: each point flows through a curl field built from smooth 3D value noise.
// Curl of a noise potential is divergence-free, so the dust swirls without clumping or draining.

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uFreq;
uniform float uSpeed;
uniform float uAmp;
uniform vec3 uVelocity; // camera velocity in view space, world units per second
uniform float uStreakGain;
uniform float uStreakMax;
uniform float uNearBoost;
uniform float uSwirl; // accumulated swirl angle (finale)

attribute float aRand;
attribute float aScale;

varying float vRand;
varying float vBright;
varying float vStretch;
varying vec2 vDir;

float hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash3(i);
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  ) * 2.0 - 1.0;
}

// Three decorrelated noise channels form the vector potential.
vec3 potential(vec3 p) {
  return vec3(
    valueNoise(p),
    valueNoise(p + vec3(17.3, -4.1, 9.7)),
    valueNoise(p + vec3(-8.6, 23.9, -15.2))
  );
}

vec3 curl(vec3 p) {
  const float e = 0.1;
  vec3 dx = potential(p + vec3(e, 0.0, 0.0)) - potential(p - vec3(e, 0.0, 0.0));
  vec3 dy = potential(p + vec3(0.0, e, 0.0)) - potential(p - vec3(0.0, e, 0.0));
  vec3 dz = potential(p + vec3(0.0, 0.0, e)) - potential(p - vec3(0.0, 0.0, e));
  return vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x) / (2.0 * e);
}

void main() {
  vec3 p = position;
  // finale swirl around the star's vertical axis: inner dust turns faster, each mote at its own rate
  float a = uSwirl * (0.6 + aRand * 0.8) / (1.0 + length(p.xz) * 0.12);
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  p += curl(p * uFreq + vec3(0.0, 0.0, uTime * uSpeed) + aRand * 3.0) * uAmp;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;

  // brighter close to the star (at the world origin)
  float distStar = length(p);
  vBright = 1.0 + uNearBoost * smoothstep(5.0, 0.6, distStar);
  // fade out right in front of the lens and far away so nothing pops
  vBright *= smoothstep(0.2, 1.4, depth) * (1.0 - smoothstep(45.0, 70.0, depth));

  // Streak along this point's own screen motion. For view-plane position s = xy / depth,
  // a camera moving at V makes it travel at -(V.xy + s * V.z) / depth: sideways moves give
  // parallel streaks, a forward dive gives warp-speed streaks radiating from the centre.
  vec2 s = mv.xy / depth;
  vec2 screenVel = -(uVelocity.xy + s * uVelocity.z) / depth;
  float speed = length(screenVel);
  vStretch = clamp(1.0 + speed * uStreakGain, 1.0, uStreakMax);
  vDir = speed > 1e-4 ? screenVel / speed : vec2(1.0, 0.0);
  vRand = aRand;

  gl_PointSize = uSize * aScale * uPixelRatio * vStretch / depth;
  gl_Position = projectionMatrix * mv;
}
