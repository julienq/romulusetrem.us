// Output a message
(function()
{
  var title = document.querySelector("h1");

  window.set_title = function(t)
  {
    document.title = document.title.fmt(t);
    title.innerHTML = title.innerHTML.fmt(t);
  };

  var messages = document.getElementById("messages");
  engine.message = function(msg, class_)
  {
    if (class_ === "title") {
      set_title(msg);
    } else {
      var li = flexo.ez_html("li", class_ ? { "class": class_ } : {}, msg);
      messages.appendChild(li);
      li.scrollIntoView();
    }
  };
})();

// Update the inventory
(function()
{
  var ul = document.getElementById("inventory");
  this.update_inventory = function(inventory)
  {
    ul.innerHTML = Object.keys(inventory).sort().map(function(name) {
        return "<li class=\"selectable\" onclick=\"select('{0}')\">{0}</li>"
          .fmt(name);
      }).join("") || "<li>You carry nothing!</li>";
  };
})();

function select(object)
{
};

function handle_input(e)
{
  e.preventDefault();
  var form = e.currentTarget;
  var input = form.input.value;
  form.input.value = "";
  engine.message(input, "player");
  engine.handle_input(world, input);
}

var args = flexo.get_args();
if (args.src) {
  var script = flexo.html("script", { src: args.src });
  document.head.appendChild(script);
  script.onload = function() {
    flexo.listen(world.pc, "@inventory", function() {
        update_inventory(world.pc.inventory);
      });
    flexo.listen(world.pc, "@location", function() {
        engine.describe(world, world.pc.location);
      });
    flexo.listen(world.pc, "@die", function() {
        engine.message("You have died!", "died");
        engine.message("Reload this page for another go...", "center");
        document.querySelector("form").style.display = "none";
      });
    engine.start(world);
  };
} else {
  set_title("nothing");
  update_inventory({});
}
