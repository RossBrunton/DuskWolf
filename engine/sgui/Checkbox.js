//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Checkbox", (function() {
	var FocusCheckerTile = load.require("dusk.sgui.FocusCheckerTile");
	var sgui = load.require("dusk.sgui");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** Creates a new Checkbox component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * 
	 * @class dusk.sgui.Checkbox
	 * 
	 * @classdesc A checkbox has two states, on or off. This is represented by the property "checked" and its appearance.
	 * 
	 * A checkbox (eventually) inherits from `{@link dusk.tiles.sgui.Tile}`, where each tile indicates a different state:
	 * - `0,0`: Not checked.
	 * - `1,0`: Checked.
	 * - `2,0`: Not checked, but in a radiobox.
	 * - `3,0`: Checked, and in a radiobox.
	 * 
	 * Checkboxes will have slightly different behavior in a container with `{@link dusk.sgui.extras.Radiobox}` as an extra.
	 * 
	 * As well as the top row, there is another row underneath it. The bottom row is used when the checkbox is the active
	 *  component.
	 * 
	 * By default, a checkbox has a src of `"default/check.png"`, a width and height of 16, and a sprite size of 4.
	 * 
	 * @extends dusk.sgui.FocusCheckerTile
	 * @constructor
	 */
	var Checkbox = function (parent, name) {
		FocusCheckerTile.call(this, parent, name);
		
		/** Used internally to store if this is checked.
		 * @type boolean
		 * @private
		 */
		this._checked = false;
		/** The current state of the checkbox, either checked or unchecked.
		 * @type boolean
		 */
		this.checked = false;
		/** An EventDispatcher that is fired when the box is checked or unchecked.
		 * 
		 * The event object has two properties, `checked` and `component`.
		 * @type EventDispatcher
		 * @since 0.0.20-alpha
		 */
		this.onCheck = new EventDispatcher("dusk.sgui.Checkbox.onCheck");
		/** The radiobox this is using, or null.
		 * @type {dusk.sgui.extras.Radiobox}
		 * @protected
		 */
		this._radiobox = null;
		
		//Defaults
		this.src = "default/check.png";
		this.ssize = 4;
		this.width = 16;
		this.height = 16;
		
		//Check if we are in a radiobox
		if(this.getExtraByTypeFromParents("Radiobox")) {
			this._radiobox = this.getExtraByTypeFromParents("Radiobox");
			this.checked = false;
		}
		
		//Prop masks
		this._mapper.map("checked", "checked");
		
		//Listeners
		this.action.listen((function(e) {
			this.checked = !this.checked;
			this.onCheck.fire({"checked":this.checked, "component":this}, this.checked);
			return false;
		}).bind(this), undefined);
	};
	Checkbox.prototype = Object.create(FocusCheckerTile.prototype);

	//checked
	Object.defineProperty(Checkbox.prototype, "checked", {
		set: function(value) {
			this._checked = value == true;
			if(this._checked) {
				this.tile = [this._radiobox?3:1, this.tile[1]];
			}else{
				this.tile = [this._radiobox?2:0, this.tile[1]];
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

	Object.seal(Checkbox);
	Object.seal(Checkbox.prototype);

	sgui.registerType("Checkbox", Checkbox);
	
	return Checkbox;
})());
