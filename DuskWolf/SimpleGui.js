//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui", (function() {
	var Pane = load.require(">dusk.sgui.Pane", function(p){Pane = p});
	var keyboard = load.require("dusk.keyboard");
	var frameTicker = load.require("dusk.frameTicker");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	var controls = load.require("dusk.controls");
	var gamepad = load.require("dusk.gamepad");
	var dusk = load.require("dusk");
	var c = load.require("dusk.sgui.c");
	var options = load.require("dusk.options");
	var Pool = load.require("dusk.Pool");
	
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
	 * `{@link dusk.sgui.addStyle}` is checked. If it matches that component, all the properties in the object set with the
	 *  style will be applied to the object (see the JSON representation above). This only occurs when the object is created
	 * or its type changes, it won't happen at any other time. The syntax for a rule contains the following, they must be in 
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
	var sgui = {}; //Change when ready
	
	/** A display mode that represents that the canvas will not change it's size at all.
	 * @type integer
	 * @constant
	 * @value 0
	 */
	sgui.MODE_FIXED = 0;
	/** A display mode that represents that the canvas will change it's size
	 *  in order to fill up the whole screen, if possible.
	 * @type integer
	 * @constant
	 * @value 1
	 */
	sgui.MODE_FULL = 1;

	/** All the planes.
	 * @type array
	 * @private
	 */
	var _panes = [];
	/** The name of the currently active pane.
	 * @type string
	 * @private
	 */
	var _activePane = "";
	
	/** The current width of the canvas.
	 * @type integer
	 */
	sgui.width = 0;
	/** The current height of the canvas.
	 * @type integer
	 */
	sgui.height = 0;
	
	/** Fires when the simpleGui system is about to draw a new frame.
	 * 
	 * The event object is empty.
	 * @type dusk.EventDispatcher
	 */
	sgui.onRender = new EventDispatcher("onRender");
	
	/** A cached canvas drawn to before the real one, to improve performance.
	 * @type HTMLCanvasElement
	 * @private
	 */
	var _cacheCanvas = document.createElement("canvas");
	
	/** An object containing all the styles, the key is the selector, and the value is the props.
	 * @type object
	 * @private
	 * @since 0.0.17-alpha
	 */
	var _styleData = {};
	
	/** An object containing all the component types that can be used.
	 *  The key is the name of the component, while the value is the constructor.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	var _types = {};
	
	/** An object containing all the extras that can be used.
	 *  The key is the extra name, while the value is the constructor.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	var _extras = {};
	
	/** The display mode of the canvas; this determines how the canvas will resize.
	 *	Must be one of the `dusk.sgui.MODE_*` constants.
	 * @type integer
	 * @default `{@link dusk.sgui.MODE_FIXED}`
	 */
	sgui.displayMode = sgui.MODE_FIXED;
	
	/** Mouse x value relative to canvas.
	 * @type integer
	 * @private
	 * @since 0.0.20-alpha
	 */
	var _mouseX = 0;
	/** Mouse y value relative to canvas.
	 * @type integer
	 * @private
	 * @since 0.0.20-alpha
	 */
	var _mouseY = 0;
	/** Whether the next frame event will also fire a mouse move event.
	 * @type boolean
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _mouseMoveQueued = false;
	
	/** If this is true then the canvas won't be cleaned before every draw. If your components cover all the screen, 
	 *  this is fine, but if they don't, then this will result in graphical oddities.
	 * 
	 *  Setting this true will give a bit of graphical performance.
	 * @type boolean
	 * @since 0.0.21-alpha
	 */
	sgui.noCleanCanvas = false;
	/** If this is true then the cache canvas will not be used, and the drawing will occur right on the screen.
	 * 
	 * This setting probably shouldn't be turned on, but it should give a boost to performance.
	 * @type boolean
	 * @since 0.0.21-alpha
	 */
	sgui.noCacheCanvas = false;
	
	/** Object pool containing objects for `{@link dusk.sgui._draw}` and the draw handlers of containers.
	 * 
	 * Properties will not be deleted when freed.
	 * 
	 * @type dusk.Pool<Object>
	 * @since 0.0.21-alpha
	 */
	sgui.drawDataPool = new Pool(Object);
	
	/** The current frame rate. Maybe some strange value for the first few frames.
	 * @type float
	 * @since 0.0.21-alpha
	 */
	sgui.frameRate = 0;
	/** The timestamp of the last render event.
	 * @type float
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _lastFrame = 0;
	/** True if the screen is running at higher than 90Hz.
	 * @type boolean
	 * @since 0.0.21-alpha
	 */
	sgui.highRate = false;
	/** The number of frames that have elapsed, in total.
	 * @type int
	 * @since 0.0.21-alpha
	 */
	sgui.framesTotal = 0;
	/** If five consecutive frames have a frame rate of higher than 60fps, then `{@link dusk.sgui.highRate}` is set to
	 *  true. This is the current count.
	 * @type int
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _highFrames = 0;
	
	/** Returns the canvas element that sgui is using.
	 * 
	 * @return {HTMLCanvasElement} The canvas.
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _getCanvas = function() {
		return document.getElementById(dusk.elemPrefix+"-canvas");
	};

	/** Returns the duskwolf element that contains the canvas sgui is using.
	 * 
	 * @return {dusk.HTMLDuskwolfElement} The element.
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _getDuskwolf = function() {
		return document.getElementById(dusk.elemPrefix);
	};
	
	/** Returns or creates a pane.
	 * @param {string} name The name of the pane to get or create.
	 * @param {?boolean} noNew If this is `true`, then a new pane will not be created,
	 *  otherwise a new pane will be created if it does not exist.
	 * @return {?dusk.sgui.Pane} The pane, or `null` if it doesn't exist and `noNew` is `true`.
	 */
	sgui.getPane = function(name, noNew) {
		//if(this._panes[name.toLowerCase()]) return this._panes[name.toLowerCase()];
		for(var p = _panes.length-1; p >= 0; p --) {
			if(_panes[p].comName == name) return _panes[p];
		}
		
		if(!noNew) {
			_panes.push(new Pane(this, name));
			return _panes[_panes.length-1];
		}
		
		return null;
	};

	/** Sets the currently active pane. This is the only one that will recieve keypresses.
	 * @param {string} to The name of the pane to set to the active one.
	 */
	sgui.setActivePane = function(to) {
		if(sgui.getActivePane()) {
			sgui.getActivePane().onActiveChange.fire({"active":false});
			sgui.getActivePane().onFocusChange.fire({"focus":true});
		}
		
		sgui.getPane(to);
		_activePane = to.toLowerCase();
		sgui.getActivePane().onActiveChange.fire({"active":true});
		sgui.getActivePane().onFocusChange.fire({"focus":true});
	};

	/** Returns the currently active pane.
	 * @return {dusk.sgui.Pane} The currently active pane.
	 */
	sgui.getActivePane = function() {
		if(_activePane === "") return null;
		return sgui.getPane(_activePane);
	};

	/** Draws all the panes onto the main canvas specified, and fires the onRender event.
	 * 
	 * This will be called whenever `requestAnimationFrame` tells it to, which should be 60 frames a second.
	 * @return {boolean} Whether any changes were made.
	 * @private
	 */
	var _draw = function(time) {
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame 
		|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
		requestAnimationFrame(_draw);
		
		if(!dusk.started || document.hidden) return;
		
		//Frame rate
		sgui.frameRate = 1000 / (time - _lastFrame);
		_lastFrame = time;
		if(sgui.frameRate > 90 && options.get("graphics.highRate") == "detect") {
			_highFrames ++;
			if(_highFrames >= 5) {
				sgui.highRate = true;
			}
		}else{
			_highFrames = 0;
		}
		sgui.framesTotal ++;
		
		if(sgui.highRate && sgui.framesTotal % 2 == 1) return false;
		
		if(!sgui.noCleanCanvas) {
			_getCanvas().getContext("2d").clearRect(0, 0, sgui.width, sgui.height);
			if(!sgui.noCacheCanvas)
				_cacheCanvas.getContext("2d").clearRect(0, 0, sgui.width, sgui.height);
		}
		
		//Draw panes
		for(var c = 0; c < _panes.length; c ++){
			var data = sgui.drawDataPool.alloc();
			data.alpha = 1;
			data.sourceX = 0;
			data.sourceY = 0;
			data.destX = _panes[c].x;
			data.destY = _panes[c].y;
			data.width = _panes[c].width;
			data.height = _panes[c].height;
			
			if(sgui.noCacheCanvas) {
				_panes[c].draw(data, _getCanvas().getContext("2d"));
			}else{
				_panes[c].draw(data, _cacheCanvas.getContext("2d"));
			}
			sgui.drawDataPool.free(data);
		}
		
		if(!sgui.noCacheCanvas) {
			_getCanvas().getContext("2d").drawImage(_cacheCanvas, 0, 0, sgui.width, sgui.height);
		}
		
		sgui.onRender.fire({});

		return true;
	};

	/** Resolves a path.
	 * 
	 * The path from this function must contain a colon, all text to the left of the colon will be the pane to path from
	 *  and all text to the right will be a standard path.
	 * @param {string} path The path to resolve.
	 * @return {dusk.sgui.Component} The component the path represents.
	 */
	sgui.path = function(path) {
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
	var _stylePattern =
	 /(?:([^\.#\[]+))?(?:\.([^#\.\[]+))?(?:#([^\.\#\[]+))?(?:\[([^\=\~\|\^\*\$]+)([\~\|\^\*\$])?=([^\]]+)\])?/gi;

	/** Adds a new style.
	 * 
	 * The properties will be the ones assigned, and is an object.
	 * @param {string} selector The selector to style.
	 * @param {object} props The props to set.
	 * @since 0.0.17-alpha
	 */
	sgui.addStyle = function(selector, props) {
		_styleData[selector] = [[], props];
		var fragments = selector.split(/>/gi);
		for(var i = 0; i < fragments.length; i ++) {
			_stylePattern.lastIndex = 0;
			_styleData[selector][0].push(_stylePattern.exec(fragments[i]));
		}
	};

	/** Get all style rules that match a specified component.
	 * 
	 * Each is in the form `[selector, props]`, where props is an object.
	 * @param {dusk.sgui.Component} com The component to get the styles for.
	 * @return {array} An array of style objects that should be applied to the component.
	 * @since 0.0.17-alpha
	 */
	sgui.getStyles = function(com) {
		var matchedStyles = [];
		
		for(var s in _styleData) {
			var hold = com;
			var current = null;
			var valid = true;
			var p = _styleData[s][0].length;
			while(current = _styleData[s][0][--p]) {
				if((current[1] && sgui.getType(current[1]) && !(hold instanceof sgui.getType(current[1])))
				|| (current[2] && !Array.isArray(hold.style) && hold.style != current[2])
				|| (current[2] && Array.isArray(hold.style) && current[2] in hold.style)
				|| (current[3] && hold.comName != current[3])
				|| (current[4] && !current[5] && hold.prop(current[4]) != current[6])) {
					valid = false;
					break;
				}
				
				hold = hold.container;
			}
			
			if(valid) matchedStyles.push(_styleData[s][1]);
		}
		
		return matchedStyles;
	};

	/** Apply all styles to the specified component that match it.
	 * @param {dusk.sgui.Component} com The component to apply styles to.
	 * @since 0.0.17-alpha
	 */
	sgui.applyStyles = function(com) {
		var styles = sgui.getStyles(com);
		
		for(var i = 0; i < styles.length; i ++) {
			com.parseProps(styles[i]);
		}
	};

	/** Adds a new type that can be added by specifying it's type. The component must be registered before use.
	 * @param {string} name The name of the added type.
	 * @param {class(dusk.sgui.Component, string) extends dusk.sgui.Component} type The type to add.
	 * @since 0.0.17-alpha
	 */
	sgui.registerType = function(name, type) {
		_types[name] = type;
	};

	/** Returns a constructor for the specified component, 
	 *  provided it has been registered beforehand with {@link dusk.sgui.registerType}.
	 * @param {string} name The name of the type to look up.
	 * @return {?class(dusk.sgui.Component, string) extends dusk.sgui.Component} A constructor for the specified type,
	 *  or null if it doesn't exist.
	 * @since 0.0.17-alpha
	 */
	sgui.getType = function(name) {
		if(!(name in _types)) return null;
		return _types[name];
	};

	/** Given a component, this returns the name it's constructor was registered as.
	 * 
	 * @param {dusk.sgui.Component} com The component to look up.
	 * @return {?string} The name that component was registered under, or null if it hasn't been registered.
	 * @since 0.0.18-alpha
	 */
	sgui.getTypeName = function(com) {
		for(var p in _types) {
			if(Object.getPrototypeOf(com) == _types[p].prototype) {
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
	sgui.registerExtra = function(name, extra) {
		_extras[name] = extra;
	};

	/** Returns a constructor for the specified extra,
	 *  provided it has been registered beforehand with `{@link dusk.sgui.registerExtra}`.
	 * @param {string} name The name of the extra to look up.
	 * @return {?class(dusk.sgui.Component, string) extends dusk.sgui.extra.Extra} A constructor for the specified extra,
	 *  or null if it doesn't exist.
	 * @since 0.0.18-alpha
	 */
	sgui.getExtra = function(name) {
		if(!(name in _extras)) return null;
		return _extras[name];
	};

	//width
	Object.defineProperty(sgui, "width", {
		set:function(value) {
			if(value == this.width) return;
			
			_getDuskwolf().setAttribute("data-width", value);
			_getCanvas().width = value;
			_cacheCanvas.width = this.width;
		},
		
		get: function() {
			return _getCanvas().width;
		}
	});

	//height
	Object.defineProperty(sgui, "height", {
		set:function(value) {
			if(value == this.height) return;
			
			_getDuskwolf().setAttribute("data-height", value);
			_getCanvas().height = value;
			_cacheCanvas.height = this.height;
		},
		
		get:function() {
			return _getCanvas().height;
		}
	});
	
	//Listen for keypresses
	keyboard.keyPress.listen(function(event) {
		if(sgui.getActivePane()) return sgui.getActivePane().doKeyPress(event);
		return true;
	});
	
	//And button presses
	gamepad.buttonPress.listen(function(event) {
		if(sgui.getActivePane()) return sgui.getActivePane().doButtonPress(event);
		return true;
	});
	
	//Listen for mouseclicks
	_getCanvas().addEventListener("click", function(e) {
		if(sgui.getActivePane() && sgui.getActivePane().mouse) sgui.getActivePane().mouse.doClick(e);
	});
	
	//Listen for frame events
	frameTicker.onFrame.listen(function(e) {
		//Check if high rate overrided
		if(options.get("graphics.highRate") !== "detect")
			sgui.highRate = options.get("graphics.highRate") == "on";
		
		if(sgui.displayMode == sgui.MODE_FULL) {
			//dusk.sgui.width = $("#"+dusk.elemPrefix).parent().width();
			
			//if($("#"+dusk.elemPrefix).parent().height() > window.innerHeight) {
			//	dusk.sgui.height = window.innerHeight;
			//}else{
			//	dusk.sgui.height = $("#"+dusk.elemPrefix).parent().height();
			//}
			
			sgui.width = _getDuskwolf().parentNode.clientWidth;
			
			if(_getDuskwolf().parentNode.clientHeight > window.innerHeight) {
				sgui.height = window.innerHeight;
			}else{
				sgui.height = _getDuskwolf().parentNode.clientHeight;
			}
		}
		
		for(var p = _panes.length-1; p >= 0; p --){
			if(_panes[p].mouse) {
				_panes[p].mouse.update(
					_mouseX - _panes[p].x,
					_mouseY - _panes[p].y
				);
				
				_panes[p].containerUpdateMouse(
					_mouseX - _panes[p].x,
					_mouseY - _panes[p].y
				);
				
				if(_mouseMoveQueued) _panes[p].mouse.move.fire();
			}
		}
		_mouseMoveQueued = false;
		
		for(var p = _panes.length-1; p >= 0; p --){
			_panes[p].frame.fire();
		}
	});
	
	//Set up the cached canvas
	_cacheCanvas.height = sgui.height;
	_cacheCanvas.width = sgui.width;
	_cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	_cacheCanvas.getContext("2d").mozImageSmoothingEnabled = false;
	_cacheCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
	_cacheCanvas.getContext("2d").imageSmoothingEnabled = false;
	_cacheCanvas.getContext("2d").textBaseline = "middle";
	
	//Listen for canvas mouse movements
	_getCanvas().addEventListener("mousemove", function(e){
		_mouseX = e.clientX - _getCanvas().getBoundingClientRect().left;
		_mouseY = e.clientY - _getCanvas().getBoundingClientRect().top;
		_mouseMoveQueued = true;
	});
	
	//Controls
	controls.addControl("sgui_up", 38, "1-");
	controls.addControl("sgui_down", 40, "1+");
	controls.addControl("sgui_left", 37, "0-");
	controls.addControl("sgui_right", 39, "0+");
	controls.addControl("sgui_action", 65, 0);
	controls.addControl("sgui_cancel", 27, 1);
	
	//Options
	options.register("graphics.highRate", "selection", "detect", "Skip every other frame, for 120Hz displays.",
		["on", "off", "detect"]
	);
	
	//Default dimensions
	sgui.width = _getCanvas().width;
	sgui.height = _getCanvas().height;
	
	//And begin
	_draw(0);
	
	Object.seal(sgui);
	
	return sgui;
})());


load.provide("dusk.pause", (function() {
	var controls = load.require("dusk.controls");
	var sgui = load.require("dusk.sgui");
	
	/** @namespace dusk.pause
	 * @name dusk.pause
	 * 
	 * @description Simple module that allows simple pausing and unpausing of a game.
	 * 
	 * Consists of a pane named "pause" that is made active or inactive depending on whether the game is paused or not.
	 *  The pane also is made invisible when it is not active.
	 * 
	 * A control is added, whith defaults to ENTER and button 9. If pausing is enabled, this will pause and unpause the
	 *  game.
	 */
	var pause = {};
	
	/** The name of the pane that was active before the game was paused. Used to set the active pane back to what it
	 *  was. If the game is not paused, this will be an empty string.
	 * @type string
	 * @private
	 */
	var _previous = "";
	
	/** Whether pausing is allowed, if this is false, then pausing is disabled, and nothing will happen if the user 
	 *  attempts to pause.
	 * @type boolean
	 */
	pause.allow = false;

	/** Pauses the game. 
	 */
	pause.pause = function() {
		if(!pause.allow) return;
		if(!_previous) _previous = sgui.getActivePane().comName;
		sgui.setActivePane("paused");
		sgui.getPane("paused").visible = true;
	};

	/** Unpauses the game.
	 */
	pause.unpause = function() {
		sgui.setActivePane(_previous);
		_previous = "";
		sgui.getPane("paused").visible = false;
	};

	/** Checks if the game is paused.
	 * @return {boolean} Whether the game is paused or not.
	 */
	pause.isPaused = function() {
		return _previous !== "";
	};

	/** If the game is paused, unpause it, else pause it.
	 */
	pause.toggle = function() {
		if(pause.isPaused()) {
			pause.unpause();
		}else{
			pause.pause();
		}
	};
	
	//Bind controls
	controls.addControl("pause", 13, 9);
	controls.controlPressed.listen(pause.toggle, undefined, {"control":"pause"});
	
	Object.seal(pause);
	
	return pause;
})());
