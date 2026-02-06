import { CycleCalculator } from '../cycleCalculator.js';

export function renderDashboard(data, onLogPeriod, username) {
  const daysUntil = CycleCalculator.getDaysUntilNext(data);
  const status = CycleCalculator.getCurrentStatus(data);

  let phaseText = '';
  switch (status.phase) {
    case 'period':
      phaseText = 'Règles en cours';
      break;
    case 'ovulation':
      phaseText = 'Ovulation';
      break;
    case 'fertile':
      phaseText = 'Période Fertile';
      break;
    case 'follicular':
      phaseText = 'Phase Folliculaire';
      break;
    case 'luteal':
      phaseText = 'Phase Lutéale';
      break;
    default:
      phaseText = 'Pas de données';
  }

  // Determine what to show in the circle
  let mainNumber = daysUntil !== null ? daysUntil : '?';
  let mainLabel = 'Jours restants';
  
  // Progress Calculation
  let progressPercentage = 0;
  let progressColor = 'var(--color-primary)';
  
  const cycleLength = parseInt(data.settings.averageCycleLength, 10) || 28;
  const periodLength = parseInt(data.settings.averagePeriodLength, 10) || 5;

  if (status.phase === 'period') {
    const dayOfPeriod = status.dayInCycle;
    mainNumber = `J${dayOfPeriod}`;
    mainLabel = 'Jour des règles';
    
    // Progress based on Period Length
    progressPercentage = Math.min((dayOfPeriod / periodLength) * 100, 100);
    progressColor = 'var(--color-accent)'; // Pink for period
    
  } else {
      // Progress based on Cycle Length
      if (status.dayInCycle) {
          progressPercentage = Math.min((status.dayInCycle / cycleLength) * 100, 100);
          progressColor = 'var(--color-primary)';
      }
  }
  
  const gradientStyle = `background: conic-gradient(${progressColor} 0% ${progressPercentage}%, var(--color-secondary) ${progressPercentage}% 100%);`;

  return `
        <header>
            <div>
                <h1>My Cycle</h1>
                ${username ? `<p style="color: var(--color-text-muted); margin-top: 4px; margin-bottom: 0;">Bonjour ${username}</p>` : ''}
            </div>
            
        </header>

        <section class="dashboard-card">
            <div class="phase-pill">${phaseText}</div>
            <div class="days-circle" style="${gradientStyle}">
                <span class="days-number">${mainNumber}</span>
                <span class="days-label">${mainLabel}</span>
            </div>
            <button id="btn-log-period" class="btn-log">
                ${status.phase === 'period' ? 'Modifier début' : "J'ai mes règles"}
            </button>
            ${
              status.phase === 'period'
                ? `
                <button id="btn-end-period" class="btn-secondary" style="margin-top: 10px; width: 100%; padding: 12px; border-radius: 25px; border: 1px solid var(--color-primary); background: white; color: var(--color-primary); cursor: pointer;">
                    Règles terminées
                </button>
            `
                : ''
            }
        </section>
    `;
}

export function renderHistory(cycles, settings) {
  return `
        <section class="dashboard-card" style="margin-top: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2>Historique</h2>
                <div style="display:flex; gap: 8px;">
                    <button id="btn-stats" class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">📊 Stats</button>
                    <button id="btn-add-cycle" class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">+ Ajouter</button>
                </div>
            </div>
            <div class="history-list">
                ${renderHistoryList(cycles, settings)}
            </div>
        </section>
    `;
}

function renderHistoryList(cycles, settings) {
  if (!cycles || cycles.length === 0) {
    return '<p style="text-align:center; color: var(--color-text-muted);">Aucun cycle enregistré.</p>';
  }

  const avgPeriod = settings ? (parseInt(settings.averagePeriodLength, 10) || 5) : 5;

  return cycles
    .slice(0, 6)
    .map((cycle) => {
      const start = new Date(cycle.startDate);
      const end = cycle.endDate ? new Date(cycle.endDate) : null;
      let duration = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : null;
      
      const isPredicted = duration === null;
      let endDateDisplay = null;
      let isEndPredicted = false;

      if (duration === null) {
          duration = avgPeriod;
          // Calculate predicted end date
          const pEnd = new Date(start);
          pEnd.setDate(start.getDate() + avgPeriod - 1);
          endDateDisplay = pEnd;
          isEndPredicted = true;
      } else {
          endDateDisplay = end;
      }

      return `
            <div class="history-item clickable" data-id="${cycle.id}" data-start="${cycle.startDate}" data-end="${cycle.endDate || ''}" style="cursor: pointer; transition: background 0.2s; border-radius: 8px; padding: 10px;">
                <div class="history-date">
                    <span class="month">${start.toLocaleString('default', { month: 'short' })}</span>
                    <span class="day">${start.getDate()}</span>
                </div>
                <div class="history-details">
                    <span class="duration">${duration} jours</span>
                    <span class="status">Règles ${endDateDisplay ? `• Fin le ${endDateDisplay.toLocaleDateString('default', { day: 'numeric', month: 'short' })}${isEndPredicted ? ' (prévu)' : ''}` : ''}</span>
                </div>
            </div>
        `;
    })
    .join('');
}
