import { Storage } from './storage.js';
import { Modal } from './components/modal.js';
import { API } from './api.js';
import { CycleCalculator } from './cycleCalculator.js';

export const Handlers = {
  async handleLogPeriod(refreshApp) {
    const today = new Date().toISOString().split('T')[0];
    const dateStr = await Modal.prompt(
      'Enregistrer les règles',
      'Veuillez sélectionner la date de début :',
      today,
      'date',
      'Valider'
    );

    if (dateStr) {
      await Storage.logPeriodStart(dateStr);
      refreshApp(); // Reload data/render handled by main or wrapper
    }
  },

  async handleEndPeriod(refreshApp) {
    const today = new Date().toISOString().split('T')[0];
    const confirmed = await Modal.confirm(
      'Fin des règles',
      `Vos règles sont-elles terminées aujourd'hui (${today}) ?`
    );

    if (confirmed) {
      await Storage.logPeriodEnd(today);
      refreshApp();
    }
  },

  async handleDayClick(date, appData, refreshApp) {
    if (!date) return;

    // Get existing data
    const dayData = appData.symptoms[date] || {};
    const existingNote = dayData.note || '';
    const existingMood = dayData.mood || '';
    const existingBleeding = dayData.bleeding || '';
    const existingDetails = dayData.details || {};

    // Get Phase Details
    const phaseInfo = CycleCalculator.getPhaseDetailsForDate(date, appData);
    
    let viewHtml = '';
    
    // Add Phase Banner
    if (phaseInfo) {
        const icon = phaseInfo.phase === 'period' ? '🩸' 
                   : phaseInfo.phase === 'ovulation' ? '🥚' 
                   : phaseInfo.phase === 'fertile' ? '🌿' 
                   : phaseInfo.phase === 'luteal' ? '🍂' : '🌱';
                   
        const predictedLabel = phaseInfo.isPredicted ? '(Prévision)' : '';
        const color = phaseInfo.phase === 'period' ? 'var(--color-accent)' 
                    : phaseInfo.phase === 'ovulation' ? '#7b1fa2' 
                    : 'var(--color-primary-dark)';
        
        viewHtml += `
            <div style="background: ${phaseInfo.phase === 'period' ? 'var(--color-bg)' : '#f8f9fa'}; 
                        padding: 10px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.05);">
                <div style="font-weight: 600; color: ${color}; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">${icon}</span>
                    <span>${phaseInfo.label} ${predictedLabel}</span>
                </div>
            </div>
        `;
    }

    // Direct Edit Mode with Info
    const result = await Modal.editDay('Modifier le jour', date, {
      note: existingNote,
      mood: existingMood,
      bleeding: existingBleeding,
      details: existingDetails
    }, viewHtml); // Pass the phase banner HTML here

    if (result) {
      // If closing empty note/mood, we still want to save empty to clear it?
      // Check if user confirmed or cancelled (result is null on cancel)
      
      // Save if any field has content, OR if we need to clear (saving empty object/strings)
      if (result.note || result.mood || result.bleeding || (result.details && Object.values(result.details).some(v => v > 0))) {
        await Storage.logSymptom(date, result);
      } else {
        // If empty, clear it? Or just save empty strings?
        // Let's save empty strings to effectively "delete" the entry
        await Storage.logSymptom(date, { note: '', mood: '' });
      }
      refreshApp();
    }
  },



  async handleAddCycle(appData, refreshApp) {
     const today = new Date().toISOString().split('T')[0];
     const periodLen = appData.settings.averagePeriodLength || 5;
     const result = await Modal.editCycle('Ajouter un cycle', today, '', false, periodLen); 
          
     if (result) {
         try {
             await API.addCycle(result.startDate, result.endDate);
             refreshApp();
         } catch (err) {
             Modal.alert('Erreur', 'Erreur : ' + err.message);
         }
     }
  },
  
  async handleEditCycle(cycleId, startDate, endDate, refreshApp) {
      const result = await Modal.editCycle('Modifier le cycle', startDate, endDate);

      if (result) {
        try {
          if (result.delete) {
            await API.deleteCycle(cycleId);
          } else {
            await API.updateCycle(cycleId, result.startDate, result.endDate);
          }
          refreshApp();
        } catch (err) {
          Modal.alert('Erreur', 'Erreur : ' + err.message);
        }
      }
  },

  async handleDeleteUser(userId, refreshView) {
      const confirmed = await Modal.confirm(
          'Supprimer utilisateur',
          'Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?'
      );
      if (confirmed) {
          try {
              await API.deleteUser(userId);
              refreshView();
          } catch (err) {
              Modal.alert('Erreur', 'Erreur lors de la suppression');
          }
      }
  },

  async handleResetUserPassword(userId) {
      const newPassword = await Modal.prompt("Nouveau mot de passe", "Entrez le nouveau mot de passe (min 8 car.) :", "", "password");
      if (newPassword) {
          try {
              await API.resetUserPassword(userId, newPassword);
              await Modal.alert("Succès", "Mot de passe mis à jour avec succès.");
          } catch (err) {
              await Modal.alert("Erreur", "Erreur lors de la mise à jour : " + err.message);
          }
      }
  }
};
