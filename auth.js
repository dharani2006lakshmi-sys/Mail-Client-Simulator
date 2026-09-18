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

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Demo mode: accept any login
    Storage.setSession({ email: email || 'guest@minimail.com', name: 'Guest User' });
    
    // Switch UI to app page
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app-page').classList.add('active');
    
    // Initialize mail
    if (typeof initMail === 'function') {
        initMail();
    }
}

function handleRegister() {
    handleLogin(); // Just use login for demo
}

function logout() {
    Storage.clearSession();
    // Switch UI to login page
    document.getElementById('app-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('login-page').classList.contains('active')) {
        handleLogin();
    }
});
