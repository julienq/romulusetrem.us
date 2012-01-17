var server = require("./spqr.js");
var flexo = require("../flexo.js");

var APPS = [];
var PORT = 6381;
var REDIS_PORT;
var IP = "";
var HELP = false;

server.DOCUMENTS = process.cwd();

// Parse arguments from the command line
function parse_args(args)
{
  var m;
  args.forEach(function(arg) {
      if (m = arg.match(/^port=(\d+)/)) {
        PORT = parseInt(m[1], 10);
      } else if (m = arg.match(/^redis=(\d+)/)) {
        REDIS_PORT = parseInt(m[1], 10);
      } else if (m = arg.match(/^ip=(\S*)/)) {
        IP = m[1];
      } else if (arg.match(/^h(elp)?$/i)) {
        HELP = true;
      } else if (m = arg.match(/^documents=(\S+)/)) {
        server.DOCUMENTS = m[1];
      } else if (m = arg.match(/^app=(\S+)/)) {
        APPS.push(m[1]);
      }
    });
}

// Show help info and quit
function show_help(node, name)
{
  console.log("\nUsage: {0} {1} [options]\n\nOptions:".fmt(node, name));
  console.log("  help:                 show this help message");
  console.log("  ip=<ip address>:      IP address to listen to");
  console.log("  port=<port number>:   port number for the server");
  console.log("  redis=<port number>:  port number for the Redis server");
  console.log("  documents=<apps dir>: path to the documents directory");
  console.log("");
  process.exit(0);
}

parse_args(process.argv.slice(2));
if (HELP) show_help.apply(null, process.argv);

if (REDIS_PORT) {
  server.REDIS = require("redis").createClient(REDIS_PORT);
  server.REDIS.on("error", function(err) {
      server.error("Redis error:", err);
    });
  server.REDIS.on("ready", function() { server.debug("redis", "ready"); });
}

var dispatcher = server.make_dispatcher(
  ["GET", /^\/favicon\.ico$/, function(req, response) {
      server.serve_error(req, response, 404);
    }],
  ["GET", /^\/flexo.js$/, function(req, response) {
      server.serve_file(req, response, "flexo.js");
    }]);
APPS.forEach(function(a) {
    var app = require(a);
    app.SERVER = server;
    [].push.apply(server.patterns, app.patterns);
  });
server.run(IP, PORT, dispatcher);
