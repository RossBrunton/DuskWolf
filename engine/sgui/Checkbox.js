//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Checkbox", function() {
	var FocusCheckerTile = load.require("dusk.sgui.FocusCheckerTile");
	var sgui = load.require("dusk.sgui");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** A checkbox has two states, on or off. This is represented by the property "checked" and its appearance.
	 * 
	 * A checkbox (eventually) inherits from `dusk.tiles.sgui.Tile`, where each tile indicates a different
	 *  state:
	 * - `0,0`: Not checked.
	 * - `1,0`: Checked.
	 * - `2,0`: Not checked, but in a radiobox.
	 * - `3,0`: Checked, and in a radiobox.
	 * As well as the top row, there is another row underneath it. The bottom row is used when the checkbox is the
	 *  active component.
	 * 
	 * Checkboxes will have slightly different behavior in a container with `dusk.sgui.extras.Radiobox` as an extra.
	 * 
	 * By default, a checkbox has a src of `"default/check.png tiles:16x16"` with a width and height of 16.
	 * 
	 * @extends dusk.sgui.FocusCheckerTile
	 * @memberof dusk.sgui
	 */
	class Checkbox extends FocusCheckerTile {
		/** Creates a new Checkbox.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** An EventDispatcher that is fired when the box is checked or unchecked.
			 * 
			 * The event object has two properties, `checked` and `component`.
			 * @type EventDispatcher
			 * @since 0.0.20-alpha
			 * @memberof! dusk.sgui.Checkbox#
			 */
			this.onCheck = new EventDispatcher("dusk.sgui.Checkbox.onCheck");
			/** Used internally to store if this is checked.
			 * @type boolean
			 * @private
			 * @memberof! dusk.sgui.Checkbox#
			 */
			this._checked = false;
			/** The current state of the checkbox, either checked or unchecked.
			 * @type boolean
			 * @memberof! dusk.sgui.Checkbox#
			 */
			this.checked = false;
			/** The radiobox this is using, or null.
			 * @type {dusk.sgui.extras.Radiobox}
			 * @protected
			 * @memberof! dusk.sgui.Checkbox#
			 */
			this._radiobox = null;
			
			//Defaults
			this.src = "default/check.png tiles:16x16";
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
				return false;
			}).bind(this), undefined);
		}
		
		//checked
		set checked(value) {
			this._checked = value == true;
			if(this._checked) {
				this.tile = [this._radiobox?3:1, this.tile[1]];
			}else{
				this.tile = [this._radiobox?2:0, this.tile[1]];
			}
			
			if(this._radiobox && this._checked) {
				this._radiobox.selected = this;
			}
			
			if(this._radiobox && !this._checked && this._radiobox.getSelectedCheckbox() == this) {
				this._radiobox.selected = null;
			}
			
			this.onCheck.fire({"checked":this.checked, "component":this}, this.checked);
		}
			
		get checked() {
			return this._checked;
		}
	}
	
	sgui.registerType("Checkbox", Checkbox);
	
	return Checkbox;
});
