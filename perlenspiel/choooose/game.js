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

// The following comment line is for JSLint. Don't remove it!
/*global PS */

(function () {
  "use strict";

  var W = 4, H = 4, POSITION = 1, HINT,
    COLORS = { here: 0xa0d4a4, there: 0xffffa7 },
    PARAGRAPHS = [
      ["You enter the Dragon's cave",
        ["A dark passage", 3],
        ["A slope toward the abyss", 9]],
      ["A dangerous looking platform",
        ["11", 11],
        ["14", 14],
        ["A light in the distance", 15]],
      ["You're in a dark corridor",
        ["A shallow recess in the cave walls", 7],
        ["A dangerous looking bridge", 13]],
      ["You plummet to your death!"],
      ["5", ["14", 14]],
      ["6", ["15", 15]],
      ["You see mysterious black markings on the walls",
        ["A narrow bridge", 13]],
      ["8", ["2", 2]],
      ["Going deep into ...", ["8", 8], ["6", 6], ["12", 12]],
      ["10", ["5", 5]],
      ["11", ["10", 10], ["5", 5], ["16", 16]],
      ["12", ["2", 2]],
      ["A narrow bridge of black and gray stones",
        ["Walk on the black stones", 2],
        ["Walk on the gray stones", 4]],
      ["14", ["8", 8]],
      ["A hideous troll carrying a torch kills you!"],
      ["You win! (16)"]
    ];

  function update_position() {
    var p = POSITION - 1;
    PS.BeadColor(PS.ALL, PS.ALL, PS.DEFAULT);
    PS.BeadFunction(PS.ALL, PS.ALL, PS.DEFAULT);
    PS.BeadData(PS.ALL, PS.ALL, null);
    PS.BeadColor(p % W, Math.floor(p / H), COLORS.here);
    PARAGRAPHS[p].slice(1).forEach(function (pp) {
      var x = (pp[1] - 1) % W, y = Math.floor((pp[1] - 1) / H);
      PS.BeadColor(x, y, COLORS.there);
      PS.BeadData(x, y, pp[0]);
      PS.BeadFunction(x, y, function () {
        POSITION = pp[1];
        update_position();
      });
    });
    PS.StatusText(PARAGRAPHS[p][0]);
    HINT = false;
  }

  PS.Init = function () {
    "use strict";
    PS.GridSize(W, H);
    PARAGRAPHS.forEach(function (data, i) {
      PS.BeadData(i % W, Math.floor(i / H), data);
    });
    update_position();
  };

  PS.Enter = function (x, y, data) {
    if (data) {
      PS.StatusText(data);
      HINT = true;
    }
  };

  PS.Leave = function () {
    if (HINT) {
      PS.StatusText(PARAGRAPHS[POSITION - 1][0]);
      HINT = false;
    }
  };

  // Unused

  PS.Click = function () {};
  PS.Release = function () {};
  PS.KeyDown = function () {};
  PS.KeyUp = function () {};
  PS.Wheel = function () {};
  PS.Tick = function () {};

}());
