
function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function checkCooldown(lastUsed, cooldownMS) {
  const now = Date.now();
  if (!lastUsed) {
    lastUsed = now;
    return { onCooldown: false, remaining: 0 };
  }
  const diff = now - lastUsed;
  if (diff >= cooldownMS) return { onCooldown: false, remaining: 0 };
  return { onCooldown: true, remaining: cooldownMS - diff };
}

module.exports = { formatTime, checkCooldown };