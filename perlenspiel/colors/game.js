// A color toy: draw a color wheel folllowing the mouse cursor and rotating
// slowly.
// Created: Mar 13, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS */
/*jslint maxerr: 50, indent: 2 */

(function () {
  "use strict";

  var
    X = 0, Y = 0,  // current mouse coordinates
    SZ = 16,       // size of the (square) grid
    THETA = 0;     // current angle of rotation (in radians)

  // Change the grid size and update the status to show the new size
  function grid_size() {
    PS.GridSize(SZ, SZ);
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    PS.StatusText(SZ.toString() + "×" + SZ.toString());
  }

  // Convert a color from hsv space (hue in radians, saturation and brightness
  // in the [0, 1] range) to and RGB value suitable for BeadColor.
  function hsv_to_rgb(h, s, v) {
    var i, f, p, q, t, r, g, b;
    s = Math.min(Math.max(s, 0), 1);
    v = Math.min(Math.max(v, 0), 1);
    if (s === 0) {
      r = g = b = Math.round(v * 255);
    } else {
      h = (((h * 180 / Math.PI) + 360) % 360) / 60;
      i = Math.floor(h);
      f = h - i;
      p = v * (1 - s);
      q = v * (1 - (s * f));
      t = v * (1 - (s * (1 - f)));
      r = Math.round([v, q, p, p, t, v][i] * 255);
      g = Math.round([t, v, v, q, p, p][i] * 255);
      b = Math.round([p, p, t, v, v, q][i] * 255);
    }
    return PS.MakeRGB(r, g, b);
  }

  // Update the grid: redraw the color wheel centered at the current mouse
  // position and rotated by the current value of THETA.
  function update() {
    var x, y, dx, dy, a, d;
    for (x = 0; x < SZ; x += 1) {
      for (y = 0; y < SZ; y += 1) {
        dx = X - x;
        dy = Y - y;
        a = Math.atan2(dy, dx) + THETA;
        d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) / (Math.sqrt(2) * SZ);
        PS.BeadColor(x, y, hsv_to_rgb(a, d, 1));
      }
    }
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Set default grid size and clock
  PS.Init = function () {
    grid_size();
    PS.Clock(10);
  };


  // PS.Enter (x, y, button, data)
  // This function is called whenever the mouse moves over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Update the mouse position
  PS.Enter = function (x, y) {
    X = x;
    Y = y;
    update();
  };

  // PS.Wheel (dir)
  // This function is called whenever the mouse wheel moves forward or backward
  // It doesn't have to do anything
  // dir = 1 if mouse wheel moves forward, -1 if backward

  // Change the size of the grid using the mouse wheel
  PS.Wheel = function (dir) {
    SZ = Math.min(Math.max(SZ + dir, 1), 32);
    grid_size();
    update();
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Increase the angle of rotation on every tick
  PS.Tick = function () {
    THETA += 0.05;
    update();
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

}());
