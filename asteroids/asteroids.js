(function () {
  "use strict";

  // TODO
  // [x] layout/SVG resize (fix in Firefox)
  // [ ] plume for the ship
  // [x] debris for asteroids
  // [x] glowing effect
  // [ ] score
  // [ ] text as destructible graphics
  // [x] sound
  // [ ] better collisions
  // [ ] enemy ships
  // [ ] vortex
  // [ ] don't respawn inside an asteroid!
  // [ ] press fire to start/restart
  // [x] limit rate of fire
  // [ ] pause
  // [ ] toggle filters

  var SVG_NS = "http://www.w3.org/2000/svg";
  var XLINK_NS = "http://www.w3.org/1999/xlink";

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

  function collide_against(m, ms) {
    if (m.disabled) {
      return;
    }
    for (var i = 0, n = ms.length; i < n; ++i) {
      var dx = m.x - ms[i].x;
      var dy = m.y - ms[i].y;
      var d = m.r_collide + ms[i].r_collide;
      if ((dx * dx + dy * dy) < (d * d)) {
        return ms[i];
      }
    }
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

  function remove_life() {
    var lives = document.getElementById("lives");
    var n = lives.childNodes.length - 1;
    lives.childNodes[n].movable.explode();
    play_sound("explosion_ship_sound");
    return n;
  }

  function show_message(msg, sound) {
    document.getElementById("message").textContent = msg;
    if (msg) {
      play_sound(sound || "message_sound");
    }
  }

  // Prototype for moving objects
  var movable_prototype = {
    remove: function () {
      if (this.parent) {
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
      }
      this.elem.parentNode.removeChild(this.elem);
      this.cosmos.movables.splice(this.cosmos.movables.indexOf(this), 1);
    },
    position: function (x, y, a) {
      this.x = (x + this.cosmos.w) % this.cosmos.w;
      this.y = (y + this.cosmos.h) % this.cosmos.h;
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
      if (this.hasOwnProperty("velocity")) {
        this.velocity += this.accel;
      }
      this.position(this.x + this.vx * dt, this.y + this.vy * dt,
        this.a + this.va * dt);
      if (this.hasOwnProperty("ttl")) {
        this.ttl -= dt;
        if (this.ttl < 0) {
          this.remove();
        }
      }
    },
    fire: function () {
      if (this.disabled) {
        return;
      }
      var now = Date.now();
      if (now - this.last_shot < FIRE_RATE) {
        return;
      }
      this.last_shot = now;
      var bullet =
        this.cosmos.make_movable(document.createElementNS(SVG_NS, "use"));
      bullet.parent = this;
      this.children.push(bullet);
      bullet.elem.setAttributeNS(XLINK_NS, "href", "#bullet");
      bullet.r = 0;
      bullet.r_collide = 0;
      bullet.ttl = BULLET_RANGE / BULLET_V;
      var th = this.a / 180 * Math.PI;
      bullet.x = this.x + this.r * Math.cos(th);
      bullet.y = this.y + this.r * Math.sin(th);
      bullet.vx = BULLET_V * Math.cos(th);
      bullet.vy = BULLET_V * Math.sin(th);
      this.elem.parentNode.appendChild(bullet.elem);
      play_sound("laser_sound");
    }
  };

  function update_size() {
    var vb = document.querySelector("svg").viewBox.baseVal;
    // Add stars
    var stars = document.getElementById("stars");
    remove_children(stars);
    for (var i = 0, m = STAR_DENSITY * vb.width * vb.height; i < m; ++i) {
      stars.appendChild(make_star(vb.width, vb.height));
    }
    return vb;
  }

  function init_cosmos() {
    var vb = update_size(cosmos);
    var cosmos = {
      w: vb.width,
      h: vb.height,
      d: Math.min(vb.width, vb.height),
      n_asteroids: ASTEROIDS_MIN,
      level: 1,
      movables: [],
      make_movable: function (elem) {
        var m = Object.create(movable_prototype);
        m.cosmos = this;
        m.children = [];
        m.x = 0;
        m.y = 0;
        m.a = 0;
        m.vx = 0;
        m.vy = 0;
        m.va = 0;
        m.elem = elem;
        m.elem.setAttribute("filter", "url(#glow)");
        elem.movable = m;
        this.movables.push(m);
        return m;
      },
      make_ship: function (parent) {
        var m = this.make_movable(document.createElementNS(SVG_NS, "use"));
        m.elem.setAttributeNS(XLINK_NS, "href", "#ship");
        parent.appendChild(m.elem);
        m.r = SHIP_R;
        m.r_collide = SHIP_R_COLLIDE;
        m.accel = 0;
        m.last_shot = 0;
        var velocity = 0;
        Object.defineProperty(m, "velocity", { enumerable: true,
          get: function () {
            return velocity;
          }, set: function (v) {
            if (v < 0) {
              v = 0;
              this.accel = 0;
            } else if (v > SHIP_V_MAX) {
              v = SHIP_V_MAX;
            }
            velocity = v;
            var th = this.a / 180 * Math.PI;
            this.vx = v * Math.cos(th);
            this.vy = v * Math.sin(th);
          } });
        m.explode = function () {
          this.disabled = true;
          var parts = document.getElementById("ship-parts");
          [].forEach.call(parts.childNodes, function (p) {
            if (p.nodeType !== Node.ELEMENT_NODE) {
              return;
            }
            var part = this.cosmos.make_movable(document.createElementNS(SVG_NS,
                "use"));
            part.elem.setAttributeNS(XLINK_NS, "href", "#" + p.id);
            part.ttl = random_int(EXPLOSION_TTL - EXPLOSION_TTL_AMP,
              EXPLOSION_TTL + EXPLOSION_TTL_AMP);
            part.x = this.x;
            part.y = this.y;
            part.vx = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            part.vy = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            part.va = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX) /
              ASTEROID_VA_RATE;
            this.elem.parentNode.appendChild(part.elem);
          }, this);
          this.elem.parentNode.removeChild(this.elem);
        };
        return m;
      },
      // Make an asteroid of the given size (L, M, S)
      make_asteroid: function (size) {
        var asteroid =
          this.make_movable(document.createElementNS(SVG_NS, "path"));
        var r = window["ASTEROID_{0}_R".fmt(size)];
        var r_amp = window["ASTEROID_{0}_R_AMP".fmt(size)];
        var sectors = window["ASTEROID_{0}_SECTORS".fmt(size)];
        var points = [];
        asteroid.r = 0;
        asteroid.r_collide = r;
        for (var i = 0; i < sectors; ++i) {
          var th = i * (2 * Math.PI / sectors);
          var r = r + random_int(-r_amp, r_amp);
          if (r > asteroid.r) {
            asteroid.r = r;
          }
          points.push([r * Math.cos(th), r * Math.sin(th)]);
        }
        asteroid.elem.setAttribute("d", "M{0}Z".fmt(points.map(function (p) {
          return p.join(",");
        }).join("L")));
        asteroid.split = function () {
          for (var i = 0, n = window["ASTEROID_{0}_SECTORS".fmt(size)]; i < n;
              ++i) {
            var debris = asteroid.cosmos
              .make_movable(document.createElementNS(SVG_NS, "line"));
            debris.elem.setAttribute("x2", DEBRIS_LENGTH);
            var th = Math.random() * 2 * Math.PI;
            debris.x = asteroid.x + asteroid.r_collide * Math.cos(th);
            debris.y = asteroid.y + asteroid.r_collide * Math.sin(th);
            debris.a = random_int(0, 360);
            debris.vx = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            debris.vy = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            debris.va = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX) /
              ASTEROID_VA_RATE;
            debris.ttl = random_int(DEBRIS_TTL - DEBRIS_TTL_AMP,
                DEBRIS_TTL + DEBRIS_TTL_AMP);
            asteroid.elem.parentNode.parentNode.appendChild(debris.elem);
          }
          if (size === 1) {
            return [];
          }
          var sp = [this.cosmos.make_asteroid(size - 1),
              this.cosmos.make_asteroid(size - 1)];
          sp[0].x = this.x;
          sp[0].y = this.y;
          sp[0].vx = this.vx * SPEEDUP;
          sp[0].vy = -this.vy * SPEEDUP;
          sp[0].va = this.va * SPEEDUP;
          sp[1].x = this.x;
          sp[1].y = this.y;
          sp[1].vx = -this.vx * SPEEDUP;
          sp[1].vy = this.vy * SPEEDUP;
          sp[1].va = -this.va * SPEEDUP;
          return sp;
        };
        return asteroid;
      },
      add_lives: function(n, vb) {
        var lives = document.getElementById("lives");
        for (var i = 0; i < n; ++i) {
          var ship = this.make_ship(lives);
          ship.a = -90;
          ship.position(lives.childNodes.length * ship.r * 2, ship.r * 2);
        }
        return lives;
      },
      // Initialize the level with n asteroids
      init_level: function () {
        this.ship.position(this.w / 2, this.h / 2);
        show_message(LEVEL.fmt(this.level));
        setTimeout(function () {
          show_message("");
          var g = document.getElementById("asteroids");
          remove_children(g);
          var r = Math.floor(this.d / 4);
          for (var i = 0; i < cosmos.n_asteroids; ++i) {
            var asteroid = this.make_asteroid(3);
            var th = Math.random() * 2 * Math.PI;
            var rr = random_int(r, r * 2);
            asteroid.position(this.w / 2 + rr * Math.cos(th),
                this.h / 2 + rr * Math.sin(th));
            asteroid.vx = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            asteroid.vy = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX);
            asteroid.va = random_int_signed(ASTEROID_V_MIN, ASTEROID_V_MAX) /
              ASTEROID_VA_RATE;
            g.appendChild(asteroid.elem);
          }
          if (cosmos.n_asteroids < ASTEROIDS_MAX) {
            ++cosmos.level;
            ++cosmos.n_asteroids;
          }
        }.bind(this), LEVEL_DELAY * 1000);
      }
    };
    cosmos.ship = cosmos.make_ship(document.getElementById("level"));
    cosmos.add_lives(N_LIVES);

    document.addEventListener("keydown", function (e) {
      if (e.which === 32) {
        e.preventDefault();
        cosmos.ship.fire();
      } if (e.which === 37) {
        e.preventDefault();
        cosmos.ship.va = -SHIP_VA;
      } else if (e.which === 38) {
        e.preventDefault();
        cosmos.ship.accel = SHIP_ACCEL;
      } else if (e.which === 39) {
        e.preventDefault();
        cosmos.ship.va = SHIP_VA;
      } else if (e.which === 40) {
        e.preventDefault();
      }
    });

    document.addEventListener("keyup", function (e) {
      if (e.which === 32) {
        e.preventDefault();
      } else if (e.which === 37) {
        e.preventDefault();
        cosmos.ship.va = 0;
      } else if (e.which === 38) {
        e.preventDefault();
        cosmos.ship.accel = SHIP_DECEL;
      } else if (e.which === 39) {
        e.preventDefault();
        cosmos.ship.va = 0;
      } else if (e.which === 40) {
        e.preventDefault();
        play_sound("hyperspace_sound");
        cosmos.ship.position(random_int(0, cosmos.w), random_int(0, cosmos.h));
      }
    });

    var last_t = Date.now();
    var update = function (t) {
      var dt = (t - last_t) / 1000;
      cosmos.movables.forEach(function (m) {
        m.update(dt);
      });
      var asteroids = [].map.call(
        document.getElementById("asteroids").childNodes, function (elem) {
          return elem.movable;
        });
      cosmos.ship.children.forEach(function (bullet) {
        var a = collide_against(bullet, asteroids);
        if (a) {
          bullet.remove();
          var sp = a.split();
          sp.forEach(function (aa) {
            a.elem.parentNode.appendChild(aa.elem);
          });
          a.remove();
          play_sound("explosion_asteroid_sound");
          if (document.getElementById("asteroids").childNodes.length === 0) {
            cosmos.init_level();
          }
        }
      });
      var a = collide_against(cosmos.ship, asteroids);
      if (a) {
        var p = cosmos.ship.elem.parentNode;
        cosmos.ship.explode();
        var l = remove_life();
        if (l > 0) {
          setTimeout(function () {
            show_message(READY);
          }, (EXPLOSION_TTL - EXPLOSION_TTL_AMP) * 1000);
          setTimeout(function () {
            show_message("");
            cosmos.ship.position(cosmos.w / 2, cosmos.h / 2, 0);
            p.appendChild(cosmos.ship.elem);
            delete cosmos.ship.disabled;
          }, (EXPLOSION_TTL + EXPLOSION_TTL_AMP) * 1000);
        } else {
          show_message(GAME_OVER, "game_over_sound");
        }
      }
      last_t = t;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);

    return cosmos;
  }

  // Get params and init game
  [].forEach.call(document.querySelectorAll("[data-param]"), function (p) {
    if (p.dataset.hasOwnProperty("num")) {
      window[p.dataset.param] = parseFloat(p.dataset.num);
    } else {
      window[p.dataset.param] = p.textContent;
    }
  });

  // Init audio and bring the play_sound() function in the window namespace
  window.play_sound = (function () {
    var channels = [];
    for (var i = 0; i < AUDIO_CHANNELS; ++i) {
      channels[i] = new Audio();
      channels[i]._done = -1;
    }
    return function (id, volume) {
      var sound = document.getElementById(id);
      if (volume >= 0 && volume <= 1) {
        sound.volume = volume;
      }
      for (var i = 0; i < AUDIO_CHANNELS; ++i) {
        var t = Date.now();
        var channel = channels[i];
        if (channel._done < t) {
          channel._done = t + (sound.duration * 1000);
          channel.audio = sound;
          sound.load();
          sound.play();
          return;
        }
      }
    }
  }());

  var cosmos = init_cosmos();
  cosmos.init_level();

}());
