//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui", (function() {
	var Root = load.require(">dusk.sgui.Root", function(p){Root = p});
	var keyboard = load.require("dusk.input.keyboard");
	var frameTicker = load.require("dusk.utils.frameTicker");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var controls = load.require("dusk.input.controls");
	var dusk = load.require("dusk");
	var c = load.require("dusk.sgui.c");
	var options = load.require("dusk.options");
	var Pool = load.require("dusk.utils.Pool");
	var interaction = load.require("dusk.input.interaction");
	var UserCancelError =
		load.suggest("dusk.utils.reversiblePromiseChain.UserCancelError", function(p) {UserCancelError = p});
	var containerUtils = load.require("dusk.utils.containerUtils");
	var PosRect = load.require("dusk.utils.PosRect");
	
	/** This module contains a SimpleGui system, allowing for canvas UIs.
	 * 
	 * Generally, everything in the Simple GUI system is a subclass of `dusk.sgui.Component`. All components are in a
	 *  parent component that subclasses `dusk.sgui.Group`, until you get to the top, which are containers of type
	 *  `dusk.sgui.Pane`. Components are things that are displayed, such as images or text, each has a draw function
	 *  that lets them draw directly to a canvas, rotated and offseted already for them.
	 * 
	 * Containers allow you to define their contents as JSON objects (but only for simple properties), or you can simply
	 *  use refrences to the objects themselves. If you use JSON, the property names of the JSON keys generally match up
	 *  to the property names of the components. You cannot call functions using JSON, only modify the properties at the
	 *  current time.
	 * 
	 * In the JSON, if you are describing a group's children, each child element must contain a `name` and `type`
	 *  property. This is the name and type of the object, surprisingly. `type` must be a valid type (extends
	 *  `dusk.sgui.Component` and be registered using `registerType`).
	 * 
	 * Components can be "active", a component which is active will receive keyboard events, and should act like the
	 *  user is paying attention to it.	When a component changes whether it is active, its
	 *  `dusk.sgui.Component.onActiveChange` event is fired. For a component to be active, all its parent groups must be
	 *  too.
	 * 
	 * Components can also be "focused", focused components will be made active when the container it is in becomes
	 *  active.	Focus is usually changed by the arrow keys (only active components can handle key events, remember),
	 *  though this can be remapped using `dusk.input.controls`. If a direction key is pressed, a function like
	 *  `sgui.Component.upAction` returns true, and a variable like `upFlow` is not empty, focus changes to the named
	 *  element in this one's container. The arrow keys can be changed by using the controls "sgui_up", "sgui_down",
	 *  "sgui_left" and "sgui_right". If a component changes whether it is focused , its
	 *  `dusk.sgui.Component.onFocusChange` event will fire.
	 * 
	 * Component paths also exist, these paths are similar to file paths and allow you to specify one component relative
	 *  to another.	From an example container "X" in another container "Y", which itself is in a root "Z", and with
	 *  children "a", "b" and "c", with "c" having children "c1" and "c2" the following paths are as described:
	 * 
	 * - a - Access the child "a".
	 * - c/c1 - Access the child "c1" of the container "c", which is in "X".
	 * - ../ - Access this parent, "Y".
	 * - /Y - Access the child "Y" in the root "Z".
	 * - Z:/Y - Directly accesses "Y" from the root "Z".
	 * 
	 * Components can be styled similarly to CSS. When a new component is created, the list of styles (Set by `addStyle`
	 *  is checked. If it matches that component, all the properties in the object set with the style will be applied to
	 *  the object (see the JSON representation above). This only occurs when the object is created or its type changes,
	 *  it won't happen at any other time. The syntax for a rule contains the following, they must be in this order, but
	 *  are all optional: 
	 * 
	 * - `typename` - The name of the component's type, as registered using `{@link dusk.sgui.registerType}`.
	 * - `.style` - The value of, or one of the values of, the component's `{@link dusk.sgui.Component.style}` property.
	 * - `#name` - The component's name.
	 * - `[prop=value]` - The property must equal the value, the property is a name that can be looked up using the JSON 
	 *  representation, and must equal the value. At the moment only `=` is supported, and there can only be one of
	 *  these.
	 * 
	 * Concisely, `typename.style#name[prop=value]`.
	 * 
	 * Components can also have "extras" which are essentially objects that are bolted onto components and give them
	 * extra functionality. They are stored on the component, and are deleted when the component is, or on their own
	 * accord. Extras are added to components using `dusk.sgui.Component#addExtra`, removed using
	 * `dusk.sgui.Component#removeExtra` and retreived using `dusk.sgui.Component#getExtra`.
	 * 
	 * Mouse control is also supported for components. A component will be able to see the mouse location, relative to
	 *  themselves in their `{@link dusk.sgui.Component._mouseX}` and `{@link dusk.sgui.Component._mouseY}` properties.
	 *  If the property `{@link dusk.sgui.Component.allowMouse}` is true, then rolling over the component will set the
	 *  focus to that component, whether the default is true depends on the component's type. If
	 *  `dusk.sgui.Component.mouseAction` is true, then clicking on the component will fire its
	 *  `dusk.sgui.Component.action` event.
	 * 
	 * This namespace registers the following controls for `dusk.input.controls`:
	 * 
	 * - `dusk_up`, `dusk_down`, `dusk_left` and `dusk_right` are the controls used to change the active component,
	 *   these are the arrow keys or first stick by default.
	 * - `dusk_action` is used to trigger the "action" event on a component, this is by default the `a` key, or button
	 *  0.
	 * - `dusk_carcel` is used to trigger the "cancel" event on a component, by default this is the `ESC` key or button
	 *  1.
	 */
	var sgui = {};
	
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

	/** All the roots.
	 * @type array
	 * @private
	 */
	var _roots = [];
	
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
	 * @type dusk.utils.EventDispatcher
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
	 * @type dusk.utils.Pool<Object>
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
	
	/** The context for the main canvas.
	 * @type CanvasRenderingContext2D
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _ctx = document.getElementById(dusk.elemPrefix+"-canvas").getContext("2d");
	
	/** The context for the cache canvas.
	 * @type CanvasRenderingContext2D
	 * @since 0.0.21-alpha
	 * @private
	 */
	var _cacheCtx = _cacheCanvas.getContext("2d");
	
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
	
	
	/** Returns or creates a root.
	 * @param {string} name The name of the root to get or create.
	 * @param {?boolean} create If this is `true`, then a new root will be created if it does not exist.
	 * @return {?dusk.sgui.Pane} The root, or `null` if it doesn't exist and `create` is `false`.
	 */
	sgui.get = function(name, create) {
		//if(this._roots[name.toLowerCase()]) return this._roots[name.toLowerCase()];
		for(var p = _roots.length-1; p >= 0; p --) {
			if(_roots[p].name == name) return _roots[p];
		}
		
		if(create) {
			_roots.push(new Root(this, name));
			return _roots[_roots.length-1];
		}
		
		return null;
	};
	
	/** Given a root object, adds it to the SGui system.
	 * @param {string} name The name to set this as; will change the root's name.
	 * @param {dusk.sgui.Root} root The root to add.
	 * @return {boolean} True if successfull.
	 */
	sgui.set = function(name, root) {
		var slot = _roots.length;
		for(var i = 0; i < _roots.length; i ++) {
			if(_roots[i].name == name.toLowerCase()) {
				slot = i;
			}
		}
		
		if(data instanceof Root) {
			//data.name = name;
			_roots[slot] = data;
			return true;
		}
		
		this.get(name, true).update(data);
		return true;
	};
	
	/** Removes a root from the SGui system.
	 * @param {string} name The name of the root to remove.
	 * @return {boolean} True if successfull.
	 * @since 0.0.21-alpha
	 */
	sgui.remove = function(name) {
		var com = this.get(com);
		if(com) {
			com.onDelete.fire({"com":com});
			_roots.splice(_roots.indexOf(com), 1);
			return true;
		}
		
		return false;
	};
	
	/** Returns the number of roots.
	 * @return {integer} Root count.
	 * @since 0.0.21-alpha
	 */
	sgui.length = function() {
		return _roots.length;
	};
	
	/** Returns an iterator for all the roots.
	 * @return {object} An iterator
	 * @since 0.0.21-alpha
	 */
	sgui.iterate = function() {
		var i = -1;
		return {
			"next":function(){
				i ++;
				if(i < _roots.length){
					return {"done":false, "value":_roots[i], "key":_roots[i].name};
				}else{
					return {"done":true};
				}
			}
		};
	};
	
	/** Returns whether the given argument can be used for `set`. It must be either a `Pane` or an object.
	 * @param {*} An object to check.
	 * @return {boolean} Whether the argument is valid.
	 * @since 0.0.21-alpha
	 */
	sgui.valid = function(root) {
		return typeof root == "object";
	};
	
	/** Checks if the given root has been added to the system.
	 * @param {dusk.sgui.Pane} The root to check.
	 * @return {boolean} Whether the root has been added.
	 * @since 0.0.21-alpha
	 */
	sgui.contains = function(root) {
		return _roots.indexOf(root) !== -1;
	};
	
	/** Draws all the roots onto the main canvas specified, and fires the onRender event.
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
			_ctx.clearRect(0, 0, sgui.width, sgui.height);
			if(!sgui.noCacheCanvas)
				_cacheCtx.clearRect(0, 0, sgui.width, sgui.height);
		}
		
		//Draw roots
		for(var c = 0; c < _roots.length; c ++){
			var data = sgui.drawDataPool.alloc();
			
			data.origin = PosRect.pool.alloc().setWH(_roots[c].x, _roots[c].x, _roots[c].width, _roots[c].height);
			data.slice = PosRect.pool.alloc().setWH(0, 0, _roots[c].width, _roots[c].width);
			data.dest = PosRect.pool.alloc().setWH(0, 0, _roots[c].width, _roots[c].width);
			
			data.alpha = 1;
			data.sourceX = 0;
			data.sourceY = 0;
			data.destX = _roots[c].x;
			data.destY = _roots[c].y;
			data.width = _roots[c].width;
			data.height = _roots[c].height;
			
			if(sgui.noCacheCanvas) {
				_roots[c].draw(data, _ctx);
			}else{
				_roots[c].draw(data, _cacheCtx);
			}
			
			PosRect.pool.free(data.origin);
			PosRect.pool.free(data.slice);
			PosRect.pool.free(data.dest);
			
			sgui.drawDataPool.free(data);
		}
		
		if(!sgui.noCacheCanvas) {
			_ctx.drawImage(_cacheCanvas, 0, 0, sgui.width, sgui.height);
		}
		
		sgui.onRender.fire({});

		return true;
	};
	
	/** Resolves a path.
	 * 
	 * The path from this function must contain a colon, all text to the left of the colon will be the root to path from
	 *  and all text to the right will be a standard path.
	 * @param {string} path The path to resolve.
	 * @return {dusk.sgui.Component} The component the path represents.
	 */
	sgui.path = function(path) {
		if(path.indexOf(":") === -1) {
			console.error("Tried to set an invalid path (no colon): "+path);
			return null;
		}
		var root = path.split(":", 1)[0];
		path = path.substr(root.length+1);
		return this.get(root).path(path);
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
				|| (current[3] && hold.name != current[3])
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
			com.update(styles[i]);
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
	 * @return {?class(dusk.sgui.Component, string) extends dusk.sgui.extra.Extra} A constructor for the specified extra
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
	
	
	
	// Listen for interaction events
	interaction.on.listen(function(e) {
		for(var r in _roots) {
			_roots[r].interact(e);
		}
		
		var a = controls.interactionControl(e);
		if(a.length) {
			for(var r in _roots) {
				_roots[r].control(e, a);
			}
		}
		
		if(e.type == interaction.MOUSE_CLICK) {
			for(var r in _roots) {
				if(_roots[r].mouse) {
					_roots[r].mouse.doClick(e);
				}
			}
		}
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
		
		for(var p = _roots.length-1; p >= 0; p --){
			_roots[p].frame.fire();
		}
	});
	
	//Set up the cached canvas
	_cacheCanvas.height = sgui.height;
	_cacheCanvas.width = sgui.width;
	_cacheCanvas.style.imageRendering = "-webkit-optimize-contrast";
	
	_cacheCtx.mozImageSmoothingEnabled = false;
	_cacheCtx.webkitImageSmoothingEnabled = false;
	_cacheCtx.imageSmoothingEnabled = false;
	_cacheCtx.textBaseline = "middle";
	
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
	
	return sgui;
})());


load.provide("dusk.sgui.pause", (function() {
	var controls = load.require("dusk.input.controls");
	var sgui = load.require("dusk.sgui");
	
	/** Simple module that allows simple pausing and unpausing of a game.
	 * 
	 * Consists of a root named "pause" that is made active or inactive depending on whether the game is paused or not.
	 *  The root also is made invisible when it is not active.
	 * 
	 * A control is added, whith defaults to ENTER and button 9. If pausing is enabled, this will pause and unpause the
	 *  game.
	 * 
	 * Likley is broken.
	 */
	var pause = {};
	
	/** The name of the root that was active before the game was paused. Used to set the active root back to what it
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
		if(!_previous) _previous = sgui.getActivePane().name;
		sgui.setActivePane("paused");
		sgui.get("paused").visible = true;
	};
	
	/** Unpauses the game.
	 */
	pause.unpause = function() {
		sgui.setActivePane(_previous);
		_previous = "";
		sgui.get("paused").visible = false;
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
	controls.controlPressed.listen(pause.toggle, "pause");
	
	return pause;
})());
