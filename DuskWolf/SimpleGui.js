//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Pane");
dusk.load.require("dusk.keyboard");
dusk.load.require("dusk.frameTicker");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.controls");
dusk.load.require("dusk");

dusk.load.provide("dusk.sgui");

/** @namespace dusk.sgui
 * @name dusk.sgui
 * 
 * @description This module contains a SimpleGui system, allowing for canvas UIs.
 * 
 * Generally, everything in the Simple GUI system is a subclass of `{@link sgui.Component}.
 * 	All components are in a parent component that implements `{@link sgui.IContainer}`,
 *   until you get to the top, which are containers of type `{@link sgui.Pane}`.
 * 	Components are things that are displayed, such as images or text,
 *   each has a draw function that lets them draw directly to a canvas, rotated and offseted already for them.
 * 
 * Containers allow you to define their contents as JSON objects (but only for simple properties),
 *   or you can simply use refrences to the objects themselves.
 * 	If you use JSON, the property names of the JSON keys generally match up to the property names of the components.
 * 	You cannot call functions using JSON, only modify the properties at the current time.
 * 
 * In the JSON, if you are describing a group's children, each child element must contain a `name` and `type` property.
 * 	This is the name and type of the object, surprisingly.
 * 	`type` must be a valid type (extends `{@link dusk.sgui.Component}` and be in the namespace `{@link dusk.sgui}`.
 * 
 * Components can be "active", a component which is active will receive keyboard events,
 *   and should act like the user is paying attention to it.
 * 	When a component becomes active, it's `{@link sgui.Component.onActive} method is called,
 *   when it looses it, {@link sgui.Component.onDeactive} is called.
 * 	For a component to be active, all it's parent groups must be too.
 * 
 * Components can also be "focused", focused components will be made active when the container it is in becomes active.
 * 	Focus is generally changed by the arrow keys (only active components can handle key events, remember),
 *   though this can be remapped using `{@link dusk.controls}`.
 * 	If a direction key is pressed, a function like `{@link sgui.Component.upAction}` returns true,
 *   and a variable like `{@link upFlow}` is not empty, focus changes to the named element in this one's container.
 *	The arrow keys can be overriden by using the controls "sgui_up", "sgui_down", "sgui_left" and "sgui_right".
 * 
 * Component paths also exist, these paths are similar to file names
 *   and allow you to specify one component relative to another.
 * 	From an example container "X" in another container "Y", which itself is in a pane "Z",
 *   and with children "a", "b" and "c", with "c" having children "c1" and "c2" the following paths are as described:
 * 
 * - a - Access the child "a".
 * - c/c1 - Access the child "c1" of the container "c", which is in "X".
 * - ../ - Access this parent, "Y".
 * - /Y - Access the child "Y" in the pane "Z".
 * 
 * This namespace registeres the following controls for `{@link dusk.controls}`:
 * 
 * `dusk_up`, `dusk_down`, `dusk_left` and `dusk_right` are the controls used to change the active component,
 *   these are the arrow keys or first stick by default.
 * `dusk_action` is used to trigger the "action" event on a component, this is by default the `a` key, or button 0.
 */

/** Initiates the simpleGui system.
 * 
 * @private
 */
dusk.sgui._init = function() {
	//Listen for keypresses
	dusk.keyboard.keyPress.listen(function(event) {
		if(this.getActivePane()) this.getActivePane().doKeyPress(event);
	}, this);
	
	//Listen for frame events
	dusk.frameTicker.onFrame.listen(function() {
		if(dusk.sgui.displayMode == dusk.sgui.MODE_FULL) {
			dusk.sgui.width = $("#"+dusk.canvas).parent().width();
			if($("#"+dusk.canvas).parent().height() > window.innerHeight) {
				dusk.sgui.height = window.innerHeight;
			}else{
				dusk.sgui.height = $("#"+dusk.canvas).parent().height();
			}
		}
		
		for(var p in dusk.sgui._panes){
			dusk.sgui._panes[p].frame.fire();
		}
	}, this);

	/** All the planes.
	 * 
	 * Property names are the names of panes, and the values are the actual panes.
	 * @type array
	 * @private
	 */
	this._panes = {};
	/** The name of the currently active pane.
	 * @type string
	 * @private
	 */
	this._activePane = "";
	
	/** The current width of the canvas.
	 * @type integer
	 */
	this.width = $("#"+dusk.canvas)[0].width;
	/** The current height of the canvas.
	 * @type integer
	 */
	this.height = $("#"+dusk.canvas)[0].height;
	
	/** Fires when the simpleGui system is about to draw a new frame.
	 * 
	 * The event object is empty.
	 * @type dusk.EventDispatcher
	 */
	this.onRender = new dusk.EventDispatcher("onRender");
	
	/** A cached canvas drawn to before the real one, to improve performance.
	 * @type HTMLCanvasElement
	 * @private
	 */
	this._cacheCanvas = document.createElement("canvas");
	
	/** An object containing all the styles, the key is the selector, and the value is the props.
	 * @type object
	 * @private
	 * @since 0.0.17-alpha
	 */
	this._styleData = {};
	
	/** An object containing all the component types that can be used.
	 *  The key is the name of the component, while the value is the constructor.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._types = {};
	
	/** An object containing all the extras that can be used.
	 *  The key is the extra name, while the value is the constructor.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._extras = {};
	
	/** The display mode of the canvas; this determines how the canvas will resize.
	 *	Must be one of the `dusk.sgui.MODE_*` constants.
	 * @type integer
	 * @default `{@link dusk.sgui.MODE_FIXED}`
	 */
	this.displayMode = dusk.sgui.MODE_FIXED;
	
	//Set up the cached canvas
	this._cacheCanvas.height = this.height;
	this._cacheCanvas.width = this.width;
	this._cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	this._cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").imageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").textBaseline = "middle";
	
	//Controls
	dusk.controls.addControl("sgui_up", 38, "1-0.5");
	dusk.controls.addControl("sgui_down", 40, "1+0.5");
	dusk.controls.addControl("sgui_left", 37, "0+0.5");
	dusk.controls.addControl("sgui_right", 39, "0-0.5");
	dusk.controls.addControl("sgui_action", 65, 0);
	
	dusk.sgui._draw();
};

/** A display mode that represents that the canvas will not change it's size at all.
 * @type integer
 * @constant
 * @value 0
 */
dusk.sgui.MODE_FIXED = 0;
/** A display mode that represents that the canvas will change it's size
 *  in order to fill up the whole screen, if possible.
 * @type integer
 * @constant
 * @value 1
 */
dusk.sgui.MODE_FULL = 1;


/** Returns or creates a pane.
 * @param {string} name The name of the pane to get or create.
 * @param {?boolean} noNew If this is `true`, then a new pane will not be created,
 *  otherwise a new pane will be created if it does not exist.
 * @return {?dusk.sgui.Pane} The pane, or `null` if it doesn't exist and `noNew` is `true`.
 */
dusk.sgui.getPane = function(name, noNew) {
	if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	
	if(!noNew) {
		this._panes[name.toLowerCase()] = new dusk.sgui.Pane(this, name);
		return this._panes[name.toLowerCase()];
	}
	
	return null;
};

/** Sets the currently active pane. This is the only one that will recieve keypresses.
 * @param {string} to The name of the pane to set to the active one.
 */
dusk.sgui.setActivePane = function(to) {
	if(this.getActivePane()) {
		this.getActivePane().onActiveChange.fire({"active":false});
		this.getActivePane().onFocusChange.fire({"focus":true});
	}
	this.getPane(to);
	this._activePane = to.toLowerCase();
	this.getActivePane().onActiveChange.fire({"active":true});
	this.getActivePane().onFocusChange.fire({"focus":true});
};

/** Returns the currently active pane.
 * @return {dusk.sgui.Pane} The currently active pane.
 */
dusk.sgui.getActivePane = function() {
	if(this._activePane === "") return null;
	return this._panes[this._activePane];
};

/** Draws all the panes onto the main canvas specified, and fires the onRender event.
 * 
 * This will be called whenever `requestAnimationFrame` tells it to, which should be 60 frames a second.
 * @return {boolean} Whether any changes were made.
 * @private
 */
dusk.sgui._draw = function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame 
	|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	requestAnimationFrame(dusk.sgui._draw);
	if(!dusk.started) return;

	$("#"+dusk.canvas)[0].getContext("2d").clearRect(0, 0, dusk.sgui.width, dusk.sgui.height);
	dusk.sgui._cacheCanvas.getContext("2d").clearRect(0, 0, dusk.sgui.width, dusk.sgui.height);
	
	//Draw panes
	for(var c in dusk.sgui._panes){
		var data = {};
		data.alpha = 1;
		data.sourceX = 0;
		data.sourceY = 0;
		data.destX = dusk.sgui._panes[c].x;
		data.destY = dusk.sgui._panes[c].y;
		data.width = dusk.sgui._panes[c].width;
		data.height = dusk.sgui._panes[c].height;
		dusk.sgui._panes[c].draw(data, dusk.sgui._cacheCanvas.getContext("2d"));
	}

	$("#"+dusk.canvas)[0].getContext("2d").drawImage(dusk.sgui._cacheCanvas, 0, 0, dusk.sgui.width, dusk.sgui.height);	
	dusk.sgui.onRender.fire({});

	return true;
};

/** Resolves a path.
 * 
 * The path from this function must contain a colon, all text to the left of the colon will be the pane to path from
 *  and all text to the right will be a standard path.
 * @param {string} path The path to resolve.
 * @return {dusk.sgui.Component} The component the path represents.
 */
dusk.sgui.path = function(path) {
	if(path.indexOf(":") === -1) {
		console.error("Tried to set an invalid path (no colon): "+path);
		return null;
	}
	var pane = path.split(":", 1)[0];
	path = path.substr(pane.length+1);
	return this.getPane(pane).path(path);
};

/** A pattern used to select styles.
 * @type RegExp
 * @private
 * @since 0.0.17-alpha
 */
dusk.sgui._stylePattern =
 /(?:([^\.#\[]+))?(?:\.([^#\.\[]+))?(?:#([^\.\#\[]+))?(?:\[([^\=\~\|\^\*\$]+)([\~\|\^\*\$])?=([^\]]+)\])?/gi;

/** Adds a new style.
 * 
 * The properties will be the ones assigned, and is an object.
 * @param {string} selector The selector to style.
 * @param {object} props The props to set.
 * @since 0.0.17-alpha
 */
dusk.sgui.addStyle = function(selector, props) {
	dusk.sgui._styleData[selector] = [[], props];
	var fragments = selector.split(/>/gi);
	for(var i = 0; i < fragments.length; i ++) {
		dusk.sgui._stylePattern.lastIndex = 0;
		dusk.sgui._styleData[selector][0].push(dusk.sgui._stylePattern.exec(fragments[i]));
	}
};

/** Get all style rules that match a specified component.
 * 
 * Each is in the form `[selector, props]`, where props is an object.
 * @param {dusk.sgui.Component} com The component to get the styles for.
 * @return {array} An array of style objects that should be applied to the component.
 * @since 0.0.17-alpha
 */
dusk.sgui.getStyles = function(com) {
	var matchedStyles = [];
	
	for(var s in dusk.sgui._styleData) {
		var hold = com;
		var current = null;
		var valid = true;
		var p = dusk.sgui._styleData[s][0].length;
		while(current = dusk.sgui._styleData[s][0][--p]) {
			if((current[1] && dusk.sgui.getType(current[1]) && !(hold instanceof dusk.sgui.getType(current[1])))
			|| (current[2] && !Array.isArray(hold.style) && hold.style != current[2])
			|| (current[2] && Array.isArray(hold.style) && current[2] in hold.style)
			|| (current[3] && hold.comName != current[3])) {
				valid = false;
				break;
			}
			
			hold = hold.container;
		}
		
		if(valid) matchedStyles.push(dusk.sgui._styleData[s][1]);
	}
	
	return matchedStyles;
};

/** Apply all styles to the specified component that match it.
 * @param {dusk.sgui.Component} com The component to apply styles to.
 * @since 0.0.17-alpha
 */
dusk.sgui.applyStyles = function(com) {
	var styles = dusk.sgui.getStyles(com);
	
	for(var i = 0; i < styles.length; i ++) {
		com.parseProps(styles[i]);
	}
};

/** Adds a new type that can be added by specifying it's type. The component must be registered before use.
 * @param {string} name The name of the added type.
 * @param {class(dusk.sgui.Component, string) extends dusk.sgui.Component} type The type to add.
 * @since 0.0.17-alpha
 */
dusk.sgui.registerType = function(name, type) {
	this._types[name] = type;
};

/** Returns a constructor for the specified component, 
 *  provided it has been registered beforehand with {@link dusk.sgui.registerType}.
 * @param {string} name The name of the type to look up.
 * @return {?class(dusk.sgui.Component, string) extends dusk.sgui.Component} A constructor for the specified type,
 *  or null if it doesn't exist.
 * @since 0.0.17-alpha
 */
dusk.sgui.getType = function(name) {
	if(!(name in this._types)) return null;
	return this._types[name];
};

/** Given a component, this returns the name it's constructor was registered as.
 * 
 * @param {dusk.sgui.Component} com The component to look up.
 * @return {?string} The name that component was registered under, or null if it hasn't been registered.
 * @since 0.0.18-alpha
 */
dusk.sgui.getTypeName = function(com) {
	for(var p in this._types) {
		if(Object.getPrototypeOf(com) == this._types[p].prototype) {
			return p;
		}
	}
	
	return null;
};


/** Adds a new extra that can be accessed using `{@link dusk.sgui.getExtra}`.
 * @param {string} name The name of the added extra.
 * @param {class(dusk.sgui.Component, string) extends dusk.sgui.extras.Extra} extra The extra to add.
 * @since 0.0.18-alpha
 */
dusk.sgui.registerExtra = function(name, extra) {
	this._extras[name] = extra;
};

/** Returns a constructor for the specified extra,
 *  provided it has been registered beforehand with `{@link dusk.sgui.registerExtra}`.
 * @param {string} name The name of the extra to look up.
 * @return {?class(dusk.sgui.Component, string) extends dusk.sgui.extra.Extra} A constructor for the specified extra,
 *  or null if it doesn't exist.
 * @since 0.0.18-alpha
 */
dusk.sgui.getExtra = function(name) {
	if(!(name in this._extras)) return null;
	return this._extras[name];
};

//width
Object.defineProperty(dusk.sgui, "width", {
    set:function(value) {
    	if(value == this.width) return;
    	
    	$("#"+dusk.canvas)[0].width = value;
    	this._cacheCanvas.width = this.width;
    },
    
    get: function() {
	    return $("#"+dusk.canvas)[0].width;
    }
});

//height
Object.defineProperty(dusk.sgui, "height", {
	set:function(value) {
		if(value == this.height) return;
		
		$("#"+dusk.canvas)[0].height = value;
		this._cacheCanvas.height = this.height;
	},
	
	get:function() {
		return $("#"+dusk.canvas)[0].height;
	}
});

//Init the simpleGui
dusk.sgui._init();
