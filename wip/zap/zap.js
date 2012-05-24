// Zap is a simple library for building games using SVG.
// This is a work in progress so the API is subject to change at any time.

(function(zap) {
  "use strict";

  var SVG = document.querySelector("svg"), resize;

  function resize_fit() {
    var vb = SVG.viewBox.baseVal,
      w = window.innerWidth,
      h = window.innerHeight;
    resize_scale(Math.min(w / vb.width, h / vb.height));
  }

  function resize_scale(scale) {
    var vb = SVG.viewBox.baseVal,
      w = window.innerWidth,
      h = window.innerHeight;
    SVG.style.width = (vb.width * scale) + "px";
    SVG.style.height = (vb.height * scale) + "px";
    SVG.style.marginLeft = ((w - vb.width * scale) / 2) + "px";
    SVG.style.marginTop = ((h - vb.height * scale) / 2) + "px";
  }

  // Set the size of the SVG view (width and height)
  // TODO expand, fixed size
  zap.size = function (w, h, scale) {
    if (resize) {
      window.removeEventListener("resize", resize, false);
    }
    SVG.setAttribute("viewBox", "0 0 " + w + " " + h);
    if (!scale) {
      scale = 1;
    }
    if (typeof scale === "number") {
      resize = function () {
        resize_scale(scale);
      };
    } else if (scale === "fit") {
      resize = resize_fit;
    }
    window.addEventListener("resize", resize, false);
    resize();
  };

  zap.title = function (t) {
    if (t) {
      document.title = t;
    }
    return document.title;
  };

  zap.init = function () {};

  window.addEventListener("load", function () {
    zap.init();
  }, false);

}(window.zap = {}));
