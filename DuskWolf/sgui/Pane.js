//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");

dusk.load.provide("dusk.sgui.Pane");

dusk.sgui.Pane = function (sguiMod, comName) {
	this._sgui = sguiMod;
	dusk.sgui.Group.call(this, null, comName);
	
	this._registerPropMask("active", "active", true);
};
dusk.sgui.Pane.prototype = new dusk.sgui.Group();
dusk.sgui.Pane.constructor = dusk.sgui.Pane;

dusk.sgui.Pane.prototype.className = "Pane";

dusk.sgui.Pane.prototype.bookRedraw = function() {
	if(this._redrawBooked) return;
	this._sgui.bookRedraw();
	this._redrawBooked = true;
};

dusk.sgui.Pane.prototype.__defineSetter__("active", function _setActive(value) {if(value) this._sgui.setActivePane(this.comName);});
