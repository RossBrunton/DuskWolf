//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Core
 * 
 * This provides a few actions that are not necessary for operation of the Events system, but are useful nonetheless.
 * 	It generally contains action that do things for your convenience.
 * 
 * Inheritance:
 * 	mods.Core { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"print", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 3.
 * 	All it does is call <DuskWolf.info>, and should be used in the same places.
 * 
 * > {"a":"error", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 1.
 * 	All it does is call <DuskWolf.error>, and should be used in the same places.
 * 
 * > {"a":"warn", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 2.
 * 	All it does is call <DuskWolf.warn>, and should be used in the same places.
 * 
 * > {"a":"inc", "to":"...", "value":123, "by":123}
 * 	Increments the value by "by", and stores the result in "to". It's just a simple "add" function.
 */


mods.Core = function(events) {
	mods.IModule.call(this, events);
};
mods.Core.prototype = new mods.IModule();
mods.Core.constructor = mods.Core;

mods.Core.prototype.addActions = function() {
	this._events.registerAction("print", function(what) {duskWolf.info(what.text);return true;}, this);
	this._events.registerAction("error", function(what) {duskWolf.error(what.text);return true;}, this);
	this._events.registerAction("warn", function(what) {duskWolf.warn(what.text);return true;}, this);
	this._events.registerAction("inc", this._increment, this);
	this._events.registerAction("mul", this._multiply, this);
	this._events.registerAction("div", this._divide, this);
	this._events.registerAction("modulo", this._modulo, this);
	this._events.registerAction("vartree", this._vartree, this);
	//events.registerAction("timer", function(what:XML):Boolean {if(!what.attribute("to").length()){DuskWolf.error("No target to set it to for!");}else{events.setVar(what.attribute("to"), String(timer.currentCount/10));}return true;});
}

mods.Core.prototype._increment = function(data) {
	if(data.to === null){duskWolf.error("No target to increment to.");return;}
	if(data.value === null){duskWolf.error("No value to increment.");return;}
	if(data.by === null) data.by = 1;
	
	this._events.setVar(data.to, Number(data.value)+Number(data.by));
}

mods.Core.prototype._multiply = function(data) {
	if(data.to === null){duskWolf.error("No target to multiply to.");return;}
	if(data.value === null){duskWolf.error("No value to multiply.");return;}
	if(data.by === null) data.by = 2;
	
	this._events.setVar(data.to, Number(data.value)*Number(data.by));
}

mods.Core.prototype._divide = function(data) {
	if(data.to === null){duskWolf.error("No target to divide to.");return;}
	if(data.value === null){duskWolf.error("No value to divide.");return;}
	if(data.by === null) data.by = 2;
	
	this._events.setVar(data.to, Number(data.value)/Number(data.by));
}

mods.Core.prototype._modulo = function(data) {
	if(data.to === null){duskWolf.error("No target to modulo to.");return;}
	if(data.value === null){duskWolf.error("No value to modulo.");return;}
	if(data.by === null) data.by = 10;
	
	this._events.setVar(data.to, Number(data.value)%Number(data.by));
}

mods.Core.prototype._vartree = function(data) {
	if(!data.data){duskWolf.error("No data to use!");return;}
	if(!data.root){duskWolf.error("No root name!");return;}
	
	var tree = data.root;
	
	this._processVarTree = function(d, root, first) {
		for(var p in d){
			if(typeof(d[p]) != "object"){
				this._events.setVar(root+"-"+p, d[p]);
			}else{
				this._processVarTree(d[p], root+"-"+p);
			}
		}
	}
	
	this._processVarTree(data.data, data.root);
}
