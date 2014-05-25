//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Single", (function() {
	var Component = load.require("dusk.sgui.Component");
	var IContainer = load.require("dusk.sgui.IContainer");
	var sgui = load.require("dusk.sgui");
	var utils = load.require("dusk.utils");
	var c = load.require("dusk.sgui.c");

	/** @class dusk.sgui.Single
	 * 
	 * @classdesc A single contains only one component, and typically adds some functionallity to it.
	 * 
	 * The component must have a name, and the name must be correct when you are referring to it,
	 *  however, you may use `"*"` in any case where a name is required to specify the component.
	 * 
	 * When this class is created, it will have, as its child, a `{@link dusk.sgui.NullCom}` named `"blank"`.
	 * 
	 * @extends dusk.sgui.IContainer
	 * @extends dusk.sgui.Component
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 */
	var Single = function(parent, comName) {
		Component.call(this, parent, comName);
		
		/** The actuall component this Single has.
		 * @type dusk.sgui.Component
		 * @private
		 */
		this._component = null;
		
		/** Used internally to store width.
		 * @type integer
		 * @private
		 * @since 0.0.18-alpha
		 */
		this._width = -1;
		/** Used internally to store height.
		 * @type integer
		 * @private
		 * @since 0.0.18-alpha
		 */
		this._height = -1;
		/** Used to cache drawn stuff.
		 * @type HTMLCanvasElement
		 * @private
		 * @since 0.0.18-alpha
		 */
		this._cache = null;
		
		/** The x offset. The child will be moved to the left this many,
		 *  and any pixels that have an x less than 0 are not drawn.
		 * @type integer
		 * @since 0.0.18-alpha
		 */
		this.xOffset = 0;
		/** The y offset. The child will be moved upwards this many,
		 *  and any pixels that have an y less than 0 are not drawn.
		 * @type integer
		 * @since 0.0.18-alpha
		 */
		this.yOffset = 0;
		
		this.newComponent("blank", "NullCom");
		
		//Prop masks
		this._registerPropMask("child", "__child", false);
		this._registerPropMask("mouse.focus", "mouse.focus", false, ["mouse"]);
		
		//Listeners
		this.prepareDraw.listen(this._singleDraw, this);
		this.frame.listen(this._singleFrame, this);
		this.onActiveChange.listen(function(e){this._component.onActiveChange.fire(e);}, this);
		
		//Check interfaces
		if(!utils.doesImplement(this, IContainer))
			console.warn(this.toString()+" does not implement dusk.sgui.IContainer!");
	};
	Single.prototype = Object.create(Component.prototype);

	/** Container specific method of handling keypresses.
	 * 
	 * In this case, it will call `{@link dusk.sgui.Component.keypress}` of its component.
	 * 
	 * @param {object} e The keypress event, must be a JQuery keypress event object.
	 * @return {boolean} The return value of the component's keypress.
	 */
	Single.prototype.containerKeypress = function(e) {
		return this._component.doKeyPress(e);
	};

	/** Container specific method of handling buttonpresses.
	 * 
	 * In this case, it will call `{@link dusk.sgui.Component#doButtonPress}` of its component, and return that value.
	 * 
	 * @param {object} e The button press event.
	 * @return {boolean} The return value of the component's buttonpress.
	 * @since 0.0.21-alpha
	 */
	Single.prototype.containerButtonpress = function(e) {
		return this._component.doButtonPress(e);
	};

	/** Fires the mouseMove event on its child.
	 * 
	 * @since 0.0.21-alpha
	 */
	Single.prototype.containerMouseMove = function(e) {
		if(this._component.mouse)
			this._component.mouse.move.fire();
	};

	/** Container specific method of handling clicks.
	 * 
	 * In this case, it will call `{@link dusk.sgui.Component#mouse#doClick}` of the component if the mouse is on it, and
	 *  and return that value. Failing that, it will return true.
	 * 
	 * @param {object} e The click event.
	 * @return {boolean} The return value of the focused component's keypress.
	 */
	Single.prototype.containerClick = function(e) {
		if(this.mouse && this.mouse.focus) {
			var com = this._component;
			
			if(com.mouse && !(this.mouse.x < com.x || this.mouse.x > com.x + com.width
			|| this.mouse.y < com.y || this.mouse.y > com.y + com.height)) {
				return this._components[this._drawOrder[i]].mouse.doClick(e);
			}
		}
		
		return true;
	};

	/** Creates a new component of the specified type, replacing the existing component.
	 * 
	 * `type` is a string, and must correspond to a property of the namespace `{@link dusk.sgui}`
	 *   and inherit from the class `{@link dusk.sgui.Component}`.
	 *	This will be the object which is created.
	 * 
	 * @param {string} com The name of the new component.
	 * @param {?string} type The type to add as described above. If not specified, `"NullCom"` is used.
	 * @return The component that was added.
	 */
	Single.prototype.newComponent = function(com, type) {
		if(type === undefined) type = "NullCom";
		if(!sgui.getType(type)){console.warn(type + " is not a valid component type."); type = "NullCom";}
		
		this._component = new (sgui.getType(type))(this, com.toLowerCase());
		this._component.onFocusChange.fire({"focus":true});
		sgui.applyStyles(this._component);
		
		return this._component;
	};

	/** Modifies this component's child using JSON data.
	 *	See `{@link dusk.sgui.Component.parseProps}` for a basic description on how JSON properties work.
	 * 
	 * `data` is either a single object or an array of objects, each describing a component.
	 * 	Objects whose `"name"` property isn't `"*"` or this container's child's name
	 *   and that have no `"type"` property will be ignored.
	 * 	If the data has a `"type"` property and the name is different,
	 *   then a new component of the specified name and type is created.
	 * 
	 * This may be used in the JSON representation with the property `child`.
	 * 
	 * @param {object|array} data Information about the component, as described above.
	 */
	Single.prototype.modifyComponent = function(data) {
		if("length" in data) {
			for (var i = 0; i < data.length; i++) {
				this.modifyComponent(data[i]);
			}
		}else{
			if(data.name && this.getComponent(data.name.toLowerCase(), data.type)) {
				this._component.parseProps(data);
				sgui.applyStyles(this._component);
			} else {
				console.warn(data.name + " has not been given a type and does not exist, ignoring.");
			}
		}
	};
	Object.defineProperty(Single.prototype, "__child", {
		set: function(value) {this.modifyComponent(value);},
		
		get: function() {
			var hold = this._component.bundle();
			hold.type = getTypeName(this._component);
			return hold;
		}
	});

	/** Draws the child onto the canvas.
	 * 
	 * @param {object} A draw event.
	 * @private
	 */
	Single.prototype._singleDraw = function(e) {
		var com = this._component;
		var data = sgui.drawDataPool.alloc();
		
		data.alpha = e.alpha;
		
		var destXAdder = com.xOrigin == c.ORIGIN_MAX?this.width - com.width:0;
		var destYAdder = com.yOrigin == c.ORIGIN_MAX?this.height - com.height:0;
		destXAdder = com.xOrigin == c.ORIGIN_MIDDLE?(this.width - com.width)<<1:destXAdder;
		destXAdder = com.yOrigin == c.ORIGIN_MIDDLE?(this.height - com.height)<<1:destYAdder;
		
		data.sourceX = (-this.xOffset + com.x + destXAdder - e.d.sourceX)<0
		 ? -(-this.xOffset + com.x + destXAdder - e.d.sourceX) : 0;
		data.sourceY = (-this.yOffset + com.y + destYAdder - e.d.sourceY)<0
		 ? -(-this.yOffset + com.y + destYAdder - e.d.sourceY) : 0;
		data.destX = (com.x + destXAdder - this.xOffset - e.d.sourceX)<0
		 ? e.d.destX : (com.x + destXAdder - this.xOffset - e.d.sourceX) + e.d.destX;
		data.destY = (com.y + destYAdder - this.yOffset - e.d.sourceY)<0
		 ? e.d.destY : (com.y + destYAdder - this.yOffset - e.d.sourceY) + e.d.destY;
		data.width = com.width - data.sourceX;
		data.height = com.height - data.sourceY;
		
		if(data.destX >= e.d.width + e.d.destX) return;
		if(data.destY >= e.d.height + e.d.destY) return;
		
		if(data.width <= 0 || data.height <= 0) return;
		
		if(data.width + data.destX > e.d.width + e.d.destX) data.width = (e.d.destX + e.d.width) - data.destX;
		if(data.height + data.destY > e.d.height + e.d.destY) data.height = (e.d.destY + e.d.height) - data.destY;
		
		com.draw(data, e.c);
		sgui.drawDataPool.free(data);
	};

	/** Returns the component in the group, or creates a new one.
	 * 
	 * If `type` is not undefined, and the name is incorrect, 
	 *  then a new component with the name and type specified will be created.
	 * 
	 * @param {string} com The name of the component to get.
	 * @param {?string} type The type of component to create if needed.
	 * @return {?dusk.sgui.Component} The component, or null if the name is wrong and `type` is undefined.
	 */
	Single.prototype.getComponent = function(com, type) {
		if (this._component.comName == com.toLowerCase() || com == "*" || !com) {
			return this._component;
		}
		
		return type?this.newComponent(com, type):null;
	};

	/** Deletes the component, replacing it with a `{@link dusk.sgui.NullCom}` named `"blank"`
	 *  which is the default component.
	 * 
	 * @param {string} com Must be any false value, "*" or the name of the component.
	 * @return {boolean} If the delete was successfull, this will return false if the name was invalid.
	 */
	Single.prototype.deleteComponent = function(com) {
		if (this._component.comName == com.toLowerCase() || com == "*" || !com){
			this._component.onDelete.fire({"com":this._component});
			this.newComponent("blank", "NullCom");
			return true;
		}
		
		return false;
	};

	/** Deletes the component, replacing it with a `{@link dusk.sgui.NullCom}` named `"blank"`
	 *  which is the default component.
	 * @since 0.0.18-alpha
	 */
	Single.prototype.deleteAllComponents = function(com) {
		this._component.onDelete.fire({"com":this._component});
		this.newComponent("blank", "NullCom");
	};

	/** Calls the `{@link dusk.sgui.Component.frame}` method of its component.
	 * @private
	 */
	Single.prototype._singleFrame = function() {
		this.getComponent("*").frame.fire();
	};

	/** Calls the `{@link dusk.sgui.IContainer.flow}` method of its parent container.
	 * 
	 * @param {string} to The name of the parent's component to flow into.
	 * @return {boolean} Whether the flow was successfull.
	 */
	Single.prototype.flow = function(to) {
		return this.container.flow(to);
	};

	/** As there is only one component in this container, this does nothing.
	 * 
	 * @param {string} com The name of the component to alter the layer of, will be ignored.
	 * @param {string} alter The alteration to make, will be ignored.
	 * @since 0.0.17-alpha
	 */
	Single.prototype.alterChildLayer = function(com, alter) {
		//Does nothing
	};

	//Width
	Object.defineProperty(Single.prototype, "width", {
		get: function() {
			if(this._width == -2) {
				return this.container.width;
			}else if(this._width == -1) {
				return this._component.x + this._component.width - this.xOffset;
			}else{
				return this._width;
			}
		},
		
		set: function(value) {
			this._width = value;
		}
	});

	//Height
	Object.defineProperty(Single.prototype, "height", {
		get: function() {
			if(this._height == -2) {
				return this.container.height;
			}else if(this._height == -1) {
				return this._component.y + this._component.height - this.yOffset;
			}else{
				return this._height;
			}
		},
		
		set: function(value) {
			this._height = value;
		}
	});

	/** Returns the smallest width which has all the components fully drawn inside.
	 * 
	 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
	 * @return {integer} The smallest possible width where all the components are fully inside.
	 * @since 0.0.19-alpha
	 */
	Single.prototype.getContentsWidth = function(includeOffset) {
		if(includeOffset) {
			return this._component.x + this._component.width - this.xOffset;
		}else{
			return this._component.x + this._component.width;
		}
	};

	/** Returns the smallest height which has all the components fully drawn inside.
	 * 
	 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
	 * @return {integer} The smallest possible height where all the components are fully inside.
	 * @since 0.0.19-alpha
	 */
	Single.prototype.getContentsHeight = function(includeOffset) {
		if(includeOffset) {
			return this._component.y + this._component.height - this.yOffset;
		}else{
			return this._component.y + this._component.height;
		}
	};

	/** Updates mouse location of all children if this allows the mouse.
	 * 
	 * @since 0.0.20-alpha
	 */
	Single.prototype.containerUpdateMouse = function() {
		if(!this.mouse) return;
		var x = this.mouse.x;
		var y = this.mouse.y;
		
		var com = this._component;
		if(!com || !com.mouse) return;
		var destX = x;
		var destY = y;
		
		var destXAdder = 0;
		if(com.xOrigin == c.ORIGIN_MAX) destXAdder = this.width - com.width;
		if(com.xOrigin == c.ORIGIN_MIDDLE) destXAdder = (this.width - com.width)>>1;
		
		var destYAdder = 0;
		if(com.yOrigin == c.ORIGIN_MAX) destYAdder = this.height - com.height;
		if(com.yOrigin == c.ORIGIN_MIDDLE) destYAdder = (this.height - com.height)>>1;
		
		destX += -com.x + this.xOffset - destXAdder;
		
		destY += -com.y + this.yOffset - destYAdder;
		
		com.mouse.update(destX, destY);
		if("containerUpdateMouse" in com) com.containerUpdateMouse(destX, destY);
	};

	/** Returns the actual X location, relative to the screen, that the component is at.
	 * @param {string} name Ignored.
	 * @return {integer} The X value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Single.prototype.getTrueX = function(name) {
		var com = this._component;
		
		var destXAdder = 0;
		if(com.xOrigin == c.ORIGIN_MAX) destXAdder = this.width - com.width;
		if(com.xOrigin == c.ORIGIN_MIDDLE) destXAdder = (this.width - com.width)>>1;
		
		return this.container.getTrueX(this.comName) + com.x - this.xOffset + destXAdder;
	};

	/** Returns the actual Y location, relative to the screen, that the component is at.
	 * @param {string} name Ignored.
	 * @return {integer} The Y value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Single.prototype.getTrueY = function(name) {
		var com = this._component;
		
		var destYAdder = 0;
		if(com.yOrigin == c.ORIGIN_MAX) destYAdder = this.height - com.height;
		if(com.yOrigin == c.ORIGIN_MIDDLE) destYAdder = (this.height - com.height)>>1;
		
		return this.container.getTrueY(this.comName) + com.y - this.yOffset + destYAdder;
	};

	Object.seal(Single);
	Object.seal(Single.prototype);

	sgui.registerType("Single", Single);
	
	return Single;
})());
