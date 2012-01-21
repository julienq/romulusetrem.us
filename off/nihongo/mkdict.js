var expat = require("node-expat");
var fs = require("fs");
var flexo = require("../../flexo.js");
var util = require("util");
var redis_ = require("redis");

var DICT = "dicts/JMdict_e";
var PORT = 8911;
var DB = 1;

var WORDS = [];
var WORD_KEYS = {};

var redis = redis_.createClient(PORT);
redis.on("error", function(err) {
    util.log("Redis error:", err);
    process.exit(1);
  });
redis.on("ready", function() {
    util.log("Redis ready ({0})".fmt(redis.port));
    redis.multi().SELECT(DB).FLUSHDB().exec(function(err) {
        if (err) {
          util.log("Redis error:", err);
          process.exit(1);
        } else {
          util.log("Reading {0}".fmt(DICT));
          fs.readFile(DICT, "UTF-8", function(err, data) { mkdict(data); });
        }
      });
  });

function mkdict(data)
{
  var parser = new expat.Parser("UTF-8");
  var seq;
  var text;
  var m;
  var sense;
  var n = 0;
  parser.addListener("startElement", function(name, attrs) {
      text = "";
      if (name === "entry") {
        m = redis.multi();
      }
    });
  parser.addListener("endElement", function(name) {
      if (name === "ent_seq") {
        seq = flexo.normalize(text);
        sense = 0;
      } else if (name === "keb") {
        var k = flexo.normalize(text);
        m.RPUSH("kanji:" + seq, k);
        m.RPUSH("key:" + k, seq);
      } else if (name === "reb") {
        var r = flexo.normalize(text);
        m.RPUSH("reading:" + seq, r);
        m.RPUSH("key:" + r, seq);
      } else if (name === "pos") {
        m.RPUSH("pos:{0}:{1}".fmt(seq, sense), flexo.normalize(text));
      } else if (name === "gloss") {
        m.RPUSH("gloss:{0}:{1}".fmt(seq, sense), flexo.normalize(text));
      } else if (name === "sense") {
        ++sense;
      } else if (name === "entry") {
        parser.pause();
        m.SET("senses:{0}".fmt(seq), sense + 1);
        m.exec(function() {
            if ((++n % 10000) === 0) util.log(seq);
            parser.resume();
          });
        m = null;
      } else if (name === "JMdict") {
        util.log("... done parsing.");
        redis.quit();
      }
    });
  parser.addListener("text", function(t) { text += t; });
  util.log("Start parsing...");
  parser.parse(data);
}
