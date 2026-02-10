const API_URL = '/api';
const AUTH_URL = '/auth';

export const API = {
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  },

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  },

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.token ? `Bearer ${this.token}` : ''
    };
  },

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers }
    });

    if (response.status === 401 || response.status === 403) {
      this.clearToken();
      window.location.reload(); // Simple redirect to force login view
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'API Error');
    }

    return response.json();
  },

  async logSymptom(date, data) {
    return this.request('/api/symptoms', {
      method: 'POST',
      body: JSON.stringify({ date, data })
    });
  },

  async addCycle(startDate, endDate) {
    return this.request('/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
  },

  async updateCycle(id, startDate, endDate) {
    return this.request(`/api/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    });
  },

  async deleteCycle(id) {
    return this.request(`/api/cycles/${id}`, {
      method: 'DELETE'
    });
  },

  async saveSettings(settings) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  async login(username, password, remember = false) {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(username, password) {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Register failed');
    }
    return res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  },

  async resetUserPassword(id, password) {
    const res = await fetch(`${API_URL}/admin/users/${id}/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },

  	// Backup Methods
	async exportData() {
		const data = await this.request('/api/backup');
		
		// Create a blob and trigger download
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `period_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
		
		return true;
	},

	async importData(jsonData) {
		return await this.request('/api/backup', {
			method: 'POST',
			body: JSON.stringify(jsonData)
		});
	},

    // Sharing Methods
    async createShareToken() {
        return this.request('/api/share/token', { method: 'POST' });
    },

    async deleteShareToken() {
        return this.request('/api/share/token', { method: 'DELETE' });
    },

    async getShareToken() {
        return this.request('/api/share/token');
    },

    async getSharedData(token) {
        // Public endpoint, no auth headers needed if we don't want to enforce login for partner
        // But request() helper uses getHeaders() which adds token if present.
        // It's fine if token is sent, backend ignores it for public route or we can just fetch directly.
        // The route /api/share/:token is NOT protected in backend (router.use('/api', ...) protects everything starting with /api
        // Wait, in server/routes.js:
        // router.use('/api', Auth.authenticateToken);
        // This protects ALL /api routes.
        // My new route is router.get('/api/share/:token', ...)
        // It is DEFINED after the protection middleware?
        // Let's check server/routes.js order.
        // I inserted it before Backup. Backup is protected.
        // AND `router.use('/api', Auth.authenticateToken);` is at line 11.
        // So /api/share/:token IS protected. This is a BUG in my plan/implementation if I want it public.
        // I need to fix the backend route to be OUTSIDE the /api protection or exclude it.
        // distinctive path? /share/:token (no /api)?
        // I should fix the backend first or now.
        
        // Let's assume I fix the backend to be /share/:token or move it before the middleware.
        // I will change the request here to use /share/:token (non-api prefix) to avoid issues if I move it?
        // Or I can just use fetch directly here to allow no-auth.
        
        const res = await fetch(`/share/${token}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
             const err = await res.json();
             throw new Error(err.error || 'Failed to load shared data');
        }
        return res.json();
    }
};
