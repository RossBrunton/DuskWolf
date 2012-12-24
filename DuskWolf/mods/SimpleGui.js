//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.simpleGui");

dusk.load.require("dusk.sgui.Pane");

/** @namespace dusk.sgui
 * 
 * @description This is the namespace with all the Simple Gui's components in it. Hooray!
 */

/** Class: mods.SimpleGui
 * 
 * This provides a simple system for creating canvas UIs.
 * 
 * Inheritance:
 * 	mods.LocalSaver { <mods.IModule>
 * 
 * Generally, everything in the Simple GUI system is a subclass of <sgui.Component>.
 * 	And all components are in a parent component that implements <sgui.IContainer>, until you get to the top, which are components of type <sgui.Pane>.
 * 	Components are things that are displayed, such as images or text, each has a draw function that lets them draw directly to a canvas, rotated and offseted already for them.
 * 
 * Components are specified as JS objects in their containers, the pane's properties is an event action.
 * 	There is also a sg-path object which allows you to specify objects by filename like paths. 
 * 
 * Components have properties like "x" and "width".
 * 	Properties can be accessed in two ways, one from <sgui.Component.prop>, and one from the actions "pane" and "sg-path".
 * 	For single values, such as "x", they can be specified in the action as either "x":123, "x":{"value":123, "to":"ex"} or "x":{"to":"ex"}, the var specified by "to", in this case "ex", will be set to the value that is being set, or is currently set.
 * 	The value for "to" is done second, so it will set the var to 123 before setting it to to.
 * 	Properties can be any JavaScript type.
 * 	Some properties also take an object, like the float effect which needs "speed", "dir" and "for", in this case the "to"
 * 
 * Two important properties are "name" and "type".
 * 	Each component in a container must have a unique name, which is used to identify it.
 * 	Type is used to decide what component to make if it does not exist, component types cannot be changed.
 * 
 * Components can be "active", a component which is active will receive keyboard events, and should act like the user is looking at it.
 * 	When a component becomes active, it's <sgui.Component.onActive> method is called, when it looses it, <sgui.Component.onDeactive> is called.
 * 	For a component to be active, all it's parent groups must be too.
 * 
 * Components can also be "focused", focused components will be made active when the container it is in becomes active.
 * 	Focus is generally changed by the arrow keys (only active components can handle key events, remember).
 * 	If a direction key is pressed, a function like <sgui.Component.upAction> returns true, and a variable like <upFlow> is not empty, focus changes the element named <sgui.Component.upFlow> in this one's container.
 * 	You can also call the <sgui._container.focus> method of your container, but don't expect to become active.
 * 
 * There are "themes", that control the default value for some properties, you can create your own theme by making a var that inherits "theme.default" on the theme object, and setting theme.current to the string name.
 * 	The class definitions of the component docs should tell you what theme elements you need to override.
 * 
 * Components handle some things, like an action or frame, to do this they must register them, using functions like <sgui.Component._registerFrameHandler> and <sgui.Component._registerAction> with the function they wish to be run when that thing occurs.
 * 
 * Handleable Things:
 * Frame		- Called every frame at the frame rate. Will be called <DuskWolf.frameRate> times a second, unless the computer is lagging.
 * Key			- Called when a key is pressed while the component is active, can be passed a number of arguments saying what key to be pressed, and whether shift or ctrl is required.
 * Action		- Called when the "action key" is pressed while this component is active.
 * Property		- Called when the property is to be processed or recieved.
 * 
 * The paths are similar to file names.
 * 	From an example container "X" in another container "Y", which itself is in a pane, and with children "a", "b" and "c", with "c" having children "c1" and "c2".
 * 
 * a			- Access the child "a".
 * c/c1			- Access the child "c1" of the container "c", which is in "X".
 * ../			- Access this parent "Y".
 * /Y			- Access the child "Y" in the pane.
 * 
 * 
 * 
 * Provided Actions:
 * 
 * > {"a":"pane", "name":"abc", (properties)}
 * Sets the properties of the pane specified by "name", creating a new one if it does not exist.
 * 
 * > {"a":"sg-path", "pane":"abc", "path":"abc", (properties)}
 * Sets the properties of the component specified by the path, from the specified pane.
 * 
 * Supplied Vars:
 * 
 * sys.sg.width			- The width of the canvas, as read from the canvas DOM object. Changing this will not affect the canvas.
 * sys.sg.height		- The height of the canvas, as read from the canvas DOM object. Changing this will not affect the canvas.
 * theme.current		- The current theme, default is "default", surprisingly.
 * 
 * Global Theme Vars:
 * 
 * border				- The colour of a border round some components.
 * borderActive			- The colour of an active border for some components.
 * box 					- The colour of a background box for anything that needs a background.
 * 	
 * 
 * See:
 * * <sgui.Component>
 * * <sgui.Pane>
 * * <sgui.IContainer>
 */

/** Function: mods.SimpleGui
 * 
 * Constructor, creates a new instance of this, adding all the handlers and initing the theme vars.
 */
dusk.mods.simpleGui._init = function() {
	dusk.mods.keyboard.keyPress.listen(function e_keypress(event) {
		this.getActivePane().keypress(event);
	}, this);

	dusk.mods.frameTicker.onFrame.listen(function e_onFrame() {
		for(var p in this._panes){
			this._panes[p].frame();
		}
	}, this);

	/*- Variable: _panes
	 * [Object] All the panes.
	 **/
	this._panes = {};
	/*- Variable: _activePane
	 * [String] The name of the currently active pane.
	 **/
	this._activePane = "";
	/*- Variable: _redrawBooked
	 * [Boolean] If true then the frame handler will draw all the components again. Is set to true by <bookRedraw>.
	 **/
	this._redrawBooked = false;

	this.setActivePane("blank");
	
	this.width = $("#"+dusk.canvas)[0].width;
	this.height = $("#"+dusk.canvas)[0].height;
	
	this.onRender = new dusk.EventDispatcher("onRender");
	
	/*- Variable: _cacheCanvas
	 * [HTMLCanvas] A cached canvas drawn to before the real one, to improve performance.
	 **/
	this._cacheCanvas = document.createElement("canvas");

	//Themes
	this._themeData = {};
	this.setThemeKey("box", "#eeeeee");
	this.setThemeKey("border", "#cccccc");
	this.setThemeKey("borderActive", "#ff5555");
	
	this._cacheCanvas.height = this.height;
	this._cacheCanvas.width = this.width;
	this._cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	this._cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").imageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").textBaseline = "middle";
	
	dusk.mods.simpleGui._draw();
};

/** Function: newPane
 * 
 * [<sgui.Pane>] Creates a new pane, and returns it.
 * 
 * Params:
 *	name		- [String] The name of the new pane.
 * 
 * Returns:
 * 	The newly created pane.
 */
dusk.mods.simpleGui.newPane = function(name) {
	//Check if it exists
	if(this.getPane(name, true)){return this.getPane(name, true);}

	//Create the pane
	this._panes[name.toLowerCase()] = new dusk.sgui.Pane(this, name);

	return this._panes[name.toLowerCase()];
};

/** Function: getPane
 * 
 * [<sgui.Pane>] This returns the pane with the specified name. If it doesn't exist and noNew is false, then a new one is created and returned.
 * 
 * Params:
 *	name		- [String] The name of the new pane.
 * 	noNew		- [Boolean] If true, a new pane is not created, if false (or undefined), then a new one is created.
 * 
 * Returns:
 * 	The pane.
 */
dusk.mods.simpleGui.getPane = function(name, noNew) { //Returns pane
	if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	return noNew?null:this.newPane(name);
};

dusk.mods.simpleGui.setActivePane = function(to) {
	if(this.getActivePane()) this.getActivePane().onDeactive();
	this.getPane(to);
	this._activePane = to.toLowerCase();
	this.getActivePane().onActive();
};

dusk.mods.simpleGui.getActivePane = function() {
	return this._panes[this._activePane];
};

dusk.mods.simpleGui._draw = function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	requestAnimationFrame(dusk.mods.simpleGui._draw);
	
	//if(/*!this._redrawBooked || */!dusk.actions.getVar("sys.sg.drawable")) return false;

	$("#"+dusk.canvas)[0].getContext("2d").clearRect(0, 0, dusk.mods.simpleGui.width, dusk.mods.simpleGui.height);
	dusk.mods.simpleGui._cacheCanvas.getContext("2d").clearRect(0, 0, dusk.mods.simpleGui.width, dusk.mods.simpleGui.height);
	
	//Draw panes
	//var input;
	for(var c in dusk.mods.simpleGui._panes){
		/*input = this._panes[c].draw();
		if(!input || !this._panes[c].width || !this._panes[c].height) continue;
		this._cacheCanvas.getContext("2d").drawImage(input, this._panes[c].x, this._panes[c].y, this._panes[c].width, this._panes[c].height);*/
		
		dusk.mods.simpleGui._panes[c].draw(dusk.mods.simpleGui._cacheCanvas.getContext("2d"));
	}

	$("#"+dusk.canvas)[0].getContext("2d").drawImage(dusk.mods.simpleGui._cacheCanvas, 0, 0, dusk.mods.simpleGui.width, dusk.mods.simpleGui.height);
	dusk.mods.simpleGui._redrawBooked = false;
	
	dusk.mods.simpleGui.onRender.fire({});

	return true;
};

dusk.mods.simpleGui.path = function(path) {
	if(path.indexOf(":") !== -1) {
		console.error("Tried to set an invalid path (no colon): "+path);
		return null;
	}
	var pane = path.split(":", 1)[0];
	path = path.substr(pane.length+1);
	return this.getPane(pane).path(path);
};

dusk.mods.simpleGui.bookRedraw = function() {
	this._redrawBooked = true;
};

dusk.mods.simpleGui.setThemeKey = function(name, value) {
	this._themeData[name] = value;
};

dusk.mods.simpleGui.getThemeKey = function(name) {
	return this._themeData[name];
};

dusk.mods.simpleGui._init();
