//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.keyboard");

dusk.load.provide("dusk.sgui.Checkbox");

/** Creates a new Checkbox component.
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.Checkbox
 * 
 * @classdesc
 * 
 * 
 * 
 * @extends dusk.sgui.Tile
 * @constructor
 */
dusk.sgui.Checkbox = function (parent, comName) {
	dusk.sgui.Tile.call(this, parent, comName);
	
	this._checked = false;
	this.checked = false;
	this._radiobox = null;
	
	//Defaults
	this.src = "sgui/check.png";
	this.ssize = 4;
	this.width = 16;
	this.height = 16;
	
	//Check if we are in a radiobox
	if(this.getExtraByTypeFromParents("Radiobox")) {
		this._radiobox = this.getExtraByTypeFromParents("Radiobox");
		this.checked = false;
	}
	
	//Prop masks
	this._registerPropMask("checked", "checked");
	
	//Listeners
	this.action.listen(function(e) {this.checked = !this.checked; return false;}, this);
	this.onActiveChange.listen(function(e){this.checked = this.checked;}, this);
};
dusk.sgui.Checkbox.prototype = new dusk.sgui.Tile();
dusk.sgui.Checkbox.constructor = dusk.sgui.Checkbox;

dusk.sgui.Checkbox.prototype.className = "Checkbox";

//checked
Object.defineProperty(dusk.sgui.Checkbox.prototype, "checked", {
	set: function(value) {
		this._checked = value == true;
		if(this._checked) {
			this.tile = [1 + (this._active?2:0), this._radiobox?1:0];
		}else{
			this.tile = [0 + (this._active?2:0), this._radiobox?1:0];
		}
		
		if(this._radiobox && this._checked) this._radiobox.selected = this;
		if(this._radiobox && !this._checked && this._radiobox.getSelectedCheckbox() == this) this._radiobox.selected = null;
	},
	
	get: function() {
		return this._checked;
	}
});

Object.seal(dusk.sgui.Checkbox);
Object.seal(dusk.sgui.Checkbox.prototype);

dusk.sgui.registerType("Checkbox", dusk.sgui.Checkbox);
