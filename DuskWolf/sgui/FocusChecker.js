//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Image");

dusk.load.provide("dusk.sgui.FocusChecker");

/* This is a simple component that changes apperance based on whether it is active or not. By default it is red if active, blue if only focused and green otherwise.
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
			
		this.inactiveImg = this._theme("fc.inactive", "sgui/inactive.png");
		this.focusedImg = this._theme("fc.focused", "sgui/focused.png");
		this.activeImg = this._theme("fc.active", "sgui/active.png");
		
		this._registerPropMask("image-inactive", "inactiveImg", true);
		this._registerPropMask("image-focused", "focusedImg", true);
		this._registerPropMask("image-active", "activeImg", true);
		
		this.src = this.inactiveImg;
	}
};
dusk.sgui.FocusChecker.prototype = new dusk.sgui.Image();
dusk.sgui.FocusChecker.constructor = dusk.sgui.FocusChecker;

dusk.sgui.FocusChecker.prototype.className = "FocusChecker";

/* Turns the focus checker to the image set by <code>image-inactive</code>. */
dusk.sgui.FocusChecker.prototype.onLooseFocus = function() {if(this.inactiveImg) this.src = this.inactiveImg;};
/* Turns the focus checker to the image set by <code>image-focused</code>. */
dusk.sgui.FocusChecker.prototype.onGetFocus = function() {if(this.focusedImg) this.src = this.focusedImg;};

/* Turns the focus checker to the image set by <code>image-focused</code>. */
dusk.sgui.FocusChecker.prototype.onDeactive = function() {if(this.focusedImg) this.src = this.focusedImg;};
/* Turns the focus checker to the image set by <code>image-active</code>. */
dusk.sgui.FocusChecker.prototype.onActive = function() {if(this.activeImg) this.src = this.activeImg;};
