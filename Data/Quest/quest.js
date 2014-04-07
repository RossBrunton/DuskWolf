"use strict";

dusk.load.require("dusk");

dusk.load.require("dusk.sgui.FancyRect");

dusk.load.require("quest.ents");
dusk.load.require("quest.rooms.rooma");

dusk.load.provide("quest");

dusk.onLoad.listen(function (e){dusk.quest.rooms.setRoom("quest.rooms.rooma", 0);});

//Test
/*dusk.sgui.getPane("test").parseProps({
   "children":{
	   "test":{
			"type":"FancyRect",
			"width":100,
			"height":200,
			"x":50,
			"y":50,
			"back":"fancyRect/back.png",
			"top":"fancyRect/top.png",
			"bottom":"fancyRect/bottom.png",
			"left":"fancyRect/left.png",
			"right":"fancyRect/right.png",
			"topLeft":"fancyRect/topLeft.png",
			"topRight":"fancyRect/topRight.png",
			"bottomLeft":"fancyRect/bottomLeft.png",
			"bottomRight":"fancyRect/bottomRight.png",
			"radius":2
		}
	}
})*/;


window.q = dusk.quest.puppeteer;
window.move = function(arg, qu) {
	var t = dusk.utils.clone(targ);
	t.region = "r"+Math.random();
	t.opts.forEach[0].name = t.region+"_attack";
	
	qu(q.requestBoundPair("getSeek", {})); qu(q.requestBoundPair("generateRegion", t));
	qu(q.requestBoundPair("getTilePathInRange", {"colour":"#999999"}));
	qu(q.requestBoundPair("moveViaPath"));
	qu(q.requestBoundPair("uncolourRegion", {"regions":[t.region+"_attack", t.region, t.region+"_path"]}));
}

window.targ = 
	{"region":"r", "los":true, "range":8, "opts":{"forEach":[
		{"name":"attack", "range":2, "colour":"#990000"}
	], "colour":"#000099", "entBlock":"stat(faction, 1) = ENEMY"}}

quest.go = function() {
	return dusk.reversiblePromiseChain([
		q.requestBoundPair("selectEntity", {"filter":"stat(faction, 1) = ALLY"}),
		q.requestBoundPair("generateRegion", targ),
		q.requestBoundPair("getTilePathInRange", {"colour":":sgui/arrows32.png"}),
		q.requestBoundPair("moveViaPath"),
		q.requestBoundPair("uncolourRegion", {"regions":["attack", targ.region, targ.region+"_path"]})
	], false)
	.then(console.log.bind(console), console.error.bind(console))
	.then(quest.go);
}

targ.opts.weights = new dusk.sgui.TileMapWeights(2, 10);
targ.opts.weights.addWeight(1, 0, 100);
targ.opts.weights.addWeight(2, 0, 100);

targ.opts.forEach[0].weights = new dusk.sgui.TileMapWeights(2, 10);
targ.opts.forEach[0].weights.addWeight(1, 0, 100);

dusk.startGame();
quest.go();
