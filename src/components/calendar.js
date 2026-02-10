import { CycleCalculator } from '../cycleCalculator.js';

export function renderCalendar(currentDate, data, readOnly = false) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday start (0=Mon, 6=Sun) - Standard in France
  const startOffset = (firstDay + 6) % 7;

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre'
  ];

  let html = `
        <section class="calendar-card ${readOnly ? 'read-only' : ''}">
            <div class="calendar-header">
                <button id="btn-prev-month" class="btn-nav">◄</button>
                <span class="month-title" style="min-width: 150px; text-align: center;">${monthNames[month]} ${year}</span>
                <button id="btn-next-month" class="btn-nav">►</button>
                <button id="btn-current-month" class="btn-nav" style="font-size: 0.8rem; margin-left: 8px;" title="Revenir au mois actuel">Ce mois</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">L</div>
                <div class="calendar-day-header">M</div>
                <div class="calendar-day-header">M</div>
                <div class="calendar-day-header">J</div>
                <div class="calendar-day-header">V</div>
                <div class="calendar-day-header">S</div>
                <div class="calendar-day-header">D</div>
    `;

  // Empty cells
  for (let i = 0; i < startOffset; i++) {
    html += `<div class="empty-day"></div>`;
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    let classes = 'calendar-day';

    // Check if date is in a specific phase
    let phaseClass = '';

    let activeCycle = data.cycles.find((c) => c.startDate <= dateStr);
    
    // 1. Check for Real Cycle
    let titleText = '';

    // 1. Check for Real Cycle
    if (activeCycle) {
      const current = new Date(dateStr);
      let start = new Date(activeCycle.startDate);
      
      // Anomaly Correction (Match CycleCalculator logic)
      if (activeCycle.endDate) {
         const end = new Date(activeCycle.endDate);
         const periodLen = parseInt(data.settings.averagePeriodLength, 10);
         const dur = (end - start) / (1000 * 60 * 60 * 24);
         if (dur > periodLen + 14) {
             start = new Date(end);
             start.setDate(start.getDate() - periodLen);
         }
      }

      // Validate date
      if (isNaN(start.getTime())) {
        activeCycle = null;
      } else {
        current.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);

        const diffTime = current - start;
        if (diffTime >= 0) {
          const dayInCycle = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          // Determine Cycle Length properly
          let totalCycleLen = CycleCalculator.calculateSmartCycleLength(data);
          
          // If there is a newer cycle, use the diff between starts as the TRUE length
          // Data is sorted DESC (Newest first). So newer cycle is at index - 1.
          const currentIndex = data.cycles.indexOf(activeCycle);
          if (currentIndex > 0) { // If not the very first (latest) one
             const newerCycle = data.cycles[currentIndex - 1];
             const newerStart = new Date(newerCycle.startDate);
             newerStart.setHours(0,0,0,0);
             totalCycleLen = Math.round((newerStart - start) / (1000 * 60 * 60 * 24));
          }

          let periodLen = parseInt(data.settings.averagePeriodLength, 10);
          if (activeCycle.endDate) {
              const end = new Date(activeCycle.endDate);
              const start = new Date(activeCycle.startDate);
              end.setHours(0,0,0,0);
              start.setHours(0,0,0,0);
              const diff = (end - start) / (1000 * 60 * 60 * 24);
              if (diff >= 0) {
                  periodLen = Math.floor(diff) + 1;
              }
          }

          if (dayInCycle <= totalCycleLen) {
            const lutealLen = parseInt(data.settings.lutealPhaseLength, 10) || 14;
            const ovulationDay = totalCycleLen - lutealLen;
            const fertileStart = ovulationDay - 5;
            const fertileEnd = ovulationDay + 1;

                // Phase Calculation for Tooltip (Allow Overlap)
                const phases = [];
                if (dayInCycle < ovulationDay) phases.push('Folliculaire');
                if (dayInCycle > ovulationDay) phases.push('Lutéale');
                
                if (dayInCycle <= periodLen) phases.push('Règles');
                if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) phases.push('Fertilité');
                if (dayInCycle === ovulationDay) phases.push('Ovulation');

                const prefix = activeCycle ? '' : '(Prévu) ';
                titleText = `${prefix}${phases.join(' + ')}: Jour ${dayInCycle}`;

                // CSS Class Priority (Visual Only)
                if (dayInCycle <= periodLen) {
                     phaseClass = activeCycle ? 'phase-period' : 'phase-period predicted';
                } else if (dayInCycle === ovulationDay) {
                     phaseClass = activeCycle ? 'phase-ovulation' : 'phase-ovulation predicted';
                } else if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
                     phaseClass = activeCycle ? 'phase-fertile' : 'phase-fertile predicted';
                } else if (dayInCycle < ovulationDay) {
                     phaseClass = activeCycle ? 'phase-follicular' : 'phase-follicular predicted';
                } else {
                     phaseClass = activeCycle ? 'phase-luteal' : 'phase-luteal predicted';
                }
          } else {
            activeCycle = null;
          }
        }
      }
    } 
    
    // 2. If NO real cycle, check for Predicted Cycle
    if (!activeCycle) {
       const predictedStart = CycleCalculator.predictNextPeriod(data);
       if (predictedStart) {
           const current = new Date(dateStr);
           current.setHours(0,0,0,0);
           predictedStart.setHours(0,0,0,0);
           
           const diffTime = current - predictedStart;
           const totalCycleLen = CycleCalculator.calculateSmartCycleLength(data);
           
           if (diffTime >= 0) {
               // Infinite Prediction
               const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
               const dayInCycle = (rawDays % totalCycleLen) + 1;
               
               const periodLen = parseInt(data.settings.averagePeriodLength, 10);
               
               if (dayInCycle <= totalCycleLen) {
                    const lutealLen = parseInt(data.settings.lutealPhaseLength, 10) || 14;
                    const ovulationDay = totalCycleLen - lutealLen;
                    const fertileStart = ovulationDay - 5;
                    const fertileEnd = ovulationDay + 1;

                    // Phase Calculation for Tooltip (Allow Overlap)
                    const phases = [];
                    if (dayInCycle < ovulationDay) phases.push('Folliculaire');
                    if (dayInCycle > ovulationDay) phases.push('Lutéale');
                    
                    if (dayInCycle <= periodLen) phases.push('Règles');
                    if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) phases.push('Fertilité');
                    if (dayInCycle === ovulationDay) phases.push('Ovulation');

                    titleText = `(Prévu) ${phases.join(' + ')}: Jour ${dayInCycle}`;

                    // CSS Priority
                    if (dayInCycle <= periodLen) {
                      phaseClass = 'phase-period predicted'; 
                    } else if (dayInCycle === ovulationDay) {
                      phaseClass = 'phase-ovulation predicted';
                    } else if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
                      phaseClass = 'phase-fertile predicted';
                    } else if (dayInCycle < ovulationDay) {
                      phaseClass = 'phase-follicular predicted';
                    } else {
                      phaseClass = 'phase-luteal predicted';
                    }
               }
           }
       }
    }

    if (phaseClass) classes += ` ${phaseClass}`;

    // Still use isPeriod check for 'active' class (bold/primary color) for confirmed period days
    // We can just rely on phase-period for visual, but 'active' was used before.
    // Let's keep 'active' if it's strictly in the period range of a logged cycle.
    const isPeriodRange = data.cycles.some((cycle) => {
      const start = new Date(cycle.startDate);
      const check = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      check.setHours(0, 0, 0, 0);
      const diff = (check - start) / (1000 * 60 * 60 * 24);

      let pLen = parseInt(data.settings.averagePeriodLength, 10);
      if (cycle.endDate) {
          const end = new Date(cycle.endDate);
          end.setHours(0,0,0,0);
          const d = (end - start) / (1000 * 60 * 60 * 24);
          if (d >= 0) pLen = Math.floor(d) + 1;
      }

      // Check for exact start
      if (diff === 0) classes += ' period-start';

      // Check for exact end
      if (diff === pLen - 1) classes += ' period-end';

      return diff >= 0 && diff < pLen;
    });

    if (isPeriodRange) classes += ' active';

    // Check if has note
    if (data.symptoms[dateStr] && data.symptoms[dateStr].note) {
      classes += ' has-note';
    }

    // Check if today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) classes += ' today';

    html += `<div class="${classes}" data-date="${dateStr}" title="${titleText}">${day}`;

    // Render Mood if exists
    if (data.symptoms[dateStr] && data.symptoms[dateStr].mood) {
      html += `<span class="mood-indicator">${data.symptoms[dateStr].mood}</span>`;
    }

    html += `</div>`;
  }

  html += `
            </div>
            
            <!-- Legend -->
            <div class="calendar-legend" style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; margin-top: 15px; font-size: 0.9rem; padding: 0 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; background: var(--phase-period-bg); border-radius: 50%; display: inline-block;"></span>
                    <span>Règles</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; background: var(--phase-follicular-bg); border-radius: 50%; display: inline-block;"></span>
                    <span>Folliculaire</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; background: var(--phase-fertile-bg); border-radius: 50%; display: inline-block;"></span>
                    <span>Fertile</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; background: var(--phase-ovulation-bg); border: 1px solid var(--phase-ovulation-text); border-radius: 50%; display: inline-block;"></span>
                    <span>Ovulation</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; background: var(--phase-luteal-bg); border-radius: 50%; display: inline-block;"></span>
                    <span>Lutéale</span>
                </div>
            </div>
        </section>
    `;

  return html;
}
