//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.Group");

dusk.load.provide("dusk.sgui.PlusText");

/** Makes your own, brand new PlusText component.
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.PlusText
 * 
 * @classdesc Want to put text next to a component? Tired of messing around with labels? The new and improved PlusText
 *  component does all that and more!
 * 
 * Just set the `{@link dusk.sgui.PlusText.plusType}` and `{@link dusk.sgui.PlusText.plus}` properties to the type and 
 *  data of the object you want to attach text to, and there you go! Just like that!
 * 
 * @extends dusk.sgui.Group
 * @constructor
 * @since 0.0.19-alpha
 */
dusk.sgui.PlusText = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	//Set up components
	this.getComponent("plus", "NullCom");
	this.getComponent("label", "Label");
	
	/** The text that will be displayed beside the plus object. Label formatting is allowed.
	 * @type string
	 */
	this.text = "";
	/** The plus object. This is a setter for `{@link dusk.sgui.Component.ParseProps}`, so setting an object here is
	 *  like calling that function.
	 * @type object
	 */
	this.plus = {};
	/** The label object. This is a setter for `{@link dusk.sgui.Component.ParseProps}`, so setting an object here is
	 *  like calling that function.
	 * @type object
	 */
	this.label = {};
	/** Will display the plus component on the left of the label, instead of the right.
	 * @type boolean
	 * @default false
	 */
	this.onLeft = false;
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
	
	//Prop masks
	this._registerPropMask("text", "text");
	this._registerPropMask("plus", "plus", undefined, ["plusType"]);
	this._registerPropMask("label", "label");
	this._registerPropMask("spacing", "spacing");
	this._registerPropMask("onLeft", "onLeft");
	this._registerPropMask("plusType", "plusType");
	
	//Listeners
	this.frame.listen(this._ptFrame, this);
	
	//Setup
	this.focusBehaviour = dusk.sgui.Group.FOCUS_ALL;
};
dusk.sgui.PlusText.prototype = Object.create(dusk.sgui.Group.prototype);

/** Called every frame, to update the location and widths.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.PlusText.prototype._ptFrame = function(e) {
	this.getComponent("label").width = this.getComponent("plus").width - this.spacing;
	
	if(this.onLeft) {
		this.getComponent("plus").x = 0;
		this.getComponent("label").x = this.getComponent("plus").width + this.spacing;
	}else{
		this.getComponent("plus").x = this.width - this.getComponent("plus").width;
		this.getComponent("label").x = 0;
	}
	
	this.getComponent("label").text = this.text;
	
	if(!this.height) this.height = this.getComponent("plus").height;
	this.getComponent("label").height = this.height;
};

//Plus
Object.defineProperty(dusk.sgui.PlusText.prototype, "plus", {
	get: function() {
		return this.getComponent("plus").bundle();
	},
	
	set: function(value) {
		this.getComponent("plus").parseProps(value);
	}
});

//Label
Object.defineProperty(dusk.sgui.PlusText.prototype, "label", {
	get: function() {
		return this.getComponent("label").bundle();
	},
	
	set: function(value) {
		this.getComponent("label").parseProps(value);
	}
});

//plusType
Object.defineProperty(dusk.sgui.PlusText.prototype, "plusType", {
	get: function() {return this.getComponent("plus").type;},
	
	set: function(value) {this.getComponent("plus").type = value;}
});

Object.seal(dusk.sgui.PlusText);
Object.seal(dusk.sgui.PlusText.prototype);

dusk.sgui.registerType("PlusText", dusk.sgui.PlusText);
