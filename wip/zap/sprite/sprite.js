zap.title = "Sprite";

var frame = zap.frame(640, 480);

var speed = 2;

var scene = zap.scene();

scene.begin = function()
{
  var boy = zap.image("boy.png", { id: "boy" });
  boy.hitbox = { x: 18, y: 64, width: 65, height: 72 };
  scene.add(boy);
  for (var i = 0; i < 3; ++i) {
    var bug = zap.image("bug.png");
    bug.kind = "bug";
    bug.hitbox = { x: 0, y: 76, width: 101, height: 64 };
    scene.add(bug);
    flexo.listen(bug, "#load", function(e) {
        e.source.x = flexo.random_number(0, frame.width - e.source.width);
        e.source.y = flexo.random_number(0, frame.height - e.source.height);
      });
  }
};

scene.tick = function(t)
{
  var x_before = this.$boy.x;
  var y_before = this.$boy.y;
  if (this.frame.keys.right) {
    this.$boy.x += speed;
  } else if (this.frame.keys.left) {
    this.$boy.x -= speed;
  }
  if (this.frame.keys.up) {
    this.$boy.y -= speed;
  } else if (this.frame.keys.down) {
    this.$boy.y += speed;
  }
  if (this.collide(this.$boy, this.kinds.bug)) {
    this.$boy.x = x_before;
    this.$boy.y = y_before;
  }
};

frame.add_scene(scene);
