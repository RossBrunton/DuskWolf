//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FocusChecker", (function() {
	var Image = load.require("dusk.sgui.Image");
	var sgui = load.require("dusk.sgui");

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
	var FocusChecker = function(parent, comName) {
		Image.call(this, parent, comName);
		
		/** The path to the image to be displayed when the component is not focused or active.
		 * @type string
		 * @default "default/inactive.png"
		 */
		this.inactiveImg = "default/inactive.png";
		/** The path to the image to be displayed when the component is focused, but not active.
		 * @type string
		 * @default "default/focused.png"
		 */
		this.focusedImg = "default/focused.png";
		/** The path to the image to be displayed when the component is active.
		 * @type string
		 * @default "default/active.png"
		 */
		this.activeImg = "default/active.png";
		
		this.src = this.inactiveImg;
		
		//Prop masks
		this._registerPropMask("inactiveImg", "inactiveImg");
		this._registerPropMask("focusedImg", "focusedImg");
		this._registerPropMask("activeImg", "activeImg");
		
		//Listeners
		this.onFocusChange.listen(function(e) {if(this.focusedImg) this.src = this.focusedImg;}, this, {"focus":true});
		this.onFocusChange.listen(function(e) {if(this.inactiveImg) this.src=this.inactiveImg;}, this, {"focus":false});
		
		this.onActiveChange.listen(function(e) {if(this.activeImg) this.src = this.activeImg;}, this, {"active":true});
		this.onActiveChange.listen(function(e) {if(this.focusedImg) this.src=this.focusedImg;}, this, {"active":false});
	};
	FocusChecker.prototype = Object.create(Image.prototype);

	Object.seal(FocusChecker);
	Object.seal(FocusChecker.prototype);

	sgui.registerType("FocusChecker", FocusChecker);
	
	return FocusChecker;
})());


load.provide("dusk.sgui.FocusCheckerTile", (function() {
	var Tile = load.require("dusk.sgui.Tile");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.sgui.FocusCheckerTile
	 * 
	 * @classdesc Functions like a `{@link dusk.sgui.FocusChecker}` only it uses a tile instead of an image.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Tile
	 * @constructor
	 * @since 0.0.19-alpha
	 */
	var FocusCheckerTile = function(parent, comName) {
		Tile.call(this, parent, comName);
		
		/** The orientation to set the tiles for. One of the `dusk.sgui.c.ORIENT_*` constants.
		 * Vertical means the y coordianate will be set, while horizontal means the x one.
		 * @type integer
		 * @default dusk.sgui.c.ORIENT_VER
		 */
		this.focusOrient = c.ORIENT_VER;
		
		/** The values to set the tile depending on the current state. This will be set to the x or y coordinate when the 
		 * state changes.
		 * 
		 * A three elemnt array in the form `[inactive, focused, active]`.
		 * @type array
		 * @default [0, 0, 1]
		 */
		this.focusValues = [0, 0, 1];
		
		//Prop masks
		this._registerPropMask("focusOrient", "focusOrient");
		this._registerPropMask("focusValues", "focusValues");
		
		//Listeners
		this.onFocusChange.listen(function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[1], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[1]];
			}
		}, this, {"focus":true});
		
		this.onFocusChange.listen(function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[0], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[0]];
			}
		}, this, {"focus":false});
		
		this.onActiveChange.listen(function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[2], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[2]];
			}
		}, this, {"active":true});
		
		this.onActiveChange.listen(function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[0], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[0]];
			}
		}, this, {"active":false});
	};
	FocusCheckerTile.prototype = Object.create(Tile.prototype);

	Object.seal(FocusCheckerTile);
	Object.seal(FocusCheckerTile.prototype);

	sgui.registerType("FocusCheckerTile", FocusCheckerTile);
	
	return FocusCheckerTile;
})());


load.provide("dusk.sgui.FocusCheckerRect", (function() {
	var Rect = load.require("dusk.sgui.Rect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.sgui.FocusCheckerRect
	 * 
	 * @classdesc A rectangle that changes colour depending on whether it is active or focused.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Rect
	 * @constructor
	 */
	var FocusCheckerRect = function(parent, comName) {
		Rect.call(this, parent, comName);
		
		/** The colour when the component is not focused or active.
		 * @type string
		 * @default "#ff9999"
		 */
		this.inactiveFill = "#ff9999";
		/** The colour when the component is focused, but not active.
		 * @type string
		 * @default "#ff9999"
		 */
		this.focusedFill = "#ff9999";
		/** The colour when the component is active.
		 * @type string
		 * @default "#99ff99"
		 */
		this.activeFill = "#99ff99";
		
		/** The border colour when the component is not focused or active.
		 * @type string
		 * @default "#990000"
		 * @since 0.0.21-alpha
		 */
		this.bInactive = "#990000";
		/** The border colour when the component is focused, but not active.
		 * @type string
		 * @default "#990000"
		 * @since 0.0.21-alpha
		 */
		this.bFocused = "#990000";
		/** The border colour when the component is active.
		 * @type string
		 * @default "#009900"
		 * @since 0.0.21-alpha
		 */
		this.bActive = "#009900";
		
		/** The border width when the component is not focused or active.
		 * @type string
		 * @default 0
		 * @since 0.0.21-alpha
		 */
		this.bwInactive = 0;
		/** The border width when the component is focused, but not active.
		 * @type string
		 * @default 0
		 * @since 0.0.21-alpha
		 */
		this.bwFocused = 0;
		/** The border width when the component is active.
		 * @type string
		 * @default 0
		 * @since 0.0.21-alpha
		 */
		this.bwActive = 0;
		
		//Prop masks
		this._registerPropMask("inactive", "inactiveFill");
		this._registerPropMask("focused", "focusedFill");
		this._registerPropMask("active", "activeFill");
		
		this._registerPropMask("inactiveFill", "inactiveFill");
		this._registerPropMask("focusedFill", "focusedFill");
		this._registerPropMask("activeFill", "activeFill");
		
		this._registerPropMask("bInactive", "bInactive");
		this._registerPropMask("bFocused", "bFocused");
		this._registerPropMask("bActive", "bActive");
		
		this._registerPropMask("bwInactive", "bwInactive");
		this._registerPropMask("bwFocused", "bwFocused");
		this._registerPropMask("bwActive", "bwActive");
		
		//Listeners
		this.onFocusChange.listen(function(e) {
			this.colour = this.focusedFill;
			this.bColour = this.bFocused;
			this.bWidth = this.bwFocused;
		}, this, {"focus":true});
		this.onFocusChange.listen(function(e) {
			this.colour = this.inactiveFill;
			this.bColour = this.bInactive;
			this.bWidth = this.bwInactive;
		}, this, {"focus":false});
		
		this.onActiveChange.listen(function(e) {
			this.colour = this.activeFill;
			this.bColour = this.bActive;
			this.bWidth = this.bwActive
		}, this, {"active":true});
		this.onActiveChange.listen(function(e) {
			this.colour = this.focusedFill;
			this.bColour = this.bFocused;
			this.bWidth = this.bwFocused;
		}, this, {"active":false});
	};
	FocusCheckerRect.prototype = Object.create(Rect.prototype);

	Object.seal(FocusCheckerRect);
	Object.seal(FocusCheckerRect.prototype);

	sgui.registerType("FocusCheckerRect", FocusCheckerRect);
	
	return FocusCheckerRect;
})());
