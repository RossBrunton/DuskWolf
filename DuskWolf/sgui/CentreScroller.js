//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Single");

goog.provide("dusk.sgui.CentreScroller");

/***/
sgui.CentreScroller = function (parent, events, comName) {
	if(parent !== undefined) {
		sgui.Single.call(this, parent, events, comName);
		
		this._registerProp("seek", this._updateSeek, null);
	}
};
sgui.CentreScroller.prototype = new sgui.Single();
sgui.CentreScroller.constructor = sgui.CentreScroller;

sgui.CentreScroller.prototype.className = "CentreScroller";

sgui.CentreScroller.prototype._updateSeek = function(name, value) {
	this.x = (-value[0])+(this.prop("width")/2);
	this.y = (-value[1])+(this.prop("height")/2);
};
