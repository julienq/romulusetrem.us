"use strict";

var request_animation_frame = (window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame || window.oRequestAnimationFrame).bind(window);

var cancel_animation_frame = (window.cancelAnimationFrame ||
  window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame ||
  window.msCancelAnimationFrame || window.oCancelAnimationFrame).bind(window);

var screen_vb = document.getElementById("screen").getBBox();
var chr_vb = { width: 8, height: 8 };
var g = document.querySelector("g");

var x = 0;
var y = 0;
var new_lines = 2;
var row;

function print(chr) {
  if (x === 0) {
    row = g.appendChild(flexo.$g({ transform: "translate(0, {0})".fmt(y) }));
  }
  row.appendChild(flexo.$use({ x: x, "xlink:href": "#chr${0}".fmt(chr) }));
  x += chr_vb.width;
  if (x >= screen_vb.width) {
    x = 0;
    y += chr_vb.height;
    if (y >= screen_vb.height) {
      y -= new_lines * chr_vb.height;
      for (var i = 0; i < new_lines; ++i) {
        g.removeChild(g.firstChild);
      }
      for (var r = g.firstChild, ty = 0; r;
        r = r.nextSibling, ty += chr_vb.height) {
        r.setAttribute("transform", "translate(0, {0})".fmt(ty));
      }
    }
  }
}

var twice = false;

function p() {
  print(Math.floor(205.5 + Math.random()));
  if (twice) {
    print(Math.floor(205.5 + Math.random()));
  }
  twice = !twice;
  req = request_animation_frame(p);
}

var req = request_animation_frame(p);

document.addEventListener("mouseup", function () {
  if (req) {
    cancel_animation_frame(req);
    req = null;
  } else {
    req = request_animation_frame(p);
  }
}, false);


