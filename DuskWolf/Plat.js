//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui");
dusk.load.require("dusk.sgui.BasicMain");
dusk.load.require("dusk.sgui.CentreScroller");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.entities");
dusk.load.require("dusk.rooms");
dusk.load.require("dusk.skills");

dusk.load.provide("dusk.plat");

/** @namespace dusk.plat
 * @name dusk.plat
 * 
 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
 * 
 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.plat._init = function() {
	//Default skills
	dusk.skills.giveSkill("jump");
	dusk.skills.giveSkill("dubjump");
	//dusk.skills.giveSkill("infinijump");
	
	var main = dusk.sgui.getPane("plat-main");
	main.modifyComponent({"name":"mainContainer", "focus":"main", "type":"CentreScroller", "width":-1, "height":-1, "child":{"name":"main", "type":"BasicMain"}});
	main.becomeActive();
	main.flow("mainContainer");
	
	dusk.entities.types.createNewType("plat", {
		"data":{"hp":1, "gravity":1, "terminal":9, "haccel":2, "hspeed":7, "jump":15, "slowdown":1, "img":"pimg/hero.png", "solid":true, "anchor":false},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	});
};

/** Requests that the `{@link dusk.sgui.BasicMain}` used by the plat system be the main room manager used to load rooms.
 */
dusk.plat.becomeRoomManager = function() {
	dusk.rooms.roomManager = dusk.sgui.path("plat-main:/mainContainer/main");
};

dusk.plat._init();

Object.seal(dusk.plat);
