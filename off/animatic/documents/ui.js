// TODO
// [ ] onion skin
// [ ] play/pause/stop
// [ ] drag thumbs

var args = flexo.get_args({ layers: "3", onion_skin: "true" });
var layers = Math.max(1, parseInt(args.layers, 10));
var show_onion_skin = flexo.is_true(args.onion_skin);
var draw = Object.create(svg_draw).init(document.getElementById("canvas"),
    layers);
new_image();

function new_image()
{
  var thumb = flexo.html("div", { "class": "thumb" });
  document.body.appendChild(thumb);
  var svg = draw.svg.cloneNode(false);
  thumb.appendChild(svg);
  draw.new_image();
  svg.appendChild(flexo.svg_href("use", "#" + draw.image.id));
}

function onion_skin()
{
  show_onion_skin = !show_onion_skin;
  draw.layers = show_onion_skin ? layers : 1;
}

function play_pause()
{
}

function save()
{
  draw.save(function(req) {
      console.log(JSON.parse(req.responseText));
    });
}

var keys = [];
keys[32] = function() { play_pause(); };
keys[78] = function() { new_image(); };
keys[79] = function() { onion_skin(); };
keys[82] = function() { draw.redo(); };
keys[83] = function() { save(); };
keys[85] = function() { draw.undo(); };

document.addEventListener("keydown", function(e) {
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var which = e.keyCode || e.which;
      if (keys[which]) {
        e.preventDefault();
        keys[which]();
      }
    }
  }, false);
