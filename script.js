const passwordInput = document.getElementById("password");
const strengthFill = document.getElementById("strength-fill");
const feedback = document.getElementById("feedback");
const pwnedResult = document.getElementById("pwned-result");
const themeToggle = document.getElementById("theme-toggle");
const langToggle = document.getElementById("lang-toggle");
const langLabel = document.getElementById("lang-label");
const title = document.getElementById("title");

let isJapanese = false;
let currentScore = 0;
let currentPwnedCount = 0;

passwordInput.addEventListener("input", async function () {
  const password = this.value;
  currentScore = calculateStrength(password);
  const percent = (currentScore / 5) * 100;
  const color = getColor(currentScore);

  strengthFill.style.width = percent + "%";
  strengthFill.style.backgroundColor = color;

  feedback.textContent = getFeedback(currentScore);

  if (password.length > 0) {
    currentPwnedCount = await checkPwned(password);
    updatePwnedDisplay();
  } else {
    currentPwnedCount = 0;
    pwnedResult.textContent = '';
  }
});

themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
});

langToggle.addEventListener("change", () => {
  isJapanese = langToggle.checked;
  langLabel.textContent = isJapanese ? "JP" : "EN";
  title.textContent = isJapanese ? "パスワード強度チェッカー" : "Password Strength Checker";
  passwordInput.placeholder = isJapanese ? "パスワードを入力してください" : "Enter your password";
  
  // Update feedback and pwned result with current values instead of clearing
  if (passwordInput.value.length > 0) {
    feedback.textContent = getFeedback(currentScore);
    updatePwnedDisplay();
  }
});

function updatePwnedDisplay() {
  if (passwordInput.value.length > 0) {
    pwnedResult.textContent = currentPwnedCount > 0
      ? isJapanese
        ? `⚠️ このパスワードは ${currentPwnedCount} 件の漏洩で見つかりました。`
        : `⚠️ This password has appeared in ${currentPwnedCount} breaches!`
      : isJapanese
        ? `✅ このパスワードは既知の漏洩には見つかりませんでした。`
        : `✅ This password has not appeared in known breaches.`;
  }
}

function calculateStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getColor(score) {
  const colors = [
    "var(--danger)",     // very weak
    "#e67e22",           // weak
    "var(--warning)",    // fair
    "#27ae60",           // strong
    "var(--success)"     // very strong
  ];
  return colors[Math.max(0, score - 1)];
}

function getFeedback(score) {
  const en = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const jp = ["とても弱い", "弱い", "普通", "強い", "とても強い"];
  return (isJapanese ? jp : en)[Math.max(0, score - 1)];
}

async function checkPwned(password) {
  try {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const data = await res.text();
    for (const line of data.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix && hashSuffix.toUpperCase() === suffix.toUpperCase()) {
        return parseInt(count);
      }
    }
    return 0;
  } catch (error) {
    console.error('Error checking pwned passwords:', error);
    return 0;
  }
}

async function sha1(str) {
  const buffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
