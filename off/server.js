// Base SPQR server
// Can optionally connect to a Redis server and load applications
var util = require("util");
var server = require("./spqr.js");

var APPS = [];
var PORT = 8910;
var REDIS_PORT;
var IP = "";
var HELP = false;

server.DOCUMENTS = require("path").join(process.cwd(), "static");

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
  console.log("  app=<app.js>:         path to application file");
  console.log("  documents=<apps dir>: path to the documents directory");
  console.log("  help:                 show this help message");
  console.log("  ip=<ip address>:      IP address to listen to");
  console.log("  port=<port number>:   port number for the server");
  console.log("  redis=<port number>:  port number for the Redis server");
  console.log("");
  process.exit(0);
}

parse_args(process.argv.slice(2));
if (HELP) show_help.apply(null, process.argv);

[].push.apply(server.PATTERNS,
  [
    ["GET", /^\/favicon\.ico$/, function(transaction) {
        transaction.serve_error(404, "No favicon");
      }],
    ["GET", /^\/flexo.js$/, function(transaction) {
        transaction.serve_file_from_path("../flexo.js");
      }]
  ]);

APPS.forEach(function(a) {
    var app = require(a);
    [].push.apply(server.PATTERNS, app.PATTERNS);
  });

if (REDIS_PORT) {
  var redis = require("redis").createClient(REDIS_PORT);
  server.TRANSACTION.redis = function() {
    var cmd = [].shift.apply(arguments);
    var f = [].pop.apply(arguments);
    if (typeof redis[cmd] === "function") {
      [].push.call(arguments, (function(err, results) {
          if (err) {
            this.serve_error(500, "Redis error: " + err);
          } else {
            f.call(this, results);
          }
        }).bind(this));
      redis[cmd].apply(redis, arguments);
    } else {
      this.serve_error(500, "Unknow redis command \"{0}\"".fmt(cmd));
    }
  };
  server.TRANSACTION.rmulti = function() { return redis.multi(); };
  server.TRANSACTION.mexec = function(multi, f) {
    multi.exec(function(err, results) {
        if (err) {
          this.serve_error(500, "Redis error: " + err);
        } else {
          f.call(this, results);
        }
      });
  };
  redis.on("error", function(err) {
      util.log("Redis error:", err);
      process.exit(1);
    });
  redis.on("ready", function() {
      util.log("redis ready ({0})".fmt(redis.port));
      server.run(IP, PORT);
    });
} else {
  server.run(IP, PORT);
}
