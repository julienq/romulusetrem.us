var fs = require("fs");
var http = require("http");
var path = require("path");
var url = require("url");
var util = require("util");
var flexo = require("../flexo.js");


// Known MIME types; the rest is served as text/plain
var TYPES = {
  css: "text/css",
  es: "application/ecmascript",
  html: "text/html",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  m4v: "video/mp4",
  manifest: "text/cache-manifest",
  png: "image/png",
  pdf: "application/pdf",
  svg: "image/svg+xml",
  ttf: "application/octet-stream",
  xml: "application/xml",
  xhtml: "application/xhtml+xml",
  xslt: "application/xslt+xml",
};

exports.DOCUMENTS = path.join(process.cwd(), "documents");

// Default server name
exports.SERVER_NAME = "SPQR";


exports.ok = function()
{
  process.stdout.write("\033[0;42m\033[1;33mOK\033[0m\t");
  console.log.apply(console, arguments);
};

exports.warn = function()
{
  process.stdout.write("\033[0;43m\033[1;31mWARNING\033[0m\t");
  console.log.apply(console, arguments);
};

exports.error = function()
{
  process.stdout.write("\033[0;41m\033[1;33mERROR\033[0m\t");
  console.log.apply(console, arguments);
};

exports.debug = function(what)
{
  process.stdout.write("\033[0;44m\033[1;37m{0}\033[0m\t".fmt(what));
  console.log.apply(console, [].slice.call(arguments, 1));
};



// Make a dispatcher function from a list of patterns suitable for feeding to
// the run function
exports.make_dispatcher = function()
{
  var server = this;
  server.patterns = [].slice.call(arguments);
  return function(req, response)
  {
    var uri = url.parse(req.url);
    var pathname = uri.pathname;
    var method = req.method.toUpperCase();
    for (var i = 0, n = server.patterns.length; i < n; ++i) {
      var m;
      if (method === server.patterns[i][0] &&
          (m = pathname.match(server.patterns[i][1]))) {
        exports.ok("dispatch: matched", server.patterns[i]);
        server.patterns[i][2](req, response, m);
        return;
      }
    }
    server.serve_file(req, response, pathname);
  };
};

// Run the server on the given port/ip
exports.run = function(ip, port, f)
{
  http.createServer(f).listen(port, ip, function() {
      exports.ok("http://{0}:{1} ready".fmt(ip || "localhost", port));
    });
};

// Serve data by writing the correct headers (plus the ones already given, if
// any) and the data
exports.serve_data = function(req, response, code, type, data, params)
{
  write_head(req, response, code, type, data, params);
  if (req.method.toUpperCase() === "HEAD") {
    response.end();
  } else {
    response.end(data);
  }
};

// Write the correct headers (plus the ones already given, if any)
function write_head(req, response, code, type, data, params)
{
  if (typeof params !== "object") params = {};
  if (!params.hasOwnProperty("Content-Length")) {
    params["Content-Length"] = data ? Buffer.byteLength(data.toString()) : 0;
  }
  if (/^image\//.test(type) || !(/\bcharset=/.test(type))) {
    params["Content-Type"] =
      type + (/^(image|video)\//.test(type) ? "" : "; charset=utf-8");
  }
  params.Date = (new Date()).toUTCString();  // works in V8; should be stricter
  params.Server = exports.SERVER_NAME;
  response.writeHead(code, params);
}

exports.ERROR_CODES = [];
exports.ERROR_CODES[403] = "Forbidden";
exports.ERROR_CODES[404] = "Not Found";
exports.ERROR_CODES[500] = "Internal Server Error";

// Return an error as text with a code and a message
exports.serve_error = function(req, response, code, msg)
{
  if (!msg) msg = exports.ERROR_CODES[code];
  exports.warn("error {0}: {1}".fmt(code, msg));
  exports.serve_data(req, response, code, "text/plain",
      "{0} {1}\n".fmt(code, msg));
};

// Simply serve the requested file if found, otherwise return a 404/500 error
// or a 403 error if it's not a file. The index parameter is set to true when
// we're looking for the index page of a directory. No directory listing at the
// moment.
exports.serve_file = function(req, response, uri, index)
{
  var p = path.join(exports.DOCUMENTS, uri);
  if (!check_path(p, exports.DOCUMENTS)) {
    exports.serve_error(req, response, 403);
  }
  exports.ok("serve_file({0})".fmt(p));
  path.exists(p, function(exists) {
      if (!exists) {
        if (index) {
          return exports.serve_error(req, response, 403);
        } else {
          return exports.serve_error(req, response, 404);
        }
      }
      fs.stat(p, function(error, stats) {
          if (error) {
            exports.error("serve_file:", error.toString());
            return exports.serve_error(req, response, 500);
          }
          if (stats.isFile()) {
            serve_file(req, response, p, stats, index ? uri : undefined);
          } else if (stats.isDirectory() && /\/$/.test(p)) {
            exports.serve_file(req, response, path.join(uri, "index.html"),
                true);
          } else {
            exports.serve_error(req, response, 403);
          }
        });
    });
};

// Check that path p is rooted at root
function check_path(p, root)
{
  root = path.normalize(root);
  return path.normalize(p).substr(0, root.length) === root;
}

// Serve file from a known pathname
exports.serve_file_raw = function(req, response, p)
{
  fs.stat(p, function(error, stats) {
      if (error) {
        exports.error("serve_file_raw:", error.toString());
        exports.serve_error(req, response, 500);
      } else if (!stats.isFile()) {
        exports.error("serve_file_raw: Expected a file");
        exports.serve_error(req, response, 500);
      } else {
        serve_file(req, response, p, stats);
      }
    });
};

// Serve a file from its actual path after we checked that it is indeed a file.
// Pass the stats result along to fill out the headers, and the URI if it was a
// directory request to set the Content-Location header
function serve_file(req, response, p, stats, uri)
{
  var type = TYPES[path.extname(p).substr(1).toLowerCase()] || "text/plain";
  var params = { "Last-Modified": stats.mtime.toUTCString(),
    ETag: "\"{0}-{1}-{2}\"".fmt(stats.ino.toString(16),
      stats.size.toString(16),
      stats.mtime.valueOf().toString(16)),
    "Content-Length": stats.size };
  if (uri) params["Content-Location"] = uri;
  write_head(req, response, 200, type, null, params);
  if (req.method.toUpperCase() === "HEAD") {
    response.end();
  } else {
    var rs = fs.createReadStream(p);
    util.pump(rs, response);
  }
};

// Serve a string as an HTML document
exports.serve_html = function(req, response, html)
{
  exports.serve_data(req, response,  200, TYPES.html, html);
}

// Return a js value as JSON; set the raw flag to prevent the data to be
// reencoded
exports.serve_json = function(req, response, result, raw)
{
  var data = raw ? result : JSON.stringify(result);
  exports.serve_data(req, response, 200, TYPES.json, data);
};

// Serve plain text
exports.serve_text = function(req, response, text)
{
  exports.serve_data(req, response, 200, "text/plain", text);
};

// Found a URL
exports.found = function(req, response, uri)
{
  exports.serve_data(req, response, 302, "text/plain", "Found",
      { Location: uri });
};


// HTML doctype
exports.html_doctype = function() { return "<!DOCTYPE html>\n" }

// Make a (text) HTML tag; the first argument is the tag name. Following
// arguments are the contents (as text; must be properly escaped.) If the last
// argument is a boolean, it is treated as a flag to *not* close the element
// when true (i.e. for elements that are incomplete or HTML elements that do not
// need to be closed)
function html_tag(tag)
{
  var out = "<" + tag;
  var contents = [].slice.call(arguments, 1);
  if (typeof contents[0] === "object") {
    var attrs = contents.shift();
    for (a in attrs) {
      var v = attrs[a];
      out += (v === null ? " {0}" : " {0}=\"{1}\"").fmt(a, v);
    }
  }
  out += ">";
  var keep_open = typeof contents[contents.length - 1] === "boolean" ?
    contents.pop() : false;
  out += contents.join("");
  if (!keep_open) out += "</{0}>".fmt(tag);
  return out;
}

// Shortcut for HTML elements: the element name prefixed by a $ sign
["a", "blockquote", "body", "br", "button", "div", "form", "head", "h1", "h2",
  "h3", "h4", "h5", "h6", "html", "input", "label", "li", "link", "meta", "nav",
  "p", "script", "span", "table", "tbody", "td", "textarea", "th", "thead",
  "title", "tr", "ul"].forEach(function(tag) {
    this["$" + tag] = html_tag.bind(this, tag);
  });
