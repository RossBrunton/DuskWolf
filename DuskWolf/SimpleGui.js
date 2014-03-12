//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Pane");
dusk.load.require("dusk.keyboard");
dusk.load.require("dusk.frameTicker");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.controls");
dusk.load.require("dusk");
dusk.load.require("dusk.sgui.c");

dusk.load.provide("dusk.sgui");
dusk.load.provide("dusk.pause");

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
 * 	`type` must be a valid type (extends `{@link dusk.sgui.Component}` and be registered using 
 * `{@link dusk.sgui.registerType}`).
 * 
 * Components can be "active", a component which is active will receive keyboard events,
 *   and should act like the user is paying attention to it.
 * 	When a component changes whether it is active, its `{@link dusk.sgui.Component.onActiveChange}` event is fired.
 * 	For a component to be active, all it's parent groups must be too.
 * 
 * Components can also be "focused", focused components will be made active when the container it is in becomes active.
 * 	Focus is generally changed by the arrow keys (only active components can handle key events, remember),
 *   though this can be remapped using `{@link dusk.controls}`.
 * 	If a direction key is pressed, a function like `{@link sgui.Component.upAction}` returns true,
 *   and a variable like `{@link upFlow}` is not empty, focus changes to the named element in this one's container.
 *	The arrow keys can be overriden by using the controls "sgui_up", "sgui_down", "sgui_left" and "sgui_right".
 *  If a component changes whether it is focused , its `{@link dusk.sgui.Component.onFocusChange}` event will fire.
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
 * - Z:/Y - Directly accesses Y from the pane.
 * 
 * Components can be styled similarly to CSS. When a new component is created, the list of styles (Set by 
 * `{@dusk.sgui.addStyle}` is checked. If it matches that component, all the properties in the object set with the style
 * will be applied to the object (see the JSON representation above). This only occurs when the object is created or
 * its type changes, it won't happen at any other time. The syntax for a rule contains the following, they must be in 
 * this order, but are all optional: 
 * 
 * - `typename` - The name of the component's type, as registered using `{@link dusk.sgui.registerType}`.
 * - `.style` - The value of, or one of the values of, the component's `{@link dusk.sgui.Component.style}` property.
 * - `#name` - The component's name.
 * - `[prop=value]` - The property must equal the value, the property is a name that can be looked up using the JSON 
 *  representation, and must equal the value. At the moment only `=` is supported, and there can only be one of these.
 * 
 * Concisely, `typename.style#name[prop=value]`.
 * 
 * Components can also have "extras" which are essentially objects that are bolted onto components and give them extra
 * functionality. They are stored on the component, and are deleted when the component is, or on their own accord.
 * Extras are added to components using `{@link dusk.sgui.Component#addExtra}`, removed using
 * `{@link dusk.sgui.Component#removeExtra}` and retreived using `{@link dusk.sgui.Component#getExtra}`.
 * 
 * Mouse control is also supported for components. A component will be able to see the mouse location, relative to
 * themselves in their `{@link dusk.sgui.Component._mouseX}` and `{@link dusk.sgui.Component._mouseY}` properties.
 * If the property `{@link dusk.sgui.Component.allowMouse}` is true, then rolling over the component will set the focus
 * to that component, whether the default is true depends on the component's type. If
 * `{@link dusk.sgui.Component.mouseAction}` is true, then clicking on the component will fire its
 * `{@link dusk.sgui.Component.action}` event.
 * 
 * This namespace registers the following controls for `{@link dusk.controls}`:
 * 
 * - `dusk_up`, `dusk_down`, `dusk_left` and `dusk_right` are the controls used to change the active component,
 *   these are the arrow keys or first stick by default.
 * - `dusk_action` is used to trigger the "action" event on a component, this is by default the `a` key, or button 0.
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
	
	//Listen for mouseclicks
	$("#"+dusk.elemPrefix+"-canvas").click(function(e) {
		e.button = e.which;
		if(dusk.sgui.getActivePane()) dusk.sgui.getActivePane().doClick(e);
	});
	
	//Listen for frame events
	dusk.frameTicker.onFrame.listen(function(e) {
		if(dusk.sgui.displayMode == dusk.sgui.MODE_FULL) {
			dusk.sgui.width = $("#"+dusk.elemPrefix).parent().width();
			if($("#"+dusk.elemPrefix).parent().height() > window.innerHeight) {
				dusk.sgui.height = window.innerHeight;
			}else{
				dusk.sgui.height = $("#"+dusk.elemPrefix).parent().height();
			}
		}
		
		for(var p = dusk.sgui._panes.length-1; p >= 0; p --){
			dusk.sgui._panes[p].updateMouse(
				dusk.sgui._mouseX - dusk.sgui._panes[p].x,
				dusk.sgui._mouseY - dusk.sgui._panes[p].y
			);
		}
		
		for(var p = dusk.sgui._panes.length-1; p >= 0; p --){
			dusk.sgui._panes[p].frame.fire();
		}
	}, this);

	/** All the planes.
	 * @type array
	 * @private
	 */
	this._panes = [];
	/** The name of the currently active pane.
	 * @type string
	 * @private
	 */
	this._activePane = "";
	
	/** The current width of the canvas.
	 * @type integer
	 */
	this.width = dusk.sgui._getCanvas().width;
	/** The current height of the canvas.
	 * @type integer
	 */
	this.height = dusk.sgui._getCanvas().height;
	
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
	
	/** Mouse x value relative to canvas.
	 * @type integer
	 * @private
	 * @since 0.0.20-alpha
	 */
	this._mouseX = 0;
	/** Mouse y value relative to canvas.
	 * @type integer
	 * @private
	 * @since 0.0.20-alpha
	 */
	this._mouseY = 0;
	
	/** Object pool containing objects for `{@link dusk.sgui._draw}` and the draw handlers of containers.
	 * 
	 * Properties will not be deleted when freed.
	 * 
	 * @type dusk.Pool<Object>
	 * @since 0.0.21-alpha
	 */
	this.drawDataPool = new dusk.Pool(Object);
	
	//Set up the cached canvas
	this._cacheCanvas.height = this.height;
	this._cacheCanvas.width = this.width;
	this._cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	this._cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").imageSmoothingEnabled = false;
	this._cacheCanvas.getContext("2d").textBaseline = "middle";
	
	//Listen for canvas mouse movements
	dusk.sgui._getCanvas().addEventListener("mousemove", function(e){
		dusk.sgui._mouseX = e.clientX;
		dusk.sgui._mouseY = e.clientY;
	});
	
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

/** Returns the canvas element that sgui is using.
 * 
 * @return {HTMLCanvasElement} The canvas.
 * @private
 * @since 0.0.21-alpha
 */
dusk.sgui._getCanvas = function() {
	return document.getElementById(dusk.elemPrefix+"-canvas");
};

/** Returns the duskwolf element that contains the canvas sgui is using.
 * 
 * @return {dusk.HTMLDuskwolfElement} The canvas.
 * @private
 * @since 0.0.21-alpha
 */
dusk.sgui._getDuskwolf = function() {
	return document.getElementById(dusk.elemPrefix);
};

/** Returns or creates a pane.
 * @param {string} name The name of the pane to get or create.
 * @param {?boolean} noNew If this is `true`, then a new pane will not be created,
 *  otherwise a new pane will be created if it does not exist.
 * @return {?dusk.sgui.Pane} The pane, or `null` if it doesn't exist and `noNew` is `true`.
 */
dusk.sgui.getPane = function(name, noNew) {
	//if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
	for(var p = this._panes.length-1; p >= 0; p --) {
		if(this._panes[p].comName == name.toLowerCase()) return this._panes[p];
	}
	
	if(!noNew) {
		this._panes.push(new dusk.sgui.Pane(this, name));
		return this._panes[this._panes.length-1];
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
	return this.getPane(this._activePane);
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

	dusk.sgui._getCanvas().getContext("2d").clearRect(0, 0, dusk.sgui.width, dusk.sgui.height);
	dusk.sgui._cacheCanvas.getContext("2d").clearRect(0, 0, dusk.sgui.width, dusk.sgui.height);
	
	//Draw panes
	for(var c = 0; c < dusk.sgui._panes.length; c ++){
		var data = dusk.sgui.drawDataPool.alloc();
		data.alpha = 1;
		data.sourceX = 0;
		data.sourceY = 0;
		data.destX = dusk.sgui._panes[c].x;
		data.destY = dusk.sgui._panes[c].y;
		data.width = dusk.sgui._panes[c].width;
		data.height = dusk.sgui._panes[c].height;
		
		dusk.sgui._panes[c].draw(data, dusk.sgui._cacheCanvas.getContext("2d"));
		dusk.sgui.drawDataPool.free(data);
	}

	dusk.sgui._getCanvas().getContext("2d").drawImage(dusk.sgui._cacheCanvas,
		0, 0, dusk.sgui.width, dusk.sgui.height
	);	
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
			|| (current[3] && hold.comName != current[3])
			|| (current[4] && !current[5] && hold.prop(current[4]) != current[6])) {
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
    	
    	dusk.sgui._getDuskwolf().setAttribute("width", value);
    	dusk.sgui._getCanvas().width = value;
    	this._cacheCanvas.width = this.width;
    },
    
    get: function() {
	    return dusk.sgui._getCanvas().width;
    }
});

//height
Object.defineProperty(dusk.sgui, "height", {
	set:function(value) {
		if(value == this.height) return;
		
		dusk.sgui._getDuskwolf().setAttribute("height", value);
		dusk.sgui._getCanvas().height = value;
		this._cacheCanvas.height = this.height;
	},
	
	get:function() {
		return dusk.sgui._getCanvas().height;
	}
});

//Init the simpleGui
dusk.sgui._init();

//-----

dusk.pause._init = function() {
	dusk.pause._previous = "";
	
	dusk.pause.allow = false;
	
	dusk.controls.addControl("pause", 13, 9);
	dusk.controls.controlPressed.listen(function(e){dusk.pause.toggle();}, this, {"control":"pause"});
};

dusk.pause.pause = function() {
	if(!dusk.pause.allow) return;
	if(!dusk.pause._previous) dusk.pause._previous = dusk.sgui.getActivePane().comName;
	dusk.sgui.setActivePane("paused");
	dusk.sgui.getPane("paused").visible = true;
};

dusk.pause.unpause = function() {
	dusk.sgui.setActivePane(dusk.pause._previous);
	dusk.pause._previous = "";
	dusk.sgui.getPane("paused").visible = false;
};

dusk.pause.isPaused = function() {
	return dusk.pause._previous !== "";
};

dusk.pause.toggle = function() {
	if(dusk.pause.isPaused()) {
		dusk.pause.unpause();
	}else{
		dusk.pause.pause();
	}
};


dusk.pause._init();
Object.seal(dusk.pause);
