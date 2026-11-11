// Authentication and SPA Navigation Logic
const isAuthPage = () => false; // We are always on the same page now
const isAppPage = () => true;

function showRegister() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('registerCard').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerCard').classList.add('hidden');
    document.getElementById('loginCard').classList.remove('hidden');
}

function handleLogin(isGuest = false) {
    const emailInput = document.getElementById('login-email');
    const passInput  = document.getElementById('login-password');
    const errEl      = document.getElementById('login-error');
    if (errEl) errEl.classList.add('hidden');

    const rawEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passInput ? passInput.value : '';

    if (!isGuest && !rawEmail) {
        if (errEl) {
            errEl.textContent = 'Please enter an email address or click Continue as Guest.';
            errEl.classList.remove('hidden');
        }
        if (emailInput) emailInput.focus();
        return;
    }

    const email = isGuest ? 'guest@minimail.com' : rawEmail;
    const name  = isGuest ? 'Guest User' : email.split('@')[0];
    const user  = Storage.ensureDemoUser(email, password, name);

    Storage.setSession(user);

    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app-page').classList.add('active');

    if (typeof initMail === 'function') {
        initMail();
    }
}

function handleDemoLogin() {
    const emailInput = document.getElementById('login-email');
    const passInput  = document.getElementById('login-password');
    if (emailInput && !emailInput.value.trim()) emailInput.value = 'guest@minimail.com';
    if (passInput && !passInput.value) passInput.value = 'demo1234';
    handleLogin(true);
}

function handleRegister() {
    handleLogin(false);
}

function handleLogout() {
    Storage.clearSession();
    const settings = document.getElementById('settings-panel');
    if (settings) settings.classList.add('hidden');
    const compose = document.getElementById('compose-modal');
    if (compose) compose.classList.add('hidden');
    document.getElementById('app-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
}

function logout() {
    handleLogout();
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('login-page').classList.contains('active')) {
        handleLogin();
    }
});
