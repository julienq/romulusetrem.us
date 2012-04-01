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
  ], ["Checkerboard",
    [0,0,0,0,0,0],
    [0,1,3,1,3,0],
    [0,3,1,3,1,0],
    [0,1,7,1,3,0],
    [0,3,1,3,1,0],
    [0,0,0,0,0,0],
  ], ["Hmmm... what's up with that?",
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [7,1,1,1,1,1,7],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ], ["There can be only one",
    [7,1,1,1,1,1,1],
    [0,0,0,3,0,0,0],
    [1,1,1,1,1,1,7],
  ], ["That's it; you won the game!",
    [0,1,3],
    [1,3,0],
    [3,0,1]
  ]
]

var W, H, T, OVER;

function adjacent(x, y)
{
  var adj = [];
  for (var i = -1; i <= 1; i += 2) {
    var x_ = x + i;
    if (x_ >= 0 && x_ < W) {
      var data = PS.BeadData(x_, y);
      if (data & 4) adj.push([x_, y]);
    }
  }
  for (var i = -1; i <= 1; i += 2) {
    var y_ = y + i;
    if (y_ >= 0 && y_ < H) {
      var data = PS.BeadData(x, y_);
      if (data & 4) adj.push([x, y_]);
    }
  }
  return adj;
}

function update_cell(x, y, data)
{
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
  } else {
    PS.BeadShow(x, y, false);
  }
}

function show_level(n)
{
  var level = LEVELS[n];
  PS.StatusText("Atlas (" + (n + 1) + ") " + level[0]);
  OVER = false;
  H = level.length - 1;
  W = level[1].length;
  T = [0, 0, 0];
  PS.GridSize(W, H);
  for (var y = 0; y < H; ++y) {
    for (var x = 0; x < W; ++x) {
      var data = level[y + 1][x];
      update_cell(x, y, data);
      if (data) {
        ++T[(data & 2) >> 1];  // count the tiles of each color
        if (data & 4) ++T[2];  // and the "player" tiles
      }
    }
  }
  PS.AudioPlay("fx_tick");
}

function over(won)
{
  OVER = true;
  if (won) { ++LEVEL;
    PS.StatusText("Well done! Click any tile for next level");
    PS.AudioPlay("fx_tada");
  } else {
    PS.StatusText("D'oh! Click any tile to try again.");
    PS.AudioPlay("fx_uhoh");
  }
}


// PS functions that need to be defined

PS.Init = function ()
{
  PS.GridSize(8, 8);
  show_level(LEVEL);
};

PS.Click = function (x, y, data)
{
  if (OVER) {
    show_level(LEVEL);
  } else {
    var adj = adjacent(x, y);
    if (data && adj.length) {
      var c = 1 - ((data & 2) >> 1);
      adj.forEach(function(p) {
          update_cell(p[0], p[1], PS.BeadData(p[0], p[1]) - 4);
        });
      update_cell(x, y, 5 + 2 * c);
      ++T[c];
      T[2] -= (adj.length - 1);
      PS.AudioPlay("fx_pop");
      if (--T[1 - c] === 0) over(T[2] === 1);
    } else {
      PS.AudioPlay("fx_click");
    }
  }
};

PS.Release = function (x, y, data) {};
PS.Enter = function (x, y, data) {};
PS.Leave = function (x, y, data) {};
PS.KeyDown = function (key, shift, ctrl) {};
PS.KeyUp = function (key, shift, ctrl) {};
PS.Wheel = function (dir) {};
PS.Tick = function () {};
