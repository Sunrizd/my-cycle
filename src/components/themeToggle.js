export const ThemeToggle = {
    init() {
        try {
            // Check localStorage or System Preference
            const savedTheme = localStorage.getItem('theme');
            const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
                document.body.classList.add('dark');
            }
            
            // Update button text/icon if it exists
            this.updateButton();
        } catch (e) {
            console.warn('Theme init failed', e);
        }
    },

    toggle() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateButton();
    },

    updateButton() {
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            const isDark = document.body.classList.contains('dark');
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.title = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';
        }
    },

    renderButton() {
        const isDark = document.body.classList.contains('dark');
        return `
            <button id="theme-toggle-btn" class="btn-nav" style="font-size: 1.2rem; padding: 4px 8px;" title="${isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}">
                ${isDark ? '☀️' : '🌙'}
            </button>
        `;
    }
};
