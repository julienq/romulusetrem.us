if (typeof require === "function") var engine = require("./engine.js");

(function (world)
{
  world.title = "Hometown";

  world.intro = "It's freezing cold on the platform when you get off the "
    + "train. Even though you know that nobody is coming to meet you at the "
    + "station, you still pause for a moment, with the faint hope of "
    + "recognizing somebody. Suddenly, while walking towards the station "
    + "lobby, it hits you: you didn't bring your old keychain with you! That "
    + "means that you don't have the keys to your parents's appartment where "
    + "you're staying tonight. Now that's a great beginning for this trip back "
    + "to your hometown...";

  world.places =
  {
    train_station:
    {
      title: "Hometown train station",
      desc: "At this hour of the evening, the lobby is almost empty. The rare "
        + "passengers who were with you on the train have left from the main "
        + "gate to the west.",
      things: [],
    }
  };

  world.things =
  {
    suitcase:
    {
      name: "suitcase",
      desc: "Your suitcase is standing there, unattended. You might want to "
        + "hold on to it, as it contains your clean underwear.",
      movable: true,
      contents: [],
    },
  };

  world.pc = Object.create(engine.pc).init(world, world.places.train_station,
      "suitcase");

})(typeof exports === "object" ? exports : this.world = {});
