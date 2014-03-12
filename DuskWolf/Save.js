//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");

dusk.load.provide("dusk.save");

dusk.save._init = function() {
	
};

dusk.save.save = function(spec, source, identifier) {
	var saveData = spec.save();
	return source.save(saveData, spec, identifier);
};

dusk.save.load = function(spec, source, identifier, callback) {
	var saveData = source.load(spec, identifier, function(saveData, success) {
		if(success) spec.load(saveData);
		if(callback) callback(success);
	});
};



dusk.save.SaveSpec = function(name, prettyName) {
	this.name = name;
	this.prettyName = prettyName?prettyName:name;
	
	this._toSave = [];
};

dusk.save.SaveSpec.prototype.add = function(path, type, args) {
	this._toSave.push([path, type, args]);
};

dusk.save.SaveSpec.prototype.save = function() {
	var saveData = new dusk.save.SaveData(this);
	
	for(var i = this._toSave.length-1; i >= 0; i --) {
		var ob = dusk.utils.lookup(window, this._toSave[i][0]);
		if(ob) {
			if(saveData.data[this._toSave[i][0]] === undefined) {
				saveData.data[this._toSave[i][0]] = [];
			}
			
			saveData.data[this._toSave[i][0]].push(
				[this._toSave[i][1], this._toSave[i][2], ob.save(this._toSave[i][1], this._toSave[i][2])]
			);
		}else{
			console.error("Tried to save from "+this._toSave[i][0]+", but it doesn't exist!");
		}
	}
	
	return saveData;
};

dusk.save.SaveSpec.prototype.load = function(saveData) {
	for(var p in saveData.data) {
		if(p != "meta") {
			var ob = dusk.utils.lookup(window, p);
			if(ob) {
				for(var i = saveData.data[p].length -1; i >= 0; i --) {
					ob.load(saveData.data[p][i][2], saveData.data[p][i][0], saveData.data[p][i][2]);
				}
			}else{
				console.error("Tried to load into "+this._toSave[i][0]+", but it doesn't exist!");
			}
		}
	}
};

dusk.save.SaveSpec.prototype.toString = function() {
	return "[SaveSpec "+name+"]";
};

Object.seal(dusk.save.SaveSpec);



dusk.save.SaveSource = function() {
	
};

dusk.save.SaveSource.prototype.save = function(saveData, spec, identifier) {
	console.warn("Save Source "+this+" doesn't support saving.");
	return Promise.reject(Error("Save Source "+this+" doesn't support saving."));
};

dusk.save.SaveSource.prototype.autoSave = function(saveData, spec, identifier) {
	return this.save(saveData, spec, identifier);
};

dusk.save.SaveSource.prototype.load = function(spec, identifier, callback) {
	console.warn("Save Source "+this+" doesn't support loading.");
	callback(new SaveData(spec), false);
};

dusk.save.SaveSource.prototype.toString = function() {
	return "[SaveSource]";
};

dusk.save.SaveSource.prototype.identifierSupport = true;

Object.seal(dusk.save.SaveSource);



dusk.save.LocalStorageSource = function() {
	
};
dusk.save.LocalStorageSource.prototype = Object.create(dusk.save.SaveSource.prototype);

dusk.save.LocalStorageSource.prototype.save = function(saveData, spec, identifier) {
	saveData.meta().identifier = identifier;
	localStorage[saveData.meta().spec+"_"+identifier] = saveData.toDataUrl();
	return Promise.resolve(true);
};

dusk.save.LocalStorageSource.prototype.load = function(spec, identifier, callback) {
	callback(new dusk.save.SaveData(spec, localStorage[spec.name+"_"+identifier].split(",", 2)[1]), true);
};

dusk.save.LocalStorageSource.prototype.toString = function() {
	return "[LocalStorageSource]";
};

Object.seal(dusk.save.LocalStorageSource);



dusk.save.SaveData = function(spec, initial) {
	this.spec = spec;
	
	if(typeof initial == "string") {
		if(initial.indexOf(",") != -1) {
			initial = JSON.parse(atob(initial.split(",", 2)[1]));
		}else{
			initial = JSON.parse(atob(initial));
		}
	}
	
	this.data = initial?initial:{};
	this.data.meta = {};
	this.data.meta.saved = new Date();
	this.data.meta.spec = spec.name;
	this.data.meta.ver = dusk.ver;
};

dusk.save.SaveData.prototype.meta = function() {
	return this.data.meta;
};

dusk.save.SaveData.prototype.toDataUrl = function() {
	return "data:application/json;base64,"+btoa(JSON.stringify(this.data));
};

dusk.save.LocalStorageSource.prototype.toString = function() {
	return "[SaveData "+this.spec.name+"]";
};

Object.seal(dusk.save.SaveData);



dusk.save.ISavable = {};

dusk.save.ISavable.save = function(type, args) {};
dusk.save.ISavable.load = function(data, type, args) {};

if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.ISavable");

Object.seal(dusk.save.ISavable);

dusk.save._init();
