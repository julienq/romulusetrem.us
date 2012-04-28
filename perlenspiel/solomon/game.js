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
    LEVEL = 1,     // Current level number

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
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
  }

  // Move a block from its current position to (x, y)
  function move_block(b, x, y, offset) {
    set_bead(b.x + (offset || 0), b.y, " ");
    set_bead(x, y, b);
    if (!(offset > 0)) {
      console.log("Move", b.data, b.x, b.y, x, y);
      b.x = x;
      b.y = y;
    }
  }

  // Remove a block (ice melting, enemy destroyed)
  // TODO break chunks
  // TODO add_block to create ice/chunks
  function remove_block(b) {
    var i = BLOCKS.indexOf(b);
    BLOCKS.splice(i, 1);
    set_bead(b.x, b.y, " ");
    return 1;
  }

  // Reset the game for the current level; update the status text as well
  function reset_level() {
    var chunk;
    PS.StatusText("Level " + (WORLD + 1) + "-" + (LEVEL + 1));
    ENEMIES = 0;
    BLOCKS = [];
    WORLDS[WORLD][LEVEL].forEach(function (row, y) {
      [].forEach.call(row, function (cell, x) {
        set_bead(x, y, cell);
        if (cell === "$") {
          ENEMIES += 1;
        }
        if (cell === "@" || cell === "$" || cell === "#") {
          BLOCKS.push({ x: x, y: y, dx: 0, dy: 0, data: cell, width: 1 });
          PS.BeadData(x, y, BLOCKS[BLOCKS.length - 1]);
          if (cell === "@") {
            PLAYER = BLOCKS[BLOCKS.length - 1];
          }
          chunk = undefined;
        } else if (cell === "<" || cell === "=" || cell === ">") {
          if (chunk) {
            chunk.width += 1;
            chunk.right = cell;
          } else {
            chunk = { x: x, y: y, dx: 0, dy: 0, data: "=", width: 1,
              left: cell, right: cell };
            BLOCKS.push(chunk);
          }
          PS.BeadData(x, y, chunk);
        } else {
          chunk = undefined;
        }
      });
    });
  }

  // Scan the world for falling blocks (ice, enemy and player alike)
  function gravity() {
    BLOCKS.forEach(function (b) {
      var falling, i, below;
      for (falling = true, i = 0, below = "*"; falling && i < b.width; i += 1) {
        below = b.y === SZ - 1 ? "*" : PS.BeadData(b.x + i, b.y + 1);
        falling = below === " " || (b.data !== "$" && below.data === "$");
      }
      if (falling && i === b.width) {
        b.dx = 0;
        b.dy = 1;
      }
    });
  }

  // Run animation for a single block
  function animate(b) {
    var i, x, y, bb;
    for (i = b.width - 1; i >= 0; i -= 1) {
      x = b.x + b.dx + i;
      y = b.y + b.dy;
      bb = PS.BeadData(x, y);
      if (bb === " ") {
        move_block(b, x, y, i);
      } else if (bb.data === "$") {
        if (b.data === "@") {
          PS.StatusText("OH NOES!!!");
          PLAYER.dead = true;
        } else if (b.data === "#" || b.data === "=") {
          remove_block(bb);
          ENEMIES -= remove_block(b);
          if (ENEMIES === 0) {
            PS.StatusText("Well done!");
          }
        }
      } else {
        b.dx = 0;
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
    var dx, d;
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
          if ((data === "*" || data.data === "=" || data.data === "#") &&
              PS.BeadData(x, y - 1) === " " &&
              PS.BeadData(PLAYER.x, y - 1) === " ") {
            // Climb up on a rock or an unmovable block
            // The space right above the player has to be free as well
            move_block(PLAYER, x, y - 1);
          }
        } else if (y === PLAYER.y - 1 && data === " " &&
            PS.BeadData(PLAYER.x, y) === " ") {
          // Climb above a stationary object
          d = PS.BeadData(x, y + 1);
          if (d === "*" || d.data === "=" || d.data === "#") {
            if (d.data === "#" || d.data === "=") {
              dx = x - PLAYER.x;
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
