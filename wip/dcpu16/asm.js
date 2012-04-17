var fs = require("fs");
var flexo = require("../../flexo.js");
var dcpu16 = require("./dcpu-16.js");

var labels = {};
var mem = [];

fs.readFile("test.s", function(err, data) {
  if (err) throw err;
  var lines = data.toString().split("\n");
  lines.forEach(function(line, i) {
      var orig = line;
      line = line.trim().replace(/\s+/g, " ").replace(/ ?;.*$/, "");
      var m;
      if (m = line.match(/^:(\w+) /)) {
        labels[m[1]] = mem.length;
        line = line.substr(m[0].length);
      }
      if (m = line.match(/^(\w+) /)) {
        var opcode = dcpu16.opcodes.indexOf(m[1].toUpperCase());
        if (opcode) {
          line = line.substr(m[0].length);
          var a = get_value();
          if (opcode < 16) {
            var b = get_value();
          } else {
            var b = a;
            a = opcode & 0xf;
          }
          mem.push([opcode, a, b, orig]);
          if (typeof a !== "number") mem.push(a);
          if (typeof b !== "number") mem.push(b);
        }
      }

      function get_value()
      {
        var val = undefined;
        if (m = line.match(/^([ABCXYZIJ])\b/i)) {
          val = dcpu16.registers.indexOf(m[1].toUpperCase());
        } else if (m = line.match(/^\[ ?([ABCXYZIJ])\]/i)) {
          val = dcpu16.registers.indexOf(m[1].toUpperCase()) + 8;
        } else if (m = line
            .match(/^\[ ?0x([0-9a-f]+) ?\+ ?([ABCXYZIJ]) ?\]/i)) {
          var w = parseInt(m[1], 16);
          var v = dcpu16.registers.indexOf(m[2].toUpperCase()) + 16;
          val = [v, w];
        } else if (m = line
            .match(/^\[ ?([0-9]+) ?\+ ?([ABCXYZIJ]) ?\]/i)) {
          var w = parseInt(m[1], 10);
          var v = dcpu16.registers.indexOf(m[2].toUpperCase()) + 16;
          val = [v, w];
        } else if (m = line.match(/^pop\b/i)) {
          val = 0x18;
        } else if (m = line.match(/^peek\b/i)) {
          val = 0x19;
        } else if (m = line.match(/^push\b/i)) {
          val = 0x1a;
        } else if (m = line.match(/^sp\b/i)) {
          val = 0x1b;
        } else if (m = line.match(/^pc\b/i)) {
          val = 0x1c;
        } else if (m = line.match(/^o\b/i)) {
          val = 0x1d;
        } else if (m = line.match(/^\[ ?0x([0-9a-f]+) ?\]/i)) {
          var w = parseInt(m[1], 16);
          var v = 0x1e;
          val = [v, w];
        } else if (m = line.match(/^\[ ?([0-9]+) ?\]/)) {
          var w = parseInt(m[1], 10);
          var v = 0x1e;
          val = [v, w];
        } else if (m = line.match(/^\[ ?(\w+) ?\]/)) {
          var w = m[1];
          var v = 0x1e;
          val = [v, w];
        } else if (m = line.match(/^0x([0-9a-f]+)\b/i)) {
          var w = parseInt(m[1], 16);
          if (w > 0x1f) {
            var v = 0x1f;
            val = [v, w];
          } else {
            val = w + 0x20;
          }
        } else if (m = line.match(/^([0-9]+)\b/)) {
          var w = parseInt(m[1], 10);
          if (w > 0x1f) {
            var v = 0x1f;
            val = [v, w];
          } else {
            val = w + 0x20;
          }
        } else if (m = line.match(/^\w+/)) {
          val = [0x1f, m[0]];
        }
        if (m) line = line.substr(m[0].length).replace(/^[, ]*/, "");
        return val;
      }
    });


  for (var i = 0, n = mem.length; i < n;) {
    var instr = mem[i];
    var w = instr[0];
    if (typeof instr[1] === "number") {
      w += (instr[1] & 0x3f) << 4;
    } else {
      w += instr[1][0] << 4;
    }
    if (typeof instr[2] === "number") {
      w += (instr[2] & 0x3f) << 10;
    } else {
      w += instr[2][0] << 10;
    }
    console.log("m.set_ram({0}, {1});  // {2}"
        .fmt(dcpu16.hex(i++), dcpu16.hex(w), instr[3]));
    if (typeof instr[1] !== "number") {
      if (typeof instr[1][1] === "string") {
        console.log("m.set_ram({0}, {1});".fmt(dcpu16.hex(i++),
          dcpu16.hex(labels[instr[1][1]])));
      } else {
        console.log("m.set_ram({0}, {1});".fmt(dcpu16.hex(i++),
              dcpu16.hex(instr[1][1])));
      }
    }
    if (typeof instr[2] !== "number") {
      if (typeof instr[2][1] === "string") {
        console.log("m.set_ram({0}, {1});".fmt(dcpu16.hex(i++),
          dcpu16.hex(labels[instr[2][1]])));
      } else {
        console.log("m.set_ram({0}, {1});".fmt(dcpu16.hex(i++),
          dcpu16.hex(instr[2][1])));
      }
    }
  }

});
