//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Pane", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** Creates a new pane.
	 * 
	 * @param {?dusk.sgui.IContainer} parent The container that this component is in, this will always be null for panes.
	 * @param {string} comName The name of the component.
	 * 
	 * @class dusk.sgui.Pane
	 * 
	 * @classdesc A pane is a special type of group which is "allowed" to have no parent.
	 * 
	 * It used by `{@link dusk.sgui}` as the root for any component tree.
	 * 
	 * @extends dusk.sgui.Group
	 */
	var Pane = function (parent, comName) {
		Group.call(this, null, comName);
		
		//Prop masks
		this._registerPropMask("active", "__active", true);
		
		this.height = -2;
		this.width = -2;
	};
	Pane.prototype = Object.create(Group.prototype);

	Object.defineProperty(Pane.prototype, "__active", {
		set: function(value) {if(value) this.becomeActive();},
		
		get: function() {return sgui.getActivePane() == this;}
	});

	/** Returns the actual X location, relative to the screen, that the component is at.
	 * @param {string} name The component to find X for.
	 * @return {integer} The X value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Pane.prototype.getTrueX = function(name) {
		var com = this._components[name];
		
		var destXAdder = 0;
		if(com.xOrigin == c.ORIGIN_MAX) destXAdder = this.width - com.width;
		if(com.xOrigin == c.ORIGIN_MIDDLE) destXAdder = (this.width - com.width)>>1;
		
		return this.x + com.x - this.xOffset + destXAdder;
	};

	/** Returns the actual Y location, relative to the screen, that the component is at.
	 * @param {string} name The component to find X for.
	 * @return {integer} The Y value, relative to the screen.
	 * @since 0.0.20-alpha
	 */
	Pane.prototype.getTrueY = function(name) {
		var com = this._components[name];
		
		var destYAdder = 0;
		if(com.yOrigin == c.ORIGIN_MAX) destYAdder = this.height - com.height;
		if(com.yOrigin == c.ORIGIN_MIDDLE) destYAdder = (this.height - com.height)>>1;
		
		return this.y + com.y - this.yOffset + destYAdder;
	};

	/** Makes this component the active one, by making all its parents make it active.
	 * @param {?dusk.sgui.Component} child A child that wants to be made active.
	 * @since 0.0.21-alpha
	 */
	Pane.prototype.becomeActive = function(child) {
		if(child) this.flow(child.comName);
		
		sgui.setActivePane(this.comName);
	};

	Object.seal(Pane);
	Object.seal(Pane.prototype);
	
	sgui.registerType("Pane", Pane);
	
	return Pane;
})());
