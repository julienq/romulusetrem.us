// Users module for SPQR
// TODO improve security!
var flexo = require("../flexo.js");


// Add a new user
function add_user(transaction, username, password)
{
  transaction.redis("SISMEMBER", "users", username, function(ismember) {
      if (ismember != 0) {
        transaction.serve_data(409, "text/plain",
          "A user with name \"{0}\" already exists".fmt(username));
      } else {
        flexo.sys_uuid(function(uuid) {
            var user = "users:" + username;
            transaction.rmulti()
              .SADD("users", username)
              .HSET(user, "username", username)
              .HSET(user, "password", password)
              .HSET(user, "auth", uuid)
              .exec(function() { transaction.serve_data(204); });
          });
      }
    });
}

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
