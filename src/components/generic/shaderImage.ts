export async function applyShaderToImage(
  image: HTMLImageElement,
  shader: string | undefined,
  outWidth: number,
  outHeight: number
): Promise<string> {
  if (!shader) return image.src;

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;

  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext;
  if (!gl) throw new Error("WebGL not supported");

  // -------------------------------------------------------------
  // Shader helpers
  // -------------------------------------------------------------
  const compileShader = (type: number, src: string): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile error:\n" + log);
    }
    return shader;
  };

  const createProgram = (vsSrc: string, fsSrc: string): WebGLProgram => {
    const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);

    const prog = gl.createProgram();
    if (!prog) throw new Error("Failed to create program");

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error("Program link error:\n" + log);
    }
    return prog;
  };

  // -------------------------------------------------------------
  // Vertex shader (fullscreen quad)
  // -------------------------------------------------------------
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_uv;

    void main() {
      v_uv = a_texcoord;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentShaderSource = getFragmentShaderSource(shader)
  const program = createProgram(vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  // -------------------------------------------------------------
  // Attribute + uniform locations
  // -------------------------------------------------------------
  const aPosition = gl.getAttribLocation(program, "a_position");
  const aTexcoord = gl.getAttribLocation(program, "a_texcoord");

  const uTexture = gl.getUniformLocation(program, "u_texture");
  const uResolution = gl.getUniformLocation(program, "u_resolution");
  const uImageSize = gl.getUniformLocation(program, "u_imageSize");

  // -------------------------------------------------------------
  // Fullscreen quad buffers
  // -------------------------------------------------------------
  const positions = new Float32Array([
    -1, -1,   1, -1,   -1,  1,
    -1,  1,   1, -1,    1,  1
  ]);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const texcoords = new Float32Array([
    0, 0,   1, 0,   0, 1,
    0, 1,   1, 0,   1, 1
  ]);
  const texBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aTexcoord);
  gl.vertexAttribPointer(aTexcoord, 2, gl.FLOAT, false, 0, 0);

  // -------------------------------------------------------------
  // Upload image to texture
  // -------------------------------------------------------------
  const texture = gl.createTexture();
  if (!texture) throw new Error("Failed to create texture");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTexture, 0);

  // Optional uniforms
  if (uResolution) gl.uniform2f(uResolution, outWidth, outHeight);
  if (uImageSize) gl.uniform2f(uImageSize, image.width, image.height);

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  gl.viewport(0, 0, outWidth, outHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // -------------------------------------------------------------
  // Return PNG DataURL
  // -------------------------------------------------------------
  return canvas.toDataURL("image/png");
}


const getFragmentShaderSource = (shader: string): string => {
  switch (shader) {

    case "foil":
    default:
      return `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 foil;            // same as original foil.r/foil.g
uniform float dissolve;
uniform float time;
uniform vec4 texture_details; // original vec4 — access .xy .z .w explicitly
uniform vec2 image_details;
uniform bool shadow;
uniform vec4 burn_colour_1;
uniform vec4 burn_colour_2;

varying vec2 v_uv;

//
// helper: safe max for texture detail scale
//
float safeMax(float a, float b) {
    return max(max(a, b), 1.0); // ensure >= 1.0 to avoid tiny divisors
}

//
// hue / RGB / HSL helpers (kept faithful)
//
float hue(float s, float t, float h) {
    float hs = mod(h, 1.0) * 6.0;
    if (hs < 1.0) return (t - s) * hs + s;
    if (hs < 3.0) return t;
    if (hs < 4.0) return (t - s) * (4.0 - hs) + s;
    return s;
}

vec4 RGB(vec4 c) {
    if (c.g < 0.0001) return vec4(vec3(c.b), c.a);
    float t = (c.b < 0.5) ? c.g * c.b + c.b : -c.g * c.b + (c.g + c.b);
    float s = 2.0 * c.b - t;
    return vec4(hue(s, t, c.r + 1.0/3.0), hue(s, t, c.r), hue(s, t, c.r - 1.0/3.0), c.a);
}

vec4 HSL(vec4 c) {
    float low = min(c.r, min(c.g, c.b));
    float high = max(c.r, max(c.g, c.b));
    float delta = high - low;
    float sum = high + low;
    vec4 hsl = vec4(0.0, 0.0, 0.5 * sum, c.a);
    if (delta == 0.0) return hsl;
    hsl.y = (hsl.z < 0.5) ? delta / sum : delta / (2.0 - sum);
    if (high == c.r) hsl.x = (c.g - c.b) / delta;
    else if (high == c.g) hsl.x = (c.b - c.r) / delta + 2.0;
    else hsl.x = (c.r - c.g) / delta + 4.0;
    hsl.x = mod(hsl.x / 6.0, 1.0);
    return hsl;
}

//
// Dissolve mask (safer math and explicit swizzles)
//
vec4 dissolve_mask(vec4 tex, vec2 texture_coords, vec2 uv) {
    if (dissolve < 0.001) {
        return vec4(shadow ? vec3(0.0) : tex.xyz, shadow ? tex.a * 0.3 : tex.a);
    }

    float adjusted_dissolve = (dissolve * dissolve * (3.0 - 2.0 * dissolve)) * 1.02 - 0.01;
    float t = time * 10.0 + 2003.0;

    // explicit: texture_details.ba -> vec2(texture_details.z, texture_details.w)
    vec2 td_ba = vec2(texture_details.z, texture_details.w);
    float td_b = texture_details.z;
    float td_a = texture_details.w;
    float td_max = safeMax(td_b, td_a);

    vec2 floored_uv = floor(uv * td_ba) / td_max;
    vec2 uv_scaled_centered = (floored_uv - 0.5) * 2.3 * td_max;

    vec2 field_part1 = uv_scaled_centered + 50.0 * vec2(sin(-t / 143.6340), cos(-t / 99.4324));
    vec2 field_part2 = uv_scaled_centered + 50.0 * vec2(cos(t / 53.1532), cos(t / 61.4532));
    vec2 field_part3 = uv_scaled_centered + 50.0 * vec2(sin(-t / 87.53218), sin(-t / 49.0));

    float field = (1.0 + (
        cos(length(field_part1) / 19.483) +
        sin(length(field_part2) / 33.155) * cos(field_part2.y / 15.73) +
        cos(length(field_part3) / 27.193) * sin(field_part3.x / 21.92)
    )) * 0.5;

    vec2 borders = vec2(0.2, 0.8);

    float res = (0.5 + 0.5 * cos(adjusted_dissolve / 82.612 + (field - 0.5) * 3.14))
        - (floored_uv.x > borders.y ? (floored_uv.x - borders.y) * (5.0 + 5.0 * dissolve) : 0.0) * dissolve
        - (floored_uv.y > borders.y ? (floored_uv.y - borders.y) * (5.0 + 5.0 * dissolve) : 0.0) * dissolve
        - (floored_uv.x < borders.x ? (borders.x - floored_uv.x) * (5.0 + 5.0 * dissolve) : 0.0) * dissolve
        - (floored_uv.y < borders.x ? (borders.x - floored_uv.y) * (5.0 + 5.0 * dissolve) : 0.0) * dissolve;

    if (tex.a > 0.01 && burn_colour_1.a > 0.01 && !shadow &&
        res < adjusted_dissolve + 0.8 * (0.5 - abs(adjusted_dissolve - 0.5)) &&
        res > adjusted_dissolve) {
        if (!shadow && res < adjusted_dissolve + 0.5 * (0.5 - abs(adjusted_dissolve - 0.5)) && res > adjusted_dissolve) {
            tex = burn_colour_1;
        } else if (burn_colour_2.a > 0.01) {
            tex = burn_colour_2;
        }
    }

    float alphaOut = (res > adjusted_dissolve) ? (shadow ? tex.a * 0.3 : tex.a) : 0.0;
    return vec4(shadow ? vec3(0.0) : tex.xyz, alphaOut);
}

void main() {
    vec4 tex = texture2D(u_texture, v_uv);

    // uv calculation: make explicit and safe
    vec2 td_ba = vec2(texture_details.z, texture_details.w);
    vec2 uv = ((v_uv * image_details) - texture_details.xy * td_ba) / max(td_ba, vec2(1.0)).x; 
    // note: original used scalar max(texture_details.b, texture_details.a).
    // we use a scalar safeMax to avoid divide by zero:
    float td_max = safeMax(texture_details.z, texture_details.w);
    uv = ((v_uv * image_details) - texture_details.xy * td_ba) / td_max;

    vec2 adjusted_uv = uv - vec2(0.5, 0.5);
    // simulate original aspect correction:
    float td_b = texture_details.z;
    float td_a = texture_details.w;
    if (td_a != 0.0) adjusted_uv.x = adjusted_uv.x * td_b / td_a;

    float low = min(tex.r, min(tex.g, tex.b));
    float high = max(tex.r, max(tex.g, tex.b));
    float delta = min(high, max(0.5, 1.0 - low));

    float fac = max(min(2.0 * sin((length(90.0 * adjusted_uv) + foil.x * 2.0) + 3.0 * (1.0 + 0.8 * cos(length(113.1121 * adjusted_uv) - foil.x * 3.121))) - 1.0 - max(5.0 - length(90.0 * adjusted_uv), 0.0), 1.0), 0.0);

    vec2 rotater = vec2(cos(foil.x * 0.1221), sin(foil.x * 0.3512));
    float lenAdj = length(adjusted_uv);
    float angle = 0.0;
    float lenRot = length(rotater);
    if (lenAdj > 1e-5 && lenRot > 1e-5) {
        angle = dot(rotater, adjusted_uv) / (lenRot * lenAdj);
    }

    float fac2 = max(min(5.0 * cos(foil.y * 0.3 + angle * 3.14 * (2.2 + 0.9 * sin(foil.x * 1.65 + 0.2 * foil.y))) - 4.0 - max(2.0 - length(20.0 * adjusted_uv), 0.0), 1.0), 0.0);
    float fac3 = 0.3 * max(min(2.0 * sin(foil.x * 5.0 + uv.x * 3.0 + 3.0 * (1.0 + 0.5 * cos(foil.x * 7.0))) - 1.0, 1.0), -1.0);
    float fac4 = 0.3 * max(min(2.0 * sin(foil.x * 6.66 + uv.y * 3.8 + 3.0 * (1.0 + 0.5 * cos(foil.x * 3.414))) - 1.0, 1.0), -1.0);

    float maxfac = max(max(fac, max(fac2, max(fac3, max(fac4, 0.0)))) + 2.2 * (fac + fac2 + fac3 + fac4), 0.0);

    tex.r = tex.r - delta + delta * maxfac * 0.3;
    tex.g = tex.g - delta + delta * maxfac * 0.3;
    tex.b = tex.b + delta * maxfac * 1.9;
    tex.a = min(tex.a, 0.3 * tex.a + 0.9 * min(0.5, maxfac * 0.1));

    vec4 outcol = dissolve_mask(tex, v_uv, uv);
    gl_FragColor = outcol;
}
`
  }
}