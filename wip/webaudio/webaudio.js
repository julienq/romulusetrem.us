(function(webaudio)
{
  webaudio.context = new webkitAudioContext();
  var BUFFER_SIZE = 512;

  // A440 = 69
  webaudio.mtof = function(m)
  {
    return 440 * Math.pow(2, (m - 69) / 12);
  };

  webaudio.phasor = function(freq, buffer_size)
  {
    var p = webaudio.context.createJavaScriptNode(buffer_size || BUFFER_SIZE,
      0, 1);
    p.freq = freq || 1;
    p.phase = 0;
    p.onaudioprocess = function(e)
    {
      var m = e.outputBuffer.numberOfChannels;
      var out = flexo.times(m, function(i) {
          return e.outputBuffer.getChannelData(i);
        });
      var cycle = e.outputBuffer.sampleRate / this.freq;
      for (var i = 0, n = this.bufferSize; i < n; ++i) {
        for (var j = 0; j < m; ++j) {
          out[j][i] = (this.phase + i / cycle) % 1;
        }
      }
      this.phase = (this.phase + i / cycle) % 1;
    };
    return p;
    }

  webaudio.sin = function(buffer_size)
  {
    var s = webaudio.context.createJavaScriptNode(buffer_size || BUFFER_SIZE,
        1, 1);
    s.onaudioprocess = function(e)
    {
      for (var j = 0, m = e.outputBuffer.numberOfChannels; j < m; ++j) {
        var in_ = e.inputBuffer.getChannelData(j);
        var out = e.outputBuffer.getChannelData(j);
        for (var i = 0, n = this.bufferSize; i < n; ++i) {
          out[i] = Math.sin(in_[i] * 2 * Math.PI);
        }
      }
    };
    return s;
  };

  // multiple inputs are not supported so far!
  /*webaudio.mult = function(buffer_size)
  {
    var mult = webaudio.context.createJavaScriptNode(buffer_size || BUFFER_SIZE,
        2, 1);
    mult.onaudioprocess = function(e)
    {
      for (var j = 0, m = e.outputBuffer.numberOfChannels; j < m; ++j) {
        var in1 = e.inputBuffer[0].getChannelData(j);
        var in2 = e.inputBuffer[1].getChannelData(j);
        var out = e.outputBuffer.getChannelData(j);
        for (var i = 0, n = this.bufferSize; i < n; ++i) {
          out[i] = in1[i] * in2[i];
        }
      }
    };
    return mult;
  };*/

})(this.webaudio = {});
