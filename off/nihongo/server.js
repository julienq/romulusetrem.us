var expat = require("node-expat");
var fs = require("fs");
var server = require("../spqr.js");
var flexo = require("../../flexo.js");

var PORT = 8910;
var IP = "";
var HELP = false;
var DICT = "JMdict_e";
var KANJI_F = "kanjidic2.xml";

// Parse arguments from the command line
function parse_args(args)
{
  var m;
  args.forEach(function(arg) {
      if (m = arg.match(/^port=(\d+)/)) {
        PORT = m[1];
      } else if (m = arg.match(/^ip=(\S*)/)) {
        IP = m[1];
      } else if (arg.match(/^h(elp)?$/i)) {
        HELP = true;
      } else if (m = arg.match(/^documents=(\S+)/)) {
        server.DOCUMENTS = m[1];
      } else if (m = arg.match(/^dict=(\S+)/)) {
        DICT = m[1];
      } else if (m = arg.match(/^kanji=(\S+)/)) {
        KANJI_F = m[1];
      }
    });
}

// Show help info and quit
function show_help(node, name)
{
  console.log("\nUsage: {0} {1} [options]\n\nOptions:".fmt(node, name));
  console.log("  help:                   show this help message");
  console.log("  ip=<ip address>:        IP address to listen to");
  console.log("  port=<port number>:     port number for the server");
  console.log("  documents=<apps dir>:   path to the documents directory");
  console.log("  dict=<dictionary file>: path to the dictionary file");
  console.log("  kanji=<kanji file>:     path to the kanji dictionary file");
  console.log("");
  process.exit(0);
}

parse_args(process.argv.slice(2));
if (HELP) show_help.apply(null, process.argv);

var WORDS = [];
var WORD_KEYS = {};

var KANJI = [];
var KANJI_KEYS = {};


// Open the dictionary file first
// TODO replace this with a DB?
server.debug("start", "Reading dictionary file...");
fs.readFile(DICT, "UTF-8", function(err, data) {
    if (err) throw "Could not read dictionary file at {0}: {1}".fmt(DICT, err);
    var parser = new expat.Parser("UTF-8");
    var word;
    var text;
    var add_word_key = function()
    {
      if (!WORD_KEYS.hasOwnProperty(text)) WORD_KEYS[text] = [];
      WORD_KEYS[text].push(word);
    };
    parser.addListener("startElement", function(name, attrs) {
        text = "";
        if (name === "entry") {
          word = { kanji: [], reading: [], sense: [] };
        } else if (name === "k_ele") {
          word.kanji.push(["", ""]);
        } else if (name === "r_ele") {
          word.reading.push(["", ""]);
        } else if (name === "sense") {
          word.sense.push({ pos: [], gloss: [] });
        }
      });
    parser.addListener("endElement", function(name) {
        if (name === "ent_seq") {
          word.seq = parseInt(text, 10);
        } else if (name === "keb") {
          word.kanji[word.kanji.length - 1][0] = text;
          add_word_key();
          // TODO _inf
        } else if (name === "reb") {
          word.reading[word.reading.length - 1][0] = text;
          add_word_key();
          // TODO _inf, _restr, _nokanji
        } else if (name === "ke_pri") {
          word.kanji[word.kanji.length - 1][1] = text;
        } else if (name === "re_pri") {
          word.reading[word.reading.length - 1][1] = text;
        } else if (name === "pos") {
          word.sense[word.sense.length - 1].pos.push(text);
        } else if (name === "gloss") {
          word.sense[word.sense.length - 1].gloss.push(text);
        } else if (name === "entry") {
          WORDS.push(word);
        }
      });
    parser.addListener("text", function(t) { text += t; });
    parser.parse(data);
    server.debug("start", "Reading kanji file...");
    fs.readFile(KANJI_F, "UTF-8", function(err, data) {
        if (err) {
          throw "Could not read kanji dictionary file at {0}: {1}"
            .fmt(KANJI_F, err);
        }
        var parser = new expat.Parser("UTF-8");
        var kanji;
        var add_kanji_key = function()
        {
          if (!KANJI_KEYS.hasOwnProperty(text)) KANJI_KEYS[text] = [];
          KANJI_KEYS[text].push(kanji);
        };
        parser.addListener("startElement", function(name, attrs) {
            if (name === "character") {
              kanji = {};
              text = "";
            }
          });
        parser.addListener("endElement", function(name) {
            if (name === "literal") {
              kanji.literal = text;
              add_kanji_key();
            } else if (name === "grade") {
              kanji.grade = parseInt(text, 10);
            } else if (name === "freq") {
              kanji.freq = parseInt(text, 10);
            } else if (name === "jlpt") {
              kanji.jlpt = parseInt(text, 10);
            } else if (name === "character") {
              KANJI.push(kanji);
            }
          });
        parser.addListener("text", function(t) { text += t; });
        parser.parse(data);
        start_server();
      });
  });

function start_server()
{
  server.run(IP, PORT, server.make_dispatcher([
      ["GET", /^\/favicon\.ico$/, function(req, response) {
          server.serve_error(req, response, 404, "Not found");
        }],
      ["GET", /^\/flexo.js$/, function(req, response) {
          server.serve_file_raw(req, response, "../../flexo.js");
        }],
      ["GET", /^\/word\/(.*)$/, function(req, response, m) {
          var key = decodeURIComponent(m[1]);
          var r = WORD_KEYS.hasOwnProperty(key) ? WORD_KEYS[key] : [];
          server.debug("info", "get word key=\"{0}\" ({1})".fmt(key, r));
          server.serve_json(req, response, r);
        }],
      ["GET", /^\/kanji\/(.*)$/, function(req, response, m) {
          var key = decodeURIComponent(m[1]);
          var r = KANJI_KEYS.hasOwnProperty(key) ? KANJI_KEYS[key] : [];
          console.debug("info", "get kanji key=\"{0}\" ({1})".fmt(key, r));
          server.serve_json(req, response, r);
        }],
    ]));
}
