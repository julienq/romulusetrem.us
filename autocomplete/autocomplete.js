// Output a message
(function()
{
  var messages = document.getElementById("messages");
  window.message = function(msg, class_)
  {
    var li = flexo.ez_html("li", class_ ? { "class": class_ } : {}, msg);
    messages.appendChild(li);
    li.scrollIntoView();
    return li;
  };
})();

// Update the inventory
(function()
{
  var inventory = document.getElementById("inventory");
  window.update_inventory = function()
  {
    inventory.innerHTML = Object.keys(INVENTORY).map(function(object) {
        return "<li onclick=\"select_object('{0}')\">{0}</li>".fmt(object);
      }).join("") || "<li>You carry nothing!</li>";
  };
})();


// Autocomplete stuff
var verbs =
{
  // Drop objects from the inventory
  drop: function(what)
  {
    if (INVENTORY.hasOwnProperty(what)) {
      var object = INVENTORY[what];
      if (object.drop && object.drop()) {
        LOCATION.things.push(what);
        delete INVENTORY[what];
        update_inventory();
        return;
      }
      message("You dropped the {0}.".fmt(what));
      LOCATION.things.push(what);
      delete INVENTORY[what];
      update_inventory();
    } else {
      message("You cannot drop that.");
    }
  },

  // Eat edible objects
  eat: function(what)
  {
    var thing;
    var i = LOCATION.things.indexOf(what);
    if (i < 0) {
      if (INVENTORY.hasOwnProperty(what)) {
        thing = INVENTORY[what];
        if (thing.edible) {
          delete INVENTORY[what];
          update_inventory();
        }
      } else {
        message("You cannot see such a thing.");
      }
    } else {
      thing = THINGS[LOCATION.things[i]];
      if (thing.edible) LOCATION.things.splice(i, 1);
    }
    if (thing) {
      if (thing.eat && thing.eat()) return;
      if (thing.edible) {
        message("You eat the {0}.".fmt(what));
      } else {
        message("That's plainly inedible!");
      }
    }
  },

  // Examine an object from either the current location or inventory
  examine: function(what)
  {
    var thing;
    var i = LOCATION.things.indexOf(what);
    if (i < 0) {
      if (INVENTORY.hasOwnProperty(what)) thing = INVENTORY[what];
    } else {
      thing = THINGS[LOCATION.things[i]];
    }
    if (thing) {
      if (thing.examine) {
        thing.examine();
      } else if (thing.hasOwnProperty("detail")) {
        message(thing.detail);
      } else {
        message("There is nothing special about that.");
      }
    } else {
      message("You cannot see such a thing.");
    }
  },

  // Help!
  help: function()
  {
    message("Just type commands and follow the story. At the moment the parser "
        + "can only understand commands of the form VERB [OBJECT [INDIRECT "
        + "OBJECT]]");
  },

  // Go in the given direction
  go: function(dir)
  {
    if (LOCATION.hasOwnProperty(dir)) {
      LOCATION = PLACES[LOCATION[dir]];
      describe(LOCATION);
    } else {
      message("You cannot go there.");
    }
  },

  // "go to": function(place) { message("There is no such place."); },
  look: function()
  {
    describe(LOCATION);
  },

  // "look at": function(what) { message("You cannot see such a thing."); },
  say: function(what) { message("There is nobody to talk to."); },

  // Take an object
  take: function(what)
  {
    // Find the object in the current room
    var i = LOCATION.things.indexOf(what);
    if (i < 0) {
      message("I don't see that around.");
    } else {
      var name = LOCATION.things[i];
      var object = THINGS[name];
      if (object.take && object.take()) {
        LOCATION.things.splice(i, 1);
        INVENTORY[name] = object;
        update_inventory();
        return;
      }
      if (object.movable) {
        LOCATION.things.splice(i, 1);
        message("You took the {0}.".fmt(name));
        INVENTORY[name] = object;
        update_inventory();
      } else {
        message("You cannot take this.");
      }
    }
  },
};

var directions = ["north", "south", "east", "west", "up", "down"];

// The handler
function handle_input(input)
{
  var parse = parse_input(input);
  return handle_object(parse, false) ||
    handle_object(parse, true) ||
    handle_verb(parse);
}

function handle_verb(parse)
{
  if (verbs.hasOwnProperty(parse.verb)) {
    verbs[parse.verb](parse.object, parse.indirect);
  } else if (parse.verb) {
    message("I don't know what \"{0}\" means.".fmt(parse.verb));
  }
  return !!parse.verb;
}

function handle_object(parse, direct)
{
  /*var object = direct ? parse.object : parse.indirect;
  if (objects.hasOwnProperty(object)) {
    return objects[object](parse.verb, parse.object, parse.indirect);
  }*/
  return false;
}

// The parser
// Can only parse sentences of the form VERB [DIRECT OBJECT [INDIRECT OBJECT]]
function parse_input(input)
{
  input = flexo.normalize(input).toLowerCase();
  var tokens = input.split(" ");
  return { verb: tokens[0], object: tokens[1], indirect: tokens[2] };
}

(function()
{
  var prompt = document.getElementById("prompt");
  var completions = document.getElementById("completions");
  var orig = "";  // original user input
  var ci = 0;     // completion index
  var completep = true;

  function clear_prompt()
  {
    prompt.value = "";
    completions.innerHTML = "";
    completep = false;
    prompt.scrollIntoView();
  }

  window.die = function()
  {
    message("You have died!", "died");
    message("Reload this page for another go!");
    prompt.style.display = "none";
  }

  function user_input(cmd)
  {
    if (/\S/.test(cmd)) {
      message(cmd, "player");
      if (!handle_input(cmd)) {
        message("I have no idea what you're talking about.");
      }
    }
    clear_prompt();
  }

  function choose_completion(incr)
  {
    var li = completions.querySelectorAll("li");
    var sel = completions.querySelector(".sel");
    if (sel) sel.className = "";
    ci += incr;
    if (ci < 0) ci += li.length + 1;
    if (ci > li.length) ci = 0;
    if (ci === 0) {
      prompt.value = orig;
    } else {
      li[ci - 1].className = "sel";
      prompt.value = li[ci - 1].textContent;
    }
    completep = false;
  }

  function complete()
  {
    if (!completep) {
      completep = true;
      return;
    }
    completions.innerHTML = "";
    orig = prompt.value;
    var i = flexo.normalize(orig).toLowerCase();
    var l = i.length;
    if (l > 0) {
      Object.keys(verbs).sort().forEach(function(w) {
          if (w.substr(0, l) === i) {
            var li = flexo.ez_html("li", w);
            li.addEventListener("click", function() { user_input(w); }, false);
            completions.appendChild(li);
          }
        });
    }
    completions.scrollIntoView();
  }

  prompt.addEventListener("keydown", function(e) {
      if (e.keyCode === 13) {
        user_input(e.target.value);
      } else if (e.keyCode === 27) {
        clear_prompt();
      } else if (e.keyCode === 38) {
        e.preventDefault();
        choose_completion(-1);
      } else if (e.keyCode === 40) {
        e.preventDefault();
        choose_completion(+1);
      }
    }, false);

  prompt.addEventListener("keyup", complete, false);

})();

function describe(place)
{
  message(place.title, "room");
  message(place.desc);
  place.things.forEach(function(thing) {
      if (THINGS[thing].desc && !THINGS[thing].scenery) {
        message(THINGS[thing].desc);
      }
    });
}

document.title = document.title.fmt(TITLE);
document.querySelector("h1").textContent = TITLE;

// Init inventory
var i = INVENTORY;
INVENTORY = {};
i.forEach(function(thing) { INVENTORY[thing] = THINGS[thing]; });
update_inventory();

// Add custom verbs
if (VERBS) {
  for (var v in VERBS) if (VERBS.hasOwnProperty(v)) verbs[v] = VERBS[v];
}

message(INTRO, "intro");
describe(LOCATION);
