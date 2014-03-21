"use strict";

dusk.load.require("dusk");

dusk.load.require("quest.ents");
dusk.load.require("quest.rooms.rooma");

dusk.load.provide("quest");


dusk.onLoad.listen(function (e){dusk.quest.rooms.setRoom("quest.rooms.rooma", 0);});

dusk.startGame();

