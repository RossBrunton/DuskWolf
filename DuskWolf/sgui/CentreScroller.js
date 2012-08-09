//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Single");

goog.provide("dusk.sgui.CentreScroller");

/***/
dusk.sgui.CentreScroller = function (parent, comName) {
	if(parent !== undefined) {
		dusk.sgui.Single.call(this, parent, comName);
		
		this._registerProp("seek", this._updateSeek, null);
		this._registerProp("render", null, this._getRender);
		this._registerPropMask("lockBounds", "_lockBounds", true);
		
		this._lockBounds = this._theme("cs.lockBounds", true);
	}
};
dusk.sgui.CentreScroller.prototype = new dusk.sgui.Single();
dusk.sgui.CentreScroller.constructor = dusk.sgui.CentreScroller;

dusk.sgui.CentreScroller.prototype.className = "CentreScroller";

dusk.sgui.CentreScroller.prototype._updateSeek = function(name, value) {
	this.x = (-value[0])+(this.prop("width")>>1);
	this.y = (-value[1])+(this.prop("height")>>1);
	
	
	if(this.prop("lockBounds")){
		if(this.x < -(this.getComponent("*").prop("width"))+this.prop("width")) this.x = -(this.getComponent("*").prop("width"))+this.prop("width");
		if(this.y < -(this.getComponent("*").prop("height"))+this.prop("height")) this.y = -(this.getComponent("*").prop("height"))+this.prop("height");
		if(this.x > 0) this.x = 0;
		if(this.y > 0) this.y = 0;
		
	}
};

dusk.sgui.CentreScroller.prototype._getRender = function(name) {
	return [-this.x, -this.y, this.prop("width"), this.prop("height")];
};
