//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Pane");
dusk.load.require("dusk.keyboard");
dusk.load.require("dusk.frameTicker");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.controls");
dusk.load.require("dusk");

dusk.load.provide("dusk.simpleGui");

/** @namespace dusk.sgui
 * 
 * @description This is the namespace with all the Simple Gui's components in it.
 */

/** @namespace dusk.simpleGui
 * @name dusk.simpleGui
 * 
 * @description This module contains a SimpleGui system, allowing for canvas UIs.
 * 
 * Generally, everything in the Simple GUI system is a subclass of `{@link sgui.Component}.
 * 	All components are in a parent component that implements `{@link sgui.IContainer}`, until you get to the top, which are containers of type `{@link sgui.Pane}`.
 * 	Components are things that are displayed, such as images or text, each has a draw function that lets them draw directly to a canvas, rotated and offseted already for them.
 * 
 * Containers allow you to define their contents as JSON objects (but only for simple properties), or you can simply use refrences to the objects themselves.
 * 	If you use JSON, the property names of the JSON keys generally match up to the property names of the components.
 * 	You cannot call functions using JSON, only modify the properties at the current time.
 * 
 * In the JSON, if you are describing a group's children, each child element must contain a `name` and `type` property.
 * 	This is the name and type of the object, surprisingly.
 * 	`type` must be a valid type (extends `{@link dusk.sgui.Component}` and be in the namespace `{@link dusk.sgui}`.
 * 
 * Components can be "active", a component which is active will receive keyboard events, and should act like the user is paying attention to it.
 * 	When a component becomes active, it's `{@link sgui.Component.onActive} method is called, when it looses it, {@link sgui.Component.onDeactive} is called.
 * 	For a component to be active, all it's parent groups must be too.
 * 
 * Components can also be "focused", focused components will be made active when the container it is in becomes active.
 * 	Focus is generally changed by the arrow keys (only active components can handle key events, remember), though this can be remapped using the controls.
 * 	If a direction key is pressed, a function like `{@link sgui.Component.upAction}` returns true, and a variable like `{@link upFlow}` is not empty, focus changes to the named element in this one's container.
 *	The arrow keys can be overriden by using the controls "sgui_up", "sgui_down", "sgui_left" and "sgui_right".
 * 
 * Theme keys (set by `{@link dusk.simpleGui.setThemeKey}` and `{@link dusk.simpleGui.getThemeKey}` set the default value of properties of a component.
 *	When an object that requires a theme key is first inited, then it will set those keys (if they do not exist) to a default value.
 * 	Any new object created will take the values from the theme.
 * 	The theme keys each component uses should be documented in the component's documentation.
 * 
 * There are several "standard" theme keys:
 * - border - The colour of a border round some components.
 * - borderActive - The colour of an active border for some components.
 * - box - The colour of a background box for anything that needs a background.
 * 
 * Component paths also exist, these paths are similar to file names and allow you to specify one component relative to another.
 * 	From an example container "X" in another container "Y", which itself is in a pane "Z", and with children "a", "b" and "c", with "c" having children "c1" and "c2" the following paths are as described:
 * 
 * - a - Access the child "a".
 * - c/c1 - Access the child "c1" of the container "c", which is in "X".
 * - ../ - Access this parent, "Y".
 * - /Y - Access the child "Y" in the pane "Z".
 */

/** Initiates the simpleGui system.
 * 
 * @private
 */
dusk.simpleGui._init = function() {
	//Listen for keypresses
	dusk.keyboard.keyPress.listen(function e_keypress(event) {
		this.getActivePane().keypress(event);
	}, this);
	
	//Listen for frame events
	dusk.frameTicker.onFrame.listen(function e_onFrame() {
		if(this.displayMode == 1) {
			this.width = $("#"+dusk.canvas).parent().width();
			if($("#"+dusk.canvas).parent().height() > window.innerHeight) {
				this.height = window.innerHeight;
			}else{
				this.height = $("#"+dusk.canvas).parent().height();
			}
		}
		
		for(var p in this._panes){
			this._panes[p].frame();
		}
	}, this);

	/** All the planes.
	 * 
	 * Property names are the names of panes.
	 * 
	 * @type array
	 * @private
	 */
	this._panes = {};
	/** The name of the currently active pane.
	 * 
	 * @type string
	 * @private
	 */
	this._activePane = "";
	/** If true then the frame handler will draw all the components again. Is set to true by `{@link dusk.simpleGui.bookRedraw}`.
	 * 
	 * @type boolean
	 * @private
	 */
	this._redrawBooked = false;
	
	/* * The current width of the canvas.
	 * 
	 * @type integer
	 * /
	this.width = $("#"+dusk.canvas)[0].width;
	/** The current height of the canvas.
	 * 
	 * @type integer
	 * /
	this.height = $("#"+dusk.canvas)[0].height;*/
	
	/** Fires when this renders a new frame.
	 * 
	 * The event object is empty.
	 * 
	 * @type dusk.EventDispatcher
	 */
	this.onRender = new dusk.EventDispatcher("onRender");
	
	/** A cached canvas drawn to before the real one, to improve performance.
	 * 
	 * @type HTMLCanvasElement
	 * @private
	 */
	this._cacheCanvas = document.createElement("canvas");

	/** The theme data, in expected name:value form.
	 * 
	 * @type object
	 * @private
	 */
	this._themeData = {};
	this.setThemeKey("box", "#eeeeee");
	this.setThemeKey("border", "#cccccc");
	this.setThemeKey("borderActive", "#ff5555");
	
	//Set up the cached canvas
	this._cacheCanvas.height = this.height;
	this._cacheCanvas.width = this.width;
	this._cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	this._cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").imageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").textBaseline = "middle";
	
	//Set and create the currently active plane.
	this.setActivePane("blank");
	
	//Controls
	dusk.controls.addControl("sgui_up", 38, "1-0.5");
	dusk.controls.addControl("sgui_down", 40, "1+0.5");
	dusk.controls.addControl("sgui_left", 37, "0+0.5");
	dusk.controls.addControl("sgui_right", 39, "0-0.5");
	dusk.controls.addControl("sgui_action", 65, 0);
	
	this.displayMode = 1;
	
	dusk.simpleGui._draw();
};

/** Returns or creates a pane.
 * 
 * @param {string} name The name of the pane to get or create.
 * @param {?boolean} noNew If this is `true`, then a new pane will not be created, otherwise a new pane will be created if it does not exist.
 * @return {?dusk.sgui.Pane} The pane, or `null` if it doesn't exist and `noNew` is `true`.
 */
dusk.simpleGui.getPane = function(name, noNew) {
	if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	
	if(!noNew) {
		this._panes[name.toLowerCase()] = new dusk.sgui.Pane(this, name);
		return this._panes[name.toLowerCase()];
	}
	
	return null;
};

/** Sets the currently active pane. This is the only one that will recieve keypresses.
 * 
 * @param {string} to The name of the pane to set to the active one.
 */
dusk.simpleGui.setActivePane = function(to) {
	if(this.getActivePane()) this.getActivePane().onDeactive();
	this.getPane(to);
	this._activePane = to.toLowerCase();
	this.getActivePane().onActive();
};

/** Returns the currently active pane.
 * 
 * @return {dusk.sgui.Pane} The currently active pane.
 */
dusk.simpleGui.getActivePane = function() {
	return this._panes[this._activePane];
};

/** Draws all the panes onto the main canvas specified, and fires the onRender event.
 * 
 * This will be called whenever `requestAnimationFrame` tells it to, which should be 60 frames a second.
 * 
 * @return {boolean} Whether any changes were made.
 */
dusk.simpleGui._draw = function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	requestAnimationFrame(dusk.simpleGui._draw);
	
	//if(/*!this._redrawBooked || */!dusk.actions.getVar("sys.sg.drawable")) return false;

	$("#"+dusk.canvas)[0].getContext("2d").clearRect(0, 0, dusk.simpleGui.width, dusk.simpleGui.height);
	dusk.simpleGui._cacheCanvas.getContext("2d").clearRect(0, 0, dusk.simpleGui.width, dusk.simpleGui.height);
	
	//Draw panes
	//var input;
	for(var c in dusk.simpleGui._panes){
		/*input = this._panes[c].draw();
		if(!input || !this._panes[c].width || !this._panes[c].height) continue;
		this._cacheCanvas.getContext("2d").drawImage(input, this._panes[c].x, this._panes[c].y, this._panes[c].width, this._panes[c].height);*/
		
		dusk.simpleGui._panes[c].draw(dusk.simpleGui._cacheCanvas.getContext("2d"));
	}

	$("#"+dusk.canvas)[0].getContext("2d").drawImage(dusk.simpleGui._cacheCanvas, 0, 0, dusk.simpleGui.width, dusk.simpleGui.height);
	dusk.simpleGui._redrawBooked = false;
	
	dusk.simpleGui.onRender.fire({});

	return true;
};

/** Resolves a path.
 * 
 * The path from this function must contain a colon, all text to the left of the colon will be the pane to start off with, and all text to the right will be a standard path.
 * 
 * @param {string} path The path to resolve.
 * @return {dusk.sgui.Component} The component the path represents.
 */
dusk.simpleGui.path = function(path) {
	if(path.indexOf(":") !== -1) {
		console.error("Tried to set an invalid path (no colon): "+path);
		return null;
	}
	var pane = path.split(":", 1)[0];
	path = path.substr(pane.length+1);
	return this.getPane(pane).path(path);
};

/** Requests that the display be updated; this will cause simpleGui to redraw the screen.
 */
dusk.simpleGui.bookRedraw = function() {
	this._redrawBooked = true;
};

/** Sets a theme key with the specified value.
 * 
 * @param {string} name The name of the key to set.
 * @param {object} value The value to set this key.
 */
dusk.simpleGui.setThemeKey = function(name, value) {
	this._themeData[name] = value;
};

/** Returns the value of a theme key.
 * 
 * @param {string} name The name of the key to look up.
 * @return {object} The value of that key.
 */
dusk.simpleGui.getThemeKey = function(name) {
	return this._themeData[name];
};

dusk.simpleGui.__defineSetter__("width", function s_width(value) {
	if(value == this.width) return;
	
	$("#"+dusk.canvas)[0].width = value;
	this._cacheCanvas.width = this.width;
});
dusk.simpleGui.__defineGetter__("width", function g_width(value) {
	return $("#"+dusk.canvas)[0].width;
});

dusk.simpleGui.__defineSetter__("height", function s_height(value) {
	if(value == this.height) return;
	
	$("#"+dusk.canvas)[0].height = value;
	this._cacheCanvas.height = this.height;
});
dusk.simpleGui.__defineGetter__("height", function g_height(value) {
	return $("#"+dusk.canvas)[0].height;
});

//Init the simpleGui
dusk.simpleGui._init();
