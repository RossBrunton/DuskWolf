//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

__import__("sgui/__init__.js");
loadComponent("Pane");

mods.SimpleGui = function(events) {
	mods.IModule.call(this, events);
	
	this.__interface = mods.IModule;
	this.__interface(events);
	
	this._events.registerKeyHandler("SGuiKey", function(event) {
		this._getActivePane().keypress(event);
	}, this);
	
	this._events.registerFrameHandler("SGuiDrawer", this.draw, this);

	this._panes = {};
	this._activePane = "";
	this._redrawBooked = false;
	this.setActivePane("blank");

	this._events.setVar("sys-sg-width", $("#"+duskWolf.canvas)[0].width);
	this._events.setVar("sys-sg-height", $("#"+duskWolf.canvas)[0].height);
	$("#"+duskWolf.canvas)[0].getContext("2d").mozImageSmoothingEnabled = false;
};
mods.SimpleGui.prototype = new mods.IModule();
mods.SimpleGui.constructor = mods.SimpleGui;
	
mods.SimpleGui.prototype.addActions = function() {
	this._events.registerAction("sg-path", this._doPath, this);
	this._events.registerAction("pane", this._doComponent, this);
	this._events.registerAction("draw", function(data){this.draw();}, this);
};

mods.SimpleGui.prototype._newPane = function(name) { //Returns pane
	//Check if it exists
	if(this._getPane(name, true)){duskWolf.error("Pane "+name+" already exists!");return null;}
	
	//Create the pane
	this._panes[name.toLowerCase()] = new sgui.Pane(this, this._events, name);
	
	return this._panes[name.toLowerCase()];
};

mods.SimpleGui.prototype._getPane = function(name, noNew) { //Returns pane
	if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	return noNew?null:this._newPane(name);
};

mods.SimpleGui.prototype._doComponent = function(data) {
	if(!data.name) {duskWolf.error("No name given for a pane.");return;}
	this._getPane(data.name).doStuff(this._events.replaceVar(data, true), this._events.thread);
};

mods.SimpleGui.prototype.setActivePane = function(to) {
	if(this._getActivePane()) this._getActivePane().onDeactive();
	this._getPane(to);
	this._activePane = to.toLowerCase();
	this._getActivePane().onActive();
};

mods.SimpleGui.prototype._getActivePane = function() { //Pane
	return this._panes[this._activePane];
};

mods.SimpleGui.prototype.draw = function() {
	if(!this._redrawBooked) return;
	$("#canvas")[0].getContext("2d").clearRect(0, 0, this._events.getVar("sys-sg-width"), this._events.getVar("sys-sg-height"));
	
	//Draw panes
	for(var c in this._panes){
		this._panes[c].draw($("#canvas")[0].getContext("2d"));
	}
	
	this._redrawBooked = false;
};

mods.SimpleGui.prototype._doPath = function(data) {
	if(!data.path){duskWolf.error("No path given!");return;}
	
	var fragments = data.path.split(".");
	var digger = this._getPane(fragments[0]);
	
	for(var i = 1; i < fragments.length; i++){
		if(digger.isAContainer && digger.getComponent(fragments[i])){
			digger = digger.getComponent(fragments[i]);
		} else if(!digger.isAContainer){
			break;
		} else {
			duskWolf.error("Path is invalid!");
			return;
		}
	}
	
	digger.doStuff(this._events.replaceVar(data, true), this._events.thread);	
};

mods.SimpleGui.prototype.bookRedraw = function() {
	this._redrawBooked = true;
};
