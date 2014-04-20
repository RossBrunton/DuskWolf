//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.save");
dusk.load.require("@https://www.dropbox.com/static/api/2/dropins.js");

dusk.load.provide("dusk.save.DropboxSource");

dusk.save.DropboxSource = function(appKey) {
	this.appKey = appKey;
};
dusk.save.DropboxSource.prototype = Object.create(dusk.save.SaveSource.prototype);

dusk.save.DropboxSource.prototype.save = function(saveData, spec, identifier) {
	return new Promise(function(fullfill, reject) {
		Dropbox.appKey = this.appKey;
		
		saveData.meta().identifier = identifier;
		Dropbox.save({
			"files": [
				{"url":saveData.toDataUrl(), "filename":spec.prettyName+".json"}
			],
			
			"success": function(){fullfill(true);},
			"cancel": function(){reject(new Error("User canceled"));},
			"error": function(){reject(new Error("Unknown error"));}
		});
	});
};

dusk.save.DropboxSource.prototype.autoSave = function(saveData, spec, identifier) {
	return (new dusk.save.LocalStorageSource()).save(saveData, spec, "dropboxAutosave_"+identifier);
};

dusk.save.DropboxSource.prototype.load = function(spec, identifier) {
	return new Promise(function(fullfill, reject) {
		Dropbox.appKey = this.appKey;
		
		Dropbox.choose({
			"linkType":"direct",
			"extensions":[".json"],
			
			"success": function(files) {
				dusk.utils.ajaxGet(files[0].link, "json").then(function(value) {
					fullfill(value);
				});
			},
			
			"cancel": function() {reject(new Error("Load from Dropbox canceled."));},
		});
	});
};

dusk.save.DropboxSource.prototype.toString = function() {
	return "[DropboxSource]";
};

dusk.save.DropboxSource.prototype.supportsIdentifier = false;

Object.seal(dusk.save.DropboxSource);
