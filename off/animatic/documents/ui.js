// TODO
// [x] onion skin
// [ ] play/pause/stop
// [ ] drag thumbs
// [x] select thumbs
// [x] append/insert
// [ ] undo add frame
// [x] remove frame

var args = flexo.get_args({ layers: "3", onion_skin: "true" });
var layers = Math.max(1, parseInt(args.layers, 10));
var show_onion_skin = flexo.is_true(args.onion_skin);
var draw = Object.create(svg_draw).init(document.getElementById("canvas"),
    layers);
new_image();

var selection;

function select_thumb(thumb)
{
  if (selection) flexo.remove_class(selection, "selected");
  selection = thumb;
  if (thumb) {
    flexo.add_class(thumb, "selected");
    draw.show_image(thumb.querySelector("use"));
  }
}

var thumbnails = document.getElementById("thumbnails");

function delete_image()
{
  if (selection) {
    var thumb = selection;
    var next = thumb.nextSibling;
    if (!next) next = thumb.previousSibling;
    if (!next) return;
    select_thumb(next);
    thumb.parentNode.removeChild(thumb);
    draw.delete_image(thumb.querySelector("use"));
  }
}

function new_image(next)
{
  var thumb = flexo.html("div", { "class": "thumb" });
  thumb.addEventListener("click", function(e) { select_thumb(thumb); }, false);
  var ref = selection ? next ? selection.nextSibling : selection : null;
  thumbnails.insertBefore(thumb, ref);
  var svg = draw.svg.cloneNode(false);
  thumb.appendChild(svg);
  draw.new_image(ref ? ref.querySelector("use") : null);
  svg.appendChild(flexo.svg_href("use", "#" + draw.image.id));
  select_thumb(thumb);
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
keys[32] = function() { play_pause(); };     // space
keys[65] = function() { new_image(true); };  // A
keys[73] = function() { new_image(); };      // I
keys[79] = function() { onion_skin(); };     // O
keys[82] = function() { draw.redo(); };      // R
keys[83] = function() { save(); };           // S
keys[85] = function() { draw.undo(); };      // U
keys[88] = function() { delete_image(); };   // X

document.addEventListener("keydown", function(e) {
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var which = e.keyCode || e.which;
      if (keys[which]) {
        e.preventDefault();
        keys[which]();
      }
    }
  }, false);
