//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

mods.LocalSaver = function(events) {
	mods.IModule.call(this, events);
};
mods.LocalSaver.prototype = new mods.IModule();
mods.LocalSaver.constructor = mods.LocalSaver;
	
mods.LocalSaver.prototype.addActions = function() {
	this._events.registerAction("local-save", this._save, this);
	this._events.registerAction("local-load", this._load, this);
	this._events.registerAction("local-clear", this._clear, this);
};

mods.LocalSaver.prototype._save = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	if(!("vars" in data)){duskWolf.error("No vars to save!");return;}
	
	if("regexp" in data && data.regexp == "1") {
		if(typeof(data.vars) == "array"){
			var hold = [];
			for(var i = data.vars.length-1; i >= 0; i--) {
				hold = hold.concat(this._events.getVars(RegExp(data.vars[i])));
			}
			localStorage["dw_"+data.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+data.name] = JSON.stringify(this._events.getVars(RegExp(data.vars)));
		}
	}else{
		if(typeof(data.vars) == "array"){
			var hold = [];
			for(var i = data.vars.length-1; i >= 0; i--) {
				hold = hold[hold.length] = [data.vars[i], this._events.getVar(data.vars[i])];
			}
			localStorage["dw_"+data.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+data.name] = JSON.stringify([[data.vars, this._events.getVar(data.vars)]]);
		}
	}
};

mods.LocalSaver.prototype._load = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	
	this._events.setVars(JSON.parse(localStorage["dw_"+data.name]));
};

mods.LocalSaver.prototype._clear = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	
	delete localStorage["dw_"+data.name];
};
