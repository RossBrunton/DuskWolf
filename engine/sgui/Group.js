//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Group", function() {
	var Component = load.require("dusk.sgui.Component");
	var utils = load.require("dusk.utils");
	var c = load.require("dusk.sgui.c");
	var sgui = load.require(">dusk.sgui", function(p) {sgui = p});
	var interaction = load.require("dusk.input.interaction");
	var containerUtils = load.require("dusk.utils.containerUtils");
	var PosRect = load.require("dusk.utils.PosRect");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** A group contains multiple components, and manages things like keyboard events and drawing.
	 * 
	 * Components have names, which are used to reference them, these names are strings and are not case sensitive.
	 * 
	 * The number of components that can be focused depends on the `focusBehaviour` property,
	 *  focused components will be the only ones that receive keypresses.
	 * 
	 * @extends dusk.sgui.Component
	 * @implements dusk.utils.IContainer
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @constructor
	 */
	var Group = function(parent, name) {
		Component.call(this, parent, name);
		
		/** All the components in this container, key names are component names.
		 * @type object
		 * @protected
		 */
		this._components = {};
		/** All the components in this container, as an array for faster iteration.
		 * @type array
		 * @protected
		 * @since 0.0.20-alpha
		 */
		this._componentsArr = [];
		/** The current drawing order of all the components. An array of string component names, earlier entries are
		 *  drawn first.
		 * @type array
		 * @protected
		 */
		this._drawOrder = [];
		/** The name of the currently focused component.
		 * @type string
		 * @private
		 */
		this._focusedCom = "";
		/** Used internally to store the current focus behaviour.
		 * @type integer
		 * @default FOCUS_ONE
		 * @private
		 * @since 0.0.18-alpha
		 */
		this._focusBehaviour = Group.FOCUS_ONE;
		/** The current behaviour used to say how focus works.
		 *  
		 * Changing this will affect any currently existing components.
		 * 
		 * Should be one of the `FOCUS_*` constants.
		 * @type integer
		 * @default FOCUS_ONE
		 */
		this.focusBehaviour = Group.FOCUS_ONE;
		/** Used internally to store whether focusVisible is on or off.
		 * @type boolean
		 * @default false
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._focusVisible = false;
		/** If true, then only the focused component will be visible, all others will be invisible.
		 *  
		 * Changing this will affect the visibility of all components.
		 * @type boolean
		 * @default false
		 * @since 0.0.20-alpha
		 */
		this.focusVisible = false;
		
		/** This is the name of the currently focused component.
		 * 
		 * When set, this calls all the expected functions on `{@link dusk.sgui.Component}` as expected to make the
		 *  specified component focused.
		 * 
		 * If a component returns false in `{@link dusk.sgui.Component.onLooseFocus} this will abort.
		 * @type string
		 */
		this.focus = "";
		
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
		/** The x offset. All the contents of this container will be moved to the left this many
		 *   and any pixels that have an x less than 0 are not drawn.
		 * @type integer
		 * @since 0.0.18-alpha
		 */
		this.xOffset = 0;
		/** The y offset. All the contents of this container will be moved upwards this many
		 *   and any pixels that have an y less than 0 are not drawn.
		 * @type integer
		 * @since 0.0.18-alpha
		 */
		this.yOffset = 0;
		
		/** The horizontal scrolling. Set to a range, and the fractional value of the range (from 0.0 to 1.0) will be
		 * interpreted as the "scrolling" where 0.0 is an xOffset of 0, while 1.0 is the maximum offset possible.
		 * @type dusk.utils.Range
		 * @since 0.0.19-alpha
		 */
		this.horScroll = null;
		/** Internal storage for horizontal scrolling.
		 * @type dusk.utils.Range
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._horScroll = null;
		/** The id of the "onchanged" listener for horizontal scrolling.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._horChangedId = 0;
		/** The vertical scrolling. Set to a range, and the fractional value of the range (from 0.0 to 1.0) will be
		 * interpreted as the "scrolling" where 0.0 is an yOffset of 0, while 1.0 is the maximum offset possible.
		 * @type dusk.utils.Range
		 * @since 0.0.19-alpha
		 */
		this.verScroll = null;
		/** Internal storage for vertical scrolling.
		 * @type dusk.utils.Range
		 * @private
		 * @since 0.0.19-alpha
		 */
		this._verScroll = null;
		/** The id of the "onchanged" listener for vertical scrolling.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._verChangedId = 0;
		
		/** If true, then you can roll over components that have their `{@link dusk.sgui.Component#allowMouse}` property
		 *  set to true to focus them.
		 * @type boolean
		 * @default true
		 * @since 0.0.20-alpha
		 */
		this.mouseFocus = true;
		
		/** An event dispatcher which is fired before children are drawn.
		 * 
		 * The event object is the same one given to the draw function.
		 * @type dusk.utils.EventDispatcher
		 * @protected
		 * @since 0.0.21-alpha
		 */
		this._onBeforePaintChildren = new EventDispatcher("dusk.sgui.Group._onBeforePaintChildren");
		
		//Prop masks
		this._mapper.map("focus", "focus", ["children"]);
		this._mapper.map("focusBehaviour", "focusBehaviour");
		this._mapper.map("focusVisible", "focusVisible");
		this._mapper.map("xOffset", "xOffset");
		this._mapper.map("yOffset", "yOffset");
		this._mapper.map("mouseFocus", "mouseFocus");
		this._mapper.map("horScroll", "horScroll", ["children", "allChildren", "width"]);
		this._mapper.map("verScroll", "verScroll", ["children", "allChildren", "height"]);
		this._mapper.map("children", [_childrenGetter, this.modifyComponent], ["focusBehaviour"]);
		this._mapper.map("allChildren", [_childrenGetter, this.modifyAllChildren], ["focusBehaviour", "children"]);
		this._mapper.map("mouseFocus", "mouseFocus");
		this._mapper.map("mouse.focus", "mouseFocus");
		
		//Listeners
		this.onPaint.listen(this._groupDraw.bind(this));
		this.frame.listen(_groupFrame.bind(this));
		this.onDelete.listen((function(e) {this.empty();}).bind(this));
		
		this.onActiveChange.listen((function(e){
			if(this.focusBehaviour == Group.FOCUS_ALL) {
				for(var c = this._componentsArr.length-1; c >= 0; c --) {
					this._componentsArr[c].onActiveChange.fire(e, e.active);
				}
			}else if(this.getFocusedChild()) {
				this.getFocusedChild().onActiveChange.fire(e, e.active);
			}
		}).bind(this));
	};
	Group.prototype = Object.create(Component.prototype);
	
	/** A mode that indicates that only one component can be active.
	 * 
	 * This means that only the currently focused component will get the keypresses and such.
	 * @type integer
	 * @constant
	 * @static
	 * @value 0
	 */
	Group.FOCUS_ONE = 0;
	
	/** A mode that indicates that all the components are active.
	 * 
	 * This means that all the components will recieve keypress events and stuff.
	 *	A component is still technically "focused", but all components will act as if they are.
	 * 
	 * @type integer
	 * @constant
	 * @static
	 * @value 1
	 */
	Group.FOCUS_ALL = 1;
	
	containerUtils.implementIContainer(Group.prototype, "_components");
	
	/** Override of `{@link dusk.sgui.Component.interact}`. Calls the interact method of all focused children, and if
	 *  they all return true, then calls interact of Component with itself.
	 * 
	 * @param {object} e The interaction event.
	 * @return {boolean} True if the event should bubble, else false.
	 */
	Group.prototype.interact = function(e) {
		this._mouseSelect();
		
		if(this.focusBehaviour == Group.FOCUS_ALL) {
			var toReturn = true;
			for(var c = this._componentsArr.length-1; c >= 0; c --) {
				toReturn = this._componentsArr[c].interact(e) && toReturn;
			}
			if(!toReturn) return false;
		}else{
			if(this.getFocusedChild() && !this.getFocusedChild().interact(e)) return false;
		}
		
		return Component.prototype.interact.call(this, e);
	};
	
	/** Override of `{@link dusk.sgui.Component.control}`. Calls the control method of all focused children, and if
	 *  they all return true, then calls control of Component with itself.
	 * 
	 * @param {object} e The interaction event.
	 * @param {array} controls All controls that match this event.
	 * @return {boolean} True if the event should bubble, else false.
	 */
	Group.prototype.control = function(e, controls) {
		if(this.focusBehaviour == Group.FOCUS_ALL) {
			var toReturn = true;
			for(var c = this._componentsArr.length-1; c >= 0; c --) {
				toReturn = this._componentsArr[c].control(e, controls) && toReturn;
			}
			if(!toReturn) return false;
		}else{
			if(this.getFocusedChild() && !this.getFocusedChild().control(e, controls)) return false;
		}
		
		return Component.prototype.control.call(this, e, controls);
	};
	
	/** Container specific method of handling clicks.
	 * 
	 * In this case, it will call `{@link dusk.sgui.Component#mouse#doClick}` of the highest component the mouse is on,
	 *  and return that value. Failing that, it will return true.
	 * 
	 * @param {object} e The interaction event.
	 * @return {boolean} The return value of the focused component's keypress.
	 */
	Group.prototype.containerClick = function(e) {
		if(this.allowMouse) {
			for(var i = this._drawOrder.length-1; i >= 0; i --) {
				if(this._drawOrder[i] in this._components && this._components[this._drawOrder[i]].visible
				&& !this._components[this._drawOrder[i]].clickPierce) {
					
					var com = this._components[this._drawOrder[i]];
					if(com.mouseHovered) {
						return this._components[this._drawOrder[i]].doClick(e);
					}
				}
			}
		}
		
		return true;
	};

	/** Creates a new component of the specified type.
	 * 
	 * `type` is a string, and must have been previously registered with `{@link dusk.sgui.registerType}`.
	 *	This will be the object which is created.
	 * 
	 * @param {string} com The name of the new component.
	 * @param {?string} type The type to add as described above. If not specified, `"NullCom"` is used.
	 * @return The component that was added.
	 * @private
	 */
	Group.prototype._newChild = function(com, type) {
		if(type === undefined) type = "NullCom";
		if(!sgui.getType(type)){
			throw new TypeError(type + " is not a valid component type.");
		}
		
		this._components[com.toLowerCase()] = new (sgui.getType(type))(this, com.toLowerCase());
		this._componentsArr.push(this._components[com.toLowerCase()]);
		this._drawOrder[this._drawOrder.length] = com.toLowerCase();
		sgui.applyStyles(this._components[com.toLowerCase()]);
		if(this.focusBehaviour == Group.FOCUS_ALL) {
			this._components[com.toLowerCase()].onFocusChange.fire({"focus":true}, true);
			if(this.active)
				this._components[com.toLowerCase()].onActiveChange.fire({"active":true}, true);
		}
		
		return this._components[com.toLowerCase()];
	};
	
	/** Modifies this component's children using JSON data.
	 *	See `dusk.sgui.Component.update` for a basic description on how JSON properties work.
	 * 
	 * `data` is either a single component description, an array of component description or an object with the keys
	 *  being component names, and the value being their data. Each component must have a `name` property, stating the
	 *  name of the component they are modifying. This is the key when describing multiple components using an object.
	 *	It may also have a `type` property, which will be used in case the component does not exist to set its type.
	 * 	If the component does not exist and `type` is omitted, then a warning is raised, and that object is skipped.
	 * 
	 * This may be used in the JSON representation with the property `children`.
	 * 
	 * @param {object|array} data Information about components, as described above.
	 * @return {boolean} True if modification was successfull for all components.
	 */
	Group.prototype.modifyComponent = function(data) {
		var success = true;
		if(Array.isArray(data)) {
			for (var i = 0; i < data.length; i++) {
				if(("name" in data[i]) && this.get(data[i].name.toLowerCase(), data[i].type)) {
					this.get(data[i].name.toLowerCase()).update(data[i]);
					sgui.applyStyles(this.get(data[i].name.toLowerCase()));
				}else if(data[i].name){
					console.warn(data[i].name + " has not been given a type and does not exist, ignoring.");
					success = false;
				}else{
					console.warn("A component has no name in "+this.name+", cannot create or edit.");
					success = false;
				}
			}
		}else{
			if("name" in data && typeof data.name == "string") {
				if(this.get(data.name.toLowerCase(), data.type)) {
					return this.get(data.name.toLowerCase()).update(data);
					sgui.applyStyles(this.get(data.name.toLowerCase()));
				}
				console.warn(data.name + " has not been given a type and does not exist, ignoring.");
				return false;
			}else{
				for(var p in data) {
					if(this.get(p.toLowerCase(), data[p].type)) {
						this.get(p.toLowerCase()).update(data[p]);
						sgui.applyStyles(this.get(p.toLowerCase()));
					}else{
						console.warn(p + " has not been given a type and does not exist, ignoring.");
						success = false;
					}
				}
			}
		}
		
		return success;
	};
	var _childrenGetter = function() {
		var hold = [];
		for(var i = 0; i < this._drawOrder.length; i++) {
			hold[hold.length] = this._components[this._drawOrder[i]].bundle();
			hold[hold.length-1].type = sgui.getTypeName(this._components[this._drawOrder[i]]);
		}
		return hold;
	}
	
	/** Similar to `{@link dusk.sgui.Group.modifyChildren}`
	 *   only it modifies the properties of all the children instead of one.
	 * 
	 * Hence, the `type` and `name` properties are not needed or required.
	 * 
	 * This may be used in the JSON representation as the property `allChildren`.
	 * 
	 * @param {object} data Data used to modify all the children in this group.
	 */
	Group.prototype.modifyAllChildren = function(data) {
		for(var c = this._componentsArr.length-1; c >= 0; c --) {
			this._componentsArr[c].update(data);
		}
	};
	
	Group.prototype._groupDraw = function(e) {
		this._onBeforePaintChildren.fire(e);
		
		var rect = PosRect.pool.alloc();
		var display = PosRect.pool.alloc();
		var slice = PosRect.pool.alloc();
		
		rect.setWH(0, 0, e.d.origin.width, e.d.origin.height);
		
		display.setWH(e.d.dest.x, e.d.dest.y, 0, 0);
		
		slice.setWH(e.d.slice.x + this.xOffset, e.d.slice.y + this.yOffset, e.d.slice.width,e.d.slice.height);
		
		for(var i = 0; i < this._drawOrder.length; i++) {
			if(this._drawOrder[i] in this._components) {
				var c = this._components[this._drawOrder[i]];
				
				c.paintContainer(e.c, rect, slice, display, 0, 0);
			}
		}
		
		PosRect.pool.free(rect);
		PosRect.pool.free(display);
		PosRect.pool.free(slice);
	};
	
	/** Calls the `{@link dusk.sgui.Component.frame}` method of all components.
	 * 
	 * @private
	 */
	var _groupFrame = function(e) {
		for(var c = this._componentsArr.length-1; c >= 0; c --){
			this._componentsArr[c].frame.fire(e);
		}
	};
	
	/** Returns a component in this group.
	 * 
	 * If `type` is not undefined, then the component will be created of that type if it exists.
	 * 
	 * @param {string} com The name of the component to get.
	 * @param {?string} type The type of component to create.
	 * @return {?dusk.sgui.Component} The component, or undefined if it doesn't exist and `type` is undefined.
	 * @since 0.0.21-alpha
	 */
	Group.prototype.get = function(com, type) {
		if (this._components[com.toLowerCase()]) {
			return this._components[com.toLowerCase()];
		}
		
		return type?this._newChild(com, type):undefined;
	};
	
	/** Sets a component in this group from either a component or raw JSON data.
	 * 
	 * @param {string} name The name of the component to set.
	 * @param {object|dusk.sgui.Component} data The component data.
	 * @return {boolean} True if set successfully.
	 * @since 0.0.21-alpha
	 */
	Group.prototype.set = function(name, data) {
		if(data instanceof Component) {
			if(data.container && data.container == this) {
				// Already set, do nothing

			}else{
				this._components[name.toLowerCase()] = data;
				this._componentsArr.push(data);
				this._drawOrder.push(name.toLowerCase());
				sgui.applyStyles(data);
				if(this.focusBehaviour == Group.FOCUS_ALL) {
					data.onFocusChange.fire({"focus":true}, true);
					if(this.active) data.onActiveChange.fire({"active":true}, true);
				}

				if(data.container) {
					throw TypeError("Tried to add component "+data+" to "+this+" but it is already in "+data.container);
				}

				data.container = this;
			}
			
			data.name = name;
			return data;
		}
		
		data.name = name;
		return this.modifyComponent(data);
	};
	
	/** Removes a component from this group and then deletes it
	 * 
	 * As per "remove", but then deletes it by firing it's onDelete listener.
	 * 
	 * @param {string} com The name of the component to delete.
	 * @return {boolean} If the delete was successful, this will return false if the component doesn't exist.
	 * @since 0.0.21-alpha
	 */
	Group.prototype.delete = function(com) {
		if(this._components[com.toLowerCase()]){
			var c = this._components[com.toLowerCase()]
			this.remove(com);
			c.onDelete.fire({"com":c});
			return true;
		}
	};
	
	/** Removes a component from this group.
	 * 
	 * This will not remove any references to it elsewhere but will remove it from the list of components and the draw
	 *  order.
	 * 
	 * @param {string} com The name of the component to delete.
	 * @return {boolean} If the delete was successful, this will return false if the component doesn't exist.
	 * @since 0.0.21-alpha
	 */
	Group.prototype.remove = function(com) {
		if(this._components[com.toLowerCase()]){
			var c = this._components[com.toLowerCase()];
			
			if(this._focusedCom == com.toLowerCase()) this.focus = "";
			this._componentsArr.splice(this._componentsArr.indexOf(this._components[com.toLowerCase()]), 1);
			delete this._components[com.toLowerCase()];
			this._drawOrder.splice(this._drawOrder.indexOf(com.toLowerCase()), 1);
			
			// Make removed components lose active status and focus
			if(c.active) c.onActiveChange.fire({active:false});
			if(c.focus) c.onFocusChange.fire({focus:false});
			
			// And clear the container thing
			c.container = undefined;
			
			return true;
		}
	};
	
	/** Deletes all the components in this group.
	 * 
	 * @since 0.0.21-alpha
	 */
	Group.prototype.empty = function() {
		for(var c = this._componentsArr.length-1; c >= 0; c --) {
			this.delete(this._componentsArr[c].name);
		}
	};
	
	
	
	//focus
	Group.prototype.__defineSetter__("focus", function s_focus(value) {
		if(value) this.flow(value);
	});
	Group.prototype.__defineGetter__("focus", function g_focus() {
		return this._focusedCom;
	});
	
	/** Returns the currently focused component.
	 * 
	 * @return {?dusk.sgui.Component} The currently focused component or null if nothing is focused.
	 */
	Group.prototype.getFocusedChild = function() {
		if(!(this._focusedCom in this._components)) return null;
		return this._components[this._focusedCom];
	};
	
	/** Sets the current focused component only if it exists,
	 *   the current focus's `{@link dusk.sgui.Component.locked}` property is false
	 *   and the new component's `{@link dusk.sgui.Component.enabled}` property is true.
	 * 
	 * @param {string} to The name of the component to flow into.
	 * @return {boolean} Whether the flow was successfull.
	 */
	Group.prototype.flow = function(to) {
		if(this._focusedCom !== "" && this._components[this._focusedCom]){
			if(this._components[this._focusedCom].locked){return false;}
			
			if(this.focusBehaviour != Group.FOCUS_ALL && this.active)
				this._components[this._focusedCom].onActiveChange.fire({"active":false}, false);
			if(this.focusBehaviour != Group.FOCUS_ALL)
				this._components[this._focusedCom].onFocusChange.fire({"focus":false}, false);
			
			if(this.focusVisible) this._components[this._focusedCom].visible = false;
		}
		
		if(this._components[to.toLowerCase()]){
			this._focusedCom = to.toLowerCase();
			if(this.focusBehaviour != Group.FOCUS_ALL)
				this._components[this._focusedCom].onFocusChange.fire({"focus":true}, true);
			if(this.focusBehaviour != Group.FOCUS_ALL && this.active)
				this._components[this._focusedCom].onActiveChange.fire({"active":true}, true);
			
			if(this.focusVisible) this._components[this._focusedCom].visible = true;
			return true;
		}
		
		console.warn(to+" was not found, couldn't set focus.");
		
		this._focusedCom = "";
	};
	
	//focusBehaviour
	Object.defineProperty(Group.prototype, "focusBehaviour", {
		set: function(value) {
			if(this._focusBehaviour == value) return;
			this._focusBehaviour = value;
			
			switch(this._focusBehaviour) {
				case Group.FOCUS_ONE:
					for(var c = this._componentsArr.length-1; c >= 0; c --) {
						if(this._components[this._focusedCom] != this._componentsArr[c]) {
							if(this.active) this._componentsArr[c].onActiveChange.fire({"active":false}, false);
							this._componentsArr[c].onFocusChange.fire({"focus":false}, false);
						}
					}
					break;
					
				case Group.FOCUS_ALL:
					for(var c = this._componentsArr.length-1; c >= 0; c --) {
						if(this._components[this._focusedCom] != this._componentsArr[c]) {
							this._componentsArr[c].onFocusChange.fire({"focus":true}, true);
							if(this.active) this._componentsArr[c].onActiveChange.fire({"active":true}, true);
						}
					}
					break;
			}
		},
		
		get: function() {
			return this._focusBehaviour;
		}
	});
	
	//focusVisible
	Object.defineProperty(Group.prototype, "focusVisible", {
		set: function(value) {
			if(this._focusVisible == value) return;
			this._focusVisible = !!value;
			
			if(this._focusVisible) {
				for(var c = this._componentsArr.length-1; c >= 0; c --) {
					if(this._focusedCom != this._componentsArr[c].name) {
						this._componentsArr[c].visible = false;
					}else{
						this._componentsArr[c].visible = true;
					}
				}
			}
		},
		
		get: function() {
			return this._focusVisible;
		}
	});
	
	
	
	/** Alters the layer components are on; higher layers are drawn later, appearing on top of others.
	 * 
	 * The alter must be an expression that says how to alter the layer, and be in one of the following forms.
	 * 
	 * - `"+"` Raises the component to the top, making it on top of all other components.
	 * - `"-"` Lowers the component below all the others, meaning that it will appear below them.
	 * - `"+com"` Raises it just above the component named "com" (which must exist).
	 * - `"-com"` Lowers it just below the component named "com" (which must exist).
	 * 
	 * @param {string} com The name of the component to alter the layer of.
	 * @param {string} alter The alteration to make.
	 * @since 0.0.17-alpha
	 */
	Group.prototype.alterChildLayer = function(com, alter) {
		var o = 0;
		var frags = [alter.charAt(0), alter.substr(1)];
		var dropped = false;
		
		if(frags[1] !== "" && !this.get(frags[1])) {
			console.warn("Tried to alter layer based on an invalid component "+frags[1]+".");
			return;
		}
		if(!this.get(com)) {
			console.warn("Tried to reorder non-existant component "+com+".");
			return;
		}
		if(!(frags[0] === "+" || frags[0] === "-")) {
			console.warn("Invalid layer alteration: Must have '+' or '-' as first character.");
			return;
		}
		
		var old = this._drawOrder;
		this._drawOrder = [];
		
		for(var i = 0; i < old.length; i ++) {
			if(!dropped && ((i == 0 && frags[0] === "-" && frags[1] === "")
			|| (old[o] === frags[1] && frags[0] === "-")
			|| (i == old.length-1 && frags[0] === "+" && frags[1] === "")
			|| (old[o-1] === frags[1] && frags[0] === "+"))) {
				this._drawOrder[i] = com;
				dropped = true;
			}else{
				if(old[o] !== com) {
					this._drawOrder[i] = old[o];
				}else{
					i --;
				}
				o ++;
			}
		}
	};
	
	
	/** Returns the full path of this component.
	 * 
	 * This should be able to be given to `{@link dusk.sgui.path}` and will point to this component.
	 * @return {string} A full path to this component.
	 * @since 0.0.17-alpha
	 */
	Group.prototype.fullPath = function() {
		return Component.prototype.fullPath.call(this) + "/";
	};
	
	
	/** Returns the deepest focused component.
	 * 
	 * If this Group has a focused component and `focusBehaviour` is `MODE_ONE`, returns the focused child's
	 *  `getDeepestFocused` method (if it is a Group) or the focused child itself (otherwise), otherwise returns this.
	 * 
	 * @return {dusk.sgui.Component} The deepest component that is the focus of all its parent groups.
	 * @since 0.0.21-alpha
	 */
	Group.prototype.getDeepestFocused = function() {
		if(this.focusBehaviour != Group.FOCUS_ONE || !this.getFocusedChild()) return this;
		if(this.getFocusedChild() instanceof Group) return this.getFocusedChild().getDeepestFocused();
		return this.getFocusedChild();
	};
	
	
	
	//Please note that to set the width to -2, all the parent's must have either an explicit width, or a width of -2
	// otherwise Chrome will explode.
	//Width
	Object.defineProperty(Group.prototype, "width", {
		get: function() {
			return this._width;
		},
		
		set: function(value) {
			this._width = value;
		}
	});
	
	//Height
	Object.defineProperty(Group.prototype, "height", {
		get: function() {
			return this._height;
		},
		
		set: function(value) {
			this._height = value;
		}
	});
	
	//Width
	Group.prototype.getRenderingWidth = function() {
		if(this._width == -1) {
			return this.getContentsWidth(true, true);
		}else{
			return this._width;
		}
	};
	
	//Height
	Group.prototype.getRenderingHeight = function() {
		if(this._height == -1) {
			return this.getContentsHeight(true, true);
		}else{
			return this._height;
		}
	};
	
	/** Returns the smallest width which has all the components fully drawn inside.
	 * 
	 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
	 * @param {boolean} rendering If true, use their rendering width rather than their stated width.
	 * @return {integer} The smallest possible width where all the components are fully inside.
	 * @since 0.0.18-alpha
	 */
	Group.prototype.getContentsWidth = function(includeOffset, rendering) {
		var max = 0;
		for(var c of this._componentsArr) {
			var width = !rendering ? c.width : c.getRenderingWidth();
			if(c.x + width > max) {
				max = c.x + width;
			}
		}
		
		return max - (includeOffset?this.xOffset:0);
	};
	
	/** Returns the smallest height which has all the components fully drawn inside.
	 * 
	 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
	 * @param {boolean} rendering If true, use their rendering width rather than their stated width.
	 * @return {integer} The smallest possible height where all the components are fully inside.
	 * @since 0.0.18-alpha
	 */
	Group.prototype.getContentsHeight = function(includeOffset, rendering) {
		var max = 0;
		for(var c of this._componentsArr) {
			var height = !rendering ? c.height : c.getRenderingHeight();
			if(c.y + height > max)
				max = c.y + height;
		}
		
		return max - (includeOffset?this.yOffset:0);
	};
	
	
	
	//horScroll
	Object.defineProperty(Group.prototype, "horScroll", {
		set: function(value) {
			if(this._horScroll) this._horScroll.onChange.unlisten(this._horChangedId);
			this._horScroll = value;
			if(this._horScroll) {
				this._horChangedId = this._horScroll.onChange.listen(_horChanged.bind(this));
				_horChanged.call(this, {});
			}
		},
		
		get: function() {
			return this._horScroll;
		}
	});
	
	/** Used to manage the changing of horizontal scrolling.
	 * @param {object} e The event object.
	 * @return {object} The event object, unchanged.
	 * @private
	 * @since 0.0.19-alpha
	 */
	var _horChanged = function(e) {
		if(this.getContentsWidth() < this.width) {
			this.xOffset = 0;
			return;
		}
		this.xOffset = ~~(this._horScroll.getFraction() * (this.getContentsWidth() - this.width));
		
		return e;
	};
	
	//verScroll
	Object.defineProperty(Group.prototype, "verScroll", {
		set: function(value) {
			if(this._verScroll) this._verScroll.onChange.unlisten(this._verChangedId);
			this._verScroll = value;
			if(this._verScroll) {
				this._verChangedId = this._verScroll.onChange.listen(_verChanged.bind(this));
				_verChanged.call(this, {});
			}
		},
		
		get: function() {
			return this._verScroll;
		}
	});
	
	/** Used to manage the changing of vertical scrolling.
	 * @param {object} e The event object.
	 * @return {object} The event object, unchanged.
	 * @private
	 * @since 0.0.19-alpha
	 */
	var _verChanged = function(e) {
		if(this.getContentsHeight() < this.height) {
			this.yOffset = 0;
			return;
		}
		this.yOffset = ~~(this._verScroll.getFraction() * (this.getContentsHeight() - this.height));
		return e;
	};
	
	
	
	/** Calls the function once for each component.
	 * 
	 * @param {function(dusk.sgui.Component):undefined} funct The function to call. Will be given the current component
	 *  as an argument.
	 * @param {*} scope The scope in which to call the function.
	 * @since 0.0.20-alpha
	 */
	Group.prototype.forEach = function(func, scope) {
		for(var c = this._componentsArr.length-1; c >= 0; c --) {
			func.call(scope, this._componentsArr[c]);
		}
	};
	
	
	
	/** Handles mouse selection of components, if enabled.
	 * 
	 * @since 0.0.21-alpha
	 */
	Group.prototype._mouseSelect = function() {
		if(this.mouseFocus) {
			for(var i = this._drawOrder.length-1; i >= 0; i --) {
				if(this._drawOrder[i] in this._components && this._components[this._drawOrder[i]].allowMouse) {
					var com = this._components[this._drawOrder[i]];
					if(com.mouseHovered && com.visible) {
						if(com != this.getFocusedChild()) this.flow(this._drawOrder[i]);
						break;
					}
				}
			}
		}
		
		return true;
	};
	
	/** Returns a fancy representation of this element, groups overload this and make it look prettier.
	 * 
	 * @param {?array<dusk.sgui.Component>} logarr Arguments to pass to console.log. Append anything to this if needed.
	 * @return {string} A string representation of this component.
	 */
	Group.prototype.describe = function(logarr) {
		var holdstr = "\u2554\u2550\u2550\u2550\u2550 ";
		holdstr += this.name;
		if(this.active) holdstr += "*";
		if(this.allowMouse && !this.mouseAction) holdstr += "'";
		if(this.allowMouse && this.mouseAction) holdstr += "\"";
		
		logarr.push(this);
		holdstr += " %o\n%c";
		logarr.push("color:#660000;");
		
		for(var c of this._componentsArr) {
			holdstr += "\u2551"+c.describe(logarr).replace(/\n%c/gi, "\n%c\u2551")+"\n%c";
			logarr.push("color:#660000;");
		}
		
		var endln = "\u255A" + "\u2550".repeat(4);
		
		return holdstr+endln;
	};
	
	sgui.registerType("Group", Group);
	
	return Group;
});
