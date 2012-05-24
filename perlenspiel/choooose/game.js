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

  var W = Math.ceil(Math.sqrt(window.PARAGRAPHS.length)),
    H = Math.ceil(window.PARAGRAPHS.length / W),
    POSITION = 1, HINT,
    COLORS = { here: 0xa0d4a4, there: 0xffffa7, seen: 0xe0e0e0 };

  // Show current position and destinations
  function set_position(p) {
    PS.BeadColor(p % W, Math.floor(p / H), COLORS.here);
    PARAGRAPHS[p].slice(1).forEach(function (pp) {
      var pos = typeof pp === "number" ? pp : pp[1],
        x = (pos - 1) % W,
        y = Math.floor((pos - 1) / H),
        desc = typeof pp === "number" ? PARAGRAPHS[pp - 1][0] : pp[0];
      PS.BeadColor(x, y, COLORS.there);
      PS.BeadData(x, y, desc);
      PS.BeadFunction(x, y, function () {
        update_position(pos);
      });
    });
    PS.StatusText(PARAGRAPHS[p][0]);
    HINT = false;
  }

  function update_position(p) {
    var prev = POSITION - 1;
    POSITION = p;
    PS.BeadColor(prev % W, Math.floor(prev / H), COLORS.seen);
    PARAGRAPHS[prev].slice(1).forEach(function (pp) {
      var pos = typeof pp === "number" ? pp : pp[1],
        x = (pos - 1) % W,
        y = Math.floor((pos - 1) / H);
      PS.BeadColor(x, y, PS.DEFAULT);
      PS.BeadData(x, y, null);
      PS.BeadFunction(x, y, PS.DEFAULT);
    });
    set_position(POSITION - 1);
  }

  // Setup the grid and start from the initial position
  PS.Init = function () {
    PS.GridSize(W, H);
    PS.BeadBorderWidth(PS.ALL, PS.ALL, 0);
    set_position(POSITION - 1);
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
