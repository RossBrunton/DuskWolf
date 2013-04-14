//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Component");
dusk.load.require("dusk.sgui");
dusk.load.require(">dusk.Mapper");

dusk.load.provide("dusk.sgui.extras.Extra");

/** @class dusk.sgui.extras.Extra
 * 
 * @classdesc An "extra" object can be attached to a component and gives it extra features.
 * 
 * For example, it could either fade the component in or out
 *  or make all the children inside it radio buttons instead of checkboxes.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @see {@link dusk.sgui}
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.extras.Extra = function(owner, name) {
	/** The component this object is attached to.
	 * @type dusk.sgui.Component
	 * @protected
	 */
	this._owner = owner===undefined?null:owner;
	
	/** The name of this extra, this is what the owner uses to identify it.
	 * @type string
	 */
	this.name = name;
	
	/** An event dispatcher which is fired when this extra is going to be deleted from it's component.
	 * 
	 * The event object has no properties.
	 * @type dusk.EventDispatcher
	 */
	this.onDelete = new dusk.EventDispatcher("dusk.sgui.extras.Extra.onDelete");
	
	/** A mapper that contains all the properties of this component
	 *  for when the component has to use it's JSON description to describe extras.
	 * @type dusk.Mapper
	 * @protected
	 */
	this._props = new dusk.Mapper(this);
	
	//Prop masks
	this._props.map("name", "name");
};

/** This takes a JSON description of the extra (an object with key value pairs matching up to what the mapper exects),
 *   parses it, and applies all the properties on the extra itself.
 * 
 * Unless otherwise stated, you can assume that all public properties of event objects are settable using this.
 * @param {object} props An object describing this extra.
 */
dusk.sgui.extras.Extra.prototype.parseProps = function(props) {
	this._props.massSet(props);
};

/** Returns a string representation of this extra.
 * @return {string} A representation of this extra.
 */
dusk.sgui.extras.Extra.prototype.toString = function() {
	return "[extra "+this.name+" on "+this._owner.comName+"]";
};

Object.seal(dusk.sgui.extras.Extra);
Object.seal(dusk.sgui.extras.Extra.prototype);
