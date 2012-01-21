var DB = 1;

exports.PATTERNS =
[
  ["GET", /^\/nihongo\/key\/(.*)$/, function(transaction, key) {
      transaction.rmulti()
        .SELECT(DB)
        .LRANGE("key:" + decodeURIComponent(key), 0, -1)
        .exec(function(results) {
          var m = transaction.rmulti();
          results[1].forEach(function(seq) {
              m.LRANGE("kanji:" + seq, 0, -1)
              m.LRANGE("reading:" + seq, 0, -1)
              m.GET("senses:" + seq)
            });
          m.exec(function(results_) {
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
                  m_.exec(function(results__) {
                      for (var k = 0, n = results.length; k < n; k += 2) {
                        entry.senses.push({ pos: results__[k],
                          gloss: results__[k + 1] });
                      }
                      entries.push(entry);
                      f();
                    });
                } else {
                  transaction.serve_text(entries_list(entries));
                }
              })();
            });
        });
    }],
]

function entries_list(entries)
{
  return $ol({ "class": "word" },
    entries.map(function(entry) {
        return $li(
          $ul({ "class": "reading", lang: "ja" },
            entry.kanji.map(function(k) {
                return $li(k.split("").map(function(c) {
                    return $a({ href: "?key=" + c }, c);
                  }).join(""))
              }).join(""),
            entry.reading.map(function(r) {
                return $li($a({ href: "?key=" + r }, r));
              }).join(""),
            $ol(
              entry.senses.map(function(sense) {
                  return $li(
                    sense.pos.map(function(pos) {
                        return $span({ "class": "pos" }, pos);
                      }).join(""),
                    sense.gloss.join(", "));
                }).join(""))));
      }).join(""));
}
