//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/***/
window.Data = function() {
	this._hold = null;
	
	this._loaded = [];
	this.scripts = [];
	
	this._root = this.grabJson("root");
	if(!this._root) {duskWolf.error("Root json could not be loaded. Oh dear..."); return;}
	
	for(var i = this._root.files.length-1; i>= 0; i--) {
		if(this.grabJson(this._root.files[i])) {
			this.scripts[this.scripts.length] = this.grabJson(this._root.files[i]);
		}
	}
	
	if("mods" in this._root) modsAvalable = this._root.mods;
}
var __hold__;
var modsAvalable;

Data.prototype.grabJson = function(file) {
	if(this._loaded[file+".json"] === undefined) {
		duskWolf.info("Downloading JSON "+file+" from "+duskWolf.gameDir+"/"+file+".json...");
		
		$.ajax({"async":false, "dataType":"json", "error":function(jqXHR, textStatus, errorThrown) {
			duskWolf.error("Error getting "+file+", "+errorThrown);
			__hold__ = null;
		}, "success":function(json, textStatus, jqXHR) {
			__hold__ = json;
		},"url":duskWolf.gameDir+"/"+file+".json"});
		
		this._loaded[file+".json"] = __hold__;
		return __hold__;
	}else{
		return this._loaded[file+".json"];
	}
}

Data.prototype.grabImage = function(file) {
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading image "+file+" from "+duskWolf.gameDir+"/"+file+"...");
		
		this._loaded[file] = new Image()
		this._loaded[file].src = duskWolf.gameDir+"/"+file;
		return this._loaded[file];
	}else{
		return this._loaded[file];
	}
}
