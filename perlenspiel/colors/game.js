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

// PS.Init ()
// Initializes the game
// This function normally includes a call to PS.GridSize (x, y)
// where x and y are the desired dimensions of the grid

var X = 0;
var Y = 0;
var SZ = 16;
var THETA = 0;

PS.Init = function ()
{
	"use strict";
  grid_size();
  PS.Clock(10);
};

function grid_size()
{
	PS.GridSize (SZ, SZ);
  PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
  PS.BeadFlash(PS.ALL, PS.ALL, false);
  PS.StatusText(SZ.toString() + "×" + SZ.toString());
}

// PS.Click (x, y, data)
// This function is called whenever a bead is clicked
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set

PS.Click = function (x, y, data)
{
	"use strict";
	
	// put code here for bead clicks
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

	// Put code here for when the mouse button is released over a bead	
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
  X = x;
  Y = y;
  update();
};

function update()
{
  for (var x_ = 0; x_ < SZ; ++x_) {
    for (var y_ = 0; y_ < SZ; ++y_) {
      var dx = X - x_;
      var dy = Y - y_;
      var a = Math.atan2(dy, dx) + THETA;
      var d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) /
        (Math.sqrt(2) * SZ);
      PS.BeadColor(x_, y_, PS.MakeRGB.apply(PS, hsv_to_rgb(a, d, 1)));
    }
  }
}

// PS.Leave (x, y, data)
// This function is called whenever the mouse moves away from a bead
// It doesn't have to do anything
// x = the x-position of the bead on the grid
// y = the y-position of the bead on the grid
// data = the data value associated with this bead, 0 if none has been set

PS.Leave = function (x, y, data)
{
	"use strict";

	// Put code here for when the mouse leaves a bead	
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

	// Put code here for when a key is pressed	
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
	
	// Put code here for when a key is released	
};

// PS.Wheel (dir)
// This function is called whenever the mouse wheel moves forward or backward
// It doesn't have to do anything
// dir = 1 if mouse wheel moves forward, -1 if backward

PS.Wheel = function (dir)
{
	"use strict";
  SZ = Math.min(Math.max(SZ + dir, 1), 16);
  grid_size();
  update();
};

// PS.Tick ()
// This function is called on every clock tick
// if a timer has been activated with a call to PS.Timer()
// It doesn't have to do anything

PS.Tick = function ()
{
	"use strict";
  THETA += 0.05;
  update();
};


// Convert a color from hsv space (hue in radians, saturation and brightness
// in the [0, 1] range) to RGB, returned as an array in the [0, 256[ range.
function hsv_to_rgb(h, s, v)
{
  s = Math.min(Math.max(s, 0), 1);
  v = Math.min(Math.max(v, 0), 1);
  if (s === 0) {
    var v_ = Math.round(v * 255);
    return [v_, v_, v_];
  } else {
    h = (((h * 180 / Math.PI) + 360) % 360) / 60;
    var i = Math.floor(h);
    var f = h - i;
    var p = v * (1 - s);
    var q = v * (1 - (s * f));
    var t = v * (1 - (s * (1 - f)));
    return [Math.round([v, q, p, p, t, v][i] * 255),
      Math.round([t, v, v, q, p, p][i] * 255),
      Math.round([p, p, t, v, v, q][i] * 255)];
  }
};
