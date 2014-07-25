//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.checkpoints", (function() {
	var InteractableTarget = load.require("dusk.behave.InteractableTarget");
	var containerUtils = load.require("dusk.containerUtils");
	
	/** 
	 * Checkpoint objects have the following properties:
	 * - saveType: (required) What interaction event to trigger saving.
	 * - loadType: (required) What checkpoint type to trigger loading.
	 * - priority: (required) An integer, higher values will be checked for loading first.
	 * - spec: (required) The save spec to save and load.
	 * - checkSave: A function that checks if this checkpoint wants to save.
	 * - postSave: A function called after saving
	 * - checkLoad: A function that checks if this checkpoint wants to load.
	 * - postLoad: A method called when this checkpoint has finished loading.
	 * They also have a name, which is the key of the object.
	 * 
	 * On interaction event:
	 * - For every checkpoint
	 * -- If the interaction event name matches the checkpoint's saveType
	 * --- Call their checkSave method with the interaction event. If it returns true:
	 * ---- Save the checkpoint's saveSpec
	 * ---- Call their postSave method with onLoad=false and the interaction event.
	 * ---- Store the room name and entity name of the checkpoint such that the entity can check if it is active.
	 * 
	 * On loadCheckpoint (method of this class, with required argument type and optional argument):
	 * - For the checkpoint that has not been checked yet, and has the highest priority:
	 * -- If the type argument is the same as the loadType on the checkpoint:
	 * --- Call their checkLoad method with the name and argument. If it returns true:
	 * ---- Load the checkpoint's saveSpec
	 * ---- Call the postLoad method with the name and optional argument
	 * ---- Save the checkpoint's saveSpec
	 * ---- Call its postSave method with onLoad=true
	 * ---- Exit loadCheckpoint
	 * 
	 * Checkpoints do not, and should not be used as, normal "saving" points. Although checkpoints can be saved, they
	 *  do not save their own checkpoints to sources; if you want that functionality, autosave after saving.
	 * @since 0.0.21-alpha
	 * @implements dusk.IContainer
	 */
	var checkpoints = {};
	
	var _points = {};
	var _savedData = {};
	var _activeCheckpoints = {};
	
	containerUtils.implementIContainer(checkpoints, _points, function(value) {
		return value && ("saveType" in value) && ("loadType" in value) && ("priority" in value) && ("spec" in value);
	});
	
	InteractableTarget.interact.listen(function(e) {
		for(var p in _points) {
			if(e.type == _points[p].saveType) {
				if(("checkSave" in _points[p] && _points[p].checkSave(e)) || !("checkSave" in _points[p])) {
					_savedData[p] = _points[p].spec.save();
					if("postSave" in _points[p]) _points[p].postSave(false, e);
					_activeCheckpoints[p] = [e.room, e.comName];
				}
			}
		}
	});
	
	checkpoints.loadCheckpoint = function(type, args) {
		var complete = [];
		while(true) {
			var min = 0;
			var check = "";
			
			for(var p in _points) {
				if((!check || _points[p].priority < min) && complete.indexOf(p) === -1
				&& _points[p].loadType == type && _savedData[p]) {
					min = _points[p].priority;
					check = p;
				}
			}
			
			if(!check) {
				break;
			}
			
			complete.push(check);
			if(("checkLoad" in _points[p] && _points[p].checkLoad(type, args)) || !("checkLoad" in _points[p])) {
				_points[p].spec.load(_savedData[p]).then(function(v) {
					if("postLoad" in _points[p]) _points[p].postLoad(type, args);
					_savedData[p] = _points[p].spec.save();
					if("postSave" in _points[p]) _points[p].postSave(true);
				});
				
				return true;
			}
		}
		
		return false;
	};
	
	checkpoints.isActivated = function(name, room, comName) {
		if(name in _activeCheckpoints && _activeCheckpoints[name][0] == room && _activeCheckpoints[name][1] == comName){
			return true;
		}
		
		return false;
	};
	
	return checkpoints;
})());
