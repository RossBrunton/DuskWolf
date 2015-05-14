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
		this.get("plus", "NullCom");
		this.get("label", "Label");
		
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
		if(this.allowMouse) {
			if(!this.plusProxy) return Group.prototype.containerClick.call(this, e);
			
			if(this.get("plus").visible && !this.get("plus").clickPierce) {
				
				return this.get("plus").doClick(e);
			}
		}
		
		return true;
	};
	
	//Plus
	Object.defineProperty(TextBack.prototype, "plus", {
		get: function() {return this.get("plus").bundle();},
		set: function(value) {
			this.get("plus").update(value);
			this.get("plus").xDisplay = "expand";
			this.get("plus").yDisplay = "expand";
			this.get("plus").alterLayer("-label");
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
		get: function() {return this.get("label").bundle();},
		
		set: function(value) {
			this.get("label").update(value);
			this.get("plus").alterLayer("-label");
			this.get("label").xDisplay = "expand";
			this.get("label").yDisplay = "expand";
		}
	});
	
	//plusType
	Object.defineProperty(TextBack.prototype, "plusType", {
		get: function() {return this.get("plus").type;},
		
		set: function(value) {
			this.get("plus").type = value;
			this.get("plus").alterLayer("-label");
			this.get("plus").xDisplay = "expand";
			this.get("plus").yDisplay = "expand";
		}
	});
	
	sgui.registerType("TextBack", TextBack);
	
	return TextBack;
})());
