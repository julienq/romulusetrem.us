var expat = require("node-expat");
var fs = require("fs");
var flexo = require("../../flexo.js");
var util = require("util");
var redis_ = require("redis");

var DICT = "dicts/JMdict.xml";
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
  var entry;  // entry being read
  var text;   // current text
  var elem;   // current kanji/reading
  var sense;  // current sense
  var lang;   // lang of the current gloss element
  var m;
  var n = 0;
  parser.addListener("startElement", function(name, attrs) {
      text = "";
      if (name === "entry") {
        m = redis.multi();
        entry = { sense: [] };
      } else if (name === "k_ele" || name === "r_ele") {
        elem = [];
      } else if (name === "sense") {
        sense = {};
      } else if (name === "gloss") {
        lang = attrs["xml:lang"] || "eng";
      }
    });
  parser.addListener("endElement", function(name) {
      if (name === "ent_seq") {
        entry.seq = flexo.normalize(text);
      } else if (name === "keb" || name === "reb") {
        var e = flexo.normalize(text);
        elem.push(e);
        m.RPUSH("key:" + e, entry.seq);
      } else if (name === "ke_pri" || name === "re_pri") {
        var e = flexo.normalize(text);
        elem.push(e);
      } else if (name === "k_ele") {
        if (!entry.hasOwnProperty("kanji")) entry.kanji = [];
        entry.kanji.push(elem);
      } else if (name === "r_ele") {
        if (!entry.hasOwnProperty("reading")) entry.reading = [];
        entry.reading.push(elem);
      } else if (name === "pos") {
        if (!sense.hasOwnProperty(name)) sense[name] = [];
        sense[name].push(flexo.normalize(text));
      } else if (name === "gloss") {
        if (!sense.hasOwnProperty("gloss")) sense.gloss = {};
        if (!sense.gloss[lang]) sense.gloss[lang] = [];
        sense.gloss[lang].push(flexo.normalize(text));
        lang = "";
      } else if (name === "sense") {
        entry.sense.push(sense);
      } else if (name === "entry") {
        m.SET("entry:{0}".fmt(entry.seq), JSON.stringify(entry));
        parser.stop();
        m.exec(function() {
            if ((++n % 10000) === 0) util.log(JSON.stringify(entry));
            parser.resume();
          });
      } else if (name === "JMdict") {
        util.log("... done parsing.");
        redis.quit();
      }
    });
  parser.addListener("text", function(t) { text += t; });
  util.log("Start parsing...");
  parser.parse(data);
}
