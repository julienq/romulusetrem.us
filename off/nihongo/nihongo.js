var DB = 1;

exports.PATTERNS =
[
  ["GET", /^\/nihongo\/key\/(.*)$/, function(transaction, key) {
      transaction.mexec(transaction.rmulti()
        .SELECT(DB)
        .LRANGE("key:" + decodeURIComponent(key), 0, -1),
        function(results) {
          var m = transaction.rmulti();
          results[1].forEach(function(seq) {
              m.LRANGE("kanji:" + seq, 0, -1)
              m.LRANGE("reading:" + seq, 0, -1)
              m.GET("senses:" + seq)
            });
          transaction.mexec(m, function(results_) {
              var i = 0;
              var entries = [];
              (function f() {
                if (i < results_.length) {
                  var seq = results[1][i / 3];
                  var entry = { kanji: results_[i], reading: results_[i + 1],
                    senses: [] };
                  var senses = parseInt(results_[i + 2], 10);
                  i += 3;
                  var m_ = transaction.rmulti();
                  for (var j = 0; j < senses; ++j) {
                    m_.LRANGE("pos:{0}:{1}".fmt(seq, j), 0, -1)
                      .LRANGE("gloss:{0}:{1}".fmt(seq, j), 0, -1);
                  }
                  transaction.mexec(m_, function(results__) {
                      for (var k = 0, n = results.length; k < n; k += 2) {
                        entry.senses.push({ pos: results__[k],
                          gloss: results__[k + 1] });
                      }
                      entries.push(entry);
                      f();
                    });
                } else {
                  transaction.serve_json(entries);
                }
              })();
            });
        });
    }],
]
