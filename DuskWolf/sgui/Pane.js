//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");

dusk.load.provide("dusk.sgui.Pane");

/** Creates a new pane.
 * 
 * @param {?dusk.sgui.IContainer} parent The container that this component is in, this will always be null for panes.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.Pane
 * 
 * @classdesc A pane is a special type of group which is "allowed" to have no parent.
 * 
 * It used by `{@link dusk.sgui}` as the root for any component tree.
 * 
 * @extends dusk.sgui.Group
 */

dusk.sgui.Pane = function (parent, comName) {
	dusk.sgui.Group.call(this, null, comName);
	
	//Prop masks
	this._registerPropMask("active", "__active", true);
};
dusk.sgui.Pane.prototype = new dusk.sgui.Group();
dusk.sgui.Pane.constructor = dusk.sgui.Pane;

dusk.sgui.Pane.prototype.className = "Pane";

/** Causes the pane to become the active pane.
 * 
 * This can be used in the JSON representation with the property `active` with any true value.
 */
dusk.sgui.Pane.prototype.becomeActive = function() {
	dusk.sgui.setActivePane(this.comName);
};
Object.defineProperty(dusk.sgui.Pane.prototype, "__active", {
	set: function(value) {if(value) this.becomeActive();},
	
	get: function() {return dusk.sgui.getActivePane() == this;}
});

Object.seal(dusk.sgui.Pane);
Object.seal(dusk.sgui.Pane.prototype);

dusk.sgui.registerType("Pane", dusk.sgui.Pane);
