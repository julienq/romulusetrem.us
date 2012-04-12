// game.js for Perlenspiel 2.1

/*
Perlenspiel is Copyright © 2009-12 Worcester Polytechnic Institute.
This file is part of Perlenspiel.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with Perlenspiel. If not, see <http://www.gnu.org/licenses/>.
*/

/*global PS */

var SZ = 32;
var W, H;

// PS.Init ()
// Initializes the game
// This function normally includes a call to PS.GridSize (x, y)
// where x and y are the desired dimensions of the grid
PS.Init = function ()
{
  "use strict";
  PS.GridSize(8, 8);
  document.addEventListener("dragenter", dragenter, false);
  document.addEventListener("dragover", dragover, false);
  document.addEventListener("dragleave", dragleave, false);
  document.addEventListener("drop", drop, false);
  PS.StatusText("Drag an image");
  PS.AudioLoad("fx_pop");
  PS.Clock(80);
};

function dragenter(e) { e.preventDefault(); }
function dragover(e) { e.preventDefault(); }
function dragleave(e) { e.preventDefault(); }
function drop(e)
{
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  if (file && file.type.match(/^image\/.*/)) {
    var img = document.createElement("img")
    img.src = window.webkitURL ? window.webkitURL.createObjectURL(file) :
      window.URL ? window.URL.createObjectURL(file) :
      createObjectURL(file);
    img.onload = function()
    {
      var d = Math.max(img.width, img.height);
      W = Math.ceil(SZ * img.width / d);
      H = Math.ceil(SZ * img.height / d);
      var canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      var context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, img.width, img.height, 0, 0, W, H);
      PS.GridSize(W, H);
      PS.BeadFlash(PS.ALL, PS.ALL, false);
      img.onload = function() {
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


// PS.Click (x, y, data)
// This function is called whenever a bead is clicked
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Click = function (x, y, data) {};

// PS.Release (x, y, data)
// This function is called whenever a mouse button is released over a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Release = function (x, y, data) {};

// PS.Enter (x, y, button, data)
// This function is called whenever the mouse moves over a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Enter = function (x, y, data) {};

// PS.Leave (x, y, data)
// This function is called whenever the mouse moves away from a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Leave = function (x, y, data) {};

// PS.KeyDown (key, shift, ctrl)
// This function is called whenever a key on the keyboard is pressed
// It doesn't have to do anything
// key = the ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F1
// shift = true if shift key is held down, false otherwise
// ctrl = true if control key is held down, false otherwise
PS.KeyDown = function (key, shift, ctrl) {};

// PS.KeyUp (key, shift, ctrl)
// This function is called whenever a key on the keyboard is released
// It doesn't have to do anything
// key = the ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F12
// shift = true if shift key is held down, false otherwise
// ctrl = true if control key is held down, false otherwise
PS.KeyUp = function (key, shift, ctrl) {};

// PS.Wheel (dir)
// This function is called whenever the mouse wheel moves forward or backward
// It doesn't have to do anything
// dir = 1 if mouse wheel moves forward, -1 if backward
PS.Wheel = function (dir) {};

// PS.Tick ()
// This function is called on every clock tick
// if a timer has been activated with a call to PS.Timer()
// It doesn't have to do anything
PS.Tick = function ()
{
  "use strict";
  for (var x = 0; x < W; ++x) {
    for (var y = 0; y < H; ++y) {
      if (Math.random() < .05) {
        PS.BeadAlpha(x, y, 100 - Math.round(Math.random() * 10));
        PS.BeadBorderAlpha(x, y, 100 - Math.round(Math.random() * 10));
      }
    }
  }
};
