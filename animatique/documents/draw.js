// TODO
// [x] SVGfy
// [x] save
// [x] undo
// [x] redo
// [ ] several images

var svg_draw =
{
  // Init a new SVG canvas for drawing
  init: function(div, error)
  {
    this.error = error || 4;
    this.defs = flexo.svg("defs");
    div.parentNode.insertBefore(this.defs, div);
    this.svg = flexo.svg("svg");
    this.svg.setAttribute("stroke-linejoin", "round");
    this.svg.setAttribute("stroke-linecap", "round");
    this.svg.setAttribute("stroke", "#ff4040");
    this.svg.setAttribute("stroke-width", "4");
    this.svg.setAttribute("fill", "none");
    this.svg.setAttribute("viewBox", "0 0 {0} {1}".fmt(div.offsetWidth,
          div.offsetHeight))
    div.appendChild(this.svg);
    this.use = flexo.svg("use");
    this.svg.appendChild(this.use);
    this.svg.addEventListener("mousedown", this, false);
    return this;
  },

  // Create a new image
  new_image: function(f)
  {
    this.image = flexo.svg("g");
    var redo = flexo.svg("g");
    redo.setAttribute("display", "none");
    this.image.appendChild(redo);
    this.svg.appendChild(this.image);
    flexo.request_uri("/id", (function(req) {
        this.image.setAttribute("id", JSON.parse(req.responseText).id);
        this.defs.appendChild(this.image);
        this.use.setAttributeNS(flexo.XLINK_NS, "href", "#" + this.image.id);
        f(this.image);
      }).bind(this));
  },

  // Handle mouse events
  handleEvent: function(e)
  {
    e.preventDefault();
    var p = flexo.event_svg_point(e, this.svg);
    if (e.type === "mousedown" && e.button === 0) {
      document.addEventListener("mousemove", this, false);
      document.addEventListener("mouseup", this, false);
      this.__points = [[p.x, p.y]];
      this.__path = flexo.svg("path");
      this.__path.setAttribute("d", "M{0},{1}".fmt(p.x, p.y));
      this.image.appendChild(this.__path);
    } else if (e.type === "mousemove") {
      this.__points.push([p.x, p.y]);
      this.__path.setAttribute("d", "{0}L{1},{2}"
          .fmt(this.__path.getAttribute("d"), p.x, p.y));
    } else if (e.type === "mouseup") {
      document.removeEventListener("mousemove", this, false);
      document.removeEventListener("mouseup", this, false);
      if (this.__points.length > 1) {
        this.__path.setAttribute("d",
          d_from_points(fit_curve(this.__points, this.error)));
      } else {
        this.__path.setAttribute("d", "{0}L{1},{2}"
            .fmt(this.__path.getAttribute("d"), p.x, p.y));
      }
      delete this.__path;
      delete this.__points;
      flexo.remove_children(this.image.firstElementChild);
    }
  },

  // Undo the last stroke if any
  undo: function()
  {
    var last = this.image.lastElementChild;
    if (last) {
      this.image.removeChild(last);
      this.image.firstChild.appendChild(last);
    }
  },

  // Redo the last undone stroke if any
  redo: function()
  {
    var redo = this.image.firstElementChild;
    var last = redo.lastElementChild;
    if (last) {
      redo.removeChild(last);
      this.image.appendChild(last);
    }
  },

  // Save the current image
  save: function()
  {
    var req = new XMLHttpRequest();
    req.open("POST", "/save/" + this.image.id + ".svg");
    req.setRequestHeader("Content-type", "image/svg+xml");
    req.send(draw.svg.parentNode.innerHTML.replace(/<svg /,
      "<svg xmlns=\"{0}\" ".fmt(flexo.SVG_NS)));
  },
};

function d_from_points(points)
{
  var d = "M{0},{1}".fmt(points[0][0][0].toPrecision(3),
      points[0][0][1].toPrecision(3));
  points.forEach(function(q, i) {
      d += "C{0},{1} {2},{3} {4},{5}".fmt(q[1][0].toPrecision(3),
        q[1][1].toPrecision(3), q[2][0].toPrecision(3), q[2][1].toPrecision(3),
        q[3][0].toPrecision(3), q[3][1].toPrecision(3));
    });
  return d;
}


// An adaptation of paper.js's implementation of Schneider's method
// Copyright (c) 2011, Juerg Lehni & Jonathan Puckey
// http://lehni.org/ & http://jonathanpuckey.com/

// Fit the set of points to one or several Bézier curves within the error
// margin
function fit_curve(points, error)
{
  var n = points.length - 1;
  return fit_cubic(points, 0, n, normalize_v2(diff_v2(points[1], points[0])),
      normalize_v2(diff_v2(points[n - 2], points[n - 1])), error);
}

// Fit a Bézier curve to a (sub)set of digitized points
function fit_cubic(points, first, last, tan1, tan2, error)
{
  if (last - first === 1) {
    var p1 = points[first];
    var p2 = points[last];
    var dist = distance(p1, p2) / 3;
    return [[p1, add_v2(p1, scale_v2(tan1, dist)),
           add_v2(p2, scale_v2(tan2, dist)), p2]];
  }
  var u = chord_length_parameterize(points, first, last);
  var max_error = Math.max(error, error * error);
  for (var i = 0; i <= 4; ++i) {
    var curve = generate_bezier(points, first, last, u, tan1, tan2);
    var max = find_max_error(points, first, last, curve, u);
    if (max[0] < error) return [curve];
    var split = max[1];
    if (max[0] >= max_error) break;
    reparameterize(points, first, last, u, curve);
    max_error = max[0];
  }
  var v1 = diff_v2(points[split - 1], points[split]);
  var v2 = diff_v2(points[split], points[split + 1]);
  var tan_c = normalize_v2(multiply_v2(add_v2(v1, v2), .5));
  var curves = fit_cubic(points, first, split, tan1, tan_c, error);
  [].push.apply(curves,
      fit_cubic(points, split, last, multiply_v2(tan_c, -1), tan2, error));
  return curves;
}

// Use least-squares method to find Bezier control points for region.
function generate_bezier(points, first, last, u_, tan1, tan2)
{
  var p1 = points[first];
  var p2 = points[last];
  var C = [[0, 0], [0, 0]];
  var X = [0, 0];
  var l = last - first + 1;
  for (var i = 0; i < l; ++i) {
    var u = u_[i];
    var t = 1 - u;
    var b = 3 * u * t;
    var b0 = t * t * t;
    var b1 = b * t;
    var b2 = b * u;
    var b3 = u * u * u;
    var a1 = scale_v2(tan1, b1);
    var a2 = scale_v2(tan2, b2);
    C[0][0] += dot_v2(a1, a1);
    C[0][1] += dot_v2(a1, a2);
    C[1][0] = C[0][1];
    C[1][1] += dot_v2(a2, a2);
    var tmp = diff_v2(diff_v2(points[first + i], multiply_v2(p1, b0 + b1)),
        multiply_v2(p2, b2 + b3));
    X[0] += dot_v2(a1, tmp);
    X[1] += dot_v2(a2, tmp);
  }
  // Compute the determinants of C and X
  var det_C0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
  var epsilon = 1e-6;
  var alpha1, alpha2;
  if (Math.abs(det_C0C1) > epsilon) {
    // Kramer's rule
    var det_C0X = C[0][0] * X[1]    - C[1][0] * X[0];
    var det_XC1 = X[0]    * C[1][1] - X[1]    * C[0][1];
    // Derive alpha values
    alpha1 = det_XC1 / det_C0C1;
    alpha2 = det_C0X / det_C0C1;
  } else {
    // Matrix is under-determined, try assuming alpha1 == alpha2
    var c0 = C[0][0] + C[0][1];
    var c1 = C[1][0] + C[1][1];
    if (Math.abs(c0) > epsilon) {
      alpha1 = alpha2 = X[0] / c0;
    } else if (Math.abs(c1) > epsilon) {
      alpha1 = alpha2 = X[1] / c1;
    } else {
      // Handle below
      alpha1 = alpha2 = 0;
    }
  }
  // If alpha negative, use the Wu/Barsky heuristic (see text)
  // (if alpha is 0, you get coincident control points that lead to
  // divide by zero in any subsequent NewtonRaphsonRootFind() call.
  var seg_length = distance(p2, p1);
  epsilon *= seg_length;
  if (alpha1 < epsilon || alpha2 < epsilon) {
    // fall back on standard (probably inaccurate) formula,
    // and subdivide further if needed.
    alpha1 = alpha2 = seg_length / 3;
  }
  // First and last control points of the Bezier curve are
  // positioned exactly at the first and last data points
  // Control points 1 and 2 are positioned an alpha distance out
  // on the tangent vectors, left and right, respectively
  return [p1, add_v2(p1, scale_v2(tan1, alpha1)),
         add_v2(p2, scale_v2(tan2, alpha2)), p2];
}

// Assign parameter values to digitized points using relative distances between
// points.
function chord_length_parameterize(points, first, last)
{
  var u = [0];
  for (var i = first + 1; i <= last; i++) {
    u[i - first] = u[i - first - 1] + distance(points[i], points[i - 1]);
  }
  for (var i = 1, m = last - first; i <= m; i++) u[i] /= u[m];
  return u;
}

// Given set of points and their parameterization, try to find a better
// parameterization.
function reparameterize(points, first, last, u, curve) {
  for (var i = first; i <= last; i++) {
    u[i - first] = find_root(curve, points[i], u[i - first]);
  }
}

// Use Newton-Raphson iteration to find better root.
function find_root(curve, p, u)
{
  var curve1 = [];
  var curve2 = [];
  // Generate control vertices for Q'
  for (var i = 0; i <= 2; i++) {
    curve1[i] = multiply_v2(diff_v2(curve[i + 1], curve[i]), 3);
  }
  // Generate control vertices for Q''
  for (var i = 0; i <= 1; i++) {
    curve2[i] = multiply_v2(diff_v2(curve1[i + 1], curve1[i]), 2);
  }
  // Compute Q(u), Q'(u) and Q''(u)
  var p0 = eval_bezier(3, curve, u);
  var p1 = eval_bezier(2, curve1, u);
  var p2 = eval_bezier(1, curve2, u);
  var diff = diff_v2(p0, p);
  var df = dot_v2(p1, p1) + dot_v2(diff, p2);
  // Compute f(u) / f'(u)
  if (Math.abs(df) < 1e-6) return u;
  // u = u - f(u) / f'(u)
  return u - dot_v2(diff, p1) / df;
}

// Evaluate a Bezier curve at a particular parameter value
function eval_bezier(degree, curve, t)
{
  // Copy array
  var tmp = curve.slice();
  // Triangle computation
  for (var i = 1; i <= degree; i++) {
    for (var j = 0; j <= degree - i; j++) {
      tmp[j] = add_v2(multiply_v2(tmp[j], 1 - t),
          multiply_v2(tmp[j + 1], t));
    }
  }
  return tmp[0];
}

// Find the maximum squared distance of digitized points to fitted curve.
function find_max_error(points, first, last, curve, u)
{
  var index = Math.floor((last - first + 1) / 2);
  var max_dist = 0;
  for (var i = first + 1; i < last; i++) {
    var p = eval_bezier(3, curve, u[i - first]);
    var v = diff_v2(p, points[i]);
    var dist = v[0] * v[0] + v[1] * v[1]
    if (dist >= max_dist) {
      max_dist = dist;
      index = i;
    }
  }
  return [max_dist, index];
}


// Distance between 2 points
function distance(p1, p2) { return length_v2(diff_v2(p1, p2)); }

// Length of a vector
function length_v2(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }

// Difference of two 2D vectors
function diff_v2(v1, v2) { return [v1[0] - v2[0], v1[1] - v2[1]]; }

// Sum of two 2D vectors
function add_v2(v1, v2) { return [v1[0] + v2[0], v1[1] + v2[1]]; }

function multiply_v2(v1, m) { return [v1[0] * m, v1[1] * m]; }

// Scale a (2D) vector to length l (provided that its length is not 0)
function scale_v2(v, l)
{
  var len = length_v2(v);
  if (len == 0) return v;
  l /= len;
  return [v[0] * l, v[1] * l];
}

function squared_dist(p1, p2)
{
  var dx = p1[0] - p2[0];
  var dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

function dot_v2(v1, v2) { return v1[0] * v2[0] + v1[1] * v2[1]; }

// Normalize a (2D) vector to length 1 (provided that its length is not 0)
function normalize_v2(v)
{
  var len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	return len == 0 ? v : [v[0] / len, v[1] / len];
}
