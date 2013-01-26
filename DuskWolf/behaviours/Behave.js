//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Entity");

dusk.load.provide("dusk.behave.Behave");

dusk.behave.Behave = function(entity) {
	this._entity = entity;
	
	this._eventHandlers = {};
};

dusk.behave.Behave.prototype._listenEvent = function(name, funct) {
	if(!this._eventHandlers[name]) this._eventHandlers[name] = [];
	this._eventHandlers[name].push(funct);
};

dusk.behave.Behave.prototype.handleEvent = function(name, data) {
	if(!this._eventHandlers[name]) return;
	
	var toReturn = false;
	for(var i = this._eventHandlers[name].length-1; i>=0; i--) {
		if(this._eventHandlers[name][i].call(this, name, data)) toReturn = out;
	}
	return toReturn;
};

dusk.behave.Behave.prototype._data = function(name, value, init) {
	if(init && value !== undefined) {
		if(!(name in this._entity.behaviourData)) this._entity.behaviourData[name] = value;
	}else if(value !== undefined) {
		this._entity.behaviourData[name] = value;
	}
	
	return this._entity.behaviourData[name];
};
