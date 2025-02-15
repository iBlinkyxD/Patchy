function getLevelFromXP(xp) {
    let level = 1;
    
    while (xp >= 50 * (level ** 2) - 50 * level) {
        level++;
    }
    
    level--; // Adjust to correct level

    const xpForCurrentLevel = 50 * (level ** 2) - 50 * level;
    const xpForNextLevel = 50 * ((level + 1) ** 2) - 50 * (level + 1);
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const currentXP = xp - xpForCurrentLevel;

    return {
        level,           // Current level
        currentXP,       // XP progress within the current level
        nextLevelXP: xpNeeded, // Total XP required for next level
    };
}

module.exports = { getLevelFromXP };
