(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  window.requestAnimationFrame = window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame;

  // Simple format function for messages and templates. Use {0}, {1}...
  // as slots for parameters. Missing parameters are note replaced.
  String.prototype.fmt = function () {
    var args = [].slice.call(arguments);
    return this.replace(/\{(\d+)\}/g, function (s, p) {
      return args[p] === undefined ? s : args[p];
    });
  };

  // Another format function for messages and templates; this time, the only
  // argument is an object and string parameters are keys.
  String.prototype.format = function (args) {
    return this.replace(/\{([^}]*)\}/g, function (s, p) {
      return args.hasOwnProperty(p) ? args[p] : s;
    });
  };

  // Generate a random integer in the [min, max] range
  function random_int(min, max) {
    return min + Math.floor(Math.random() * (max + 1 - min));
  }

  // Generate a random integer in the [-max, -min] U [min, max] range
  function random_int_signed(min, max) {
    return random_int(min, max) * (Math.random() < 0.5 ? -1 : 1);
  }

  // Remove all children of an element
  function remove_children(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  };

  // Prototype for moving objects
  var movable_prototype = {
    position: function (x, y, a) {
      this.x = (x + this.vb.width) % this.vb.width;
      this.y = (y + this.vb.height) % this.vb.height;
      if (typeof a === "number") {
        this.angle(a);
      } else {
        this.elem.setAttribute("transform", "translate({x}, {y}) rotate({a})"
          .format(this));
      }
    },
    angle: function (a) {
      this.a = (a + 360) % 360;
      this.elem.setAttribute("transform", "translate({x}, {y}) rotate({a})"
        .format(this));
    },
    update: function (dt) {
      this.position(this.x + this.vx * dt, this.y + this.vy * dt,
        this.a + this.va * dt);
    },
  };

  function make_movable(elem, vb) {
    var m = Object.create(movable_prototype);
    m.x = 0;
    m.y = 0;
    m.a = 0;
    m.vx = 0;
    m.vy = 0;
    m.va = 0;
    m.elem = elem;
    m.vb = vb;
    return m;
  }


  // Initialize the player ship object from an SVG element
  function init_ship(ship, vb) {
    return make_movable(ship, vb);
  }

  // Make a circle to represent a star in the background
  function make_star(w, h) {
    var star = document.createElementNS(SVG_NS, "circle");
    star.setAttribute("r", Math.random() * STAR_RADIUS);
    star.setAttribute("cx", Math.floor(Math.random() * w));
    star.setAttribute("cy", Math.floor(Math.random() * h));
    star.setAttribute("fill-opacity", Math.random());
    return star;
  }

  function init_size(svg) {
    var vb = svg.viewBox.baseVal;
    var bg = document.getElementById("bg");
    bg.setAttribute("width", vb.width);
    bg.setAttribute("height", vb.height);
    // Add stars
    var stars = document.getElementById("stars");
    remove_children(stars);
    for (var i = 0, m = STAR_DENSITY * vb.width * vb.height; i < m; ++i) {
      stars.appendChild(make_star(vb.width, vb.height));
    }
    return vb;
  }

  // Make an asteroid of the given size (L, M, S)
  function make_asteroid(size, vb) {
    var asteroid = make_movable(document.createElementNS(SVG_NS, "path"), vb);
    var r = window["ASTEROID_{0}_R".fmt(size)];
    var r_amp = window["ASTEROID_{0}_R_AMP".fmt(size)];
    var sectors = window["ASTEROID_{0}_SECTORS".fmt(size)];
    var points = [];
    for (var i = 0; i < sectors; ++i) {
      var th = i * (2 * Math.PI / sectors);
      var r = r + random_int(-r_amp, r_amp);
      points.push([r * Math.cos(th), r * Math.sin(th)]);
    }
    asteroid.elem.setAttribute("d", "M{0}Z".fmt(points.map(function (p) {
      return p.join(",");
    }).join("L")));
    return asteroid;
  }

  // Initialize the world for a new level with n asteroids
  function init_level(ship, n) {
    var w = Math.floor(ship.vb.width / 2);
    var h = Math.floor(ship.vb.height / 2);
    ship.position(w, h);
    // Add asteroids
    var asteroids = [];
    var g = document.getElementById("asteroids");
    remove_children(g);
    var r = Math.floor(Math.min(w, h) / 2);
    for (var i = 0; i < n; ++i) {
      var asteroid = make_asteroid("L", vb);
      var th = Math.random() * 2 * Math.PI;
      var rr = random_int(r, r * 2);
      asteroid.position(w + rr * Math.cos(th), h + rr * Math.sin(th));
      asteroid.vx = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
      asteroid.vy = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
      asteroid.va = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX) /
        ASTEROID_VA_RATE;
      asteroids.push(asteroid);
      g.appendChild(asteroid.elem);
    }

    var last_t = Date.now();
    var update = function (t) {
      var dt = (t - last_t) / 1000;
      ship.update(dt);
      asteroids.forEach(function (a) {
        a.update(dt);
      });
      last_t = t;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Get params and init game
  [].forEach.call(document.querySelectorAll("[data-param]"), function (p) {
    if (p.dataset.type === "int") {
      window[p.dataset.param] = parseInt(p.textContent, 10);
    } else if (p.dataset.type === "float") {
      window[p.dataset.param] = parseFloat(p.textContent);
    } else {
      window[p.dataset.param] = p.textContent;
    }
  });
  var vb = init_size(document.querySelector("svg"));
  var ship = init_ship(document.getElementById("ship"), vb);
  init_level(ship, N_ASTEROIDS);

}());
