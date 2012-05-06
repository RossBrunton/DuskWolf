//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

__import__("sgui/__init__.js");
loadComponent("Pane");

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
 * sys-sg-width			- The width of the canvas, as read from the canvas DOM object. Changing this will not affect the canvas.
 * sys-sg-height		- The height of the canvas, as read from the canvas DOM object. Changing this will not affect the canvas.
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
 * Constructor, creates a new instance of this, adding all the handlers and initing the vars.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.SimpleGui = function(events) {
	mods.IModule.call(this, events);
	
	this._events.registerKeyHandler("SGuiKey", function(event) {
		this.getActivePane().keypress(event);
	}, this);
	
	this._events.registerFrameHandler("SGuiFrame", function(e) {
		for(var p in this._panes){
			this._panes[p].frame(e);
		}
	}, this);
	
	this._events.registerFrameHandler("SGuiDrawer", this.draw, this);
	
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
	
	this._events.setVar("sys.sg.width", $("#"+duskWolf.canvas)[0].width);
	this._events.setVar("sys.sg.height", $("#"+duskWolf.canvas)[0].height);
	
	/*- Variable: _cacheCanvas
	 * [HTMLCanvas] A cached canvas drawn to before the real one, to improve performance.
	 **/
	this._cacheCanvas = document.createElement("canvas");
	this._cacheCanvas.height = this._events.getVar("sys.sg.height");
	this._cacheCanvas.width = this._events.getVar("sys.sg.width");
	this._cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	this._cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").textBaseline = "middle";
	
	//Themes
	this._events.setVar("theme.default.box", "#eeeeee");
	this._events.setVar("theme.default.border", "#cccccc");
	this._events.setVar("theme.default.borderActive", "#ff5555");
	
	this._events.setVar("theme.current", "default");
};
mods.SimpleGui.prototype = new mods.IModule();
mods.SimpleGui.constructor = mods.SimpleGui;

/** Function: addActions
 * 
 * Registers the actions and sets the vars this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.SimpleGui.prototype.addActions = function() {
	this._events.registerAction("sg-path", this._doPath, this);
	this._events.registerAction("pane", this._doComponent, this);
	this._events.registerAction("draw", function(data){this.draw();}, this);
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
mods.SimpleGui.prototype.newPane = function(name) {
	//Check if it exists
	if(this.getPane(name, true)){duskWolf.error("Pane "+name+" already exists!");return null;}
	
	//Create the pane
	this._panes[name.toLowerCase()] = new sgui.Pane(this, this._events, name);
	
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
mods.SimpleGui.prototype.getPane = function(name, noNew) { //Returns pane
	if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	return noNew?null:this.newPane(name);
};

mods.SimpleGui.prototype._doComponent = function(data) {
	if(data.name === undefined) {duskWolf.error("No name given for a pane.");return;}
	this.getPane(data.name).parseProps(this._events.replaceVar(data, true), this._events.thread);
};

mods.SimpleGui.prototype.setActivePane = function(to) {
	if(this.getActivePane()) this.getActivePane().onDeactive();
	this.getPane(to);
	this._activePane = to.toLowerCase();
	this.getActivePane().onActive();
};

mods.SimpleGui.prototype.getActivePane = function() {
	return this._panes[this._activePane];
};

mods.SimpleGui.prototype.draw = function() {
	if(!this._redrawBooked) return false;
	
	$("#"+duskWolf.canvas)[0].getContext("2d").clearRect(0, 0, this._events.getVar("sys.sg.width"), this._events.getVar("sys.sg.height"));
	this._cacheCanvas.getContext("2d").clearRect(0, 0, this._events.getVar("sys.sg.width"), this._events.getVar("sys.sg.height"));
	
	//Draw panes
	for(var c in this._panes){
		this._panes[c].draw(this._cacheCanvas.getContext("2d"));
	}
	
	$("#"+duskWolf.canvas)[0].getContext("2d").drawImage(this._cacheCanvas, 0, 0, this._events.getVar("sys.sg.width"), this._events.getVar("sys.sg.height"));
	this._redrawBooked = false;
	
	this._render();
	
	return true;
};

mods.SimpleGui.prototype._render = function(event) {
	$("#"+duskWolf.canvas)[0].getContext("2d").drawImage(this._cacheCanvas, 0, 0, this._events.getVar("sys.sg.width"), this._events.getVar("sys.sg.height"));
};

mods.SimpleGui.prototype._doPath = function(action) {
	if(!action.path){duskWolf.error("No path given!");return;}
	if(!action.pane){duskWolf.error("No pane given!");return;}
	
	this.path(action.pane, action.path).parseProps(action, this._events.thread);
};

mods.SimpleGui.prototype.path = function(pane, path) {
	return this.getPane(pane).path(path);
};

mods.SimpleGui.prototype.bookRedraw = function() {
	this._redrawBooked = true;
};
