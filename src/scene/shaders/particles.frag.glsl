uniform vec3 uIce;
uniform vec3 uViolet;
uniform vec3 uMagenta;
uniform float uIntensity;
uniform float uSoftness; // 0 = crisp dot, 1 = wide gaussian (bokeh)

varying float vRand;
varying float vBright;
varying float vStretch;
varying vec2 vDir;

void main() {
  // gl_PointCoord has y pointing down; flip so it matches view-space velocity
  vec2 c = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) - 0.5;
  // squash the round sprite perpendicular to motion: an ellipse that is vStretch times longer than wide
  vec2 perp = vec2(-vDir.y, vDir.x);
  float d = length(vec2(dot(c, vDir), dot(c, perp) * vStretch)) * 2.0;

  float crisp = 1.0 - smoothstep(0.15, 1.0, d);
  float soft = exp(-d * d * 3.5) * (1.0 - smoothstep(0.85, 1.0, d));
  float a = mix(crisp * crisp, soft, uSoftness);
  if (a < 0.003) discard;

  vec3 col = vRand < 0.5
    ? mix(uIce, uViolet, vRand * 2.0)
    : mix(uViolet, uMagenta, (vRand - 0.5) * 2.0);

  // a stretched sprite spreads the same light over more pixels
  gl_FragColor = vec4(col * a * vBright * uIntensity / sqrt(vStretch), 1.0);
}
