//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Grid");

dusk.load.provide("dusk.sgui.Selection");

dusk.sgui.Selection = function (parent, comName) {
	dusk.sgui.Grid.call(this, parent, comName);
	
	this.options = 0;
	this.orientation = dusk.sgui.Selection.ORIENT_VER;
	
	this._registerPropMask("options", "options");
	this._registerPropMask("orientation", "orientation");
	
	//Listeners
	this._populationEvent.listen(function(e) {
		if(this.orientation == dusk.sgui.Selection.ORIENT_HOR) {
			this.rows = 1;
			this.cols = this.options;
		}else{
			this.rows = this.options;
			this.cols = 1;
		}
		
		return e;
	}, this, {"action":"before"});
	this._populationEvent.listen(this._update, this, {"action":"complete"});
	this.dirPress.listen(this._update, this);
};
dusk.sgui.Selection.prototype = Object.create(dusk.sgui.Grid.prototype);

dusk.sgui.Selection.prototype.className = "Selection";

dusk.sgui.Selection.ORIENT_HOR = 0x01;

dusk.sgui.Selection.ORIENT_VER = 0x02;

dusk.sgui.Selection.prototype._update = function(e) {
	if(!this.getFocused()) return false;
	if(this.orientation == dusk.sgui.Selection.ORIENT_HOR) {
		this.xOffset = this.getFocused().x;
		this.width = this.getFocused().width;
	}else{
		this.yOffset = this.getFocused().y;
		this.height = this.getFocused().height;
	}
};

Object.seal(dusk.sgui.Selection);
Object.seal(dusk.sgui.Selection.prototype);

dusk.sgui.registerType("Selection", dusk.sgui.Selection);
