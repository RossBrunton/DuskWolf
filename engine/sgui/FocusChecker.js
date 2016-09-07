//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.FocusChecker", function() {
	var Image = load.require("dusk.sgui.Image");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.FocusChecker
	 * 
	 * @classdesc An image that changes source depending on whether it is active or focused.
	 *
	 * Using the default image, this will be red if it is active, blue if focused but not active, and green otherwise.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Image
	 * @constructor
	 */
	var FocusChecker = function(parent, name) {
		Image.call(this, parent, name);
		
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
		this._mapper.map("inactiveImg", "inactiveImg");
		this._mapper.map("focusedImg", "focusedImg");
		this._mapper.map("activeImg", "activeImg");
		
		//Listeners
		this.onFocusChange.listen((function(e) {if(this.focusedImg) this.src = this.focusedImg;}).bind(this), true);
		this.onFocusChange.listen((function(e) {if(this.inactiveImg) this.src=this.inactiveImg;}).bind(this), false);
		
		this.onActiveChange.listen((function(e) {if(this.activeImg) this.src = this.activeImg;}).bind(this), true);
		this.onActiveChange.listen((function(e) {if(this.focusedImg) this.src=this.focusedImg;}).bind(this), false);
	};
	FocusChecker.prototype = Object.create(Image.prototype);
	
	sgui.registerType("FocusChecker", FocusChecker);
	
	return FocusChecker;
});


load.provide("dusk.sgui.FocusCheckerTile", function() {
	var Tile = load.require("dusk.tiles.sgui.Tile");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.sgui.FocusCheckerTile
	 * 
	 * @classdesc Functions like a `{@link dusk.sgui.FocusChecker}` only it uses a tile instead of an image.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.tiles.sgui.Tile
	 * @constructor
	 * @since 0.0.19-alpha
	 */
	var FocusCheckerTile = function(parent, name) {
		Tile.call(this, parent, name);
		
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
		this._mapper.map("focusOrient", "focusOrient");
		this._mapper.map("focusValues", "focusValues");
		
		//Listeners
		this.onFocusChange.listen((function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[1], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[1]];
			}
		}).bind(this), true);
		
		this.onFocusChange.listen((function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[0], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[0]];
			}
		}).bind(this), false);
		
		this.onActiveChange.listen((function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[2], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[2]];
			}
		}).bind(this), true);
		
		this.onActiveChange.listen((function(e) {
			if(this.focusOrient == c.ORIENT_HOR) {
				this.tile = [this.focusValues[0], this.tile[1]];
			}else{
				this.tile = [this.tile[0], this.focusValues[0]];
			}
		}).bind(this), false);
	};
	FocusCheckerTile.prototype = Object.create(Tile.prototype);
	
	sgui.registerType("FocusCheckerTile", FocusCheckerTile);
	
	return FocusCheckerTile;
});


load.provide("dusk.sgui.FocusCheckerRect", function() {
	var Rect = load.require("dusk.sgui.Rect");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	
	/** @class dusk.sgui.FocusCheckerRect
	 * 
	 * @classdesc A rectangle that changes colour depending on whether it is active or focused.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Rect
	 * @constructor
	 */
	var FocusCheckerRect = function(parent, name) {
		Rect.call(this, parent, name);
		
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
		this._mapper.map("inactive", "inactiveFill");
		this._mapper.map("focused", "focusedFill");
		this._mapper.map("active", "activeFill");
		
		this._mapper.map("inactiveFill", "inactiveFill");
		this._mapper.map("focusedFill", "focusedFill");
		this._mapper.map("activeFill", "activeFill");
		
		this._mapper.map("bInactive", "bInactive");
		this._mapper.map("bFocused", "bFocused");
		this._mapper.map("bActive", "bActive");
		
		this._mapper.map("bwInactive", "bwInactive");
		this._mapper.map("bwFocused", "bwFocused");
		this._mapper.map("bwActive", "bwActive");
		
		//Listeners
		this.onFocusChange.listen((function(e) {
			this.colour = this.focusedFill;
			this.bColour = this.bFocused;
			this.bWidth = this.bwFocused;
		}).bind(this), true);
		this.onFocusChange.listen((function(e) {
			this.colour = this.inactiveFill;
			this.bColour = this.bInactive;
			this.bWidth = this.bwInactive;
		}).bind(this), false);
		
		this.onActiveChange.listen((function(e) {
			this.colour = this.activeFill;
			this.bColour = this.bActive;
			this.bWidth = this.bwActive
		}).bind(this), true);
		this.onActiveChange.listen((function(e) {
			this.colour = this.focusedFill;
			this.bColour = this.bFocused;
			this.bWidth = this.bwFocused;
		}).bind(this), false);
	};
	FocusCheckerRect.prototype = Object.create(Rect.prototype);

	Object.seal(FocusCheckerRect);
	Object.seal(FocusCheckerRect.prototype);

	sgui.registerType("FocusCheckerRect", FocusCheckerRect);
	
	return FocusCheckerRect;
});
