//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.checkpoints", (function() {
	var InteractableTarget = load.require("dusk.entities.behave.InteractableTarget");
	var containerUtils = load.require("dusk.utils.containerUtils");
	
	/** Checkpoints listen for specific interaction events, and then saves a checkpoint. It can then load that
	 *  checkpoint later.
	 * 
	 * Basically, it listens for a specific Interaction event (from `dusk.entities.behave.InteractableTarget`), and if
	 *  it checks out, will use a SaveSpec to save the current state. When `loadCheckpoint` is called with the correct
	 *  arguments, it will load this state.
	 * 
	 * You use the `get` and `set` method to manipulate "checkpoint objects", which describe the process of saving and
	 *  loading a checkpoint.
	 * 
	 * When loading a checkpoint, it is saved immediatley afterwards, this is so that any changes made during the
	 *  "postLoad" function, such as reducing lives, are saved.
	 * 
	 * Checkpoint objects have the following properties:
	 * - saveType: (required) What interaction event name (the `interactType` of the checkpoint entity) to trigger
	 *  saving.
	 * - loadType: (required) What checkpoint type (first argument to the `loadCheckpoint`) to trigger loading.
	 * - priority: (required) An integer, higher values will be checked for loading first.
	 * - spec: (required) The save spec to save and load.
	 * - checkSave: A function that checks if this checkpoint wants to save, should return a boolean, given the
	 *  interaction event as an argument.
	 * - postSave: A function called after saving, the first argument is whether the save was after a load or not
	 *  (boolean), the second is the interaction event.
	 * - checkLoad: A function that checks if this checkpoint wants to load, first argument is the loadType, the second
	 *  is the "arg" parameter to loadCheckpoint.
	 * - postLoad: A method called when this checkpoint has finished loading, first argument is the loadType, second is
	 *  the "arg" parameter.
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
	 * 
	 * @since 0.0.21-alpha
	 * @implements dusk.utils.IContainer
	 * @implements dusk.save.ISavable
	 * @see dusk.checkpoints.behave.Checkpoint
	 */
	var checkpoints = {};
	
	/** An object conataining checkpoint objects.
	 * @type object
	 * @private
	 */
	var _points = {};
	/** The data saved by the save sources. Key is the checkpoint name, value is the save data object.
	 * @type object
	 * @private
	 */
	var _savedData = {};
	/** Which entity has activated this checkpoint, key is checkpoint name, value is a `[room, name]` pair for the
	 *  InteractableTarget entity that triggered it.
	 * @type object
	 * @private
	 */
	var _activeCheckpoints = {};
	
	// Implement IContainer
	containerUtils.implementIContainer(checkpoints, _points, function(value) {
		return value && ("saveType" in value) && ("loadType" in value) && ("priority" in value) && ("spec" in value);
	});
	
	// Listen for the interactable event and possibly save a checkpoint
	InteractableTarget.interact.listen(function(e) {
		var it = checkpoints.iterate();
		for(var p = it.next(); !p.done; p = it.next()) {
			if(e.type == p.value.saveType) {
				if(("checkSave" in p.value && p.value.checkSave(e)) || !("checkSave" in p.value)) {
					_savedData[p.key] = p.value.spec.save();
					if("postSave" in _points[p.key]) p.value.postSave(false, e);
					_activeCheckpoints[p.key] = [e.room, e.name];
				}
			}
		}
	});
	
	/** Loads a checkpoint.
	 * 
	 * It is given the type of checkpoint, and will find the checkpoint object with the highest priority that has a
	 *  "loadType" which matches it. It then loads previously saved data that exists for this checkpoint.
	 * 
	 * @param {string} type The type of the checkpoint.
	 * @param {*} args An argument which will be sent to checkLoad and postLoad.
	 * @return {boolean} Whether any checkpoint was loaded.
	 */
	checkpoints.loadCheckpoint = function(type, args) {
		// Stores which checkpoints have been checked
		var complete = [];
		while(true) {
			var max = 0;
			var check = "";
			var point = null;
			
			// Find the highest priority checkpoint that is valid
			var it = checkpoints.iterate();
			for(var p = it.next(); !p.done; p = it.next()) {
				if((!check || p.value.priority > max) && complete.indexOf(p.key) === -1
				&& p.value.loadType == type && _savedData[p.key]) {
					max = p.value.priority;
					check = p.key;
					point = p.value;
				}
			}
			
			if(!check) {
				break;
			}
			
			complete.push(check);
			
			// Now try to load it, if it fails, we loop again
			if(("checkLoad" in point && point.checkLoad(type, args)) || !("checkLoad" in point)) {
				point.spec.load(_savedData[check]).then(function(v) {
					if("postLoad" in point) point.postLoad(type, args);
					_savedData[check] = point.spec.save();
					if("postSave" in point) point.postSave(true);
				});
				
				return true;
			}
		}
		
		return false;
	};
	
	/** Checks if an entity with the given details is the last component to have saved this checkpoint.
	 * 
	 * @param {string} name The name of the checkpoint to check, will be the key used by `set`.
	 * @param {string} room The room that the entity to check is in.
	 * @param {string} ent The component name of the entity to check.
	 * @return {boolean} Whether the entity described is the last entity to have saved this checkpoint.
	 */
	checkpoints.isActivated = function(name, room, ent) {
		if(name in _activeCheckpoints && _activeCheckpoints[name][0] == room && _activeCheckpoints[name][1] == ent){
			return true;
		}
		
		return false;
	};
	
	/** Saves the data for all checkpoints into an object, used by SaveSpec.
	 * 
	 * Checkpoints will ignore the "type" argument, and only save objects. The argument must be an object, and may
	 *  contain either only or except. "only" will be an array of checkpoint names which will be the only ones saved,
	 *  while "except" will save all checkpoints except those with a name in the array.
	 *  
	 * @param {string} type The type of data to save.
	 * @param {object} args What to save.
	 * @param {function(*):*} ref The reffing function.
	 * @return {object} Saved data.
	 */
	checkpoints.save = function(type, args, ref) {
		var out = {};
		if("only" in args) {
			for(var i = 0; i < args.only.length; i ++) {
				if(args.only[i] in _savedData) {
					out[args.only[i]] = [ref(_savedData[args.only[i]]), ref(_activeCheckpoints[args.only[i]])];
				}
			}
		}else if("except" in args) {
			for(var p in _savedData) {
				if(args.except.indexOf(p) === -1) {
					out[p] = [ref(_savedData[p]), ref(_activeCheckpoints[p])];
				}
			}
		}else{
			for(var p in _savedData) {
				out[p] = [ref(_savedData[p]), ref(_activeCheckpoints[p])];
			}
		}
		return out;
	};
	
	/** Loads checkpoints from a given save data.
	 * 
	 * @param {object} data The saved data.
	 * @param {string} type What has been saved.
	 * @param {*} args The argument sent to the saving function.
	 * @param {function(*):*} The unreffing function.
	 */
	checkpoints.load = function(data, type, args, unref) {
		for(var p in data) {
			_savedData[p] = unref(data[p][0]);
			_activeCheckpoints[p] = unref(data[p][1]);
		}
	};
	
	return checkpoints;
})());
