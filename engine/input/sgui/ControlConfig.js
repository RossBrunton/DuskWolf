//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** SGui components for the input system.
 *
 * @namespace
 * @name sgui
 * @memberof dusk.input
 */

load.provide("dusk.input.sgui.ControlConfig", function() {
	var Group = load.require("dusk.sgui.Group");
	var Tile = load.require("dusk.tiles.sgui.Tile");
	var Label = load.require("dusk.sgui.Label");
	var controls = load.require("dusk.input.controls");
	var keyboard = load.require("dusk.input.keyboard");
	var sgui = load.require("dusk.sgui");
	var interaction = load.require("dusk.input.interaction");
	
	/** A control config allows the user to configure a control (as used by `{@link dusk.input.controls}`).
	 * 
	 * @extends dusk.sgui.Group
	 * @memberof dusk.input.sgui
	 */
	class ControlConfig extends Component {
		/** Creates a new ControlConfig component.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			this.setting = false;
			this.control = "";
			
			this._keyChild = this.get("key", "Label");
			this._buttonChild = this.get("button", "Tile");
			
			this.border = "#cccccc";
			this.borderActive = "#ff5555";
			
			//Prop masks
			this._mapper.map("border", "border");
			this._mapper.map("borderActive", "borderActive");
			this._mapper.map("control", "control");
			
			//Listeners
			this.frame.listen(this._ccFrame.bind(this));
			this.onInteract.listen(this._ccKey.bind(this), interaction.KEY_DOWN);
			this.onPaint.listen(this._ccDraw.bind(this));
			this.action.listen(
				(function(e) {this.setting = !this.setting; this.locked = this.setting; return false;}).bind(this)
			);
		}
		
		_ccFrame(e) {
			var control = controls.lookupControl(this.control);
			
			if(control) {
				if(control[0]) {
					this._keyChild.text = keyboard.lookupCode(controls[0])[2];
				}else{
					this._keyChild.text = "---";
				}
				
				if(controls[1] !== null) {
					if(typeof control[1] == "string") {
						var axis = "";
						if(control[1].indexOf("+") != -1) {
							axis = control[1].split("+")[0];
							this._buttonChild.tile = [(+axis * 2) + 1, 1];
						}else{
							axis = control[1].split("-")[0];
							this._buttonChild.tile = [(+axis * 2), 1];
						}
					}else{
						this._buttonChild.tile = [+controls[1] + 1, 0];
					}
				}else{
					this._buttonChild.tile = [0,0];
				}
			}else{
				this._keyChild.text = "---";
				this._buttonChild.tile = [0,0];
			}
		}
		
		_ccDraw(e) {
			e.c.strokeStyle = this.active?this.borderActive:this.border;
			
			e.c.strokeRect(e.d.dest.x, e.d.dest.y, e.d.dest.width, e.d.dest.height);
		}
		
		_ccKey(e) {
			if(controls.checkKey("sgui_action", e.which)) return true;
			if(!this.control) return true;
			if(!this.setting) {
				if(controls.checkKey("sgui_up", e.which)) return true;
				if(controls.checkKey("sgui_down", e.which)) return true;
				if(controls.checkKey("sgui_left", e.which)) return true;
				if(controls.checkKey("sgui_right", e.which)) return true;
			}
			
			controls.mapKey(this.control, e.which);
			this.setting = false;
			this.locked = false;
			return false;
		}
	}
	
	sgui.registerType("ControlConfig", ControlConfig);
	
	sgui.addStyle("ControlConfig>#key", {
		"height":16,
		"width":40
	});
	sgui.addStyle("ControlConfig>#button", {
		"src":"default/buttons.png",
		"x":40,
		"ssize":4,
		"width":16,
		"height":16
	});
	
	return ControlConfig;
});
