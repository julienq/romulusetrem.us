// A very simple choose your own adventure game/engine
// Created: May 24, 2012
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS */
/*jslint indent: 2, unparam: true */

(function () {
  "use strict";

  var W = 4, H = 4, POSITION = 1, HINT,
    COLORS = { here: 0xa0d4a4, there: 0xffffa7 },
    PARAGRAPHS = [
      ["The Dragon's Cave",  // 1
        ["A dark passage", 3],
        ["A slope descending into the abyss", 9]],
      ["A dangerous looking platform",  // 2
        ["Such heat!", 11],
        ["Foul smells", 14],
        ["A wobbly light nearby", 15]],
      ["In a dark corridor",  // 3
        ["A shallow recess", 7],
        ["A dangerous looking bridge", 13]],
      ["You plummet to your death!"],  // 4
      ["Circumventing the Dragon",  // 5
        ["A corridor leading away", 14]],
      ["The light seems to be moving?",  // 6
        ["The light is getting closer", 15]],
      ["Mysterious black markings on the walls",  // 7
        ["A narrow bridge", 13]],
      ["A large, empty hallway",  // 8
        ["A platform in the distance", 2]],
      ["Deep in the Dragon's lair",  // 9
        ["A large hallway", 8],
        ["A dim light in the distance", 6],
        ["A narrow corridor", 12]],
      ["The Dragon is still close...",  // 10
        ["Careful...", 5]],
      ["You catch a glimpse of the Dragon nearby!",  // 11
        ["Looks like a safer place", 10],
        ["Keep your distance", 5],
        ["The Dragon is sleeping", 16]],
      ["A narrow and damp corridor",  // 12
        ["Toward a large hallway", 2]],
      ["A narrow bridge of black and gray stones",  // 13
        ["Walk on the black stones", 2],
        ["Walk on the gray stones", 4]],
      ["A moldy corridor",  // 14
        ["Somewhat fresher air", 8]],
      ["A hideous troll carrying a torch kills you!"],  // 15
      ["You slay the sleeping Dragon!"]  // 16
    ];

  // Show current position and destinations
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

  // Setup the grid and start from the initial position
  PS.Init = function () {
    PS.GridSize(W, H);
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    PARAGRAPHS.forEach(function (data, i) {
      PS.BeadData(i % W, Math.floor(i / H), data);
    });
    update_position();
  };

  // Show a hint for this bead, if any
  PS.Enter = function (x, y, data) {
    if (data) {
      PS.StatusText(data);
      HINT = true;
    }
  };

  // Remove the hint
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
