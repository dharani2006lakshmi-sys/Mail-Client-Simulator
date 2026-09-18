/**
 * auth.js — Authentication logic for MiniMail
 */

// ---- Page detection & guards ----
const isAuthPage = () => document.body.classList.contains('auth-page');
const isAppPage  = () => document.body.classList.contains('app-page');

// On auth page: redirect if already logged in
if (isAuthPage()) {
  const session = Storage.getSession();
  if (session) {
    window.location.href = 'pages/inbox.html';
  }
}

// On app page: redirect if not logged in
if (isAppPage()) {
  const session = Storage.getSession();
  if (!session) {
    window.location.href = '../index.html';
  }
}

// ---- UI toggles ----
function showRegister() {
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('registerCard').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('registerCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

// ---- Handlers ----
function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    return;
  }

  const { user, error } = Storage.findUser(email, password);
  if (error) {
    errEl.textContent = error;
    errEl.classList.remove('hidden');
    return;
  }

  Storage.setSession(user);
  window.location.href = 'pages/inbox.html';
}

function handleRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl    = document.getElementById('registerError');
  errEl.classList.add('hidden');

  if (!name || !email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.classList.remove('hidden');
    return;
  }

  const { user, error } = Storage.createUser(name, email, password);
  if (error) {
    errEl.textContent = error;
    errEl.classList.remove('hidden');
    return;
  }

  Storage.setSession(user);
  window.location.href = 'inbox.html';
}

function logout() {
  Storage.clearSession();
  window.location.href = '../index.html';
}

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (isAuthPage()) {
    const registerCard = document.getElementById('registerCard');
    if (registerCard && !registerCard.classList.contains('hidden')) {
      handleRegister();
    } else {
      handleLogin();
    }
  }
});
