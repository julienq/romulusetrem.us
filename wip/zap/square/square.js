var frame = zap.frame(320, 240);
frame.scale = 2;
frame.cursor = "none";

var scene = zap.scene();

scene.begin = function()
{
  var square = zap.svg("rect",
    { fill: "white", width: 16, height: 16, id: "square" });
  scene.add(square);
};

scene.tick = function(t)
{
  this.$square.x = flexo.clamp(this.frame.mouse_x, 0, this.frame.width);
  this.$square.y = flexo.clamp(this.frame.mouse_y, 0, this.frame.height);
  if (this.frame.button) {
    this.$square.fill = flexo.get_color_20(flexo.random_int(0, 19));
  }
};

frame.add_scene(scene);
