"use strict";

load.provide("example.plat.rooms.roomc", (function() {
	var manager = load.require("dusk.plat");
	load.require("dusk.entities");
	
	var room = [{"rows":15,"cols":41,"src":"pimg/techB.png","ani":[["1,0","2,0","3,0","2,0"],["4,0","5,0","6,0","5,0"]],"map":"BC16:0x:ce04020000000100588001000000000001000000038100000100038001000480010001001580010000000000010000000100038001000380010003800100000000000100148004810000010001000000000001000380010003800100000000000100148001000000000001000000010003800100038001000380010000000000010014800100000000000100000003810000038100000381000000000100010084800100d280"},{"rows":15,"cols":41,"src":"pimg/schematics.png","ani":[],"map":"BC16:0x:ce040200000001002c802381068001001a8001000480000100010100068001001a8001000480000100010100068001001a80010003800481068001001e800100000000000100068001001d8001000100000000000100068001001c800100010003800100068001001b80010001000480010006800381188001000100048001000100068003811680038104800381068003811d80010101010100068003811d80010101010100068023812c80"},[{"name":"#76","type":"checkpoint","x":928,"y":288},{"name":"#75","type":"coin","x":128,"y":160},{"name":"#74","type":"coin","x":160,"y":160},{"name":"#73","type":"coin","x":160,"y":192},{"name":"#72","type":"coin","x":128,"y":192},{"name":"#71","type":"coin","x":1056,"y":320},{"name":"#70","type":"coin","x":1024,"y":320},{"name":"#69","type":"coin","x":800,"y":384},{"name":"#68","type":"coin","x":768,"y":384},{"name":"#67","type":"coin","x":672,"y":384},{"name":"#66","type":"coin","x":640,"y":384},{"name":"#65","type":"coin","x":544,"y":384},{"name":"#64","type":"coin","x":512,"y":384},{"name":"#63","type":"coin","x":416,"y":384},{"name":"#62","type":"coin","x":384,"y":384},{"name":"#61","type":"coin","x":288,"y":384},{"name":"#60","type":"coin","x":256,"y":384},{"name":"#34","type":"heart","x":160,"y":263},{"name":"#33","type":"heart","x":128,"y":263},{"name":"#48","type":"push","x":960,"y":256},{"name":"#47","type":"push","x":960,"y":224},{"name":"#46","type":"push","x":960,"y":192},{"name":"#45","type":"push","x":960,"y":160},{"name":"#44","type":"fall","x":768,"y":288},{"name":"#43","type":"fall","x":800,"y":288},{"name":"#42","type":"fall","x":672,"y":288},{"name":"#41","type":"fall","x":640,"y":288},{"name":"#40","type":"fall","x":544,"y":288},{"name":"#39","type":"fall","x":512,"y":288},{"name":"#38","type":"fall","x":416,"y":288},{"name":"#37","type":"fall","x":384,"y":288},{"name":"#36","type":"fall","x":288,"y":288},{"name":"#35","type":"fall","x":256,"y":288},{"name":"#32","type":"push","x":864,"y":320},{"name":"#31","type":"push","x":832,"y":320},{"name":"#30","type":"push","x":864,"y":288},{"name":"#29","type":"push","x":832,"y":288},{"name":"#28","type":"push","x":736,"y":320},{"name":"#27","type":"push","x":704,"y":320},{"name":"#26","type":"push","x":736,"y":288},{"name":"#25","type":"push","x":704,"y":288},{"name":"#24","type":"push","x":576,"y":320},{"name":"#23","type":"push","x":608,"y":320},{"name":"#22","type":"push","x":608,"y":288},{"name":"#21","type":"push","x":576,"y":288},{"name":"#20","type":"push","x":480,"y":288},{"name":"#19","type":"push","x":448,"y":288},{"name":"#18","type":"push","x":480,"y":320},{"name":"#17","type":"push","x":448,"y":320},{"name":"#16","type":"push","x":320,"y":320},{"name":"#15","type":"push","x":352,"y":320},{"name":"#14","type":"push","x":352,"y":288},{"name":"#13","type":"push","x":320,"y":288},{"name":"#12","type":"push","x":224,"y":288},{"name":"#11","type":"push","x":192,"y":288},{"name":"#10","type":"push","x":224,"y":320},{"name":"#9","type":"push","x":192,"y":320},{"name":"#10","type":"push","x":224,"y":320},{"name":"#7","type":"push","x":928,"y":384},{"name":"#6","type":"push","x":896,"y":384},{"name":"#5","type":"push","x":928,"y":352},{"name":"#4","type":"push","x":896,"y":352},{"name":"#3","type":"fall","x":1056,"y":128},{"name":"#2","type":"fall","x":1024,"y":128},{"name":"#1","type":"fall","x":992,"y":128},{"name":"#8","type":"bad","x":128,"y":64},{"name":"#49","type":"bad","x":160,"y":64},{"name":"#50","type":"bad","x":128,"y":96},{"name":"#51","type":"bad","x":928,"y":96},{"name":"#52","type":"bad","x":928,"y":64},{"name":"#53","type":"bad","x":896,"y":64},{"name":"#54","type":"bad","x":1120,"y":160},{"name":"#55","type":"bad","x":1152,"y":160},{"name":"#56","type":"bad","x":1120,"y":192},{"name":"#57","type":"bad","x":1152,"y":192},{"name":"#58","type":"bad","x":1152,"y":256},{"name":"#59","type":"bad","x":1152,"y":224}],{},{"rows":15,"cols":41,"src":"pimg/techO.png","ani":[],"map":"BC16:0x:ce04030001000000020056801a8101000381038208801a8101000381038208801a81010003810b801e8101000000000008801d81010001000000000008801c8101000100038108801b810100010004810a8018810100010004810b801681038004810c801d81020002000a801d81020002005680"},{"out":[[".entType=player",0,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":3}],[".entType=player",1,false,{"package":"example.plat.rooms.exhall","room":"exhall","mark":0}]]}];
	
	manager.rooms.createRoom("example.plat.rooms.roomc", room);
	
	//Remember to add extra code!
	return room;
})()); 
