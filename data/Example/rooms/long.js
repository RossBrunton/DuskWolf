"use strict";

load.provide("example.plat.rooms.long", (function() {
	var manager = load.require("dusk.plat");
	load.require("dusk.entities");
	
	var room = [{"rows":12,"cols":50,"src":"pimg/techB.png","ani":[["4,0","5,0","6,0","5,0"],["1,0","2,0","3,0","2,0"]],"map":"BC16:0x:b00401000000d4800400ff808480"},{"rows":12,"cols":50,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:b00402000100000034802e8104802e8104802e8104802e8104802e8104802e810480038100012a81ca80"},[],{},{"rows":12,"cols":50,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:b00402000100000034802e8104802e8104802e8104802e8104802e8104802e8104802e81ca80"},{"out":[[".entType=player",1,false,{"package":"example.plat.rooms.rooma","room":"rooma","mark":0}],[".entType=player",2,false,{"package":"example.plat.rooms.roomb","room":"roomb","mark":0}],[".entType=player",3,false,{"package":"example.plat.rooms.roomc","room":"roomc","mark":0}],[".entType=player",4,false,{"package":"example.plat.rooms.roomd","room":"roomd","mark":0}]],"in":{}}];
	
	manager.rooms.createRoom("example.plat.rooms.long", room);
	
	//Remember to add extra code!
	return room;
})()); 
