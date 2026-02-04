export interface ShaderDefinition {
  id: string;
  name: string;
  author: string;
  url: string;
  license: string;
  channels?: ShaderChannel[];
  attributionNote?: string;
  fragment: string;
}

export interface ShaderChannel {
  url: string;
  wrap?: "repeat" | "clamp";
  filter?: "linear" | "nearest";
}

const DEFAULT_ATTRIBUTION_NOTE =
  "Attribution details need confirmation from ShaderToy.";

const withPrecision = (source: string): string => {
  if (/precision\s+(lowp|mediump|highp)\s+float/.test(source)) {
    return source;
  }
  return `precision highp float;\n${source}`;
};

export const SHADERS: ShaderDefinition[] = [
  {
    id: "mtyGWy",
    name: "mtyGWy",
    author: "kishimisu",
    url: "https://www.shadertoy.com/view/mtyGWy",
    license: "CC BY-NC-SA 3.0 (assumed ShaderToy default)",
    attributionNote: DEFAULT_ATTRIBUTION_NOTE,
    fragment: withPrecision(`/*

    This animation is the material of my first youtube tutorial about creative
    coding, which is a video in which I try to introduce programmers to GLSL
    and to the wonderful world of shaders, while also trying to share my recent
    passion for this community.
                                       Video URL: https://youtu.be/f4s1h2YETNY
*/

//https://iquilezles.org/articles/palettes/
vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.263, 0.416, 0.557);

  return a + b * cos(6.28318 * (c * t + d));
}

//https://www.shadertoy.com/view/mtyGWy
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  vec2 uv0 = uv;
  vec3 finalColor = vec3(0.0);

  for (float i = 0.0; i < 4.0; i++) {
    uv = fract(uv * 1.5) - 0.5;

    float d = length(uv) * exp(-length(uv0));

    vec3 col = palette(length(uv0) + i * .4 + iTime * .4);

    d = sin(d * 8. + iTime) / 8.;
    d = abs(d);

    d = pow(0.01 / d, 1.2);

    finalColor += col * d;
  }

  fragColor = vec4(finalColor, 1.0);
}`),
  },
  {
    id: "ttscWn",
    name: "Mandelbrot Pattern Decoration",
    author: "Shane",
    url: "https://www.shadertoy.com/view/ttscWn",
    license: "CC BY-NC-SA 3.0 (assumed ShaderToy default)",
    attributionNote: DEFAULT_ATTRIBUTION_NOTE,
    fragment: withPrecision(`/*


	Mandelbrot Pattern Decoration
	-----------------------------


	After looking at Fabrice's Mandelbrot derivative example, it occurred
	to me that I have a heap of simple Mandelbrot and Julia related
    demonstrations that I've never gotten around to posting, so here's one
    of them. I put it together a long time ago using the standard base code,
    which you'll find in countless examples on the internet. I'm pretty sure
    I started with IQ's "Orbit Traps" shader, which is a favorite amongst
    many on here, then added a few extra lines to produce the effect you
	see. There's not a lot to this at all, so hopefully, it'll be easy to
    consume.

    Producing Mandelbrot and Julia patterns is pretty straight forward. At
    it's core, you're simply transforming each point on the screen in a
    certain way many times over, then representing the transformed point
    in the form of shades and colors.

    In particular, you treat each point as if it were on a 2D complex plane,
    then perform an iterative complex operation -- which, ironically, is not
    complex at all. :) In this particular example, the iterative complex
    derivative is recorded also, which is used for a bit of shading.

    In regard to the shading process itself, most people tend to set a
    bailout, then provide a color based on the transformed point distance,
	and leave it at that. However, with barely any extra code, it's
    possible to makes things look more interesting.

    The patterns look pretty fancy, but they're nothing more than repeat
    circles and grid boundaries applied after transforming the coordinates.
    The shading and highlights were made up on the spot, but none of it was
    complex, nor was it based on reality (no pun intended).



    Related examples:

    // Based on one of IQ's really nice Mandelbrot examples, like this.
    // I love the subtle feathering.
 	Mandelbrot - orbit traps -- IQ
 	https://www.shadertoy.com/view/ldf3DN

    // Beautiful example.
	Heading To The Sun -- NivBehar
	https://www.shadertoy.com/view/wtdSzS

*/


void mainImage(out vec4 fragColor, in vec2 fragCoord) {

  // Base color.
  vec3 col = vec3(0);

  // Anitaliasing: Just a 2 by 2 sample. You could almost get away with not using
  // it at all, but it is necessary.
  #define AA 2
  for (int j = 0; j < AA; j++) {
    for (int i = 0; i < AA; i++) {

      // Offset centered coordinate -- Standard AA stuff.
      vec2 p = (fragCoord + vec2(i, j) / float(AA) - iResolution.xy * .5) / iResolution.y;

      // Time, rotating back and forth.
      float ttm = cos(sin(iTime / 8.)) * 6.2831;

      // Rotating and translating the canvas... More effort needs to be put in here,
      // but it does the job.
      p *= mat2(cos(ttm), sin(ttm), -sin(ttm), cos(ttm));
      p -= vec2(cos(iTime / 2.) / 2., sin(iTime / 3.) / 5.);


      // Jump off point and zoom... Where and how much you zoom in greatly effects what
      // you see, so I probably should have put more effort in here as well, but this
      // shows you enough.
      float zm = (200. + sin(iTime / 7.) * 50.);
      vec2 cc = vec2(-.57735 + .004, .57735) + p / zm;


      // Position and derivative. Initialized to zero.
      vec2 z = vec2(0), dz = vec2(0);

      // Iterations: Not too many. You could get away with fewer, if need be.
      const int iter = 128;
      int ik = 128; // Bail out value. Set to the largest to begin with.
      vec3 fog = vec3(0); //vec3(.01, .02, .04);

      for (int k = 0; k < iter; k++) {


        // Derivative: z' = z*z'*2. + 1.
        // Imaginary partial derivatives are similar to real ones.
        dz = mat2(z, -z.y, z.x) * dz * 2. + vec2(1, 0); // A better way. Thanks, Fabrice. :)
        //dz = vec2(z.x*dz.x - z.y*dz.y, z.x*dz.y + z.y*dz.x)*2. + vec2(1, 0);


        // Position: z = z*z + c.
        // Squaring an imaginary point is slightly different to squaring a real
        // one, but at the end of the day, it's just a transformation.
        z =  mat2(z, -z.y, z.x) * z + cc;
        //z = (vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y)) + cc;


        // Experimental transformation with twisting... It's OK, but I wasn't
        // feeling it.
        //float l = (float(k)/500.);
        //z = mat2(cos(l), sin(l), -sin(l), cos(l))*mat2(z, -z.y, z.x)*z + cc;


        // If the length (squared to save cycles) of the transformed point goes
        // out of bounds, break. In layperson's terms, points that stay within
        // the set boundaries longer appear brighter... or darker, depending what
        // you're trying to achieve.
        if (dot(z, z) > 1. / .005) {
          ik = k; // Record the break number, or however you say it.
          break;
        }

      }



      // Lines and shading. There'd be a few ways to represent a boundary line, and
      // I'd imagine there'd be better ways than this, but it works, so it'll do.
      float ln = step(0., length(z) / 15.5  - 1.);


      // Distance... shade... It's made up, but there's a bit of logic there. Smooth
      // coloring involves the log function. I remember reading through a proof a few
      // years back, when I used to like that kind of thing. It made sense at the time. :)
      float d = sqrt(1. / max(length(dz), .0001)) * log(dot(z, z));
      // Mapping the distance from zero to one.
      d = clamp(d * 50., 0., 1.);

      // Flagging successive layers. You can use this to reverse directions, alternate
      // colors, etc.
      float dir = mod(float(ik), 2.) < .5 ? -1. : 1.;

      // Layer coloring and shading. Also made up.
      float sh = (float(iter - ik)) / float(iter); // Shade.
      vec2 tuv = z / 320.; // Transformed UV coordinate.

      // Rotating the coordinates, based on the global canvas roations and distance
      // for that parallax effect to aid the depth illusion.
      float tm = (-ttm * sh * sh * 16.);
      // Rotated, repeat coordinates.
      tuv *= mat2(cos(tm), sin(tm), -sin(tm), cos(tm));
      tuv = abs(mod(tuv, 1. / 8.) - 1. / 16.);

      // Rendering a grid of circles, and showing the grid boundaries. Anything is
      // possible here: Truchets, Voronoi, etc.
      float pat = smoothstep(0., 1. / length(dz), length(tuv) - 1. / 32.);
      pat = min(pat, smoothstep(0., 1. / length(dz), abs(max(tuv.x, tuv.y) - 1. / 16.) - .04 / 16.));

      // Coloring the layer. These are based on the shaded distance value, but you can
      // choose anything you want.
      //vec3 lCol = (.55 + .45*cos(6.2831*(d*d)/3. + vec3(0, 1, 2) - 4.))*1.25;
      vec3 lCol = pow(min(vec3(1.5, 1, 1) * min(d * .85, .96), 1.), vec3(1, 3, 16)) * 1.15;

      // Appolying the circular grid pattern to the color, based on successive layer count.
      // We're also applying a boundary line.
      lCol = dir < .0 ? lCol * min(pat, ln) : (sqrt(lCol) * .5 + .7) * max(1. - pat, 1. - ln);



      // A fake unit direction vector to provide a fake reflection vector in order
      // to produce a fake glossy diffuse value for fake highlights. The knowledge
      // behind all this is also fake. :D
      vec3 rd = normalize(vec3(p, 1.));
      rd = reflect(rd, vec3(0, 0, -1));
      // Synchronizing the gloss movement... It wasn't for me.
      // rd.xy = mat2(cos(tm), sin(tm), -sin(tm), cos(tm))*rd.xy;
      float diff = clamp(dot(z * .5 + .5, rd.xy), 0., 1.) * d;


      // Fake reflective pattern, which has been offset slightly, and moved in a
      // reflective manner.
      tuv = z / 200.;
      tm = -tm / 1.5 + .5;
      tuv *= mat2(cos(tm), sin(tm), -sin(tm), cos(tm));
      tuv = abs(mod(tuv, 1. / 8.) - 1. / 16.);
      pat = smoothstep(0., 1. / length(dz), length(tuv) - 1. / 32.);
      pat = min(pat, smoothstep(0., 1. / length(dz), abs(max(tuv.x, tuv.y) - 1. / 16.) - .04 / 16.));


      // Adding the fake gloss. The "ln" variable is there to stop the gloss from
      // reaching the outer fringe, since I thought that looked a little better.
      lCol += mix(lCol, vec3(1) * ln, .5) * diff * diff * .5 * (pat * .6 + .6);

      // Swizzling the color on every sixth layer -- I thought it might break up the
      // orange and red a little.
      if (mod(float(ik), 6.) < .5) lCol = lCol.yxz;
      lCol = mix(lCol.xzy, lCol, d / 1.2); // Shade based coloring, for something to do.

      // This was a last minute addition. I put some deep black lined fringes on the layers
      // to add more illusion of depth. Comment it out to see what it does.
      lCol = mix(lCol, vec3(0), (1. - step(0., -(length(z) * .05 * float(ik) / float(iter)  - 1.))) * .95);

      // Applying the fog.
      lCol = mix(fog, lCol, sh * d);


      // Used for colored fog.
      //lCol *= step(0., d - .25/(1. + float(ik)*.5));

      // Applying the color sample.
      col += min(lCol, 1.);
    }
  }

  // Divide by the sample number.
  col /= float(AA * AA);


  // Toning down the highlights... but I'm going to live on the edge and leave it as is. :D
  //col = (1. - exp(-col))*1.25;

   // Subtle vignette.
  vec2 uv = fragCoord / iResolution.xy;
  col *= pow(16. * (1. - uv.x) * (1. - uv.y) * uv.x * uv.y, 1. / 8.) * 1.15;

  fragColor = vec4(sqrt(max(col, 0.)), 1.0);
}`),
  },
  {
    id: "XstXR2",
    name: "XstXR2",
    author: "Unknown",
    url: "https://www.shadertoy.com/view/XstXR2",
    license: "CC BY-NC-SA 3.0 (assumed ShaderToy default)",
    attributionNote: DEFAULT_ATTRIBUTION_NOTE,
    fragment: withPrecision(`#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535897932384626433832795

const float wave_amplitude = 0.076;
const float period = 2. * PI;

float wave_phase() {
  return iTime;
}

float square(vec2 st) {
  vec2 bl = step(vec2(0.), st);       // bottom-left
  vec2 tr = step(vec2(0.), 1.0 - st); // top-right
  return bl.x * bl.y * tr.x * tr.y;
}

vec4 frame(vec2 st) {
  float tushka = square(st * mat2((1. / .48), 0., 0., (1. / .69)));

  mat2 sector_mat = mat2(1. / .16, 0., 0., 1. / .22);
  float sectors[4];
  sectors[0] = square(st * sector_mat + (1. / .16) * vec2(0.000, -0.280));
  sectors[1] = square(st * sector_mat + (1. / .16) * vec2(0.000, -0.060));
  sectors[2] = square(st * sector_mat + (1. / .16) * vec2(-0.240, -0.280));
  sectors[3] = square(st * sector_mat + (1. / .16) * vec2(-0.240, -0.060));
  vec3 sector_colors[4];
  sector_colors[0] = vec3(0.941, 0.439, 0.404) * sectors[0];
  sector_colors[1] = vec3(0.435, 0.682, 0.843) * sectors[1];
  sector_colors[2] = vec3(0.659, 0.808, 0.506) * sectors[2];
  sector_colors[3] = vec3(0.996, 0.859, 0.114) * sectors[3];

  return vec4(vec3(sector_colors[0] + sector_colors[1] +
                   sector_colors[2] + sector_colors[3]), tushka);
}

vec4 trail_piece(vec2 st, vec2 index, float scale) {
  scale = index.x * 0.082 + 0.452;

  vec3 color;
  if (index.y > 0.9 && index.y < 2.1) {
    color = vec3(0.435, 0.682, 0.843);
    scale *= .8;
  } else if (index.y > 3.9 && index.y < 5.1) {
    color = vec3(0.941, 0.439, 0.404);
    scale *= .8;
  } else {
    color = vec3(0., 0., 0.);
  }

  float scale1 = 1. / scale;
  float shift = -(1. - scale) / (2. * scale);
  vec2 st2 = vec2(vec3(st, 1.) * mat3(scale1, 0., shift, 0., scale1, shift, 0., 0., 1.));
  float mask = square(st2);

  return vec4(color, mask);
}

vec4 trail(vec2 st) {
  // actually 1/width, 1/height
  const float piece_height = 7. / .69;
  const float piece_width = 6. / .54;

  // make distance between smaller segments slightly lower
  st.x = 1.2760 * pow(st.x, 3.0) - 1.4624 * st.x * st.x + 1.4154 * st.x;

  float x_at_cell = floor(st.x * piece_width) / piece_width;
  float x_at_cell_center = x_at_cell + 0.016;
  float incline = cos(0.5 * period + wave_phase()) * wave_amplitude;

  float offset = sin(x_at_cell_center * period + wave_phase()) * wave_amplitude +
      incline * (st.x - x_at_cell) * 5.452;

  float mask = step(offset, st.y) * (1. - step(.69 + offset, st.y)) * step(0., st.x);

  vec2 cell_coord = vec2((st.x - x_at_cell) * piece_width,
                         fract((st.y - offset) * piece_height));
  vec2 cell_index = vec2(x_at_cell * piece_width,
                         floor((st.y - offset) * piece_height));

  vec4 pieces = trail_piece(cell_coord, cell_index, 0.752);

  return vec4(vec3(pieces), pieces.a * mask);
}

vec4 logo(vec2 st) {
  if (st.x <= .54) {
    return trail(st);
  } else {
    vec2 st2 = st + vec2(0., -sin(st.x * period + wave_phase()) * wave_amplitude);
    return frame(st2 + vec2(-.54, 0));
  }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 st = fragCoord.xy / iResolution.xy;
  st.x *= iResolution.x / iResolution.y;

  st += vec2(.0);
  st *= 1.472;
  st += vec2(-0.7, -0.68);
  float rot = PI * -0.124;
  st *= mat2(cos(rot), sin(rot), -sin(rot), cos(rot));

  vec4 logo_ = logo(st);
  fragColor = mix(vec4(0., .5, .5, 1.000), logo_, logo_.a);
}`),
  },
  {
    id: "ftt3R7",
    name: "ftt3R7",
    author: "Unknown",
    url: "https://www.shadertoy.com/view/ftt3R7",
    license: "CC BY-NC-SA 3.0 (assumed ShaderToy default)",
    attributionNote: "Requires iChannel0 texture; attribution needs confirmation.",
    channels: [
      {
        url: "",
        wrap: "repeat",
        filter: "linear",
      },
    ],
    fragment: withPrecision(`#define NUM_LAYERS 10.

mat2 Rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float Star(vec2 uv, float flare) {
  float col = 0.;
  float d = length(uv);
  float m = .02 / d;

  float rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
  m += rays * flare;
  uv *= Rot(3.1415 / 4.);
  rays = max(0., 1. - abs(uv.x * uv.y * 1000.));
  m += rays * .3 * flare;

  m *= smoothstep(1., .2, d);

  return m;
}

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);

  return fract(p.x * p.y);
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offs = vec2(x, y);

      float n = Hash21(id + offs);
      float size = fract(n * 345.32);

      vec2 p = vec2(n, fract(n * 34.));

      float star = Star(gv - offs - p + .5, smoothstep(.8, 1., size) * .6);

      vec3 hueShift = fract(n * 2345.2 + dot(uv / 420., texture(iChannel0, vec2(0.25, 0.)).rg)) * vec3(.2, .3, .9) * 123.2;

      vec3 color = sin(hueShift) * .5 + .5;
      color = color * vec3(1., .25, 1. + size);

      star *= sin(iTime * 3. + n * 6.2831) * .4 + 1.;
      col += star * size * color;
    }
  }

  return col;

}

vec2 N(float angle) {
  return vec2(sin(angle), cos(angle));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec2 M = (iMouse.xy - iResolution.xy * .5) / iResolution.y;
  float t = iTime * .01;

  uv.x = abs(uv.x);
  uv.y += tan((5. / 6.) * 3.1415) * .5;

  vec2 n = N((5. / 6.) * 3.1415);
  float d = dot(uv - vec2(.5, 0.), n);
  uv -= n * max(0., d) * 2.;

  // col += smoothstep(.01, .0, abs(d));

  n = N((2. / 3.) * 3.1415);
  uv.x += 1.5 / 1.25;
  for (int i = 0; i < 5; i++) {
    uv *= 1.25;
    uv.x -= 1.5;

    uv.x = abs(uv.x);
    uv.x -= 0.5;
    uv -= n * min(0., dot(uv, n)) * 2.;
  }


  uv += M * 4.;

  uv *= Rot(t);
  vec3 col = vec3(0.);

  for (float i = 0.; i < 1.; i += 1. / NUM_LAYERS) {
    float depth = fract(i + t);
    float scale = mix(20., .5, depth);
    float fade = depth * smoothstep(1., .9, depth);
    col += StarLayer(uv * scale + i * 453.2) * fade;
  }

  fragColor = vec4(col, 1.0);
}`),
  },
];

export default SHADERS;
