//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Radiobox", function() {
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	
	/** This extra can be attached to a group and makes any checkboxes inside function like radiobuttons.
	 * 
	 * This means that, for all the checkboxes in the group, only one or zero may be selected, attempting to select more
	 * than one will uncheck the other checkbox.
	 * 
	 * @memberof dusk.sgui.extras
	 * @extends dusk.sgui.extras.Extra
	 * @see {@link dusk.sgui.Checkbox}
	 */
	class Radiobox extends Extra {
		/** Creates a new RadioBox extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** Internal property for the currently selected checkbox.
			 * @type {dusk.sgui.Checkbox}
			 * @private
			 * @memberof! dusk.sgui.extras.Radiobox#
			 */
			this._selected = null;
			/** The path to the currently selected checkbox.
			 * 
			 * You may assign this an object of type `{@link dusk.sgui.Checkbox}` and the path will be automatically
			 *  detected.
			 * @type {string}
			 * @memberof! dusk.sgui.extras.Radiobox#
			 */
			this.selected = null;
			
			//Prop masks
			this._props.map("selected", "selected");
		}
		
		/** Returns the currently selected checkbox, or null if none are selected.
		 * @return {?dusk.sgui.Checkbox} The current selection.
		 */
		getSelectedCheckbox() {
			return this._selected;
		}
		
		//selected
		get selected() {
			return this._selected.fullPath();
		}
		
		set selected(value) {
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
	}
	
	sgui.registerExtra("Radiobox", Radiobox);
	
	return Radiobox;
});
