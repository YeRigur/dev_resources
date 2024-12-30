// theme.js
function initThemeToggle() {
    const themeSelect = document.getElementById('theme-switch');
    themeSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        document.body.classList.toggle('dark', value === 'dark');
        localStorage.setItem('theme', value);
    });
}

window.initThemeToggle = initThemeToggle;
