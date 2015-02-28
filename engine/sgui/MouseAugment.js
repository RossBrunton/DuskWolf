//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.MouseAugment", (function() {
	var utils = load.require("dusk.utils");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var Group = load.suggest("dusk.sgui.Group", function(p) {Group = p});
	
	/** @class dusk.sgui.MouseAugment
	 * 
	 * @classdesc A mouse augment attaches to a sgui component and adds mouse abilities to it.
	 * 
	 * This should be attached to a sgui component using `{@link dusk.sgui.Component#ensureMouse}`.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var MouseAugment = function(component) {
		/** The component this mouse is augmenting.
		 * @type dusk.sgui.Component
		 * @private
		 */
		this._component = component;
		
		/** If this is true, then any children of this component will have their mouse augments added.
		 * 
		 * `{@link dusk.sgui.MouseAugment#focus}` and `{@link dusk.sgui.MouseAugment#childrenAllow}` will be set to
		 *  true on those children.
		 * 
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.childrenAllow = false;
	};
	
	/** Updates the locatons of the mouse for this component.
	 * 
	 * @param {integer} x New x coordinate.
	 * @param {integer} y New y coordinate.
	 * @since 0.0.20-alpha
	 */
	MouseAugment.prototype.update = function(x, y) {
		this.x = x;
		this.y = y;
	};
	
	/** Returns a string representation of the component. 
	 * 
	 * @return {string} A string representation of this component.
	 */
	MouseAugment.prototype.toString = function() {
		return "[MouseAugment for "+this._component+"]";
	};
	
	return MouseAugment;
})());
