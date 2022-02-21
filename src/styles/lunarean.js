// lunarean
// Status: Ready
// Twitter: @lunarean
// Fxhash: https://www.fxhash.xyz/u/lunarean
// Wallet: tz1Rakav1r6xMmrvYiXZjdvz3T1wNU4igoQM


import Style from './style'

export default class LunareanStyle extends Style {
  BLACK = "#000000";
  WHITE = "#FFFFFF";

  /*~ Strange entities travel through space. ~*/

  constructor (gridSizeX, gridSizeY, s, projectionCalculator3d, p5) {
    super(gridSizeX, gridSizeY, s, projectionCalculator3d, p5);

    this.proj = projectionCalculator3d;
    this.tiles = [];

    // vanishing point
    const [vanX, vanY] = this.proj.getProjectedPoint([0, 1000000, 0]);

    // set center of flare slightly below vanishing point
    [this.flareX, this.flareY] = [vanX, vanY + 0.02];

    // the only randomly chosen feature - each output is Perfect, Anima or Tranquil
    const dice = p5.random();
    this.feature1 = dice < 0.11 ? "Perfect" : dice < 0.11 + 0.13 ? "Anima" : "Tranquil";
    // console.log(this.feature1);
  }

  /*~ In the distance is a star. ~*/

  static author () {
    return "lunarean";
  }

  /*~ Nothing else is known. ~*/

  static name () {
    return "/nt/r/t///a/";
  }

  beforeDraw() {}

  // order of points: bl tl tr br
  drawTile(tile, frontLeftCorner3DCoord, isBorder) {
    this.tiles.push(tile.map(({x, y}) => [x, y]));
  }

  afterDraw() {
    const p5 = this._p5;
    const SIZE = this._s;

    const pd = p5.pixelDensity();
    p5.pixelDensity(2);

    // precalc
    this.mergeTiles();
    
    // set up canvas
    p5.background(this.BLACK);
    p5.colorMode(p5.HSB, 360, 100, 100, 1);
    p5.strokeCap(p5.SQUARE);

    // draw bg elements
    this.drawBgTriangles();
    this.drawBgGradient();
    this.drawFlare();

    // draw rugs
    for (let i = 0; i < 20; i++) {
      this.drawRug(0.5);
    }

    // draw stars
    for (const tile of this.tiles) {
      const [mx, my] = this.centroid(tile);
      this.drawFragment("stars", tile, 0.03, this.modifyAlpha(this.WHITE, p5.random(0.1, 0.15)));
    }

    // draw tiles
    for (const tile of this.tiles) {
      this.drawFragment("base", tile, 0.8, this.WHITE, 1);
    }

    // draw debris
    for (const tile of this.tiles) {
      for (let i = 0; i < 3; i++) {
        this.drawFragment("debris", tile, 0.08, this.modifyAlpha(this.BLACK, 0.8));
      }
    }

    this.drawGrains(24);

    // this.drawWireframe();
    // console.log("done");

    // revert pixel density
    p5._pixelDensity = pd;
  }

  // randomly merge adjacent tiles
  mergeTiles() {
    const p5 = this._p5;

    for (let i = 0; i < 10000; i++) {
      let a = p5.int(p5.random(this.tiles.length));
      let b = p5.int(p5.random(this.tiles.length));
      if (a === b) {
        continue;
      }
      if (a > b) {
        [a, b] = [b, a];
      }

      const eps = 1e-6;
      if (p5.dist(...this.tiles[a][0], ...this.tiles[b][3]) < eps && p5.dist(...this.tiles[a][1], ...this.tiles[b][2]) < eps) {
        // a is left, b is right
        this.tiles[a] = [
          this.tiles[b][0],
          this.tiles[b][1],
          this.tiles[a][2],
          this.tiles[a][3],
        ]
        this.tiles.splice(b, 1);
      } else if (p5.dist(...this.tiles[a][0], ...this.tiles[b][1]) < eps && p5.dist(...this.tiles[a][3], ...this.tiles[b][2]) < eps) {
        // a is top, b is bottom
        this.tiles[a] = [
          this.tiles[b][0],
          this.tiles[a][1],
          this.tiles[a][2],
          this.tiles[b][3],
        ]
        this.tiles.splice(b, 1);
      }
    }
  }

  /*~ Are they alive? ~*/

  drawBgGradient() {
    const p5 = this._p5;
    const SIZE = this._s;

    p5.fill(this.modifyAlpha(this.WHITE, 0.002));
    p5.noStroke();
    for (let i = 1; i < 20; i++) {
      const h = i * 0.03;
      const y = this.flareY - h/2;
      p5.rect(0, y * SIZE, SIZE, h * SIZE);
    }
  }

  /*~ Are they sentient? ~*/

  drawBgTriangles() {
    const p5 = this._p5;
    const SIZE = this._s;

    const points = [[0, 1], [0, 0], [1, 0], [1, 1]];
    const triangles = this.triangulateQuad(points, 0.02);

    for (let triangle of triangles) {
      if (p5.random() < 0.1) {
        continue;
      }
      let [a, b, c, mod] = triangle;

      // subdivide triangle - usually produces scribbled lines
      if (p5.random() < 0.02) {
        triangles.push(...this.triangulateQuad([a, b, c, a], 0.01));
      }

      // set stroke wider at bottom and top
      const [mx, my] = this.centroid([a, b, c]);
      const alpha = p5.max(p5.map(my, this.flareY, 1, 0, 0.12), p5.map(my, 0.5, 0, 0, 0.08), 0.04);
      p5.stroke(this.modifyAlpha(this.WHITE, alpha));

      // warp
      [a, b, c] = [a, b, c].map(([x, y]) => {
        y = p5.pow(y, 1.5);
        return [x * SIZE, y * SIZE];
      })

      const sw = p5.random() < 0.03 ? 0.0005 : 0.00025;
      p5.strokeWeight(sw * SIZE);
      p5.line(...b, ...c);
      p5.line(...c, ...a);
      p5.line(...a, ...b); 
    }
  }

  drawFlare() {
    const p5 = this._p5;
    const SIZE = this._s;

    // use separate layer because for some reason updatePixels() interferes with canvas
    const layer = p5.createGraphics(SIZE, SIZE);
    layer.stroke(this.modifyAlpha(this.WHITE, 0.012));
    layer.strokeWeight(0.0003 * SIZE);

    // draw radiants
    const numRadiants = 24000;
    for (let i = 0; i < numRadiants; i++) {
      let step = p5.random();
      const theta = p5.random(p5.TWO_PI);
      const ax = this.flareX - step * p5.cos(theta);
      const ay = this.flareY - step * p5.sin(theta);
      const bx = this.flareX + step * p5.cos(theta);
      const by = this.flareY + step * p5.sin(theta);
      layer.line(ax * SIZE, ay * SIZE, bx * SIZE, by * SIZE)
    }

    // make center brighter
    let n = 20;
    for (let i = 1; i < n; i++) {
      const r = i * 0.004;
      const alpha = 0.3 * p5.sq(p5.map(i, 0, n, 1, 0));
      layer.fill(this.modifyAlpha(this.WHITE, alpha));
      layer.ellipse(this.flareX * SIZE, this.flareY * SIZE, r * SIZE, r * SIZE)
    }
    p5.image(layer.get(), 0, 0);
  }

  drawRug(sizeMod) {
    const p5 = this._p5;
    const SIZE = this._s;

    const alpha = 0.16;
    p5.stroke(this.modifyAlpha(this.WHITE, alpha));

    const noiseAmpl = 0.01;
    const noiseScale = 30;

    const phaseX = p5.random(p5.TWO_PI);
    const phaseY = p5.random(p5.TWO_PI);
    const freqX = p5.random(30, 40);
    const freqY = p5.random(30, 40);

    const minY = 0;
    const maxY = 1;

    const w = sizeMod * p5.random(0.4, 0.5);
    const h = sizeMod * p5.random(0.2, 0.3);
    const x = p5.random(0.1, 0.9-w);
    const y = p5.map(p5.sqrt(p5.random()), 0, 1, minY, maxY-h);
    const sc = (y + h - this.flareY) / (y - this.flareY);

    let points = [
      this.lerp2([this.flareX, this.flareY], [x, y], sc),
      [x, y],
      [x+w, y],
      this.lerp2([this.flareX, this.flareY], [x+w, y], sc)
    ]

    // add gaussian noise
    const sd = 0.05;
    points = points.map(([x, y]) => [x + sd * p5.randomGaussian(), y + sd * p5.randomGaussian()]);

    // rotate
    const density = 0.2;
    const triangles = this.triangulateQuad(points, density);
    for (let triangle of triangles) {
      let [a, b, c, mod] = triangle;

      // warp
      [a, b, c] = [a, b, c].map(([x, y]) => {
        x += noiseAmpl * p5.noise(noiseScale * x, noiseScale * y, 0);
        y += noiseAmpl * p5.noise(noiseScale * x, noiseScale * y, 1);
        x += 0.007 * p5.sin(freqX * y + phaseX)
        y += 0.007 * p5.sin(freqY * x + phaseY)
        return [x * SIZE, y * SIZE];
      })

      const swSd = 0.06;
      const sw = 0.0005 * p5.exp(swSd * mod);
      p5.strokeWeight(sw * SIZE);
      p5.point(...a);
    }
  }

  /*~ Where do they come from? ~*/

  drawFragment(fragmentType, points, scaleMod, strokeColor) {
    const p5 = this._p5;
    const SIZE = this._s;

    const isStars = fragmentType === "stars";
    const isBase = fragmentType === "base";
    const isDebris = fragmentType === "debris";

    p5.noFill();
    p5.noStroke();

    // center of rectangle
    const [mx, my] = this.centroid(points);

    const liftProb = p5.sqrt(p5.map(my, this.flareY, 1, 1, 0));
    const isLift = p5.random() < liftProb;

    const noiseAmpl = this.feature1 === "Perfect" ? 0 : this.feature1 === "Anima" ? 0.02 : 0.01;
    const noiseScale = 30;

    const phaseY = p5.random(p5.TWO_PI);
    const freqY = p5.random(30, 40);

    let offsetX = 0;
    let offsetY = 0;
    if (isStars || isDebris) {
      offsetX = 0.3 * p5.randomGaussian();
      offsetY = -0.3 * p5.abs(p5.randomGaussian());
    } else if (isBase) {
      offsetX = isLift ? 0.1 * (1-my) * p5.randomGaussian() : 0;
      offsetY = isLift ? -0.12 * (1-my) * p5.abs(p5.randomGaussian()) : 0;
      if (isLift) {
        scaleMod *= 0.8;
      }
    }

    // convert to 3d and scale
    scaleMod *= p5.random(0.9, 1.1);
    const scaleX = scaleMod;
    const scaleY = scaleMod;
    const [pmx, pmy] = this.centroid(points.map(([x, y]) => this.unproject(x, y)));
    points = points.map(([x_, y_]) => {
      return this.projectMap(x_, y_, (x, y, z) => {
        x = p5.lerp(pmx, x, scaleX);
        y = p5.lerp(pmy, y, scaleY);
        return [x, y, z];
      });
    })

    // add gaussian noise
    let sdMod = isDebris ? 0.1 : isBase && isLift ? 0.03 : 0;
    const sd = sdMod * p5.dist(...points[0], ...points[3]);
    points = points.map(([x, y]) => [x + sd * p5.randomGaussian(), y + sd * p5.randomGaussian()]);

    const swMod = p5.randomGaussian();
    const densityMod = isDebris ? 0.1 : 0.8;
    const skipProb = isBase ? (isLift ? 0.04 : 0.4 * p5.map(my, this.flareY, 1, 0.1, 1)) : 0;
    const jumpProb = 0.2 * p5.sq(p5.max(p5.map(my, this.flareY, 1, -0.5, 1), 0.1));

    const tileSize = p5.dist(...points[0], ...points[3]);
    const isPerturb = tileSize < 0.015 && p5.random() < 0.05;
    const perturbSd = 0.001;

    for (let triangle of this.triangulateQuad(points, densityMod)) {
      if (!isDebris && p5.random() < skipProb) {
        continue;
      }
      let [a, b, c, mod] = triangle;

      // chance of jumping outside rectangle
      const isJump = p5.random() < jumpProb;
      const jumpX = isJump ? 0.03 * p5.randomGaussian() : 0;
      const jumpY = isJump ? 0.03 * p5.abs(p5.randomGaussian()) : 0;

      // warp
      const [tx, ty] = this.centroid([a, b, c]);
      [a, b, c] = [a, b, c].map(([x, y]) => {
        x += noiseAmpl * p5.noise(noiseScale * x, noiseScale * y, 0);
        y += noiseAmpl * p5.noise(noiseScale * x, noiseScale * y, 1);
        x += offsetX + jumpX;
        y += offsetY + jumpY;
        if (isBase) {
          y += 0.006 * y * p5.sin(freqY * x + phaseY)
        }
        if (isPerturb) {
          x += perturbSd * p5.randomGaussian();
          y += perturbSd * p5.randomGaussian();
        }

        // make vertices glow
        if (!isLift) {
          x = p5.lerp(tx, x, 1.2);
          y = p5.lerp(ty, y, 1.2);
        }
        return [x * SIZE, y * SIZE];
      })

      if (isDebris) {
        const db = p5.random(-0.5, 0.5);
        p5.fill(strokeColor)

        // draw filled triangle
        p5.beginShape();
        p5.vertex(...a);
        p5.vertex(...b);
        p5.vertex(...c);
        p5.endShape();

      } else {
        const db = p5.random(-2, 2);
        p5.stroke(strokeColor)

        const ampl = isLift ? p5.sq(p5.constrain(p5.map(ty, this.flareY-0.1, 1, 1, 0), p5.sqrt(0.1), 1)) : 0.025;
        const sw = isStars ? 0.001 : 0.0008 * p5.exp(0.1 * mod + 0.12 * swMod) * ampl;
        p5.strokeWeight(sw * SIZE);

        // draw triangle edges
        p5.line(...b, ...c);
        p5.line(...c, ...a);
        p5.line(...a, ...b);
      }
    }
  }

  triangulateQuad([a, b, c, d], densityMod=1) {
    const p5 = this._p5;

    const initial = this.randomPointInside([a, b, c, d]);
    const q = p5.shuffle([
      [a, initial, b, 0],
      [b, initial, c, 0],
      [c, initial, d, 0],
      [d, initial, a, 0],
    ])

    const density = p5.random(0.8, 1) * 500000 * densityMod;
    const numPoints = p5.ceil(density * (this.area(a, b, c) + this.area(c, d, a)));
    return this.triangulate(q, numPoints, 0.4);
  }

  /*~ How long have they been drifting through space? ~*/

  triangulate(q, numSteps, minSide) {
    const p5 = this._p5;

    for (let i = 0; i < numSteps; i++) {
      let [a, b, c, mod] = q.shift();

      const sideLengths = [
        p5.dist(...b, ...c),
        p5.dist(...c, ...a),
        p5.dist(...a, ...b),
      ];
      const index = sideLengths.indexOf(p5.max(sideLengths));

      let abc = [a, b, c];
      a = abc[index];
      b = abc[(index+1) % 3];
      c = abc[(index+2) % 3];

      const w = p5.lerp(minSide, 1-minSide, p5.random())
      let [[bx, by], [cx, cy]] = [b, c];
      const d = [p5.lerp(bx, cx, w), p5.lerp(by, cy, w)];

      let tri1 = [a, b, d, mod + p5.randomGaussian()];
      let tri2 = [a, d, c, mod + p5.randomGaussian()];
      if (this.area(...[a, b, d]) < this.area(...[a, d, c])) {
        q.push(tri2);
        q.push(tri1);
      } else {
        q.push(tri1);
        q.push(tri2);
      }
    }
    return q;
  }

  area([ax, ay], [bx, by], [cx, cy]) {
    const crossProduct = ax * (by - cy) + bx * (cy - ay) + cx * (ay - by);
    return crossProduct / 2;
  }

  centroid(points) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of points) {
      sx += x;
      sy += y;
    }
    return [sx / points.length, sy / points.length];
  }

  randomPointInside([[ax, ay], [bx, by], [cx, cy], [dx, dy]]) {
    const p5 = this._p5;
    const [aw, bw, cw, dw] = [p5.random(), p5.random(), p5.random(), p5.random()];
    const total = (aw + bw + cw + dw);
    const mx = (aw*ax + bw*bx + cw*cx + dw*dx) / total;
    const my = (aw*ay + bw*by + cw*cy + dw*dy) / total;
    return [mx, my];
  }

  unproject(x, y) {
    const [px, py, pz] = this.proj.getUnprojectedPoint([x, y], 1)
    return [px, py];
  }

  projectMap(x, y, f) {
    const [px, py, pz] = this.proj.getUnprojectedPoint([x, y], 1)
    return this.proj.getProjectedPoint(f(px, py, pz))
  }

  lerp2([ax, ay], [bx, by], w) {
    const p5 = this._p5;
    return [p5.lerp(ax, bx, w), p5.lerp(ay, by, w)];
  }

  // for checking tile positions vs original ones
  drawWireframe() {
    const p5 = this._p5;
    const SIZE = this._s;

    p5.noFill();
    p5.stroke("yellow")
    p5.strokeWeight(0.001 * SIZE)
    for (const tile of this.tiles) {
      p5.beginShape();
      for (const [x, y] of tile) {
        p5.vertex(x * SIZE, y * SIZE);
      }
      p5.endShape(p5.CLOSE);
    }
  }

  drawGrains(ampl) {
    const p5 = this._p5;
    const SIZE = this._s;

    const pd = p5.pixelDensity();
    const n = 4 * p5.sq(pd * SIZE);

    p5.loadPixels();
    for (let i = 0; i < n; i += 4) {
      // perturb each pixel
      const d = ampl * (p5.random() - p5.random());
      p5.pixels[i] += d; // red
      p5.pixels[i+1] += d; // green
      p5.pixels[i+2] += d; // blue
    }
    p5.updatePixels();
  }

  modifyAlpha(base, a) {
    const p5 = this._p5;
    return p5.color(p5.hue(base), p5.saturation(base), p5.brightness(base), a);
  }

  /*~ i//e/s/ell/r ~*/
}
