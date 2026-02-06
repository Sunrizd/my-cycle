import './style.css';
import { Storage } from './storage.js';
import { API } from './api.js';
import { Router } from './router.js';
import { Handlers } from './handlers.js';

import { ThemeToggle } from './components/themeToggle.js';

let appData = null;
const state = {
  user: null,
  view: 'auth',
  currentDate: new Date()
};

async function init() {
  // Initialize Theme immediately to avoid white flash
  ThemeToggle.init();

  const app = document.querySelector('#app');

  // Check Auth
  const token = localStorage.getItem('token');
  if (token) {
    state.user = {
      username: localStorage.getItem('username'),
      role: localStorage.getItem('role') || 'user',
      firstname: localStorage.getItem('firstname')
    };
    API.token = token; // Ensure API has token
    await loadApp();
  } else {
    Router.renderLogin(app, async () => {
        await loadApp();
    });
  }
}

async function loadApp() {
  const app = document.querySelector('#app');
  app.innerHTML = '<div style="text-align:center; margin-top: 50px;">Chargement...</div>';

  appData = await Storage.getData();
  
  if (!state.user) {
      // Reload user from storage if needed or ensure state consistency
      state.user = {
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role') || 'user',
        firstname: localStorage.getItem('firstname')
      };
  }
  
  // Reset view to dashboard if we are coming from login/init
  if (state.view === 'auth') state.view = 'dashboard';

  render();
}

function refreshApp() {
    loadApp();
}

// Define Actions accessible to the Router/Views
const actions = {
    logout: () => {
        API.clearToken();
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('firstname');
        state.user = null; // Clear user state
        state.view = 'auth';
        init();
    },
    navigateToDashboard: () => {
        state.view = 'dashboard';
        render();
    },
    navigateToProfile: () => {
        state.view = 'profile';
        render();
    },
    navigateToAdmin: () => {
        state.view = 'admin';
        render();
    },
    logPeriod: () => {
        Handlers.handleLogPeriod(refreshApp);
    },
    endPeriod: () => {
        Handlers.handleEndPeriod(refreshApp);
    },
    addCycle: () => {
        Handlers.handleAddCycle(appData, refreshApp);
    },
    editCycle: (id, start, end) => {
        Handlers.handleEditCycle(id, start, end, refreshApp);
    },
    deleteUser: (id) => {
        Handlers.handleDeleteUser(id, render); // Re-render admin view
    },
    resetUserPassword: (id) => {
        Handlers.handleResetUserPassword(id);
    },
    dayClick: (date) => {
        Handlers.handleDayClick(date, appData, refreshApp);
    },
    prevMonth: () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        render();
    },
    nextMonth: () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        render();
    },
    currentMonth: () => {
        state.currentDate = new Date();
        render();
    }
};

function render() {
    Router.render(state, appData, actions);
}

window.addEventListener('profileUpdated', (e) => {
  if (state.user) {
    state.user.firstname = e.detail.firstname;
  }
  if (e.detail.settingsChanged) {
    refreshApp();
  }
});

init();

