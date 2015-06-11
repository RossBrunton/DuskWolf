//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.SelectorManager", (function() {
	var utils = load.require("dusk.utils");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var entities = load.require("dusk.entities");
	var dirs = load.require("dusk.utils.dirs");
	var frameTicker = load.require("dusk.utils.frameTicker");
	
	var SelectorManager = function(com, type) {
		this._com = com;
		this._select = null;
		this._hidden = false;
		this._oldVis = true;
		
		this._oldX = -1;
		this._oldY = -1;
		
		this._taskRunning = false;
		
		this._path = null;
		
		frameTicker.onFrame.listen(_onFrame.bind(this));
		
		this.selectorType = type ? type : "stdSelector";
	};
	
	SelectorManager.prototype.getSelector = function() {
		if(this._select && !this._select.deleted) {
			return this._select;
		}else{
			if(this._com instanceof EntityGroup) {
				this._select = this._com.dropEntity({"name":"_selector", "type":this.selectorType, "x":0, "y":0});
			}else if(this._com instanceof LayeredRoom) {
				this._select = this._com.getPrimaryEntityLayer().dropEntity(
					{"name":"_selector", "type":this.selectorType, "x":0, "y":0}
				);
			}else{
				return null;
			}
			this._oldVis = this._select.visible;
			this._select.entityEvent.listen(_handleEndMove.bind(this), "gwStopMove");
			return this.getSelector();
		}
	};
	
	SelectorManager.prototype.hide = function() {
		if(!this._hidden) {
			this._hidden = true;
			this._oldVis = this.getSelector().visible;
			this.getSelector().visible = false;
		}
	};
	
	SelectorManager.prototype.show = function() {
		if(this._hidden) {
			this._hidden = false;
			this.getSelector().visible = this._oldVis;
		}
	};
	
	SelectorManager.prototype.begin = function() {
		this.show();
		this.getSelector().eProp("gmMouseMove", true);
		this.getSelector().getRoot().pushActive();
		this.getSelector().becomeActive();
	};
	
	SelectorManager.prototype.done = function() {
		this.hide();
		this.getSelector().eProp("gmMouseMove", false);
		this.getSelector().getRoot().popActive();
	};
	
	SelectorManager.prototype.performTask = function(options) {
		return new Promise((function(fulfillFn, rejectFn) {
			var fulfill = function(x) {
				this.done();
				this._taskRunning = false;
				fulfillFn(x);
			};
			
			var reject = function(x) {
				this.done();
				this._taskRunning = false;
				rejectFn(x);
			};
			
			this._taskRunning = true;
			
			if(options.path) {
				this._path = options.path;
			}else{
				this._path = null;
			}
		}).bind(this));
	};
	
	var _onFrame = function(e) {
		if(this._taskRunning) {
			this.getSelector();
			if(!this.getSelector().active) {
				this.getSelector().container.flow(this.getSelector().name);
			}
		
			if(!this.getSelector().eProp("gmMouseMove")) {
				this.getSelector().eProp("gmMouseMove", true);
			}
		}
	};
	
	var _handleEndMove = function(e) {
		if(e.targetX != this._oldX || e.targetY != this._oldY && this._taskRunning) {
			this._oldX = e.targetX;
			this._oldY = e.targetY;
			
			if(this._path) {
				if(e.dir == dirs.NONE) {
					this._path.find(e.targetX, e.targetY, 0);
				}else{
					this._path.append(e.dir);
					if(!this._path.validPath) {
						this._path.find(e.targetX, e.targetY, 0);
					}
				}
			}
			
			console.log(e);
			console.log(this._path.toString());
		}
	};
	
	SelectorManager.stdSelect = entities.types.createNewType("stdSelector", {
		"behaviours":{
			"PlayerGridWalker":true, "GridWalker":true, "GridMouse":true 
		},
		"data":{
			"solid":false, "collides":false, "src":"default/selector32.png", "noSave":true, "noRegion":true,
			"gmMouseMove":false
		},
		"animation":[["true", "0,0|1,0|2,0|1,0", {}]]
	}, "quest");
	
	return SelectorManager;
})());
