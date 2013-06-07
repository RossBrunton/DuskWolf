"use strict";

dusk.load.require("dusk.plat");
dusk.load.require("dusk.entities");
dusk.load.provide("example.plat.rooms.roomd");

example.plat.rooms.roomd = [{"rows":44,"cols":24,"src":"pimg/techB.png","ani":[["1,0","2,0","3,0","2,0"],["4,0","5,0","6,0","5,0"]],"map":"BC16:0x:400801000000ff80ff80ff80e680010001001680010001002380"},{"rows":44,"cols":24,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:40080200000001001a80148104800100108000010001010004800100108000010001010004800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000009810480098100000000098104800981000000000981048009810000000001010101078104800981000000000101010107810480148100000000"},[{"name":"#10","type":"coin","x":224,"y":96},{"name":"#9","type":"coin","x":224,"y":64},{"name":"#8","type":"coin","x":192,"y":64},{"name":"#7","type":"coin","x":192,"y":96},{"name":"#6","type":"coin","x":160,"y":96},{"name":"#5","type":"coin","x":160,"y":64},{"name":"#4","type":"coin","x":128,"y":64},{"name":"#3","type":"coin","x":128,"y":96},{"name":"#2","type":"coin","x":96,"y":96},{"name":"#1","type":"coin","x":96,"y":64}],{},{"rows":44,"cols":24,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:4008020001000000338010810200020006801081020002000e800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030016800300030002000200148003000300020002002180"},{"out":[[".entType=player",0,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":4}],[".entType=player",1,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":0}]]}];

dusk.plat.rooms.createRoom("roomd", example.plat.rooms.roomd);
