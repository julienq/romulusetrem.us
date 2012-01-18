var fs = require("fs");
var http = require("http");
var path = require("path");
var url = require("url");
var util = require("util");

// Simple format function for messages and templates. Use {0}, {1}...
// as slots for parameters. Missing parameters are replaced with the empty
// string. (Avoid a dependency on flexo)
String.prototype.fmt = function()
{
  var args = [].slice.call(arguments);
  return this.replace(/{(\d+)}/g, function(_, p) {
      return args[p] === undefined ? "" : args[p];
    });
};


// These can be overridden

// Default document root; should be set by the server
exports.DOCUMENTS = path.join(process.cwd(), "documents");

// Default server name
exports.SERVER_NAME = "SPQR";

// Patterns for dispatch. A pattern has three parts:
//   * the method to match (e.g. "GET", "POST", etc.)
//   * the pathname to match as a regex
//   * the callback function for a succesfull match f(req, response, match)
exports.PATTERNS = [];

// Known MIME types
exports.TYPES = {
  css: "text/css",
  es: "application/ecmascript",
  html: "text/html",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  m4v: "video/mp4",
  manifest: "text/cache-manifest",
  mp3: "audio/mpeg",
  ogg: "audo/ogg",
  png: "image/png",
  pdf: "application/pdf",
  svg: "image/svg+xml",
  ttf: "application/octet-stream",
  xml: "application/xml",
  xhtml: "application/xhtml+xml",
  xslt: "application/xslt+xml",
};

// Known error codes
exports.ERROR_CODES = {
  // 4xx Client error
  400: "Bad Request", 401: "Unauthorized", 402: "Payment Required",
  403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
  406: "Not Acceptable", 407: "Proxy Authentication Required",
  408: "Request Timeout", 409: "Conflict", 410: "Gone", 411: "Length Required",
  412: "Precondition Failed", 413: "Request Entity Too Large",
  414: "Request-URI Too Long", 415: "Unsupported Media Type",
  416: "Request Range Not Satisfiable", 417: "Expectation Failed",
  // 5xx Server error
  500: "Internal Server Error", 501: "Not Implemented", 502: "Bad Gateway",
  503: "Service Unavailable", 504: "Gateway Timeout",
  505: "HTTP Version Not Supported"
};


// Logging stuff

// OK message
exports.ok = function()
{
  process.stdout.write("\033[0;42m\033[1;33mOK\033[0m\t");
  console.log.apply(console, arguments);
};

// Warning message
exports.warn = function()
{
  process.stdout.write("\033[0;43m\033[1;31mWARNING\033[0m\t");
  console.log.apply(console, arguments);
};

// Error message
exports.error = function()
{
  process.stdout.write("\033[0;41m\033[1;33mERROR\033[0m\t");
  console.log.apply(console, arguments);
};

// Debug message with a custom prefix
exports.debug = function(what)
{
  process.stdout.write("\033[0;44m\033[1;37m{0}\033[0m\t"
      .fmt(what.toUpperCase()));
  console.log.apply(console, [].slice.call(arguments, 1));
};


// Run the server on the given port/ip, using the patterns list for dispatch
// (default is simply to serve a file in the DOCUMENTS directory with the given
// pathname)
exports.run = function(ip, port)
{
  http.createServer(function(req, response) {
      var uri = url.parse(req.url);
      var pathname = uri.pathname;
      var method = req.method.toUpperCase();
      var m;
      for (var i = 0, n = exports.PATTERNS.length; i < n; ++i) {
        if (method === exports.PATTERNS[i][0].toUpperCase() &&
          (m = pathname.match(exports.PATTERNS[i][1]))) {
          exports.ok("dispatch: matched", exports.PATTERNS[i].slice(0, 2));
          exports.PATTERNS[i][2].call(exports, req, response, m);
          return;
        }
      }
      exports.serve_file(req, response, pathname);
    }).listen(port, ip, function() {
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

// Return an error as text with a code and an optional message
// TODO provide a function to customize error pages
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
// TODO optionally allow directory listing
// TODO alternatives for index page
exports.serve_file = function(req, response, uri, index)
{
  var path_ = path.join(exports.DOCUMENTS, uri);
  if (!check_path(path_, exports.DOCUMENTS)) {
    exports.serve_error(req, response, 403);
  }
  exports.ok("serve_file({0})".fmt(path_));
  path.exists(path_, function(exists) {
      if (!exists) {
        if (index) {
          return exports.serve_error(req, response, 403);
        } else {
          return exports.serve_error(req, response, 404);
        }
      }
      fs.stat(path_, function(error, stats) {
          if (error) {
            exports.error("serve_file:", error.toString());
            return exports.serve_error(req, response, 500);
          }
          if (stats.isFile()) {
            serve_file(req, response, path_, stats, index ? uri : undefined);
          } else if (stats.isDirectory() && /\/$/.test(path_)) {
            exports.serve_file(req, response, path.join(uri, "index.html"),
                true);
          } else {
            exports.serve_error(req, response, 403);
          }
        });
    });
};

// Serve file from a known pathname
exports.serve_file_from_path = function(req, response, path_)
{
  fs.stat(path_, function(error, stats) {
      if (error) {
        exports.error("serve_file_from_path:", error.toString());
        exports.serve_error(req, response, 500);
      } else if (!stats.isFile()) {
        exports.error("serve_file_from_path: Expected a file at", path_);
        exports.serve_error(req, response, 500);
      } else {
        serve_file(req, response, path_, stats);
      }
    });
};

// Found a URL
exports.found = function(req, response, uri)
{
  exports.serve_data(req, response, 302, "text/plain", "Found",
      { Location: uri });
};

// Serve a string as an HTML document
exports.serve_html = function(req, response, html)
{
  exports.serve_data(req, response,  200, exports.TYPES.html, html);
};

// Return a js value encoded as JSON.
// Set the raw flag to prevent the data to be reencoded.
exports.serve_json = function(req, response, result, raw)
{
  var data = raw ? result : JSON.stringify(result);
  exports.serve_data(req, response, 200, exports.TYPES.json, data);
};

// Serve plain text
exports.serve_text = function(req, response, text)
{
  exports.serve_data(req, response, 200, "text/plain", text);
};


// HTML creation

// HTML doctype
exports.html_doctype = function() { return "<!DOCTYPE html>\n" };


// Shortcut for HTML elements: the element name prefixed by a $ sign
// See http://dev.w3.org/html5/spec/Overview.html#elements-1
["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base",
  "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption",
  "cit", "code", "col", "colgroup", "command", "datalist", "dd", "del",
  "details", "dfn", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption",
  "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head",
  "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins",
  "kbd", "keygen", "label", "legend", "li", "link", "map", "mark", "menu",
  "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option",
  "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "s",
  "samp", "script", "section", "select", "small", "source", "span", "strong",
  "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea",
  "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var",
  "video", "wbr"].forEach(function(tag) {
    this["$" + tag] = html_tag.bind(this, tag);
  });


// Utility functions used internally

// Check that path p is rooted at root
function check_path(path_, root)
{
  root = path.normalize(root);
  var abs = path.normalize(path_);
  var ok = abs.substr(0, root.length) === root;
  if (!ok) exports.warn("check_path: {0} is out of bounds".fmt(abs));
  return ok;
}

// Make a (text) HTML tag; the first argument is the tag name. Following
// arguments are the contents (as text; must be properly escaped.) If the last
// argument is a boolean, it is treated as a flag to *not* close the element
// when true (i.e. for elements that are incomplete or HTML elements that do not
// need to be closed)
// TODO handle encoding (at least of attribute values)
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

// Serve a file from its actual path after we checked that it is indeed a file.
// Pass the stats result along to fill out the headers, and the URI if it was a
// directory request to set the Content-Location header
function serve_file(req, response, path_, stats, uri)
{
  var type = exports.TYPES[path.extname(path_).substr(1).toLowerCase()] || "";
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
    util.pump(fs.createReadStream(path_), response);
  }
}

// Write the correct headers (plus the ones already given, if any)
// TODO don't replace headers that have already been set
function write_head(req, response, code, type, data, params)
{
  if (typeof params !== "object") params = {};
  if (!params.hasOwnProperty("Content-Length")) {
    params["Content-Length"] = data ? Buffer.byteLength(data.toString()) : 0;
  }
  if (type && !params.hasOwnProperty("Content-Type")) {
    if (!(/\bcharset=/.test(type)) &&
        (/^(audio|image|video)\//.test(type) ||
         type === "application/octet-stream")) {
      type += "; charset=utf-8";
    }
    params["Content-Type"] = type;
  }
  params.Date = (new Date()).toUTCString();  // works in V8; should be stricter
  params.Server = exports.SERVER_NAME;
  response.writeHead(code, params);
}
