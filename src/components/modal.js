export const Modal = {
  /**
   * Show a confirmation modal
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  /**
   * Show an alert modal
   * @param {string} title
   * @param {string} message
   * @param {string} buttonText
   * @returns {Promise<void>}
   */
  alert(title, message, buttonText = 'OK') {
      return new Promise((resolve) => {
          const modal = this._createModal(title, message);
          
          modal._escHandler = (e) => {
              if (e.key === 'Escape') {
                  this._close(modal);
                  resolve();
              }
          };
          document.addEventListener('keydown', modal._escHandler);

          const btnContainer = document.createElement('div');
          btnContainer.className = 'modal-actions';
          // Center the button for alert
          btnContainer.style.justifyContent = 'center';

          const okBtn = document.createElement('button');
          okBtn.className = 'btn-primary';
          okBtn.textContent = buttonText;
          okBtn.onclick = () => {
              this._close(modal);
              resolve();
          };

          btnContainer.appendChild(okBtn);
          modal.querySelector('.modal-content').appendChild(btnContainer);

          document.body.appendChild(modal);
          requestAnimationFrame(() => {
              modal.classList.add('open');
              okBtn.focus();
          });
      });
  },

  /**
   * Show a confirmation modal with customizable buttons
   * @param {string} title
   * @param {string} message
   * @param {string} confirmText
   * @param {string} cancelText (pass null to hide cancel)
   * @returns {Promise<boolean>}
   */
  confirm(title, message, confirmText = 'Confirmer', cancelText = 'Annuler') {
    return new Promise((resolve) => {
      const modal = this._createModal(title, message);

      modal._escHandler = (e) => {
        if (e.key === 'Escape') {
          this._close(modal);
          resolve(false);
        }
      };
      document.addEventListener('keydown', modal._escHandler);

      const btnContainer = document.createElement('div');
      btnContainer.className = 'modal-actions';

      if (cancelText) {
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'btn-secondary';
          cancelBtn.textContent = cancelText;
          cancelBtn.onclick = () => {
            this._close(modal);
            resolve(false);
          };
          btnContainer.appendChild(cancelBtn);
      } else {
          // If no cancel, center the confirm?
          btnContainer.style.justifyContent = 'center';
      }

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn-primary';
      confirmBtn.textContent = confirmText;
      confirmBtn.onclick = () => {
        this._close(modal);
        resolve(true);
      };

      btnContainer.appendChild(confirmBtn);
      modal.querySelector('.modal-content').appendChild(btnContainer);

      document.body.appendChild(modal);
      requestAnimationFrame(() => {
          modal.classList.add('open');
          confirmBtn.focus();
      });
    });
  },

  /**
   * Show a prompt modal
   * @param {string} title
   * @param {string} message
   * @returns {Promise<string|null>}
   */
  /**
   * Show a detailed edit modal with mood and note
   * @param {string} title
   * @param {string} dateStr
   * @param {string} dateStr
   * @param {object} initialData { note: '', mood: '' }
   * @param {string} extraHtml Optional HTML to insert before the form
   * @returns {Promise<object|null>} { note, mood }
   */
  editDay(title, dateStr, initialData = {}, extraHtml = '') {
    return new Promise((resolve) => {
      const modal = this._createModal(title, `Détails pour le ${dateStr}`);
      
      modal._escHandler = (e) => {
        if (e.key === 'Escape') {
          this._close(modal);
          resolve(null);
        }
      };
      document.addEventListener('keydown', modal._escHandler);

      const content = modal.querySelector('.modal-content');

      // Insert Extra HTML (Phase info)
      if (extraHtml) {
          const infoDiv = document.createElement('div');
          infoDiv.innerHTML = extraHtml;
          infoDiv.style.marginBottom = '16px';
          content.appendChild(infoDiv);
      }

      // Mood Selector

      // 1. Bleeding Selector
      const bleedingContainer = document.createElement('div');
      bleedingContainer.style.marginBottom = '15px';
      bleedingContainer.innerHTML = '<label style="display:block; margin-bottom:5px; font-weight:bold;">Flux (si règles)</label>';
      
      const bleedingOptions = [
          { value: 'light', icon: '/icons/bleeding-light.svg', title: 'Léger' },
          { value: 'medium', icon: '/icons/bleeding-medium.svg', title: 'Moyen' },
          { value: 'heavy', icon: '/icons/bleeding-heavy.svg', title: 'Abondant' },
          { value: 'flooding', icon: '/icons/bleeding-flooding.svg', title: 'Très Abondant' }
      ];
      
      const bleedingBtnGroup = document.createElement('div');
      bleedingBtnGroup.className = 'bleeding-selector';
      bleedingBtnGroup.style.display = 'flex';
      bleedingBtnGroup.style.gap = '10px';
      bleedingBtnGroup.style.justifyContent = 'center';

      let selectedBleeding = initialData.bleeding || '';

      bleedingOptions.forEach(opt => {
          const btn = document.createElement('button');
          btn.title = opt.title;
          btn.className = `bleeding-btn ${selectedBleeding === opt.value ? 'selected' : ''}`;
          btn.style.padding = '8px';
          btn.style.border = '1px solid var(--color-border)';
          btn.style.borderRadius = '12px'; // slightly less rounded for icons
          btn.style.background = 'white';
          btn.style.cursor = 'pointer';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          
          const img = document.createElement('img');
          img.src = opt.icon;
          img.alt = opt.title;
          img.style.width = '32px';
          img.style.height = '32px';
          btn.appendChild(img);

          if (selectedBleeding === opt.value) {
               btn.style.background = '#ffebee';
               btn.style.borderColor = '#e57373';
          }

          btn.onclick = () => {
              if (selectedBleeding === opt.value) {
                  selectedBleeding = '';
                  btn.style.background = 'white';
                  btn.style.borderColor = 'var(--color-border)';
              } else {
                  selectedBleeding = opt.value;
                  // Reset others
                  Array.from(bleedingBtnGroup.children).forEach(b => {
                      b.style.background = 'white';
                      b.style.borderColor = 'var(--color-border)';
                  });
                  btn.style.background = '#ffebee';
                  btn.style.borderColor = '#e57373';
              }
          };
          bleedingBtnGroup.appendChild(btn);
      });
      bleedingContainer.appendChild(bleedingBtnGroup);


      // 2. Mood Selector
      const moodLabel = document.createElement('label');
      moodLabel.textContent = 'Humeur globale';
      moodLabel.style.fontWeight = 'bold';
      moodLabel.style.display = 'block';
      moodLabel.style.marginTop = '15px';

      const moods = ['🙂', '😐', '😞', '😡', '🤢', '🥰'];
      const moodContainer = document.createElement('div');
      moodContainer.className = 'mood-selector';
      
      let selectedMood = initialData.mood || '';

      moods.forEach((emoji) => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.className = `mood-btn ${selectedMood === emoji ? 'selected' : ''}`;
        btn.onclick = () => {
          // Toggle selection
          if (selectedMood === emoji) {
            selectedMood = '';
            btn.classList.remove('selected');
          } else {
            selectedMood = emoji;
            // Deselect others
            moodContainer
              .querySelectorAll('.mood-btn')
              .forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
          }
        };
        moodContainer.appendChild(btn);
      });

      // 3. Detailed Symptoms (1-5 Scale)
      const symptomList = [
          { key: 'cramps', label: 'Crampes' },
          { key: 'headache', label: 'Maux de tête' },
          { key: 'fatigue', label: 'Fatigue' },
          { key: 'bloating', label: 'Ballonnements' },
          { key: 'acne', label: 'Acné' },
          { key: 'breasts', label: 'Seins sensibles' }
      ];

      const symptomsContainer = document.createElement('div');
      symptomsContainer.style.marginTop = '15px';
      symptomsContainer.innerHTML = '<label style="display:block; margin-bottom:10px; font-weight:bold;">Symptômes</label>';
      
      const currentDetails = initialData.details || {};
      const symptomValues = { ...currentDetails };

      symptomList.forEach(sym => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.marginBottom = '8px';
          
          const label = document.createElement('span');
          label.textContent = sym.label;
          label.style.fontSize = '0.9rem';
          label.style.fontWeight = '500';

          const stars = document.createElement('div');
          stars.style.display = 'flex';
          stars.style.gap = '4px';
          
          let val = symptomValues[sym.key] || 0;

          for(let i=1; i<=5; i++) {
              const dot = document.createElement('span');
              dot.style.width = '12px';
              dot.style.height = '12px';
              dot.style.borderRadius = '50%';
              dot.style.border = '1px solid var(--color-primary)';
              dot.style.cursor = 'pointer';
              dot.style.background = i <= val ? 'var(--color-primary)' : 'transparent';
              
              dot.onclick = () => {
                  if (val === i) val = 0; // toggle off if clicking same
                  else val = i;
                  
                  symptomValues[sym.key] = val;
                  
                  // Update visuals
                  Array.from(stars.children).forEach((d, idx) => {
                      d.style.background = (idx + 1) <= val ? 'var(--color-primary)' : 'transparent';
                  });
              };
              stars.appendChild(dot);
          }

          row.appendChild(label);
          row.appendChild(stars);
          symptomsContainer.appendChild(row);
      });


      // 4. Note Input
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'modal-input';
      input.value = initialData.note || '';
      input.placeholder = 'Ajouter une note...';
      input.style.marginTop = '15px';
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this._close(modal);
          resolve({ 
              note: input.value, 
              mood: selectedMood,
              bleeding: selectedBleeding,
              details: symptomValues
          });
        }
      };

      // Buttons
      const btnContainer = document.createElement('div');
      btnContainer.className = 'modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-secondary';
      cancelBtn.textContent = 'Annuler';
      cancelBtn.onclick = () => {
        this._close(modal);
        resolve(null);
      };

      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn-secondary';
      resetBtn.textContent = 'Effacer';
      resetBtn.style.color = '#e57373';
      resetBtn.style.marginRight = 'auto'; // Push others to right
      resetBtn.onclick = async () => {
          const confirmed = await this.confirm(
              'Effacer le jour',
              'Voulez-vous vraiment effacer toutes les données de ce jour ?',
              'Effacer',
              'Annuler'
          );
          if (confirmed) {
              // 1. Reset Internal State
              selectedBleeding = '';
              selectedMood = '';
              
              // 2. Reset Bleeding UI
              Array.from(bleedingBtnGroup.children).forEach(b => {
                  b.style.background = 'white';
                  b.style.borderColor = 'var(--color-border)';
                  b.classList.remove('selected');
              });

              // 3. Reset Mood UI
              moodContainer.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));

              // 4. Reset Symptoms UI & State
              Object.keys(symptomValues).forEach(key => symptomValues[key] = 0);
              // Reset all stars to transparent
              symptomsContainer.querySelectorAll('div[style*="display: flex"] span').forEach(dot => {
                  dot.style.background = 'transparent';
              });

              // 5. Reset Note
              input.value = '';
          }
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn-primary';
      confirmBtn.textContent = 'Enregistrer';
      confirmBtn.onclick = () => {
        this._close(modal);
        resolve({ 
            note: input.value, 
            mood: selectedMood,
            bleeding: selectedBleeding,
            details: symptomValues
        });
      };

      btnContainer.appendChild(resetBtn);
      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(confirmBtn);

      // Assemble
      // Remove the default p.modal-message created by _createModal to clean up
      const msg = content.querySelector('.modal-message');
      if (msg) msg.remove();

      content.appendChild(bleedingContainer);
      content.appendChild(moodLabel);
      content.appendChild(moodContainer);
      content.appendChild(symptomsContainer);
      content.appendChild(input);
      content.appendChild(btnContainer);

      document.body.appendChild(modal);
      requestAnimationFrame(() => {
        modal.classList.add('open');
        input.focus();
      });
    });
  },

  /**
   * Show a modal to edit cycle dates
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   * @param {boolean} canDelete
   * @param {number} defaultDuration
   * @returns {Promise<object|null>} { startDate, endDate } or null
   */
  editCycle(title, startDate, endDate, canDelete = true, defaultDuration = 0) {
    return new Promise((resolve) => {
      const modal = this._createModal(title, 'Modifier les dates du cycle');
      
      modal._escHandler = (e) => {
        if (e.key === 'Escape') {
          this._close(modal);
          resolve(null);
        }
      };
      document.addEventListener('keydown', modal._escHandler);

      const content = modal.querySelector('.modal-content');

      // Remove default message if any
      const msg = content.querySelector('.modal-message');
      if (msg) msg.remove();

      // Form Container
      const form = document.createElement('div');
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      form.style.gap = '15px';
      form.style.marginBottom = '20px';

      // Start Date
      const grp1 = document.createElement('div');
      grp1.className = 'form-group';
      grp1.innerHTML = `
                <label>Début des règles</label>
                <input type="date" id="cycle-start" value="${startDate}" class="modal-input" style="margin-bottom:0;">
            `;

      // End Date
      // Pre-calculate end date if adding new and defaultDuration is set
      let initialEnd = endDate;
      
      const grp2 = document.createElement('div');
      grp2.className = 'form-group';
      grp2.innerHTML = `
                <label>Fin des règles (optionnel)</label>
                <input type="date" id="cycle-end" value="${initialEnd || ''}" class="modal-input" style="margin-bottom:0;">
            `;

      form.appendChild(grp1);
      form.appendChild(grp2);
      content.appendChild(form);

      // Auto-update logic
      const startInput = form.querySelector('#cycle-start');
      const endInput = form.querySelector('#cycle-end');
      
      // Removed auto-calculation logic to prevent unwanted default values

      // Actions
      const btnContainer = document.createElement('div');
      btnContainer.className = 'modal-actions';

      const deleteBtn = document.createElement('button');
      if (canDelete) {
          deleteBtn.className = 'btn-secondary'; // or a danger class if available
          deleteBtn.style.color = '#e57373';
          deleteBtn.style.border = '1px solid #e57373';
          deleteBtn.textContent = 'Supprimer';
          deleteBtn.onclick = async () => {
            const confirmed = await this.confirm(
              'Supprimer',
              'Voulez-vous vraiment supprimer ce cycle ?'
            );
            if (confirmed) {
              this._close(modal);
              resolve({ delete: true });
            }
          };
      }

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-secondary';
      cancelBtn.textContent = 'Annuler';
      cancelBtn.onclick = () => {
        this._close(modal);
        resolve(null);
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn-primary';
      confirmBtn.textContent = 'Enregistrer';
      confirmBtn.onclick = () => {
        const s = form.querySelector('#cycle-start').value;
        const e = form.querySelector('#cycle-end').value;
        if (!s) {
          this.alert('Erreur', 'La date de début est requise');
          return;
        }
        this._close(modal);
        resolve({ startDate: s, endDate: e || null });
      };

      // Order: Delete (Left), Cancel, Save (Right)
      if (canDelete) btnContainer.appendChild(deleteBtn);
      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(confirmBtn);
      content.appendChild(btnContainer);

      document.body.appendChild(modal);
      requestAnimationFrame(() => modal.classList.add('open'));
    });
  },

  prompt(title, message, defaultValue = '', inputType = 'text', confirmText = 'Ajouter') {
    return new Promise((resolve) => {
      const modal = this._createModal(title, message);
      
      modal._escHandler = (e) => {
        if (e.key === 'Escape') {
          this._close(modal);
          resolve(null);
        }
      };
      document.addEventListener('keydown', modal._escHandler);

      const input = document.createElement('input');
      input.type = inputType;
      input.className = 'modal-input';
      input.value = defaultValue;
      input.placeholder = '';
      
      // Focus input
      // If date input, focus might not open picker, but good to focus
      
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this._close(modal);
          resolve(input.value);
        }
      };

      const btnContainer = document.createElement('div');
      btnContainer.className = 'modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-secondary';
      cancelBtn.textContent = 'Annuler';
      cancelBtn.onclick = () => {
        this._close(modal);
        resolve(null);
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn-primary';
      confirmBtn.textContent = confirmText;
      confirmBtn.onclick = () => {
        this._close(modal);
        resolve(input.value);
      };

      btnContainer.appendChild(cancelBtn);
      btnContainer.appendChild(confirmBtn);

      const content = modal.querySelector('.modal-content');
      content.appendChild(input);
      content.appendChild(btnContainer);

      document.body.appendChild(modal);
      requestAnimationFrame(() => {
        modal.classList.add('open');
        input.focus();
      });
    });
  },

  _createModal(title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                </div>
            </div>
        `;
    return overlay;
  },

  _close(modal) {
    if (modal._escHandler) {
      document.removeEventListener('keydown', modal._escHandler);
      modal._escHandler = null;
    }
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }
};
