//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.RoomTransitions", function() {
	var functionStore = load.require("dusk.utils.functionStore");
	var MarkTrigger = load.require("dusk.entities.behave.MarkTrigger");
	var dusk = load.require("dusk");
	var options = load.require("dusk.options");
	
	//"transitions":{"out":[[".entType=player",1,false,{"package":"example.plat.rooms.rooma","room":"rooma","mark":0}],[".entType=player",2,false,{"package":"example.plat.rooms.roomb","room":"roomb","mark":0}],[".entType=player",3,false,{"package":"example.plat.rooms.roomc","room":"roomc","mark":0}],[".entType=player",4,false,{"package":"example.plat.rooms.roomd","room":"roomd","mark":0}]],"in":{}}
	
	class RoomTransitions {
		constructor(data, room, manager) {
			this.roomName = room;
			this.roomManager = manager;
			this.layeredRoom = this.roomManager.basicMain;
			
			this._listenersToUnlink = new Map();
			
			this._currentTransition = null;
			
			// Load data
			if(!data) {
				data = {transitions:[], newRoom:{}};
			}
			
			this._transitions = data.transitions;
			this._newRoom = data.newRoom;
			
			// Listener for entity dropping
			var el = this.layeredRoom.getPrimaryEntityLayer();
			
			this._addListener(el.onDrop, function(e) {
				
			});
			
			// Listener for mark triggers
			this._addListener(MarkTrigger.onTrigger, function(e) {
				if(this._currentTransition) return;
				
				for(var t of this._transitions) {
					if("entType" in t[0] && e.entity.entType != t[0].entType) continue;
					if("mark" in t[0] && e.mark != t[0].mark) continue;
					if(t[0].up && !e.up) continue;
					if("validate" in t[0]) {
						functionStore.vars.set("entity", e.entity);
						functionStore.vars.set("mark", e.mark);
						functionStore.vars.set("up", e.up);
						if(!functionStore.eval(t[0].validate)(e.entity)) continue;
					}
					
					this._go(t);
					break;
				};
			});
			
			//Pre-import all packages
			if(options.get("net.prefetchRooms")) {
				for(var t of this._transitions) {
					load.import(t[2].room);
				}
			}
			
			if(dusk.dev) {
				window.addTransition = this.add.bind(this);
				window.removeTransition = this.remove.bind(this);
				window.setNewRoom = this.setNewRoom.bind(this);
				window.displayTransitions = (function() {
					console.log(this.export());
				}).bind(this);
			}
		}
		
		destroy() {
			for(var l of this._listenersToUnlink) {
				l[0].unlisten(l[1]);
			};
		}
		
		export() {
			return {
				transitions:this._transitions,
				newRoom:this._newRoom
			};
		}
		
		add(trigger, transition, dest) {
			this._transitions.push([trigger, transition, dest]);
		}
		
		remove(i) {
			this._transitions.splice(i, 1);
		}
		
		setNewRoom(newRoom) {
			this._newRoom = newRoom;
		}
		
		_go(tran) {
			this._currentTransition = tran;
			
			var chain = Promise.resolve(true);
			
			if("outFns" in tran[1]) {
				chain = chain.then(Promise.all(tran[1].outFns));
			}
			
			if("outEffect" in tran[1]) {
				chain = chain.then(this.layeredRoom.getExtra(tran[1].outEffect).start
					.bind(this.layeredRoom.getExtra(tran[1].outEffect), true));
			}
			
			chain = chain.then(this.roomManager.setRoom.bind(this.roomManager, tran[2].room, tran[2].spawn, false));
			
			if("inFns" in tran[1]) {
				chain = chain.then(Promise.all(tran[1].inFns));
			}
			
			if("inEffect" in tran[1]) {
				chain = chain.then(this.layeredRoom.getExtra(tran[1].inEffect).start
					.bind(this.layeredRoom.getExtra(tran[1].inEffect), true));
			}
			
			chain.then((function() {this.roomManager.currentTransitions.newRoom();}).bind(this));
		}
		
		newRoom() {
			var chain = Promise.resolve(true);
			
			if("fns" in this._newRoom) {
				chain = chain.then(Promise.all(this._newRoom.fns));
			}
			
			if("effect" in this._newRoom) {
				chain = chain.then(this.layeredRoom.getExtra(this._newRoom.effect).start
					.bind(this.layeredRoom.getExtra(this._newRoom.effect), true));
			}
			
			return chain;
		}
		
		_addListener(ed, fn) {
			this._listenersToUnlink.set(ed, ed.listen(fn.bind(this)));
		}
	}
	
	//Add prefetch option
	options.register("net.prefetchRooms", options.boolean, true, 
		"Whether connecting rooms shound be automatically downloaded when a room is loaded."
	);
	
	return RoomTransitions;
});
