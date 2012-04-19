// game.js for Perlenspiel 2.1

/*
Perlenspiel is Copyright © 2009-12 Worcester Polytechnic Institute.
This file is part of Perlenspiel.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with Perlenspiel. If not, see <http://www.gnu.org/licenses/>.
*/

/*global PS */

// The simulated world
var SIM =
{
  size: 32,
  demand: { c: 0, r: 0, i: 100 },
  capacity: { c: 0, r: 0, i: 0 },
  population: { c: 0, r: 0, i: 0 },
  zones: { c: [], i: [], r: [] },
};

var TOOL = null;     // current tool (functions like streets, zone, etc.)
var ACTIVE = false;  // tool is currently active (when dragging)

// Colors for borders and backgrounds
BORDERS = { ground: 0xcda658, bulldozed: 0xcda658, tree: 0xcda658,
  water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
  commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 };
COLORS = { ground: 0xcda658, bulldozed:0x645450, tree: 0x2a5625,
  water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
  commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 };

// Make a rectangle object; width and height may be negative meaning that we go
// down from that corner instead of up
function make_rect(x, y, w, h)
{
  var rect =
  {
    // Iterate over all beads in the rectangle, calling a function with x, y,
    // and data for that bead
    iterate: function(f)
    {
      var x_min = this.w > 0 ? this.x : this.x + this.w - 1;
      var x_max = this.w > 0 ? this.x + this.w - 1 : this.x;
      var y_min = this.h > 0 ? this.y : this.y + this.h - 1;
      var y_max = this.h > 0 ? this.y + this.h - 1 : this.y;
      for (var x = x_min; x <= x_max; ++x) {
        for (var y = y_min; y <= y_max; ++y) {
          f(x, y, PS.BeadData(x, y));
        }
      }
    },

    // Test all beads and return false as soon as a bead fails, or true after
    // all beads have been tested
    test: function(p)
    {
      var x_min = this.w > 0 ? this.x : this.x + this.w - 1;
      var x_max = this.w > 0 ? this.x + this.w - 1 : this.x;
      var y_min = this.h > 0 ? this.y : this.y + this.h - 1;
      var y_max = this.h > 0 ? this.y + this.h - 1 : this.y;
      for (var x = x_min; x <= x_max; ++x) {
        for (var y = y_min; y <= y_max; ++y) {
          if (!p(x, y, PS.BeadData(x, y))) return false;
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
function update_region(rect)
{
  rect.iterate(function(x, y, data) {
      PS.BeadBorderColor(x, y, BORDERS[data.type]);
      PS.BeadColor(x, y, COLORS[data.type]);
      PS.BeadAlpha(x, y, 50 + Math.round(("pop" in data ?
            data.pop : .75 + .25 * Math.random()) * 50));
    });
}

// Rect for the whole world
var WORLD = make_rect(0, 0, SIM.size, SIM.size);

// Create a new map with some water and trees
function terraform()
{
  WORLD.iterate(function(x, y) {
      var type = Math.random() < 0.075 ? "tree" : "ground";
      PS.BeadData(x, y, { type: type, pop: 0.25 * Math.random() + 0.75 });
    });
  // Make a coast
  var coast = PS.Random(5) - 1;
  var depth = coast === 4 ? 0 : PS.Random(3) + 2;
  for (var i = 0; i < depth; ++i) {
    var x = coast === 0 ? SIM.size - i - 1 : coast === 2 ? i : PS.ALL;
    var y = coast === 1 ? i : coast === 3 ? SIM.size - i - 1 : PS.ALL;
    PS.BeadData(x, y, { type: "water" })
  }
  // And a river
  var j = Math.round(PS.Random(SIM.size / 2) + SIM.size / 4);
  var w = PS.Random(3) + (coast === 4 ? 1 : 0);
  if (coast === 4) coast = PS.Random(4) - 1;
  for (var i = 0; i < w; ++i) {
    var x = coast === 1 || coast === 3 ? j + i : PS.ALL;
    var y = coast === 0 || coast === 2 ? j + i : PS.ALL;
    PS.BeadData(x, y, { type: "water" });
  }
  update_region(WORLD);
}

var CITY =
{
  zones: { residential: [], commercial: [], industrial: [] },
};

// Run the simulation for one tick
function update_world()
{
  WORLD.iterate(function(x, y, data) {
      if (data.cap) {
        // var incr = Math.random() * 0.1 - 0.05;
        // data.pop = Math.max(0, Math.min(data.pop + incr, 1));
      }
    });
}

// Draw streets
function streets(x, y, data)
{
  if (x === undefined) {
    PS.AudioPlay("fx_click");
    return;
  }
  if (data.type !== "water" && data.type !== "ground") return;
  var type = data.type === "water" ? "bridge" : "street";
  PS.BeadData(x, y, { type: type, cap: 1, pop: 0 });
  update_region(make_rect(x, y, 1, 1));
}

// Bulldoze
// TODO bulldozing a zone will empty it of its population
function bulldozer(x, y, data)
{
  if (x === undefined) {
    PS.AudioPlay("fx_bomb1");
    return;
  }
  if (data.type === "water" || data.type === "ground") return;
  if (data.type === "bridge") {
    PS.BeadData(x, y, { type: "water" });
  } else if (data.type === "bulldozed" || data.type === "tree") {
    PS.BeadData(x, y, { type: "ground", pop: 0.25 * Math.random() + 0.75 });
  } else {
    PS.BeadData(x, y, { type: "bulldozed", pop: 1 });
  }
}

// Zone function
function zone(type, cap, x, y, data)
{
  if (x === undefined) {
    if (WORLD.selection.ok) {
      WORLD.selection.iterate(function(x, y) {
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
    WORLD.selection.ok = WORLD.selection.test(function(x, y, data) {
        return data.type === "ground";
      });
    if (WORLD.selection.ok) {
      WORLD.selection.iterate(function(x, y) {
          PS.BeadBorderColor(x, y, BORDERS[type]);
        });
    }
  }
}

// Initialize the grid and the game world
PS.Init = function ()
{
  "use strict";
  PS.GridSize(SIM.size, SIM.size);
  PS.BeadFlash(PS.ALL, PS.ALL, false);
  terraform();
  PS.StatusText("Picopolis");
  PS.Clock(20);
};

// Activate the currently selected tool on mouse down
PS.Click = function (x, y, data)
{
  "use strict";
  ACTIVE = !!TOOL;
  if (ACTIVE) TOOL(x, y, data);
};

// Deactivate the current tool/selection
PS.Release = function (x, y, data)
{
  "use strict";
  if (ACTIVE) TOOL();
  ACTIVE = false;
};

// Keep dragging
PS.Enter = function (x, y, data)
{
  "use strict";
  if (ACTIVE) TOOL(x, y, data);
};

// TODO track leaving the grid?
PS.Leave = function (x, y, data) {};

// Select a tool
PS.KeyDown = function (key, shift, ctrl)
{
  "use strict";
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

PS.KeyUp = function (key, shift, ctrl) {};
PS.Wheel = function (dir) {};

// Update world on every tick and redraw world and selection
PS.Tick = function ()
{
  "use strict";
  update_world();
  update_region(WORLD)
  if (WORLD.selection && WORLD.selection.ok) {
    WORLD.selection.iterate(function(x, y) {
        PS.BeadBorderColor(x, y, BORDERS[WORLD.selection.type]);
      });
  }
};
