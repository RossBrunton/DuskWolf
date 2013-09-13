//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.TextBox");
dusk.load.require("dusk.sgui.PlusText");
dusk.load.require("dusk.sgui.FocusCheckerRect");
dusk.load.require("dusk.sgui.Checkbox");
dusk.load.require("dusk.sgui.Grid");

dusk.load.require("dusk.entities");
dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.sgui.EntityWorkshop");

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
dusk.sgui.EntityWorkshop = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._workingWith = {"behaviours":{}, "data":{}, "animation":{}, "particles":{}};
	this._workingWithName = "";
	this._loading = false;
	this.width = dusk.sgui.width;
	this.height = dusk.sgui.height;
	
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
			"allowMouse":true,
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
			"allowMouse":true,
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
				{"text":"Behaviours"}, {"text":"Data"}, {"text":"Animation"}
			]
		},
		"bodies":{
			"type":"Group",
			"upFlow":"sections",
			"allowMouse":true,
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
	
	//Lets make buttons do things!
	this.path("sections/0,0").action.listen(function(e) {this.path("bodies").flow("behaviours");}, this);
	this.path("sections/1,0").action.listen(function(e) {this.path("bodies").flow("data");}, this);
	this.path("sections/2,0").action.listen(function(e) {this.path("bodies").flow("animation");}, this);
	
	this.path("top/savebutton").action.listen(function(e) {this.saveEntity();}, this);
	this.path("top/loadbutton").action.listen(function(e) {
		console.log("Loading "+this.path("top/name").text);
		this.loadEntity(this.path("top/name").text);
	}, this);
	
	//Build the list of behaviours
	var l = [];
	for(var p in dusk.behave) {
		if("workshopData" in dusk.behave[p]) {
			l.push({"text":p});
		}
	}
	
	while(l.length % this.path("bodies/behaviours/list").cols) l.push({"text":"---"});
	
	this.path("bodies/behaviours/list").rows = Math.ceil(l.length/this.path("bodies/behaviours/list").cols);
	this.path("bodies/behaviours/list").populate(l);
	this.path("bodies/behaviours/list").forEach(function(c) {
		c.path("plus").onCheck.listen(this._behaviourChecked, this);
	}, this);
	
	this._updateData();
	
	//Prop masks
	
	//Listeners
	this.frame.listen(this._ewFrame, this);
	this.keyPress.listen(this._ewKey, this);
	this.prepareDraw.listen(this._ewDraw, this);
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) {
			dusk.sgui.setActivePane("plat");
			this.visible = false;
		}
	}, this, {"key":27});
};
dusk.sgui.EntityWorkshop.prototype = Object.create(dusk.sgui.Group.prototype);

dusk.sgui.EntityWorkshop.coreWorkshopData = [
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

dusk.sgui.EntityWorkshop.prototype._ewFrame = function(e) {
	if(this.path("bodies/behaviours/list").getFocused().text in dusk.behave) {
		this.path("bodies/behaviours/help").text = 
			dusk.behave[this.path("bodies/behaviours/list").getFocused().text].workshopData.help;
	}else{
		this.path("bodies/behaviours/help").text = "---";
	}
	
	if(this.path("bodies/data/list").getFocused()) {
		var frags = this._deFormatData(this.path("bodies/data/list").getFocused().text);
		if(frags[1] == "Core") {
			for(var i = dusk.sgui.EntityWorkshop.coreWorkshopData.length-1; i >= 0; i --) {
				if(dusk.sgui.EntityWorkshop.coreWorkshopData[i][0] == frags[2]) {
					this.path("bodies/data/help").text = 
						"[[]"+dusk.sgui.EntityWorkshop.coreWorkshopData[i][1]+"] "
						+ dusk.sgui.EntityWorkshop.coreWorkshopData[i][2]+
						" {"+dusk.sgui.EntityWorkshop.coreWorkshopData[i][3]+"}";
				}
			}
		}else if(frags[1] in dusk.behave) {
			for(var i = dusk.behave[frags[1]].workshopData.data.length-1; i >= 0; i --) {
				if(dusk.behave[frags[1]].workshopData.data[i][0] == frags[2]) {
					this.path("bodies/data/help").text = 
						"[[]"+dusk.behave[frags[1]].workshopData.data[i][1]+"] "
						+ dusk.behave[frags[1]].workshopData.data[i][2]+
						" {"+dusk.behave[frags[1]].workshopData.data[i][3]+"}";
				}
			}
		}else{
			this.path("bodies/data/help").text = "---";
		}
	}
};

dusk.sgui.EntityWorkshop.prototype._ewDraw = function(e) {
	
};

dusk.sgui.EntityWorkshop.prototype._ewKey = function(e) {
	
	return false;
};

dusk.sgui.EntityWorkshop.prototype._behaviourChecked = function(e) {
	if(e.checked) {
		this._workingWith.behaviours[e.component.path("..").text] = true;
	}else{
		delete this._workingWith.behaviours[e.component.path("..").text];
	}
	
	this._updateData();
};

dusk.sgui.EntityWorkshop.prototype.loadEntity = function(name) {
	this._loading = true;
	if(!dusk.entities.types.isValidType(name)) {
		this.loadEntity("root");
		return;
	}
	
	this._workingWith = dusk.utils.clone(dusk.entities.types.getRaw(name));
	
	this.path("top/name").text = name;
	this.path("top/extends").text = dusk.entities.types.getExtendee(name);
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

dusk.sgui.EntityWorkshop.prototype.saveEntity = function() {
	var ent = dusk.utils.clone(this._workingWith);
	
	ent.data = {};
	
	this.path("bodies/data/list").forEach(function(c) {
		if(!c.getComponent("plus").text) return;
		
		var frags = this._deFormatData(c.text);
		
		var ewd;
		if(frags[1] == "Core") {
			ewd = dusk.sgui.EntityWorkshop.coreWorkshopData;
		}else{
			ewd = dusk.behave[frags[1]].workshopData.data;
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
				toSet = dusk.utils.jsonParse(toSet);
				break;
		}
		
		ent.data[ewd[0]] = toSet;
	}, this);
	
	console.log(ent);
	
	dusk.entities.types.setRaw(this.path("top/name").text, ent, this.path("top/extends").text);
};

dusk.sgui.EntityWorkshop.prototype._updateData = function() {
	if(!("data" in this._workingWith)) this._workingWith.data = {};
	var l = [];
	
	for(var i = 0; i < dusk.sgui.EntityWorkshop.coreWorkshopData.length; i ++) {
		var n = dusk.sgui.EntityWorkshop.coreWorkshopData[i][0];
		var t = dusk.sgui.EntityWorkshop.coreWorkshopData[i][1].charAt(0);
		if(n in this._workingWith.data) {
			l.push({"text":t+" Core: "+n, "plus":{"text":""+this._workingWith.data[n]}});
		}else{
			l.push({"text":t+" Core: "+n});
		}
	}
	
	for(var p in dusk.behave) {
		if("workshopData" in dusk.behave[p] && p in this._workingWith.behaviours) {
			for(var i = 0; i < dusk.behave[p].workshopData.data.length; i ++) {
				var n = dusk.behave[p].workshopData.data[i][0];
				var t = dusk.behave[p].workshopData.data[i][1].charAt(0);
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

dusk.sgui.EntityWorkshop.prototype._deFormatData = function(str) {
	var frags = str.split(": ");
	return [frags[0].charAt(0), frags[0].substr(2), frags[1]];
}

Object.seal(dusk.sgui.EntityWorkshop);
Object.seal(dusk.sgui.EntityWorkshop.prototype);

dusk.sgui.registerType("EntityWorkshop", dusk.sgui.EntityWorkshop);
