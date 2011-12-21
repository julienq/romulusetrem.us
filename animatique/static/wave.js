var Wave =
{
  context: new webkitAudioContext,

  init: function(args)
  {
    if (!args.sound) {
      flexo.notify(this, "error", { message: "No sound to load." });
      return;
    }
    this.fps = args.fps;
    this.scale = args.scale;
    this.height = args.height;
    this.uri = flexo.absolute_uri(document.baseURI, args.sound);
    var req = new XMLHttpRequest;
    req.open("GET", this.uri);
    req.responseType = "arraybuffer";
    req.onreadystatechange = function() {
      flexo.log(req.readyState);
      if (req.readyState === 4) {
        flexo.log(req.status);
        if (req.status === 200) {
          Wave.arraybuffer = req.response;
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

  draw: function()
  {
    // Create a buffer from the arraybuffer data obtained above; mixdown to mono
    this.buffer = this.context.createBuffer(this.arraybuffer, true);
    var canvas = document.createElement("canvas");
    var gc = canvas.getContext("2d");
    canvas.width = this.buffer.duration * this.fps * this.scale;
    canvas.height = this.height;
    var h = canvas.height / 2;
    gc.fillStyle = "#444";
    var sz = Math.ceil(this.buffer.length / canvas.width);
    for (var x = 0, j = 0; x < canvas.width; ++x) {
      var min = 1;
      var max = -1;
      for (var i = 0; i < sz; ++i) {
        var val = this.buffer.getChannelData(0)[j++];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      gc.fillRect(x, h * (1 - max), 1, h * (max - min));
    }
    var img = document.createElement("img");
    img.alt = "Waveform for {0}".fmt(this.uri);
    img.src = canvas.toDataURL();
    return img;
  },

};
