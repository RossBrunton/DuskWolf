//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.behave.Jumper", (function() {
	var entities = load.require("dusk.entities");
	var Behave = load.require("dusk.behave.Behave");
	var skills = load.require("dusk.skills");
	var c = load.require("dusk.sgui.c");
	
	var Jumper = function(entity) {
		Behave.call(this, entity);
		
		this._jumps = 0;
		this._jumping = 0;
		this._jumpReleased = false;
		this._jumpEnergy = 0;
		
		this.entityEvent.listen(this._jumpFrame.bind(this), "frame");
		this.entityEvent.listen(this._verForce.bind(this), "verForce");
		
		this.entityEvent.listen((function(e) {
			if(e.dir == c.DIR_DOWN) {
				this._jumps = 0;
				this._jumping = 0;
			}else if(e.dir == c.DIR_UP) {
				this._jumping = 0;
			}
		}).bind(this), "collide");
	};
	Jumper.prototype = Object.create(Behave.prototype);
	
	Jumper.prototype._verForce = function(e) {
		if(this._jumping) return [-(this._jumping*0.3), this._jumping*0.3, "Jumper"];
		return 0;
	}

	Jumper.prototype._jumpFrame = function(e) {
		if(this._entity.underFluid() > 0.0) {
			this._jumps = 0;
		}
		
		if(this._controlActive("jump")) {
			if(this._jumpReleased  && skills.hasSkill("jump") && (
				this._entity.touchers(c.DIR_DOWN).length
				|| this._entity.underFluid() > 0.0
				|| (this._jumps == 0 && skills.hasSkill("dubjump"))
				|| skills.hasSkill("infinijump"))
			) {
				if(!this._entity.touchers(c.DIR_DOWN).length) {
					this._jumps ++;
					this._entity.performAnimation("airjump");
				}else{
					this._entity.performAnimation("groundjump");
				}
				
				this._jumping = 30;
				this._jumpReleased = false;
				this._entity.dy = 0;
			}else if(this._jumping) {
				this._jumping --;
			}
		}else{
			this._jumping = 0;
			this._jumpReleased = true;
		}
	};

	/** Workshop data used by `{@link dusk.sgui.EntityWorkshop}`.
	 * @static
	 */
	Jumper.workshopData = {
		"help":"Will jump on input.",
		"data":[
			
		]
	};

	Object.seal(Jumper);
	Object.seal(Jumper.prototype);

	entities.registerBehaviour("Jumper", Jumper);
	
	return Jumper;
})());
