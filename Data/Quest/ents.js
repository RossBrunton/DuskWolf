"use strict";

dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.BackForth");
dusk.load.require("dusk.behave.GridWalker");
dusk.load.require("dusk.behave.Persist");
dusk.load.require("dusk.behave.MarkTrigger");

dusk.load.provide("quest.ents");

dusk.entities.swidth = 32;
dusk.entities.sheight = 32;
dusk.entities.twidth = 32;
dusk.entities.theight = 32;
dusk.entities.frameDelay = 10;
dusk.entities.seek = "hero";
dusk.entities.seekType = "hero";

dusk.entities.types.createNewType("hero", {
	"behaviours":{
		"Persist":true, "PlayerGridWalker":true, "MarkTrigger":true, "GridWalker":true
	},
	"data":{
		"solid":false,
	}
}, "quest");
