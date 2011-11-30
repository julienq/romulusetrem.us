var canvas_bg, canvas_fg, bg, fg, n_images, block_size;
var loaded_images = 0;
var ANIM_RATE_MS = 150;
var start = 0;
var map_w = 15;

var map = " *             " +
          "*            * " +
          "        *      " +
          "      *        " +
          "*              " +
          "* *@  *        " +
          "********       " +
          "*********** *  " +
          "************* *" +
          "***************";

var cat = {
  i: 0,
  speed: 2,
  moving: false,
  left: true,

  update_pos: function(dx, up)
  {
    var x1 = this.x + this.hitbox.x + dx;
    var x2 = x2 + this.hitbox.w;
    var y1 = this.y + this.hitbox.y;
    var y2 = y2 + this.hitbox.y;

  }
};

window.onload = function()
{
  canvas_bg = document.getElementById("bg");
  canvas_fg = document.getElementById("fg");
  bg = canvas_bg.getContext("2d");
  fg = canvas_fg.getContext("2d");
  cat.images = [document.getElementById("cat1"),
    document.getElementById("cat2")];
  n_images = document.querySelectorAll("img").length;
  loaded_image();
  keyboard.init();
};

function loaded_image(e)
{
  if (e) ++loaded_images;
  if (n_images !== undefined && loaded_images === n_images) {
    cat.w = cat.images[cat.i].width;
    cat.h = cat.images[cat.i].height;
    cat.hitbox = { x: cat.w / 4, y: 0, w: cat.w / 2, h: cat.h };
    background();
    requestAnimationFrame(run);
  }
}

function background()
{
  var blocks = document.getElementById("blocks");
  block_size = blocks.height;
  bg.globalAlpha = 0.15;
  for (var x = 0; x < canvas_bg.width; x += block_size) {
    for (var y = 0; y < canvas_bg.height; y += block_size) {
      bg.drawImage(blocks, flexo.random_int(0, 3) * block_size, 0, block_size,
        block_size, x, y, block_size, block_size);
    }
  }
  bg.globalAlpha = 1;
  bg.fillStyle = "#f80";
  for (var i = 0, n = map.length; i < n; ++i) {
    if (map[i] === "*") {
      var x = i % map_w;
      var y = Math.floor(i / map_w);
      bg.fillRect(x * block_size, y * block_size, block_size - 1,
          block_size - 1);
      bg.drawImage(blocks, flexo.random_int(0, 3) * block_size, 0, block_size,
        block_size, x * block_size, y * block_size, block_size, block_size);
    } else if (map[i] === "@") {
      cat.x = (i % map_w) * block_size;
      cat.y = (Math.floor(i / map_w) + 1) * block_size - cat.h;
    }
  }
}

var keyboard =
{
  ALIASES: { cancel: 3, help: 6, backspace: 8, tab: 9, clear: 12, "return": 13,
    enter: 14, pause: 19, capslock: 20, "escape": 27, space: 32, pageup: 33,
    pagedown: 34, end: 35, home: 36, left: 37, up: 38, right: 39, down: 40,
    select: 41, print: 42, execute: 43, printscreen: 44, insert: 45,
    "delete": 46 },

  handleEvent: function(e)
  {
    this.key_codes[e.keyCode] = e.type === "keydown";
    this.modifiers.shift = event.shiftKey;
    this.modifiers.ctrl = event.ctrlKey;
    this.modifiers.alt = event.altKey;
    this.modifiers.meta = event.metaKey;
  },

  init: function()
  {
    this.key_codes = {};
    this.modifiers = {};
    document.addEventListener("keydown", this, false);
    document.addEventListener("keyup", this, false);
  },

  pressed: function(desc)
  {
    var keys = desc.split("+");
    for (var i = keys.length - 1; i >= 0; --i) {
      var key = keys[i];
      if (this.modifiers.hasOwnProperty(key)) {
        if (!this.modifiers[key]) return false;
      } else if (!this.key_codes[this.ALIASES[key] || key.charCodeAt(0)]) {
        return false;
      }
    }
    return true;
  }
};


function run()
{
  var m = false;
  var up = keyboard.pressed("up");
  if (keyboard.pressed("left")) {
    m = true;
    cat.left = true;
    cat.update_pos(-cat.speed, up);
  }
  if (keyboard.pressed("right")) {
    m = true;
    cat.left = false;
    cat.update_pos(cat.speed, up);
  }
  fg.clearRect(0, 0, canvas_fg.width, canvas_fg.height);
  fg.fillStyle = "#08f";
  fg.fillRect(cat.x + cat.hitbox.x, cat.y + cat.hitbox.y, cat.hitbox.w,
      cat.hitbox.h);
  if (cat.left) {
    fg.drawImage(cat.images[cat.i], cat.x, cat.y);
  } else {
    fg.save();
    fg.scale(-1, 1);
    fg.drawImage(cat.images[cat.i], -(cat.x + cat.w), cat.y);
    fg.restore();
  }
  if (m) {
    if (!cat.moving) start = 0;
    var now = new Date();
    if (now - start > ANIM_RATE_MS) {
      cat.i = (cat.i + 1) % cat.images.length;
      start = now;
    }
    cat.moving = true;
  } else {
    cat.moving = false;
  }
  requestAnimationFrame(run);
}
