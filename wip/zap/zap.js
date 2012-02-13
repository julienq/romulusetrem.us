(function(zap)
{
  zap.frame = function(width, height, id)
  {
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
      });
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
      });
    document.addEventListener("mouseup", function(e) {
        e.preventDefault();
        if (e.button === 0) button = false;

      });
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

    flexo.getter_setter(frame, "cursor",
        function() {
          return window.getComputedStyle(svg).getPropertyValue("cursor");
        },
        function(cursor) {
          svg.style.cursor = cursor;
        });


    var scale = 1;
    flexo.getter_setter(frame, "scale", function() { return scale; },
        function(s) {
          scale = s;
          svg.setAttribute("width", "{0}px".fmt(width * scale));
          svg.setAttribute("height", "{0}px".fmt(height * scale));
        });

    var scenes = [];
    flexo.getter_setter(frame, "scenes", function() { return scenes; });

    var parent = document.getElementById("zap") || document.body;
    parent.appendChild(svg);

    var t0 = Date.now;
    var t;
    flexo.getter_setter(frame, "t0", function() { return t0; });
    var tick = function(t_) {
      t = t_;
      scenes.forEach(function(scene) { scene.tick(t); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return frame;
  };

  zap.scene = function(id)
  {
    var scene = flexo.create_object({
      // Add an object to the scene
      add: function(obj)
      {
        this.element.appendChild(obj.element);
        if (obj.element.id) this["$" + obj.element.id] = obj;
      },

      // Stubs
      begin: function() {},
      tick: function(t) {},
    });
    var svg = flexo.svg("g", { id: id });
    flexo.getter_setter(scene, "element", function() { return svg; });
    return scene;
  };

  zap.svg = function(name, properties)
  {
    var rect = flexo.create_object({});
    var svg = flexo.svg(name, properties);
    flexo.getter_setter(rect, "element", function() { return svg; });
    flexo.getter_setter(rect, "x", function() { return svg.getAttribute("x"); },
        function(x) { svg.setAttribute("x", x); });
    flexo.getter_setter(rect, "y", function() { return svg.getAttribute("y"); },
        function(y) { svg.setAttribute("y", y); });
    flexo.getter_setter(rect, "fill",
        function() { return svg.getAttribute("fill"); },
        function(fill) { svg.setAttribute("fill", fill);
      });
    return rect;
  };

})(this.zap = {});
