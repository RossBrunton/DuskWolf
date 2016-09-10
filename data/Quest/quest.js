"use strict";

load.provide("quest", function() {
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var RegionDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	
	var dusk = load.require("dusk");
	var items = load.require("dusk.items");
	var SaveSpec = load.require("dusk.save.SaveSpec");
	var ConsoleSource = load.require("dusk.save.sources.ConsoleSource");
	var TurnTicker = load.require("dusk.TurnTicker");
	var c = load.require("dusk.sgui.c");
	var dquest = load.require("dusk.rooms.quest");
	var sgui = load.require("dusk.sgui");
	var menu = load.require("dusk.script.actors.menu");
	var Runner = load.require("dusk.script.Runner");
	var Actions = load.require("dusk.script.Actions");
	var EntityActions = load.require("dusk.entities.actors.Standard");
	
	var Region = load.require("dusk.tiles.Region");
	var uniformModifier = load.require("dusk.tiles.UniformModifier");
	var terrainModifier = load.require("dusk.tiles.TerrainModifier");
	var lrTerrainModifier = load.require("dusk.tiles.lrTerrainModifier");
	var entityModifier = load.require("dusk.tiles.EntityModifier");
	var entityValidator = load.require("dusk.tiles.EntityValidator");
	var Weights = load.require("dusk.tiles.Weights");
	
	var ents = load.require("quest.entities");
	var ui = load.require("quest.ui");
	
	var quest = {};
	
	// Add load handler
	dusk.onLoad.listen(function (e){
		dquest.rooms.setRoom("quest.rooms.rooma", 0).then((function(e) {
			_turns.register("ally", quest.allyTurn);
			_turns.register("enemy", quest.enemyTurn);
			_turns.start();
		}).bind(this));
	});
	
	
	// Set up quest
	var layers = [
		{"name":"back","type":1},
		{"name":"scheme","type":2},
		{"name":"parts","type":8},
		{"name":"over","type":1},
		{"name":"regions","type":32},
		{"name":"entities","type":4,"primary":true}
	];
	
	window.qo = dquest.make(ui, "quest", layers, 32, 32);
	
	// Move the layered room behind other components
	qo.layeredRoom.alterLayer("-");
	
	var menuCom = ui.path("menu/menu");
	var feed = ui.get("actionFeed").get("feed");
	
	
	// Weights for region generation
	var weights = new Weights(9, 2);
	weights.addSimpleWeight(0, 0, 1, 0);
	weights.addSimpleWeight(1, 0, 100, 0);
	weights.addSimpleWeight(2, 0, 100, 0);
	weights.addSimpleWeight(3, 0, 2, 0);
	
	
	// Modifiers and validors for regions
	var lrtm = lrTerrainModifier(weights, qo.layeredRoom);
	
	// LayeredRoomEntityModifiers
	var lrem = entityModifier(qo.layeredRoom, [], function(v, e, opt, dir) {
			if(e.stats && e.stats.get("faction") == "ENEMY") {
				return 100;
			}
			return v;
		}
	);
	var flrem = entityModifier(qo.layeredRoom, [], function(v, e, opt, dir) {
			if(e.stats && e.stats.get("faction") == "ENEMY"
			&& (!visibilityRegion || visibilityRegion.has(e.tileX(), e.tileY(), 1))) {
				return 100;
			}
			return v;
		}
	);
	
	var ev = function(exclude) {
		return entityValidator(qo.layeredRoom, [], function(e){
			return e == exclude || e.entType == "stdSelector";
		});
	};
	var fev = function(exclude) {
		return entityValidator(qo.layeredRoom, [], function(e){
			return e == exclude || e.entType == "stdSelector"
			|| (visibilityRegion && !visibilityRegion.has(e.tileX(), e.tileY(), 1));
		});
	};
	
	var ea = new EntityActions(qo.layeredRoom.getPrimaryEntityLayer());
	
	// Built in region generator functions
	window.aarg =
		{"name":"attack", "weightModifiers":[uniformModifier()]};
	
	// FOW vision update function
	var visibilityRegion = null;
	var updateVision = function(x) {
		return x; // Comment for crappy FOW
		
		var rd = qo.layeredRoom.getFirstLayerOfType(LayeredRoom.LAYER_REGION);
		visibilityRegion = new Region(rd.rows, rd.cols, 1);
		var eg = qo.layeredRoom.getPrimaryEntityLayer();
		
		// Make all enemies invisible
		var invfilterfn = function(e) {return e.stats && e.stats.get("faction") == "ENEMY";}
		eg.filter(invfilterfn).forEach(function(e) {e.visible = false;});
		
		var filterfn = function(e) {return e.stats && e.stats.get("faction") == "ALLY";}
		
		for(var e of eg.filter(filterfn)) {
			visibilityRegion.expand({
				z: 0,
				x: e.tileX(),
				y: e.tileY(),
				ranges: [0, e.stats.get("vis")],
				weightModifiers: [uniformModifier(1)]
			});
		}
		eg.allInRegion(visibilityRegion).forEach(function(e) {e.visible = true;});
		x.visionRegion = visibilityRegion;
		
		rd.unDisplay("vis");
		rd.display("vis", RegionDisplay.MODE_REGION, "#333333", {"invert":true, "margin":0, "alpha":1}, visibilityRegion);
		
		return x;
	};
	
	
	// Turn ticker
	var _turns = new TurnTicker();
	
	
	// Turn handling functions
	var turnEnded = false;
	var turnOpen = function(x) {
		if(turnEnded) return false;
		return true;
	}
	
	
	// Do this on the player's turn
	quest.allyTurn = function(x) {
		turnEnded = false;
		feed.append({"text":"Player Phase", "colour":"#000099"});
		
		return new Runner([
			Actions.while(turnOpen, [
				// Keep looking until the player ends their turn
				
				updateVision,
				
				qo.selectActor.pickEntity(function(e) {
					return e.stats.get("faction") == "ALLY" && !e.stats.get("moved");
				}, {}, {"allowNone":true}),
				
				Actions.if(function(x) {return x.entity}, [
					// If an entity was selected
					Actions.copy("entity", "selected"),
					
					function(passedArg) {
						// Generate the settings for the region to generate
						var ranges = passedArg.entity.stats.get("possibleRange", 2);
						var rmap = [];
						
						for(var i = 0; i < ranges.length; i ++) {
							for(var a = ranges[i][0]; a <= ranges[i][1]; a ++) {
								rmap[a] = true;
							}
						}
						
						//aarg.rangeMap = rmap;
						aarg.ranges = ranges;
						passedArg.aarg = aarg;
						passedArg.children = {"attack":aarg};
						passedArg.ranges = [0, passedArg.entity.stats.get("move", 1)];
						passedArg.validators = [ev(passedArg.entity)];
						passedArg.fogValidators = [fev(passedArg.entity)];
						
						return passedArg;
					},
					
					// And then actually generate the region
					qo.regionsActor.generate({"z":0, "weightModifiers":[lrem, lrtm], "children":{"attack":aarg}},
					{"copy":[
						["ranges", "ranges"], ["x", "x"], ["y", "y"],
						["validators", "validators"]
					], "dest":"trueRegion"}),
					
					// And then actually generate the region
					qo.regionsActor.generate({"z":0, "weightModifiers":[flrem, lrtm], "children":{"attack":aarg}},
					{"copy":[
						["ranges", "ranges"], ["x", "x"], ["y", "y"],
						["fogValidators", "validators"]
					]}),
					
					
					// Display the regions
					qo.regionsActor.display("atk", "#990000", {"sub":"attack", "alpha":0.5, "overlaps":["vis"]}),
					qo.regionsActor.display("mov", "#000099", {"alpha":0.5, "overlaps":["vis"]}),
					
					// Create a new path for storing the steps taken
					qo.regionsActor.makePath("", {}),
					qo.regionsActor.displayPath("movePath", "default/arrows32.png tiles:32x32", {}),
					
					// And then get the path to the pile the player chooses
					qo.selectActor.pickTile({}, {}),
					
					// Hide all these regions
					qo.regionsActor.unDisplay(["atk", "mov", "movePath"], {}),
					
					// FOW collision logic!
					function(x) {
						var truePath = x.trueRegion.followPath(x.path);
						x.collision = x.path.length() != truePath.length();
						
						x.path = truePath;
						x.x = truePath.end[0];
						x.y = truePath.end[1];
						return x;
					},
					
					// Move the entity to it's destination
					ea.followPath("", {}),
					
					// Collision? To bad, turn over
					Actions.if(function(x) {return !x.collision;}, [
						// Display the attack range for the tile the entity is on only
						qo.regionsActor.getSubRegion("attack", {}),
						qo.regionsActor.display("myattack", "#990000", {"alpha":0.5, "overlaps":["vis"]}),
						
						// And calculate a list of all entities in the region
						qo.selectActor.entitiesInRegion({}),
						
						Actions.print("Value is %"),
						
						function(x) {
							// Here, build a menu
							x.menuChoices = [];
							
							if(x.entities.length) {
								// If there are entities, create an attack option in the menu
								x.menuChoices.push([{"text":"Attack!"}, [
									// If selected
									
									// Select an entity in this region that is an enemy
									qo.selectActor.pickEntityInRegion(function(e) {
										return e.stats.get("faction") == "ENEMY";
									}, {}, {}),
									
									// And then terminate it
									function(x) {
										feed.append({"text":"You killed them!"});
										x.entity.terminate();
										
										return x;
									}
								]]);
							}
							
							// And an items option
							x.menuChoices.push([{"text":"Items"}, [
								function(x) {
									// Create another menu displaying items and their icons
									x.menuChoices = [];
									
									var i = x.entity.stats.layer(2).getBlock("weapons");
									i.forEach(function(item, slot) {
										x.menuChoices.push([{"text":item.get("displayName")}, []]);
									});
									
									// And also a cancel option
									x.menuChoices.push([{"text":"Cancel"}, false]);
									
									return x;
								},
								
								menu.gridMenu([], menuCom, {"copyChoices":true}),
							]]);
							
							// Tell the entity to wait
							x.menuChoices.push([{"text":"Wait"}, []]);
							
							// And cancel
							x.menuChoices.push([{"text":"Cancel"}, false]);
							
							return x;
						},
						
						// And actually display the menu
						menu.gridMenu([], menuCom, {"copyChoices":true}),
						
						// Hide the region displayed
						qo.regionsActor.unDisplay(["myattack"], {}),
					], [
						function(x) {
							feed.append({"text":"NO!"});
							return x;
						}
					]),
					
					// And set the "moved" stat on this entity to true
					function(pa) {
						pa.selected.stats.layer(3).addBlock("moved", {"moved":true});
						
						return pa;
					},
				], [
					// If the player doesn't select an entity at all
					
					// Create a simple menu that ends the turn or cancels
					menu.gridMenu([
						[{"text":"Done"}, [
							function(x) {turnEnded = true; return x}
						]], [{"text":"Cancel"}, false]
					], menuCom, {}),
				]),
				
				//Actions.print("End of while"),
			]),
			
			// And just before we end the turn, remove all the "moved" blocks from entities
			function(x) {
				var ents = qo.layeredRoom.getPrimaryEntityLayer().filter(
					function(e) {return e.stats && e.stats.get("moved")}
				);
				
				for(var e of ents) {
					e.stats.layer(3).removeBlock("moved");
				}
				
				return x;
			}
		]).start({});
	};
	
	
	// And this on the enemies turn
	// It just waits half a second and then ends.
	quest.enemyTurn = function() {
		feed.append({"text":"Enemy Phase", "colour":"#990000"});
		return new Promise(function(fulfill) {
			setTimeout(fulfill, 500);
		});
	};
	
	// Now start the game
	dusk.startGame();
	
	window.ss = new SaveSpec("ss", "ss");
	ss.add("dusk.stats.LayeredStats", "stats", {});
	
	return quest;
});
