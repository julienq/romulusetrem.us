// A tiny version of Micropolis/Sim City
// TODO actual simulation!
// Created: Mar 15, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS: false */
/*jslint unparam: true, maxerr: 50, indent: 2 */

(function () {
  "use strict";

  // The simulated world
  var
    SIM = {
      size: 32,
      demand: { c: 0, r: 0, i: 100 },
      capacity: { c: 0, r: 0, i: 0 },
      population: { c: 0, r: 0, i: 0 },
      zones: { c: [], i: [], r: [] }
    },

    TOOL = null,     // current tool (functions like streets, zone, etc.)
    ACTIVE = false,  // tool is currently active (when dragging)

    // Colors for borders and backgrounds
    BORDERS = { ground: 0xcda658, bulldozed: 0xcda658, tree: 0xcda658,
      water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
      commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 },
    COLORS = { ground: 0xcda658, bulldozed: 0x645450, tree: 0x2a5625,
      water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
      commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 },

    // TODO move the city to the simulator object
    CITY = {
      zones: { residential: [], commercial: [], industrial: [] }
    },

    WORLD;

  // Make a rectangle object; width and height may be negative meaning that we go
  // down from that corner instead of up
  function make_rect(x, y, w, h) {
    var rect = {
      // Iterate over all beads in the rectangle, calling a function with x, y,
      // and data for that bead
      iterate: function (f) {
        var
          x_min = this.w > 0 ? this.x : this.x + this.w - 1,
          x_max = this.w > 0 ? this.x + this.w - 1 : this.x,
          y_min = this.h > 0 ? this.y : this.y + this.h - 1,
          y_max = this.h > 0 ? this.y + this.h - 1 : this.y,
          x, y;
        for (x = x_min; x <= x_max; x += 1) {
          for (y = y_min; y <= y_max; y += 1) {
            f(x, y, PS.BeadData(x, y));
          }
        }
      },

      // Test all beads and return false as soon as a bead fails, or true after
      // all beads have been tested
      test: function (p) {
        var
          x_min = this.w > 0 ? this.x : this.x + this.w - 1,
          x_max = this.w > 0 ? this.x + this.w - 1 : this.x,
          y_min = this.h > 0 ? this.y : this.y + this.h - 1,
          y_max = this.h > 0 ? this.y + this.h - 1 : this.y,
          x, y;
        for (x = x_min; x <= x_max; x += 1) {
          for (y = y_min; y <= y_max; y += 1) {
            if (!p(x, y, PS.BeadData(x, y))) {
              return false;
            }
          }
        }
        return true;
      }
    };
    rect.x = x;
    rect.y = y;
    rect.w = w;
    rect.h = h;
    return rect;
  }

  // Update the region given by the rect
  function update_region(rect) {
    rect.iterate(function (x, y, data) {
      PS.BeadBorderColor(x, y, BORDERS[data.type]);
      PS.BeadColor(x, y, COLORS[data.type]);
      PS.BeadAlpha(x, y, 50 + Math.round((data.hasOwnProperty("pop") ?
            data.pop : 0.75 + 0.25 * Math.random()) * 50));
    });
  }


  // Create a new map with some water and trees
  function terraform() {
    var coast, depth, i, j, w, x, y;
    WORLD.iterate(function (x, y) {
      var type = Math.random() < 0.075 ? "tree" : "ground";
      PS.BeadData(x, y, { type: type, pop: 0.25 * Math.random() + 0.75 });
    });
    // Make a coast
    coast = PS.Random(5) - 1;
    depth = coast === 4 ? 0 : PS.Random(3) + 2;
    for (i = 0; i < depth; i += 1) {
      x = coast === 0 ? SIM.size - i - 1 : coast === 2 ? i : PS.ALL;
      y = coast === 1 ? i : coast === 3 ? SIM.size - i - 1 : PS.ALL;
      PS.BeadData(x, y, { type: "water" });
    }
    // And a river
    j = Math.round(PS.Random(SIM.size / 2) + SIM.size / 4);
    w = PS.Random(3) + (coast === 4 ? 1 : 0);
    if (coast === 4) {
      coast = PS.Random(4) - 1;
    }
    for (i = 0; i < w; i += 1) {
      x = coast === 1 || coast === 3 ? j + i : PS.ALL;
      y = coast === 0 || coast === 2 ? j + i : PS.ALL;
      PS.BeadData(x, y, { type: "water" });
    }
    update_region(WORLD);
  }

  // Run the simulation for one tick
  function update_world() {
    /*WORLD.iterate(function (x, y, data) {
      if (data.cap) {
        // var incr = Math.random() * 0.1 - 0.05;
        // data.pop = Math.max(0, Math.min(data.pop + incr, 1));
      }
    });*/
  }

  // Draw streets
  function streets(x, y, data) {
    if (x === undefined) {
      PS.AudioPlay("fx_click");
    } else if (data.type === "water" || data.type === "ground") {
      var type = data.type === "water" ? "bridge" : "street";
      PS.BeadData(x, y, { type: type, cap: 1, pop: 0 });
      update_region(make_rect(x, y, 1, 1));
    }
  }

  // Bulldoze
  // TODO bulldozing a zone will empty it of its population
  function bulldozer(x, y, data) {
    if (x === undefined) {
      PS.AudioPlay("fx_bomb1");
    } else if (data.type === "bridge") {
      PS.BeadData(x, y, { type: "water" });
    } else if (data.type === "bulldozed" || data.type === "tree") {
      PS.BeadData(x, y, { type: "ground", pop: 0.25 * Math.random() + 0.75 });
    } else if (data.type !== "water" && data.type !== "ground") {
      PS.BeadData(x, y, { type: "bulldozed", pop: 1 });
    }
  }

  // Zone function
  function zone(type, cap, x, y) {
    if (x === undefined) {
      if (WORLD.selection.ok) {
        WORLD.selection.iterate(function (x, y) {
          PS.BeadData(x, y, { type: type, cap: cap, pop: cap,
            zone: WORLD.selection });
        });
        PS.AudioPlay("fx_click");
      }
      CITY.zones[type].push(WORLD.selection);
      update_region(WORLD.selection);
      WORLD.selection = null;
    } else {
      if (WORLD.selection) {
        update_region(WORLD.selection);
      } else {
        WORLD.selection = make_rect(x, y, 1, 1);
        WORLD.selection.type = type;
      }
      WORLD.selection.w = 1 + x - WORLD.selection.x;
      WORLD.selection.h = 1 + y - WORLD.selection.y;
      WORLD.selection.ok = WORLD.selection.test(function (x, y, data) {
        return data.type === "ground";
      });
      if (WORLD.selection.ok) {
        WORLD.selection.iterate(function (x, y) {
          PS.BeadBorderColor(x, y, BORDERS[type]);
        });
      }
    }
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Initialize the grid and the game world
  PS.Init = function () {
    WORLD = make_rect(0, 0, SIM.size, SIM.size);
    PS.GridSize(SIM.size, SIM.size);
    PS.BeadFlash(PS.ALL, PS.ALL, false);
    terraform();
    PS.StatusText("Picopolis");
    PS.Clock(20);
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Activate the currently selected tool on mouse down
  PS.Click = function (x, y, data) {
    ACTIVE = !!TOOL;
    if (ACTIVE) {
      TOOL(x, y, data);
    }
  };

  // PS.Release (x, y, data)
  // This function is called whenever a mouse button is released over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Deactivate the current tool/selection
  PS.Release = function () {
    if (ACTIVE) {
      TOOL();
    }
    ACTIVE = false;
  };

  // PS.Enter (x, y, button, data)
  // This function is called whenever the mouse moves over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Keep dragging
  PS.Enter = function (x, y, data) {
    if (ACTIVE) {
      TOOL(x, y, data);
    }
  };

  // PS.KeyDown (key, shift, ctrl)
  // This function is called whenever a key on the keyboard is pressed
  // It doesn't have to do anything
  // key = the ASCII code of the pressed key, or one of the following constants:
  // Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
  // Function keys = PS.F1 through PS.F1
  // shift = true if shift key is held down, false otherwise
  // ctrl = true if control key is held down, false otherwise

  // Select a tool
  PS.KeyDown = function (key, shift) {
    var str = String.fromCharCode(key);
    if (str === "c" || str === "C") {
      TOOL = zone.bind(this, "commercial", shift ? 1 : 0.5);
      PS.StatusText("Zone for commercial" + (shift ? "" : " (light)"));
    } else if (str === "r" || str === "R") {
      TOOL = zone.bind(this, "residential", shift ? 1 : 0.5);
      PS.StatusText("Zone for residential" + (shift ? "" : " (light)"));
    } else if (str === "i" || str === "I") {
      TOOL = zone.bind(this, "industrial", shift ? 1 : 0.5);
      PS.StatusText("Zone for industrial" + (shift ? "" : " (light)"));
    } else if (str === "s" || str === "S") {
      TOOL = streets;
      PS.StatusText("Build streets");
    } else if (str === "z" || str === "Z") {
      // BulldoZe
      TOOL = bulldozer;
      PS.StatusText("Bulldozer");
    }
  };

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Update world on every tick and redraw world and selection
  PS.Tick = function () {
    update_world();
    update_region(WORLD);
    if (WORLD.selection && WORLD.selection.ok) {
      WORLD.selection.iterate(function (x, y) {
        PS.BeadBorderColor(x, y, BORDERS[WORLD.selection.type]);
      });
    }
  };


  // These are not used but need to be defined

  // PS.Leave (x, y, data)
  // This function is called whenever the mouse moves away from a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // TODO track leaving the grid?
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
