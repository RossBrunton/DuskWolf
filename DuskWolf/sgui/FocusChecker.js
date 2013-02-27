//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Image");

dusk.load.provide("dusk.sgui.FocusChecker");


/** @class dusk.sgui.FocusChecker
 * 
 * @classdesc An image that changes source depending on whether it is active or focused.
 *
 * Using the default image, this will be red if it is active, blue if focused but not active, and green otherwise.
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Image
 * @constructor
 */
dusk.sgui.FocusChecker = function(parent, comName) {
	dusk.sgui.Image.call(this, parent, comName);
	
	/** The path to the image to be displayed when the component is not focused or active.
	 * @type string
	 * @default "sgui/inactive.png"
	 */
	this.inactiveImg = "sgui/inactive.png";
	/** The path to the image to be displayed when the component is focused, but not active.
	 * @type string
	 * @default "sgui/focused.png"
	 */
	this.focusedImg = "sgui/focused.png";
	/** The path to the image to be displayed when the component is active.
	 * @type string
	 * @default "sgui/active.png"
	 */
	this.activeImg = "sgui/active.png";
	
	this.src = this.inactiveImg;
	
	//Prop masks
	this._registerPropMask("inactiveImg", "inactiveImg");
	this._registerPropMask("focusedImg", "focusedImg");
	this._registerPropMask("activeImg", "activeImg");
	
	//Listeners
	this.onFocusChange.listen(function(e) {if(this.focusedImg) this.src = this.focusedImg;}, this, {"focus":true});
	this.onFocusChange.listen(function(e) {if(this.inactiveImg) this.src = this.inactiveImg;}, this, {"focus":false});
	
	this.onActiveChange.listen(function(e) {if(this.activeImg) this.src = this.activeImg;}, this, {"active":true});
	this.onActiveChange.listen(function(e) {if(this.focusedImg) this.src = this.focusedImg;}, this, {"active":false});
};
dusk.sgui.FocusChecker.prototype = new dusk.sgui.Image();
dusk.sgui.FocusChecker.constructor = dusk.sgui.FocusChecker;

dusk.sgui.FocusChecker.prototype.className = "FocusChecker";

Object.seal(dusk.sgui.FocusChecker);
Object.seal(dusk.sgui.FocusChecker.prototype);

dusk.sgui.registerType("FocusChecker", dusk.sgui.FocusChecker);
