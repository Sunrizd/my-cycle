import { API } from '../api.js';
import { Storage } from '../storage.js';
import { CycleCalculator } from '../cycleCalculator.js';
import { Modal } from './modal.js';

export function renderProfile(user) {
  // We need to fetch the email first, as it's not in the main state
  // Return a container that will be populated async
  const container = document.createElement('div');
  container.innerHTML =
    '<div style="text-align:center; margin-top: 20px;">Chargement du profil...</div>';

  loadProfileData(container, user);

  return container;
}

async function loadProfileData(container, user) {
  try {
    const [profile, settingsArr, shareData] = await Promise.all([
      API.request('/api/profile'),
      API.request('/api/settings'),
      API.getShareToken()
    ]);

    const email = profile.email || '';
    const firstname = profile.firstname || '';

    // Defaults
    const cycleLength = settingsArr.averageCycleLength || 28;
    const periodLength = settingsArr.averagePeriodLength || 5;
    const lutealLength = settingsArr.lutealPhaseLength || 14;

    container.innerHTML = `


            <section class="dashboard-card">
                <h2>Mes informations</h2>
                <form id="profile-form" style="margin-top: 20px; display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label>Nom d'utilisateur</label>
                        <input type="text" value="${user.username}" disabled style="background: rgba(0,0,0,0.05); cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email" value="${email}" placeholder="votre@email.com">
                    </div>

                    <div class="form-group">
                        <label>Prénom (affiché sur l'accueil)</label>
                        <input type="text" id="firstname" value="${firstname}" placeholder="Votre prénom">
                    </div>


                    
                    <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>
                    
                    <h3>Préférences de Cycle</h3>
                    <div style="display: flex; gap: 16px;">
                        <div class="form-group" style="flex:1;">
                            <label>Durée Moyenne Cycle</label>
                            <input type="number" id="cycleLen" value="${cycleLength}" min="21" max="45">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Règles (jours)</label>
                            <input type="number" id="periodLen" value="${periodLength}" min="3" max="10">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Phase Lutéale</label>
                            <input type="number" id="lutealLen" value="${lutealLength}" min="10" max="18" title="Généralement du jour de l'ovulation à la veille des règles (14 jours par défaut)">
                        </div>
                    </div>
                    </div>
                    <div style="text-align: right; margin-top: 8px; display:flex; justify-content:space-between; gap:8px; align-items:center;">
                         <button type="button" id="btn-calc-avg" class="btn-secondary" style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--color-primary); color: var(--color-primary);">
                            📊 Calculer mes moyennes
                        </button>
                        <button type="button" id="btn-reset-cycle" class="btn-secondary" style="font-size: 0.8rem; padding: 4px 10px;">
                            ↺ Valeurs par défaut
                        </button>
                    </div>

                    <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>

                    <h3>Sauvegarde & Restauration</h3>
                    <p style="font-size:0.85rem; color:#666; text-align: center;">Exportez vos données pour les conserver ou les transférer.</p>
                    
                    <div style="display:flex; gap:10px; margin-bottom: 20px; justify-content: center; align-items:center;">
                        <button type="button" id="btn-export" class="btn-secondary" style="border: 1px solid var(--color-secondary);">
                            📥 Exporter mes données
                        </button>
                        
                        <button type="button" id="btn-import-trigger" class="btn-secondary" style="border: 1px solid var(--color-secondary);">
                            📤 Importer...
                        </button>
                        <input type="file" id="import-file" accept=".json" style="display:none;">
                    </div>

                    <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>

                    <h3>Partage Partenaire</h3>
                    <p style="font-size:0.85rem; color:#666; text-align: center;">Partagez votre calendrier en lecture seule avec un partenaire.</p>
                    
                    <div id="share-section" style="margin-bottom: 20px; display: flex; flex-direction: column; align-items: center;">
                        <button type="button" id="btn-share-generate" class="btn-secondary" style="border: 1px solid var(--color-primary);">
                            🔗 Générer un lien de partage
                        </button>
                        <div id="share-info" style="display:none; margin-top:10px; padding:10px; background:#f5f5f5; border-radius:8px; width: 100%; box-sizing: border-box;">
                            <p style="font-size:0.9rem; margin-bottom:5px;">Code Partenaire : <strong id="share-code-display" style="user-select:all;"></strong></p>
                            <p style="font-size:0.8rem; color:#666; margin-bottom:8px;">ou utilisez ce lien :</p>
                            <input type="text" id="share-link-input" readonly style="width:100%; font-size:0.8rem; padding:5px; margin-bottom:8px;">
                            <button type="button" id="btn-share-revoke" style="background:none; border:none; color:#c62828; font-size:0.8rem; cursor:pointer; text-decoration:underline;">
                                🚫 Désactiver le partage
                            </button>
                        </div>
                    </div>

                    <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>

                    <div class="form-group">
                        <label>Nouveau mot de passe (min 8 car.)</label>
                        <input type="password" id="password" placeholder="" autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label>Confirmer le mot de passe</label>
                        <input type="password" id="confirmData" placeholder="" autocomplete="new-password">
                    </div>

                    <button type="submit" class="btn-log" style="width: 100%;">Enregistrer les modifications</button>
                    <div id="profile-msg" style="margin-top: 10px; font-size: 0.9rem; text-align: center;"></div>
                </form>
            </section>
        `;

    const form = container.querySelector('#profile-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newEmail = form.querySelector('#email').value;
      const newFirstname = form.querySelector('#firstname').value;
      const newPass = form.querySelector('#password').value;
      const confirmPass = form.querySelector('#confirmData').value;

      const newCycleLen = parseInt(form.querySelector('#cycleLen').value);
      const newPeriodLen = parseInt(form.querySelector('#periodLen').value);

      const msg = form.querySelector('#profile-msg');

      msg.style.color = 'var(--color-primary)';
      msg.textContent = 'Enregistrement...';

      if (newPass && newPass !== confirmPass) {
        msg.style.color = '#e57373';
        msg.textContent = 'Les mots de passe ne correspondent pas.';
        return;
      }

      if (newPass && newPass.length < 8) {
        msg.style.color = '#e57373';
        msg.textContent = 'Le mot de passe doit faire au moins 8 caractères.';
        return;
      }

      try {
        // Save Profile
        await API.request('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({
            email: newEmail,
            firstname: newFirstname,
            password: newPass || undefined
          })
        });

        // Save Settings
        await API.saveSettings({
          averageCycleLength: newCycleLen,
          averagePeriodLength: newPeriodLen,
          lutealPhaseLength: parseInt(form.querySelector('#lutealLen').value) || 14
        });

        // Update local storage if firstname changed
        localStorage.setItem('firstname', newFirstname);

        // Dispatch event so main.js can update state AND reload data
        const event = new CustomEvent('profileUpdated', {
          detail: {
            firstname: newFirstname,
            settingsChanged: true // Flag to tell main.js to reload data
          }
        });
        window.dispatchEvent(event);

        msg.style.color = 'var(--color-primary-dark)';
        msg.textContent = 'Modifications enregistrées avec succès !';
        // Clear password fields
        form.querySelector('#password').value = '';
        form.querySelector('#confirmData').value = '';
      } catch (err) {
        msg.style.color = '#e57373';
        msg.textContent = 'Erreur : ' + err.message;
      }
    });

    // Backup Event Listeners
    const btnExport = container.querySelector('#btn-export');
    btnExport.addEventListener('click', async () => {
        try {
            btnExport.textContent = '⏳ Export en cours...';
            await API.exportData();
            btnExport.textContent = '✅ Export terminé';
            setTimeout(() => btnExport.textContent = '📥 Exporter mes données', 3000);
        } catch (e) {
            Modal.alert('Erreur', 'Erreur export: ' + e.message);
            btnExport.textContent = '📥 Exporter mes données';
        }
    });

    const btnImportTrigger = container.querySelector('#btn-import-trigger');
    const importFile = container.querySelector('#import-file');

    btnImportTrigger.addEventListener('click', () => importFile.click());

    importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirmed = await Modal.confirm(
            'Importer des données',
            'Attention : L\'importation va fusionner les données. Voulez-vous continuer ?'
        );

        if (!confirmed) {
            importFile.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const jsonData = JSON.parse(evt.target.result);
                btnImportTrigger.textContent = '⏳ Import...';
                
                await API.importData(jsonData);
                
                await Modal.alert('Importation réussie', 'Importation réussie ! La page va se recharger.');
                window.location.reload();
            } catch (err) {
                Modal.alert('Erreur', 'Erreur lors de l\'importation : ' + err.message);
                btnImportTrigger.textContent = '📤 Importer...';
                importFile.value = '';
            }
        };
        reader.readAsText(file);
    }); 
    
    // Add Privacy Link and Delete Account
    const deleteSection = document.createElement('div');
    deleteSection.innerHTML = `
        <div style="border-top: 1px solid #eee; margin: 10px 0;"></div>
        <h3>Zone de Danger</h3>
        <p style="font-size:0.85rem; color:#666;">Une fois votre compte supprimé, il n'y a pas de retour en arrière. Soyez certain.</p>
        <button type="button" id="btn-delete-account" style="background-color: #ffebee; color: #c62828; border: 1px solid #ef9a9a; width: 100%; margin-top: 10px;" class="btn-secondary">
            🗑️ Supprimer mon compte
        </button>
    `;
    
    // Insert before submit
    const submitBtn = form.querySelector('button[type="submit"]');
    form.insertBefore(deleteSection, submitBtn); // Actually insert before submit is seemingly weird UI wise. Usually at bottom.
    
    // Let's change strategy: append to form.
    
    // Wait, the form has the submit button at the end.
    // Let's add it AFTER the form or at the very bottom of form.
    // Current helper attaches to 'form'.
    
    // Re-doing the append safely:
    form.appendChild(deleteSection);
    
    form.querySelector('#btn-delete-account').addEventListener('click', async () => {
        const confirmed = await Modal.confirm(
            'Zone de Danger',
            "⚠️ Êtes-vous ABSOLUMENT sûr ?\n\nCette action supprimera définitivement votre compte et toutes vos données (cycles, symptômes, etc.).\n\nIl est impossible d'annuler."
        );
        if (confirmed) {
             const doubleCheck = await Modal.prompt(
                 'Confirmation requise',
                 "Pour confirmer, tapez 'SUPPRIMER' en majuscules :",
                 "",
                 "text"
             );
             
             if (doubleCheck === 'SUPPRIMER') {
                 try {
                     // Using raw fetch here or add method to API. let's add method dynamically or manually call request
                     await API.request('/api/users/me', { method: 'DELETE' });
                     await Modal.alert('Compte supprimé', 'Compte supprimé avec succès. Au revoir !');
                     // Logout
                     localStorage.clear();
                     window.location.reload();
                 } catch(e) {
                     Modal.alert('Erreur', 'Erreur: ' + e.message);
                 }
             }
        }
    });


    // Enable scroll to change numbers
    const numberInputs = container.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('wheel', (e) => {
            if (document.activeElement === input || input.matches(':hover')) {
                e.preventDefault();
                // DeltaY negative means scrolling UP -> increment
                if (e.deltaY < 0) {
                    input.stepUp();
                } else {
                    input.stepDown();
                }
            }
        }, { passive: false });
    });

    // Reset Defaults Handler
    container.querySelector('#btn-reset-cycle').addEventListener('click', () => {
        container.querySelector('#cycleLen').value = 28;
        container.querySelector('#periodLen').value = 5;
        container.querySelector('#lutealLen').value = 14;
    });

    // Auto-Calc Handler
    container.querySelector('#btn-calc-avg').addEventListener('click', async () => {
         const btn = container.querySelector('#btn-calc-avg');
         const originalText = btn.textContent;
         btn.textContent = '⏳ Calcul en cours...';
         
         try {
             const data = await Storage.getData(); // Need full data for calculator
             if (!data.cycles || data.cycles.length < 2) {
                 Modal.alert("Attention", "Il faut au moins 2 cycles enregistrés pour calculer une moyenne fiable.");
                 btn.textContent = originalText;
                 return;
             }
             
             const stats = CycleCalculator.getHistoryStats(data);
             
             if (stats.avgCycle > 0) container.querySelector('#cycleLen').value = stats.avgCycle;
             if (stats.avgPeriod > 0) container.querySelector('#periodLen').value = stats.avgPeriod;
             
             // Visual feedback
             btn.textContent = '✅ Moyennes appliquées !';
             setTimeout(() => btn.textContent = originalText, 2000);
             
         } catch(e) {
             console.error(e);
             Modal.alert("Erreur", "Erreur lors du calcul.");
             btn.textContent = originalText;
         }
    });

    // Share Validation Logic
    const shareSection = container.querySelector('#share-section');
    const shareInfo = container.querySelector('#share-info');
    const shareCodeDisplay = container.querySelector('#share-code-display');
    const shareLinkInput = container.querySelector('#share-link-input');
    const btnGenerate = container.querySelector('#btn-share-generate');
    const btnRevoke = container.querySelector('#btn-share-revoke');

    const updateShareUI = (token) => {
        if (token) {
            btnGenerate.style.display = 'none';
            shareInfo.style.display = 'block';
            shareCodeDisplay.textContent = token;
            shareLinkInput.value = `${window.location.origin}/?share=${token}`;
        } else {
            btnGenerate.style.display = 'block';
            shareInfo.style.display = 'none';
            shareCodeDisplay.textContent = '';
            shareLinkInput.value = '';
        }
    };

    // Initial State
    updateShareUI(shareData.token);

    btnGenerate.addEventListener('click', async () => {
        try {
            btnGenerate.textContent = '⏳ Génération...';
            const res = await API.createShareToken();
            updateShareUI(res.token);
            btnGenerate.textContent = '🔗 Générer un lien de partage';
        } catch(e) {
            Modal.alert('Erreur', 'Erreur: ' + e.message);
            btnGenerate.textContent = '🔗 Générer un lien de partage';
        }
    });

    btnRevoke.addEventListener('click', async () => {
        const confirmed = await Modal.confirm(
            'Désactiver le partage',
            'Voulez-vous vraiment désactiver ce lien ? Le partenaire ne pourra plus accéder à vos données.'
        );
        if (confirmed) {
             try {
                await API.deleteShareToken();
                updateShareUI(null);
            } catch(e) {
                Modal.alert('Erreur', 'Erreur: ' + e.message);
            }
        }
    });

  } catch (e) {
    container.innerHTML =
      '<div style="color:red; text-align:center;">Erreur lors du chargement du profil.</div>';
  }
}
