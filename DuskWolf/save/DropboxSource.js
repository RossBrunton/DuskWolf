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

dusk.save.DropboxSource.prototype.save = function(saveData, spec, identifier, callback) {
	Dropbox.appKey = this.appKey;
	
	saveData.meta().identifier = identifier;
	Dropbox.save({
		"files": [
			{"url":saveData.toDataUrl(), "filename":spec.prettyName+".json"}
		],
		
		"success": function(){callback(true);},
		"cancel": function(){callback(false);},
		"error": function(){callback(false);}
	});
	
	callback(true);
};

dusk.save.DropboxSource.prototype.autoSave = function(saveData, spec, identifier) {
	(new dusk.save.LocalStorageSource()).save(saveData, spec, "dropboxAutosave_"+identifier);
};

dusk.save.DropboxSource.prototype.load = function(spec, identifier, callback) {
	Dropbox.appKey = this.appKey;
	
	Dropbox.choose({
		"linkType":"direct",
		"extensions":[".json"],
		
		"success": function(files) {
			$.get(files[0].link, "", function(data, textStatus, jqXHR) {
				callback(data, true);
				console.log(data);
			}, "json")
		},
		
		"cancel": function() {callback({}, false);},
	});
};

dusk.save.DropboxSource.prototype.toString = function() {
	return "[DropboxSource]";
};

dusk.save.DropboxSource.prototype.supportsIdentifier = false;

Object.seal(dusk.save.DropboxSource);
