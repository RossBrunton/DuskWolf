//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items.sgui.ItemGrid", (function() {
	var Grid = load.require("dusk.sgui.Grid");
	var ItemSlot = load.require("dusk.items.sgui.ItemSlot");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var items = load.require("dusk.items");

	var ItemGrid = function (parent, name) {
		Grid.call(this, parent, name);
		
		this.maxStack = 0xffffffff;
		this._invent = new items.Invent(this.rows*this.cols, true, this.maxStack);
		
		this._counter = 0;
		
		//Prop masks
		this._mapper.map("maxStack", "maxStack");
		this._mapper.map("invent", "__invent", ["maxStack"]);
		this._mapper.addDepends("populate", "invent");
		
		//Listeners
		this._populationEvent.listen(this._igBefore.bind(this), "before");
		this._populationEvent.listen(this._igCreate.bind(this), "create");
	};
	ItemGrid.prototype = Object.create(Grid.prototype);

	ItemGrid.prototype.setInventory = function(invent) {
		if(!(invent instanceof items.Invent)) {
			invent = new items.Invent(this.rows*this.cols, invent, this.maxStack);
		}
		
		this._invent.sendAllToInvent(invent);
		this._invent = invent;
	};
	Object.defineProperty(ItemGrid.prototype, "__invent", {
		set: function(value) {this.setInventory(value);},
		get: function(){return [];}
	});

	ItemGrid.prototype._igBefore = function(e) {
		if("slot" in e.child) delete e.child.slot;
		if("invent" in e.child) delete e.child.invent;
		
		this._counter = 0;
		return e;
	};

	ItemGrid.prototype._igCreate = function(e) {
		if(e.component instanceof ItemSlot) {
			e.component.setInventory(this._invent);
			e.component.slot = this._counter++;
		}
		
		return e;
	};

	Object.seal(ItemGrid);
	Object.seal(ItemGrid.prototype);

	sgui.registerType("ItemGrid", ItemGrid);
})());
