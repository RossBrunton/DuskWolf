//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.skills");

/** @namespace dusk.skills
 * @name dusk.skills
 * 
 * @description The skills namespace manages skills that the player has.
 * 
 * At the moment, this is just adding and setting values to an array, but in future it will be much better, probably.
 */
 
/** Initiates this, setting up all the variables.
 * @private
 */
dusk.skills._init = function() {
	/** All the current skills that the player has.
	 * 
	 * @type array
	 * @private
	 */
	this._skills = [];
	this.giveSkill("jump");
	this.giveSkill("dubjump");
	this.giveSkill("infinijump");
};

/** Gives the player a skill.
 * @param {string} skillName The skill to give the player.
 * @return {boolean} True if the player didn't have that skill before and now does, else false.
 */
dusk.skills.giveSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		this._skills.push(skillName);
		return true;
	}
	return false;
};

/** Checks if the player has the specified skill.
 * @param {string} skillName The name of the skill to check.
 * @return {boolean} Whether the player has that skill.
 */
dusk.skills.hasSkill = function(skillName) {
	return this._skills.indexOf(skillName) !== -1;
};

/** Removes the skill a player has.
 * @param {string} skillName The name of the skill to remove.
 * @return {boolean} False if the player doesn't have that skill, else true if it was removed.
 */
dusk.skills.revokeSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		return false;
	}
	this._skills.splice(this._skills.indexOf(skillName), 1);
	return true;
};

dusk.skills._init();

Object.seal(dusk.skills);
