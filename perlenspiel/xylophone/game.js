// A toy sequencer playing xylophone notes
// Created: Mar 12, 2012
// Modified: Apr 19, 2012 (clean up for JSLint; comments)
// This code is copyright © 2012 romulusetrem.us and is distributed under the
// same terms as Perlenspiel itself, see http://perlenspiel.org/ and
// http://romulusetrem.us/perlenspiel/ for more info.

// These are for JSLint. There should be no warning using these options:
/*global PS */
/*jslint maxerr: 50, indent: 2 */

(function () {
  "use strict";

  var
    // A C-major scale (TODO more scales)
    // 1 row in the grid is one pitch
    NOTES = ["d7", "c7", "b6", "f6", "e6", "d6", "c6", "b5", "a5", "g5", "f5",
      "e5", "d5", "c5", "b4", "a4"],

    COLORS = [PS.COLOR_BLACK, PS.COLOR_GRAY_LIGHT, PS.COLOR_GRAY,
      PS.COLOR_GRAY_DARK, PS.COLOR_RED, PS.COLOR_ORANGE, PS.COLOR_YELLOW,
      PS.COLOR_GREEN, PS.COLOR_BLUE, PS.COLOR_INDIGO, PS.COLOR_VIOLET,
      PS.COLOR_CYAN, PS.COLOR_MAGENTA],

    BPM = 104,  // tempo
    STEP = 0;   // current step (1 column of the grid is one quarter beat)

  // Update the clock and show the current bpm setting
  function update_clock() {
    PS.Clock(1500 / BPM);
    PS.StatusText("Xylophone ▸ " + BPM + " bpm");
  }

  // Step by the given increment (+1 or -1) and play the notes at that step
  // TODO fix negative value
  function step(incr) {
    var w = NOTES.length, y;
    PS.BeadBorderAlpha([STEP + w - incr] % w, PS.ALL, 100);
    if (incr < 0) {
      STEP = (STEP + w + incr) % w;
    }
    PS.BeadBorderAlpha(STEP, PS.ALL, 50);
    for (y = 0; y < w; y += 1) {
      if (PS.BeadData(STEP, y)) {
        PS.AudioPlay("xylo_" + NOTES[y]);
      }
    }
    if (incr > 0) {
      STEP = (STEP + 1) % w;
    }
  }

  // PS.Init ()
  // Initializes the game
  // This function normally includes a call to PS.GridSize (x, y)
  // where x and y are the desired dimensions of the grid

  // Initialize the grid and load the notes
  PS.Init = function () {
    PS.GridSize(NOTES.length, NOTES.length);
    NOTES.forEach(function (note) { PS.AudioLoad("xylo_" + note); });
    update_clock();
  };

  // PS.Click (x, y, data)
  // This function is called whenever a bead is clicked
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  // Set or unset the clicked cell, choosing a random color when set
  PS.Click = function (x, y, data) {
    PS.BeadData(x, y, !data);
    PS.BeadColor(x, y,
        data ? PS.DEFAULT : COLORS[PS.Random(COLORS.length) - 1]);
  };

  // PS.KeyDown (key, shift, ctrl)
  // This function is called whenever a key on the keyboard is pressed
  // It doesn't have to do anything
  // key = the ASCII code of the pressed key, or one of the following constants:
  // Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
  // Function keys = PS.F1 through PS.F1
  // shift = true if shift key is held down, false otherwise
  // ctrl = true if control key is held down, false otherwise

  // Use the up and down arrow to change the tempo, and right and left to step
  // manually back and forth
  PS.KeyDown = function (key) {
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

  // PS.Tick ()
  // This function is called on every clock tick
  // if a timer has been activated with a call to PS.Timer()
  // It doesn't have to do anything

  // Step forward on every clock tick
  PS.Tick = function () {
    step(1);
  };


  // These are not used but need to be defined

  // PS.Release (x, y, data)
  // This function is called whenever a mouse button is released over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Release = function () {};

  // PS.Enter (x, y, button, data)
  // This function is called whenever the mouse moves over a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

  PS.Enter = function () {};

  // PS.Leave (x, y, data)
  // This function is called whenever the mouse moves away from a bead
  // It doesn't have to do anything
  // x = the x-position of the bead on the grid
  // y = the y-position of the bead on the grid
  // data = the data value associated with this bead, 0 if none has been set

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
