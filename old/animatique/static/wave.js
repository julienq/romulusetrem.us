var Wave =
{

  init: function(args)
  {
    if (!args.sound) {
      flexo.notify(this, "error", { message: "No sound to load." });
      return;
    }
    this.context = new webkitAudioContext;
    this.fps = args.fps;
    this.scale = args.scale;
    this.height = args.height;
    this.uri = flexo.absolute_uri(document.baseURI, args.sound);
    var req = new XMLHttpRequest;
    req.open("GET", this.uri);
    req.responseType = "arraybuffer";
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        if (req.status === 200) {
          Wave.arraybuffer = req.response;
          Wave.audio = document.createElement("audio");
          Wave.audio.src = Wave.uri;
          flexo.notify(Wave, "loaded");
        } else {
          flexo.notify(Wave, "error",
            { message: "Failed to get URI {0}: status {1}"
              .fmt(this.uri, req.status) });
        }
      }
    };
    req.send();
  },

  draw: function(div)
  {
    flexo.log("Drawing...");
    this.buffer = this.context.createBuffer(this.arraybuffer, true);
    var canvas = document.createElement("canvas");
    var gc = canvas.getContext("2d");
    this.width = this.buffer.duration * this.fps * this.scale;
    canvas.width = this.width;
    canvas.height = this.height;
    var h = canvas.height / 2;
    gc.fillStyle = "#444";
    this.sz = Math.ceil(this.buffer.length / canvas.width);
    for (var x = 0, j = 0; x < canvas.width; ++x) {
      var min = 1;
      var max = -1;
      for (var i = 0; i < this.sz; ++i) {
        var val = this.buffer.getChannelData(0)[j++];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      gc.fillRect(x, h * (1 - max), 1, h * (max - min));
    }
    div.innerHTML = "";
    div.style.width = "{0}px".fmt(this.width);
    div.style.height = "{0}px".fmt(this.height);
    var img = document.createElement("img");
    img.alt = "Waveform for {0}".fmt(this.uri);
    img.src = canvas.toDataURL();
    div.appendChild(img);
    var svg = flexo.svg("svg",
        { viewBox: "0 0 {0} {1}".fmt(this.width, this.height) });
    svg.style.width = "{0}px".fmt(this.width);
    svg.style.height = "{0}px".fmt(this.height);
    div.appendChild(svg);
    this.cursor = flexo.svg("line", { stroke: "#ff4040",
      y1: 0, y2: this.height });
    svg.appendChild(this.cursor);
    this.sample_rate = this.buffer.sampleRate;
    this.context = null;
    this.buffer = null;
    delete this.context;
    delete this.buffer;
    Wave.cursor.setAttribute("x1", 100);
    Wave.cursor.setAttribute("x2", 100);
    requestAnimationFrame(this.animate_cursor);
    flexo.log("... drawn.");
    return div;
  },

  animate_cursor: function()
  {
    var x = Wave.audio.currentTime * Wave.sample_rate / Wave.sz;
    Wave.cursor.setAttribute("x1", x);
    Wave.cursor.setAttribute("x2", x);
    requestAnimationFrame(Wave.animate_cursor);
  }
};
