//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Feed", function() {
	var Grid = load.require("dusk.sgui.Grid");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	
	/** A feed is a list of componests in a horizontal or vertical order and allows new components to be
	 *  appended to the end of it.
	 * 
	 * A component is appended using `{@link dusk.sgui.Feed.append}`, and is added to the side of the feed given by
	 *  `{@link dusk.sgui.Feed.appendDir}`. If a component is deleted, than all the components after it will be shifted
	 *  to fill in the space.
	 * 
	 * This extends group, but the `populate` method and the `recycle` and `removeOld` properties must not be changed.
	 * 
	 * @extends dusk.sgui.Grid
	 * @memberof dusk.sgui
	 * @since 0.0.21-alpha
	 */
	class Feed extends Grid {
		/** Creates a new Feed.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** The direction to append. This must be one of the dusk.sgui.c.DIR_* constants. This determines whether the
			 *  feed displays horizontally or vertically.
			 * @type integer
			 * @default dusk.sgui.c.DIR_DOWN
			 * @memberof! dusk.sgui.Feed#
			 */
			this.appendDir = c.DIR_DOWN;
			
			/** The array of components in this feed.
			 * 
			 * @type array<dusk.sgui.Component>
			 * @protected
			 * @memberof! dusk.sgui.Feed#
			 */
			this._appendees = [];
			
			// Set properties
			this.recycle = false;
			this.removeOld = true;
			
			//Prop masks
			this._mapper.map("appendDir", "appendDir");
			this._mapper.map("append", [function() {return undefined;}, this.append],
				["rows", "cols", "spacing", "globals", "appendDir"]
			);
			
			//Listeners
			this._populationEvent.listen((function(e) {
				if(this.appendDir == c.DIR_DOWN) {
					this.rows = this._appendees.length;
					this.cols = 1;
				}else{
					this.rows = 1;
					this.cols = this._appendees.length;
				}
				
				e.child = this._appendees;
			}).bind(this));
			
		}
		
		/** Appends the specified component object, or an array of components.
		 * 
		 * The value must be an object or an array of objects, which will be used with
		 *  `{@link dusk.sgui.Component.update}` to create the object.
		 * 
		 * This may be used in the JSON representation with the property `append`.
		 * 
		 * @param {(object|array)} child A description of the object or objects to set.
		 */
		append(child) {
			if(child === undefined) return;
			if(!Array.isArray(child)) child = [child];
			
			for(var i = 0; i < child.length; i++){
				var com = this._makeComponent(child[i]);
				
				var j = this._appendees.length;
				
				com.onDelete.listen((function(j) {
					this._appendees.splice(this._appendees.indexOf(com), 1);
					this.populate(this._appendees);
				}).bind(this, j));
				
				this._appendees.push(com);
			}
			
			this.populate(this._appendees);
		}
	}
	
	sgui.registerType("Feed", Feed);
	
	return Feed;
});
