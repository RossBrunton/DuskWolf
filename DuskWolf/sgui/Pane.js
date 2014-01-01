//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");

dusk.load.provide("dusk.sgui.Pane");

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

dusk.sgui.Pane = function (parent, comName) {
	dusk.sgui.Group.call(this, null, comName);
	
	//Prop masks
	this._registerPropMask("active", "__active", true);
	
	this.height = -2;
	this.width = -2;
};
dusk.sgui.Pane.prototype = Object.create(dusk.sgui.Group.prototype);

dusk.sgui.Pane.prototype.className = "Pane";

/** Causes the pane to become the active pane.
 * 
 * This can be used in the JSON representation with the property `active` with any true value.
 */
dusk.sgui.Pane.prototype.becomeActive = function() {
	dusk.sgui.setActivePane(this.comName);
};
Object.defineProperty(dusk.sgui.Pane.prototype, "__active", {
	set: function(value) {if(value) this.becomeActive();},
	
	get: function() {return dusk.sgui.getActivePane() == this;}
});

/** Returns the actual X location, relative to the screen, that the component is at.
 * @param {string} name The component to find X for.
 * @return {integer} The X value, relative to the screen.
 * @since 0.0.20-alpha
 */
dusk.sgui.Pane.prototype.getTrueX = function(name) {
	var com = this._components[name];
	
	var destXAdder = 0;
	if(com.xOrigin == dusk.sgui.Component.ORIGIN_MAX) destXAdder = this.width - com.width;
	if(com.xOrigin == dusk.sgui.Component.ORIGIN_MIDDLE) destXAdder = (this.width - com.width)>>1;
	
	return this.x + com.x - this.xOffset + destXAdder;
};

/** Returns the actual Y location, relative to the screen, that the component is at.
 * @param {string} name The component to find X for.
 * @return {integer} The Y value, relative to the screen.
 * @since 0.0.20-alpha
 */
dusk.sgui.Pane.prototype.getTrueY = function(name) {
	var com = this._components[name];
	
	var destYAdder = 0;
	if(com.yOrigin == dusk.sgui.Component.ORIGIN_MAX) destYAdder = this.height - com.height;
	if(com.yOrigin == dusk.sgui.Component.ORIGIN_MIDDLE) destYAdder = (this.height - com.height)>>1;
	
	return this.y + com.y - this.yOffset + destYAdder;
};

Object.seal(dusk.sgui.Pane);
Object.seal(dusk.sgui.Pane.prototype);

dusk.sgui.registerType("Pane", dusk.sgui.Pane);
