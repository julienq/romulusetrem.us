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

  var SZ = 16,     // Size of the game world
    RATE = 30,     // Clock rate for animations (in 100th of second)
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
      "#": 0x7fffff, "@": 0x007f00, "$": 0xff7f00, " ": 0xffffff,
      R: 0xff7fff, S: 0x7fff00, B: 0xffff7f },

    // Notes for falling blocks
    /*NOTES = ["d7", "c7", "b6", "f6", "e6", "d6", "c6", "b5", "a5", "g5", "f5",
      "e5", "d5", "c5", "b4", "a4"],*/

    WORLDS = [
      [
        [ "****************",  // 1-1
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
          "*R************S*",
          "****************"],

        [ "****************",  // 1-2
          "****************",
          "****************",
          "****************",
          "****************",
          "**     * <==> **",
          "**      * #$  **",
          "**@# $* * #$  **",
          "*******   #$$ **",
          "****************",
          "****************",
          "****************",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-3
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
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-4
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
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-5
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
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-6
          "****************",
          "****************",
          "***       *  ***",
          "***       *@ ***",
          "*** #     **=***",
          "***=**       ***",
          "***  * # # # ***",
          "***$ ***********",
          "**<=========>***",
          "***          ***",
          "***$$$$$$$$$$***",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-7
          "****************",
          "****************",
          "****        ****",
          "****     #@ ****",
          "****  $ <===****",
          "******=*********",
          "*****      *****",
          "*****      *****",
          "*********  *****",
          "*******$  ******",
          "*******$$$******",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-8
          "****************",
          "****************",
          "*****      *****",
          "****        ****",
          "**** #    $ ****",
          "*******@ *=*****",
          "********** *****",
          "****$       ****",
          "****<=====> ****",
          "****$$$$$$<>****",
          "****************",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-9
          "****************",
          "****************",
          "***********   **",
          "** @#       ****",
          "**==========****",
          "**$        $****",
          "***$      $*****",
          "****$    $******",
          "*****$  $*******",
          "******$$********",
          "****************",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 1-10 TODO lava ^^^^^ at the bottom
          "*              *",
          "*   **         *",
          "*      *       *",
          "*        *     *",
          "*   $      *   *",
          "*  ****      ***",
          "*           *  *",
          "*       @ *    *",
          "*     $ *      *",
          "*     *        *",
          "*   *          *",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"]],

      [
        [ "****************",  // 2-1
          "****************",
          "****************",
          "****     # $****",
          "****>  *********",
          "****  <*********",
          "****>   @# $****",
          "****   *********",
          "****   *********",
          "****   *********",
          "**** $     $****",
          "****************",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 2-2
          "****************",
          "***          ***",
          "***@  # $ <> ***",
          "****> ****** ***",
          "************ ***",
          "***       ** ***",
          "***       ** ***",
          "***     *  * ***",
          "****   ***   ***",
          "****   **  * ***",
          "****$$$***  $***",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"],

        [ "****************",  // 2-3
          "****************",
          "****************",
          "**    ****    **",
          "**<>        #$**",
          "** **      **=**",
          "** **$ @ # ** **",
          "** ********** **",
          "**            **",
          "** <========> **",
          "**$# $$$$$$ $ **",
          "****$******$****",
          "****************",
          "****************",
          "*R***********BS*",
          "****************"]]];

  // Set a bead to a new value and redraw it. If a block is given, update its
  // position as well
  function set_bead(x, y, data) {
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
  }

  // Add a new ice block at (x, y), creating chunks if necessary
  function add_block(x, y) {
    var left = PS.BeadData(x - 1, y), right = PS.BeadData(x + 1, y), b, i;
    if (left.data === "#") {
      // Merge with left ice block, become a chunk
      b = left;
      b.data = "=";
      b.width = 2;
    } else if (left.data === "=") {
      // Merge with left chunk; b.right will be set next
      b = left;
      b.width += 1;
    } else if (left === "*") {
      // Stick to the left wall
      b = { x: x, y: y, dx: 0, dy: 0, data: "=", width: 1, left: true };
      BLOCKS.push(b);
    } else {
      // Free... for the moment
      b = { x: x, y: y, dx: 0, dy: 0, data: "#", width: 1 };
      BLOCKS.push(b);
    }
    if (right.data === "#") {
      // Merge with the right ice block and remove it
      b.width += 1;
      b.right = false;
      b.data = "=";
      BLOCKS.splice(BLOCKS.indexOf(right), 1);
    } else if (right.data === "=") {
      // Merge with the right chunk and remove it
      b.width += right.width;
      b.right = right.right;
      b.data = "=";
      BLOCKS.splice(BLOCKS.indexOf(right), 1);
    } else if (right === "*") {
      b.right = true;
      b.data = "=";
    } else {
      b.right = false;
    }
    for (i = 0; i < b.width; i += 1) {
      set_bead(b.x + i, b.y, b);
    }
  }

  // Move a block from its current position to (x, y)
  function move_block(b, x, y, offset) {
    set_bead(b.x + offset, b.y, " ");
    set_bead(x, y, b);
    if (offset === 0) {
      b.x = x;
      b.y = y;
    }
    /*if (b === PLAYER && b.dy === 0) {
      PS.AudioPlay("fx_tick");
    }*/
  }

  // Remove a block (ice melting, enemy destroyed)
  function remove_block(b, offset) {
    var splice = true, i = BLOCKS.indexOf(b), bb, j;
    set_bead(b.x + offset, b.y, " ");
    if (b.width > 1) {
      splice = false;
      if (offset === 0) {
        b.width -= 1;
        b.x += 1;
        b.left = false;
      } else if (offset === b.width - 1) {
        b.width -= 1;
        b.right = false;
      } else {
        bb = { x: b.x + offset + 1, y: b.y, dx: 0, dy: 0,
          data: b.width - offset - 1 === 1 && !b.right ? "#" : "=",
          width: b.width - offset - 1, left: false, right: b.right };
        BLOCKS.push(bb);
        for (j = 0; j < bb.width; j += 1) {
          set_bead(bb.x + j, bb.y, bb);
        }
        b.width = offset;
        b.right = false;
      }
    }
    if (splice) {
      BLOCKS.splice(i, 1);
    } else {
      if (b.width === 1 && !b.left && !b.right) {
        b.data = "#";
        set_bead(b.x, b.y, b);
      }
    }
    // PS.AudioPlay("perc_shaker");
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
            chunk.right = cell === "=" || cell === "<";
          } else {
            chunk = { x: x, y: y, dx: 0, dy: 0, data: "=", width: 1,
              left: cell === "=" || cell === ">",
              right: cell === "=" || cell === "<" };
            BLOCKS.push(chunk);
          }
          PS.BeadData(x, y, chunk);
        } else {
          chunk = undefined;
        }
      });
    });
  }

  function next_level(incr) {
    LEVEL += incr;
    if (LEVEL < 0) {
      if (WORLD > 0) {
        WORLD -= 1;
        LEVEL = WORLDS[WORLD].length - 1;
      } else {
        LEVEL = 0;
        return;
      }
    } else if (LEVEL > WORLDS[WORLD].length - 1) {
      if (WORLD < WORLDS.length - 1) {
        WORLD += 1;
        LEVEL = 0;
      } else {
        LEVEL = WORLDS[WORLD].length - 1;
        return;
      }
    }
    reset_level();
  }

  // Scan the world for falling blocks (ice, enemy and player alike)
  function gravity() {
    BLOCKS.forEach(function (b) {
      var falling, i, below;
      for (falling = !b.left && !b.right, i = 0, below = "*";
          falling && i < b.width; i += 1) {
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
    var i, x, y, bb, enemies;
    // Move the block (go from the end so that the x/y position are updated
    // last)
    for (i = b.width - 1, enemies = []; i >= 0; i -= 1) {
      x = b.x + b.dx + i;
      y = b.y + b.dy;
      bb = PS.BeadData(x, y);
      if (bb === " ") {
        move_block(b, x, y, i);
      } else if (bb.data === "$") {
        enemies.push(bb);
        if (b.data !== "@") {
          move_block(b, x, y, i);
        }
      } else {
        b.dx = 0;
      }
    }
    // Remove enemies if hit by the ice or die if the player hit an enemy
    enemies.forEach(function (e) {
      if (b.data === "@") {
        PS.StatusText("OH NOES!!!");
        PLAYER.dead = true;
      } else {
        remove_block(e, 0);
        remove_block(b, e.x - b.x);
      }
    });
    ENEMIES -= enemies.length;
    if (ENEMIES === 0) {
      // PS.AudioPlay("fx_ding");
      PS.StatusText("Well done!");
    }
    /*if (b.dy === 1) {
      PS.AudioPlay("xylo_" + NOTES[y]);
    } else if (b.dx !== 0) {
      PS.AudioPlay("piano_" + NOTES[SZ - x - 1]);
    }*/
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
    // PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    /*PS.AudioLoad("fx_tick");      // moving
    PS.AudioLoad("fx_ding");      // won level
    PS.AudioLoad("fx_bucket");    // kicked a block
    PS.AudioLoad("perc_shaker");  // enemy disappearing
    NOTES.forEach(function (note) {
      PS.AudioLoad("xylo_" + note);
      PS.AudioLoad("piano_" + note);
    });*/
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
    if (data === "R") {
      // Retry
      // TODO confirmation
      reset_level();
    } else if (data === "S") {
      // Skip
      next_level(1);
    } else if (data === "B") {
      // Go back
      next_level(-1);
    } else if (!BLOCKS.some(function (b) { return b.dx !== 0 || b.dy !== 0; })) {
      if (ENEMIES === 0) {
        // Move to next level
        next_level(1);
      } else if (PLAYER.dead) {
        reset_level();
      } else if (x === PLAYER.x - 1 || x === PLAYER.x + 1) {
        if (y === PLAYER.y) {
          if (data === " ") {
            // Move left or right to an empty cell
            move_block(PLAYER, x, y, 0);
            return gravity();
          }
          if (data.data === "#") {
            // Push a free-standing block if the next square is empty or has an
            // enemy
            // PS.AudioPlay("fx_bucket");
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
            move_block(PLAYER, x, y - 1, 0);
          }
        } else if (y === PLAYER.y + 1) {
          if (data === " ") {
            add_block(x, y);
          } else if (data.data === "#" || data.data === "=") {
            remove_block(data, x - data.x);
            gravity();
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
            move_block(PLAYER, x, y, 0);
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

}());
