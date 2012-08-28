//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Single");

dusk.load.provide("dusk.sgui.CentreScroller");

/***/
dusk.sgui.CentreScroller = function (parent, comName) {
	if(parent !== undefined) {
		dusk.sgui.Single.call(this, parent, comName);
		
		this._registerPropMask("seek", "seek", true);
		this._registerPropMask("render", "render", true);
		this._registerPropMask("lockBounds", "lockBounds", true);
		
		this.lockBounds = this._theme("cs.lockBounds", true);
	}
};
dusk.sgui.CentreScroller.prototype = new dusk.sgui.Single();
dusk.sgui.CentreScroller.constructor = dusk.sgui.CentreScroller;

dusk.sgui.CentreScroller.prototype.className = "CentreScroller";

dusk.sgui.CentreScroller.prototype.__defineSetter__("seek", function set_seek(value) {
	this._component.x = -(value[0])+(this.width>>1);
	this._component.y = -(value[1])+(this.height>>1);
	
	if(this.lockBounds){
		if(this._component.x < -(this.getComponent("*").width)+this.width) this._component.x = -(this.getComponent("*").width)+this.width;
		if(this._component.y < -(this.getComponent("*").height)+this.height) this._component.y = -(this.getComponent("*").height)+this.height;
		if(this._component.x > 0) this._component.x = 0;
		if(this._component.y > 0) this._component.y = 0;
	}
});

dusk.sgui.CentreScroller.prototype.__defineGetter__("render", function get_render() {
	return [-this._component.x, -this._component.y, this.width, this.height];
});
