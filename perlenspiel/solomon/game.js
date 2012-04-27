// A clone of Solomon's Key 2/Fire n Ice in Perlenspiel played with the mouse
// Created: Apr 15, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint maxerr: 50, indent: 2 */

(function () {
  "use strict";

  var
    RATE = 40,     // Clock rate for animations (in 100th of second)
    Px, Py,        // Player position
    ENEMIES,       // Number of enemies left
    WORLD = 0,     // Current world number
    LEVEL = 0,     // Current level number
    DEAD = false,  // when falling on an enemy

    WORLDS = [[
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
        "****************",
        "****************",
        "**     * >==< **",
        "**      * #$  **",
        "**@# $* * #$  **",
        "*******   #$$ **",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************"],

      [ "****************",
        "****************",
        "****************",
        "***          ***",
        "**  #         **",
        "**  **  $ #   **",
        "**  ** #$ # @ **",
        "**  ************",
        "**  *****  *****",
        "**        $*****",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************"],

      [ "****************",
        "****************",
        "****************",
        "****************",
        "***          ***",
        "***          ***",
        "***<>      <>***",
        "***$<=>  <=>$***",
        "****$ <==> $****",
        "*****$#@ #$*****",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************"],

      [ "****************",
        "****************",
        "****************",
        "****    ********",
        "***       ******",
        "***#        ****",
        "***=*         **",
        "*** **        **",
        "*** ** # #    **",
        "*** ****** @ ***",
        "*** ******===***",
        "***$******===***",
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
    ]],

    // * is a rock
    // # is a free-standing ice block
    // < is an ice block attached to the left
    // > is an ice block attached to the right
    // = is an ice block attached on both sides
    // @ is the player
    // $ is an enemy flame
    //   is an empty space
    COLORS = { "*": 0x403530, "<": 0x3fbfff, ">": 0x3fbfff, "=": 0x3fbfff,
      "#": 0x7fffff, "@": 0x007f00, "$": 0xff7f00, " ": 0xffffff },

    ICE = { "#": true, "<": true, ">": true, "=": true },  // ice blocks
    ANIMATIONS = [],                                       // running animations

    add_animation;  // forward declaration of add_animation

  // Scan the world for falling blocks (ice, enemy and player alike)
  // TODO chunks of ice
  // TODO make a list of objects
  function gravity() {
    var x, y, x1, x2, i, free, data, below;
    for (x = 0; x < 16; x += 1) {
      for (y = 15, below = "*"; y >= 0; y -= 1) {
        data = PS.BeadData(x, y);
        if (((data === "@" || data === "#") && (below === " " || below === "$"))
            || (data === "$" && below === " ")) {
          add_animation({ x: x, y: y, data: data, dx: 0, dy: 1 });
        }
        below = data;
      }
    }
  }

  // Set a cell to a new value and redraw it
  function set_cell(x, y, cell) {
    PS.BeadData(x, y, cell);
    PS.BeadColor(x, y, COLORS[cell]);
  }

  // Run animation for object #i, removing it from the list if it reaches a
  // stable position.
  function animate(p) {
    var d,
      x = p.x + p.dx,
      y = p.y + p.dy,
      data = PS.BeadData(x, y);
    if (data === " ") {
      set_cell(p.x, p.y, " ");
      set_cell(x, y, p.data);
      p.x = x;
      p.y = y;
      if (p.data === "@") {
        // Update the player position
        Px = x;
        Py = y;
      }
    } else if (data === "$") {
      if (p.data === "#") {
        // Block falling on an enemy
        set_cell(p.x, p.y, " ");
        set_cell(x, y, " ");
        p.dx = 0;
        ENEMIES -= 1;
        if (ENEMIES === 0) {
          PS.StatusText("Well done!");
        }
      } else if (p.data === "@") {
        // Player falling on an enemy
        PS.StatusText("OH NOES!!!");
        DEAD = true;
      }
    }
  }

  // Add a new animation to the list, starting the clock if necessary
  // The animations are sorted by increasing y coordinate
  add_animation = function (p, now) {
    console.log("+++", p, now);
    for (var i = 0, n = ANIMATIONS.length; i < n &&
        (ANIMATIONS[i].x !== p.x || ANIMATIONS[i].y !== p.y); i += 1);
    if (i < n) {
      ANIMATIONS[i] = p;
    } else {
      ANIMATIONS.push(p);
    }
    if (ANIMATIONS.length === 1) {
      PS.Clock(RATE);
    }
    if (now) {
      animate(p);
    }
  };

  // Reset the game for the current level; update the status text as well
  function reset_level() {
    PS.StatusText("Level " + (WORLD + 1) + "-" + (LEVEL + 1));
    ENEMIES = 0;
    WORLDS[WORLD][LEVEL].forEach(function (row, y) {
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
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Load the current level
  PS.Init = function () {
    PS.GridSize(16, 16);
    PS.Clock(0);
    reset_level();
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Move, push, create or destroy blocks. Interactions are suspended while
  // animations are running.
  PS.Click = function (x, y, data) {
    var dx, d;
    if (!ANIMATIONS.length) {
      if (ENEMIES === 0) {
        // Move to next level
        LEVEL += 1;
        reset_level();
      } else if (DEAD) {
        reset_level();
      } else if (x === Px - 1 || x === Px + 1) {
        if (y === Py) {
          if (data === " ") {
            // Move left or right to an empty cell
            set_cell(Px, Py, " ");
            Px = x;
            set_cell(Px, Py, "@");
            gravity();
          } else if (data === "#") {
            // Push a free-standing block if the next square is empty or has an
            // enemy
            dx = x - Px;
            d = PS.BeadData(x + dx, y);
            if (d === " " || d === "$") {
              add_animation({ x: x, y: y, data: "#", dx: dx, dy: 0 }, true);
              gravity();
              return;
            }
          }
          if ((ICE[data] || data === "*") && PS.BeadData(x, y - 1) === " ") {
            // Climb up on a rock or an unmovable block
            set_cell(Px, Py, " ");
            Px = x;
            Py = y - 1;
            set_cell(Px, Py, "@");
          }
        } else if (y === Py + 1) {
          if (data === " ") {
            // Create a block of ice, possibly tied to its neighbor(s)
            set_cell(x, y,
                PS.BeadData(x - 1, y) === " " ?
                  PS.BeadData(x + 1, y) === " " ? "#" : ">" :
                  PS.BeadData(x + 1, y) === " " ? "<" : "=");
            d = PS.BeadData(x - 1, y);
            if (d === "<") {
              set_cell(x - 1, y, "=");
            } else if (d === "#") {
              set_cell(x - 1, y, ">");
            }
            d = PS.BeadData(x + 1, y);
            if (d === ">") {
              set_cell(x + 1, y, "=");
            } else if (d === "#") {
              set_cell(x + 1, y, "<");
            }
          } else if (ICE[data]) {
            // Remove a block of ice
            set_cell(x, y, " ");
            d = PS.BeadData(x - 1, y);
            if (d === "=") {
              set_cell(x - 1, y, "<");
            } else if (d === ">") {
              set_cell(x - 1, y, "#");
            }
            d = PS.BeadData(x + 1, y);
            if (d === "=") {
              set_cell(x + 1, y, ">");
            } else if (d === "<") {
              set_cell(x + 1, y, "#");
            }
            gravity();
          }
        } else if (y === Py - 1 && data === " ") {
          // Climb above a stationary object
          d = PS.BeadData(x, y + 1);
          if (ICE[d] || d === "*") {
            if (d === "#") {
              dx = x - Px;
              d = PS.BeadData(x + dx, y + 1);
              if (d === " " || d === "$") {
                return;
              }
            }
            set_cell(Px, Py, " ");
            Px = x;
            Py = y;
            set_cell(Px, Py, "@");
            gravity();
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
    ANIMATIONS.forEach(animate);
    if (ANIMATIONS.length > 0) {
      console.log("<<<", ANIMATIONS);
      ANIMATIONS = ANIMATIONS.filter(function (p) { return p.dx !== 0; });
      console.log(">>>", ANIMATIONS);
      gravity();
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
