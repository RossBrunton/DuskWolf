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
 * This component may have a `width` or `height` of `-1`, this means that that it will use the values `{@link dusk.sgui.width}` and `{@link dusk.sgui.height}`.
 * 
 * @extends dusk.sgui.Single
 */
dusk.sgui.CentreScroller = function (parent, comName) {
	if(parent !== undefined) {
		dusk.sgui.Single.call(this, parent, comName);
		
		/** If true, then this will always display as much of the component as it can, and will not try to center the coordinates if it would result in any side of the component becoming in the range.
		 * 
		 * @type boolean
		 * @default true
		 */
		this.lockBounds = true;
		
		/** Internal storage of this component's width.
		 * @type integer
		 * @private
		 */
		this._width = 0;
		/** Internal storage of this component's height.
		 * @type integer
		 * @private
		 */
		this._height = 0;
		
		//Prop masks
		this._registerPropMask("centre", "__centre");
		this._registerPropMask("lockBounds", "lockBounds");
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
	if(!value) return;
	this._component.x = -(value[0])+(this.width>>1);
	this._component.y = -(value[1])+(this.height>>1);
	
	if(this.lockBounds){
		if(this._component.x < -(this.getComponent("*").width)+this.width) this._component.x = -(this.getComponent("*").width)+this.width;
		if(this._component.y < -(this.getComponent("*").height)+this.height) this._component.y = -(this.getComponent("*").height)+this.height;
		if(this._component.x > 0) this._component.x = 0;
		if(this._component.y > 0) this._component.y = 0;
	}
};
Object.defineProperty(dusk.sgui.CentreScroller.prototype, "__centre", {
	set: function(value) {this.centre(value);},
	get: function() {return undefined;}
});

/** Returns a four element array in the form `[x, y, width, height]` indicating what is currently visible.
 * This will be relative to the child in this single, so `x` and `y` are the upper left.
 * 
 * @return {array} A four element as described above.
 */
dusk.sgui.CentreScroller.prototype.render = function() {
	return [-this._component.x, -this._component.y, this.width, this.height];
};

//Width
Object.defineProperty(dusk.sgui.CentreScroller.prototype, "width", {
	set: function(value) {this._width = value;},
	get: function() {if(this._width === -1) return dusk.sgui.width;return this._width;}
});

//Height
Object.defineProperty(dusk.sgui.CentreScroller.prototype, "height", {
	set: function(value) {this._height = value;},
	get: function() {if(this._height === -1) return dusk.sgui.height;return this._height;}
});

Object.seal(dusk.sgui.CentreScroller);
Object.seal(dusk.sgui.CentreScroller.prototype);

dusk.sgui.registerType("CentreScroller", dusk.sgui.CentreScroller);
