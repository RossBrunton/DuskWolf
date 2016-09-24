//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Image", function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var DImage = load.require("dusk.utils.Image");
	
	/** An image.
	 *
	 * It is given an URL pointing to an image which is then downloaded and displayed.
	 * 
	 * Any valid image type supported by 2D canvas context works.
	 * 
	 * A width and height must be specified, otherwise the image will not draw.
	 * 
	 * This uses the theme key `img.src` (default "default/img.png") as the default image.
	 * 
	 * @memberof dusk.sgui
	 * @extends dusk.sgui.Component
	 */
	class Image extends Component {
		/** Creates a new Image.
		 * 
		 * @param {dusk.sgui.Component} parent The container that this component is in.
		 * @param {string} name The name of the component.
		 */
		constructor(parent, name) {
			super(parent, name);
			
			/** The current image.
			 * @type dusk.utils.Image
			 * @protected
			 * @memberof! dusk.sgui.Image#
			 */
			this._img = null;
			/** Image options for the image.
			 * 
			 * @type array
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.Image#
			 */
			this.imageTrans = [];
			
			/** Sets the image to draw, this should be a URL, potentially relative to `{@link dusk.dataDir}`.
			 * @type string
			 * @default "default/img.png"
			 * @memberof! dusk.sgui.Image#
			 */
			this.src = "default/img.png";
			
			//Prop masks
			this._mapper.map("src", "src");
			this._mapper.map("imageTrans", "imageTrans");
			
			//Listeners
			this.onPaint.listen(this._imageDraw.bind(this));
		}
		
		/** Used to draw the image.
		 * @param {object} e A draw event.
		 * @private
		 */
		_imageDraw(e) {
			if(this._img && this._img.isReady() && this._img.width() && this._img.height()){
				/*this._img.paintScaled(e.c, this.imageTrans, false,
					e.d.sourceX, e.d.sourceY, e.d.width, e.d.height,
					e.d.destX, e.d.destY, e.d.width, e.d.height,
					this._img.width()/this.width, this._img.height()/this.height
				);*/
				this._img.paintRanges(e.c, this.imageTrans, false, e.d.origin, e.d.slice, e.d.dest);
			}
		}
		
		//src
		get src() {
			if(!this._img) return "";
			return this._img.src;
		}
		
		set src(value) {
			if(value === undefined) {
				this._img = null;
			}else{
				this._img = new DImage(value);
			}
		}
	}
	
	sgui.registerType("Image", Image);
	
	return Image;
});
