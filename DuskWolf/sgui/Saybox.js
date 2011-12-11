//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Group");
loadComponent("VMenu");

/***/
sgui.Saybox = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);
		
		this._registerStuff(this._sayBoxStuff);
		this._registerFrameHandler(this._sayBoxFrame);
		this._registerActionHandler("SayBox", this._sayBoxAction, this);
		
		this._width = this._events.getVar("sys-sg-width");
		this._height = 200;
		
		this._text = "";
		this._speaker = "";
		
		this._lines = [];
		this._currentLine = 0;
		this._currentChar = 0;
		this._speaking = false;
		this._waiting = false;
		this._speed = 1;
		this._charCache = 0;
		
		this._build();
	}
};
sgui.Saybox.prototype = new sgui.Group();
sgui.Saybox.constructor = sgui.SayBox;

sgui.Saybox.prototype.className = "Saybox";

sgui.Saybox.prototype._sayBoxStuff = function(data) {
	this._speaker = this._prop("speaker", data, this._speaker);
	this._speed = Number(this._prop("speed", data, this._speed));
	
	if("say" in data){
		this._text = this._prop("say", data, this._text);
		this._speak();
	}
};

sgui.Saybox.prototype._sayBoxFrame = function(e) {
	if(!this._speaking) return;
	this._charCache += this._speed;
	
	while(this._charCache >= 1){
		if(this._lines[this._currentLine].length == this._currentChar) {
			this._currentChar = 0;
			this._currentLine ++;
		}
		
		if(this._lines.length == this._currentLine || !this._lines[this._currentLine].length) {
			this._speaking = false;
			this._waiting = true;
			return;
		}
		
		this.getComponent("bodyTexts").getComponent(String(this._currentLine)).setText(this.getComponent("bodyTexts").getComponent(String(this._currentLine)).getText() + this._lines[this._currentLine][this._currentChar]);
		this._currentChar++;
		this._charCache--;
	}
};

sgui.Saybox.prototype._sayBoxAction = function(data) {
	if(!this._waiting) return;
	
	this._waiting = false;
	this._next();
};

sgui.Saybox.prototype._build = function() {
	this.doStuff({"children":[
		{"name":"body", "type":"Rect", "x":"20", "y":"30", "width":(this.getWidth()-40), "height":(this.getHeight()-50)},
		{"name":"title", "type":"Rect", "x":"30", "y":"0", "width":"200", "height":"30"},
		{"name":"bodyTexts", "x":"25", "y":"35", "type":"VMenu", "spacing":"2", "populate":{"type":"Label", "height":"16", "width":(this.getWidth()-50), "count":"8"}},
		{"name":"titleText", "type":"Label", "x":"35", "y":"5", "width":"190", "height":"20"}
	]});
};

sgui.Saybox.prototype._speak = function() {
	//Clear existing lines
	for(var i = 7; i >= 0; i--) {
		this._lines[i] = "";
		this.getComponent("bodyTexts").getComponent(String(i)).setText("");
	}
	
	//Speaker
	this.doStuff({"children":[
		{"name":"titleText", "text":this._speaker}
	]});
	
	//Break it down into words
	var words = this._text.split(" ");
	var line = 0;
	
	this._lines[0] = words[0];
	for(var w = 1; w < words.length; w++) {
		if(this.getComponent("bodyTexts").getComponent(String(line)).getWidth(this._lines[line]+" "+words[w]) > this.getWidth()-50) {
			if(line == 7){
				duskWolf.warn("Supplied text was larger than box size.");
				break;
			}
			line ++;
			this._lines[line] = words[w];
		}else{
			this._lines[line] += " "+words[w];
		}
	}
	
	this._currentLine = 0;
	this._currentChar = 0;
	this._speaking = true;
	this._awaitNext();
};
