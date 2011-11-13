//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Image");

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

sgui.FocusChecker = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Image.call(this, parent, events, comName);
		/** This creates a new focus checker! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
			
		this._inactiveImg = this._events.getVar("sg-def-fc-i");
		this._focusedImg = this._events.getVar("sg-def-fc-f");
		this._activeImg = this._events.getVar("sg-def-fc-a");
		
		this._registerStuff(this._focusStuff);
		
		this.setImage(this._inactiveImg);
	}
};
sgui.FocusChecker.prototype = new sgui.Image();
sgui.FocusChecker.constructor = sgui.FocusChecker;


/** @inheritDoc */
sgui.FocusChecker.prototype.className = "FocusChecker";


sgui.FocusChecker.prototype._focusStuff = function(data) {
	//Set image
	this._inactiveImg = this._prop("image-inactive", data, this._inactiveImg, true);
	this._focusedImg = this._prop("image-focused", data, this._focusedImg, true);
	this._activeImg = this._prop("image-active", data, this._activeImg, true);
};

/** Turns the focus checker to the image set by <code>image-inactive</code>. */
sgui.FocusChecker.prototype.onLooseFocus = function() {if(this._inactiveImg) this.setImage(this._inactiveImg);};
/** Turns the focus checker to the image set by <code>image-focused</code>. */
sgui.FocusChecker.prototype.onGetFocus = function() {if(this._focusedImg) this.setImage(this._focusedImg);};

/** Turns the focus checker to the image set by <code>image-focused</code>. */
sgui.FocusChecker.prototype.onDeactive = function() {if(this._focusedImg) this.setImage(this._focusedImg);};
/** Turns the focus checker to the image set by <code>image-active</code>. */
sgui.FocusChecker.prototype.onActive = function() {if(this._activeImg) this.setImage(this._activeImg);};
