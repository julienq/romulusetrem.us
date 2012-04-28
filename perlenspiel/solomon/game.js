// A clone of Solomon's Key 2/Fire n Ice in Perlenspiel played with the mouse
// Created: Apr 15, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint maxerr: 50, indent: 2 */

//(function () {
//  "use strict";

  var SZ = 16,     // Size of the game world
    RATE = 35,     // Clock rate for animations (in 100th of second)
    PLAYER,        // Player block
    BLOCKS,        // All movable blocks (player, ice, enemies; not rocks)
    ENEMIES,       // Number of enemies left
    WORLD = 0,     // Current world number
    LEVEL = 0,     // Current level number

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
    ICE = { "#": true, "<": true, ">": true, "=": true },

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
    ]];

  // Set a bead to a new value and redraw it. If a block is given, update its
  // position as well
  function set_bead(x, y, data) {
    if (typeof x === "object") {
      data = x;
      x = data.x;
      y = data.y;
    }
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
  }

  // Move a block from its current position to (x, y)
  function move_block(b, x, y) {
    set_bead(b.x, b.y, " ");
    b.x = x;
    b.y = y;
    set_bead(b);
  }

  // Remove a block (ice melting, enemy destroyed)
  function remove_block(b) {
    var i = BLOCKS.indexOf(b);
    BLOCKS.splice(i, 1);
    set_bead(b.x, b.y, " ");
  }

  // Reset the game for the current level; update the status text as well
  function reset_level() {
    PS.StatusText("Level " + (WORLD + 1) + "-" + (LEVEL + 1));
    ENEMIES = 0;
    BLOCKS = [];
    WORLDS[WORLD][LEVEL].forEach(function (row, y) {
      [].forEach.call(row, function (cell, x) {
        set_bead(x, y, cell);
        if (cell === "$") {
          ENEMIES += 1;
        }
        if (cell !== " " && cell !== "*") {
          BLOCKS.push({ x: x, y: y, dx: 0, dy: 0, data: cell });
          PS.BeadData(x, y, BLOCKS[BLOCKS.length - 1]);
          if (cell === "@") {
            PLAYER = BLOCKS[BLOCKS.length - 1];
          }
        }
      });
    });
  }

  // Scan the world for falling blocks (ice, enemy and player alike)
  // TODO chunks of ice as one block (add width param)
  function gravity() {
    BLOCKS.forEach(function (b) {
      var below = b.y === SZ - 1 ? "*" : PS.BeadData(b.x, b.y + 1);
      if (below === " " ||
        ((b.data === "@" || b.data === "#") && below.data === "$")) {
        b.dx = 0;
        b.dy = 1;
        console.log("Gravity:", b);
      }
    });
  }

  // Run animation for a single block
  function animate(b) {
    var
      x = b.x + b.dx,
      y = b.y + b.dy,
      bb = PS.BeadData(x, y);  // next position
    if (bb === " ") {
      // Move to a free space
      move_block(b, x, y);
    } else if (bb.data === "$") {
      if (b.data === "#") {
        // Block extinguishing an enemy
        remove_block(b);
        remove_block(bb);
        ENEMIES -= 1;
        if (ENEMIES === 0) {
          PS.StatusText("Well done!");
        }
      } else if (b.data === "@") {
        // Player falling on an enemy
        PS.StatusText("OH NOES!!!");
        PLAYER.dead = true;
      }
    }
    // Stop falling and let gravity do the rest
    b.dy = 0;
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Load the current level
  PS.Init = function () {
    PS.GridSize(SZ, SZ);
    reset_level();
    PS.Clock(RATE);
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
    var dx, d, b;
    if (!BLOCKS.some(function (b) { return b.dx !== 0 || b.dy !== 0; })) {
      if (ENEMIES === 0) {
        // Move to next level
        LEVEL += 1;
        reset_level();
      } else if (PLAYER.dead) {
        reset_level();
      } else if (x === PLAYER.x - 1 || x === PLAYER.x + 1) {
        if (y === PLAYER.y) {
          if (data === " ") {
            // Move left or right to an empty cell
            move_block(PLAYER, x, y);
            return gravity();
          }
          if (data.data === "#") {
            // Push a free-standing block if the next square is empty or has an
            // enemy
            dx = x - PLAYER.x;
            d = PS.BeadData(x + dx, y);
            if (d === " " || d.data === "$") {
              data.dx = dx;
              return gravity();
            }
          }
          if ((ICE[data.data] || data === "*") &&
              PS.BeadData(x, y - 1) === " ") {
            // Climb up on a rock or an unmovable block
            move_block(PLAYER, x, y - 1, "@", PLAYER);
          }
        } else if (y === PLAYER.y - 1 && data === " ") {
          // Climb above a stationary object
          d = PS.BeadData(x, y + 1);
          if (ICE[data.data] || d === "*") {
            if (d === "#") {
              dx = x - Px;
              d = PS.BeadData(x + dx, y + 1);
              if (d === " " || d === "$") {
                return;
              }
            }
            move_block(PLAYER, x, y);
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
    var animations = BLOCKS.filter(function (b) {
      return b.dx !== 0 || b.dy !== 0;
    });
    if (animations.length > 0) {
      animations.forEach(animate);
      gravity();
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

//}());
