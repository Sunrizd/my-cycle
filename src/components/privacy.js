export function renderPrivacyPolicy(onClose) {
    const container = document.createElement('div');
    container.className = 'privacy-container';
    container.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
        z-index: 2000; padding: 20px;
    `;

    const content = document.createElement('div');
    content.className = 'dashboard-card';
    content.style.cssText = `
        max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
        padding: 24px; position: relative; background: var(--color-surface);
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 12px;
        text-align: left;
    `;

    content.innerHTML = `
        <button style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer;" id="close-privacy">×</button>
        <h1 style="margin-bottom: 20px;">Politique de Confidentialité</h1>
        
        <h2>1. Collecte des Données</h2>
        <p>Nous collectons uniquement les données que vous saisissez explicitement :</p>
        <ul>
            <li>Informations de compte (pseudo, email, prénom).</li>
            <li>Données de santé (dates de règles, symptômes, humeur).</li>
            <li>Préférences (durée du cycle, mot de passe hashé).</li>
        </ul>

        <h2>2. Utilisation des Données</h2>
        <p>Vos données servent <strong>exclusivement</strong> au fonctionnement de l'application :</p>
        <ul>
            <li>Calcul et prédiction de vos cycles.</li>
            <li>Affichage de votre historique.</li>
            <li>Authentification sécurisée.</li>
        </ul>
        <p>Nous ne partageons, ne vendons et ne transmettons aucune donnée à des tiers (publicitaires, analytiques, etc.).</p>

        <h2>3. Stockage</h2>
        <p>Les données sont stockées sur votre instance auto-hébergée (dans une base de données locale SQLite). Vous êtes le seul propriétaire de vos données.</p>

        <h2>4. Vos Droits (RGPD)</h2>
        <ul>
            <li><strong>Accès et Portabilité</strong> : Vous pouvez télécharger l'intégralité de vos données au format JSON depuis la page "Mon Compte".</li>
            <li><strong>Rectification</strong> : Vous pouvez modifier vos cycles et informations à tout moment.</li>
            <li><strong>Suppression (Droit à l'oubli)</strong> : Vous pouvez supprimer définitivement votre compte et toutes les données associées depuis la page "Mon Compte".</li>
        </ul>

        <div style="margin-top: 30px; text-align: center;">
            <button class="btn-primary" id="btn-ok-privacy">J'ai compris</button>
        </div>
    `;

    container.appendChild(content);

    const close = () => {
        container.remove();
        if (onClose) onClose();
    };

    content.querySelector('#close-privacy').addEventListener('click', close);
    content.querySelector('#btn-ok-privacy').addEventListener('click', close);

    // Close on click outside
    container.addEventListener('click', (e) => {
        if (e.target === container) close();
    });

    return container;
}
