"use strict";

load.provide("example.plat.rooms.long", (function() {
	var manager = load.require("dusk.rooms.plat");
	load.require("dusk.entities");
	
	var room = {"contents":[{"rows":21,"cols":50,"src":"pimg/techB.png","ani":[["4,0","5,0","6,0","5,0"],["1,0","2,0","3,0","2,0"]],"map":"BC16:0x:340801000000d4800400ff80ff80ff804880","weights":""},{"rows":21,"cols":50,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:340802000100000034802e8104802e8104802e8104802e8104802e8104802e810480038100012a812f800000000030800000000030800000000030800000000005802e8104802e8104802e8104802a8108802a8108802a8108802a816a80","weights":"0x:0080000000000000000000000000000000000000000000000000000000000000"},[],{},{"level":"192","colour":"#6699ff","alpha":0.5,"type":"water"},{"rows":21,"cols":50,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:340802000100000034802e8104802e8104802e8104802e8104802e8104802e8104802e812f800300030030800300030030800300030030800300030005802e8104802e8104802e8104802a8108802a8108802a8108802a816a80","weights":""},{"out":[[".entType=player",1,false,{"package":"example.plat.rooms.rooma","room":"rooma","mark":0}],[".entType=player",2,false,{"package":"example.plat.rooms.roomb","room":"roomb","mark":0}],[".entType=player",3,false,{"package":"example.plat.rooms.roomc","room":"roomc","mark":0}],[".entType=player",4,false,{"package":"example.plat.rooms.roomd","room":"roomd","mark":0}]],"in":{}}],"layers":[{"name":"back","type":1},{"name":"scheme","type":2},{"name":"entities","type":4,"primary":true},{"name":"parts","type":8},{"type":64,"name":"fluids"},{"name":"over","type":1},{"name":"transitions","type":16}]};
	
	manager.rooms.createRoom("example.plat.rooms.long", room);
	
	//Remember to add extra code!
	return room;
})()); 
