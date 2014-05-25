//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.TransitionManager", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var options = load.require("dusk.options");
	var utils = load.require("dusk.utils");
	var editor = load.require("dusk.editor");
	var entities = load.require("dusk.entities");
	var Fade = load.require("dusk.sgui.extras.Fade");

	/** @class dusk.sgui.TransitionManager
	 * 
	 * @classdesc A transition manager is a component that functions as a layer in a `{@link dusk.sgui.BasicMain}`.
	 * 
	 * It essentially allows the passage between rooms when a mark is triggered.
	 * 
	 * It stores data in a room as an object containing at most two properties; `"in"` and `"out"`.
	 * 
	 * `"in"` manages the transition into the current room, and is an object. It can have two properties:
	 * 
	 * - `"supressFade"` A boolean. If true, then the room will not fade in.
	 * - `"custom"` An array of custom functions that will be ran when the room loads, the array consists of alternating
	 *  function and scope entries (function first) and the arguments to the functions will be first the transition data
	 *  and secondly the mark that the entity was spawned at.
	 * 
	 * `"out"` is an array describing the transition between rooms, each element is an array describing one exit.
	 * The first element is a trigger criteria, format described in `{@link dusk.sgui.Entity}`, that describes the entitiy 
	 *  that can trigger this exit, second element is an integer describing what mark to add the exit for, third element is
	 *  a boolean indicating whether pressing "up" is needed, and the last element is an object describing the room to load.
	 * 
	 * The last object can have the following properties:
	 * 
	 * - `"package"` The package that the room is in. This will be imported when the current room is running, and this will
	 *  wait untill that package is imported before trying to load the room. This will also be the name of the room.
	 * - `"mark"` The mark at which to spawn the seek entity.
	 * - `"custom"` Similar to the `"custom"` property of the `"in"` object, but ran when the current out transition is
	 *  being used, the functions only have the current out transition as the first argument and no second argument.
	 * - `"supressFade"` If true, then the room will not fade out.
	 * 
	 * If this component is focused and `{@link dusk.editor#active}` is true then this will display all the transitions 
	 *  on the canvas, and let the user edit them. This will not respect the width and height of the component, because I'm
	 *  too lazy to have that work. As such the width and height of this are both 1. The controls are as follows:
	 * 
	 * - `a` Add a transition, alerts will get the relevent information.
	 * - `r` Remove a transition.
	 * - `i` Edit the `"in"` transition.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Component
	 * @extends dusk.sgui.IBasicMainLayer
	 * @constructor
	 * @since 0.0.20-alpha
	 */
	var TransitionManager = function(parent, comName) {
		Component.call(this, parent, comName);
		
		/** The transition data for the current room.
		 * @type object
		 * @protected
		 */
		this._transitions = {};
		/** If true, then we are transitioning into the current room, otherwise we are transitioning out of it.
		 * @type boolean
		 * @protected
		 */
		this._initial = true;
		/** The "out" transition that is currently running.
		 * @type array
		 * @protected
		 */
		this._current = null;
		/** The amount of calls to `{@link dusk.sgui.TransitionManager#endWait}` we are waiting on. Every call to 
		 * `{@link dusk.sgui.TransitionManager#wait}` increases this.
		 * @type integer
		 * @private
		 */
		this._waits = 0;
		/** The id of the markTrigger event we listen for, so we can remove it when this is deleted.
		 * @type integer
		 * @private
		 * @since 0.0.20-alpha
		 */
		this._mtId = 0;
		
		//Defaults
		this.width = 1;
		this.height = 1;
		
		//Listeners
		this.prepareDraw.listen(this._tmDraw, this);
		this.frame.listen(this._tmFrame, this);
		this.keyPress.listen(function(e) {
			if(editor.active) this.add(
				prompt("Please enter a trigger criteria.", this._getLastTrigger()),
				+prompt("Please enter a mark to trigger."),
				confirm("Does up need to be pressed?"),
				utils.jsonParse(prompt("Please enter a JSON describing the room.", '{"package":"", "mark":0}'))
			);
		}, this, {"key":65});
		this.keyPress.listen(function(e) {
			if(editor.active) this.remove(prompt("Enter a transition to remove.", 0));
		}, this, {"key":82});
		this.keyPress.listen(function(e) {
			if(editor.active) this._transitions.in =
				utils.jsonParse(prompt("Edit in transition.", "{}"));
		}, this, {"key":73});
		
		//Add to the MarkTrigger listener
		this._mtId = entities.markTrigger.listen(this._tmMarkTrigger, this);
		this.onDelete.listen(
			(function(e) {entities.markTrigger.unlisten(this._mtId);}).bind(this)
		);
	};
	TransitionManager.prototype = Object.create(Component.prototype);

	/** Loads the transitions from the room data, begins loading any packages for the next rooms, and transitions in.
	 * @param {object} data The transition data.
	 * @param {integer} mark The mark the seek entity will appear at.
	 */
	TransitionManager.prototype.loadBM = function(data, mark) {
		this._transitions = data;
		
		//Pre-import all packages
		if("out" in this._transitions && options.get("net.prefetchRooms")) {
			for(var i = 0; i < this._transitions.out.length; i ++) {
				if("package" in this._transitions.out[i][3]) load.import(this._transitions.out[i][3].package);
			}
		}
		
		//Should delay game before all of these are finished?
		if(!("in" in this._transitions) || !this._transitions.in.supressFade) {
			this.container.addExtra("Fade", "tm_fadein", {"on":true, "from":0.0, "to":1.0, "duration":20});
			this.wait();
			this.container.getExtra("tm_fadein").onDelete.listen(function(e) {this.endWait();}, this);
		}
		
		//Custom in transition
		if("in" in this._transitions && "custom" in this._transitions.in) {
			for(var j = 0; j < this._transitions.in.custom.length; j += 2) {
				this._transitions.in.custom[j].call(this._transitions.in.custom[j+1], this._transitions, mark);
			}
		}
	};

	/** Saves the current transition data so it can be retrieved later. Due to limits in how JSON works, any custom in/out 
	 * functions will be replaced with `"%X"` where X is an integer.
	 * @return {object} The transitions this TransitionManager has edited.
	 */
	TransitionManager.prototype.saveBM = function() {
		var copy = utils.clone(this._transitions);
		
		var count = 0;
		if("in" in copy) {
			if("custom" in copy.in) {
				for(var i = 0; i < copy.in.custom.length; i ++) {
					copy.in.custom[i] = "%"+(count++);
				}
			}
		}
		
		if("out" in copy) {
			for(var i = 0; i < copy.out.length; i ++) {
				if("custom" in copy.out[i]) {
					for(var j = 0; j < copy.out[i].custom.length; j ++) {
						copy.out[i].custom[j] = "%"+(count++);
					}
				}
			}
		}
		
		return copy;
	};

	/** Adds a new "out" transition.
	 * @param {string} trigger Trigger criteria for the entity.
	 * @param {integer} mark The mark that is to be the exit point.
	 * @param {boolean} up Whether the up control needs to be pressed.
	 * @param {object} data Transition data, as described in the class documentation.
	 */
	TransitionManager.prototype.add = function(trigger, mark, up, data) {
		if(!("out" in this._transitions)) this._transitions.out = [];
		this._transitions.out[this._transitions.out.length] = [trigger, mark, up, data];
	};

	/** Removes an "out" transition.
	 * @param {integer} id The index at which to remove.
	 */
	TransitionManager.prototype.remove = function(id) {
		this._transitions.out.splice(id,  1);
	};

	/** Used in custom functions, the TransitionManager to not load the next room until
	 * `{@link dusk.sgui.TransitionManager#endWait}` is called the same amount of times as this function. This allows you to
	 * do async stuff while the room is transitioning.
	 */
	TransitionManager.prototype.wait = function() {
		this._waits ++;
	};

	/** Used in custom functions, the TransitionManager to not load the next room until
	 * `{@link dusk.sgui.TransitionManager#wait}` is called the same amount of times as this function. This allows you to
	 * do async stuff while the room is transitioning. `{@link dusk.sgui.TransitionManager#wait}` should always be called
	 * first.
	 */
	TransitionManager.prototype.endWait = function() {
		this._waits --;
		
		if(!this._waits) {
			if(this._initial) {
				
			}else{
				this._initial = true;
				this.container.createRoom(this._current["package"], this._current.mark);
			}
		}
	};

	/** Used internally to manage a mark being triggered.
	 * @param {object} e An event object from `{@link dusk.entities#markTrigger}`.
	 * @private
	 */
	TransitionManager.prototype._tmMarkTrigger = function(e) {
		if(!("out" in this._transitions)) return;
		
		for(var i = 0; i < this._transitions.out.length; i ++) {
			if(e.mark == this._transitions.out[i][1] && e.up == this._transitions.out[i][2]
			&& e.entity.meetsTrigger(this._transitions.out[i][0])) {
				//Do a transition
				this._initial = false;
				this._current = this._transitions.out[i][3];
				this.wait();
				
				//Loading rooms
				load.abort();
				if(this._current.package) {
					load.import(this._current.package);
					if(!load.isImported(this._current.package)) {
						this.wait();
						load.onProvide.listen(function(e) {this.endWait();}, this, {"package":this._current.package});
					}
				}
				
				//Fade
				if(!this._current.supressFade) {
					this.container.addExtra("Fade", "tm_fadeout", {"on":true, "from":1.0, "to":0.0, "duration":20});
					this.wait();
					this.container.getExtra("tm_fadeout").onDelete.listen(function(e) {this.endWait();}, this);
				}
				
				//Custom functions
				if("custom" in this._current) {
					for(var j = 0; j < this._current.custom.length; j += 2) {
						this._current.custom[j].call(this._current.custom[j+1], this._current);
					}
				}
				
				this.endWait();
			}
		}
	};

	/** Gets the trigger criteria of the "out" trigger with the highest index.
	 * @return {string} The trigger criteria, or an empty string if there is none.
	 * @private
	 */
	TransitionManager.prototype._getLastTrigger = function() {
		if(!("out" in this._transitions)) return "";
		
		return this._transitions.out[this._transitions.out.length-1][0];
	};

	/** Called every frame, and makes sure the text (for editing) always appears at the right place no matter what the 
	 * offsets.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#frame}`.
	 * @private
	 */
	TransitionManager.prototype._tmFrame = function(e) {
		if(!editor.active) return;
		if(!this.focused) return;
		
		this.x = this.container.xOffset;
		this.y = this.container.yOffset+10;
	};

	/** Draws the text that this displays when editing.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#prepareDraw}`.
	 * @private
	 */
	TransitionManager.prototype._tmDraw = function(e) {
		if(!editor.active) return;
		if(!this.focused) return;
		
		var frags = this._tmPretty().split("\n");
		var y = 50 + e.d.sourceY + e.d.destY;
		var x = 5 + e.d.sourceX + e.d.destX
		e.c.fillStyle = this.container.editorColour;
		for(var i = 0; i < frags.length; i ++) {
			e.c.fillText(frags[i], x, y);
			y += 10;
		}
	};

	/** Displays the transitions in a nice, friendly, happy way to be displayed on the screen.
	 * @return {string} A pretty printed version of the transitions in this transitionManager.
	 * @private
	 */
	TransitionManager.prototype._tmPretty = function() {
		var copy = utils.clone(this._transitions);
		var hold = "{\n";
		var count = 0;
		if("in" in copy) {
			if("custom" in copy.in) {
				for(var i = 0; i < copy.in.custom.length; i ++) {
					copy.in.custom[i] = "%"+(count++);
				}
			}
			hold += '    "in": '+JSON.stringify(copy.in)+"\n";
		}
		
		if("out" in copy) {
			hold += '    "out":[\n'
			for(var i = 0; i < copy.out.length; i ++) {
				if("custom" in copy.out[i]) {
					for(var j = 0; j < copy.out[i].custom.length; j ++) {
						copy.out[i].custom[j] = "%"+(count++);
					}
				}
				hold += '        "'+i+'": '+JSON.stringify(copy.out[i])+'\n';
			}
			hold += '    ]\n';
		}
		
		return hold + "}";
	};

	//Add prefetch option
	options.register("net.prefetchRooms", "boolean", true, 
		"Whether connecting rooms shound be automatically downloaded when a room is loaded."
	);

	Object.seal(TransitionManager);
	Object.seal(TransitionManager.prototype);

	sgui.registerType("TransitionManager", TransitionManager);
	
	return TransitionManager;
})());
