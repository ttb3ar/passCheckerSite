const passwordInput = document.getElementById("password");
const strengthBar = document.getElementById("strength-bar");
const feedback = document.getElementById("feedback");
const pwnedResult = document.getElementById("pwned-result");

const themeToggle = document.getElementById("theme-toggle");
const langToggle = document.getElementById("lang-toggle");
const langLabel = document.getElementById("lang-label");
const title = document.getElementById("title");

let isJapanese = false;

passwordInput.addEventListener("input", async function () {
  const password = this.value;
  const score = calculateStrength(password);
  const percent = (score / 5) * 100;
  const color = getColor(score);

  strengthBar.style.setProperty("--bar-color", color);
  strengthBar.querySelector("::after"); // dummy to satisfy :after
  strengthBar.style.setProperty("width", percent + "%");

  feedback.textContent = getFeedback(score);
  if (password.length > 0) {
    const count = await checkPwned(password);
    pwnedResult.textContent = count > 0
      ? isJapanese
        ? `⚠️ このパスワードは ${count} 件の漏洩で見つかりました。`
        : `⚠️ This password has appeared in ${count} breaches!`
      : isJapanese
        ? `✅ このパスワードは既知の漏洩には見つかりませんでした。`
        : `✅ This password has not appeared in known breaches.`;
  } else {
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
  feedback.textContent = ""; // will refresh on next input
  pwnedResult.textContent = "";
});

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
  const colors = ["#ff4d4d", "#ff944d", "#ffd11a", "#9fdb4d", "#28a745"];
  return colors[Math.max(0, score - 1)];
}

function getFeedback(score) {
  const en = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const jp = ["とても弱い", "弱い", "普通", "強い", "とても強い"];
  return (isJapanese ? jp : en)[Math.max(0, score - 1)];
}

async function checkPwned(password) {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const data = await res.text();
  for (const line of data.split("\n")) {
    const [hashSuffix, count] = line.trim().split(":");
    if (hashSuffix.toUpperCase() === suffix.toUpperCase()) {
      return parseInt(count);
    }
  }
  return 0;
}

async function sha1(str) {
  const buffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
