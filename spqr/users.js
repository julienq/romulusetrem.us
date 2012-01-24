// Users module for SPQR
// TODO improve security!
var flexo = require("../flexo.js");

// TODO limit number of users?
exports.list = function(transaction)
{
  transaction.redis.ZRANGE("users", 0, -1, transaction.rwrap(function(names) {
      var m = transaction.redis.multi();
      names.forEach(function(name) { m.HGETALL("users:" + name); });
      m.exec(transaction.rwrap(function(users) {
          var table = $table({ "class": "users" },
            $thead(
              $tr(
                $th("username"),
                $th("password"),
                $th("email"),
                $th("auth"),
                $th("action"))),
            $tbody(users.map(function(user) {
                return $tr(
                  $td(user.username),
                  $td(user.password),
                  $td(user.email),
                  $td(user.auth),
                  $td("(delete)"));
              }).join("")));
            transaction.serve_html(table);
        }));
    }));
};

// Add a user
exports.add = function(transaction, info)
{
  transaction.redis.ZSCORE("users", info.username,
    transaction.rwrap(function(score) {
      if (score) {
        transaction.serve_data(409, "text/plain",
          "User name \"{0}\" already exists".fmt(info.username));
      } else {
        flexo.sys_uuid(function(uuid) {
            var user = "users:" + info.username;
            transaction.redis.multi()
              .ZADD("users", (new Date).valueOf(), info.username)
              .HSET(user, "username", info.username)
              .HSET(user, "password", info.password)
              .HSET(user, "email", info.email)
              .HSET(user, "auth", uuid)
              .exec(transaction
                .rwrap(function(results) {
                    if (results[0] != 1) {
                      transaction.serve_error(500, results[0]);
                    } else {
                      transaction.serve_data(204);
                    }
                  }));
          });
      }
    }));
};

/*

// Delete a user and reply with 204 No Content
exports.delete_user = function(transaction, username, f)
{
  transaction.redis("SISMEMBER", "users", username, function(ismember) {
      if (ismember == 0) {
        transaction.serve_error(404,
          "delete_user: No user named \"{0}\"".fmt(username));
      } else {
        transaction.rmulti()
          .SREM("users", username)
          .DEL("users:" + username);
          .exec(function() { transaction.serve_data(204); });
      }
    });
}
*/
