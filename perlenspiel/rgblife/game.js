// RGB game of life
// Created: Apr 23, 2012
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS */
/*jslint maxerr: 50, indent: 2, bitwise: true */

(function () {
  "use strict";

  var SZ = 32, P = 0.2, RATE = 20, C = 64;

  function get_neighbors(x, y) {
    var i, j, k, data, neighbors = [0, 0, 0];
    for (i = -1; i < 2; i += 1) {
      for (j = -1; j < 2; j += 1) {
        if (i !== 0 || j !== 0) {
          data = PS.BeadData((x + SZ + i) % SZ, (y + SZ + j) % SZ);
          for (k = 0; k < 3; k += 1) {
            neighbors[k] += data[k] ? 1 : 0;
          }
        }
      }
    }
    return neighbors;
  }

  function set_bead(x, y, data) {
    PS.BeadColor(x, y,
        ((data[0] ? 256 - C : 0) + Math.floor(Math.random() * C) << 16) +
        ((data[1] ? 256 - C : 0) + Math.floor(Math.random() * C) << 8) +
        (data[2] ? 256 - C : 0) + Math.floor(Math.random() * C));
  }

  function update_grid() {
    var x, y, neighbors, i, cell, cells = [];
    for (x = 0; x < SZ; x += 1) {
      for (y = 0; y < SZ; y += 1) {
        neighbors = get_neighbors(x, y);
        cell = PS.BeadData(x, y).slice();
        for (i = 0; i < 3; i += 1) {
          cell[i] = (cell[i] && (neighbors[i] === 2 || neighbors[i] === 3)) ||
            (!cell[i] && neighbors[i] === 3);
        }
        set_bead(x, y, cell);
        cells.push(cell);
      }
    }
    cells.forEach(function (c, i) {
      PS.BeadData(Math.floor(i / SZ), i % SZ, c);
    });
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Randomize the grid
  PS.Init = function () {
    var x, y;
    PS.GridSize(SZ, SZ);
    PS.StatusText("RGB Life");
    for (x = 0; x < SZ; x += 1) {
      for (y = 0; y < SZ; y += 1) {
        PS.BeadData(x, y,
          [Math.random() < P, Math.random() < P, Math.random() < P]);
      }
    }
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    update_grid();
    PS.Clock(RATE);
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Click = function (x, y) {
    var r = 1 + Math.floor(Math.random() * 7),
      data = [(r & 1) === 1, (r & 2) === 2, (r & 4) === 4];
    PS.BeadData(x, y, data);
    set_bead(x, y, data);
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Evolve and display the grid
  PS.Tick = function () {
    update_grid();
  };


  // These are not used but need to be defined

  // PS.KeyDown (key, shift, ctrl)
  // This function is called whenever a key on the keyboard is pressed
  // It doesn't have to do anything
  // key = the ASCII code of the pressed key, or one of the following constants:
  // Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
  // Function keys = PS.F1 through PS.F1
  // shift = true if shift key is held down, false otherwise
  // ctrl = true if control key is held down, false otherwise

  PS.KeyDown = function () {};

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
