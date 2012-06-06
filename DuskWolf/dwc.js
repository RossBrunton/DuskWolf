//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.dwc = {};

dwc.bOpen = "\"'([{<";
dwc.bClose = "\"')]}>";

dwc.lang = {
};

dwc.addLangDef = function(name, structure) {
	dwc.lang[name] = structure;
}

dwc.compile = function(code) {
	var output = "";
	var input = code;
	var p = 0;
	var firstAct = true;
	
	while(input[p]) {
		p = dwc.ignoreWhitespace(input, p);
		
		//Parse the line
		var action = dwc.read(input, p, /[\s\n\;]/)[0];
		p = dwc.read(input, p, /[\s\n\;]/)[1];
		if(!action) break;
		if(!dwc.lang[action]) throw new Error("Unrecognised action '"+action+"'.");
		
		if(!firstAct) output += ",";
		output += '{"a":'+dwc.cast(action, "STR");
		firstAct = false;
		
		var firstProp = true;
		var propIndex = 0;
		while(input[p] != ";" && input[p]) {
			p = dwc.ignoreWhitespace(input, p);
			
			var pname = undefined;
			var pvalue = dwc.read(input, p, /[\s\n\:\;]/)[0];
			p = dwc.read(input, p, /[\s\n\:\;]/)[1];
			
			if(input[p] == ":") {
				p ++;
				pname = pvalue;
				pvalue = dwc.read(input, p, /[\s\n\:\;]/)[0];
				p = dwc.read(input, p, /[\s\n\:\;]/)[1];
			}
			
			if(dwc.lang[action][propIndex] && (pname === undefined || pname == dwc.lang[action][propIndex][0])) {
				pname = dwc.lang[action][propIndex][0];
				propIndex ++;
			}
			
			if(!pname) {throw new Error("Unknown property for "+action+" encountered."); continue;}
			
			output += ','+dwc.cast(pname, "STR")+':';
			for(var i = dwc.lang[action].length-1; true; i --) {
				if(i < 0) {
					output += dwc.cast(pvalue, "STR");
					break;
				}
				if(dwc.lang[action][i][0] === pname) {
					output += dwc.cast(pvalue, dwc.lang[action][i][2]);
					break;
				}
			}
			
			if(input[p] != ";") p++;
			p = dwc.ignoreWhitespace(input, p);
		}
		
		output += "}";
		
		p ++;
	}
	
	return "["+output+"]";
};

dwc.cast = function(text, type) {
	var value = dwc.removeBlock(text);
	type = type.split(":");
	
	if(value == "null" || value === undefined) return "null";
	
	switch(type[0]) {
		default:
		case "STR":
			return '"'+value.replace('"', '\\"')+'"';
		
		case "NUM":
			return isNaN(value)?dwc.cast(value, "STR"):Number(value);
		
		case "DWC":
			return dwc.compile(value);
		
		case "BLN":
			return !(value === "false");
		
		case "OBJ":
			return text;
		
		case "ARR":
			if(type.length < 1) {
				throw new Error("No type for array element!");
				return "[]";
			}
			var out = "["
			var p = 0;
			var doneOne = false;
			type.splice(0, 1);
			while(value[p]) {
				var entry = dwc.read(value, p, /[\s\n\:\;]/)[0];
				p = dwc.read(value, p, /[\s\n\:\;]/)[1]+1;
				
				if(doneOne) out += ",";
				doneOne = true;
				
				out += dwc.cast(entry, type.join(":"));
				
				p = dwc.ignoreWhitespace(value, p);
			}
			
			return out+"]";
	}
};

dwc.ignoreWhitespace = function(text, p) {
	var char = "";
	var commentMode = false;
	while(char = text[p]) {
		if(char == "/" && text[p+1] == "*") {commentMode = true};
		if(char == "/" && text[p-1] == "*") {commentMode = false;p++;continue;};
		if(commentMode) {p++;continue;}
		
		if(!text[p].match(/[\s\n]/)) break;
		
		p++;
	}
	//while(text[p] && text[p].match(/[\s\n]/)) {p++}
	return p;
};

//Note that returned p is always the patt char if found
dwc.read = function(text, p, patt, inclPatt) {
	var buffer = text[p];
	var char = "";
	var opening = ["\0", 1];
	var ending = ["\0", 0];
	var commentMode = false;
	if(dwc.bOpen.indexOf(text[p]) !== -1) {
		opening[0] = text[p];
		ending[0] = dwc.bClose[dwc.bOpen.indexOf(text[p])];
	}
	
	p ++;
	while(char = text[p]) {
		if(char == "/" && text[p+1] == "*" && opening[0] == "\0") {commentMode = true};
		if(char == "/" && text[p-1] == "*" && opening[0] == "\0") {commentMode = false;p++;continue;};
		if(commentMode) {p++;continue;}
		
		buffer += char;
		if(char == ending[0]) ending[1] ++;
		if(char == opening[0] && char != ending[0]) opening[1] ++;
		
		if(ending[1] == opening[1]) break;
		if(patt && char.match(patt) && opening[0] == "\0" && ending[0] == "\0") {if(!inclPatt || (inclPatt && !char.match(inclPatt))) buffer = buffer.substr(0, buffer.length-1);break;}
		
		p++;
	}
	
	return [buffer, p];
};

dwc.removeBlock = function(text) {
	if(!text) return text;
	if(dwc.bOpen.indexOf(text[0]) !== -1 && text[text.length-1] == dwc.bClose[dwc.bOpen.indexOf(text[0])]) return text.substr(1, text.length-2);
	return text;
};

dwc._isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
}
