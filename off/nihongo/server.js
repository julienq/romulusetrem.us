var expat = require("node-expat");
var fs = require("fs");
var server = require("../spqr.js");
var flexo = require("../../flexo.js");

var PORT = 8910;
var IP = "";
var HELP = false;
var DICT = "JMdict_e";

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
      }
    });
}

// Show help info and quit
function show_help(node, name)
{
  console.log("\nUsage: {0} {1} [options]\n\nOptions:".fmt(node, name));
  console.log("  help:                  show this help message");
  console.log("  ip=<ip address>:       IP address to listen to");
  console.log("  port=<port number>:    port number for the server");
  console.log("  documents=<apps dir>:  path to the documents directory");
  console.log("  dict=<dictionary file: path to the dictionary file");
  console.log("");
  process.exit(0);
}

parse_args(process.argv.slice(2));
if (HELP) show_help.apply(null, process.argv);

var ENTRIES = [];
var KEYS = {};

// Open the dictionary file first
// TODO replace this with a DB?
fs.readFile(DICT, "UTF8", function(err, data) {
    if (err) throw "Could not read dictionary file at {0}: {1}".fmt(DICT, err);
    var parser = new expat.Parser("UTF-8");
    var entry;
    var text;
    var add_key = function()
    {
      if (!KEYS.hasOwnProperty(text)) KEYS[text] = [];
      KEYS[text].push(entry);
    };
    parser.addListener("startElement", function(name, attrs) {
        text = "";
        if (name === "entry") {
          entry = { kanji: [], reading: [] };
        } else if (name === "k_ele") {
          entry.kanji.push(["", ""]);
        } else if (name === "r_ele") {
          entry.reading.push(["", ""]);
        }
      });
    parser.addListener("endElement", function(name) {
        if (name === "keb") {
          entry.kanji[entry.kanji.length - 1][0] = text;
          add_key();
          // TODO _inf
        } else if (name === "reb") {
          entry.reading[entry.reading.length - 1][0] = text;
          add_key();
          // TODO _inf, _restr, _nokanji
        } else if (name === "ke_pri") {
          entry.kanji[entry.kanji.length - 1][1] = text;
        } else if (name === "re_pri") {
          entry.reading[entry.reading.length - 1][1] = text;
        } else if (name === "entry") {
          ENTRIES.push(entry);
        }
      });
    parser.addListener("text", function(t) { text += t; });
    parser.parse(data);
    start_server();
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
      ["GET", /^\/key\/(.*)$/, function(req, response, m) {
          var key = decodeURIComponent(m[1]);
          var r = KEYS.hasOwnProperty(key) ? KEYS[key] : [];
          console.log("get key \"{0}\" ({1})".fmt(key, r));
          server.serve_json(req, response, r);
        }],
    ]));
}
