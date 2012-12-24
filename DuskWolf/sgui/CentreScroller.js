//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Single");

dusk.load.provide("dusk.sgui.CentreScroller");

/** Creates a new CentreScroller
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.CentreScroller
 * 
 * @classdesc A CentreScroller is a single which, given coordinates, attempts to ensure those coordinates are in the centre of the screen.
 * 
 * Essentially, this allows you to have a single, large component, and have a paticular point (the player, for example) so that it is always visible.
 * 
 * @extends dusk.sgui.Single
 */
dusk.sgui.CentreScroller = function (parent, comName) {
	if(parent !== undefined) {
		dusk.sgui.Single.call(this, parent, comName);
		
		/** If true, then this will always display as much of the component as it can, and will not try to center the coordinates if it would result in any side of the component becoming in the range.
		 * @type number
		 * @memberof dusk.sgui.CentreScroller
		 */
		this.lockBounds = false;
		
		this._registerPropMask("seek", "seek", true);
		this._registerPropMask("render", "render", true);
		this._registerPropMask("lockBounds", "lockBounds", true);
		
		this.lockBounds = this._theme("cs.lockBounds", true);
	}
};
dusk.sgui.CentreScroller.prototype = new dusk.sgui.Single();
dusk.sgui.CentreScroller.constructor = dusk.sgui.CentreScroller;

dusk.sgui.CentreScroller.prototype.className = "CentreScroller";

/** The coordinates to set as the centre of this. This property is write-only.
 * 
 * @type array
 * @name seek
 * @memberof dusk.sgui.CentreScroller
 */
dusk.sgui.CentreScroller.prototype.__defineSetter__("seek", function s_seek(value) {
	this._component.x = -(value[0])+(this.width>>1);
	this._component.y = -(value[1])+(this.height>>1);
	
	if(this.lockBounds){
		if(this._component.x < -(this.getComponent("*").width)+this.width) this._component.x = -(this.getComponent("*").width)+this.width;
		if(this._component.y < -(this.getComponent("*").height)+this.height) this._component.y = -(this.getComponent("*").height)+this.height;
		if(this._component.x > 0) this._component.x = 0;
		if(this._component.y > 0) this._component.y = 0;
	}
});

dusk.sgui.CentreScroller.prototype.__defineGetter__("render", function g_render() {
	return [-this._component.x, -this._component.y, this.width, this.height];
});
