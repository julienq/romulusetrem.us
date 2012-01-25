var flexo = require("../../flexo.js");
var util = require("util");
var readline = require("readline");
var redis_ = require("redis");

var PORT = 8911;
var DB = 1;

var rli = readline.createInterface(process.stdin, process.stdout);
rli.on("close", function() {
    process.stdout.write("\n");
    process.exit(0);
  });

function prompt(f)
{
  rli.setPrompt("# ");
  rli.once("line", function(line) { f(line); });
  rli.prompt();
}

var redis = redis_.createClient(PORT);
redis.on("error", function(err) {
    util.log("Redis error:", err);
    process.exit(1);
  });
redis.on("ready", function() {
    util.log("Redis ready ({0})".fmt(redis.port));
    redis.SELECT(DB, function(err) {
        if (err) {
          util.log("Redis error:", err);
          process.exit(1);
        } else {
          prompt(search);
        }
      });
  });

var RANGE = 50;
var MAX = 20;

function search(input)
{
  var query = flexo.normalize(input);
  redis.LRANGE("key:" + query, 0, -1, function(err, results) {
      if (results.length === 0) {
        complete(query);
      } else {
        var m = redis.multi();
        results.forEach(function(seq) { m.GET("entry:" + seq); });
        m.exec(function(err_, results_) {
            results_.forEach(function(json, i) {
                var entry = JSON.parse(json);
                console.log("{0}.".fmt(i + 1) +
                  entry.kanji.map(function(k) {
                      return (k.length === 1 ? " ({0})" : " {0}").fmt(k[0]);
                    }).join("") +
                  entry.reading.map(function(r) {
                      return (r.length === 1 ? " ({0})" : " {0}").fmt(r[0]);
                    }).join(""));
              });
            complete(query);
          });
      }
    });
}

function complete(prefix)
{
  redis.ZRANK("prefixes", prefix, function(err, rank) {
      if (typeof rank !== "number") {
        prompt(search);
      } else {
        var results = [];
        (function get_names(from)
        {
          redis.ZRANGE("prefixes", from, from + RANGE - 1,
            function(err, names) {
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
                console.log(results.join("\n"));
                prompt(search);
              }
            });
        })(rank);
      }
    });
}
