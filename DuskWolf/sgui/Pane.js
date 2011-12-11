//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Group");

sgui.Pane = function (sguiMod, events, comName) {
	this._sgui = sguiMod;
	sgui.Group.call(this, null, events, comName);
	
	this._registerStuff(this._paneStuff);
};
sgui.Pane.prototype = new sgui.Group();
sgui.Pane.constructor = sgui.Pane;


sgui.Pane.prototype.className = "Pane";


sgui.Pane.prototype._paneStuff = function (data) {
	//Active
	if (!this._active && this._prop("active", data, this._active, true)) {
		this._sgui.setActivePane(this.comName);
	}
};

sgui.Pane.prototype.bookRedraw = function() {
	if(this._redrawBooked) return;
	this._sgui.bookRedraw();
	this._redrawBooked = true;
}
