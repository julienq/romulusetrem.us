choooose.init_game({
  $start: ["The Dragon's Cave",
    "corridor_3",
    ["A slope descending into the abyss", "slope_9"]],
  platform_2: ["A dangerous looking platform",
    ["Such heat!", "lair_11"],
    ["Foul smells", "foul_14"],
    ["A wobbly light nearby", "troll_15"]],
  corridor_3: ["A dark corridor",
    ["A shallow recess", "recess_7"],
    ["A dangerous looking bridge", "bridge_13"]],
  plummet_4: "☠ You plummet to your death!",
  circumvent_5: ["Circumventing the Dragon",
    ["A corridor leading away", "foul_14"]],
  light_6: ["The light seems to be moving?",
    ["The light is getting closer", "troll_15"]],
  recess_7: {
    pre: function () {
      var desc = "Mysterious {0} markings on the walls";
      if (!this.game.bridge_color) {
        this.game.bridge_color = choooose.random_element(["black", "gray"]);
      }
      this.desc = desc.fmt(this.game.bridge_color);
    },
    dests: [["A narrow bridge", "bridge_13"]] },
  hallway_8: ["A large, empty hallway",
    ["A platform in the distance", "platform_2"]],
  slope_9: ["Deep in the Dragon's lair",
    ["A large hallway", "hallway_8"],
    ["A dim light in the distance", "light_6"],
    ["A narrow corridor", "corridor_12"]],
  close_10: ["The Dragon is still close...",
    ["Careful...", "circumvent_5"]],
  lair_11: ["You catch a glimpse of the Dragon nearby!",
    ["Looks like a safer place", "close_10"],
    ["Keep your distance", "circumvent_5"],
    ["The Dragon is sleeping", "dragon_16"]],
  corridor_12: ["A narrow and damp corridor",
    ["Toward a platform", "platform_2"]],
  bridge_13: {
    desc: "A narrow bridge of black and gray stones",
    pre: function (from) {
      this.clear_dests();
      if (this.game.bridge_color === "black") {
        this.add_dest(["Walk on the black stones", "platform_2"]);
        this.add_dest(["Walk on the gray stones", "plummet_4"]);
      } else if (this.game.bridge_color === "gray") {
        this.add_dest(["Walk on the black stones", "plummet_4"]);
        this.add_dest(["Walk on the gray stones", "platform_2"]);
      } else {
        this.add_dest(["Cross carefully", "plummet_4"]);
        this.add_dest(["Take a step back", from.label]);
      }
    },
  },
  foul_14: ["A moldy corridor",
    ["Somewhat fresher air", "hallway_8"]],
  troll_15: {
    enemy: "a hideous troll carrying a torch",
  },
  dragon_16: "You slay the sleeping Dragon!"
});
