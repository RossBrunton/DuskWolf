//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Root", (function() {
	var Group = load.require("dusk.sgui.Group");
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var PosRect = load.require("dusk.utils.PosRect");
	var keyboard = load.require("dusk.input.keyboard");
	var mouse = load.require("dusk.input.mouse");
	var interaction = load.require("dusk.input.interaction");
	var utils = load.require("dusk.utils");
	
	/** A root is a special type of group which is "allowed" to have no parent.
	 * 
	 * It used by `{@link dusk.sgui}` as the root for any component tree.
	 * 
	 * @extends dusk.sgui.Group
	 * @param {?dusk.sgui.IContainer} parent The container that this component is in, this will always be null.
	 * @param {string} name The name of the component.
	 */
	var Root = function(parent, name) {
		Group.call(this, null, name);
		
		/** A cached canvas drawn to before the real one, to improve performance.
		 * @type Array
		 * @private
		 */
		this._cacheCanvases = [];
		
		/** If this is true then the canvas won't be cleaned before every draw. If your components cover all the screen, 
		 *  this is fine, but if they don't, then this will result in graphical oddities.
		 * 
		 *  Setting this true will give a bit of graphical performance.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.noCleanCanvas = false;
		/** If this is true then the cache canvas will not be used, and the drawing will occur right on the screen.
		 * 
		 * This setting probably shouldn't be turned on, but it should give a boost to performance.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.noCacheCanvas = false;
		
		/** If there is no element that this root can be drawn onto and this proprety is true, then a warning will be
		 *  issued (via console.warn) and this property will be set to false.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.warnIfNoElement = true;
		
		/** The mousemove event that is queued, this will be fired at the soonest possible frame and then erased.
		 * @type {object}
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._mmQueued = null;
		
		/** The stack used to store the active stack thing for `popActive` and `pushActive`.
		 * @type {array}
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._activeStack = [];
		
		this._mapper.map("noCleanCanvas", "noCleanCanvas");
		this._mapper.map("noCacheCanvas", "noCacheCanvas");
		this._mapper.map("warnIfNoElement", "warnIfNoElement");
		
		// Roots are always active and focused
		this.active = true;
		this.focused = true;
		
		// And are in expand mode
		this.xDisplay = "expand";
		this.yDisplay = "expand";
		
		this.frame.listen(_frame.bind(this));
	};
	Root.prototype = Object.create(Group.prototype);
	
	/** Would make the Root active, but roots are always active, so does nothing. It does flow into the given child,
	 *  though.
	 * @param {?dusk.sgui.Component} child A child that wants to be made active.
	 */
	Root.prototype.becomeActive = function(child) {
		if(child) this.flow(child.name);
	};
	
	/** Returns the full path of this component.
	 * 
	 * This should be able to be given to `{@link dusk.sgui.path}` and will point to this component.
	 * @return {string} A full path to this component.
	 */
	Root.prototype.fullPath = function() {
		return this.name+":/";
	};
	
	/** Pushes the currently active element to the active stack.
	 * 
	 * This will be the output from `getDeepestFocused`, which is usually the deepest active component. This can be used
	 *  with `popActive` to restore that element in a FIFO fashion.
	 * 
	 * For example, push the active component, display a menu. When you are done with menu, remove it and pop.
	 * 
	 * Please don't remove the component you pushed from the group.
	 * @since 0.0.21-alpha
	 */
	Root.prototype.pushActive = function() {
		this._activeStack.push(this.getDeepestFocused());
	};
	
	/** Pops the currently active element from the active stack, and makes it active.
	 * 
	 * Use `pushActive` to push an element to the stack.
	 * 
	 * Note this will change the focused component of every active (at the time of push) parent of the popee.
	 * 
	 * Throws an exception if the stack is empty.
	 * @since 0.0.21-alpha
	 */
	Root.prototype.popActive = function() {
		if(!this._activeStack.length) throw new Error("Active stack for "+this.name+" is empty and requested pop.");
		this._activeStack.pop().becomeActive();
	};
	
	Object.defineProperty(Root.prototype, "type", {
		set: function(value) {
			if(value && value != sgui.getTypeName(this)) {
				throw new TypeError("Tried to change type of Root.");
			}
		},
		
		get: function() {
			return sgui.getTypeName(this);
		}
	});
	
	/** Creates or returns elements from inside the dw-paint HTML element that holds the root of this component.
	 * 
	 * If they don't exist, they will be created.
	 * @param {string} tag The tag name of the element to get or create.
	 * @return {array} An array of HTMLElements, one per dw-paint that this component's root is displayed on.
	 * @since 0.0.21-alpha
	 */
	Root.prototype.getHtmlElements = function(tag) {
		if(!document.querySelectorAll("dw-paint[data-root="+this.name+"] "+tag).length) {
			var elems = document.querySelectorAll("dw-paint[data-root="+this.name+"]");
			
			for(var i = 0; i < elems.length; i ++) {
				var elem = elems[i];
				
				elem.innerHTML += "<"+tag+"></"+tag+">";
			}
		}
		
		return document.querySelectorAll("dw-paint[data-root="+this.name+"] "+tag);
	};
	
	/** Called automatically and sets up the canvas and properties of any dw-paint elements.
	 * @return {boolean} Whether any dw-paint elements were found.
	 * @since 0.0.21-alpha
	 * @private
	 */
	Root.prototype._ensureReady = function() {
		if(!document.querySelectorAll("dw-paint[data-root="+this.name+"] canvas").length) {
			var elems = document.querySelectorAll("dw-paint[data-root="+this.name+"]");
			if(!elems.length) return false;
			
			for(var i = 0; i < elems.length; i ++) {
				var elem = elems[i];
				elem.style.display = "block";
				if(!elem.style.width) elem.style.width = _toPx(elem.getAttribute("data-width"));
				if(!elem.style.height) elem.style.height = _toPx(elem.getAttribute("data-height"));
				
				elem.tabIndex = 0;
				
				elem.innerHTML = "<canvas style='image-rendering: -webkit-optimize-contrast;'\
				width='"+elem.getAttribute("data-width")+"' height='"+elem.getAttribute("data-height")+"'\
				></canvas>";
				
				this._cacheCanvases[i] = document.createElement("canvas");
				this._cacheCanvases[i].width = elem.getAttribute("data-width");
				this._cacheCanvases[i].height = elem.getAttribute("data-height");
				this._cacheCanvases[i].style.imageRendering = "-webkit-optimize-contrast";
				
				this._cacheCanvases[i].getContext("2d").mozImageSmoothingEnabled = false;
				this._cacheCanvases[i].getContext("2d").webkitImageSmoothingEnabled = false;
				this._cacheCanvases[i].getContext("2d").imageSmoothingEnabled = false;
				this._cacheCanvases[i].getContext("2d").textBaseline = "middle";
				
				keyboard.trapElement(elem, this.name);
				mouse.trapElement(elem, this.name);
			}
		}
		
		return true;
	};
	
	/** Returns an array of canvases to draw onto.
	 * @return {array} Canvases.
	 * @since 0.0.21-alpha
	 * @private
	 */
	Root.prototype._getCanvases = function() {
		if(!this._ensureReady()) return [];
		return document.querySelectorAll("dw-paint[data-root="+this.name+"] canvas");
	};
	
	var _toPx = function(a) {
		if((""+a).slice(-2) != "px") return a+"px";
		return ""+a;
	};
	
	/** Should be called on animation frame, draws the components onto the canvases.
	 * @since 0.0.21-alpha
	 */
	Root.prototype.animationFrame = function() {
		var canvases = this._getCanvases();
		if(!canvases.length) {
			// No canvas to draw onto, do nothing
			if(this.warnIfNoElement) console.warn("No dw-paint element found for root "+this.name+".");
			this.warnIfNoElement = false;
			return;
		}
		
		if(this._mmQueued) {
			this.mouseX = this._mmQueued.x;
			this.mouseY = this._mmQueued.y;
			
			// Components may change this, so reset it every frame
			mouse.cursor = "initial";
			
			Group.prototype.interact.call(this, this._mmQueued);
			this._mmQueued = null;
		}
		
		for(var i = 0; i < canvases.length; i ++) {
			var canvas = canvases[i];
			
			if(!this.noCleanCanvas) {
				canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
				if(!this.noCacheCanvas)
					this._cacheCanvases[i].getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
			}
			
			if(this.noCacheCanvas) {
				this.paint(canvas.getContext("2d"), 0, 0, canvas.width, canvas.height);
			}else{
				this.paint(this._cacheCanvases[i].getContext("2d"), 0, 0, canvas.width, canvas.height);
				canvas.getContext("2d").drawImage(this._cacheCanvases[i], 0, 0, canvas.width, canvas.height);
			}
		}
	};
	
	Root.prototype.interact = function(e, nofire) {
		if(e.type == interaction.MOUSE_MOVE) {
			this._mmQueued = utils.copy(e);
		}else{
			return Group.prototype.interact.call(this, e, nofire);
		}
	};
	
	var _frame = function() {
		
	};
	
	Root.prototype.getRoot = function() {
		return this;
	};
	
	sgui.registerType("Root", Root);
	
	return Root;
})());
