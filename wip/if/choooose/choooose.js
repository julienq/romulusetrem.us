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

  function sdbm(str) {
    var h, i, n;
    for (i = 0, n = str.length, h = 0; i < n; i += 1) {
      h = str.charCodeAt(i) + (h << 6) + (h << 16) - h;
    }
    return h >>> 0;
  }

  var dest = {}, label = {}, game = {};

  function new_dest(x) {
    var d = Object.create(dest);
    if (typeof x === "string") {
      d.label = x;
    } else if (x instanceof Array) {
      d.desc = x[0];
      d.label = x[1];
    }
    return d;
  }

  function new_label(key, desc) {
    var i, n, d, l = Object.create(label);
    l.dests = {};
    if (typeof desc === "string") {
      // Terminal label
      l.desc = desc;
    } else if (desc instanceof Array) {
      // List [description, dest, dest, ...]
      l.desc = desc[0];
      for (i = 1, n = desc.length; i < n; i += 1) {
        d = new_dest(desc[i]);
        l.dests[d.label] = d;
      }
    } else if (typeof desc === "object") {
      // Object
      // TODO
    }
    return l;
  }

  game.get_desc = function (dest) {
    return dest.desc || this.labels[dest.label].desc;
  }

  game.move_to = function (q) {
    // TODO @event
    var ul = document.querySelector("ul"),
      li = ul.appendChild($("li")), u;
    this.q = q;
    li.appendChild($("p", this.q.desc));
    if (Object.keys(this.q.dests).length > 0) {
      u = $("ul");
      li.appendChild(u);
      Object.keys(this.q.dests).forEach(function (k) {
        var li = u.appendChild($("li", this.get_desc(this.q.dests[k])));
        li.addEventListener("click", function (e) {
          e.preventDefault();
          this.move_to(this.labels[this.q.dests[k].label]);
        }.bind(this), false);
      }, this);
    }
  };

  ch.init_game = function (desc) {
    var g = Object.create(game);
    g.labels = {};
    Object.keys(desc).forEach(function (key) {
      g.labels[key] = new_label(key, desc[key]);
    });
    g.move_to(g.labels.$start);
  };

}(choooose = {}));
