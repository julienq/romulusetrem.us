var fs = require("fs");
var flexo = require("../../flexo.js");
var util = require("util");
var readline = require("readline");
var redis_ = require("redis");

var NAMES = "dicts/female-names.txt";
var PORT = 8911;


var rli = readline.createInterface(process.stdin, process.stdout);
rli.on("close", function() {
    process.stdout.write("\n");
    process.exit(0);
  });

function prompt(f)
{
  rli.setPrompt("complete # ");
  rli.once("line", function(line) { f(line); });
  rli.prompt();
}

var RANGE = 50;
var MAX = 20;

function complete(input)
{
  var prefix = flexo.normalize(input.toLowerCase());
  redis.ZRANK(":compl", prefix, function(err, rank) {
      if (typeof rank !== "number") {
        prompt(complete);
      } else {
        var results = [];
        (function get_names(from)
        {
          redis.ZRANGE(":compl", from, from + RANGE - 1, function(err, names) {
              var cont = !!names.length;
              for (var i = 0, n = names.length; cont && i < n; ++i) {
                if (names[i].substr(0, prefix.length) !== prefix) {
                  cont = false;
                } else if (names[i][names[i].length - 1] === "*") {
                  if (results.length === MAX) {
                    cont = false;
                    results.push("&c.");
                  } else {
                    results.push(names[i].substr(0, names[i].length - 1));
                  }
                }
              }
              if (cont) {
                get_names(from + names.length);
              } else {
                console.log(results.join(", ").wrap(72));
                prompt(complete);
              }
            });
        })(rank);
      }
    });
}

var redis = redis_.createClient(PORT);
redis.on("error", function(err) {
    util.log("Redis error:", err);
    process.exit(1);
  });
redis.on("ready", function() {
    util.log("Redis ready ({0})".fmt(redis.port));
    redis.DEL(":compl", function(err) {
        if (err) {
          util.log("Redis error:", err);
          process.exit(1);
        } else {
          util.log("Reading {0}".fmt(NAMES));
          fs.readFile(NAMES, "UTF-8", function(err, data) {
              data.split("\n").forEach(function(name) {
                  if (name.length === 0) return;
                  for (var i = 1, n = name.length; i <= n; ++i) {
                    redis.ZADD(":compl", 0, name.substr(0, i));
                  }
                  redis.ZADD(":compl", 0, name + "*");
                });
              prompt(complete);
            });
        }
      });
  });
