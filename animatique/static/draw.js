var draw = {
  dragging: false,
  error: 4,

  init: function(fg, bg)
  {
    this.canvas_bg = bg;
    this.canvas_fg = fg;
    this.context_fg = this.canvas_fg.getContext("2d");
    this.context_bg = this.canvas_bg.getContext("2d");
    this.canvas_fg.addEventListener("mousedown", this, false);
    this.canvas_fg.addEventListener("mousemove", this, false);
    this.canvas_fg.addEventListener("mouseup", this, false);
    this.canvas_fg.addEventListener("touchstart", this, false);
    this.canvas_fg.addEventListener("touchmove", this, false);
    this.canvas_fg.addEventListener("touchend", this, false);
    window.addEventListener("resize", this, false);
    this.resize();
  },

  resize: function(e)
  {
    // TODO Save the bg canvas!
    this.canvas_fg.width = this.canvas_fg.offsetWidth;
    this.canvas_fg.height = this.canvas_fg.offsetHeight;
    this.canvas_bg.width = this.canvas_bg.offsetWidth;
    this.canvas_bg.height = this.canvas_bg.offsetHeight;
    this.context_bg.lineCap = "round";
    this.context_bg.lineJoin = "round";
    this.context_bg.lineWidth = 4;
    this.context_bg.strokeStyle = "#ff4040";
    this.offset_x = this.canvas_fg.offsetParent.offsetLeft;
    this.offset_y = this.canvas_fg.offsetParent.offsetTop;
    this.points = [];
  },

  // Handle DOM events for the canvas
  handleEvent: function(e)
  {
    e.preventDefault();
    if (e.type === "mousedown" || e.type === "touchstart") {
      this.dragging = true;
      this.context_fg.clearRect(0, 0, this.canvas_fg.width,
          this.canvas_fg.height);
      this.context_fg.beginPath();
      this.points = [];
      this.points.push(this.draw_line(e));
    } else if ((e.type === "mousemove" || e.type === "touchmove") &&
      this.dragging) {
      this.points.push(this.draw_line(e));
    } else if (e.type === "mouseup" || e.type === "touchend") {
      this.dragging = false;
      if (this.points.length > 1) {
        this.context_fg.clearRect(0, 0, this.canvas_fg.width,
            this.canvas_fg.height);
        this.draw_curve(fit_curve(this.points, this.error));
      }
      this.points = [];
    } else if (e.type === "resize") {
      this.resize();
    }
  },

  // Draw the result curve(s) from the point fitting
  draw_curve: function(curve)
  {
    this.context_bg.beginPath();
    curve.forEach((function(q, i) {
        this.context_bg.moveTo(q[0][0], q[0][1]);
        this.context_bg.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1],
          q[3][0], q[3][1]);
      }).bind(this));
    this.context_bg.stroke();
  },

  // Add a point to a path and draw line from the last two points
  draw_line: function(e)
  {
    var p_ = flexo.event_client_pos(e);
    var p = [p_.x - this.offset_x, p_.y - this.offset_y];
    var q = this.points[this.points.length - 1] || p;
    this.context_fg.beginPath();
    this.context_fg.moveTo(q[0], q[1]);
    this.context_fg.lineTo(p[0], p[1]);
    this.context_fg.stroke();
    return p;
  }
};



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
