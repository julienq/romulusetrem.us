// A puzzle game inspired by Rasende Roboter and Solomon's Key 2
// Created: Apr 30, 2012
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint devel: true, maxerr: 50, indent: 2 */

//(function () {
//  "use strict";

  var SZ = 16,             // Size of the game world
    RATE = 20,             // Clock rate for animations (in 100th of second)
    BLOCKS = [],           // All movable blocks (player, ice cubes, enemies)
    LAVA_ALL = [],         // Lava blocks
    LAVA_P = 0.05,         // Probability of lava bead bubbling
    LAVA_ALPHA = 15,       // Alpha range for lava
    PLAYER,                // Player block
    EDIT = false,          // edit mode
    EDIT_LEVEL,            // level being edited
    EDIT_TOOL = " ",       // current tool while editing
    PAINTING = false,      // mouse down for painting
    HIGHLIGHT_ALPHA = 90,  // alpha for highlighting
    HIGHLIGHT,             // last highlighted position

    EMPTY = " ",           // empty space
    AVATAR = "!",          // player avatar
    ICE_BLOCK = "#",       // ice block
    ROCK = "*",            // rock
    SKATER = "$",          // enemy skater
    ENEMY = "%",           // enemy block
    LAVA = "&",            // lava block
    THIN_ICE = ",",        // thin ice (disappears after it's been stepped on)
    PIT = ":",             // bottomless pit
    HOLE = ";",            // shallow hole, becomes empty space (ice) or lava
    COLORS = { " ": 0xfcf9f0, "!": 0x164e4a, "#": 0xb1f1ff, "*": 0x403530,
      $: 0xed372a, "%": 0xfbb829, "&": 0xfd7033, ",": 0xcadee1, ":": 0x000000,
      ";": 0x808080, R: 0x320943, B: 0xffff00, S: 0x7fff24, E: 0x1693a5,
      G: 0xc5aa9e },

    MOVABLE = { "!": true, "#": true, $: true, "%": true },  // movable blocks
    BOTTOM_PLAY = ["****************", "E************BRS"],  // bottom of levels
    BOTTOM_EDIT = ["****************", "ERG**** !#$%&,:;"],  // bottom for edit
    LEVEL = 0, // LEVELS.length - 1;                         // current level
    LEVELS;                                                  // see below

  // Return data at the given position, or ROCK if out of bounds
  function data_at(x, y) {
    return x >= 0 && x < SZ && y >= 0 && y < SZ ? PS.BeadData(x, y) : ROCK;
  }

  function can_move_to(b, data) {
    return data === EMPTY || data === LAVA || data === THIN_ICE ||
      data === PIT || data === HOLE ||
      (is_enemy(b) && (data.data === ICE_BLOCK || data.data === AVATAR)) ||
      ((b.data === ICE_BLOCK || b.data === AVATAR) && is_enemy(data));
  }

  // Test whether the block b can push block data
  function can_push(b, data, o, dist) {
    var dest_x = o.x + dist * o.dx, dest_y = o.y + dist * o.dy,
      dest_data = data_at(dest_x, dest_y);
    return (((b.data === ICE_BLOCK || b.data === AVATAR) &&
        data.data === ICE_BLOCK) || (is_enemy(b) && is_enemy(data))) &&
      (can_move_to(data, dest_data) || can_push(data, dest_data, o, dist + 1));
  }

  // Test whether a block is an enemy block
  function is_enemy(b) {
    return b.data === SKATER || b.data === ENEMY;
  }

  // Can be called as is_empty(x, y, block) or is_empty(data, block)
  function is_empty(x, y, b) {
    var data = b ? data_at(x, y) : x;
    return data === EMPTY || data === THIN_ICE ||
      (data === LAVA && is_enemy(b || y));
  }

  // Set a bead to a new value and redraw it.
  function set_bead(x, y, data) {
    PS.BeadData(x, y, data);
    PS.BeadColor(x, y, COLORS[data.data || data]);
    PS.BeadBorderWidth(x, y, EDIT || data !== ROCK ? 1 : 0);
    PS.BeadAlpha(x, y, 100);
    if (data === LAVA) LAVA_ALL.push([x, y]);
  }

  // Move a block to a destination x, y
  function move(b, x, y, data) {
    set_bead(b.x, b.y, b.after || EMPTY);
    b.x = x;
    b.y = y;
    set_bead(x, y, b);
    b.after = data === THIN_ICE ? PIT : data === LAVA ? LAVA : EMPTY;
  }

  // Remove a block
  function remove_block(b) {
    BLOCKS.splice(BLOCKS.indexOf(b), 1);
    b.removed = true;
    if (b.pushed_by) {
      delete b.pushed_by.push;
      delete b.pushed_by;
    }
    set_bead(b.x, b.y, b.after || EMPTY);
  }

  // Remove the block; if it's the player, show a dying message
  function die(b) {
    remove_block(b);
    if (b.data === AVATAR) {
      PS.StatusText("OH NOES!!! ☠☠☠");
    } else if (!BLOCKS.some(is_enemy)) {
      PS.StatusText("Well done!");
    }
  }

  // Move a block by one step in the direction that it is currently going
  function step(b) {
    var dest_x = b.x + b.dx, dest_y = b.y + b.dy, dest_data;
    if (!b.removed) {
      if (b.push) step(b.push);
      dest_data = data_at(dest_x, dest_y);
      if (is_empty(dest_data, b)) {
        // Move to an empty spot
        move(b, dest_x, dest_y, dest_data);
      } else if (can_push(b, dest_data, b, 2)) {
        // Push the next block (which may push the next block, and so on)
        b.push = dest_data;
        dest_data.pushed_by = b;
        dest_data.dx = b.dx;
        dest_data.dy = b.dy;
        step(dest_data);
        move(b, dest_x, dest_y, dest_data);
      } else {
        if (!is_enemy(b) && is_enemy(dest_data)) {
          // Player or ice block running into an enemy
          if (b.data === ICE_BLOCK) {
            die(dest_data);
          }
          die(b);
        } else if ((is_enemy(b) && dest_data.data === ICE_BLOCK) ||
            dest_data === LAVA || dest_data === PIT) {
          // Enemy running into an ice block; player or ice block falling in
          // lava; or any block falling in a pit: all die
          die(b);
        } else if (dest_data === HOLE) {
          // When falling in a hole, an enemy fills it with lava or an ice block
          // with ice. The player just dies :(
          die(b);
          if (b.data !== AVATAR) {
            set_bead(dest_x, dest_y, is_enemy(b) ? LAVA : EMPTY);
          }
        }
        b.dx = 0;
        b.dy = 0;
        if (b.pushed_by) {
          delete b.pushed_by.push;
          delete b.pushed_by;
        }
      }
    }
  }





  // Test whether a block is moving
  function is_moving(b) {
    return b.dx !== 0 || b.dy !== 0;
  }

  // Find out the destination of the block from its starting position and
  // current direction
  // TODO step by step simulation
  function destination(b) {
    var x = b.x, y = b.y;
    do {
      x += b.dx;
      y += b.dy;
    } while (x >= 0 && x < SZ && y >= 0 && y < SZ && is_empty(x, y, b));
    x -= b.dx;
    y -= b.dy;
    return { x: x, y: y, dx: b.dx, dy: b.dy, data: PS.BeadData(x, y) };
  }

  // Set a row of beads for a level; add block objects for the player, ice
  // blocks, and enemies and keep track of lava for the bubbling animation
  function set_row(row, y) {
    [].forEach.call(row, function (data, x) {
      if (y < SZ && MOVABLE[data]) {
        // Insert a new block in the following order: player, ice blocks,
        // skaters, enemies
        var i = 0;
        while (i < BLOCKS.length && data >= BLOCKS[i].data) {
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
    LEVEL = (LEVEL + LEVELS.length + (incr || 0)) % LEVELS.length;
    PS.StatusText("Freeeeze ☃ Level " + (LEVEL + 1));
    BLOCKS = [];
    LAVA_ALL = [];
    LEVELS[LEVEL].forEach(set_row);
    (EDIT ? BOTTOM_EDIT : BOTTOM_PLAY).forEach(function (row, y) {
      set_row(row, y + SZ);
    });
    PLAYER = BLOCKS[0];
  }

  // Update the level for new data at (x, y)
  function paint_bead(x, y, data) {
    if (x >= 0 && x < SZ && y >= 0 && y < SZ) {
      LEVELS[LEVEL][y] = LEVELS[LEVEL][y].substr(0, x) + data +
        LEVELS[LEVEL][y].substr(x + 1);
      set_bead(x, y, data);
    }
  }

  // Make the lava bubble
  function lava(p) {
    if (PS.BeadData(p[0], p[1]) === LAVA && Math.random() < LAVA_P) {
      PS.BeadAlpha(p[0], p[1],
        (100 - LAVA_ALPHA + Math.ceil(Math.random() * LAVA_ALPHA)));
      return true;
    }
  }

  // Clear the highlight row or column
  function unhighlight() {
    var i;
    if (HIGHLIGHT) {
      if (HIGHLIGHT.hasOwnProperty("x")) {
        for (i = 0; i < SZ; i += 1) {
          if (!lava([HIGHLIGHT.x, i])) {
            PS.BeadAlpha(HIGHLIGHT.x, i, 100);
          }
        }
      } else if (HIGHLIGHT.hasOwnProperty("y")) {
        for (i = 0; i < SZ; i += 1) {
          if (!lava([i, HIGHLIGHT.y])) {
            PS.BeadAlpha(i, HIGHLIGHT.y, 100);
          }
        }
      }
    }
  }

  // Run the ghost to find winning and losing positions; reachable spots?
  // TODO move other blocks; at the moment, only reachable
  function run_ghost() {

    function encode(x, y, data) {
      return String.fromCharCode(x | (y << 4) | (data.charCodeAt(0) << 8));
    }

    function decode(c) {
      return { x: c & 0xf, y: (c & 0xf0) >> 4,
        data: String.fromCharCode(c >> 8) };
    }

    var blocks = [], configs = {};
    LEVELS[LEVEL].forEach(function (row, y) {
      [].forEach.call(row, function (data, x) {
        if (MOVABLE[data]) {
          var b = encode(x, y, data), i = 0, n = blocks.length;
          while (i < n && data > blocks[i]) {
            i += 1;
          }
          blocks.splice(i, 0, b);
        }
      });
    });
    configs[blocks.join("")] = true;
  }

  // Handle clicks in edit mode
  function click_edit(x, y, data) {
    if (data === "E") {
      // Go back to play mode
      EDIT = false;
      reset_level();
      console.log(LEVELS[LEVEL]);
    } else if (data === "R") {
      // Reset
      for (y = 0; y < SZ; y += 1) {
        LEVELS[LEVEL][y] = "";
        for (x = 0; x < SZ; x += 1) {
          LEVELS[LEVEL][y] += " ";
        }
      }
      reset_level();
    } else if (data === "G") {
      // Ghost
      run_ghost();
    } else if (y === SZ + 1) {
      // Choose a tool
      EDIT_TOOL = data;
      PS.StatusText({ " ": "Ice", "!": "Player", "#": "Ice cube", "*": "Rock",
        $: "Skater", "%": "Enemy", "&": "Lava", ",": "Thin ice",
        ":": "Bottomless pit", ";": "Shallow hole" }[EDIT_TOOL]);
    } else if (y < SZ) {
      // Paint
      paint_bead(x, y, EDIT_TOOL);
      PAINTING = true;
    }
  }

  // Handle clicks in play mode
  function click_play(x, y, data) {
    var dx = 0, dy = 0, dest;
    if (data === "E") {
      // Toggle edit mode: create a new level from this one and push at the end
      EDIT = true;
      if (EDIT_LEVEL !== LEVEL) {
        LEVELS.push(LEVELS[LEVEL].slice());
        EDIT_LEVEL = LEVEL = LEVELS.length - 1;
      }
      reset_level();
    } else if (data === "R") {
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
    } else if (!BLOCKS.some(is_moving)) {
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
          if (b.data === SKATER) {
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
        unhighlight();
        PS.Clock(RATE);
      }
    }
  }

  // Load the current level
  PS.Init = function () {
    PS.GridSize(SZ, SZ + 2);
    PS.GridBGColor(COLORS[ROCK]);
    PS.StatusColor(COLORS[EMPTY]);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    PS.Clock(RATE);
    reset_level();
  };

  PS.Click = function (x, y, data) {
    if (EDIT) {
      click_edit(x, y, data);
    } else {
      click_play(x, y, data);
    }
  };

  // Paint in edit mode, highlight row or column for movement in play mode
  PS.Enter = function (x, y) {
    if (PAINTING) {
      paint_bead(x, y, EDIT_TOOL);
    } else if (!EDIT && !BLOCKS.some(is_moving)) {
      if (x === PLAYER.x && y !== PLAYER.y) {
        PS.BeadAlpha(x, PS.ALL, HIGHLIGHT_ALPHA);
        HIGHLIGHT = { x: x };
      } else if (x !== PLAYER.x && y === PLAYER.y) {
        PS.BeadAlpha(PS.ALL, y, HIGHLIGHT_ALPHA);
        HIGHLIGHT = { y: y };
      } else {
        HIGHLIGHT = null;
      }
    }
  };

  PS.Leave = function () {
    unhighlight();
  };

  PS.Release = function () {
    PAINTING = false;
  };

  // Run one step of animation for every moving object
  PS.Tick = function () {
    BLOCKS.forEach(function (b) {
      if ((b.dx !== 0 || b.dy !== 0) && !b.pushed_by) {
        step(b);
      }
    });
    LAVA_ALL.forEach(lava);
  };

  // The levels

  LEVELS = [
    [ "****************",
      "****************",
      "****************",
      "****************",
      "***       ******",
      "***       ******",
      "***       ******",
      "***  %  #  !  **",
      "***           **",
      "*******       **",
      "*********     **",
      "*********     **",
      "**********   ***",
      "****************",
      "****************",
      "****************"],

    [ "****************",
      "****************",
      "*********  % ***",
      "***  **    # ***",
      "**% #     #  ***",
      "*             **",
      "*             **",
      "**      !      *",
      "**             *",
      "***         # %*",
      "*****   #     **",
      "******    ******",
      "******   *******",
      "******* %*******",
      "****************",
      "****************"],

    [ "****************",
      "****************",
      "***    *********",
      "**  %  *********",
      "**     *********",
      "***       ******",
      "****    #! *****",
      "***       ******",
      "*      *********",
      "*      *********",
      "*     **********",
      "*     **********",
      "*    ***********",
      "****************",
      "****************",
      "****************"],

    [ "****************",
      "***    *********",
      "*** %       ****",
      "***          ***",
      "***           **",
      "****     # !  **",
      "**            **",
      "**            **",
      "**           ***",
      "* #       # ****",
      "*         ******",
      "*#        ******",
      "*         ******",
      "****************",
      "****************",
      "****************"],

    [ "****************",
      "****************",
      "**      ********",
      "**           ***",
      "**     :      **",
      "**             *",
      "***            *",
      "***%   !   # ;**",
      "*****      *****",
      "****************",
      "****************",
      "****************",
      "****************",
      "****************",
      "****************",
      "****************"]

  ];


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
