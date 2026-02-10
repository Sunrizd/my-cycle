import { CycleCalculator } from '../cycleCalculator.js';
import { Modal } from './modal.js';

export const Stats = {
    show(data) {
        const stats = CycleCalculator.getHistoryStats(data);
        const modal = Modal._createModal('Statistiques', '');
        const content = modal.querySelector('.modal-content');
        
        // Remove default message 
        const msg = content.querySelector('.modal-message');
        if(msg) msg.remove();

        content.style.maxWidth = '600px';
        content.style.width = '90%';

        // Header StatsGrid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '15px';
        grid.style.marginBottom = '25px';

        grid.innerHTML = `
            <div style="background: var(--color-bg-secondary); padding: 15px; border-radius: 12px; text-align: center;">
                <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 5px;">Cycle Moyen</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: var(--color-primary);">${stats.avgCycle || '-'} <span style="font-size: 1rem;">jours</span></div>
            </div>
            <div style="background: var(--color-bg-secondary); padding: 15px; border-radius: 12px; text-align: center;">
                <div style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 5px;">Règles Moyennes</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: var(--color-accent);">${stats.avgPeriod || '-'} <span style="font-size: 1rem;">jours</span></div>
            </div>
        `;

        // Chart Container
        const chartContainer = document.createElement('div');
        chartContainer.style.marginTop = '20px';
        
        if (stats.history.length > 0) {
            chartContainer.innerHTML = `
                <h4 style="margin-bottom: 15px;">Évolution (6 derniers cycles)</h4>
                <div style="display: flex; align-items: flex-end; gap: 8px; height: 150px; border-bottom: 1px solid var(--color-border); padding-bottom: 5px;">
                    ${renderBars(stats.history.slice(-6))}
                </div>
            `;
        } else {
             chartContainer.innerHTML = `<p style="text-align:center; color: var(--color-text-muted);">Pas assez de données pour le graphique.</p>`;
        }

        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fermer';
        closeBtn.className = 'btn-primary';
        closeBtn.style.marginTop = '25px';
        closeBtn.style.width = '100%';
        closeBtn.onclick = () => Modal._close(modal);

        // Escape handling
        modal._escHandler = (e) => {
            if (e.key === 'Escape') {
              Modal._close(modal);
            }
        };
        document.addEventListener('keydown', modal._escHandler);

        content.appendChild(grid);
        content.appendChild(chartContainer);
        content.appendChild(closeBtn);

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('open'));
    }
};

function renderBars(history) {
    // Find max value for scaling
    const maxVal = Math.max(...history.map(h => h.cycleLength), 35);
    
    return history.map(h => {
        const height = (h.cycleLength / maxVal) * 100;
        const date = new Date(h.date);
        const label = `${date.getDate()}/${date.getMonth()+1}`;
        
        return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                <div style="font-size: 0.75rem; font-weight: bold; color: var(--color-primary);">${h.cycleLength}</div>
                <div style="width: 100%; background: var(--color-primary-light); height: ${height}%; border-radius: 4px 4px 0 0; min-height: 4px; position:relative; transition: height 0.5s ease;"></div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">${label}</div>
            </div>
        `;
    }).join('');
}
