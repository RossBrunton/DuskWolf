//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.sources.DropboxSource", (function() {
	var save = load.require("dusk.save");
	var SaveSource = load.require("dusk.save.sources.SaveSource");
	var SaveData = load.require("dusk.save.SaveData");
	var LocalStorageSource = load.require("dusk.save.sources.LocalStorageSource");
	var utils = load.require("dusk.utils");
	load.require("@https://www.dropbox.com/static/api/2/dropins.js");
	
	var DropboxSource = function(appKey) {
		this.appKey = appKey;
	};
	DropboxSource.prototype = Object.create(SaveSource.prototype);
	
	DropboxSource.prototype.save = function(saveData, spec, identifier) {
		return new Promise((function(fullfill, reject) {
			Dropbox.appKey = this.appKey;
			
			saveData.meta().identifier = identifier;
			Dropbox.save({
				"files": [
					{"url":saveData.toDataUrl(), "filename":spec.prettyName+".json"}
				],
				
				"success": function(){fullfill(true);},
				"cancel": function(){reject(new save.SaveSourceError("DropboxSource: User canceled"));},
				"error": function(){reject(new save.SaveSourceError("DropboxSource: Unknown error"));}
			});
		}).bind(this));
	};
	
	DropboxSource.prototype.autoSave = function(saveData, spec, identifier) {
		return (new LocalStorageSource()).save(saveData, spec, "dropboxAutosave_"+identifier);
	};
	
	DropboxSource.prototype.load = function(spec, identifier) {
		return new Promise((function(fullfill, reject) {
			Dropbox.appKey = this.appKey;
			
			Dropbox.choose({
				"linkType":"direct",
				"extensions":[".json"],
				
				"success": function(files) {
					utils.ajaxGet(files[0].link, "json").then(function(value) {
						fullfill(new SaveData(spec, value));
					});
				},
				
				"cancel": function() {reject(new save.SaveSourceError("DropboxSource: Load from Dropbox canceled."));},
			});
		}).bind(this));
	};
	
	DropboxSource.prototype.toString = function() {
		return "[DropboxSource]";
	};
	
	DropboxSource.prototype.supportsIdentifier = false;
	
	return DropboxSource;
})());
