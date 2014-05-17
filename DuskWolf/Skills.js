//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.skills", (function() {
	/** @namespace dusk.skills
	 * @name dusk.skills
	 * 
	 * @description The skills namespace manages skills that the player has.
	 * 
	 * At the moment, this is just adding and setting values to an array, but in future it will be much better, probably.
	 */
	var skills = [];
	
	/** All the current skills that the player has.
	 * 
	 * @type array
	 * @private
	 */
	var _skills = [];

	/** Gives the player a skill.
	 * @param {string} skillName The skill to give the player.
	 * @return {boolean} True if the player didn't have that skill before and now does, else false.
	 */
	skills.giveSkill = function(skillName) {
		if(_skills.indexOf(skillName) === -1) {
			_skills.push(skillName);
			return true;
		}
		return false;
	};

	/** Checks if the player has the specified skill.
	 * @param {string} skillName The name of the skill to check.
	 * @return {boolean} Whether the player has that skill.
	 */
	skills.hasSkill = function(skillName) {
		return _skills.indexOf(skillName) !== -1;
	};

	/** Removes the skill a player has.
	 * @param {string} skillName The name of the skill to remove.
	 * @return {boolean} False if the player doesn't have that skill, else true if it was removed.
	 */
	skills.revokeSkill = function(skillName) {
		if(_skills.indexOf(skillName) === -1) {
			return false;
		}
		_skills.splice(_skills.indexOf(skillName), 1);
		return true;
	};

	Object.seal(skills);
	
	return skills;
})());
