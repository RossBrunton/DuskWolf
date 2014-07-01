//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.ControlConfig", (function() {
	var Group = load.require("dusk.sgui.Group");
	var Tile = load.require("dusk.sgui.Tile");
	var Label = load.require("dusk.sgui.Label");
	var controls = load.require("dusk.input.controls");
	var keyboard = load.require("dusk.input.keyboard");
	var sgui = load.require("dusk.sgui");
	var interaction = load.require("dusk.input.interaction");
	
	/** Creates a new ControlConfig component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * 
	 * @class dusk.sgui.ControlConfig
	 * 
	 * @classdesc A control config allows the user to configure a control (as used by `{@link dusk.input.controls}`).
	 * 
	 * 
	 * 
	 * @extends dusk.sgui.Group
	 * @constructor
	 */
	var ControlConfig = function (parent, comName) {
		Group.call(this, parent, comName);
		
		this.setting = false;
		this.control = "";
		
		this._keyChild = this.getComponent("key", "Label");
		this._buttonChild = this.getComponent("button", "Tile");
		
		this.border = "#cccccc";
		this.borderActive = "#ff5555";
		
		//Prop masks
		this._registerPropMask("border", "border");
		this._registerPropMask("borderActive", "borderActive");
		this._registerPropMask("control", "control");
		
		//Listeners
		this.frame.listen(this._ccFrame.bind(this));
		this.onInteract.listen(this._ccKey.bind(this), interaction.KEY_DOWN);
		this.prepareDraw.listen(this._ccDraw.bind(this));
		this.action.listen(
			(function(e) {this.setting = !this.setting; this.locked = this.setting; return false;}).bind(this)
		);
	};
	ControlConfig.prototype = Object.create(Group.prototype);
	
	ControlConfig.prototype._ccFrame = function(e) {
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
	};
	
	ControlConfig.prototype._ccDraw = function(e) {
		e.c.strokeStyle = this.active?this.borderActive:this.border;
		
		e.c.strokeRect(e.d.destX, e.d.destY, e.d.width, e.d.height);
	};
	
	ControlConfig.prototype._ccKey = function(e) {
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
	};
	
	Object.seal(ControlConfig);
	Object.seal(ControlConfig.prototype);
	
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
})());
