// A puzzle game inspired by Rasende Roboter
// Created: Apr 30, 2012
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint maxerr: 50, indent: 2 */

(function () {
  "use strict";

  var SZ = 16,    // Size of the game world
    RATE = 20,    // Clock rate for animations (in 100th of second)
    BLOCKS = [],  // All movable blocks (player, ice, enemies; not rocks)
    PLAYER,       // Player block

    // * is a rock
    // # is an ice block
    // $ is an enemy
    // @ is the player
    // % is a hole
    //   is an empty space (ice)
    COLORS = { "*": 0x403530, "#": 0x7fffff, "@": 0x007f00, $: 0xff7f00,
      "%": 0x102040, " ": 0xdfffff, R: 0xff7fff, S: 0x7fff00, B: 0xffff7f },

    LEVELS = [
      [ "****************",
        "*********  $ ***",
        "***  **    # ***",
        "**$ ##       ***",
        "*             **",
        "*             **",
        "**      @      *",
        "**             *",
        "***         # $*",
        "*****   #     **",
        "******    ******",
        "******   *******",
        "******* $*******",
        "****************",
        "*R***********BS*",
        "****************"],

      [ "****************",
        "****************",
        "***    *********",
        "**  $  *********",
        "**     *********",
        "***       ******",
        "****    #@ *****",
        "***       ******",
        "*      *********",
        "*      *********",
        "*     **********",
        "*     **********",
        "*    ***********",
        "****************",
        "*R***********BS*",
        "****************"],

      [ "****************",
        "***    *********",
        "*** $        ***",
        "***           **",
        "****     #  @ **",
        "***           **",
        "**            **",
        "**            **",
        "**           ***",
        "* #      #  ****",
        "*         ******",
        "*#        ******",
        "*         ******",
        "****************",
        "*R***********BS*",
        "****************"],

      [ "****************",
        "****************",
        "**      ********",
        "**           ***",
        "**     %      **",
        "**             *",
        "***            *",
        "***$   @   # %**",
        "*****      *****",
        "****************",
        "****************",
        "****************",
        "****************",
        "****************",
        "*R***********BS*",
        "****************"]

    ],

    LEVEL = 0; // LEVELS.length - 1;    // Current level

  // Set a bead to a new value and redraw it.
  function set_bead(x, y, data) {
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
    PS.BeadBorderWidth(x, y, data === "*" ? 0 : 1);
  }

  // Make a new block object
  function make_block(x, y, data) {
    return { x: x, y: y, dx: 0, dy: 0, data: data };
  }

  // Remove a block
  function remove_block(b) {
    BLOCKS.splice(BLOCKS.indexOf(b), 1);
    set_bead(b.x, b.y, " ");
  }

  function die(b) {
    remove_block(b);
    if (b === PLAYER) {
      // PS.AudioPlay("fx_wilhelm");
      PS.StatusText("OH NOES!!! ☠☠☠");
    }
  }

  // Reset the game for the current level; update the status text as well
  function reset_level(incr) {
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    LEVEL = Math.max(Math.min(LEVEL + (incr || 0), LEVELS.length - 1), 0);
    PS.StatusText("Freeeeze ☃ Level " + (LEVEL + 1));
    BLOCKS = [];
    LEVELS[LEVEL].forEach(function (row, y) {
      [].forEach.call(row, function (data, x) {
        if (data === "@") {
          data = make_block(x, y, data);
          PLAYER = data;
          BLOCKS.push(data);
        } else if (data === "#" || data === "$") {
          data = make_block(x, y, data);
          BLOCKS.push(data);
        }
        set_bead(x, y, data);
      });
    });
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Load the current level
  PS.Init = function () {
    PS.GridSize(SZ, SZ);
    PS.GridBGColor(COLORS["*"]);
    PS.StatusColor(COLORS["#"]);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    // PS.AudioLoad("perc_shaker");  // enemy disappearing
    // PS.AudioLoad("fx_bucket");    // kicked a block
    // PS.AudioLoad("fx_swoosh");    // sliding a block
    // PS.AudioLoad("fx_wilhelm");   // player dying
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
    var dx = 0, dy = 0;
    if (data === "R") {
      // Retry
      // TODO confirmation
      reset_level();
    } else if (data === "S") {
      // Skip
      reset_level(1);
    } else if (data === "B") {
      // Go back
      reset_level(-1);
    } else if (BLOCKS.indexOf(PLAYER) < 0) {
      reset_level();
    } else if (!BLOCKS.some(function (b) { return b.data === "$"; })) {
      reset_level(1);
    } else if (!BLOCKS.some(function (b) {
        return b.dx !== 0 || b.dy !== 0;
      })) {
      if (x === PLAYER.x) {
        dy = y - PLAYER.y;
      } else if (y === PLAYER.y) {
        dx = x - PLAYER.x;
      }
      if (dx !== 0 || dy !== 0) {
        // PS.AudioPlay("fx_swoosh");
        PLAYER.dx = dx < 0 ? -1 : dx > 0 ? 1 : 0;
        PLAYER.dy = dy < 0 ? -1 : dy > 0 ? 1 : 0;
        PS.Clock(RATE);
      }
    }
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Run animations
  PS.Tick = function () {
    BLOCKS.filter(function (b) {
      return b.dx !== 0 || b.dy !== 0;
    }).forEach(function (b) {
      var x = b.x + b.dx, y = b.y + b.dy, data = PS.BeadData(x, y);
      if (data === " ") {
        set_bead(b.x, b.y, " ");
        set_bead(x, y, b);
        b.x += b.dx;
        b.y += b.dy;
      } else {
        if (data.data === "#") {
          // PS.AudioPlay("fx_bucket");
          data.dx = b.dx;
          data.dy = b.dy;
        } else if (data.data === "$") {
          if (b.data === "#") {
            remove_block(data);
            remove_block(b);
            // PS.AudioPlay("perc_shaker");
            if (!BLOCKS.some(function (b) { return b.data === "$"; })) {
              PS.StatusText("Well done!");
            }
          } else {
            die(b);
          }
        } else if (data === "%") {
          die(b);
        } else {
          // PS.AudioPlay("fx_bucket");
        }
        b.dx = 0;
        b.dy = 0;
      }
    });
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
