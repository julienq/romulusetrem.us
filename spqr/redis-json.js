var util = require("util");

exports.PATTERNS =
[
  ["GET", /^\/redis\/(\d+)\/(\w+)$/, function(transaction, db, cmd) {
      util.log("redis: SELECT {0}, then {1}".fmt(db, cmd));
      transaction.redis("SELECT", parseInt(db, 10), function() {
          redis(transaction, cmd);
        });
    }],

  ["GET", /^\/redis\/(\w+)$/, redis],
];

function redis(transaction, cmd)
{
  var params = transaction.url.query.split("&").map(decodeURIComponent);
  params.unshift(cmd);
  util.log("redis:", params.join(" "));
  params.push(function(results) {
      this.serve_json(results);
    });
  transaction.redis.apply(transaction, params);
}
