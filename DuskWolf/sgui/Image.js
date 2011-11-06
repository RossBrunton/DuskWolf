//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** This is a single image, the image just sits on the screen and does nothing of any relevance.
 * 
 * <p><img src='Image.png'/></p>
 * 
 * <p>Only one image can be displayed at a time, if you try to set another, it'll replace the existing one.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;image&gt;(image)&lt;/image&gt;</code> --
 * The image to display, it must be the name of a constant in <code>Data</code>.</p>
 * 
 * @see Data
 */
sgui.Image = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		this._registerStuff(this._imageStuff);
		this._registerDrawHandler(this._imageDraw);
	}
};
sgui.Image.prototype = new sgui.Component();
sgui.Image.constructor = sgui.Image;


/** @inheritDoc */
sgui.Image.prototype.className = "Image";


/** Generic image stuff!
 */
sgui.Image.prototype._imageStuff = function(data) {
	//Set image
	if(this._prop("src", data, null, true)){
		this.setImage(this._prop("src", data, null, true, 2));
	}
};

sgui.Image.prototype._imageDraw = function(c) {
	if(this._img){
		if(this._width && this._height){
			/*if(navigator.userAgent.indexOf(" Chrome/") != -1 || navigator.userAgent.indexOf(" MSIE ") != -1){
				//From http://stackoverflow.com/questions/4875850/how-to-create-a-pixelized-svg-image-from-a-bitmap/4879849
				var zoomx = this.getWidth()/this._img.width;
				var zoomy = this.getHeight()/this._img.height;
				
				// Create an offscreen canvas, draw an image to it, and fetch the pixels
				var offtx = document.createElement('canvas').getContext('2d');
				offtx.drawImage(this._img, 0, 0);
				var wkp = offtx.getImageData(0, 0, this._img.width, this._img.height).data;
		
				// Draw the zoomed-up pixels to a different canvas context
				for (var x=0; x < this._img.width; ++x){
					for (var y=0; y < this._img.height; ++y){
						// Find the starting index in the one-dimensional image data
						var i = (y*this._img.width + x)*4;
						if(wkp[i+3]){
							c.fillStyle = "rgba("+wkp[i]+","+wkp[i+1]+","+wkp[i+2]+","+(wkp[i+3]/255)+")";
							c.fillRect(x*zoomx, y*zoomy, zoomx, zoomy);
						}
					}
				}
			}else{*/
				c.drawImage(this._img, 0, 0, this.getWidth(), this.getHeight());
			//}
		}else{
			c.drawImage(this._img, 0, 0);
		}
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
sgui.Image.prototype.setImage = function(name) {
	this._img = data.grabImage(name);
};
