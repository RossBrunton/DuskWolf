//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Grid");
dusk.load.require("dusk.sgui.ItemSlot");
dusk.load.require("dusk.items.Invent");

dusk.load.provide("dusk.sgui.ItemGrid");

dusk.sgui.ItemGrid = function (parent, comName) {
	dusk.sgui.Grid.call(this, parent, comName);
	
	this.maxStack = Infinity;
	this._invent = new dusk.items.Invent(this.rows*this.cols, [], this.maxStack);
	
	this._counter = 0;
	
	//Prop masks
	this._registerPropMask("maxStack", "maxStack");
	this._registerPropMask("invent", "__invent", undefined, ["maxStack"]);
	this._addNewPropDepends("populate", "invent");
	
	//Listeners
	this._populationEvent.listen(this._igBefore, this, {"action":"before"});
	this._populationEvent.listen(this._igCreate, this, {"action":"create"});
};
dusk.sgui.ItemGrid.prototype = new dusk.sgui.Grid();
dusk.sgui.ItemGrid.constructor = dusk.sgui.ItemGrid;

dusk.sgui.ItemGrid.prototype.className = "ClassName";

dusk.sgui.ItemGrid.prototype.setInventory = function(invent) {
	if(!(invent instanceof dusk.items.Invent)) {
		invent = new dusk.items.Invent(this.rows*this.cols, invent, this.maxStack);
	}
	
	this._invent.sendAllToInvent(invent);
	this._invent = invent;
};
Object.defineProperty(dusk.sgui.ItemGrid.prototype, "__invent", {
	set: function(value) {
		this.setInventory(value);
	},
	
	get: function(){
		return [];
	}
});

dusk.sgui.ItemGrid.prototype._igBefore = function(e) {
	if("slot" in e.child) delete e.child.slot;
	if("invent" in e.child) delete e.child.invent;
	this._counter = 0;
	return e;
};

dusk.sgui.ItemGrid.prototype._igCreate = function(e) {
	if(e.component instanceof dusk.sgui.ItemSlot) {
		e.component.setInventory(this._invent);
		e.component.slot = this._counter++;
	}
	return e;
};

Object.seal(dusk.sgui.ItemGrid);
Object.seal(dusk.sgui.ItemGrid.prototype);
