//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.EntityWorkshop", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var editor = load.require("dusk.editor");
	var controls = load.require("dusk.input.controls");
	
	load.require("dusk.sgui.Tile");
	load.require("dusk.sgui.Label");
	load.require("dusk.sgui.TextBox");
	load.require("dusk.sgui.PlusText");
	load.require("dusk.sgui.FocusCheckerRect");
	load.require("dusk.sgui.Checkbox");
	load.require("dusk.sgui.Grid");
	
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");

	/** Creates a new EntityWorkshop component.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * 
	 * @class dusk.sgui.EntityWorkshop
	 * 
	 * @classdesc 
	 * 
	 * @extends dusk.sgui.Group
	 * @constructor
	 */
	var EntityWorkshop = function (parent, comName) {
		Group.call(this, parent, comName);
		
		this._workingWith = {"behaviours":{}, "data":{}, "animation":{}, "particles":{}};
		this._workingWithName = "";
		this._loading = false;
		this.width = sgui.width;
		this.height = sgui.height;
		this.ensureMouse();
		this.mouse.childrenAllow = true;
		
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
							"title":{
								"type":"Label",
								"text":"Behaviours",
							},
							"help":{
								"type":"Label",
								"text":"Help",
								"x":100
							},
							"list":{
								"type":"Grid",
								"y":30,
								"cols":4,
								"hspacing":5,
								"vspacing":10,
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
							"title":{
								"type":"Label",
								"text":"Data",
							},
							"help":{
								"type":"Label",
								"text":"Help",
								"x":100
							},
							"list":{
								"type":"Grid",
								"y":30,
								"cols":2,
								"hspacing":5,
								"vspacing":10,
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
								"text":"Animation",
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
		var behaviours = entities.getAllBehaviours();
		var l = []
		for(var p in behaviours) {
			if("workshopData" in behaviours[p]) {
				l.push({"text":p});
			}
		}
		
		while(l.length % this.path("bodies/behaviours/list").cols) l.push({"text":"---"});
		
		this.path("bodies/behaviours/list").rows = Math.ceil(l.length/this.path("bodies/behaviours/list").cols);
		this.path("bodies/behaviours/list").populate(l);
		this.path("bodies/behaviours/list").forEach(function(c) {
			c.path("plus").onCheck.listen(this._behaviourChecked.bind(this));
		}, this);
		
		this._updateData();
		
		//Prop masks
		
		//Listeners
		this.frame.listen((this._ewFrame).bind(this));
		this.onControl.listen((function(e) {
			if(editor.active) {
				sgui.setActivePane("plat");
				this.visible = false;
			}
		}).bind(this), controls.addControl("workshop_close", "ESC"));
	};
	EntityWorkshop.prototype = Object.create(Group.prototype);
	
	EntityWorkshop.coreWorkshopData = [
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
	];
	
	EntityWorkshop.prototype._ewFrame = function(e) {
		if(this.path("bodies/behaviours/list").getFocused()
		&& entities.getBehaviour(this.path("bodies/behaviours/list").getFocused().text)) {
			this.path("bodies/behaviours/help").text = 
				entities.getBehaviour(this.path("bodies/behaviours/list").getFocused().text).workshopData.help;
		}else{
			this.path("bodies/behaviours/help").text = "---";
		}
		
		if(this.path("bodies/data/list").getFocused()) {
			var frags = this._deFormatData(this.path("bodies/data/list").getFocused().text);
			if(frags[1] == "Core") {
				for(var i = EntityWorkshop.coreWorkshopData.length-1; i >= 0; i --) {
					if(EntityWorkshop.coreWorkshopData[i][0] == frags[2]) {
						this.path("bodies/data/help").text = 
							"[[]"+EntityWorkshop.coreWorkshopData[i][1]+"] "
							+ EntityWorkshop.coreWorkshopData[i][2]+
							" {"+EntityWorkshop.coreWorkshopData[i][3]+"}";
					}
				}
			}else if(entities.getBehaviour(frags[1])) {
				var b = entities.getBehaviour(frags[1]);
				
				for(var i = b.workshopData.data.length-1; i >= 0; i --) {
					if(b.workshopData.data[i][0] == frags[2]) {
						this.path("bodies/data/help").text = 
							"[[]"+b.workshopData.data[i][1]+"] "
							+ b.workshopData.data[i][2]+
							" {"+b.workshopData.data[i][3]+"}";
					}
				}
			}else{
				this.path("bodies/data/help").text = "---";
			}
		}
	};
	
	EntityWorkshop.prototype._behaviourChecked = function(e) {
		if(e.component.path("..").text == "---") return;
		if(e.checked) {
			this._workingWith.behaviours[e.component.path("..").text] = true;
		}else{
			delete this._workingWith.behaviours[e.component.path("..").text];
		}
		
		this._updateData();
	};
	
	EntityWorkshop.prototype.loadEntity = function(name) {
		this._loading = true;
		if(!entities.types.isValidType(name)) {
			this.loadEntity("root");
			return;
		}
		
		this._workingWith = utils.clone(entities.types.getRaw(name));
		
		this.path("top/name").text = name;
		this.path("top/extends").text = entities.types.getExtendee(name);
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
	};
	
	EntityWorkshop.prototype.saveEntity = function() {
		var ent = utils.clone(this._workingWith);
		
		ent.data = {};
		
		this.path("bodies/data/list").forEach(function(c) {
			if(!c.getComponent("plus").text) return;
			
			var frags = this._deFormatData(c.text);
			
			var ewd;
			if(frags[1] == "Core") {
				ewd = EntityWorkshop.coreWorkshopData;
			}else{
				ewd = entities.getBehaviour(frags[1]).workshopData.data;
			}
			
			for(var i = ewd.length-1; i >= 0; i --) {
				if(ewd[i][0] == frags[2]) {
					ewd = ewd[i];
					break;
				}
			}
			
			var toSet = c.getComponent("plus").text;
			
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
		
		console.log(JSON.stringify(ent));
		
		entities.types.setRaw(this.path("top/name").text, ent, this.path("top/extends").text);
	};
	
	EntityWorkshop.prototype._updateData = function() {
		if(!("data" in this._workingWith)) this._workingWith.data = {};
		var l = [];
		
		for(var i = 0; i < EntityWorkshop.coreWorkshopData.length; i ++) {
			var n = EntityWorkshop.coreWorkshopData[i][0];
			var t = EntityWorkshop.coreWorkshopData[i][1].charAt(0);
			if(n in this._workingWith.data) {
				l.push({"text":t+" Core: "+n, "plus":{"text":""+this._workingWith.data[n]}});
			}else{
				l.push({"text":t+" Core: "+n});
			}
		}
		
		var behaviours = entities.getAllBehaviours();
		for(var p in behaviours) {
			if("workshopData" in behaviours[p] && p in this._workingWith.behaviours) {
				for(var i = 0; i < behaviours[p].workshopData.data.length; i ++) {
					var n = behaviours[p].workshopData.data[i][0];
					var t = behaviours[p].workshopData.data[i][1].charAt(0);
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
		while(l.length % this.path("bodies/data/list").cols) l.push({"text":"---"});
		this.path("bodies/data/list").populate(l);
	};
	
	EntityWorkshop.prototype._deFormatData = function(str) {
		var frags = str.split(": ");
		return [frags[0].charAt(0), frags[0].substr(2), frags[1]];
	}
	
	Object.seal(EntityWorkshop);
	Object.seal(EntityWorkshop.prototype);
	
	sgui.registerType("EntityWorkshop", EntityWorkshop);
	
	return EntityWorkshop;
})());
