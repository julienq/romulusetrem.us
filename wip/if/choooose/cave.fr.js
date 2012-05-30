choooose.init_game({
  $start: ["La Caverne du dragon",
    "corridor_3",
    ["Une pente descendant dans l'abysse", "slope_9"]],
  platform_2: ["Une plateforme peu rassurante",
    ["Une chaleur intense", "lair_11"],
    ["D'abominables odeurs", "foul_14"],
    ["Une lueur tremblante", "troll_15"]],
  corridor_3: ["Un couloir obscur",
    ["Une cavité superficielle", "recess_7"],
    ["Un pont intimidant", "bridge_13"]],
  plummet_4: "☠ Une chute fatale !",
  circumvent_5: ["L'évitement du dragon",
    ["Un couloir s'éloignant", "foul_14"]],
  light_6: ["La lueur semble se mouvoir",
    ["La lumière se rapproche !", "troll_15"]],
  recess_7: {
    pre: function () {
      var desc = "De mystérieuses marques {0} sur la paroi";
      if (!this.game.bridge_color) {
        this.game.bridge_color = choooose.random_element(["noires", "grises"]);
      }
      this.desc = desc.fmt(this.game.bridge_color);
    },
    dests: [["Un pont étroit", "bridge_13"]] },
  hallway_8: ["Une grande salle vide",
    ["Une plateforme éloignée", "platform_2"]],
  slope_9: ["Au plus profond de l'antre du dragon",
    ["Une grande salle", "hallway_8"],
    ["Une faible lueur au loin", "light_6"],
    ["Un étroit couloir", "corridor_12"]],
  close_10: ["Le dragon est toujours proche...",
    ["Doucement...", "circumvent_5"]],
  lair_11: ["Vous apercevez le dragon tout proche !",
    ["Voilà un endroit qui a l'air plus sûr", "close_10"],
    ["Maintenons nos distances", "circumvent_5"],
    ["Le dragon est endormi", "dragon_16"]],
  corridor_12: ["Un couloir étroit et humide",
    ["Vers une plateforme", "platform_2"]],
  bridge_13: {
    desc: "Un pont étroit de pierres noires et grises",
    pre: function (from) {
      this.clear_dests();
      if (this.game.bridge_color === "noires") {
        this.add_dest(["Marchez sur les pierres noires", "platform_2"]);
        this.add_dest(["Marchez sur les pierres grises", "plummet_4"]);
      } else if (this.game.bridge_color === "grises") {
        this.add_dest(["Marchez sur les pierres noires", "plummet_4"]);
        this.add_dest(["Marchez sur les pierres grises", "platform_2"]);
      } else {
        this.add_dest(["Traversez prudemment", "plummet_4"]);
        this.add_dest(["Retournez sur vos pas", from.label]);
      }
    },
  },
  foul_14: ["Un couloir plein de moisissures",
    ["Vers un air un peu plus frais", "hallway_8"]],
  troll_15: {
    enemy: "un troll hideux tenant une torche"
  },
  dragon_16: "Vous terrassez le dragon endormi !"
});
