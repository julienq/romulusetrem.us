(function (ch) {
  "use strict";

  // Simple format function for messages and templates. Use {0}, {1}...
  // as slots for parameters. Missing parameters are note replaced.
  String.prototype.fmt = function () {
    var args = [].slice.call(arguments);
    return this.replace(/\{(\d+)\}/g, function (s, p) {
      return args[p] === undefined ? s : args[p];
    });
  };

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
    var m, ns, name_, elem, split, classes, a, argc = 1, attrs = {};
    if (typeof maybe_attrs === "object" && !(maybe_attrs instanceof Node)) {
      attrs = maybe_attrs;
      argc = 2;
    }
    classes = name.split(".");
    name_ = classes.shift();
    if (classes.length > 0) {
      attrs["class"] =
        (attrs.hasOwnProperty("class") ? attrs["class"] + " " : "")
        + classes.join(" ");
    }
    m = name_.match(/^(?:(\w+):)?([\w.\-]+)(?:#([\w:.\-]+))?$/);
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
          } else if (ch instanceof Node) {
            elem.appendChild(ch);
          }
        }
      });
      return elem;
    }
  };

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

  function sdbm(str) {
    var h, i, n;
    for (i = 0, n = str.length, h = 0; i < n; i += 1) {
      h = str.charCodeAt(i) + (h << 6) + (h << 16) - h;
    }
    return h >>> 0;
  }

  var dest = {}, label = {}, game = {};

  label.clear_dests = function () {
    this.dests = {};
  };

  label.add_dest = function (x) {
    var d = Object.create(dest);
    if (typeof x === "string") {
      d.label = x;
    } else if (x instanceof Array) {
      d.desc = x[0];
      d.label = x[1];
    }
    this.dests[d.label] = d;
  }

  game.get_desc = function (dest) {
    return dest.desc || this.labels[dest.label].desc;
  }

  game.move_to = function (q) {
    if (this.q && this.q.post) {
      this.q.post.call(this.q, q);
    }
    var from = this.q;
    this.q = q;
    if (this.q.pre) {
      this.q.pre.call(this.q, from);
    }
    ch.notify(this, "@move");
  };

  game.new_label = function (key, x) {
    var i, n, d, l = Object.create(label);
    l.label = key;
    l.dests = {};
    l.game = this;
    if (typeof x === "string") {
      // Terminal label
      l.desc = x;
    } else if (x instanceof Array) {
      // List [description, dest, dest, ...]
      l.desc = x[0];
      for (i = 1, n = x.length; i < n; i += 1) {
        l.add_dest(x[i]);
      }
    } else if (typeof x === "object") {
      // Object
      l.desc = x.desc;
      if (x.dests) {
        x.dests.forEach(l.add_dest.bind(l));
      }
      l.pre = x.pre;
      l.post = x.post;
    }
    return l;
  };

  function moved(e) {
    var g = e.source,
      ul = document.querySelector("ul"),
      li = ul.appendChild($("li.ch-dest")), u;
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
    li.appendChild($("p.ch-desc", g.q.desc));
    if (Object.keys(g.q.dests).length > 0) {
      u = $("ul.ch-list");
      li.appendChild(u);
      Object.keys(g.q.dests).forEach(function (k) {
        var li = u.appendChild($("li", g.get_desc(g.q.dests[k])));
        li.h = function (e) {
          if (e.hasOwnProperty("button") && e.button !== 0) {
            return;
          }
          e.preventDefault();
          g.move_to(g.labels[g.q.dests[k].label]);
        };
        li.addEventListener("click", li.h, false);
      });
    }
  }

  ch.init_game = function (desc) {
    var g = Object.create(game);
    g.labels = {};
    Object.keys(desc).forEach(function (key) {
      g.labels[key] = g.new_label(key, desc[key]);
    });
    ch.listen(g, "@move", moved);
    g.move_to(g.labels.$start);
  };

}(choooose = {}));
