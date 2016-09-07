//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.input.layouts", function() {
	var keyboard = load.require("dusk.input.keyboard");
	
	var layouts = [
		["qwerty",	"dvorak",	"qwertz", 	"azerty",	"colemak"],
		["Q",		"/",		"Q",		"A",		"Q"],
		["W",		",",		"W",		"Z",		"W"],
		["E",		".",		"E",		"E",		"F"],
		["R",		"P",		"R",		"R",		"P"],
		["T",		"Y",		"T",		"T",		"G"],
		["Y",		"F",		"Z",		"Y",		"J"],
		["U",		"G",		"U",		"U",		"L"],
		["I",		"C",		"I",		"I",		"U"],
		["O",		"R",		"O",		"O",		"Y"],
		["P",		"L",		"P",		"P",		":"],
		["[",		"[",		"[",		"",			"["],
		["]",		"]",		"]",		"",			"]"],
		
		["A",		"A",		"A",		"Q",		"A"],
		["S",		"O",		"S",		"S",		"R"],
		["D",		"E",		"D",		"D",		"S"],
		["F",		"U",		"F",		"F",		"T"],
		["G",		"I",		"G",		"G",		"D"],
		["H",		"D",		"H",		"H",		"H"],
		["J",		"H",		"J",		"J",		"N"],
		["K",		"T",		"K",		"K",		"E"],
		["L",		"N",		"L",		"L",		"I"],
		[";",		"S",		";",		"M",		"O"],
		["'",		"'",		"'",		"",			"\""],
		["#",		"#",		"#",		"",			"\\"], //JavaScript thinks these are threes
		
		["\\",		"\\",		"\\",		"<",		"-"],
		["Z",		";",		"Y",		"W",		"Z"],
		["X",		"Q",		"X",		"X",		"X"],
		["C",		"J",		"C",		"C",		"C"],
		["V",		"K",		"V",		"V",		"V"],
		["B",		"X",		"B",		"B",		"B"],
		["N",		"B",		"N",		"N",		"K"],
		["M",		"M",		"M",		",",		"M"],
		[",",		"W",		",",		";",		","],
		[".",		"V",		".",		":",		"."],
		["/",		"Z",		"/",		"!",		"/"]
	];
	
	layouts._layoutToOffset = function(layout) {
		for(var i = 0; i < this[0].length; i ++) {
			if(this[0][i] == layout) {
				return i;
			}
		}
		
		return -1;
	}
	
	layouts.translate = function(key, from, to) {
		from = this._layoutToOffset(from);
		to = this._layoutToOffset(to);
		
		if(from < 0 || to < 0) return key;
		
		for(var i = 1; i < this.length; i ++) {
			if(keyboard.findCode(this[i][from]) == key) {
				return keyboard.findCode(this[i][to]);
			}
		}
		
		return key;
	}
	
	return layouts;
});
