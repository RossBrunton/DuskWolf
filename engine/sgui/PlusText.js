//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.PlusText", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var Label = load.require("dusk.sgui.Label");
	var c = load.require("dusk.sgui.c");
	
	/** Makes your own, brand new PlusText component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * 
	 * @class dusk.sgui.PlusText
	 * 
	 * @classdesc Want to put text next to a component? Tired of messing around with labels? The new and improved
	 *  PlusText component does all that and more!
	 * 
	 * Just set the `{@link dusk.sgui.PlusText.plusType}` and `{@link dusk.sgui.PlusText.plus}` properties to the type
	 *  and data of the object you want to attach text to, and there you go! Just like that!
	 * 
	 * @extends dusk.sgui.Group
	 * @constructor
	 * @since 0.0.20-alpha
	 */
	var PlusText = function (parent, name) {
		Group.call(this, parent, name);
		
		//Set up components
		this.get("plus", "NullCom");
		this.get("label", "Label");
		
		/** The text that will be displayed beside the plus object. Label formatting is allowed.
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
		/** Will display the plus component on the left of the label, instead of the right.
		 * @type boolean
		 * @default false
		 */
		this.onLeft = false;
		/** If true, then the plus component will be behind the text, rather than next to it.
		 * @type boolean
		 * @default false
		 */
		this.behind = false;
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
		this._mapper.map("text", "text");
		this._mapper.map("plus", "plus", ["plusType"]);
		this._mapper.map("label", "label");
		this._mapper.map("spacing", "spacing");
		this._mapper.map("behind", "behind");
		this._mapper.map("onLeft", "onLeft");
		this._mapper.map("plusType", "plusType");
		this._mapper.map("plusProxy", "plusProxy");
		
		//Listeners
		this.frame.listen(_frame.bind(this));
		
		//Setup
		this.focusBehaviour = Group.FOCUS_ALL;
	};
	PlusText.prototype = Object.create(Group.prototype);
	
	/** Called every frame, to update the location and widths.
	 * @param {object} e The event object.
	 * @private
	 */
	var _frame = function(e) {
		if(this.width >= 0) {
			this.get("label").width = this.width - this.get("plus").width - this.spacing;
		}
		
		if(this.onLeft) {
			this.get("plus").x = 0;
			this.get("label").x = this.get("plus").width + this.spacing;
		}else{
			this.get("plus").x = this.width - this.get("plus").width;
			this.get("label").x = 0;
		}
		
		if(this.behind) {
			if(!this.get("label").multiline) {
				this.get("label").width = -1;
			}else{
				if(this.width >= 0) {
					this.get("label").width = this.width - this.spacing;
				}
			}
			
			this.get("plus").x = 0;
			this.get("label").xOrigin = "middle";
			this.get("label").x = 0;
			
			if(this.width >= 0) this.get("plus").width = this.width;
			if(this.height >= 0) this.get("plus").height = this.height;
		}
		
		this.get("label").text = this.text;
		
		if(!this.height) this.height = this.get("plus").height;
		this.get("label").height = this.height;
	};
	
	/** Override to enable `{@link dusk.sgui.PlusText.plusProxy}`.
	 * 
	 * @param {object} e The interaction event.
	 * @return {boolean} The return value of the focused component's keypress.
	 */
	PlusText.prototype.containerClick = function(e) {
		if(this.allowMouse) {
			if(!this.plusProxy) return Group.prototype.containerClick.call(this, e);
			
			if(this.get("plus").visible && !this.get("plus").clickPierce) {
				return this.get("plus").doClick(e);
			}
		}
		
		return true;
	};
	
	//Plus
	Object.defineProperty(PlusText.prototype, "plus", {
		get: function() {return this.get("plus").bundle();},
		set: function(value) {this.get("plus").update(value);}
	});
	
	//Label
	Object.defineProperty(PlusText.prototype, "label", {
		get: function() {return this.get("label").bundle();},
		
		set: function(value) {
			this.get("label").update(value);
			this.get("plus").alterLayer("-label");
		}
	});
	
	//plusType
	Object.defineProperty(PlusText.prototype, "plusType", {
		get: function() {return this.get("plus").type;},
		
		set: function(value) {
			this.get("plus").type = value;
			this.get("plus").alterLayer("-label");
		}
	});
	
	sgui.registerType("PlusText", PlusText);
	
	return PlusText;
})());
