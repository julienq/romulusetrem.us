// Simple format function for messages and templates. Use {0}, {1}...
// as slots for parameters. Missing parameters are replaced with the empty
// string.
String.prototype.fmt = function()
{
  var args = [].slice.call(arguments);
  return this.replace(/{(\d+)}/g, function(_, p) {
      return args[p] === undefined ? "" : args[p];
    });
};

// Append a class to an element (if it does not contain it already)
function add_class(elem, c)
{
  var k = elem.getAttribute("class") || "";
  if (!has_class(elem, c)) {
    elem.setAttribute("class", "{0}{1}{2}".fmt(k, k ? " " : "", c));
  }
}

// Test whether an element has the given class
function has_class(elem, c)
{
  return (new RegExp("\\b{0}\\b".fmt(c)))
    .test(elem.getAttribute("class") || "");
}

// Remove the given class from an element and return it. If it did not have
// the class to start with, return an empty string.
function remove_class(elem, c)
{
  var removed = "";
  var k = (elem.getAttribute("class") || "")
    .replace(new RegExp("\\s*{0}\\b".fmt(c)),
        function(str) { removed = str; return ""; });
  if (/\S/.test(k)) {
    elem.setAttribute("class", k);
  } else {
    elem.removeAttribute("class");
  }
  return removed;
}

// Get clientX/clientY as an object { x: ..., y: ... } for events that may
// be either a mouse event or a touch event, in which case the position of
// the first touch is returned.
function event_page_pos(e)
{
  if (e.pageX) {
    return { x: e.pageX, y: e.pageY };
	} else {
    return { x: e.clientX + document.body.scrollLeft +
      document.documentElement.scrollLeft, y: e.clientY +
      document.body.scrollTop + document.documentElement.scrollTop };
	}
};

var w, h, ratio, x, x0;
var can_save = false;
var img = null;

var canvas = document.querySelector("canvas");
var w_orig = canvas.width;
var h_orig = canvas.height;
var context = canvas.getContext("2d");

canvas.addEventListener("dragenter", dragenter, false);
canvas.addEventListener("dragover", dragover, false);
canvas.addEventListener("dragleave", dragleave, false);
canvas.addEventListener("drop", drop, false);

function dragenter(e)
{
  e.preventDefault();
  add_class(e.target, "drag");
}

function dragover(e)
{
  e.preventDefault();
}

function dragleave(e)
{
  e.preventDefault();
  remove_class(e.target, "drag");
}

function drop(e)
{
  e.preventDefault();
  remove_class(e.target, "drag");
  var file = e.dataTransfer.files[0];
  if (file && file.type.match(/^image\/.*/)) {
    can_save = false;
    img = document.createElement("img")
    img.src = window.webkitURL ? window.webkitURL.createObjectURL(file) :
      window.URL ? window.URL.createObjectURL(file) :
      createObjectURL(file);
    img.onload = draw_img;
  }
}

function draw_img()
{
  w = img.width * h_orig / img.height;
  h = h_orig;
  var max_w = window.innerWidth / 3;
  if (w > max_w) {
    w = max_w;
    h = img.height * max_w / img.width;
  }
  canvas.width = 3 * w;
  canvas.height = h;
  context.drawImage(img, 0, 0, img.width, img.height, w, 0, w, h);
  ratio = img.width / w;
  can_save = false;
}

document.addEventListener("mousedown", mousedown, false);
function stop(e) { e.stopPropagation(); }
[].forEach.call(document.querySelectorAll("a"), function(a) {
    a.addEventListener("mousedown", stop, false);
  });
var input = document.querySelector("input");
input.addEventListener("mousedown", stop, false);
input.addEventListener("change", function(e) {
    can_save = false;
    img = document.createElement("img")
    img.src = input.value;
    img.onload = draw_img;
  }, false);

function move_line(e, set_x0)
{
  x = event_page_pos(e).x - canvas.offsetLeft;
  if (x < w || x > 2 * w) return;
  if (set_x0) {
    x0 = x;
    can_save = true;
  }
  context.clearRect(0, 0, 3 * w, h);
  context.globalAlpha = 0.1;
  context.drawImage(img, 0, 0, img.width, img.height, w, 0, w, h);
  context.globalAlpha = 1;
  var dx = x - x0;
  if (dx < 0) {
    var x_ = Math.max(x - w, 0);
    var w_ = Math.min(-dx, x0 - w);
    context.drawImage(img, x_ * ratio, 0, w_ * ratio, img.height, x_ + w, 0, w_, h);
    context.save();
    context.scale(-1, 1);
    context.drawImage(img, x_ * ratio, 0, w_ * ratio,
        img.height, -w_ - x0, 0, w_, h);
    context.restore();
  } else if (dx > 0) {
    var x_ = Math.max(x - w, w);
    var w_ = Math.min(dx, 2 * w - x0);
    context.drawImage(img, (x0 - w) * ratio, 0, w_ * ratio, img.height, x0, 0,
        w_, h);
    context.save();
    context.scale(-1, 1);
    context.drawImage(img, (x0 - w) * ratio, 0, w_ * ratio, img.height, -x0,
        0, w_, h);
    context.restore();
  }
}

function mousedown(e)
{
  e.preventDefault();
  if (img) {
    move_line(e, true);
    document.addEventListener("mousemove", move_line, false);
    document.addEventListener("mouseup", mouseup, false);
  }
}

function mouseup(e)
{
  document.removeEventListener("mousemove", move_line, false);
  document.removeEventListener("mouseup", mouseup, false);
};

// "Save" the current image by opening it in a different window
window.save_image = function()
{
  if (can_save) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.height = h;
    var dx = x - x0;
    if (dx < 0) {
      var x_ = Math.max(x - w, 0);
      var w_ = Math.min(-dx, x0 - w);
      canvas.width = 2 * w_;
      context.drawImage(img, x_ * ratio, 0, w_ * ratio, img.height, 0, 0, w_, h);
      context.save();
      context.scale(-1, 1);
      context.drawImage(img, x_ * ratio, 0, w_ * ratio,
          img.height, -2 * w_, 0, w_, h);
      context.restore();
    } else if (dx > 0) {
      var x_ = Math.max(x - w, w);
      var w_ = Math.min(dx, 2 * w - x0);
      canvas.width = 2 * w_;
      context.drawImage(img, (x0 - w) * ratio, 0, w_ * ratio, img.height,
          w_, 0, w_, h);
      context.save();
      context.scale(-1, 1);
      context.drawImage(img, (x0 - w) * ratio, 0, w_ * ratio, img.height,
          -w_, 0, w_, h);
      context.restore();
    }
    try {
      window.open(canvas.toDataURL());
      canvas = null;
    } catch (e) {
      alert(e);
    }
  }
};

window.retry = function()
{
  if (img) draw_img();
};
