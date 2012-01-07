// TODO
// [x] onion skin
// [ ] play/pause/stop
// [ ] drag thumbs to reorder
// [x] select thumbs
// [ ] multiple selection
// [x] append/insert
// [/] undo/redo
// [x] remove frame
// [ ] show command

var undo_stack = [];
var redo_stack = [];

var args = flexo.get_args({ layers: "3", onion_skin: "true" });
var layers = Math.max(1, parseInt(args.layers, 10));
var show_onion_skin = flexo.is_true(args.onion_skin);
var draw = Object.create(svg_draw).init(document.getElementById("canvas"),
    layers);
new_frame();

var selection;

function select_thumb(thumb)
{
  if (selection) flexo.remove_class(selection, "selected");
  selection = thumb;
  if (thumb) {
    flexo.add_class(thumb, "selected");
    draw.show_frame(thumb.querySelector("use"));
  }
}

var thumbnails = document.getElementById("thumbnails");

// Delete the current selection, with a command
function delete_selection()
{
  if (selection) {
    var frame = delete_frame(selection);
    done("delete", readd_frame.bind(this, frame),
        delete_frame.bind(this, thumb));
  }
}

// Delete a given frame without command
function delete_frame(thumb)
{
  var next = thumb.nextSibling;
  var append = false;
  if (!next) {
    next = thumb.previousSibling;
    append = true;
  }
  if (!next) return;
  select_thumb(next);
  thumb.parentNode.removeChild(thumb);
  return draw.delete_frame(thumb.querySelector("use"));
}

function readd_frame(frame)
{
}

function new_frame(next, ref)
{
  var thumb = flexo.html("div", { "class": "thumb" });
  thumb.addEventListener("click", function(e) { select_thumb(thumb); }, false);
  if (ref === undefined) {
    ref = selection ? next ? selection.nextSibling : selection : null;
  }
  thumbnails.insertBefore(thumb, ref);
  var svg = draw.svg.cloneNode(false);
  thumb.appendChild(svg);
  draw.new_frame(ref ? ref.querySelector("use") : null);
  svg.appendChild(flexo.svg_href("use", "#" + draw.frame.id));
  select_thumb(thumb);
  done(next ? "add" : "insert", delete_frame.bind(this, thumb),
      new_frame.bind(this, next, ref));
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

flexo.listen(draw, "@drawn", function() {
    done("draw", draw.undo.bind(draw), draw.redo.bind(draw));
  });

function done(label, u, r)
{
  undo_stack.push([label, u, r]);
  redo_stack = [];
  console.log("> {0}".fmt(label));
}

function undo()
{
  var command = undo_stack.pop();
  if (command) {
    redo_stack.push(command);
    console.log("< {0}".fmt(command[0]));
    command[1]();
  }
}

function redo()
{
  var command = redo_stack.pop();
  if (command) {
    undo_stack.push(command);
    console.log(">>> {0}".fmt(command[0]));
    command[2]();
  }
}

var keys = [];
keys[32] = function() { play_pause(); };        // space
keys[65] = function() { new_frame(true); };     // A
keys[73] = function() { new_frame(); };         // I
keys[79] = function() { onion_skin(); };        // O
keys[82] = function() { redo(); };              // R
keys[83] = function() { save(); };              // S
keys[85] = function() { undo(); };              // U
keys[88] = function() { delete_selection(); };  // X

document.addEventListener("keydown", function(e) {
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var which = e.keyCode || e.which;
      if (keys[which]) {
        e.preventDefault();
        keys[which]();
      }
    }
  }, false);
