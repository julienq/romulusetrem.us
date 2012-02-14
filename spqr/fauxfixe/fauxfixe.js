exports.PATTERNS =
[

  // Get an image
  ["GET", /^\/animatic\/images\/(.+)$/, function(transaction, img) {
      transaction.serve_file_from_path(req, response, path.join("images", img));
    }],

  ["POST", /^\/animatic\/save\/(.+)$/, save],

];

function save(transaction, filename)
{
  var out = fs.createWriteStream(path.join("images", filename));
  req.on("data", function(chunk) { out.write(chunk); });
  req.on("end", function() {
      out.end();
      transaction.serve_json({ OK: filename });
    });
}
