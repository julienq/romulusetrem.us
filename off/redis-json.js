exports.PATTERNS =
[
  ["GET", /^\/redis\/(\w+)$/, function(transaction, cmd) {
      var params = transaction.url.query.split("&").map(decodeURIComponent);
      params.unshift(cmd);
      params.push(function(results) {
          this.serve_json(results);
        });
      transaction.redis.apply(transaction, params);
    }],
];
