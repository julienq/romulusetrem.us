"use strict";

(function (memory) {

  // Make the lines pattern for the background
  var lines = document.querySelector("pattern g");
  for (var i = 4; i < 100; i += 4) {
    lines.appendChild(flexo.$line({ y1: i, x2: i }));
    lines.appendChild(flexo.$line({ x1: i, y1: 100, x2: 100, y2: i }));
  }
  lines.appendChild(flexo.$line({ y1: 100, x2: 100 }));

  memory.colors = [
    "#1693a5",  // Dutch teal
    "#fbb829",  // Heart of gold
    "#7faf1b",  // Elle était belle
    "#ff0066",  // Hot pink
    "#47092e",  // Nothing Man
    "#aaa"      // gray
  ];

  memory.shapes = ["donut", "square", "triangle", "hexagon", "star", "cross"];

  // Make a tile with a letter instead of a shape
  memory.letter_tile = function (l, color, x, y) {
    return this.make_tile(flexo.$text({ x: 50, y: 75, fill: color,
      "text-anchor": "middle", "font-size": "64", "font-weight": "bold" }, l),
    x, y);
  };

  memory.make_poly = function (id, sides, phase) {
    var poly = flexo.svg_polygon(sides, 30, phase || Math.PI / 2);
    poly.setAttribute("transform", "translate(50, 50)");
    document.getElementById(id).appendChild(poly);
  }

  var game = {};

  game.reveal = function (tile) {
    if (this.timeout) {
      this.timeout_handler();
      return;
    }
    tile.revealed = true;
    if (this.revealed) {
      ++this.moves;
      if (memory.match_tiles(tile, this.revealed)) {
        this.timeout_handler = function () {
          flexo.safe_remove(tile);
          flexo.safe_remove(this.revealed);
          ++this.scores[this.player];
          this.clear_timeout();
          memory.update_scores(this);
          if (g.childNodes.length === 0) {
            var max_score = -1;
            var winners = [];
            this.scores.forEach(function(score, i) {
              if (score > max_score) {
                winners = [i + 1];
                max_score = score;
              } else if (score === max_score) {
                winners.push(i + 1);
              }
            });
            var msg = winners.length === 1 ?
              "Congratulation player {0}, you win!".fmt(winners[0]) :
              "It's a tie between players {0}."
                .fmt(winners.join(", ").replace(/,([^,]+)$/, " and$1"));
            if (confirm(msg + " Play again?")) {
              window.location.reload();
            } else {
              window.location = "index.html";
            }
          }
        };
      } else {
        this.timeout_handler = function () {
          tile.revealed = false;
          this.revealed.revealed = false;
          this.player = (this.player + 1) % this.scores.length;
          //alert("No match! Player {0}'s turn now.".fmt(this.player + 1));
          this.clear_timeout();
          memory.update_player(this);
        };
      }
      this.timeout = setTimeout(this.timeout_handler.bind(this), 3000);
    } else {
      this.revealed = tile;
    }
  };

  game.clear_timeout = function () {
    delete this.timeout;
    delete this.timeout_handler;
    delete this.revealed;
  };

  memory.make_game = function(players) {
    var game_ = Object.create(game);
    game_.scores = [];
    for (var i = 0, n = flexo.clamp(players, 1, 4); i < n; ++i) {
      game_.scores.push(0);
    }
    game_.player = 0;
    return game_;
  };

  memory.make_shapes = function () {
    memory.make_poly("triangle", 3);
    memory.make_poly("square", 4, Math.PI / 4);
    memory.make_poly("hexagon", 6);
    var star = flexo.svg_star(5, 30, 12, Math.PI / 2);
    star.setAttribute("transform", "translate(50, 50)");
    document.getElementById("star").appendChild(star);
    this.tiles = [];
    this.shapes.forEach(function (shape) {
      [].push.apply(this.tiles,
        this.colors.map(function(color) { return [shape, color]; }));
    }, this);
    this.match_tiles = function (t, u) {
      return t.__shape === u.__shape && t.__color === u.__color;
    };
  };

  memory.make_tile_one_sided = function (face, x, y) {
    var front = flexo.$use({ "xlink:href": "#front" });
    var mask = flexo.$use({ "xlink:href": "#mask" });
    var g = flexo.$g(front, face, mask);
    memory.set_position(g, x, y);
    var click = function (e) {
      flexo.notify(g, "@click");
    };
    mask.addEventListener("click", click, false);
    mask.addEventListener("touchend", click, false);
    return g;
  };

  memory.make_tile = function (face, x, y) {
    var back = flexo.$use({ "xlink:href": "#back" });
    var front = flexo.$use({ "xlink:href": "#front" });
    var mask = flexo.$use({ "xlink:href": "#mask" });
    var g = flexo.$g(front, face, mask, back);
    this.set_position(g, x, y);
    back.addEventListener("click", function () {
      flexo.notify(g, "@reveal");
    }, false);
    back.addEventListener("touchend", function () {
      flexo.notify(g, "@reveal");
    }, false);
    var hide = function () {
      flexo.notify(g, "@hide");
    };
    mask.addEventListener("click", hide, false);
    mask.addEventListener("touchend", hide, false);
    var revealed;
    Object.defineProperty(g, "revealed", { enumerable: true,
      get: function () { return revealed; },
      set: function (p) {
        back.style.display = p ? "none" : "";
      }
    });
    g.revealed = false;
    return g;
  };

  memory.set_position = function (g, x, y) {
    var x_ = x * 100 + flexo.random_int(-2, 2);
    var y_ = y * 100 + flexo.random_int(-2, 2);
    var a = flexo.random_int(-2, 2);
    g.setAttribute("transform", "translate({0}, {1}) rotate({2}, 50, 50)"
      .fmt(x_, y_, a));
    return g;
  };

  memory.add_tile = function (g, x, y, n) {
    var tile = this.make_tile(flexo.$use({
      "xlink:href": "#" + this.game.tiles[n][0], fill: this.game.tiles[n][1]
    }), x, y);
    tile.__shape = this.game.tiles[n][0];
    tile.__color = this.game.tiles[n][1];
    g.appendChild(tile);
    flexo.listen(tile, "@reveal", (function () {
      this.game.reveal(tile);
    }).bind(this));
  };

  memory.setup_tiles = function (g, w, h) {
    var tiles_ = flexo.shuffle_array(this.tiles).slice(0, w * h / 2);
    Array.prototype.push.apply(tiles_, tiles_);
    this.game.tiles = flexo.shuffle_array(tiles_);
    for (var x = 0; x < args.w; ++x) {
      for (var y = 0; y < args.h; ++y) this.add_tile(g, x, y, x * h + y);
    }
  };

  memory.update_player = function(game) {
    var li = document.querySelectorAll("li")[game.player];
    var li_ = document.querySelector(".player");
    if (li_) {
      li_.classList.remove("player");
    }
    li.classList.add("player");
  };

  memory.update_scores = function(game) {
    var span = document.querySelectorAll("span.score")[game.player];
    span.textContent = game.scores[game.player];
  };

}(window.memory = {}));
