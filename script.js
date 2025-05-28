const passwordInput = document.getElementById("password");
const strengthFill = document.getElementById("strength-fill");
const feedback = document.getElementById("feedback");
const pwnedResult = document.getElementById("pwned-result");
const themeToggle = document.getElementById("checkbox");
const langToggle = document.getElementById("language-checkbox");
const langLabel = document.querySelector(".lang-label");
const title = document.getElementById("title");

let isJapanese = false;
let currentScore = 0;
let currentPwnedCount = 0;

// Language translations object
const translations = {
  en: {
    title: "Password Strength Checker",
    subtitle: "Check the strength and security of your passwords",
    passwordLabel: "Enter your password:",
    placeholder: "Enter your password",
    feedback: ["Very weak", "Weak", "Fair", "Strong", "Very strong"],
    pwnedWarning: "⚠️ This password has appeared in {count} breaches!",
    pwnedSafe: "✅ This password has not appeared in known breaches.",
    footer: "Created by TTB3AR"
  },
  jp: {
    title: "パスワード強度チェッカー",
    subtitle: "パスワードの強度とセキュリティをチェック",
    passwordLabel: "パスワードを入力してください:",
    placeholder: "パスワードを入力してください",
    feedback: ["とても弱い", "弱い", "普通", "強い", "とても強い"],
    pwnedWarning: "⚠️ このパスワードは {count} 件の漏洩で見つかりました。",
    pwnedSafe: "✅ このパスワードは既知の漏洩には見つかりませんでした。",
    footer: "TTB3AR制作"
  }
};

// Local Storage Functions
function saveTheme(theme) {
  try {
    localStorage.setItem('passwordChecker_theme', theme);
  } catch (error) {
    console.warn('Could not save theme preference:', error);
  }
}

function loadTheme() {
  try {
    return localStorage.getItem('passwordChecker_theme') || 'light';
  } catch (error) {
    console.warn('Could not load theme preference:', error);
    return 'light';
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem('passwordChecker_language', language);
  } catch (error) {
    console.warn('Could not save language preference:', error);
  }
}

function loadLanguage() {
  try {
    return localStorage.getItem('passwordChecker_language') || 'en';
  } catch (error) {
    console.warn('Could not load language preference:', error);
    return 'en';
  }
}

// Theme handling
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function initializeTheme() {
  const savedTheme = loadTheme();
  setTheme(savedTheme);
  
  // Update the toggle switch to match the saved theme
  themeToggle.checked = (savedTheme === 'dark');
}

// Language handling
function setLanguage(language) {
  document.documentElement.setAttribute('data-language', language);
  isJapanese = (language === 'jp');
  updateUILanguage(language);
  saveLanguage(language);
}

function toggleLanguage() {
  const contentElements = document.querySelectorAll('#title, #subtitle, #password-label, #feedback, #pwned-result, #footer-text');
  
  contentElements.forEach(element => {
    element.classList.add('transition-content');
  });
  
  document.body.offsetHeight;
  
  contentElements.forEach(element => {
    element.classList.add('fade-out');
  });
  
  setTimeout(() => {
    const newLanguage = isJapanese ? 'en' : 'jp';
    setLanguage(newLanguage);
    
    langLabel.textContent = isJapanese ? "JP" : "EN";
    
    showLanguageIndicator(newLanguage);
    
    if (passwordInput.value.length > 0) {
      feedback.textContent = getFeedback(currentScore);
      updatePwnedDisplay();
    }
    
    setTimeout(() => {
      contentElements.forEach(element => {
        element.classList.remove('fade-out');
      });
      
      setTimeout(() => {
        contentElements.forEach(element => {
          element.classList.remove('transition-content');
        });
      }, 300);
    }, 50);
  }, 300);
}

function initializeLanguage() {
  const savedLanguage = loadLanguage();
  isJapanese = (savedLanguage === 'jp');
  
  // Update the toggle switch to match the saved language
  langToggle.checked = isJapanese;
  langLabel.textContent = isJapanese ? "JP" : "EN";
  
  setLanguage(savedLanguage);
}

function updateUILanguage(language) {
  const texts = translations[language];
  
  document.getElementById('title').textContent = texts.title;
  document.getElementById('subtitle').textContent = texts.subtitle;
  document.getElementById('password-label').textContent = texts.passwordLabel;
  document.getElementById('password').placeholder = texts.placeholder;
  document.getElementById('footer-text').textContent = texts.footer;
  document.title = texts.title;
}

function showLanguageIndicator(language) {
  let indicator = document.querySelector('.language-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'language-indicator';
    document.body.appendChild(indicator);
  }
  
  indicator.textContent = language === 'en' ? 'English' : '日本語';
  indicator.classList.add('show');
  
  setTimeout(() => {
    indicator.classList.remove('show');
  }, 1500);
}

// Password strength checking
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

function updatePwnedDisplay() {
  if (passwordInput.value.length > 0) {
    const texts = translations[isJapanese ? 'jp' : 'en'];
    pwnedResult.textContent = currentPwnedCount > 0
      ? texts.pwnedWarning.replace('{count}', currentPwnedCount)
      : texts.pwnedSafe;
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
  const texts = translations[isJapanese ? 'jp' : 'en'];
  return texts.feedback[Math.max(0, score - 1)];
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize saved preferences first
  initializeTheme();
  initializeLanguage();
  
  // Then set up event listeners
  themeToggle.addEventListener("change", toggleTheme);
  langToggle.addEventListener("change", toggleLanguage);
});
