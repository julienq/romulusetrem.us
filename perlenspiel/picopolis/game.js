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

// This is a template for creating new Perlenspiel games
// All of the functions below MUST exist, or the engine will stop and complain!

// The following comment line is for JSLint. Don't remove it!

/*global PS */

var SZ = 32;
var BG_COLOR = 0xcda658;
var BORDER_COLOR = PS.COLOR_GRAY;

var TOOL = null;
var ACTIVE = false;

BORDERS = { ground: 0xcda658, bulldozed: 0xcda658, tree: 0xcda658,
  water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
  commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 };
COLORS = { ground: 0xcda658, bulldozed:0x645450, tree: 0x2a5625,
  water: 0x02aab0, street: PS.COLOR_GRAY, bridge: PS.COLOR_GRAY,
  commercial: 0x1574b6, residential: 0x3eb615, industrial: 0xff7f40 };

function make_rect(x, y, w, h)
{
  var rect = {
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

function update_region(rect)
{
  rect.iterate(function(x, y, data) {
      PS.BeadBorderColor(x, y, BORDERS[data && data.type]);
      PS.BeadColor(x, y, COLORS[data && data.type]);
      PS.BeadAlpha(x, y, 50 + Math.round(("pop" in data ?
            data.pop : .75 + .25 * Math.random()) * 50));
    });
}

var WORLD = make_rect(0, 0, SZ, SZ);

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
    var x = coast === 0 ? SZ - i - 1 : coast === 2 ? i : PS.ALL;
    var y = coast === 1 ? i : coast === 3 ? SZ - i - 1 : PS.ALL;
    PS.BeadData(x, y, { type: "water" })
  }
  // And a river
  var j = Math.round(PS.Random(SZ / 2) + SZ / 4);
  var w = PS.Random(3) + (coast === 4 ? 1 : 0);
  if (coast === 4) coast = PS.Random(4) - 1;
  for (var i = 0; i < w; ++i) {
    var x = coast === 1 || coast === 3 ? j + i : PS.ALL;
    var y = coast === 0 || coast === 2 ? j + i : PS.ALL;
    PS.BeadData(x, y, { type: "water" });
  }
  update_region(WORLD);
}

function update_world()
{
  WORLD.iterate(function(x, y, data) {
      if (data.cap) {
        var incr = Math.random() * 0.1 - 0.05;
        data.pop = Math.max(0, Math.min(data.pop + incr, 1));
      }
    });
  update_region(make_rect(0, 0, SZ, SZ));
  if (WORLD.selection && WORLD.selection.ok) {
    WORLD.selection.iterate(function(x, y) {
        PS.BeadBorderColor(x, y, BORDERS[WORLD.selection.type]);
      });
  }
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
          PS.BeadData(x, y, { type: type, cap: cap, pop: 0 });
        });
      PS.AudioPlay("fx_click");
    }
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

// PS.Init ()
// Initializes the game
// This function normally includes a call to PS.GridSize (x, y)
// where x and y are the desired dimensions of the grid
PS.Init = function ()
{
  "use strict";
  PS.GridSize(SZ, SZ);
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
PS.Click = function (x, y, data)
{
  "use strict";
  ACTIVE = !!TOOL;
  if (ACTIVE) TOOL(x, y, data);
};

// PS.Release (x, y, data)
// This function is called whenever a mouse button is released over a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Release = function (x, y, data)
{
  "use strict";
  if (ACTIVE) TOOL();
  ACTIVE = false;
};

// PS.Enter (x, y, button, data)
// This function is called whenever the mouse moves over a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Enter = function (x, y, data)
{
  "use strict";
  if (ACTIVE) TOOL(x, y, data);
};

// PS.Leave (x, y, data)
// This function is called whenever the mouse moves away from a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set
PS.Leave = function (x, y, data)
{
  "use strict";
};

// PS.KeyDown (key, shift, ctrl)
// This function is called whenever a key on the keyboard is pressed
// It doesn't have to do anything
// key = the ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F1
// shift = true if shift key is held down, false otherwise
// ctrl = true if control key is held down, false otherwise
PS.KeyDown = function (key, shift, ctrl)
{
  "use strict";
  var str = String.fromCharCode(key);
  if (str === "c" || str === "C") {
    TOOL = zone.bind(this, "commercial", shift ? 1 : 0.5);
    PS.StatusText("Zone for commercial");
  } else if (str === "r" || str === "R") {
    TOOL = zone.bind(this, "residential", shift ? 1 : 0.5);
    PS.StatusText("Zone for residential");
  } else if (str === "i" || str === "I") {
    TOOL = zone.bind(this, "industrial", shift ? 1 : 0.5);
    PS.StatusText("Zone for industrial");
  } else if (str === "s" || str === "S") {
    TOOL = streets;
    PS.StatusText("Build streets");
  } else if (str === "z" || str === "Z") {
    // BulldoZe
    TOOL = bulldozer;
    PS.StatusText("Bulldozer");
  }
};

// PS.KeyUp (key, shift, ctrl)
// This function is called whenever a key on the keyboard is released
// It doesn't have to do anything
// key = the ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F12
// shift = true if shift key is held down, false otherwise
// ctrl = true if control key is held down, false otherwise
PS.KeyUp = function (key, shift, ctrl)
{
  "use strict";
};

// PS.Wheel (dir)
// This function is called whenever the mouse wheel moves forward or backward
// It doesn't have to do anything
// dir = 1 if mouse wheel moves forward, -1 if backward
PS.Wheel = function (dir)
{
  "use strict";
};

// PS.Tick ()
// This function is called on every clock tick
// if a timer has been activated with a call to PS.Timer()
// It doesn't have to do anything
PS.Tick = function ()
{
  "use strict";
  update_world();
};
