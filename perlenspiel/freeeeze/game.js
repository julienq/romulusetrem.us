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
    // ^ is a skater
    // @ is the player
    // % is a hole (TODO review color)
    // & is a shallow hole (TODO review color)
    //   is an empty space
    // , is thin ice (TODO review color)
    // ~ is lava (TODO review color)
    COLORS = { "*": 0x403530, "#": 0xb1f1ff, "@": 0x164e4a, "^": 0xed372a,
      $: 0xfbb829, "%": 0x102040, "&": 0x00755e, " ": 0xfcf9f0, ",": 0xbfffff,
      "~": 0xca0a00, R: 0x320943, B: 0xffff00, S: 0x7fff24 },

    IS_BLOCK = { "#": true, "@": true, $: true, "^": true },  // blocks
    IS_EMPTY = { " ": true, ",": true },                      // empty squares

    BOTTOM = ["****************", "R************B*S"],  // bottom of every level
    LEVEL = 0, // LEVELS.length - 1;    // Current level
    LEVELS;    // actual levels below

  // Set a bead to a new value and redraw it.
  function set_bead(x, y, data) {
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
    PS.BeadBorderWidth(x, y, data === "*" ? 0 : 1);
  }

  // Find out the destination of the block from its starting position and
  // current direction
  // TODO step by step simulation
  function destination(b) {
    var x = b.x, y = b.y;
    do {
      x += b.dx;
      y += b.dy;
    } while (x >= 0 && x < SZ && y >= 0 && y < SZ &&
        IS_EMPTY[PS.BeadData(x, y)]);
    x -= b.dx;
    y -= b.dy;
    return { x: x, y: y, dx: b.dx, dy: b.dy, data: PS.BeadData(x, y) };
  }

  // Remove a block
  function remove_block(b) {
    BLOCKS.splice(BLOCKS.indexOf(b), 1);
    b.removed = true;
    set_bead(b.x, b.y, b.after || " ");
  }

  // Remove the block; if it's the player, show a dying message
  function die(b) {
    remove_block(b);
    if (b.data === "@") {
      PS.StatusText("OH NOES!!! ☠☠☠");
    }
  }

  // Test whether a block is an enemy block
  function is_enemy(b) {
    return b.data === "$" || b.data === "^";
  }

  // Set a row of beads for a level; add block objects for the player, ice
  // blocks, and enemies
  function set_row(row, y) {
    [].forEach.call(row, function (data, x) {
      if (IS_BLOCK[data]) {
        // Insert a new block in the following order: player, ice blocks,
        // skaters, enemies
        var i = 0;
        while (i < BLOCKS.length &&
            ((data === "#" && (BLOCKS[i].data === "@" ||
                             BLOCKS[i].data === "#")) ||
              (data === "^" && (BLOCKS[i].data === "@" ||
                             BLOCKS[i].data === "#" ||
                             BLOCKS[i].data === "^")) ||
               data === "$")) {
          i += 1;
        }
        data = { x: x, y: y, dx: 0, dy: 0, data: data };
        BLOCKS.splice(i, 0, data);
      }
      set_bead(x, y, data);
    });
  }

  // Reset the game for the current level; update the status text as well
  function reset_level(incr) {
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    LEVEL = Math.max(Math.min(LEVEL + (incr || 0), LEVELS.length - 1), 0);
    PS.StatusText("Freeeeze ☃ Level " + (LEVEL + 1));
    BLOCKS = [];
    LEVELS[LEVEL].forEach(set_row);
    BOTTOM.forEach(function (row, y) { set_row(row, y + SZ); });
    PLAYER = BLOCKS[0];
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Load the current level
  PS.Init = function () {
    PS.GridSize(SZ, SZ + 2);
    PS.GridBGColor(COLORS["*"]);
    PS.StatusColor(COLORS["#"]);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    reset_level();
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Click = function (x, y, data) {
    var dx = 0, dy = 0, dest;
    if (data === "R") {
      // Retry
      // TODO ask for confirmation
      reset_level();
    } else if (data === "S") {
      // Skip to the next level
      reset_level(1);
    } else if (data === "B") {
      // Go back to the previous level
      reset_level(-1);
    } else if (BLOCKS.indexOf(PLAYER) < 0) {
      // Player died: reset
      reset_level();
    } else if (!BLOCKS.some(is_enemy)) {
      // No more enemy: move to the next level
      reset_level(1);
    } else if (!BLOCKS.some(function (b) {
        return b.dx !== 0 || b.dy !== 0;
      })) {
      // No animation running, move the player when clicking its column/row
      if (x === PLAYER.x) {
        dy = y - PLAYER.y;
      } else if (y === PLAYER.y) {
        dx = x - PLAYER.x;
      }
      if (dx !== 0 || dy !== 0) {
        PLAYER.dx = dx < 0 ? -1 : dx > 0 ? 1 : 0;
        PLAYER.dy = dy < 0 ? -1 : dy > 0 ? 1 : 0;
        // Compute the destination of the player then for every skater find out
        // which direction will bring them closer
        dest = destination(PLAYER);
        BLOCKS.forEach(function (b) {
          if (b.data === "^") {
            var b_dest = [0, 1, 2, 3].map(function (dir) {
              b.dx = dir % 2 === 0 ? 1 - dir : 0;
              b.dy = dir % 2 === 1 ? 2 - dir : 0;
              var d = destination(b);
              d.dist = Math.abs(d.x - dest.x) + Math.abs(d.y - dest.y);
              return d;
            }).reduce(function (min, d) {
              return d.dist < min.dist ? d : min;
            }, { dist: Infinity });
            b.dx = b_dest.dx;
            b.dy = b_dest.dy;
          }
        });
        PS.Clock(RATE);
      }
    }
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Run one step of animation for every moving object
  PS.Tick = function () {
    BLOCKS.filter(function (b) {
      return b.dx !== 0 || b.dy !== 0;
    }).forEach(function (b) {
      // An enemy removed in this loop should not move anymore!
      if (b.removed) {
        return;
      }
      var x = b.x + b.dx, y = b.y + b.dy, data;
      data = x >= 0 && x < SZ && y >= 0 && y < SZ ? PS.BeadData(x, y) : "*";
      if (IS_EMPTY[data]) {
        set_bead(b.x, b.y, b.after || " ");
        set_bead(x, y, b);
        b.x += b.dx;
        b.y += b.dy;
        b.after = data === "," ? "%" : " ";
      } else {
        if (data.data === "#") {
          data.dx = b.dx;
          data.dy = b.dy;
        } else if (data.data === "$" || data.data === "^") {
          if (b.data === "#") {
            remove_block(data);
            remove_block(b);
            if (!BLOCKS.some(is_enemy)) {
              PS.StatusText("Well done!");
            }
          } else {
            die(b);
          }
        } else if (data.data === "@") {
          die(data);
        } else if (data === "%") {
          die(b);
        } else if (data === "&") {
          die(b);
          set_bead(b.x + b.dx, b.y + b.dy, " ");
        }
        b.dx = 0;
        b.dy = 0;
      }
    });
  };


  // The levels

  LEVELS = [

    [ "****************",
      "*********  $ ***",
      "***  **    # ***",
      "**$ #     #  ***",
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
      "****************",
      "****************"],

    [ "                ",
      "                ",
      "                ",
      "                ",
      "    ^           ",
      "                ",
      "                ",
      "           *    ",
      "         #      ",
      "    *           ",
      "                ",
      "                ",
      "           @    ",
      "                ",
      "                ",
      "                "]

        /*
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
      "****************"],

    [ "****************",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*             &*",
      "*              *",
      "*  $  & #  #  @*",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "****************",
      "*R***********BS*",
      "****************"],

    [ "****************",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*  $  & #,,#,,@*",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "*              *",
      "****************",
      "*R***********BS*",
      "****************"]
        */
  ];


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
