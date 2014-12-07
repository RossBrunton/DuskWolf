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
		
		/** Current x location of the mouse, relative to this component.
		 * @type integer
		 * @since 0.0.20-alpha
		 */
		this.x = 0;
		/** Current y location of the mouse, relative to this component.
		 * @type integer
		 * @since 0.0.20-alpha
		 */
		this.y = 0;
		
		/** If true, then you can roll over components that have their `{@link dusk.sgui.MouseAugment#allow}` property
		 *  set to true to focus them.
		 * 
		 * This only makes sense for containers.
		 * @type boolean
		 * @default true
		 * @since 0.0.20-alpha
		 */
		this.focus = true;
		
		/** Whether focus should be changed to this component if the user rolls over it with the mouse, and the
		 *  container allows it.
		 * 
		 * @type boolean
		 * @default true
		 * @since 0.0.20-alpha
		 */
		this.allow = true;
		
		/** If this is true, then any children of this component will have their mouse augments added.
		 * 
		 * `{@link dusk.sgui.MouseAugment#focus}` and `{@link dusk.sgui.MouseAugment#childrenAllow}` will be set to
		 *  true on those children.
		 * 
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.childrenAllow = false;
		
		/** Whether clicking on this component will trigger its action.
		 * 
		 * @type boolean
		 * @since 0.0.20-alpha
		 * @default true
		 */
		this.action = true;
		
		/** If true, then this component cannot be clicked, however it will not block click events to any component
		 *  underneath it.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.clickPierce = false;
		/** Fired when this component is clicked on.
		 * 
		 * The event object has at least a property `button`, which is the number of the button clicked.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onClick = new EventDispatcher("dusk.sgui.MouseAugment.onClick");
		
		/** True if this component has the mouse hovered over it.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.hovered = false;
	};
	
	/** Handles a mouse click. This will fire `{@link dusk.sgui.MouseAugment.onClick}`, and possibly fire the 
	 *  `{@link dusk.sgui.MouseAugment.action}` handler.
	 * 
	 * If the component running this is a group 
	 *  then its `{@link dusk.sgui.Group#containerClick}` function will be called.
	 *	If that function returns true, then this shall return true without doing anything else.
	 * 
	 * @param {object} e The click event.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	MouseAugment.prototype.doClick = function(e) {
		if(this._component instanceof Group && !this._component.containerClick(e))
			return false;
		
		if(this.onClick.fireAnd(e)) {
			if(this.action) {
				return this._component.action.fireAnd({"click":e, "component":this._component});
			}
		}
		
		return true;
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
