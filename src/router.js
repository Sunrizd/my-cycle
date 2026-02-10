import { renderDashboard, renderHistory } from './components/dashboard.js';
import { renderAdminDashboard } from './components/adminDashboard.js';
import { renderCalendar } from './components/calendar.js';
import { renderAuth } from './components/auth.js';
import { renderProfile } from './components/profile.js';
import { renderFooter, bindFooterEvents } from './components/footer.js';

import { Stats } from './components/stats.js';
import { API } from './api.js';

export const Router = {
  renderLogin(container, onLoginSuccess) {
    container.innerHTML = '';
    const authNode = renderAuth(async () => {
        await onLoginSuccess();
    });
    
    // Header for Login Screen to hold the Toggle?
    // Or just put it floating? Let's add a mini header.
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.minHeight = '100vh';
    
    // Mini Top Bar removed


    authNode.style.flex = '1';
    wrapper.appendChild(authNode);
    
    const footerContainer = document.createElement('div');
    footerContainer.innerHTML = renderFooter();
    wrapper.appendChild(footerContainer);

    container.appendChild(wrapper);
    
    bindFooterEvents();
    
    // Bind Theme Toggle related code removed

  },

  async render(state, appData, actions) {
    const app = document.querySelector('#app');
    
    // Clear handled in sub-renders mostly, or we can clear here
    // app.innerHTML = ''; // Careful, some renders append/modify

    if (state.view === 'profile') {
      this.renderProfileView(app, state, actions);
    } else if (state.view === 'admin' && state.user && state.user.role === 'admin') {
      // Admin View is async due to fetching data
      await this.renderAdminView(app, state, actions);
    } else if (state.view === 'shared') {
        this.renderSharedView(app, state, appData);
    } else {
        this.renderRegularUserView(app, state, appData, actions);
    }
  },

  renderProfileView(app, state, actions) {
    app.innerHTML =
      '<div class="app-header"><div style="flex:1; display:flex; justify-content:flex-start; align-items:center;"><button id="btn-back" class="btn-nav">← Retour</button></div><h1 style="margin:0; font-size:1.5rem; text-align:center;">Mon Compte 👤</h1><div style="flex:1; display:flex; justify-content:flex-end; align-items:center;"></div></div><div id="profile-content" style="flex:1"></div>' + renderFooter() + '</div>';
    
    const content = app.querySelector('#profile-content');
    content.appendChild(renderProfile(state.user));

    document.getElementById('btn-back').addEventListener('click', actions.navigateToDashboard);

    bindFooterEvents();
  },

  async renderAdminView(app, state, actions) {
      try {
        const token = API.token;
        const statsPromise = token ? API.request('/api/admin/stats') : Promise.resolve({});
        const usersPromise = token ? API.request('/api/admin/users') : Promise.resolve([]);
    
        const [stats, users] = await Promise.all([statsPromise, usersPromise]);
        
        app.innerHTML = `
                <div class="app-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                    <div style="flex:1;">
                        <div style="text-align:right; padding: 10px;"></div>
                        ${renderAdminDashboard(stats, users)}
                        <nav class="bottom-nav" style="margin-top: 24px; display: flex; justify-content: center; gap: 16px;">
                                <button id="btn-dashboard" class="btn-action">Mon Cycle</button>
                                <button id="btn-logout" class="btn-nav">Déconnexion</button>
                        </nav>
                    </div>
                    ${renderFooter()}
                </div>
            `;
        
        bindFooterEvents();

        document.getElementById('btn-logout').addEventListener('click', actions.logout);
        document.getElementById('btn-dashboard').addEventListener('click', actions.navigateToDashboard);

        // Delete User Listeners
        document.querySelectorAll('.btn-delete-user').forEach((btn) => {
          btn.addEventListener('click', (e) => {
             const id = e.target.closest('button').dataset.id;
             actions.deleteUser(id);
          });
        });

        // Reset Password Listeners
        document.querySelectorAll('.btn-reset-password').forEach((btn) => {
          btn.addEventListener('click', (e) => {
             const id = e.target.closest('button').dataset.id;
             actions.resetUserPassword(id);
          });
        });

      } catch (e) {
        console.error('Failed to load admin data', e);
        // Fallback?
        app.innerHTML = '<p>Erreur de chargement admin.</p>';
      }
  },

  renderRegularUserView(app, state, appData, actions) {
      // Init Theme removed

      // Header with Logout and Admin Link
      const isAdmin = state.user && state.user.role === 'admin';
      const headerHtml = `
            <div class="app-header">
                <div style="display:flex; gap: 8px; align-items:center;">
                    <h1 style="font-size: 1.25rem; margin: 0; margin-right: 8px; display: flex; align-items: center; gap: 8px;">
                        <img src="/favicon.png" alt="My Cycle Icon" style="height: 28px; width: 28px;">
                        My Cycle
                    </h1>
                    ${isAdmin ? `<button id="btn-admin" class="btn-nav">⚙️ Admin</button>` : ''}
                    <button id="btn-profile" class="btn-nav primary">👤 Mon compte</button>
                </div>
                <div style="display:flex; gap: 8px; align-items:center;">
                    <button id="btn-logout" class="btn-nav">Déconnexion</button>

                </div>
            </div>
        `;

      // 2. Dashboard
      const displayName = state.user && state.user.firstname
          ? state.user.firstname
          : state.user ? state.user.username : null;
      
      const dashboardHtml = renderDashboard(appData, null, displayName);

      // 3. Calendar
      const calendarHtml = renderCalendar(state.currentDate, appData);

      // 4. History
      const historyHtml = renderHistory(appData.cycles, appData.settings);

      app.innerHTML = `
            ${headerHtml}
            ${dashboardHtml}
            ${calendarHtml}
            ${historyHtml}
            ${renderFooter()}
        `;

      // Event Listeners Wiring
      bindFooterEvents();
      
      // Theme Toggle Listener


      document.querySelector('#btn-logout').addEventListener('click', actions.logout);
      
      const profileBtn = document.querySelector('#btn-profile');
      if (profileBtn) profileBtn.addEventListener('click', actions.navigateToProfile);

      const adminBtn = document.querySelector('#btn-admin');
      if (adminBtn) adminBtn.addEventListener('click', actions.navigateToAdmin);

      const logPeriodBtn = document.querySelector('#btn-log-period');
      if (logPeriodBtn) logPeriodBtn.addEventListener('click', actions.logPeriod);

      const endPeriodBtn = document.querySelector('#btn-end-period');
      if (endPeriodBtn) endPeriodBtn.addEventListener('click', actions.endPeriod);

      const addCycleBtn = document.querySelector('#btn-add-cycle');
      if (addCycleBtn) addCycleBtn.addEventListener('click', actions.addCycle);

      const statsBtn = document.querySelector('#btn-stats');
      if (statsBtn) statsBtn.addEventListener('click', () => Stats.show(appData));

      // Calendar Navigation
      const prevBtn = document.querySelector('#btn-prev-month');
      if (prevBtn) prevBtn.addEventListener('click', actions.prevMonth);

      const nextBtn = document.querySelector('#btn-next-month');
      if (nextBtn) nextBtn.addEventListener('click', actions.nextMonth);

      const currentBtn = document.querySelector('#btn-current-month');
      if (currentBtn) currentBtn.addEventListener('click', actions.currentMonth);

      // Day Clicks
      document.querySelectorAll('.calendar-day').forEach((day) => {
        day.addEventListener('click', (e) => {
          const date = e.target.dataset.date;
          actions.dayClick(date);
        });
      });

      // History Edit Clicks
      document.querySelectorAll('.history-item.clickable').forEach((item) => {
        item.addEventListener('click', (e) => {
           const el = e.currentTarget;
           // pass params
           actions.editCycle(el.dataset.id, el.dataset.start, el.dataset.end);
        });
      });
  },

  renderSharedView(app, state, appData) {

      // Header for Shared View
      const headerHtml = `
            <div class="app-header">
                <div style="display:flex; gap: 8px; align-items:center;">
                    <span style="font-size: 1.2rem;">👁️ Vue Partenaire</span>
                </div>
                <div style="display:flex; gap: 8px; align-items:center;">
                    <button id="btn-exit-share" class="btn-nav">Quitter</button>

                </div>
            </div>
        `;

      const displayName = state.user && state.user.firstname
          ? state.user.firstname
          : state.user ? state.user.username : 'Utilisateur';
      
      // Render components in Read-Only mode
      const dashboardHtml = renderDashboard(appData, null, displayName, true);
      const calendarHtml = renderCalendar(state.currentDate, appData, true);
      const historyHtml = renderHistory(appData.cycles, appData.settings, true);

      app.innerHTML = `
            ${headerHtml}
            ${dashboardHtml}
            ${calendarHtml}
            ${historyHtml}
            ${renderFooter()}
        `;

      bindFooterEvents();

      
      document.getElementById('btn-exit-share').addEventListener('click', () => {
          window.location.href = '/'; 
      });

      // Calendar Navigation (still needed for read-only)
      const prevBtn = document.querySelector('#btn-prev-month');
      if (prevBtn) prevBtn.addEventListener('click', () => {
           state.currentDate.setMonth(state.currentDate.getMonth() - 1);
           this.renderSharedView(app, state, appData);
      });

      const nextBtn = document.querySelector('#btn-next-month');
      if (nextBtn) nextBtn.addEventListener('click', () => {
           state.currentDate.setMonth(state.currentDate.getMonth() + 1);
           this.renderSharedView(app, state, appData);
      });

      const currentBtn = document.querySelector('#btn-current-month');
      if (currentBtn) currentBtn.addEventListener('click', () => {
           state.currentDate = new Date();
           this.renderSharedView(app, state, appData);
      });
      
      // No Click Listeners for Days or History Items
  }
};
