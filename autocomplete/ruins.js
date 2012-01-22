// Ruins Remixed
// by Brandon Felger

var TITLE = "Ruins Remixed";

var INTRO = "You are once again lost in a jungle far from home. You are ready "
  + "to give up and go home, disappointed in yet another failed archaeological "
  + "expedition. Just as you decide to turn back to camp, you suddenly stumble "
  + "upon something...";

var PLACES =
{
  forest:
  {
    title: "Forest",
    desc: "You stand in a clearing in the deep jungle. Obscured by centuries "
      + "of overgrowth and dim sunlight is a ruined temple of some sort. "
      + "Whatever details there may have been on the stone blocks have long "
      + "since been worn away. There is a single, solitary entryway leading "
      + "downward.",
    down: "dark_passage",
    things: ["mushroom", "temple"],
  },

  dark_passage:
  {
    title: "Dark Passage",
    desc: "This passage is dark and cramped. This is obviously not the "
      + "original entrance to the temple's underground chambers. It continues "
      + "to the north. A dim shaft of light comes from the exit to the forest "
      + "above.",
    up: "forest",
    things: [],
  }
};

var THINGS =
{
  camera:
  {
    desc: "Your trusty camera that has been following you around the world all "
      + "these years lies there.",
    detail: "There's really nothing here that you have not seen before.",
    movable: true,
  },

  mushroom:
  {
    desc: "A polka-dotted mushroom pokes out of the moist soil. It is possibly "
      + "scrumptious.",
    drop: function() {
      message("You discard the abused mushroom to the ground like a used "
          + "facial tissue.");
      return true;
    },
    examine: function() {
      console.log(this);
      if (this.examined) {
        message("Now that you look at it again, you can see clearly that it " +
            "is a toadstool; a nasty looking one, at that");
      } else {
        message("Upon further examination, you decide that, while possibly "
          + "scrumptious, it is also possibly a toadstool."),
        this.examined = true;
      }
    },
    eat: function() {
      message("You pop the scrumptulescent mushroom treat into your mouth. It "
          + "tastes like fungal-flavored candy. The gastronomical delight "
          + "turns out to be a toadstool, and you succumb to its choking, "
          + "asphyxiating aftertaste.");
      die();
      return true;
    },
    take: function() {
      message("You deftly snap the mushroom's stalk, and pluck the hapless "
          + "fungus from its natural habitat.");
      return true;
    },
    movable: true,
    edible: true,
  },

  temple:
  {
    detail: "The stone blocks lie in a large pile, with some strewn about, "
      + "worn and broken. Vines cover the upper half, while soil, leaves and "
      + "grasses cover the bottom half. A set of steep stairs goes straight "
      + "down into darkness.",
    scenery: true,
  },
};

var VERBS =
{
  photograph: function(what)
  {
    if (INVENTORY.hasOwnProperty("camera")) {
      message("Snap! You take a picture of the {0}.".fmt(what));
    } else {
      message("You seem to have misplaced your camera...");
    }
  }
};

var INVENTORY = ["camera"];
var LOCATION = PLACES.forest;
