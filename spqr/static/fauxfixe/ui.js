// TODO
// [x] onion skin
// [x] play
// [x] pause
// [ ] stop
// [ ] timeline
// [ ] scrubbing
// [ ] drag thumbs to reorder
// [x] select thumbs
// [ ] multiple selection
// [x] append/insert
// [/] undo/redo
// [x] remove frame
// [ ] show command
// [ ] number thumbnails
// [ ] auto save/load
// [ ] background sketch
// [ ] background


var selection;
var thumbnails = document.getElementById("thumbnails");

var undo_stack = [];
var redo_stack = [];

var args = flexo.get_args({ layers: 3, onion_skin: "true", fps: 9,
  id: flexo.random_id(6), error: 4 });
var layers = Math.max(1, parseInt(args.layers, 10));
var fps = Math.max(1, parseFloat(args.fps));
var show_onion_skin = flexo.is_true(args.onion_skin);
var draw = Object.create(svg_draw).init(document.getElementById("canvas"),
    layers); //, args.error);
draw.svg.id = args.id;

draw.svg.addEventListener("dragenter", dragenter, false);
draw.svg.addEventListener("dragover", dragover, false);
draw.svg.addEventListener("dragleave", dragleave, false);
draw.svg.addEventListener("drop", drop, false);

function dragenter(e) { e.preventDefault(); }
function dragover(e) { e.preventDefault(); }
function dragleave(e) { e.preventDefault(); }
function drop(e)
{
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  if (file && file.type.match(/^image\/.*/)) {
    draw.set_sketch(window.webkitURL ? window.webkitURL.createObjectURL(file) :
      window.URL ? window.URL.createObjectURL(file) :
      createObjectURL(file), 854, 480);
  }
}


new_frame();

var transport =
{
  play: function()
  {
    var p = (function()
    {
      var next = selection.nextSibling ||
        selection.parentNode.firstElementChild;
      this.playing =
        setTimeout(function() { select_thumb(next); p() }, 1000 / fps);
    }).bind(this);
    if (selection) p();
  },

  pause: function()
  {
    if (this.playing) {
      clearTimeout(this.playing);
      delete this.playing;
    }
  }
};

function select_thumb(thumb)
{
  if (selection) flexo.remove_class(selection, "selected");
  selection = thumb;
  if (thumb) {
    flexo.add_class(thumb, "selected");
    draw.show_frame(thumb.querySelector("use"));
  }
}

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
  if (transport.playing) {
    transport.pause();
    draw.layers = show_onion_skin ? layers : 1;
  } else {
    draw.layers = 1;
    transport.play();
  }
}

function save()
{
  draw.save(function(req) { console.log(req.status); });
}

function select_next()
{
  var next = selection && selection.nextSibling;
  if (next) select_thumb(next);
}

function select_prev()
{
  var prev = selection && selection.previousSibling;
  if (prev) select_thumb(prev);
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

function sketch_opacity() { draw.cycle_sketch_opacity(); }

var keys = [];
keys[32] = play_pause;                       // space
keys[65] = function() { new_frame(true); };  // A
keys[72] = select_prev;                      // H
keys[73] = new_frame;                        // I
keys[76] = select_next;                      // L
keys[79] = onion_skin;                       // O
keys[82] = redo;                             // R
keys[83] = save;                             // S
keys[85] = undo;                             // U
keys[86] = sketch_opacity;                   // V
keys[88] = delete_selection;                 // X

document.addEventListener("keydown", function(e) {
    if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      var which = e.keyCode || e.which;
      if (keys[which]) {
        e.preventDefault();
        keys[which]();
      }
    }
  }, false);
