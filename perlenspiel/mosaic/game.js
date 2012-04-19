// Make a mosaic out of an image dragged into the document.
// Created: Apr 11, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS */
/*jslint browser: true, regexp: true, maxerr: 50, indent: 2 */

(function () {
  "use strict";

  // SZ is the maximum dimension of the mosaic
  // W and H are the actual dimensions after an image was loaded
  var SZ = 32, W, H;

  // Drag and drop functions. TODO: show whether dropping is possible.
  function dragenter(e) { e.preventDefault(); }
  function dragover(e) { e.preventDefault(); }
  function dragleave(e) { e.preventDefault(); }

  // When an image is dropped, get it through createObjectURL then render it in
  // a tiny canvas, the largest dimension of which is given by SZ set above
  // (maximum 32 as this is the maximum grid size) then blit this small image
  // into the grid.
  function drop(e) {
    var file, img, d, canvas, context;
    e.preventDefault();
    file = e.dataTransfer.files[0];
    if (file && file.type.match(/^image\/.*/)) {
      img = document.createElement("img");
      img.src = window.webkitURL ? window.webkitURL.createObjectURL(file) :
          window.URL ? window.URL.createObjectURL(file) :
              window.createObjectURL(file);
      img.onload = function () {
        d = Math.max(img.width, img.height);
        W = Math.ceil(SZ * img.width / d);
        H = Math.ceil(SZ * img.height / d);
        canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        context = canvas.getContext("2d");
        context.drawImage(img, 0, 0, img.width, img.height, 0, 0, W, H);
        PS.GridSize(W, H);
        PS.BeadFlash(PS.ALL, PS.ALL, false);
        img.onload = function () {
          PS.ImageBlit(PS.ImageData(img, true));
          PS.Tick();
          PS.StatusText("Mosaic");
          PS.AudioPlay("fx_pop");
          canvas = null;
          context = null;
          img = null;
        };
        img.src = canvas.toDataURL();
      };
    }
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Setup drag and drop events for the whole document
  PS.Init = function () {
    PS.GridSize(8, 8);
    document.addEventListener("dragenter", dragenter, false);
    document.addEventListener("dragover", dragover, false);
    document.addEventListener("dragleave", dragleave, false);
    document.addEventListener("drop", drop, false);
    PS.StatusText("Drag an image");
    PS.AudioLoad("fx_pop");
    PS.Clock(80);
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Randomly change the alpha of some beads
  PS.Tick = function () {
    var x, y;
    for (x = 0; x < W; x += 1) {
      for (y = 0; y < H; y += 1) {
        if (Math.random() < 0.05) {
          PS.BeadAlpha(x, y, 100 - Math.round(Math.random() * 10));
          PS.BeadBorderAlpha(x, y, 100 - Math.round(Math.random() * 10));
        }
      }
    }
  };


  // These are not used but need to be defined

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Click = function () {};

  // PS.Release (x, y, data)
  // This function is called whenever a mouse button is released over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Release = function () {};

  // PS.Enter (x, y, button, data)
  // This function is called whenever the mouse moves over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Enter = function () {};

  // PS.Leave (x, y, data)
  // This function is called whenever the mouse moves away from a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Leave = function () {};

  // PS.KeyDown (key, shift, ctrl)
  // This function is called whenever a key on the keyboard is pressed
  // It doesn't have to do anything
  // key = the ASCII code of the pressed key, or one of the following constants:
  // Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
  // Function keys = PS.F1 through PS.F1
  // shift = true if shift key is held down, false otherwise
  // ctrl = true if control key is held down, false otherwise

  PS.KeyDown = function () {};

  // PS.KeyUp (key, shift, ctrl)
  // This function is called whenever a key on the keyboard is released
  // It doesn't have to do anything
  // key = the ASCII code of the pressed key, or one of the following constants:
  // Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
  // Function keys = PS.F1 through PS.F12
  // shift = true if shift key is held down, false otherwise
  // ctrl = true if control key is held down, false otherwise

  PS.KeyUp = function () {};

  // PS.Wheel (dir)
  // This function is called whenever the mouse wheel moves forward or backward
  // It doesn't have to do anything
  // dir = 1 if mouse wheel moves forward, -1 if backward

  PS.Wheel = function () {};

}());
