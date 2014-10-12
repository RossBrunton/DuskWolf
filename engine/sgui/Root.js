//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Root", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
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
		
		//Roots are always active and focused
		this.active = true;
		this.focused = true;
	};
	Root.prototype = Object.create(Group.prototype);

	/** Returns the actual X location, relative to the screen, that the component is at.
	 * @param {string} name The component to find X for.
	 * @return {integer} The X value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Root.prototype.getTrueX = function(name) {
		var com = this._components[name];
		
		var destXAdder = 0;
		if(com.xOrigin == "right") destXAdder = this.width - com.width;
		if(com.xOrigin == "middle") destXAdder = (this.width - com.width)>>1;
		
		return this.x + com.x - this.xOffset + destXAdder;
	};

	/** Returns the actual Y location, relative to the screen, that the component is at.
	 * @param {string} name The component to find X for.
	 * @return {integer} The Y value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Root.prototype.getTrueY = function(name) {
		var com = this._components[name];
		
		var destYAdder = 0;
		if(com.yOrigin == "bottom") destYAdder = this.height - com.height;
		if(com.yOrigin == "middle") destYAdder = (this.height - com.height)>>1;
		
		return this.y + com.y - this.yOffset + destYAdder;
	};
	
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
		return this.name+":";
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
	
	sgui.registerType("Root", Root);
	
	return Root;
})());
