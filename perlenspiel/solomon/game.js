// A clone of Solomon's Key 2/Fire n Ice in Perlenspiel played with the mouse
// Created: Apr 15, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlsenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint maxerr: 50, indent: 2 */

(function () {
  "use strict";

  var
    RATE = 40,  // Clock rate for animations (in 100th of second)
    Px, Py,     // Player position
    ENEMIES,    // Number of enemies left
    LEVEL = 0,  // Current level number

    LEVELS = [
      [ "****************",
        "****************",
        "****************",
        "****        ****",
        "****  $ # @ ****",
        "**** ***********",
        "**** #   *******",
        "**** # $    ****",
        "**** # $    ****",
        "**** # $    ****",
        "*********$  ****",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************"],
      [ "****************",
        "****************",
        "****************",
        "***       *  ***",
        "***       *@ ***",
        "*** #     **=***",
        "***=**       ***",
        "***  * # # # ***",
        "***$ ***********",
        "**<=========#***",
        "***          ***",
        "***$$$$$$$$$$***",
        "****************",
        "****************",
        "****************",
        "****************"]
    ],

    // * is a rock
    // # is a free-standing ice block
    // < is an ice block attached to the left
    // > is an ice block attached to the right
    // = is an ice block attached on both sides
    // @ is the player
    // $ is an enemy flame
    //   is an empty space
    COLORS = { "*": 0x3f3f3f, "<": 0x3fbfff, ">": 0x3fbfff, "=": 0x3fbfff,
      "#": 0x7fffff, "@": 0x007f00, "$": 0xff7f00, " ": 0xffffff },

    ICE = { "#": true, "<": true, ">": true, "=": true },  // ice blocks
    ANIMATIONS = [],                                       // running animations

    add_animation;  // forward declaration of add_animation

  // Set a cell to a new value and optionally check cells above for falling
  // objects, setting new animations if necessary
  function set_cell(x, y, cell, check_above) {
    var data;
    PS.BeadData(x, y, cell);
    PS.BeadColor(x, y, COLORS[cell]);
    if (cell === " ") {
      while (check_above) {
        y -= 1;
        data = PS.BeadData(x, y);
        if (data === "#" || data === "$") {
          add_animation({ x: x, y: y, data: data, dx: 0, dy: 1 });
        } else {
          check_above = false;
        }
      }
    }
  }

  // Run animation for object #i, removing it from the list if it reaches a
  // stable position
  function animate_i(i) {
    var p = ANIMATIONS[i],
      x = p.x + p.dx,
      y = p.y + p.dy,
      data = PS.BeadData(x, y),
      d;
    if (data === " ") {
      set_cell(p.x, p.y, " ", p.dx !== 0);
      set_cell(x, y, p.data);
      p.x = x;
      p.y = y;
      if (p.data === "@") {
        Px = x;
        Py = y;
      } else if (p.dy === 0) {
        d = PS.BeadData(x, y + 1);
        if (d === " " || d === "$") {
          p.dx = 0;
          p.dy = 1;
        }
      }
    } else {
      if (data === "$") {
        if (p.data === "#") {
          set_cell(p.x, p.y, " ");
          set_cell(x, y, " ");
          ENEMIES -= 1;
        }
      }
      ANIMATIONS.splice(i, 1);
    }
  }

  // Add a new animation to the list, starting the clock if necessary
  // TODO sort by y for gravity
  add_animation = function (p, now) {
    ANIMATIONS.unshift(p);
    if (ANIMATIONS.length === 1) {
      PS.Clock(RATE);
    }
    if (now) {
      animate_i(ANIMATIONS.length - 1);
    }
  };

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Load the current level
  PS.Init = function () {
    PS.GridSize(16, 16);
    PS.Clock(0);
    ENEMIES = 0;
    LEVELS[LEVEL].forEach(function (row, y) {
      [].forEach.call(row, function (cell, x) {
        set_cell(x, y, cell);
        if (cell === "@") {
          Px = x;
          Py = y;
        } else if (cell === "$") {
          ENEMIES += 1;
        }
      });
    });
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Move, push, create or destroy blocks.
  PS.Click = function (x, y, data) {
    var dx, d;
    if (!ANIMATIONS.length) {
      if (x === Px - 1 || x === Px + 1) {
        if (y === Py) {
          if (data === " ") {
            set_cell(Px, Py, " ", true);
            Px = x;
            set_cell(Px, Py, "@");
            if (PS.BeadData(x, y + 1) === " ") {
              add_animation({ x: Px, y: Py, data: "@", dx: 0, dy: 1 });
            }
          } else if (data === "#") {
            dx = x - Px;
            if (PS.BeadData(x + dx, y) === " ") {
              add_animation({ x: x, y: y, data: "#", dx: dx, dy: 0 }, true);
            }
          }
          if (!ANIMATIONS.length && (ICE[data] || data === "*") &&
              PS.BeadData(x, y - 1) === " ") {
            set_cell(Px, Py, " ", true);
            Px = x;
            Py = y - 1;
            set_cell(Px, Py, "@");
          }
        } else if (y === Py + 1) {
          if (data === " ") {
            set_cell(x, y,
                PS.BeadData(x - 1, y) === " " ?
                  PS.BeadData(x + 1, y) === " " ? "#" : ">" :
                  PS.BeadData(x + 1, y) === " " ? "<" : "=");
          } else if (ICE[data]) {
            set_cell(x, y, " ", true);
          }
        } else if (y === Py - 1 && data === " ") {
          d = PS.BeadData(x, y + 1);
          if (ICE[d] || d === "*") {
            set_cell(Px, Py, " ", true);
            Px = x;
            Py = y;
            set_cell(Px, Py, "@");
          }
        }
      }
    }
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Run animations
  PS.Tick = function () {
    var i;
    for (i = ANIMATIONS.length - 1; i >= 0; i -= 1) {
      animate_i(i);
    }
    if (ANIMATIONS.length === 0) {
      PS.Clock(0);
    }
  };


  // These are not used but need to be defined

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
