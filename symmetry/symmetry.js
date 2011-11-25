// TODO test drag/drop support with:
// if('draggable' in document.createElement('span'))
// replace with file upload?

var sorry = document.getElementById("sorry");
if ("draggable" in sorry) sorry.parentNode.removeChild(sorry);

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

var canvas = document.querySelector("canvas");
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
    img = document.createElement("img")
    img.setAttribute("alt", file.name);
    img.src = window.webkitURL ? window.webkitURL.createObjectURL(file) :
      window.URL ? window.URL.createObjectURL(file) :
      createObjectURL(file);
    img.onload = function() {
      w = img.width * canvas.height / img.height;
      h = canvas.height;
      if (w > canvas.width) {
        w = canvas.width;
        h = img.height * canvas.width / img.width;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, w, h);
    };
  }
}

document.addEventListener("mousedown", mousedown, false);
[].forEach.call(document.querySelectorAll("a"), function(a) {
    a.addEventListener("mousedown",
      function(e) { e.stopPropagation(); }, false);
  });

var w, h, x, x0;
var moving = false;
var img = null;

function move_line(e)
{
  x = event_page_pos(e).x - canvas.offsetLeft;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#fcad00";
  context.drawImage(img, 0, 0, w, h);
  context.beginPath();
  context.moveTo(x, 0);
  context.lineTo(x, canvas.height);
  context.stroke();
}

function mirror()
{
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, w, h);
  if (x < 0 || x > w) return;
  setTimeout(function() {
    if (x0 < x) {
      context.clearRect(x + 1, 0, canvas.width - x, canvas.height);
      var image_data = context.getImageData(0, 0, canvas.width, canvas.height);
      for (var y_ = 0; y_ < h; ++y_) {
        for (var x_ = 0; x_ < x; ++x_) {
          var dest = 4 * (canvas.width * y_ + 2 * x - x_);
          var src = 4 * (canvas.width * y_ + x_);
          for (var i = 0; i < 4; ++i) {
            image_data.data[dest + i] = image_data.data[src + i];
          }
        }
      }
    } else {
      context.clearRect(0, 0, x, canvas.height);
      var image_data = context.getImageData(0, 0, canvas.width, canvas.height);
      for (var y_ = 0; y_ < h; ++y_) {
        for (var x_ = x; x_ < w; ++x_) {
          var dest = 4 * (canvas.width * y_ + 2 * x - x_);
          var src = 4 * (canvas.width * y_ + x_);
          for (var i = 0; i < 4; ++i) {
            image_data.data[dest + i] = image_data.data[src + i];
          }
        }
      }
    }
    context.putImageData(image_data, 0, 0);
  }, 0);
}

function mousedown(e)
{
  e.preventDefault();
  if (img) {
    move_line(e);
    x0 = x;
    document.addEventListener("mousemove", move_line, false);
    document.addEventListener("mouseup", mouseup, false);
  }
}

function mouseup(e)
{
  document.removeEventListener("mousemove", move_line, false);
  document.removeEventListener("mouseup", mouseup, false);
  mirror();
};

function save()
{
  if (img) window.open(canvas.toDataURL());
};
