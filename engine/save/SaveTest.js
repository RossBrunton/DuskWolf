//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.SaveTest", function() {
	var save = load.require("dusk.save");

	var saveTest = {};
	
	saveTest.value = {};
	
	saveTest.save = function(type, args, ref) {
		var out = {};
		
		if(type == "selective") {
			for(var p = 0; p < args.values.length; p ++) {
				out[p] = ref(saveTest.value[args.values[p]]);
			}
			
			return out;
		}else{
			for(var p in saveTest.value) {
				out[p] = ref(saveTest.value[p]);
			}
		}
		
		return out;
	};
	
	saveTest.load = function(data, type, args, unref) {
		//if(type == "selective") {
			for(var p in data) {
				saveTest.value[p] = unref(data[p]);
			}
		//}else{
		//	saveTest.value = data;
		//}
	};
	
	return saveTest;
});

load.provide("dusk.save.SaveTestInstance", function() {
	var save = load.require("dusk.save");
	
	var SaveTestInstance = function(value) {
		this.value = value;
	};
	
	SaveTestInstance.refLoad = function(data, unref) {
		return new SaveTestInstance(unref(data));
	};
	
	SaveTestInstance.prototype.refSave = function(ref) {
		return ref(this.value);
	};
	
	SaveTestInstance.prototype.refClass = function() {
		return "dusk.save.SaveTestInstance";
	};
	
	return SaveTestInstance;
});
