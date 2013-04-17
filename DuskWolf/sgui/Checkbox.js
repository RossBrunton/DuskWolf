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
 * @classdesc A checkbox has two states, on or off. This is represented by the property "checked" and it's appearance.
 * 
 * A checkbox inherits from `{@link dusk.sgui.Tile}`, where each tile indicates a different state of the checkbox:
 * - `0,0`: Not active, not checked.
 * - `1,0`: Not active, checked.
 * - `2,0`: Active, not checked.
 * - `3,0`: Active, checked.
 * 
 * In addition, a checkbox that is inside a group which has `{@link dusk.sgui.extras.Radiobox}` as an extra
 *  will function like a radio button as described in that class. This also means it has a different apperence.
 *  Instead of using the 0th row (where y = 0) it will use the first row (where y = 1).
 * 
 * By default, a checkbox has a src of `"sgui/check.png"`, a width and height of 16, and a sprite size of 4.
 * 
 * @extends dusk.sgui.Tile
 * @constructor
 */
dusk.sgui.Checkbox = function (parent, comName) {
	dusk.sgui.Tile.call(this, parent, comName);
	
	/** Used internally to store if this is checked.
	 * @type boolean
	 * @private
	 */
	this._checked = false;
	/** The current state of the checkbox, either checked or unchecked.
	 * @type boolean
	 */
	this.checked = false;
	/** The radiobox this is using, or null.
	 * @type {dusk.sgui.extras.Radiobox}
	 * @protected
	 */
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
		
		if(this._radiobox && this._checked)
			this._radiobox.selected = this;
		if(this._radiobox && !this._checked && this._radiobox.getSelectedCheckbox() == this)
			this._radiobox.selected = null;
	},
	
	get: function() {
		return this._checked;
	}
});

Object.seal(dusk.sgui.Checkbox);
Object.seal(dusk.sgui.Checkbox.prototype);

dusk.sgui.registerType("Checkbox", dusk.sgui.Checkbox);
