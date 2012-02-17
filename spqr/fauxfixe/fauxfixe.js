var fs = require("fs");
var path = require("path");

var IMAGES = path.join(__dirname, "images");

exports.PATTERNS =
[
  [/^\/fauxfixe\/$/, { GET: index }],

  // TODO playback page: /fauxfixe/play/{id}

  [/^\/fauxfixe\/images\/(.+)$/, {
      GET: function(tr, img) {
        tr.serve_file_from_path(path.join(IMAGES, img));
      },
      POST: save
    }],
];

function index(tr)
{
  tr.serve_html(html_page({ lang: "en", title: "Draw!" },
      $$stylesheet("fauxfixe.css") + $$script("/flexo.js") + $$script("draw.js"),
      $div({ id: "canvas" }) + $div({ id: "thumbnails" }) + $$script("ui.js")));
}


function save(tr, filename)
{
  var out = fs.createWriteStream(path.join(IMAGES, filename));
  tr.request.on("data", function(chunk) { out.write(chunk); });
  tr.request.on("end", function() { out.end(); tr.serve_data(204); });
  tr.request.on("error", function(e) { tr.serve_error(500, e); });
}
