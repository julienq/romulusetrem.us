window.STROKE = document.getElementById("stroke");
window.FILL = document.getElementById("fill");
window.WIDTH = document.getElementById("width");

var draw = Object.create(svg_draw).init(document.getElementById("canvas"));

function select_thumb(thumb)
{
  if (selection) flexo.remove_class(selection, "selected");
  selection = thumb;
  if (thumb) {
    flexo.add_class(thumb, "selected");
    draw.show_frame(thumb.querySelector("use"));
  }
}

function save()
{
  draw.save(function(req) {
      console.log(JSON.parse(req.responseText));
    });
}

var keys = [];
keys[82] = function() { draw.redo(); };  // R
keys[83] = function() { save(); };       // S
keys[85] = function() { draw.undo(); };  // U

document.addEventListener("keydown", function(e) {
    if (e.target.tagName !== "INPUT" &&
      !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var which = e.keyCode || e.which;
      if (keys[which]) {
        e.preventDefault();
        keys[which]();
      }
    }
  }, false);
