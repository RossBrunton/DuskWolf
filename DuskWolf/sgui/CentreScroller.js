//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Single");

dusk.load.provide("dusk.sgui.CentreScroller");

/** Creates a new CentreScroller
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.CentreScroller
 * 
 * @classdesc A CentreScroller is a single which, given coordinates, attempts to ensure those coordinates are in the centre of the screen.
 * 
 * Essentially, this allows you to have a single, large component, and have a paticular point (the player, for example) so that it is always visible.
 * 
 * This uses the theme key `cs.lockBounds` (default true) as the default value of `{@dusk.sgui.CentreScroller.lockBounds}`.
 * 
 * @extends dusk.sgui.Single
 */
dusk.sgui.CentreScroller = function (parent, comName) {
	if(parent !== undefined) {
		dusk.sgui.Single.call(this, parent, comName);
		
		/** If true, then this will always display as much of the component as it can, and will not try to center the coordinates if it would result in any side of the component becoming in the range.
		 * 
		 * This is set the theme value of `cs.lockBounds`.
		 * 
		 * @type number
		 * @memberof dusk.sgui.CentreScroller
		 */
		this.lockBounds = this._theme("cs.lockBounds", true);
		
		this._registerPropMask("centre", "__centre", true);
		this._registerPropMask("lockBounds", "lockBounds", true);
	}
};
dusk.sgui.CentreScroller.prototype = new dusk.sgui.Single();
dusk.sgui.CentreScroller.constructor = dusk.sgui.CentreScroller;

dusk.sgui.CentreScroller.prototype.className = "CentreScroller";

/** Sets which coordinate should be set as the centre of the component.
 * 
 * This can be set using the property `centre` when describing this using JSON.
 * 
 * @param {array} value The coordinates to set, this should be an array like [x, y].
 */
dusk.sgui.CentreScroller.prototype.centre = function(value) {
	this._component.x = -(value[0])+(this.width>>1);
	this._component.y = -(value[1])+(this.height>>1);
	
	if(this.lockBounds){
		if(this._component.x < -(this.getComponent("*").width)+this.width) this._component.x = -(this.getComponent("*").width)+this.width;
		if(this._component.y < -(this.getComponent("*").height)+this.height) this._component.y = -(this.getComponent("*").height)+this.height;
		if(this._component.x > 0) this._component.x = 0;
		if(this._component.y > 0) this._component.y = 0;
	}
};

dusk.sgui.CentreScroller.prototype.__defineSetter__("__centre", function s_centre(value) {
	this.centre(value);
});

/** Returns a four element array in the form `[x, y, width, height]` indicating what is currently visible.
 * This will be relative to the child in this single, so `x` and `y` are the upper left.
 * 
 * @return {array} A four element as described above.
 */
dusk.sgui.CentreScroller.prototype.render = function() {
	return [-this._component.x, -this._component.y, this.width, this.height];
};
