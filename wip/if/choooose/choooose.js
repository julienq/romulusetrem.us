/*jslint browser: true, indent: 2 */

(function (ch) {
  //"use strict";

  // Simple format function for messages and templates. Use {0}, {1}...
  // as slots for parameters. Missing parameters are note replaced.
  String.prototype.fmt = function () {
    var args = [].slice.call(arguments);
    return this.replace(/\{(\d+)\}/g, function (s, p) {
      return args[p] === undefined ? s : args[p];
    });
  };

  // Localization
  ch.l = {};  // localized strings
  [].forEach.call(document.querySelectorAll("[data-l10n]"), function (li) {
    ch.l[li.dataset.l10n] = li.textContent;
  });

  // Return a random element from an array
  ch.random_element = function (a) {
    return a[ch.random_int(a.length - 1)];
  };

  // Return a random integer in the [min, max] range
  ch.random_int = function (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max + 1 - min));
  };

  // Remove an item from an array
  ch.remove_from_array = function (array, item) {
    if (array) {
      var index = array.indexOf(item);
      if (index >= 0) {
        return array.splice(index, 1)[0];
      }
    }
  };

  // Useful XML namespaces
  ch.SVG_NS = "http://www.w3.org/2000/svg";
  ch.XHTML_NS = "http://www.w3.org/1999/xhtml";
  ch.XLINK_NS = "http://www.w3.org/1999/xlink";
  ch.XML_NS = "http://www.w3.org/1999/xml";
  ch.XMLNS_NS = "http://www.w3.org/2000/xmlns/";
  ch.HTML_NS = ch.XHTML_NS;

  // Simple way to create elements, giving ns id and class directly within the
  // name of the element (e.g. svg:rect#background.test)
  function $(name, maybe_attrs) {
    var m, ns, nm, elem, split, classes, a, argc = 1, attrs = {};
    if (typeof maybe_attrs === "object" &&
        !(maybe_attrs instanceof window.Node)) {
      attrs = maybe_attrs;
      argc = 2;
    }
    classes = name.split(".");
    nm = classes.shift();
    if (classes.length > 0) {
      attrs["class"] =
        (attrs.hasOwnProperty("class") ? attrs["class"] + " " : "")
        + classes.join(" ");
    }
    m = nm.match(/^(?:(\w+):)?([\w.\-]+)(?:#([\w:.\-]+))?$/);
    if (m) {
      ns = (m[1] && ch["{0}_NS".fmt(m[1].toUpperCase())]) ||
          document.documentElement.namespaceURI;
      elem = ns ? document.createElementNS(ns, m[2]) :
          document.createElement(m[2]);
      if (m[3]) {
        attrs.id = m[3];
      }
      for (a in attrs) {
        if (attrs.hasOwnProperty(a) &&
            attrs[a] !== undefined && attrs[a] !== null) {
          split = a.split(":");
          ns = split[1] && ch["{0}_NS".fmt(split[0].toUpperCase())];
          if (ns) {
            elem.setAttributeNS(ns, split[1], attrs[a]);
          } else {
            elem.setAttribute(a, attrs[a]);
          }
        }
      }
      [].forEach.call(arguments, function (ch, i) {
        if (i >= argc) {
          if (typeof ch === "string") {
            elem.appendChild(document.createTextNode(ch));
          } else if (ch instanceof window.Node) {
            elem.appendChild(ch);
          }
        }
      });
      return elem;
    }
  }

  // Custom events

  // Listen to a custom event. Listener is a function or an object whose
  // "handleEvent" function will then be invoked.
  ch.listen = function (target, type, listener) {
    if (!(target.hasOwnProperty(type))) {
      target[type] = [];
    }
    target[type].push(listener);
  };

  // Listen to an event only once
  ch.listen_once = function (target, type, listener) {
    var h = function (e) {
      ch.unlisten(target, type, h);
      if (typeof listener.handleEvent === "function") {
        listener.handleEvent.call(listener, e);
      } else {
        listener(e);
      }
    };
    ch.listen(target, type, h);
  };

  // Can be called as notify(e), notify(source, type) or notify(source, type, e)
  ch.notify = function (source, type, e) {
    if (e) {
      e.source = source;
      e.type = type;
    } else if (type) {
      e = { source: source, type: type };
    } else {
      e = source;
    }
    if (e.source.hasOwnProperty(e.type)) {
      e.source[e.type].slice().forEach(function (listener) {
        if (typeof listener.handleEvent === "function") {
          listener.handleEvent.call(listener, e);
        } else {
          listener(e);
        }
      });
    }
  };

  // Stop listening
  ch.unlisten = function (target, type, listener) {
    ch.remove_from_array(target[type], listener);
  };

  var state = {}, game = {};

  state.clear_dests = function () {
    this.dests = {};
  };

  state.add_dest = function (x) {
    var d = {};
    if (typeof x === "string") {
      d.label = x;
    } else if (x instanceof Array) {
      d.desc = x[0];
      d.label = x[1];
    }
    this.dests[d.label] = d;
  };

  state.check_disabled = function () {
    if (this.__check) {
      return this.disabled;
    }
    this.__check = true;
    if (!this.disabled && this.dests) {
      this.disabled = Object.keys(this.dests).map(function (label) {
          return this.game.states[label].check_disabled();
        }, this).every(function (disabled) {
          return !!disabled;
        });
    }
    return this.disabled;
  };

  state.get_desc = function () {
    return this.enemy ? ch.l.encounter.fmt(this.enemy) : this.desc;
  };

  game.get_desc = function (dest) {
    return this.disabled ? undefined :
        dest.desc || this.states[dest.label].desc;
  };

  game.move_to = function (q) {
    var from, dests;
    if (this.q && this.q.post) {
      this.q.post.call(this.q, q);
    }
    from = this.q;
    this.q = q;
    if (this.q.pre) {
      this.q.pre.call(this.q, from);
    }
    var dests = this.q.enemy ? [] :
      Object.keys(this.q.dests).map(function (k) {
        return [this.get_desc(this.q.dests[k]), k];
      }, this).filter(function(d) {
        return !!d[0];
      });
    ch.notify(this, "@move", { dests: dests });
    if (this.q.enemy) {
      // TODO fight
      this.q.disabled = true;
      this.states.$start.check_disabled();
      this.move_to(this.states[this.q.win]);
    }
  };

  // Add a state to the game from the original description
  game.new_state = function (key, x) {
    var i, n, s = Object.create(state);
    s.label = key;
    s.dests = {};
    s.game = this;
    if (typeof x === "string") {
      // Terminal state, just a label
      s.desc = x;
    } else if (x instanceof Array) {
      // List [description, dest, dest, ...]
      s.desc = x[0];
      for (i = 1, n = x.length; i < n; i += 1) {
        s.add_dest(x[i]);
      }
    } else if (typeof x === "object") {
      // Object
      ["desc", "disabled", "enemy", "posts", "pre", "win"]
        .forEach(function (k) {
          if (x.hasOwnProperty(k)) {
            s[k] = x[k];
          }
        });
      if (x.dests) {
        x.dests.forEach(s.add_dest.bind(s));
      }
    }
    return s;
  };

  function moved(e) {
    var g = e.source,
      ul = document.querySelector("ul"),
      li = ul.appendChild($("li.ch-dest")),
      u;
    if (li.previousSibling) {
      li.previousSibling.classList.remove("ch-dest");
      li.previousSibling.classList.add("ch-past");
      [].forEach.call(li.previousSibling.querySelectorAll("li"), function (li) {
        if (li.hasOwnProperty("h")) {
          li.removeEventListener("click", li.h, false);
          delete li.h;
        }
      });
    }
    li.appendChild($("p.ch-desc", g.q.get_desc()));
    if (e.dests) {
      u = $("ul.ch-list");
      li.appendChild(u);
      e.dests.forEach(function (d) {
        var li = u.appendChild($("li", d[0]));
        li.h = function (e) {
          if (!e.hasOwnProperty("button") || e.button === 0) {
            e.preventDefault();
            g.move_to(g.states[d[1]]);
          }
        };
        li.addEventListener("click", li.h, false);
      });
    }
  }

  ch.init_game = function (desc) {
    var g = Object.create(game);
    g.states = {};
    Object.keys(desc).forEach(function (key) {
      g.states[key] = g.new_state(key, desc[key]);
    });
    ch.listen(g, "@move", moved);
    g.move_to(g.states.$start);
  };

}(window.choooose = {}));
