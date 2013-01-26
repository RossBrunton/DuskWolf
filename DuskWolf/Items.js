//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");

dusk.load.provide("dusk.items");
dusk.load.provide("dusk.items.Item");
dusk.load.provide("dusk.items.Invent");

dusk.items._init = function() {
	dusk.items._itemData = {};
	
	dusk.items.createNewType("item", {"maxStack":1});
	
	//Testing
	dusk.items.createNewType("sword", {"type":"Sword"});
	dusk.items.createNewType("stabbySword", {"damage":12}, "sword");
	
	dusk.items.createNewType("potion", {"type":"Potion"});
	dusk.items.createNewType("heal", {"restore":50}, "potion");
};

dusk.items.createNewType = function(name, data, baseType) {
	if(!("baseType" in data) && name != "item") data.baseType = baseType?baseType:"item";
	
	dusk.items._itemData[name] = data;
};

dusk.items.getTypeData = function(name, key) {
	if(!dusk.items._itemData[name]) return undefined;
	if(key === undefined) return dusk.items._itemData[name];
	
	if(key in dusk.items._itemData[name]) return dusk.items._itemData[name][key];
	
	if("baseType" in dusk.items._itemData[name]) return dusk.items.getTypeData(dusk.items._itemData[name].baseType, key);
	
	return undefined;
};

dusk.items.isValidType = function(name) {
	if(!(name in dusk.items._itemData)) return false;
	
	return true;
};



dusk.items.Item = function(type, extraData) {
	this.type = type?type:"item";
	this._extraData = extraData?extraData:{};
	
	if(!dusk.items.isValidType(this._type)) {
		console.warn("Tried to create an item of unknown type "+this._type+".");
	}
};

dusk.items.Item.prototype.getData = function(key) {
	if(key === undefined) return this._extraData;
	
	if(key in this._extraData) return this._extraData[key];
	
	return dusk.items.getTypeData(this._type, key);
};

/** Returns a string representation of the item. */
dusk.items.Item.prototype.toString = function() {return "[item "+this.type+"]";};

dusk.items.Item.prototype.copy = function() {return new dusk.items.Item(this.type, dusk.utils.clone(this._extraData));};



dusk.items.REST_ISEQ = 0;
dusk.items.REST_ISNEQ = 1;
dusk.items.REST_ISIN = 2;
dusk.items.REST_ISNIN = 3;

dusk.items.Invent = function(capacity, restrictions, properties) {
	this._capacity = capacity;
	this._restrictions = restrictions;
	this._items = [];
	
	for(var i = 0; i < capacity; i ++) this._items[i] = null;
	
	if(properties === undefined) properties = {};
	this.maxStack = ("maxStack" in properties)?properties.maxStack:Infinity;
};

dusk.items.Invent.prototype.isValidAddition = function(item) {
	if(this.countItems() >= this._capacity) return false; //Check if we already have an item of that type
	
	for(var i = this._restrictions.length-1; i >= 0; i --) {
		switch(this._restrictions[i][1]) {
			case dusk.items.REST_ISEQ:if(item.getData(this._restrictions[i][0]) != this._restrictions[i][2]) return false;break;
			case dusk.items.REST_ISNEQ:if(item.getData(this._restrictions[i][0]) == this._restrictions[i][2]) return false;break;
			
			case dusk.items.REST_ISIN:if(item.getData(this._restrictions[i][0]) in this._restrictions[i][2]) return false;break;
			case dusk.items.REST_ISNIN:if(!(item.getData(this._restrictions[i][0]) in this._restrictions[i][2])) return false;break;
			
			default:
				console.warn(this.toString()+" has invalid restrictions.");
		}
	}
	
	return true;
};

dusk.items.Invent.prototype.addItem = function(item, amount) {
	if(isNaN(amount)) amount = 1;
	if(amount == 0) return 0;
	if(!this.isValidAddition(item)) return amount;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] && this._items[i][0].getType() == item.type && this._items[i].length < this.maxStack && this._items[i].length < item.getData("maxStack")) {
			this._items[i][this._items[i].length] = item.copy();
			return this.addItem(item, amount-1);
		}
	}
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] == null) {
			this._items[i] = [item.copy()];
			return this.addItem(item, amount-1);
		}
	}
	
	return amount;
};

dusk.items.Invent.prototype.countItems = function() {
	var count = 0;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] != null) {
			count++;
		}
	}
	
	return count;
};

dusk.items.Invent.prototype.countItemsOfType = function(type) {
	var count = 0;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] && this._items[i][0].type == type) {
			count += this._items[i].length;
		}
	}
	
	return count;
};

/** Returns a string representation of the item. */
dusk.items.Invent.prototype.toString = function() {return "[inventory]";};

dusk.items._init();
