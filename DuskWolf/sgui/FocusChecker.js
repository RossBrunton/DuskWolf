//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.Image");

goog.provide("dusk.sgui.FocusChecker");

/** This is a simple component that changes apperance based on whether it is active or not. By default it is red if active, blue if only focused and green otherwise.
 * 
 * <p><img src='FocusChecker.png'/></p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;image-inactive&gt;(image)&lt;/image-inactive&gt;</code> --
 * The image to display if inactive, it must be the name of a constant in <code>Data</code>. By default it is <code>IMG_FOCUSCHK_0</code>.</p>
 * 
 * <p><code>&lt;image-focused&gt;(image)&lt;/image-focused&gt;</code> --
 * The image to display if focused but not active, it must be the name of a constant in <code>Data</code>. By default it is <code>IMG_FOCUSCHK_1</code>.</p>
 * 
 * <p><code>&lt;image-active&gt;(image)&lt;/image-active&gt;</code> --
 * The image to display if active, it must be the name of a constant in <code>Data</code>. By default it is <code>IMG_FOCUSCHK_2</code>.</p>
 * 
 * @see Data
 */

dusk.sgui.FocusChecker = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Image.call(this, parent, comName);
		/** This creates a new focus checker! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
			
		this._inactiveImg = this._theme("fc.inactive", "Examples/inactive.png");
		this._focusedImg = this._theme("fc.focused", "Examples/focused.png");
		this._activeImg = this._theme("fc.active", "Examples/active.png");
		
		this._registerStuff(this._focusStuff);
		this._registerPropMask("image-inactive", "_inactiveImg", true);
		this._registerPropMask("image-focused", "_focusedImg", true);
		this._registerPropMask("image-active", "_activeImg", true);
		
		this.prop("src", this._inactiveImg);
	}
};
dusk.sgui.FocusChecker.prototype = new dusk.sgui.Image();
dusk.sgui.FocusChecker.constructor = dusk.sgui.FocusChecker;

dusk.sgui.FocusChecker.prototype.className = "FocusChecker";

/** Turns the focus checker to the image set by <code>image-inactive</code>. */
dusk.sgui.FocusChecker.prototype.onLooseFocus = function() {if(this._inactiveImg) this.prop("src", this._inactiveImg);};
/** Turns the focus checker to the image set by <code>image-focused</code>. */
dusk.sgui.FocusChecker.prototype.onGetFocus = function() {if(this._focusedImg) this.prop("src", this._focusedImg);};

/** Turns the focus checker to the image set by <code>image-focused</code>. */
dusk.sgui.FocusChecker.prototype.onDeactive = function() {if(this._focusedImg) this.prop("src", this._focusedImg);};
/** Turns the focus checker to the image set by <code>image-active</code>. */
dusk.sgui.FocusChecker.prototype.onActive = function() {if(this._activeImg) this.prop("src", this._activeImg);};
