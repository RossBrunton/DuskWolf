//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** This is just a generic piece of text. Amusing.
 * 
 * <p><img src='Label.png'/></p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;text&gt;(text)&lt;/text&gt;</code> --
 * The text that the label displays, supports basic HTML.</p>
 */
sgui.Label = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
		/** This is the actual image. */
		this._text = "";
		this._width = -1;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		if(!this._events.getVar("sg-def-label-font")) this._events.setVar("sg-def-label-font", "sans");
		if(!this._events.getVar("sg-def-label-size")) this._events.setVar("sg-def-label-size", "12");
		
		this._height = this._events.getVar("sg-def-label-size");
		this._font = this._events.getVar("sg-def-label-font");
		
		this._registerStuff(this._labelStuff);
		this._registerDrawHandler(this._labelDraw);
	}
};
sgui.Label.prototype = new sgui.Component();
sgui.Label.constructor = sgui.Label;


/** @inheritDoc */
sgui.Label.prototype.className = "Label";


/** Generic image stuff!
 */
sgui.Label.prototype._labelStuff = function(data) {
	//Set image
	this.setText(this._prop("text", data, this._text, true, 1));
	
	this._font = this._prop("font", data, this._font, true, 1);
	
	this.setHeight(this._prop("size", data, this.getHeight(), true, 1));
};

sgui.Label.prototype._labelDraw = function(c) {
	if(this._text){
		c.font = this.getHeight()+"px "+this._font;
		c.fillText(this._text, 0, 0, this.getWidth()?this.getWidth():undefined);
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
sgui.Label.prototype.setText = function(txt) {
	this._text = txt;
};

sgui.Label.prototype.getWidth = function(value) {
	if(this._width != -1) return this._width;
	
	var state = this._c.save();
	this._c.font = this.getHeight()+"px "+this._font;
	return this._c.measureText(this._text).width;
	this._c.restore(state);
}
