var readline = require("readline");
var engine = require("./engine.js");
var flexo = require("../flexo.js");
var world = require("./ruins.js");

var rli = readline.createInterface(process.stdin, process.stdout);
rli.on("close", function() {
    process.stdout.write("\n");
    process.exit(0);
  });

function prompt(p, f)
{
  rli.setPrompt(p);
  rli.once("line", function(line) { f(line); });
  rli.prompt();
}

function handle_input(input)
{
  console.log("");
  engine.handle_input(world, input);
  if (world.pc.alive) {
    prompt(world.prompt || engine.default_prompt, handle_input);
  }
}

console.log("");
flexo.listen(world.pc, "@location", function() {
    engine.describe(world, world.pc.location);
  });
flexo.listen(world.pc, "@die", function() {
    engine.message("You have died!", "died");
  });
engine.start(world);
prompt(world.prompt || engine.default_prompt, handle_input);
