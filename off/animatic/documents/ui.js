// TODO
// [ ] onion skin
// [ ] play/pause/stop
// [ ] drag thumbs

var args = flexo.get_args({ fps: 9, layers: 0 });
var layers = parseFloat(args.layers);
var draw = Object.create(svg_draw).init(document.getElementById("canvas"));
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
