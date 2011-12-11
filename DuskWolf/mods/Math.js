//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

mods.Math = function(events) {
	mods.IModule.call(this, events);
};
mods.Math.prototype = new mods.IModule();
mods.Math.constructor = mods.Math;

mods.Math.prototype.addActions = function() {
	this._events.registerAction("sin", this._trig, this);
	this._events.registerAction("cos", this._trig, this);
	this._events.registerAction("tan", this._trig, this);
	this._events.registerAction("asin", this._untrig, this);
	this._events.registerAction("acos", this._untrig, this);
	this._events.registerAction("atan", this._untrig, this);
	this._events.registerAction("round", this._round, this);
	
	//Constants
	this._events.setVar("pi", Math.PI);
	this._events.setVar("e", Math.E);
	this._events.setVar("phi", 1.61803398874989);
	this._events.setVar("infinity", Infinity);
};

mods.Math.prototype._trig = function(data) {
	if(data.to === null){duskWolf.error("No target to act to.");return;}
	if(data.value === null){duskWolf.error("No value to act on.");return;}
	
	if(data.deg) data.value = (data.value/180)*Math.PI;
	
	var tmp = 0;
	
	switch(data.a){
		case "sin":
			tmp = Math.sin(data.value);
			break;
		
		case "cos":
			tmp = Math.cos(data.value);
			if(tmp == Math.cos(Math.PI/2)) tmp = Infinity;
			break;
		
		case "tan":
			tmp = Math.tan(data.value);
			break;
	}
	
	this._events.setVar(data.to, Math.round(tmp*10000000000)/10000000000);
};

mods.Math.prototype._untrig = function(data) {
	if(data.to === null){duskWolf.error("No target to act to.");return;}
	if(data.value === null){duskWolf.error("No value to act on.");return;}
	
	var tmp = 0;
	
	switch(data.a){
		case "asin":
			tmp = Math.asin(data.value);
			break;
		
		case "acos":
			tmp = Math.acos(data.value);
			break;
		
		case "atan":
			tmp = Math.atan(data.value);
			break;
	}
	
	tmp = Math.round(tmp*10000000000)/10000000000;
	
	this._events.setVar(data.to, data.deg?Math.round(tmp*(180/Math.PI)):tmp);
};

mods.Math.prototype._round = function(data) {
	if(!data.to){duskWolf.error("No target to round to.");return;}
	if(!data.value){duskWolf.error("No value to round.");return;}
	if(!data.places) data.places = 1; else data.places = Math.pow(10, data.places);
	
	this._events.setVar(data.to, Math.round(data.value*data.places)/data.places);
};
