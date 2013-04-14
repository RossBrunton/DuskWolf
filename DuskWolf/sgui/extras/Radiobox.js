//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Extra");

dusk.load.provide("dusk.sgui.extras.Radiobox");

/** @class dusk.sgui.extras.Radiobox
 * 
 * @classdesc 
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Extra
 * @constructor
 */
dusk.sgui.extras.Radiobox = function(owner, name) {
	dusk.sgui.extras.Extra.call(this, owner, name);
	
	this._selected = null;
	this.selected = null;
	
	//Prop masks
	this._props.map("selected", "selected");
};
dusk.sgui.extras.Radiobox.prototype = new dusk.sgui.extras.Extra();
dusk.sgui.extras.Radiobox.constructor = dusk.sgui.extras.Radiobox;

dusk.sgui.extras.Radiobox.prototype.getSelectedCheckbox = function() {
	return this._selected;
};

//selected
Object.defineProperty(dusk.sgui.extras.Radiobox.prototype, "selected", {
	get: function() {
		return this._selected.fullPath();
	},
	
	set: function(value) {
		if(typeof value == "string") {
			value = this._owner.path(value);
		}
		
		if(value == this._selected) return;
		
		if(this.getSelectedCheckbox() && this.getSelectedCheckbox().checked) {
			this.getSelectedCheckbox().checked = false;
		}
		
		this._selected = value;
		if(this._selected && !this._selected.checked) this._selected.checked = true;
	}
});

Object.seal(dusk.sgui.extras.Radiobox);
Object.seal(dusk.sgui.extras.Radiobox.prototype);

dusk.sgui.registerExtra("Radiobox", dusk.sgui.extras.Radiobox);
