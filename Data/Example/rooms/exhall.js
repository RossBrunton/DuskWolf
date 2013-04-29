"use strict";

dusk.load.require("dusk.rooms");
dusk.load.require("dusk.entities");
dusk.load.provide("example.plat.rooms.exhall");

example.plat.rooms.exhall = [
    {
        "rows": 15,
        "cols": 24,
        "ani":[["1,0", "2,0", "3,0", "2,0"]],
        "src": "pimg/techB.png",
        "map": "BC16:0x:d002010000009b800100cc80"
    },
    {
        "rows": 15,
        "cols": 24,
        "src": "pimg/schematics.png",
        "map": "BC16:0x:d0020200000001001d800e81098001000e80010004800481108005810401040112800101010101000100040104011280010101010581078000010880088103800a810380088106800481068008811080058103010301128002010201010001000301030107800481078002010201058103800a810380048103800581088005811b80"
    },
    [
        {
            "name": "#0",
            "type": "fall",
            "x": 128,
            "y": 224
        },
        {
            "name": "#1",
            "type": "fall",
            "x": 160,
            "y": 224
        },
        {
            "name": "#2",
            "type": "fall",
            "x": 192,
            "y": 224
        },
        {
            "name": "#3",
            "type": "fall",
            "x": 608,
            "y": 224
        },
        {
            "name": "#4",
            "type": "fall",
            "x": 544,
            "y": 224
        },
        {
            "name": "#5",
            "type": "fall",
            "x": 576,
            "y": 224
        }
    ],
    {
        "rows": 15,
        "cols": 24,
        "src": "pimg/techO.png",
        "map": "BC16:0x:d002030001000000020035800e810980108105800382108103820100010003821081038205801081088003810a80000000000001088006810480068108800681048206810580038206810482068103820100010003820681048006810382058003820a8003823480"
    }
];

dusk.rooms.createRoom("exhall", example.plat.rooms.exhall);

//Navigation
dusk.entities.markTrigger.listen(function e_exhallTrigger1(e) {
	dusk.rooms.setRoom("rooma", 0);
}, this, {"room":"exhall", "up":false, "mark":1});

dusk.entities.markTrigger.listen(function e_exhallTrigger2(e) {
	dusk.rooms.setRoom("roomb", 0);
}, this, {"room":"exhall", "up":false, "mark":2});

dusk.entities.markTrigger.listen(function e_exhallTrigger3(e) {
	dusk.rooms.setRoom("roomc", 0);
}, this, {"room":"exhall", "up":false, "mark":3});

dusk.entities.markTrigger.listen(function e_exhallTrigger4(e) {
	dusk.rooms.setRoom("roomd", 0);
}, this, {"room":"exhall", "up":false, "mark":4});
