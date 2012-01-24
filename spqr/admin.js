var users = require("./users.js");
var formidable = require("formidable");

exports.PATTERNS =
[
  ["GET", /^\/admin\/users$/, function(transaction) {
      transaction.serve_html(users_page());
    }],

  ["GET", /^\/admin\/users\/list$/, users.list],

  ["POST", /^\/admin\/user\/add$/, function(transaction) {
      var data = "";
      transaction.request.on("data", function(chunk) {
          data += chunk.toString();
        });
      transaction.request.on("end", function() {
          users.add(transaction, JSON.parse(data));
        });
    }],
]

function html_head()
{
  return $html(
      $head(
        $title("Admin page"),
        $link({ rel: "stylesheet", href: "/admin/admin.css" }, true),
        $script({ src: "/flexo.js" })),
      $body(true), true);
}

function html_foot()
{
  return "</body></html>";
}

function users_page()
{
  return html_head() +
    $h1("Users") +
    $div({ id: "users" }) +
    $h2("Add user") +
    $form({ onsubmit: "_add_user(event);" },
      $fieldset(
        $label({ for: "username" }, "Username: "),
        $input({ type: "text", autofocus: true, name: "username" }),
        $br(true),
        $label({ for: "password" }, "Password: "),
        $input({ type: "text", name: "password" }),
        $br(true),
        $label({ for: "email" }, "Email: "),
        $input({ type: "email", name: "email" }),
        $br(true),
        $input({ type: "submit", value: "submit" }))) +
    $script(_refresh_users.toString()) +
    $script(_add_user.toString()) +
    $script("_refresh_users();");
    html_foot();
}

function _refresh_users()
{
  var div = document.getElementById("users");
  flexo.request_uri("users/list", function(req) {
      div.innerHTML = req.responseText;
    });
}

function _add_user(e)
{
  e.preventDefault();
  var form = e.currentTarget;
  var req = new XMLHttpRequest();
  req.open("POST", "user/add");
  req.onload = function() {
    form.reset();
    flexo.safe_remove(document.querySelector(".message"));
    if (req.responseText) {
      form.parentNode.insertBefore(flexo.html("p", { "class": "message" },
            "{0}: {1}".fmt(req.status, req.responseText)), form);
    } else {
      _refresh_users();
    }
  };
  var info = {};
  ["username", "password", "email"].forEach(function(key) {
      info[key] = form[key].value;
    });
  req.send(JSON.stringify(info));
}
