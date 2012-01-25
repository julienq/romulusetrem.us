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

// TODO ask confirmation
engine.verbs.quit = function() { window.location = "../if/index.html"; };

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
  script.onload = ready;
  script.onerror = default_world;
} else {
  default_world();
}

function default_world()
{
  world = {
    title: "if",
    places: {
      howto:
      {
        title: "How to play",
        desc: "To start playing, type <em>play</em> followed by the name of a "
          + "game in your inventory. Type <em>help</em> at any time for help.",
        things: ["site"],
      }
    },
    things:
    {
      ruins:
      {
        name: "ruins",
        desc: "The test game \"Ruins Remixed\" is available...",
        detail: "\"Ruins Remixed\" is a simple test game from a tutorial.",
        src: "ruins.js",
      },
      site:
      {
        name: "site",
        src: "site.js",
      }
    },
    verbs:
    {
      play: function(info)
      {
        if (info.thing && info.thing.src) {
          window.location = "?src={0}".fmt(info.thing.src);
          return true;
        } else {
          engine.message("You cannot play that!");
        }
      },
      quit: function() { window.location = "../index.html"; }
    }
  };
  world.pc = Object.create(engine.pc).init(world, world.places.howto, "ruins");
  ready();
}

function ready()
{
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
