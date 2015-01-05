//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Feed", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	
	/** @class dusk.sgui.Feed
	 * 
	 * @classdesc A feed is a list of componests in a horizontal or vertical order and allows new components to be
	 *  appended to the end of it.
	 * 
	 * A component is appended using `{@link dusk.sgui.Feed.append}`, and is added to the side of the feed given by
	 *  `{@link dusk.sgui.Feed.appendDir}`. If a component is deleted, than all the components after it will be shifted
	 *  to fill in the space.
	 * 
	 * Components in a feed have a fixed x and y coordinate, which should not be changed.
	 * 
	 * @extends dusk.sgui.Group
	 * @param {?dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var Feed = function (parent, name) {
		Group.call(this, parent, name);
		
		/** The space, in pixels, between each grid component.
		 * 
		 * @type integer
		 */
		this.spacing = 0;
		
		/** Global properties. These will be set to all children while they are appended.
		 * @type object
		 */
		this.globals = null;
		
		/** The direction to append. This must be one of the dusk.sgui.c.DIR_* constants. This determines whether the
		 *  feed displays horizontally or vertically.
		 * @type integer
		 * @default dusk.sgui.c.DIR_DOWN
		 */
		this.appendDir = c.DIR_DOWN;
		
		/** This event handler is fired during three stages of a component being added; at the beginning, when a
		 *  component is created, and after all components are appended.
		 * 
		 * The event object has up to three properties:
		 * - `child` The child object data, this may be changed to affect the component being added.
		 * - `action` Either `"before"`, `"create"` or `"complete"` depending on the population stage.
		 * - `component` Only on `create` events. This is the component that was created.
		 * - `current` Only on `create` events. This is the object that was used to create the component.
		 * 
		 * The handler MUST return the event object when it is finished with it.
		 * 
		 * @type dusk.utils.EventDispatcher
		 * @protected
		 */
		this._appendEvent = new EventDispatcher("dusk.sgui.Feed._appendEvent");
		
		//Prop masks
		this._mapper.map("spacing", "spacing");
		this._mapper.map("appendDir", "appendDir");
		this._mapper.map("globals", "globals");
		this._mapper.map("append", [function() {return undefined;}, this.append],
			["rows", "cols", "spacing", "globals", "appendDir"]
		);
		
		//Listeners
		this.dirPress.listen(_dirAction.bind(this));
		this.frame.listen(_frame.bind(this));
	};
	Feed.prototype = Object.create(Group.prototype);
	
	/** Appends the specified component object, or an array of components.
	 * 
	 * The value must be an object or an array of objects, which will be used with
	 *  `{@link dusk.sgui.Component.update}` to create the object.
	 * 
	 * This may be used in the JSON representation with the property `append`.
	 * 
	 * @param {object|array} child A description of the object or objects to set.
	 */
	Feed.prototype.append = function(child) {
		if(child === undefined) return;
		if(!Array.isArray(child)) child = [child];
		
		//Fire before event
		child = this._appendEvent.firePass({"action":"before", "child":child}, "before").child;
		
		for(var i = 0; i < child.length; i++){
			var com = null;
			var name = child[i].name;
			if(!name) {
				name = "0";
				while(this.getComponent(name)) {
					name = ""+ (+name + 1);
				}
			}
			
			if(!("type" in child[i]) && this.globals !== null && "type" in this.globals) {
				com = this.getComponent(name, this.globals.type);
			}else if("type" in child[i]) {
				com = this.getComponent(name, child[p].type);
			}else{
				console.warn("Feed tried to append element with no type.");
			}
			
			var com = this._appendEvent.firePass({"action":"create", "current":child[i], "child":child, "component":com,
				"globals":this.globals
			}, "create").component;
			
			if(this.globals !== null) com.update(utils.clone(this.globals));
			com.update(utils.clone(child[i]));
			this.alterChildLayer(name, "+");
		}
		
		this._appendEvent.firePass({"action":"complete", "child":child}, "complete");
	};
	
	/** Called every frame to manage component locations.
	 * @private
	 */
	var _frame = function() {
		var space = 0;
		
		if(this.appendDir & (c.DIR_UP | c.DIR_LEFT)) {
			for(var i = this._drawOrder.length-1; i >= 0; i --) {
				var com = this.getComponent(this._drawOrder[i]);
				if(this.appendDir == c.DIR_UP) {
					com.y = space;
					com.x = 0;
					space += com.height + this.spacing;
				}else{
					com.x = space;
					com.y = 0;
					space += com.width + this.spacing;
				}
			}
		}else{
			for(var i = 0; i < this._drawOrder.length; i ++) {
				var com = this.getComponent(this._drawOrder[i]);
				if(this.appendDir == c.DIR_DOWN) {
					com.y = space;
					com.x = 0;
					space += com.height + this.spacing;
				}else{
					com.x = space;
					com.y = 0;
					space += com.width + this.spacing;
				}
			}
		}
	};
	
	/** Changes the focused component in an expected way.
	 * @param {object} e The dirAction event.
	 * @return {boolean} Whether there was a component to flow into, `false` if so, else `true`.
	 * @private
	 */
	var _dirAction = function(e) {
		if(this.focusBehaviour == Group.FOCUS_ALL) return true;
		
		var current = this._drawOrder.indexOf(this.focus);
		
		if(e.dir == c.DIR_UP && this.appendDir == c.DIR_UP)
			current ++;
		if(e.dir == c.DIR_DOWN && this.appendDir == c.DIR_UP)
			current --;
		
		if(e.dir == c.DIR_UP && this.appendDir == c.DIR_DOWN)
			current --;
		if(e.dir == c.DIR_DOWN && this.appendDir == c.DIR_DOWN)
			current ++;
		
		if(e.dir == c.DIR_LEFT && this.appendDir == c.DIR_LEFT)
			current ++;
		if(e.dir == c.DIR_RIGHT && this.appendDir == c.DIR_LEFT)
			current --;
		
		if(e.dir == c.DIR_LEFT && this.appendDir == c.DIR_RIGHT)
			current --;
		if(e.dir == c.DIR_RIGHT && this.appendDir == c.DIR_RIGHT)
			current ++;
		
		if(current < 0 || current > this._drawOrder.length || current == this._drawOrder.indexOf(this.focus)) {
			return true;
		}
		
		this.flow(this._drawOrder[current]);
		return false;
	};
	
	sgui.registerType("Feed", Feed);
	
	return Feed;
})());
