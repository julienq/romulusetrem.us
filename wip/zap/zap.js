// Zap is a simple library for building games using SVG.
// This is a work in progress so the API is subject to change at any time.

(function(zap)
{
  // A Zap application may have a title. This title then gets rendered in the
  // title bar, and any h1.zap element in the host document.
  var title;
  flexo.getter_setter(zap, "title", function() { return title; },
    function(t) {
      title = t;
      document.title = title;
      var h1 = document.querySelector("h1.zap");
      if (h1) h1.textContent = title;
    });

  // The frame in which the application is rendered
  // Height and width are required; id and parent are optional.
  zap.frame = function(width, height, id, parent)
  {
    if (typeof id !== "string") {
      parent = id;
      id = undefined;
    }
    if (!parent) {
      parent = document.getElementById("zap") ||
        document.querySelector("div") || document.body;
    }

    var frame = flexo.create_object({
        add_scene: function(scene)
        {
          this.scenes.push(scene);
          this.element.appendChild(scene.element);
          scene.frame = this;
          scene.begin();
        },
      });

    if (width === undefined) {
      width = 320;
      height = 240;
    } else if (height === undefined) {
      height = width;
    }

    var svg = flexo.svg("svg", { "class": "zap-frame", id: id });
    flexo.getter_setter(frame, "element", function() { return svg; });
    var vb = function() {
      svg.setAttribute("viewBox", "0 0 {0} {1}".fmt(width, height));
    };
    flexo.getter_setter(frame, "width", function() { return width; }, vb);
    flexo.getter_setter(frame, "height", function() { return height; }, vb);
    vb();

    var mouse_x = 0;
    var mouse_y = 0;
    document.addEventListener("mousemove", function(e) {
        var p = flexo.event_svg_point(e, svg);
        mouse_x = p.x;
        mouse_y = p.y;
      }, false);
    flexo.getter_setter(frame, "mouse_x", function() { return mouse_x; });
    flexo.getter_setter(frame, "mouse_y", function() { return mouse_y; });

    var button = false;
    var repeat = 150;
    var last_check;
    svg.addEventListener("mousedown", function(e) {
        e.preventDefault();
        if (e.button === 0) {
          button = true;
          last_check = repeat;
        }
      }, false);
    document.addEventListener("mouseup", function(e) {
        e.preventDefault();
        if (e.button === 0) button = false;
      }, false);
    flexo.getter_setter(frame, "button", function() {
        if (button) {
          if (typeof last_check === "boolean") {
            var b = last_check;
            last_check = true;
            return b === repeat;
          } else if (t - last_check >= repeat) {
            last_check = t;
            return true;
          }
        }
        return false;
      });
    flexo.getter_setter(frame, "button_repeat", function() { return repeat; },
        function(r) { repeat = r; });

    // Set tabindex on parent div and watch keyboard events on that div
    if (parent.tabIndex < 0) parent.tabIndex = 0;
    var keys = {};
    parent.addEventListener("keydown", function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        if (e.keyCode === 13) {
          keys.enter = true;
        } else if (e.keyCode === 32) {
          keys.space = true;
        } else if (e.keyCode === 37) {
          keys.left = true;
        } else if (e.keyCode === 38) {
          keys.up = true;
        } else if (e.keyCode === 39) {
          keys.right = true;
        } else if (e.keyCode === 40) {
          keys.down = true;
        }
      }, false);
    parent.addEventListener("keyup", function(e) {
        e.preventDefault();
        if (e.keyCode === 13) {
          keys.enter = true;
        } else if (e.keyCode === 32) {
          keys.space = false;
        } if (e.keyCode === 37) {
          keys.left = false;
        } else if (e.keyCode === 38) {
          keys.up = false;
        } else if (e.keyCode === 39) {
          keys.right = false;
        } else if (e.keyCode === 40) {
          keys.down = false;
        }
      }, false);
    flexo.getter_setter(frame, "keys", function() { return keys; });

    flexo.getter_setter(frame, "cursor",
        function() {
          return window.getComputedStyle(svg).getPropertyValue("cursor");
        },
        function(cursor) {
          svg.style.cursor = cursor;
        });


    var scale;
    flexo.getter_setter(frame, "scale", function() { return scale; },
        function(s) {
          scale = s;
          svg.setAttribute("transform", "scale({0})".fmt(scale));
          parent.style.width = "{0}px".fmt(width * scale);
          parent.style.height = "{0}px".fmt(height * scale);
        });
    frame.scale = 1;

    var scenes = [];
    flexo.getter_setter(frame, "scenes", function() { return scenes; });

    parent.appendChild(svg);
    parent.focus();

    var t0 = Date.now;
    var t;
    flexo.getter_setter(frame, "t0", function() { return t0; });
    var tick = function(t_) {
      t = t_;
      scenes.forEach(function(scene) { if (scene.running) scene.tick(t); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return frame;
  };

  zap.scene = function(id)
  {
    var scene = flexo.create_object({
      // Add an entity to the scene
      add: function(entity)
      {
        entity.scene = this;
        this.element.appendChild(entity.element);
        if (entity.element.id) this["$" + entity.element.id] = entity;
        if (entity.kind) {
          if (!this.kinds[entity.kind]) this.kinds[entity.kind] = [];
          this.kinds[entity.kind].push(entity);
        }
      },

      collide: function(entity, others)
      {
        return others.some(function(other) { return entity.collide(other); });
      },

      // Stubs
      begin: function() {},
      tick: function(t) {},
    });
    var svg = flexo.svg("g", { id: id });
    flexo.getter_setter(scene, "element", function() { return svg; });
    var kinds = {};
    flexo.getter_setter(scene, "kinds", function() { return kinds; });
    scene.running = true;
    return scene;
  };

  zap.entity = function(elem)
  {
    var entity = flexo.create_object({
        // on, once

        // Define the rectangle hitbox for entities (can be bbox or custom) to
        // test for collisions against other entities
        collide: function(other)
        {
          var ra = this.hitbox;
          var ax = ra.x + this.x;
          var ay = ra.y + this.y;
          var rb = other.hitbox;
          var bx = rb.x + other.x;
          var by = rb.y + other.y;
          return ((ax + ra.width) >= bx) && (ax <= (bx + rb.width)) &&
            ((ay + ra.height) >= by) && (ay <= (by + rb.height));
        }
      });
    return entity;
  }

  // TODO rename this SVG entity
  zap.svg = function(name, properties)
  {
    var entity = zap.entity();
    var svg = flexo.svg(name, properties);
    flexo.getter_setter(entity, "element", function() { return svg; });
    if (name === "circle") {
      get_set_float_trait(entity, "cx");
      get_set_float_trait(entity, "cy");
    } else if (name === "line") {
      get_set_float_trait(entity, "x1");
      get_set_float_trait(entity, "y1");
      get_set_float_trait(entity, "x2");
      get_set_float_trait(entity, "y2");
    } else {
      get_set_float_trait(entity, "x");
      get_set_float_trait(entity, "y");
    }
    get_set_float_trait(entity, "width");
    get_set_float_trait(entity, "height");
    get_set_trait(entity, "fill", "#000");
    return entity;
  };

  zap.image = function(src, properties)
  {
    var entity = zap.svg("image", properties);
    entity.element.setAttributeNS(flexo.XLINK_NS, "href", src);
    var img = new Image();
    img.src = src;
    img.onload = function()
    {
      if (!properties || !properties.hasOwnProperty("width")) {
        entity.element.setAttribute("width", img.width);
      }
      if (!properties || !properties.hasOwnProperty("height")) {
        entity.element.setAttribute("height", img.height);
      }
      flexo.notify(entity, "#load");
    }
    return entity;
  };


  // Utility functions

  function get_set_trait(obj, trait, default_)
  {
    flexo.getter_setter(obj, trait,
        function() { return flexo.get_trait(obj.element, trait, default_); },
        function(t) { obj.element.setAttribute(trait, t); });
  }

  function get_set_float_trait(obj, trait, default_)
  {
    flexo.getter_setter(obj, trait,
        function() { return flexo.get_float_trait(obj.element, trait,
          default_); },
        function(t) { obj.element.setAttribute(trait, t); });
  }

})(this.zap = {});
