var DB = 1;

exports.PATTERNS =
[
  ["GET", /^\/nihongo\/key\/(.*)$/, function(transaction, key) {
      transaction.redis.multi()
        .SELECT(DB)
        .LRANGE("key:" + decodeURIComponent(key), 0, -1)
        .exec(transaction.rwrap(function(results) {
            var m = transaction.redis.multi();
            results[1].forEach(function(seq) { m.GET("entry:" + seq); });
            m.exec(transaction.rwrap(function(results_) {
                transaction.serve_data(200, "text/plain",
                  entries_list(results_.map(JSON.parse)));
              }));
          }));
    }]
]

var LANG = { eng: "en", fre: "fr", ger: "de", rus: "ru" };

function entries_list(entries)
{
  return $ol({ "class": "word" },
    entries.map(function(entry) {
        return $li(
          $ul({ "class": "reading", lang: "ja" },
            entry.kanji.map(function(k) {
                return $li($span({ "class": k[1] ? "primary" : false }, k[0]));
              }).join(""),
            entry.reading.map(function(r) {
                return $li($span({ "class": r[1] ? "primary" : false }, r[0]));
              }).join("")),
          $ol(
            entry.sense.map(function(sense) {
                return $li(sense.hasOwnProperty("pos") ?
                  $span({ "class": "pos" }, sense.pos.join(", ")) : "",
                  Object.keys(sense.gloss).map(function(lang) {
                      var glosses = sense.gloss[lang];
                      return glosses.map(function(gloss) {
                          return $span({ lang: LANG[lang] }, gloss)
                        }).join("; ");
                    }).join("; "));
              }).join("")));
    }));
}
