var fs = require("fs");
var path = require("path");
var util = require("util");
var server = require("./server.js");
var flexo = require("./flexo.js");

var PORT = 8910;
var IP = "";
var HELP = false;
var IMAGES = path.join(process.cwd(), "images");

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
      } else if (m = arg.match(/^images=(\S+)/)) {
        server.IMAGES = m[1];
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
  console.log("  documents=<apps dir>: path to the documents directory");
  console.log("  images=<images dir>:  path to the images directory");
  console.log("");
  process.exit(0);
}

parse_args(process.argv.slice(2));
if (HELP) show_help.apply(null, process.argv);
server.run(IP, PORT, server.make_dispatcher([
    ["GET", /^\/favicon\.ico$/, function(req, response) {
        server.serve_error(req, response, 404, "Not found");
      }],
    ["GET", /^\/flexo.js$/, function(req, response) {
        server.serve_file_raw(req, response, "flexo.js");
      }],
    ["GET", /^\/images\/(.+)$/, function(req, response, m) {
        server.serve_file_raw(req, response, path.join(IMAGES, m[1]));
      }],
    ["GET", /^\/id\/?$/, function(req, response) {
        get_id(req, response);
      }],
    ["POST", /^\/save\/(.+)$/, function(req, response, m) {
        save(req, response, m[1]);
      }],
  ]));

function get_id(req, response)
{
  (function get_id_() {
    var id = flexo.random_id(6);
    path.exists(path.join(IMAGES, id + ".svg"), function(exists) {
        if (exists) {
          get_id_();
        } else {
          server.serve_json(req, response, { id: id });
        }
      });
  })();
}

function save(req, response, filename)
{
  var out = fs.createWriteStream(path.join(IMAGES, filename));
  req.on("data", function(chunk) { out.write(chunk); });
  req.on("end", function() {
      out.end();
      server.serve_json(req, response, { OK: filename });
    });
}
