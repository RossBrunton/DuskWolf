//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Component");
dusk.load.require("dusk.sgui");
dusk.load.require("dusk.Mapper");

dusk.load.provide("dusk.sgui.extras.Extra");

/** @class dusk.sgui.extras.Extra
 * 
 * @classdesc 
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @see {@link dusk.sgui}
 * @constructor
 */
dusk.sgui.extras.Extra = function(owner, name) {
	this._owner = owner===undefined?null:owner;
	this._name = name;
	
	this.onDelete = new dusk.EventDispatcher("dusk.sgui.extras.Extra.onDelete");
	
	this._props = new dusk.Mapper(this);
};

dusk.sgui.extras.Extra.prototype.parseProps = function(props) {
	this._props.massSet(props);
};

Object.seal(dusk.sgui.extras.Extra);
Object.seal(dusk.sgui.extras.Extra.prototype);
