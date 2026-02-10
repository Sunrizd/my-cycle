export function renderAdminDashboard(stats, users = []) {
  const userRows = users
    .map(
      (user) => `
        <tr style="text-align: center;">
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                ${
                  user.role !== 'admin'
                    ? `
                <button class="btn-delete-user" data-id="${user.id}" style="background:none; border:none; cursor:pointer;" title="Supprimer">
                    🗑️
                </button>`
                    : ''
                }
                <button class="btn-reset-password" data-id="${user.id}" style="background:none; border:none; cursor:pointer;" title="Changer mot de passe">
                    🔑
                </button>
            </td>
        </tr>
    `
    )
    .join('');

  return `
        <header>
            <h1>Admin Dashboard</h1>
        </header>

        <section class="dashboard-card">
            <h2>Statistiques</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${stats.userCount}</span>
                    <span class="stat-label">Utilisateurs</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.cycleCount}</span>
                    <span class="stat-label">Cycles enregistrés</span>
                </div>
            </div>
        </section>

        <section class="dashboard-card" style="margin-top: 20px;">
            <h2>Utilisateurs (${users ? users.length : 0})</h2>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-bg);">
                            <th style="padding: 10px; text-align: center;">Nom</th>
                            <th style="padding: 10px; text-align: center;">Rôle</th>
                            <th style="padding: 10px; text-align: center;">Inscrit le</th>
                            <th style="padding: 10px; text-align: center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRows.length ? userRows : '<tr><td colspan="4" style="padding: 20px; text-align: center;">Aucun utilisateur</td></tr>'}
                    </tbody>
                </table>
            </div>
        </section>
        
        <div style="text-align: center; margin-top: 20px;">
            <p>Bienvenue dans l'espace d'administration.</p>
        </div>
    `;
}
