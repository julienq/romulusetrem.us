// Make the lines pattern for the background
var lines = document.querySelector("pattern g");
for (var i = 2; i < 100; i += 2) {
  lines.appendChild(flexo.svg("line", { y1: i, x2: i }));
  lines.appendChild(flexo.svg("line",
    { x1: i, y1: 100, x2: 100, y2: i }));
}
lines.appendChild(flexo.svg("line", { y1: 100, x2: 100 }));

function make_poly(id, sides, phase)
{
  var poly = flexo.svg_polygon(sides, 30, phase || Math.PI / 2);
  poly.setAttribute("transform", "translate(50, 50)");
  document.getElementById(id).appendChild(poly);
}

var svg = document.querySelector("svg");

function resize()
{
  svg.setAttribute("width", window.innerWidth);
  svg.setAttribute("height", window.innerHeight - svg.offsetTop - 4 -
      document.querySelector("footer").offsetHeight);
}

window.onresize = resize;
resize();

memory =
{
  COLORS: [
    "#1693a5",  // Dutch teal
    "#fbb829",  // Heart of gold
    "#7faf1b",  // Elle était belle
    "#ff0066",  // Hot pink
    "#47092e",  // Nothing Man
    "#aaa"      // gray
  ],

  SHAPES: ["donut", "square", "triangle", "hexagon", "star", "cross"],

  letter_tile: function(l, color, x, y)
  {
    return this.make_tile(flexo.ez_elem("svg:text", { x: 50, y: 75, fill: color,
        "text-anchor": "middle", "font-size": "64", "font-weight": "bold" }, l),
      x, y);
  },

  make_game: function(players)
  {
    var game = Object.create({
      reveal: function(tile)
      {
        if (this.timeout) return;
        tile.revealed = true;
        if (this.revealed) {
          ++this.moves;
          if (memory.match_tiles(tile, this.revealed)) {
            this.timeout = setTimeout((function() {
                flexo.safe_remove(tile);
                flexo.safe_remove(this.revealed);
                ++this.scores[this.player];
                delete this.timeout;
                delete this.revealed;
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
              }).bind(this), 250);
          } else {
            this.timeout = setTimeout((function() {
                tile.revealed = false;
                this.revealed.revealed = false;
                this.player = (this.player + 1) % this.scores.length;
                alert("No match! Player {0}'s turn now.".fmt(this.player + 1));
                delete this.timeout;
                delete this.revealed;
                memory.update_player(this);
              }).bind(this), 250);
          }
        } else {
          this.revealed = tile;
        }
      }
    });
    game.scores = flexo.range(flexo.clamp(players, 1, 4) - 1)
      .map(function() { return 0; });
    game.player = 0;
    return game;
  },

  make_shapes: function()
  {
    make_poly("triangle", 3);
    make_poly("square", 4, Math.PI / 4);
    make_poly("hexagon", 6);
    var star = flexo.svg_star(5, 30, 12, Math.PI / 2);
    star.setAttribute("transform", "translate(50, 50)");
    document.getElementById("star").appendChild(star);
    this.TILES = [];
    this.SHAPES.forEach(function(shape) {
        [].push.apply(this.TILES,
          this.COLORS.map(function(color) { return [shape, color]; }));
      }, this);
    this.match_tiles = function(t, u)
    {
      return t.__shape === u.__shape && t.__color === u.__color;
    }
  },

  make_tile: function(face, x, y)
  {
    var back = flexo.ez_elem("svg:use", { "xlink:href": "#back" });
    var front = flexo.ez_elem("svg:use", { "xlink:href": "#front" });
    var mask = flexo.ez_elem("svg:use", { "xlink:href": "#mask" });
    var g = flexo.ez_elem("svg:g", front, face, mask, back);
    this.set_position(g, x, y);
    back.addEventListener("click", function() { flexo.notify(g, "@reveal"); },
      false);
    var hide = function() { flexo.notify(g, "@hide"); };
    mask.addEventListener("click", hide, false);
    var revealed;
    flexo.getter_setter(g, "revealed", function() { return revealed },
        function(p) { back.style.display = p ? "none" : ""; });
    g.revealed = false;
    return g;
  },

  set_position: function(g, x, y)
  {
    var x_ = x * 100 + flexo.random_number(-2, 2);
    var y_ = y * 100 + flexo.random_number(-2, 2);
    var a = flexo.random_number(-2, 2);
    g.setAttribute("transform", "translate({0}, {1}) rotate({2}, 50, 50)"
      .fmt(x_, y_, a));
    return g;
  },

  add_tile: function(g, x, y, n)
  {
    var tile = this.make_tile(flexo.ez_elem("svg:use",
      { "xlink:href": "#" + this.game.tiles[n][0],
        fill: this.game.tiles[n][1] }), x, y);
    tile.__shape = this.game.tiles[n][0];
    tile.__color = this.game.tiles[n][1];
    g.appendChild(tile);
    flexo.listen(tile, "@reveal",
        (function() { this.game.reveal(tile); }).bind(this));
  },

  setup_tiles: function(g, w, h)
  {
    var tiles_ = flexo.shuffle(this.TILES).slice(0, w * h / 2);
    [].push.apply(tiles_, tiles_);
    this.game.tiles = flexo.shuffle(tiles_);
    for (var x = 0; x < args.w; ++x) {
      for (var y = 0; y < args.h; ++y) this.add_tile(g, x, y, x * h + y);
    }
  },

  update_player: function(game)
  {
    var li = document.querySelectorAll("li")[game.player];
    var li_ = document.querySelector(".player");
    if (li_) flexo.remove_class(li_, "player");
    flexo.add_class(li, "player");
  },

  update_scores: function(game)
  {
    var span = document.querySelectorAll("span.score")[game.player];
    span.textContent = game.scores[game.player];
  },

};
