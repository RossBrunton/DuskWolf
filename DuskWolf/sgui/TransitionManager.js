//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.sgui.extras.Fade");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.sgui.TransitionManager");

/** @class dusk.sgui.TransitionManager
 * 
 * @classdesc 
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Image
 * @constructor
 */
dusk.sgui.TransitionManager = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	this._transitions = {};
	this._initial = true;
	this._current = null;
	this._waits = 0;
	this.width = 1;
	this.height = 1;
	
	//Prop masks
	
	//Listeners
	this.prepareDraw.listen(this._tmDraw, this);
	this.frame.listen(this._tmFrame, this);
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) this.add(
			prompt("Please enter a trigger criteria.", this._getLastTrigger()),
			+prompt("Please enter a mark to trigger."),
			confirm("Does up need to be pressed?"),
			dusk.utils.jsonParse(prompt("Please enter a JSON describing the room.", '{"package":"", "mark":0}'))
		);
	}, this, {"key":65});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) this.remove(prompt("Enter a transition to remove.", 0));
	}, this, {"key":82});
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
	
	//Add to the MarkTrigger listener
	dusk.entities.markTrigger.listen(this._tmMarkTrigger, this);
	this.onDelete.listen(function(e) {dusk.entities.markTrigger.unlisten(this._tmMarkTrigger, this);}, this);
};
dusk.sgui.TransitionManager.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.TransitionManager.prototype.loadBM = function(data, mark) {
	this._transitions = data;
	
	if("out" in this._transitions) {
		for(var i = 0; i < this._transitions.out.length; i ++) {
			if("package" in this._transitions.out[i][3]) dusk.load.import(this._transitions.out[i][3].package);
		}
	}
	
	//Should delay game before all of these are finished?
	if(!("in" in this._transitions) || !this._transitions.in.supressFade) {
		this.container.addExtra("Fade", "tm_fadein", {"on":true, "from":0.0, "to":1.0, "duration":20});
		this.wait();
		this.container.getExtra("tm_fadein").onDelete.listen(function(e) {this.endWait();}, this);
	}
	
	if("in" in this._transitions && "custom" in this._transitions.in) {
		for(var j = 0; j < this._transitions.in.custom.length; j += 2) {
			this._transitions.in.custom[j].call(this._transitions.in.custom[j+1], this._transitions, mark);
		}
	}
};

dusk.sgui.TransitionManager.prototype.saveBM = function() {
	var copy = dusk.utils.clone(this._transitions);
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

dusk.sgui.TransitionManager.prototype.add = function(trigger, mark, up, data) {
	if(!("out" in this._transitions)) this._transitions.out = [];
	this._transitions.out[this._transitions.out.length] = [trigger, mark, up, data];
};

dusk.sgui.TransitionManager.prototype.remove = function(id) {
	this._transitions.out.splice(id,  1);
};

dusk.sgui.TransitionManager.prototype.wait = function() {
	this._waits ++;
};

dusk.sgui.TransitionManager.prototype.endWait = function() {
	this._waits --;
	
	if(!this._waits) {
		if(this._initial) {
			
		}else{
			this._initial = true;
			this.container.createRoom(this._current.room, this._current.mark);
		}
	}
};

dusk.sgui.TransitionManager.prototype._tmMarkTrigger = function(e) {
	if(!("out" in this._transitions)) return;
	for(var i = 0; i < this._transitions.out.length; i ++) {
		if(e.mark == this._transitions.out[i][1] && e.up == this._transitions.out[i][2]
		&& e.entity.meetsTrigger(this._transitions.out[i][0])) {
			//Do a transition
			this._initial = false;
			this._current = this._transitions.out[i][3];
			if(!("room" in this._transitions.out[i])) this._transitions.out[i].room = this._transitions.out[i].package;
			this.wait();
			
			//Loading rooms
			dusk.load.abort();
			if(this._current.package) {
				dusk.load.import(this._current.package);
				if(!dusk.load.isImported(this._current.package)) {
					this.wait();
					dusk.load.onProvide.listen(function(e) {this.endWait();}, this, {"package":this._current.package});
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

dusk.sgui.TransitionManager.prototype._getLastTrigger = function(e) {
	if(!("out" in this._transitions)) return "";
	
	return this._transitions.out[this._transitions.out.length-1][0];
};

dusk.sgui.TransitionManager.prototype._tmFrame = function(e) {
	if(!dusk.editor.active) return;
	if(!this._focused) return;
	
	this.x = this.container.xOffset;
	this.y = this.container.yOffset+10;
};

dusk.sgui.TransitionManager.prototype._tmDraw = function(e) {
	if(!dusk.editor.active) return;
	if(!this._focused) return;
	
	var frags = this._tmPretty().split("\n");
	var y = 50 + e.d.sourceY + e.d.destY;
	var x = 5 + e.d.sourceX + e.d.destX
	e.c.fillStyle = this.container.editorColour;
	for(var i = 0; i < frags.length; i ++) {
		e.c.fillText(frags[i], x, y);
		y += 10;
	}
};

dusk.sgui.TransitionManager.prototype._tmPretty = function() {
	var copy = dusk.utils.clone(this._transitions);
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

Object.seal(dusk.sgui.TransitionManager);
Object.seal(dusk.sgui.TransitionManager.prototype);

dusk.sgui.registerType("TransitionManager", dusk.sgui.TransitionManager);
