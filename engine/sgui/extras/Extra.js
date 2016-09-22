//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** An "extra" can be attached to a component and gives it extra features.
 * 
 * For example, it could either fade the component in or out
 *  or make all the children inside it radio buttons instead of checkboxes.
 * 
 * Extras are added to components using `{@link dusk.sgui.Component#addExtra}`,
 *  removed using `{@link dusk.sgui.Component#removeExtra}`
 *  and retreived using `{@link dusk.sgui.Component#getExtra}`.
 * 
 * Extras must first be registered using `{@link dusk.sgui.registerExtra}` before use.
 * 
 * The base class for all extras is `{@link dusk.sgui.extras.Extra}`
 * @since 0.0.18-alpha
 * @name dusk.sgui.extras
 * @memberof dusk.sgui
 * @namespace
 */

load.provide("dusk.sgui.extras.Extra", function() {
	var sgui = load.require("dusk.sgui");
	var Mapper = load.require("dusk.utils.Mapper");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
	/** Base class for all extras; all extras must have this in their prototype chain.
	 * 
	 * @see {@link dusk.sgui}
	 * @since 0.0.18-alpha
	 * @memberof dusk.sgui.extras
	 */
	class Extra {
		/** Creates a new Extra.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			/** The component this object is attached to.
			 * @type dusk.sgui.Component
			 * @protected
			 * @memberof! dusk.sgui.extras.Extra#
			 */
			this._owner = owner===undefined?null:owner;
			
			/** The name of this extra, this is what the owner uses to identify it.
			 * @type string
			 * @memberof! dusk.sgui.extras.Extra#
			 */
			this.name = name;
			
			/** An event dispatcher which is fired when this extra is going to be deleted from its component.
			 * 
			 * The event object has no properties.
			 * @type dusk.utils.EventDispatcher
			 * @memberof! dusk.sgui.extras.Extra#
			 */
			this.onDelete = new EventDispatcher("dusk.sgui.extras.Extra.onDelete");
			
			/** A mapper that contains all the properties of this component
			 *  for when the component has to use it's JSON description to describe extras.
			 * @type dusk.utils.Mapper
			 * @protected
			 * @memberof! dusk.sgui.extras.Extra#
			 */
			this._props = new Mapper(this);
			
			//Prop masks
			this._props.map("name", "name");
		}
		
		/** This takes a JSON description of the extra (an object with key value pairs matching up to what the mapper
		 *  exects), parses it, and applies all the properties on the extra itself.
		 * 
		 * Unless otherwise stated, you can assume that all public properties of event objects are settable using this.
		 * @param {object} props An object describing this extra.
		 */
		update(props) {
			this._props.update(props);
		}
		
		/** Returns a string representation of this extra.
		 * @return {string} A representation of this extra.
		 */
		toString() {
			return "[extra "+this.name+" on "+this._owner.name+"]";
		}
	}
	
	return Extra;
});
