// Containers and categories (e.g. suitcase: container, underwear: category)
// Cf http://emshort.wordpress.com/2007/06/11/inform-7-for-the-fiction-author/
// Cf http://en.wikibooks.org/wiki/Beginner%27s_Guide_to_Interactive_Fiction_with_Inform_7/Getting_Started_with_Inform_7
// Cf http://www.ifwiki.org/index.php/Inform_7_for_Programmers

// Output a message
(function()
{
  var messages = document.getElementById("messages");
  window.message = function(msg, class_)
  {
    var li = flexo.ez_html("li", class_ ? { "class": class_ } : {}, msg);
    messages.appendChild(li);
    return li;
  };
})();

// Autocomplete stuff

var verbs = {
  drop: function(what, where) { message("You cannot drop that."); },
  eat: function(what) { message("You cannot eat that."); },
  examine: function(what) { message("You cannot see such a thing."); },
  go: function(where) { message("You cannot go there."); },
  "go to": function(place) { message("There is no such place."); },
  look: function() { message("You cannot see such a thing."); },
  "look at": function(what) { message("You cannot see such a thing."); },
  say: function(what) { message("There is nobody to talk to."); },
  take: function(what) { message("There is nothing to take."); },
};

var DIRECTIONS = ["north", "south", "east", "west", "back", "up", "down"];

(function()
{
  var prompt = document.getElementById("prompt");
  var completions = document.getElementById("completions");
  var orig = "";  // original user input
  var ci = 0;     // completion index
  var completep = true;

  function clear_prompt()
  {
    prompt.value = "";
    completions.innerHTML = "";
    completep = false;
  }

  function user_input(cmd)
  {
    message(cmd, "player");
    clear_prompt();
    message("I don't understand.");
  }

  function choose_completion(incr)
  {
    var li = completions.querySelectorAll("li");
    var sel = completions.querySelector(".sel");
    if (sel) sel.className = "";
    ci += incr;
    if (ci < 0) ci += li.length + 1;
    if (ci > li.length) ci = 0;
    if (ci === 0) {
      prompt.value = orig;
    } else {
      li[ci - 1].className = "sel";
      prompt.value = li[ci - 1].textContent;
    }
    completep = false;
  }

  function complete()
  {
    if (!completep) {
      completep = true;
      return;
    }
    completions.innerHTML = "";
    orig = prompt.value;
    var i = flexo.normalize(orig).toLowerCase();
    var l = i.length;
    if (l > 0) {
      Object.keys(verbs).sort().forEach(function(w) {
          if (w.substr(0, l) === i) {
            var li = flexo.ez_html("li", w);
            li.addEventListener("click", function() { user_input(w); }, false);
            completions.appendChild(li);
          }
        });
    }
  }

  prompt.addEventListener("keydown", function(e) {
      if (e.keyCode === 13) {
        user_input(e.target.value);
      } else if (e.keyCode === 27) {
        clear_prompt();
      } else if (e.keyCode === 38) {
        e.preventDefault();
        choose_completion(-1);
      } else if (e.keyCode === 40) {
        e.preventDefault();
        choose_completion(+1);
      }
    }, false);

  prompt.addEventListener("keyup", complete, false);

})();

function describe(place)
{
  message(place.title, "room");
  message(place.desc);
  place.things.forEach(function(thing) { message(thing.desc); });
}

document.title = document.title.fmt(TITLE);
message(INTRO, "intro");
describe(CURRENT);
