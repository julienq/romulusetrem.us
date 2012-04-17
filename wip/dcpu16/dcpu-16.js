if (typeof require === "function") var flexo = require("../../flexo.js");

(function (dcpu16)
{
  // Names of the registers
  dcpu16.registers = "ABCXYZIJ";

  // Opcodes
  dcpu16.opcodes = ["", "SET", "ADD", "SUB", "MUL", "DIV", "MOD", "SHL", "SHR",
    "AND", "BOR", "XOR", "IFE", "IFN", "IFG", "IFB", "JSR"];

  // Format a hex value like 0x%4x
  dcpu16.hex = function(v)
  {
    return "0x{0}".fmt(flexo.pad(v.toString(16), 4));
  };

  // Decode the first word of an instruction and return opcode, a and b (for
  // simple opcodes)
  function decode(word)
  {
    var op = word & 0xf;
    if (op) {
      // Simple opcode
      var a = (word & 0x03f0) >> 4;
      var b = (word & 0xfc00) >> 10;
      return [dcpu16.opcodes[op], a, b];
    } else {
      // Extended opcode
      var o = word & 0x03f0;
      var a = (word & 0xfc00) >> 10;
      return [dcpu16.opcodes[o], a];
    }
  }

  // Return true if the value v requires fetching the next word
  function should_fetch_next(v)
  {
    return (v >= 0x10 && v < 0x18) || v === 0x1e || v === 0x1f;
  }

  // Disassemble a value (given an extra word when necessary)
  function disassemble_value(v, w)
  {
    if (v < 0x08) return dcpu16.registers[v];
    if (v < 0x10) return "[{0}]".fmt(dcpu16.registers[v - 8]);
    if (v < 0x18) {
      return "[0x{0} + {1}]".fmt(w.toString(16), dcpu16.registers[v - 16]);
    }
    if (v === 0x18) return "POP";
    if (v === 0x19) return "PEEK";
    if (v === 0x1a) return "PUSH";
    if (v === 0x1b) return "SP";
    if (v === 0x1c) return "PC";
    if (v === 0x1d) return "O";
    if (v === 0x1e) return "[0x{0}]".fmt(w.toString(16));
    if (v === 0x1f) return "0x{0}".fmt(w.toString(16));
    return v - 32;
  }

  // Disassemble an instruction given one, two or three words. Note that w2 always
  // goes with a, and w3 always with b (or a in the case of an extended opcode)
  function disassemble(word, w2, w3)
  {
    var op = word & 0x0f;
    if (op) {
      var opcode = dcpu16.opcodes[op];
      var a = (word & 0x03f0) >> 4;
      var da = disassemble_value(a, w2);
      var b = (word & 0xfc00) >> 10;
      var db = disassemble_value(b, w3);
      return "{0} {1}, {2}".fmt(opcode, da, db);
    } else {
      var o = word & 0x03f0;
      var opcode = dcpu16.opcodes[op];
      var a = (word & 0xfc00) >> 10;
      var da = disassemble_value(a, w3);
      return "{0} {1}".fmt(opcode, da);
    }
  }

  // An actual machine with RAM and registers. Initialize before use!
  dcpu16.machine =
  {
    // Initialize the RAM and registers of the machine
    init: function()
    {
      this.ram = new Uint16Array(new ArrayBuffer(0x20000));
      for (var i = this.ram.length - 1; i >= 0; --i) this.ram[i] = 0;
      this.registers = new Uint16Array(new ArrayBuffer(16));
      for (var i = this.registers.length - 1; i >= 0; --i) {
        this.set_register(i, 0);
      }
      this.set_pc(0);
      this.set_sp(0xffff);
      this.set_o(0);
      this.set_skip(false);   // flag set when IFE, IFN, IFG or IFB is false
      this.last_pc = 0xffff;  // check whether we're in a loop
      this.rate = 100;        // rate of instruction fetching (0 for immediate)
      return this;
    },

    set_ram: function(address, v)
    {
      address = address & 0xffff;
      this.ram[address] = v & 0xffff;
      flexo.notify(this, "@memory", { address: address });
    },

    set_register: function(i, v)
    {
      this.registers[i] = v & 0xffff;
      flexo.notify(this, "@register", { which: dcpu16.registers[i],
        value: this.registers[i] });
      return this.registers[i];
    },

    set_pc: function(v)
    {
      this.pc = v & 0xffff;
      flexo.notify(this, "@register", { which: "PC", value: this.pc });
      return this.pc;
    },

    set_sp: function(v)
    {
      this.sp = v & 0xffff;
      flexo.notify(this, "@register", { which: "SP", value: this.sp });
      return this.sp;
    },

    set_o: function(v)
    {
      this.o = v & 0xffff;
      flexo.notify(this, "@register", { which: "O", value: this.o });
      return this.o;
    },

    set_skip: function(v)
    {
      this.skip = v;
      flexo.notify(this, "@register", { which: "SKIP", value: this.skip });
      return this.skip;
    },

    // Get a value for a/b given the next word
    get_value: function(v, w)
    {
      if (v < 0x08) return this.registers[v];                     // register
      if (v < 0x10) return this.ram[this.registers[v - 8]];       // [register]
      if (v < 0x18) return this.ram[this.registers[v - 16]] + w;  // [register+w]
      if (v === 0x18) {                                           // POP / [SP++]
        return this.ram[this.set_sp(this.sp + 1) - 1];
      }
      if (v === 0x19) return this.ram[this.sp];                   // PEEK = [SP]
      if (v === 0x1a) return this.ram[this.set_sp(this.sp - 1)];  // PUSH / [--SP]
      if (v === 0x1b) return this.sp;                             // SP
      if (v === 0x1c) return this.pc;                             // PC
      if (v === 0x1d) return this.o;                              // O
      if (v === 0x1e) return this.ram[w];                         // [w]
      if (v === 0x1f) return w;                                   // w
      return v - 0x20;                                            // literal
    },

    // Set a value for a/b given the next word
    set_value: function(v, w, value)
    {
      if (v < 0x08) this.set_register(v, value);
      if (v < 0x10) this.set_ram(this.registers[v - 8], value);
      if (v < 0x18) this.set_ram(this.registers[v - 16] + w, value);
      if (v === 0x18) this.set_ram(this.set_sp(this.sp + 1) - 1);
      if (v === 0x19) this.set_ram(this.sp, value);
      if (v === 0x1a) this.set_ram(this.set_sp(this.sp - 1));
      if (v === 0x1b) this.set_sp(value);
      if (v === 0x1c) this.set_pc(value);
      if (v === 0x1d) this.set_o(value);
      if (v === 0x1e) this.set_ram(w, value);
    },

    set_with_overflow: function(a, wa, r)
    {
      this.set_value(a, wa, r);
      this.set_o((r >> 16) & 0xffff);
    },

    exec: function()
    {
      var op =
      {
        SET: function(a, wa, b, wb) {
          this.set_value(a, wa, this.get_value(b, wb));
        },
        ADD: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) + this.get_value(b, wb));
        },
        SUB: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) - this.get_value(b, wb));
        },
        MUL: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) * this.get_value(b, wb));
        },
        DIV: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) / this.get_value(b, wb));
        },
        MOD: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) % this.get_value(b, wb));
        },
        SHL: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) << this.get_value(b, wb));
        },
        SHR: function(a, wa, b, wb) {
          this.set_with_overflow(a, wa,
              this.get_value(a, wa) >> this.get_value(b, wb));
        },
        AND: function(a, wa, b, wb) {
          this.set_value(a, wa, this.get_value(a, wa) & this.get_value(b, wb));
        },
        BOR: function(a, wa, b, wb) {
          this.set_value(a, wa, this.get_value(a, wa) | this.get_value(b, wb));
        },
        XOR: function(a, wa, b, wb) {
          this.set_value(a, wa, this.get_value(a, wa) ^ this.get_value(b, wb));
        },
        IFE: function(a, wa, b, wb) {
          this.set_skip(this.get_value(a, wa) !== this.get_value(b, wb));
        },
        IFN: function(a, wa, b, wb) {
          this.set_skip(this.get_value(a, wa) === this.get_value(b, wb));
        },
        IFG: function(a, wa, b, wb) {
          this.set_skip(this.get_value(a, wa) <= this.get_value(b, wb));
        },
        IFB: function(a, wa, b, wb) {
          this.set_skip((this.get_value(a, wa) & this.get_value(b, wb)) === 0);
        },
        JSR: function(a, wa) {
          this.set_ram(this.set_sp(this.sp - 1), this.pc);
          this.set_pc(this.get_value(a, wa));
        },
      };

      var pc = this.pc;
      var w = this.ram[pc++];
      var instr = decode(w);
      var w2 = should_fetch_next(instr[1]) ? this.ram[pc++] : 0;
      var w3 = should_fetch_next(instr[2]) ? this.ram[pc++] : 0;
      flexo.log("{0}: {1}".fmt(dcpu16.hex(this.pc), disassemble(w, w2, w3)));
      this.set_pc(pc);
      if (!this.skip) {
        op[instr[0]].call(this, instr[1], w2, instr[2], w3);
      } else {
        flexo.log("  ... skipped!");
        this.set_skip(false);
      }
      if (this.last_pc !== pc) {
        this.last_pc = pc;
        if (this.rate) {
          setTimeout(this.exec.bind(this), this.rate);
        } else {
          this.exec();
        }
      }
    }
  };
})(typeof exports === "object" ? exports : this.dcpu16 = {});
