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

var NOTES = ["d7", "c7", "b6", "f6", "e6", "d6", "c6", "b5", "a5", "g5", "f5",
  "e5", "d5", "c5", "b4", "a4"]
var COLORS = [PS.COLOR_BLACK, PS.COLOR_GRAY_LIGHT, PS.COLOR_GRAY,
    PS.COLOR_GRAY_DARK, PS.COLOR_RED, PS.COLOR_ORANGE, PS.COLOR_YELLOW,
    PS.COLOR_GREEN, PS.COLOR_BLUE, PS.COLOR_INDIGO, PS.COLOR_VIOLET,
    PS.COLOR_CYAN, PS.COLOR_MAGENTA];
var BPM = 104;
var BEAT = 0;

PS.Init = function ()
{
	"use strict";
	PS.GridSize(NOTES.length, NOTES.length);
  PS.StatusText("Xylophone");
  NOTES.forEach(function(note) { PS.AudioLoad("xylo_" + note); });
  update_clock();
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
  PS.BeadData(x, y, !data);
  PS.BeadColor(x, y, data ? PS.DEFAULT : COLORS[PS.Random(COLORS.length) - 1]);
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

	// Put code here for when the mouse enters a bead	
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
  if (key === PS.ARROW_UP) {
    BPM = Math.min(BPM + 4, 240);
    update_clock();
  } else if (key === PS.ARROW_DOWN) {
    BPM = Math.max(BPM - 4, 40);
    update_clock();
  } else if (key === PS.ARROW_LEFT) {
    step(-1);
  } else if (key === PS.ARROW_RIGHT) {
    step(1);
  }
};

function update_clock()
{
  PS.Clock(1500 / BPM);
  PS.StatusText(BPM + " bpm");
}

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

	// Put code here for when a key is pressed	
};

// PS.Tick ()
// This function is called on every clock tick
// if a timer has been activated with a call to PS.Timer()
// It doesn't have to do anything

PS.Tick = function ()
{
	"use strict";
  step(1);
}

function step(incr)
{
  var w = NOTES.length;
  PS.BeadBorderAlpha([BEAT + NOTES.length - incr] % NOTES.length, PS.ALL, 100);
  if (incr < 0) BEAT = (BEAT + NOTES.length + incr) % NOTES.length;
  PS.BeadBorderAlpha(BEAT, PS.ALL, 50);
  for (var y = 0; y < NOTES.length; ++y) {
    if (PS.BeadData(BEAT, y)) {
      PS.AudioPlay("xylo_" + NOTES[y]);
    }
  }
  if (incr > 0) BEAT = (BEAT + 1) % NOTES.length;
};
