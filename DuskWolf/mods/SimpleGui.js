//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

__import__("sgui/__init__.js");
loadComponent("Pane");

/** Class: mods.SimpleGui
 * 
 * This provides a simple system for creating canvas UIs.
 * 
 * Generally, everything in the Simple GUI system is a <sgui.Component>.
 * 	And all components are in another container component, until you get to the top, which are components of type <sgui.Pane>.
 * 
 * Components have "properties", like x and y, that can be set, or read from to a var.
 * 
 * <p>To access a component, and set it's properties, you use like <code>&lt;pane name='panefullPun'&gt;&lt;group name='group'&gt;&lt;label name='texty'&gt;&lt;text&gt;Hello!&lt;/text&gt;&lt;/label&gt;&lt;/group&gt;&lt;/pane&gt;</code>.</p>
 * 
 * <p>The "root" components are panes, only one pane can be active at a time, and that one receives all input. You must use <code>&lt;pane&gt;</code> as the root element for setting properties, otherwise you will get a "not found" warning.</p>
 * 
 * 
 * Inheritance:
 * 	mods.LocalSaver { <mods.IModule>
 * 
 * Provided Actions:
 */
mods.SimpleGui = function(events) {
	mods.IModule.call(this, events);
	
	this._events.registerKeyHandler("SGuiKey", function(event) {
		this._getActivePane().keypress(event);
	}, this);
	
	this._events.registerFrameHandler("SGuiFrame", function(e) {
		for(var p in this._panes){
			this._panes[p].frame(e);
		}
	}, this);
	
	this._events.registerFrameHandler("SGuiDrawer", this.draw, this);

	this._panes = {};
	this._activePane = "";
	this._redrawBooked = false;
	this.setActivePane("blank");

	this._events.setVar("sys-sg-width", $("#"+duskWolf.canvas)[0].width);
	this._events.setVar("sys-sg-height", $("#"+duskWolf.canvas)[0].height);
	
	$("#"+duskWolf.canvas)[0].getContext("2d").mozImageSmoothingEnabled = false;
	$("#"+duskWolf.canvas)[0].getContext("2d").textBaseline = "middle";
	
	//Themes
	this._events.setVar("theme-defualt-border", "#cccccc");
	this._events.setVar("theme-defualt-box", "#eeeeee");
	this._events.setVar("theme-defualt-tile-ssize", 4);
	this._events.setVar("theme-defualt-dtile-swidth", 16);
	this._events.setVar("theme-defualt-dtile-sheight", 16);
	this._events.setVar("theme-defualt-fc-inactive", "inactive.png");
	this._events.setVar("theme-defualt-fc-focused", "focused.png");
	this._events.setVar("theme-defualt-fc-active", "active.png");
	this._events.setVar("theme-defualt-tm-spacing-h", 0);
	this._events.setVar("theme-defualt-tm-spacing-v", 0);
	this._events.setVar("theme-defualt-tm-rows", -1);
	this._events.setVar("theme-defualt-tm-cols", -1);
	this._events.setVar("theme-defualt-tm-dec", -1);
	this._events.setVar("theme-defualt-plat-ssize", 4);
	this._events.setVar("theme-defualt-plat-tsize", 5);
	this._events.setVar("theme-defualt-plat-scroll-speed", 4);
	
	this._events.setVar("theme", "defualt");
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
