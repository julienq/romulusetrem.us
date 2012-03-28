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

var LEVEL = 0;
var COLORS = [0xff7f00, 0x007fff];
var BORDER_COLORS = [PS.COLOR_GRAY, 0x7fff00];

var LEVELS =
[
  ["Getting your feet wet",
    [0,0,0,0],
    [0,7,1,0],
    [0,3,1,0],
    [0,0,0,0]
  ], ["Try to end on the blue square",
    [0,0,0,0,0,0,0,0],
    [0,7,0,0,0,0,0,0],
    [0,1,0,0,1,1,1,0],
    [0,1,0,0,1,0,1,0],
    [0,1,0,1,3,1,1,0],
    [0,1,0,1,1,0,0,0],
    [0,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0],
  ], ["That's it; you won the game!",
    [0,1,3],
    [1,3,0],
    [3,0,1]
  ]
]

var W, H, Px, Py, T, WON;

function update_cell(x, y, data)
{
  "use strict";
  if (data === undefined) {
    data = PS.BeadData(x, y);
  } else {
    PS.BeadData(x, y, data);
  }
  if (data) {
    PS.BeadShow(x, y, true);
    PS.BeadColor(x, y, COLORS[(data & 2) >> 1]);
    var p = data & 4;
    PS.BeadBorderColor(x, y, BORDER_COLORS[p >> 2]);
    PS.BeadBorderWidth(x, y, 1 + p);
    if (!!p) {
      Px = x;
      Py = y;
    }
  } else {
    PS.BeadShow(x, y, false);
  }
}

function show_level(n)
{
  "use strict";
  var level = LEVELS[n];
  PS.StatusText("Atlas | " + level[0]);
  WON = false;
  H = level.length - 1;
  W = level[1].length;
  T = [0, 0];
  PS.GridSize(W, H);
  for (var y = 0; y < H; ++y) {
    for (var x = 0; x < W; ++x) {
      var data = level[y + 1][x];
      update_cell(x, y, data);
      if (data) ++T[(data & 2) >> 1];
    }
  }
  PS.AudioPlay("fx_beep");
}

function won()
{
  PS.StatusText("Well done! Click anywhere for next level");
  WON = true;
  ++LEVEL;
  PS.AudioPlay("fx_tada");
}

PS.Init = function ()
{
  "use strict";
  PS.GridSize(8, 8);
  show_level(LEVEL);
};

PS.Click = function (x, y, data)
{
  "use strict";
  if (WON) {
    show_level(LEVEL);
  } else if (data && Math.abs(Px - x) + Math.abs(Py - y) === 1) {
    var c = 1 - ((data & 2) >> 1);
    update_cell(Px, Py, PS.BeadData(Px, Py) - 4);
    update_cell(x, y, 5 + 2 * c);
    ++T[c];
    PS.AudioPlay("fx_pop");
    if (--T[1 - c] === 0) won();
  } else {
    PS.AudioPlay("fx_click");
  }
};

PS.Release = function (x, y, data) {};
PS.Enter = function (x, y, data) {};
PS.Leave = function (x, y, data) {};
PS.KeyDown = function (key, shift, ctrl) {};
PS.KeyUp = function (key, shift, ctrl) {};
PS.Wheel = function (dir) {};
PS.Tick = function () {};
