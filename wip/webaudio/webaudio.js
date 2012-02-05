(function(webaudio)
{
  webaudio.context = new webkitAudioContext();
  var BUFFER_SIZE = 512;

  // A440 = 69
  webaudio.mtof = function(m)
  {
    return 440 * Math.pow(2, (m - 69) / 12);
  };

  webaudio.create_phasor = function(freq, buffer_size)
  {
    var p = webaudio.context.createJavaScriptNode(buffer_size || BUFFER_SIZE,
      0, 1);
    p.gain = webaudio.context.createGainNode();
    p.freq = freq || 1;
    p.phase = 0;
    p.onaudioprocess = function(e)
    {
      var out = e.outputBuffer.getChannelData(0);
      var cycle = e.outputBuffer.sampleRate / this.freq;
      for (var i = 0, n = this.bufferSize; i < n; ++i) {
        out[i] = this.gain.gain.value * ((this.phase + i / cycle) % 1);
      }
      this.phase = this.gain.gain.value * ((this.phase + i / cycle) % 1);
    };
    return p;
  }

  webaudio.create_sin = function(buffer_size)
  {
    var s = webaudio.context.createJavaScriptNode(buffer_size || BUFFER_SIZE,
        0, 1);
    s.onaudioprocess = function(e)
    {
      var in_ = e.inputBuffer.getChannelData(0);
      var out = e.outputBuffer.getChannelData(0);
      for (var i = 0, n = this.bufferSize; i < n; ++i) {
        out[i] = Math.sin(in_[i] * 2 * Math.PI);
      }
    };
    return s;
  };

  webaudio.create_line = function(values, buffer_size)
  {
  };
})(this.webaudio = {});
