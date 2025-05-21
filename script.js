document.getElementById("password").addEventListener("input", async function () {
  const password = this.value;
  const feedback = document.getElementById("feedback");
  const strengthBar = document.getElementById("strength-bar");
  const pwnedResult = document.getElementById("pwned-result");

  const score = calculateStrength(password);
  const strengthPercent = (score / 5) * 100;
  const bar = strengthBar.querySelector("::after");

  // Set strength bar width and color
  strengthBar.style.setProperty('--strength', strengthPercent + '%');
  strengthBar.style.setProperty('--color', getColor(score));

  // Set strength feedback
  feedback.textContent = getFeedback(score);

  // Pwned check (only if length > 0)
  if (password.length > 0) {
    const count = await checkPwned(password);
    pwnedResult.textContent = count > 0
      ? `⚠️ This password has appeared in ${count} breaches!`
      : `✅ This password has not appeared in known breaches.`;
  } else {
    pwnedResult.textContent = '';
  }
});

// Strength calculation based on entropy-ish model
function calculateStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

function getFeedback(score) {
  const messages = [
    "Very weak",
    "Weak",
    "Fair",
    "Strong",
    "Very strong",
  ];
  return messages[Math.max(0, score - 1)];
}

function getColor(score) {
  const colors = ["#ff4d4d", "#ff944d", "#ffd11a", "#9fdb4d", "#28a745"];
  return colors[Math.max(0, score - 1)];
}

// Check password against Have I Been Pwned using k-Anonymity
async function checkPwned(password) {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await response.text();
  const lines = text.split('\n');

  for (const line of lines) {
    const [hashSuffix, count] = line.split(':');
    if (hashSuffix.trim().toLowerCase() === suffix.toLowerCase()) {
      return parseInt(count);
    }
  }

  return 0;
}

async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
