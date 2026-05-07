// Shared Client-side Logic for Fixora

document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    setupPasswordToggles();
});

function updateNavbar() {
    const userStr = localStorage.getItem('user');
    const guestLinks = document.getElementById('guestLinks');
    const userLinks = document.getElementById('userLinks');
    const studentLinks = document.getElementById('studentLinks');
    const adminLinks = document.getElementById('adminLinks');
    const navUserName = document.getElementById('navUserName');

    if (!guestLinks || !userLinks) return;

    if (userStr) {
        const user = JSON.parse(userStr);
        guestLinks.style.display = 'none';
        userLinks.style.display = 'flex';
        navUserName.textContent = user.name;

        if (user.role === 'admin') {
            adminLinks.style.display = 'flex';
            studentLinks.style.display = 'none';
        } else {
            adminLinks.style.display = 'none';
            studentLinks.style.display = 'flex';
        }
    } else {
        guestLinks.style.display = 'flex';
        userLinks.style.display = 'none';
    }
}

function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i data-lucide="eye-off"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i data-lucide="eye"></i>';
            }
            lucide.createIcons();
        });
    });
}

function logout() {
    localStorage.removeItem('user');
    document.cookie = "fixora_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/login';
}

function getToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.token : null;
}

function showMsg(text, type) {
    const msg = document.getElementById('msg');
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'msg ' + type;
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
}
