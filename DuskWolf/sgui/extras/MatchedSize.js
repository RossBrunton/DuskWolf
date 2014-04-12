//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Extra");

dusk.load.provide("dusk.sgui.extras.MatchedSize");

/* @class dusk.sgui.extras.MatchedSize
 * 
 * @classdesc A dynamic width component changes it's width depending on the value of a range.
 * 
 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
 *  to the `max` value.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Extra
 * @constructor
 */
dusk.sgui.extras.MatchedSize = function(owner, name) {
	dusk.sgui.extras.Extra.call(this, owner, name);
	
	this.base = "";
	this.paddingTop = 0;
	this.paddingBottom = 0;
	this.paddingLeft = 0;
	this.paddingRight = 0;
	
	this._matchFrameId = this._owner.frame.listen(this._matchFrame.bind(this));
	this.onDelete.listen(this._matchDeleted, this);
	
	//Prop masks
	this._props.map("base", "base");
	this._props.map("paddingTop", "paddingTop");
	this._props.map("paddingBottom", "paddingBottom");
	this._props.map("paddingLeft", "paddingLeft");
	this._props.map("paddingRight", "paddingRight");
};
dusk.sgui.extras.MatchedSize.prototype = Object.create(dusk.sgui.extras.Extra.prototype);

dusk.sgui.extras.MatchedSize.prototype._matchFrame = function(e) {
	if(!this.base) return;
	
	var t = this._owner.path(this.base);
	
	if(!t) return;
	
	this._owner.visible = t.visible;
	
	this._owner.x = t.x - this.paddingTop;
	this._owner.y = t.y - this.paddingLeft;
	
	this._owner.height = this.paddingTop + this.paddingBottom + t.height;
	this._owner.width = this.paddingLeft + this.paddingRight + t.width;
};

dusk.sgui.extras.MatchedSize.prototype._matchDeleted = function(e) {
	this._owner.frame.unlisten(this._matchFrameId);
};

Object.seal(dusk.sgui.extras.MatchedSize);
Object.seal(dusk.sgui.extras.MatchedSize.prototype);

dusk.sgui.registerExtra("MatchedSize", dusk.sgui.extras.MatchedSize);
