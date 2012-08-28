//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.dwc");

dusk.dwc.bOpen = "\"'([{<";
dusk.dwc.bClose = "\"')]}>";

dusk.dwc.lang = {
};

dusk.dwc.addLangDef = function(name, structure) {
	dusk.dwc.lang[name] = structure;
}

dusk.dwc.compile = function(code) {
	var output = "";
	var input = code;
	var p = 0;
	var firstAct = true;
	
	while(input[p]) {
		p = dusk.dwc.ignoreWhitespace(input, p);
		
		//Parse the line
		var action = dusk.dwc.read(input, p, /[\s\n\;]/)[0];
		p = dusk.dwc.read(input, p, /[\s\n\;]/)[1];
		if(!action) break;
		if(!dusk.dwc.lang[action]) throw new Error("Unrecognised action '"+action+"'.");
		
		if(!firstAct) output += ",";
		output += '{"a":'+dusk.dwc.cast(action, "STR");
		firstAct = false;
		
		var firstProp = true;
		var propIndex = 0;
		while(input[p] != ";" && input[p]) {
			p = dusk.dwc.ignoreWhitespace(input, p);
			
			var pname = undefined;
			var pvalue = dusk.dwc.read(input, p, /[\s\n\:\;]/)[0];
			p = dusk.dwc.read(input, p, /[\s\n\:\;]/)[1];
			
			if(input[p] == ":") {
				p ++;
				pname = pvalue;
				pvalue = dusk.dwc.read(input, p, /[\s\n\:\;]/)[0];
				p = dusk.dwc.read(input, p, /[\s\n\:\;]/)[1];
			}
			
			if(dusk.dwc.lang[action][propIndex] && (pname === undefined || pname == dusk.dwc.lang[action][propIndex][0])) {
				pname = dusk.dwc.lang[action][propIndex][0];
				propIndex ++;
			}
			
			if(!pname) throw new Error("Unknown property for "+action+" encountered.");
			
			output += ','+dusk.dwc.cast(pname, "STR")+':';
			for(var i = dusk.dwc.lang[action].length-1; true; i --) {
				if(i < 0) {
					output += dusk.dwc.cast(pvalue, "STR");
					break;
				}
				if(dusk.dwc.lang[action][i][0] === pname) {
					output += dusk.dwc.cast(pvalue, dusk.dwc.lang[action][i][2]);
					break;
				}
			}
			
			if(input[p] != ";") p++;
			p = dusk.dwc.ignoreWhitespace(input, p);
		}
		
		output += "}";
		
		p ++;
	}
	
	return "["+output+"]";
};

dusk.dwc.cast = function(text, type) {
	var value = dusk.dwc.removeBlock(text);
	type = type.split(":");
	
	if(value == "null" || value === undefined) return "null";
	
	switch(type[0]) {
		default:
		case "STR":
			return '"'+value.replace('"', '\\"')+'"';
		
		case "NUM":
			return isNaN(value)?dusk.dwc.cast(value, "STR"):Number(value);
		
		case "DWC":
			return dusk.dwc.compile(value);
		
		case "BLN":
			return !(value === "false");
		
		case "OBJ":
			return text;
		
		case "ARR":
			if(type.length < 1) {
				throw new Error("No type for array element!");
			}
			var out = "["
			var p = 0;
			var doneOne = false;
			type.splice(0, 1);
			while(value[p]) {
				var entry = dusk.dwc.read(value, p, /[\s\n\:\;]/)[0];
				p = dusk.dwc.read(value, p, /[\s\n\:\;]/)[1]+1;
				
				if(doneOne) out += ",";
				doneOne = true;
				
				out += dusk.dwc.cast(entry, type.join(":"));
				
				p = dusk.dwc.ignoreWhitespace(value, p);
			}
			
			return out+"]";
	}
};

dusk.dwc.ignoreWhitespace = function(text, p) {
	var chr = "";
	var commentMode = false;
	while(chr = text[p]) {
		if(chr == "/" && text[p+1] == "*") {commentMode = true};
		if(chr == "/" && text[p-1] == "*") {commentMode = false;p++;continue;};
		if(commentMode) {p++;continue;}
		
		if(!text[p].match(/[\s\n]/)) break;
		
		p++;
	}
	//while(text[p] && text[p].match(/[\s\n]/)) {p++}
	return p;
};

//Note that returned p is always the patt char if found
dusk.dwc.read = function(text, p, patt, inclPatt) {
	var buffer = text[p];
	var chr = "";
	var opening = ["\0", 1];
	var ending = ["\0", 0];
	var commentMode = false;
	if(dusk.dwc.bOpen.indexOf(text[p]) !== -1) {
		opening[0] = text[p];
		ending[0] = dusk.dwc.bClose[dusk.dwc.bOpen.indexOf(text[p])];
	}
	
	p ++;
	while(chr = text[p]) {
		if(chr == "/" && text[p+1] == "*" && opening[0] == "\0") {commentMode = true};
		if(chr == "/" && text[p-1] == "*" && opening[0] == "\0") {commentMode = false;p++;continue;};
		if(commentMode) {p++;continue;}
		
		buffer += chr;
		if(chr == ending[0]) ending[1] ++;
		if(chr == opening[0] && chr != ending[0]) opening[1] ++;
		
		if(ending[1] == opening[1]) break;
		if(patt && chr.match(patt) && opening[0] == "\0" && ending[0] == "\0") {if(!inclPatt || (inclPatt && !chr.match(inclPatt))) buffer = buffer.substr(0, buffer.length-1);break;}
		
		p++;
	}
	
	return [buffer, p];
};

dusk.dwc.removeBlock = function(text) {
	if(!text) return text;
	if(dusk.dwc.bOpen.indexOf(text[0]) !== -1 && text[text.length-1] == dusk.dwc.bClose[dusk.dwc.bOpen.indexOf(text[0])]) return text.substr(1, text.length-2);
	return text;
};

dusk.dwc._isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
};
