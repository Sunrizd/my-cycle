export function renderFooter() {
    return `
      <footer class="app-footer">
          <p>© 2026 Period Tracker v1.0 • <a href="https://sunrizd.net" target="_blank" rel="noopener noreferrer">Sunrizd</a> • <a href="#" class="footer-privacy-link">Confidentialité</a> • <a href="https://github.com/Sunrizd/my-cycle" target="_blank" rel="noopener noreferrer">GitHub</a></p>
      </footer>
    `;
  }
  
  export function bindFooterEvents() {
      const link = document.querySelector('.footer-privacy-link');
      if (link) {
          link.addEventListener('click', async (e) => {
              e.preventDefault();
              const { renderPrivacyPolicy } = await import('./privacy.js');
              document.body.appendChild(renderPrivacyPolicy());
          });
      }
  }
