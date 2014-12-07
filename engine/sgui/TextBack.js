//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.TextBack", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var Label = load.require("dusk.sgui.Label");
	var c = load.require("dusk.sgui.c");
	
	var TextBack = function (parent, name) {
		Group.call(this, parent, name);
		
		//Set up components
		this.getComponent("plus", "NullCom");
		this.getComponent("label", "Label");
		
		/** The text that will be displayed in front of the back. Label formatting is allowed.
		 * @type string
		 */
		this.text = "";
		/** The plus object. This is a setter for `{@link dusk.sgui.Component.ParseProps}` so setting an object here is
		 *  like calling that function.
		 * @type object
		 */
		this.plus = {};
		/** The label object. This is a setter for `{@link dusk.sgui.Component.ParseProps}` so setting an object here is
		 *  like calling that function.
		 * @type object
		 */
		this.label = {};
		/** The spacing between the plus and the label, in pixels.
		 * @type integer
		 * @default 2
		 */
		this.spacing = 2;
		/** The type name of the plus.
		 *  You should set this before modifying the plus itself, so that the properties are kept.
		 * @type string
		 * @default NullCom
		 */
		this.plusType = "NullCom";
		/** If true, then a click on this event will automatically go to the plus component.
		 * @type boolean
		 * @default true
		 * @since 0.0.21-alpha
		 */
		this.plusProxy = true;
		
		//Prop masks
		this._mapper.map("text",
			[function() {return this.get("label").text}, function(v) {this.get("label").text = v;}]
		);
		this._mapper.map("plus", "plus", ["plusType"]);
		this._mapper.map("label", "label");
		this._mapper.map("spacing", "spacing");
		this._mapper.map("plusType", "plusType");
		this._mapper.map("plusProxy", "plusProxy");
		
		//Setup
		this.focusBehaviour = Group.FOCUS_ALL;
	};
	TextBack.prototype = Object.create(Group.prototype);
	
	/** Override to enable `{@link dusk.sgui.TextBack.plusProxy}`.
	 * 
	 * @param {object} e The interaction event.
	 * @return {boolean} The return value of the focused component's keypress.
	 */
	TextBack.prototype.containerClick = function(e) {
		if(this.mouse && this.mouse.allow) {
			if(!this.plusProxy) return Group.prototype.containerClick.call(this, e);
			
			if(this.getComponent("plus").visible && this.getComponent("plus").mouse
			&& !this.getComponent("plus").mouse.clickPierce) {
				
				return this.getComponent("plus").mouse.doClick(e);
			}
		}
		
		return true;
	};
	
	//Plus
	Object.defineProperty(TextBack.prototype, "plus", {
		get: function() {return this.getComponent("plus").bundle();},
		set: function(value) {
			this.getComponent("plus").update(value);
			this.getComponent("plus").xDisplay = "expand";
			this.getComponent("plus").yDisplay = "expand";
			this.getComponent("plus").alterLayer("-label");
		}
	});
	
	//Text
	Object.defineProperty(TextBack.prototype, "text", {
		get: function() {return this.get("label").text;},
		set: function(value) {
			this.get("label").text = value;
		}
	});
	
	//Label
	Object.defineProperty(TextBack.prototype, "label", {
		get: function() {return this.getComponent("label").bundle();},
		
		set: function(value) {
			this.getComponent("label").update(value);
			this.getComponent("plus").alterLayer("-label");
			this.getComponent("label").xDisplay = "expand";
			this.getComponent("label").yDisplay = "expand";
		}
	});
	
	//plusType
	Object.defineProperty(TextBack.prototype, "plusType", {
		get: function() {return this.getComponent("plus").type;},
		
		set: function(value) {
			this.getComponent("plus").type = value;
			this.getComponent("plus").alterLayer("-label");
			this.getComponent("plus").xDisplay = "expand";
			this.getComponent("plus").yDisplay = "expand";
		}
	});
	
	sgui.registerType("TextBack", TextBack);
	
	return TextBack;
})());
