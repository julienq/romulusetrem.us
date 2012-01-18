// Ruins Remixed
// by Brandon Felger

var TITLE = "Ruins Remixed";

var INTRO = "You are once again lost in a jungle far from home. You are ready "
  + "to give up and go home, disappointed in yet another failed archaeological "
  + "expedition. Just as you decide to turn back to camp, you suddenly stumble "
  + "upon something...";

var PLACES = {
  forest:
  {
    title: "Forest",
    desc: "You stand in a clearing in the deep jungle. Obscured by centuries "
      + "of overgrowth and dim sunlight is a ruined temple of some sort. "
      + "Whatever details there may have been on the stone blocks have long "
      + "since been worn away. There is a single, solitary entryway leading "
      + "downward.",
    things: [{ name: "mushroom", desc: "A polka-dotted mushroom pokes out of "
      + "the moist soil. It is possibly scrumptious.", detail: "Upon further "
      + "examination, you decide that, while possibly scrumptious, it is also "
      + "possibly a toadstool.", properties: { edible: true } }],
  },
  dark_passage:
  {
    title: "Dark Passage",
    desc: "This passage is dark and cramped. This is obviously not the "
      + "original entrance to the temple's underground chambers. It continues "
      + "to the north. A dim shaft of light comes from the exit to the forest "
      + "above.",
  }
};

var CURRENT = PLACES["forest"];
