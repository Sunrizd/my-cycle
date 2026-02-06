import { Storage } from '../storage.js';

export function renderUserSettings() {
  setTimeout(setupListeners, 0);
  return `
        <div class="dashboard-card">
            <h2>Paramètres du compte</h2>
            
            <div style="margin-bottom: 20px;">
                <h3>Changer le mot de passe</h3>
                <form id="form-change-pw">
                    <input type="password" id="curr-pw" placeholder="Mot de passe actuel" required style="display:block; margin: 5px 0; width: 100%; box-sizing:border-box;">
                    <input type="password" id="new-pw" placeholder="Nouveau mot de passe" required style="display:block; margin: 5px 0; width: 100%; box-sizing:border-box;">
                    <button type="submit">Mettre à jour</button>
                </form>
            </div>

            <div style="border-top: 1px solid #ccc; padding-top: 20px;">
                <h3 style="color: var(--color-secondary);">Zone Danger</h3>
                <button id="btn-delete-account" style="background-color: var(--color-accent); color: white;">Supprimer mon compte</button>
            </div>
            
            <button id="btn-back-dash" style="margin-top: 20px; background: none; text-decoration: underline;">Retour au tableau de bord</button>
        </div>
    `;
}

function setupListeners() {
  document.getElementById('form-change-pw').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curr = document.getElementById('curr-pw').value;
    const newPw = document.getElementById('new-pw').value;

    try {
      await Storage.changePassword(curr, newPw);
      alert('Mot de passe changé avec succès !');
      document.getElementById('form-change-pw').reset();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  });

  document.getElementById('btn-delete-account').addEventListener('click', async () => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront perdues.'
      )
    ) {
      try {
        await Storage.deleteAccount();
        location.reload();
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  });

  document.getElementById('btn-back-dash').addEventListener('click', () => {
    // Trigger a re-render of the main app view via a custom event or by reloading (simplest for now is creating an event or simple callback, but main.js handles state)
    // Since we don't have a sophisticated router, we'll dispatch an event on document
    document.dispatchEvent(new CustomEvent('navigate-home'));
  });
}
