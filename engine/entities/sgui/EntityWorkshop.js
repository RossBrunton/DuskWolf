//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.entities.sgui.EntityWorkshop", function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var editor = load.require("dusk.rooms.editor");
	var controls = load.require("dusk.input.controls");
	
	load.require("dusk.tiles.sgui.Tile");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.TextBox");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusCheckerRect");
	load.require("dusk.sgui.Checkbox");
	load.require("dusk.sgui.Grid");
	
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.entities.behave.Behave");

	/** 
	 * 
	 * @extends dusk.sgui.Group
	 * @memberof dusk.entities.sgui
	 */
	class EntityWorkshop extends Group {
		constructor(parent, name) {
			super(parent, name);
			
			this._workingWith = {"behaviours":{}, "data":{}, "animation":{}, "particles":{}};
			this._workingWithName = "";
			this._loading = false;
			this.width = sgui.width;
			this.height = sgui.height;
			//this.mouse.childrenAllow = true;
			
			//Set up UI
			this.modifyComponent({
				"back":{
					"type":"Rect",
					"colour":"#ffffff",
					"alpha":0.75,
					"width":this.width,
					"height":this.height,
				},
				"top":{
					"type":"Group",
					"focus":"name",
					"downFlow":"sections",
					"children":{
						"header":{
							"type":"Label",
							"text":"Entity Workshop",
							"x":20,
							"y":20,
						},
						"name":{
							"type":"TextBox",
							"x":150,
							"y":20,
							"width":130,
							"text":"",
							"rightFlow":"saveButton",
						},
						"saveButton":{
							"type":"PlusText",
							"text":"Save",
							"plusType":"FocusCheckerRect",
							"behind":true,
							"plus":{
								"width":70,
								"height":20,
							},
							"width":70,
							"height":20,
							"x":300,
							"y":20,
							"leftFlow":"name",
							"rightFlow":"loadButton",
						},
						"loadButton":{
							"type":"PlusText",
							"text":"Load",
							"plusType":"FocusCheckerRect",
							"behind":true,
							"plus":{
								"width":70,
								"height":20,
							},
							"width":70,
							"height":20,
							"x":380,
							"y":20,
							"leftFlow":"saveButton",
							"rightFlow":"extends",
						},
						"extendsText":{
							"type":"Label",
							"x":460,
							"y":20,
							"text":"Extends"
						},
						"extends":{
							"type":"TextBox",
							"x":530,
							"y":20,
							"width":130,
							"text":"",
							"leftFlow":"loadButton",
						},
					},
				},
				"sections":{
					"type":"Grid",
					"upFlow":"top",
					"downFlow":"bodies",
					"rows":1,
					"cols":3,
					"hspacing":20,
					"x":20,
					"y":50,
					"globals":{
						"type":"PlusText",
						"plusType":"FocusCheckerRect",
						"behind":true,
						"plus":{
							"width":100,
							"height":20,
						},
						"width":100,
						"height":20,
					},
					"populate":[
						{"text":"Behaviours", "actionFocus":["../../bodies/behaviours"]},
						{"text":"Data", "actionFocus":["../../bodies/data"]},
						{"text":"Animation", "actionFocus":["../../bodies/animation"]}
					]
				},
				"bodies":{
					"type":"Group",
					"upFlow":"sections",
					"x":10,
					"y":80,
					"focus":"behaviours",
					"focusVisible":true,
					"children":{
						"behaviours":{
							"type":"Group",
							"focus":"list",
							"children":{
								"help":{
									"type":"Label",
									"text":"---",
								},
								"list":{
									"type":"Grid",
									"y":30,
									"cols":4,
									"hspacing":5,
									"vspacing":10,
									"multiple":false,
									"globals":{
										"type":"PlusText",
										"plusType":"Checkbox",
										"width":170,
										"onLeft":true
									}
								},
							}
						},
						"data":{
							"type":"Group",
							"focus":"list",
							"children":{
								"help":{
									"type":"Label",
									"text":"---",
									"height":32,
									"width":700,
									"multiline":true
								},
								"list":{
									"type":"Grid",
									"y":40,
									"cols":2,
									"hspacing":5,
									"vspacing":10,
									"multiple":false,
									"globals":{
										"type":"PlusText",
										"plusType":"TextBox",
										"plus":{
											"width":150,
										},
										"width":370
									}
								},
							}
						},
						"animation":{
							"type":"Group",
							"children":{
								"title":{
									"type":"Label",
									"text":"Animation (Not yet built)",
								}
							}
						},
					}
				}
			});
			this.focus = "top";
			
			this.path("top/savebutton").action.listen((function(e) {this.saveEntity();}).bind(this));
			this.path("top/loadbutton").action.listen((function(e) {
				console.log("Loading "+this.path("top/name").text);
				this.loadEntity(this.path("top/name").text);
			}).bind(this));
			
			//Build the list of behaviours
			var workshops = entities.getAllWorkshops();
			var l = []
			for(var p in workshops) {
				if(p !== "Core") {
					l.push({"text":p});
				}
			}
			
			this.path("bodies/behaviours/list").rows = Math.ceil(l.length/this.path("bodies/behaviours/list").cols);
			this.path("bodies/behaviours/list").populate(l);
			this.path("bodies/behaviours/list").forEach(function(c) {
				c.path("plus").onCheck.listen(this._behaviourChecked.bind(this));
			}, this);
			
			this._updateData();
			
			//Prop masks
			
			//Listeners
			this.frame.listen(this._frame.bind(this));
			this.onControl.listen((function(e) {
				if(editor.active) {
					sgui.setActivePane("plat");
					this.visible = false;
				}
			}).bind(this), controls.addControl("workshop_close", "ESC"));
		}
		
		_frame(e) {
			// Behaviour help display
			if(this.path("bodies/behaviours/list").getFocusedChild()
			&& entities.getWorkshop(this.path("bodies/behaviours/list").getFocusedChild().text)) {
				this.path("bodies/behaviours/help").text = 
					entities.getWorkshop(this.path("bodies/behaviours/list").getFocusedChild().text).help;
			}else{
				this.path("bodies/behaviours/help").text = "---";
			}
			
			// Data help display
			if(this.path("bodies/data/list").getFocusedChild()) {
				var frags = this._deFormatData(this.path("bodies/data/list").getFocusedChild().text);
				
				if(entities.getWorkshop(frags[1])) {
					var b = entities.getWorkshop(frags[1]);
					
					for(var i = b.data.length-1; i >= 0; i --) {
						if(b.data[i][0] == frags[2]) {
							this.path("bodies/data/help").text = "[[]"+b.data[i][1]+", " + b.data[i][3] +", " + frags[1]
								+ "] " + b.data[i][2];
						}
					}
				}else{
					this.path("bodies/data/help").text = "---";
				}
			}
		}
		
		_behaviourChecked(e) {
			if(e.component.path("..").text == "---" || e.component.path("..").text == "Core") return;
			if(e.checked) {
				this._workingWith.behaviours[e.component.path("..").text] = true;
			}else{
				delete this._workingWith.behaviours[e.component.path("..").text];
			}
			
			this._updateData();
		}
		
		loadEntity(name) {
			this._loading = true;
			if(!entities.types.isValidType(name)) {
				this.loadEntity("root");
				return;
			}
			
			this._workingWith = utils.copy(entities.types.getRaw(name), true);
			
			this.path("top/name").text = name;
			this.path("top/extends").text = entities.types.getBase(name);
			if(this.path("top/extends").text == "null") this.path("top/extends").text = "";
			
			this.path("bodies/behaviours/list").forEach(function(c) {
				if(c.text in this._workingWith.behaviours && this._workingWith.behaviours[c.text]) {
					c.path("plus").checked = true;
				}else{
					c.path("plus").checked = false;
				}
			}, this);
			
			this._updateData();
			this._loading = false;
		}
		
		saveEntity() {
			var ent = utils.copy(this._workingWith, true);
			
			ent.data = {};
			
			this.path("bodies/data/list").forEach(function(c) {
				if(!c.get("plus").text) return;
				
				var frags = this._deFormatData(c.text);
				
				var ewd;
				ewd = entities.getWorkshop(frags[1]).data;
				
				for(var i = ewd.length-1; i >= 0; i --) {
					if(ewd[i][0] == frags[2]) {
						ewd = ewd[i];
						break;
					}
				}
				
				var toSet = c.get("plus").text;
				
				switch(ewd[1]) {
					case "integer":
						toSet = +toSet;
						break;
					
					case "boolean":
						toSet = toSet === "true" || toSet === "1";
						break;
					
					case "array":
						toSet = toSet.split("::");
						break;
					
					case "object":
						toSet = utils.jsonParse(toSet);
						break;
				}
				
				ent.data[ewd[0]] = toSet;
			}, this);
			
			console.log("Saved Entity type: ");
			console.log(JSON.stringify(ent));
			
			entities.types.createNewType(this.path("top/name").text, ent, this.path("top/extends").text);
		}
		
		_updateData() {
			if(!("data" in this._workingWith)) this._workingWith.data = {};
			var l = [];
			
			var workshops = entities.getAllWorkshops();
			for(var p in workshops) {
				if(p == "Core" || p in this._workingWith.behaviours) {
					for(var i = 0; i < workshops[p].data.length; i ++) {
						var n = workshops[p].data[i][0];
						var t = workshops[p].data[i][1].charAt(0);
						
						if(n in this._workingWith.data) {
							var datStr = this._workingWith.data[n];
							if(Array.isArray(datStr)) datStr = datStr.join("::");
							if(typeof datStr == "object") datStr = JSON.stringify(datStr);
							l.push({"text":t+" "+p+": "+n, "plus":{"text":""+datStr}});
						}else{
							l.push({"text":t+" "+p+": "+n});
						}
					}
				}
			}
			
			this.path("bodies/data/list").rows = Math.ceil(l.length/this.path("bodies/data/list").cols);
			this.path("bodies/data/list").populate(l);
		}
		
		_deFormatData(str) {
			var frags = str.split(": ");
			return [frags[0].charAt(0), frags[0].substr(2), frags[1]];
		}
	}
	
	EntityWorkshop.coreWorkshopData = {"help":"Built in entity properties", "data":[
		["img", "string", "Path to this entities source image.", "no default"],
		["collisionWidth", "integer", "Width of this entity's collision rectange.", "height"],
		["collisionHeight", "integer", "Height of this entity's collision rectangle.", "width"],
		["collisionOffsetX", "integer", "X value to start collision rectangle.", "0"],
		["collisionOffsetY", "integer", "Y value to start collision rectangle.", "0"],
		["solid", "boolean", "Whether other entities can collide into this.", "true"],
		["collides", "boolean", "Whether this can collide into other entities.", "true"],
		["controlsOn", "array", "An :: seperated array of all the controls that are always on.", "[]"],
		["headingLeft", "boolean", "If true, then the entity heads left by default.", "false"],
		["headingUp", "boolean", "If true, then the entity heads up by default.", "false"],
	]};
	
	entities.registerWorkshop("Core", EntityWorkshop.coreWorkshopData);
	
	sgui.registerType("EntityWorkshop", EntityWorkshop);
	
	return EntityWorkshop;
});
