//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Group");

goog.provide("dusk.sgui.Pane");

dusk.sgui.Pane = function (sguiMod, comName) {
	this._sgui = sguiMod;
	dusk.sgui.Group.call(this, null, comName);
	
	this._registerProp("active", function(name, value) {if(value) this._sgui.setActivePane(this.comName)}, function(name) {return this.active;});
};
dusk.sgui.Pane.prototype = new dusk.sgui.Group();
dusk.sgui.Pane.constructor = dusk.sgui.Pane;


dusk.sgui.Pane.prototype.className = "Pane";

dusk.sgui.Pane.prototype.bookRedraw = function() {
	if(this._redrawBooked) return;
	this._sgui.bookRedraw();
	this._redrawBooked = true;
}
