if (typeof require === "function") var flexo = require("../../flexo.js");

// TODO match thing name rather than thing key

(function (engine)
{
  // Overload this function
  engine.message = function(msg) { console.log(msg.wrap(72), "\n"); };

  // Player character prototype
  engine.pc =
  {
    // Initialize the player character in a world with a start location. The
    // remaining arguments are the names of items in the player's inventory.
    init: function(world, location)
    {
      this.alive = true;
      this.world = world;
      this.location = location;
      this.inventory = {};
      for (var i = 2; i < arguments.length; ++i) {
        var thing = world.things[arguments[i]];
        thing.carried = true;
        this.inventory[arguments[i]] = thing;
      }
      return this;
    },

    die: function()
    {
      if (this.alive) {
        this.alive = false;
        flexo.notify(this, "@die");
      }
    }
  };

  // Words skipped during parsing
  var skip_words = {};
  ["a", "from", "the", "to"].forEach(function(w) { skip_words[w] = true; });

  // Parse an input string and return the extracted tokens. At the moment this
  // is really naive and only understand sentences in the form "V Object" with
  // minimal robustness (see list of skipped words above.)
  engine.parse = function(input)
  {
    input = flexo.normalize(input).toLowerCase();
    var tokens = input.split(" ")
      .filter(function(w) { return !skip_words.hasOwnProperty(w); });
    return { verb: tokens[0], object: tokens[1] };
  };

  // Handle the input from the object point of view
  function handle_object(info)
  {
    if (info.thing && info.thing.hasOwnProperty(info.verb)) {
      return info.thing[info.verb](info);
    }
  }

  // Default and silent actions for verbs. Return true on successful handling.
  engine.verbs =
  {
    drop: function(info)
    {
      if (info.thing && info.world.pc.inventory.hasOwnProperty(info.object)) {
        info.world.pc.location.things.push(info.object);
        delete info.world.pc.inventory[info.object];
        flexo.notify(info.world.pc, "@inventory");
        return true;
      }
    },

    eat: function(info)
    {
      if (!info.world.pc.inventory.hasOwnProperty(info.object)) {
        info.world.pc.location.things.splice(things.indexOf(info.object), 1);
      } else {
        delete info.world.pc.inventory[info.object];
      }
      return true;
    },

    go: function(info)
    {
      var loc = info.world.pc.location;
      if (loc.hasOwnProperty(info.object)) {
        info.world.pc.location = info.world.places[loc[info.object]];
        flexo.notify(info.world.pc, "@location");
        return true;
      }
    },

    take: function(info)
    {
      var things = info.world.pc.location.things;
      var inventory = info.world.pc.inventory;
      if (info.thing && info.thing.movable &&
          !inventory.hasOwnProperty(info.object)) {
        inventory[info.object] = info.thing;
        things.splice(things.indexOf(info.object), 1);
        flexo.notify(info.world.pc, "@inventory");
        return true;
      }
    },
  };

  // Default actions with messages.
  var verbs =
  {
    // Drop objects from the inventory
    drop: function(info)
    {
      if (engine.verbs.drop(info)) {
        engine.message("You dropped the {0}.".fmt(info.object));
        return true;
      } else {
        engine.message("You cannot drop that.");
      }
    },

    // Eat objects that are lying around or from the inventory
    eat: function(info)
    {
      if (info.thing) {
        if (info.thing.edible) {
          engine.verbs.eat(info.thing);
          engine.message("You ate the {0}.".fmt(info.object));
        } else {
          engine.message("You're definitely not putthing that in your mouth.");
        }
        return true;
      } else {
        engine.message("You cannot eat that.");
      }
    },

    // Examine an object from either the current location or inventory
    examine: function(info)
    {
      if (info.thing) {
        if (info.thing.hasOwnProperty("detail")) {
          engine.message(info.thing.detail);
        } else {
          engine.message("There is nothing special about that.");
        }
        return true;
      } else {
        engine.message("You cannot see such a thing.");
      }
    },

    // Go in the given direction
    go: function(info)
    {
      if (engine.verbs.go(info)) {
        return true;
      } else {
        engine.message("You cannot go there.");
      }
    },

    // Help!
    help: function()
    {
      engine.message("Just type commands and follow the story. At the moment "
          + "the parser can only understand commands of the form VERB "
          + "[OBJECT].");
    },

    // List items in inventory
    inventory: function(info)
    {
      var inventory = Object.keys(info.world.pc.inventory).sort();
      engine.message("You currently carry {0}.".fmt(inventory.length === 0 ?
          "nothing" : inventory.map(function(n, i) {
              return "{0}a{1} {2}".fmt(i === inventory.length - 1 && i > 0 ?
                "and " : "", /^[aiueoy]/.test(n) ? "n" : "", n);
            }).join(", ")));
      return true;
    },

    look: function(info)
    {
      engine.describe(info.world, info.world.pc.location);
      return true;
    },

    // TODO distinguish between cannot take (no effect) and nothing to take
    // (input error)
    take: function(info)
    {
      if (engine.verbs.take(info)) {
        engine.message("You took the {0}.".fmt(info.object));
        return true;
      } else {
        engine.message("You cannot take that.");
      }
    }
  };

  // Handle the input from the verb point of view
  function handle_verb(info)
  {
    if (info.world.verbs && info.world.verbs.hasOwnProperty(info.verb)) {
      return info.world.verbs[info.verb](info);
    } else if (verbs.hasOwnProperty(info.verb)) {
      return verbs[info.verb](info);
    } else if (engine.verbs.hasOwnProperty(info.verb)) {
      return engine.verbs[info.verb](info);
    } else {
      engine.message("I have no idea what you're talking about.");
    }
  }

  // Find a thing in the player's invenrtory or (if specified) a location
  engine.find_thing = function(world, object, location)
  {
    if (!object) return;
    if (world.pc.inventory.hasOwnProperty(object)) {
      return world.pc.inventory[object];
    }
    if (location && location.things) {
      var i =location.things.indexOf(object);
      if (i >= 0) return world.things[location.things[i]];
    }
  };

  // Describe a place and the things that are there
  engine.describe = function(world, place)
  {
    engine.message(place.title, "room");
    engine.message(place.desc);
    if (place.things) {
      place.things.forEach(function(object) {
          var thing = world.things[object];
          if (thing.desc && !thing.scenery) engine.message(thing.desc);
        });
    }
  };

  // Handle an input string: first parse it, then try the different tokens from
  // right to left for handling. At the moment of course that's only object,
  // then verb. This is the main entry point -- give the current world and last
  // input as argument and there you go!
  // After every action there is a new tick to keep track of elapsed time.
  // TODO better distinction between errors and actions that have no effect.
  engine.handle_input = function(world, input)
  {
    // Sanity check: the player should be alive!
    if (!world.pc.alive) {
      engine.message("I'm sorry, but you appear to be dead.");
      return;
    }
    var parse = engine.parse(input);
    parse.thing = engine.find_thing(world, parse.object, world.pc.location);
    parse.world = world;
    var handled = handle_object(parse) || handle_verb(parse);
    if (handled) {
      ++world.ticks;
      flexo.notify(world, "@ticks");
    }
    return handled;
  };

  engine.start = function(world)
  {
    if (world.title) engine.message(world.title, "title");
    if (world.intro) engine.message(world.intro, "intro");
    if (!world.ticks) world.ticks = 0;
    flexo.notify(world.pc, "@inventory");
    flexo.notify(world.pc, "@location");
  };

  engine.default_prompt = "What next ? ";

})(typeof exports === "object" ? exports : this.engine = {});
