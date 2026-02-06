/**
 * Period Tracker - Cycle Calculator
 * Logic for predicting cycles and fertile windows.
 */



export const CycleCalculator = {
  /**
   * Predict the next period start date.
   * Uses the average cycle length from settings or calculated from history.
   * @param {Object} data - The application data
   * @returns {Date|null} Predicted date or null if no history
   */
    /**
     * Get the effective start date of the current cycle.
     * Corrects for "End Date Only" scenarios where the cycle appears too long.
     */
    getEffectiveStartDate(data) {
        if (!data.cycles || data.cycles.length === 0) return null;
        
        const lastCycle = data.cycles[0];
        let lastDate = new Date(lastCycle.startDate);
        const periodLength = parseInt(data.settings.averagePeriodLength, 10);

        if (lastCycle.endDate) {
            const endDate = new Date(lastCycle.endDate);
            const durationDays = (endDate - lastDate) / (1000 * 60 * 60 * 24);
            
            const lutealLen = parseInt(data.settings.lutealPhaseLength, 10) || 14;
            if (durationDays > periodLength + lutealLen) {
                 lastDate = new Date(endDate);
                 lastDate.setDate(lastDate.getDate() - periodLength);
            }
        }
        return lastDate;
    },

    /**
     * Calculate average cycle length from the last 3 cycles.
     * Falls back to settings if not enough data.
     */
    calculateSmartCycleLength(data) {
        const defaultLen = parseInt(data.settings.averageCycleLength, 10);
        if (!data.cycles || data.cycles.length < 2) return defaultLen;

        // We need at least 2 cycles to calculate ONE duration (Start A to Start B).
        // To get an average of 3 cycles, we need 4 start dates.
        // Let's take up to the last 4 cycles to calculate up to 3 intervals.
        
        const recentCycles = data.cycles.slice(0, 4); // Get latest 4
        let totalDays = 0;
        let intervals = 0;

        for (let i = 0; i < recentCycles.length - 1; i++) {
            const currentStart = new Date(recentCycles[i].startDate);
            const prevStart = new Date(recentCycles[i+1].startDate);
            
            const diffTime = currentStart - prevStart;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            // Basic sanity check: Cycle must be between 10 and 100 days
            if (diffDays > 10 && diffDays < 100) {
                totalDays += diffDays;
                intervals++;
            }
        }

        if (intervals === 0) return defaultLen;
        
        return Math.round(totalDays / intervals);
    },

    predictNextPeriod(data) {
        const lastDate = this.getEffectiveStartDate(data);
        if (!lastDate) return null;

        const cycleLength = this.calculateSmartCycleLength(data);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + cycleLength);
        
        return nextDate;
    },

    /**
     * Calculate the number of days until the next period
     * @param {Object} data 
     * @returns {number|null} Days remaining, or null
     */
    getDaysUntilNext(data) {
        const nextDate = this.predictNextPeriod(data);
        if (!nextDate) return null;

        const today = new Date();
        today.setHours(0,0,0,0);
        nextDate.setHours(0,0,0,0);

        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    },

    /**
     * Get details about the current cycle status
     * @param {Object} data 
     * @returns {Object} { phase: 'period' | 'follicular' | 'ovulation' | 'luteal', dayInCycle: number }
     */
    getCurrentStatus(data) {
        const lastStart = this.getEffectiveStartDate(data);
        if (!lastStart) return { phase: 'unknown', dayInCycle: 0 };

        const today = new Date();
        today.setHours(0,0,0,0);
        lastStart.setHours(0,0,0,0);

        const diffTime = today - lastStart;
        const dayInCycle = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (dayInCycle <= data.settings.averagePeriodLength) {
            return { phase: 'period', dayInCycle };
        }
        
        const cycleLen = this.calculateSmartCycleLength(data);
        const lutealLen = parseInt(data.settings.lutealPhaseLength, 10) || 14;
        const ovulationDay = cycleLen - lutealLen;
        
        // Fertile window: Ovulation - 5 days
        const fertileStart = ovulationDay - 5;
        const fertileEnd = ovulationDay + 1;

        if (dayInCycle === ovulationDay) {
             return { phase: 'ovulation', dayInCycle };
        }
        
        if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
            return { phase: 'fertile', dayInCycle };
        }
        
        if (dayInCycle < ovulationDay) {
            return { phase: 'follicular', dayInCycle };
        }

        return { phase: 'luteal', dayInCycle };
    },
    /**
     * Get phase details for a specific date (historical or predicted)
     * @param {string} dateStr - YYYY-MM-DD
     * @param {Object} data - App data
     * @returns {Object|null} { label, phase, isPredicted }
     */
    getPhaseDetailsForDate(dateStr, data) {
         // 1. Check Historical/Active Cycles
         let activeCycle = data.cycles.find((c) => c.startDate <= dateStr);
         let isPredicted = false;
         let dayInCycle = 0;
         let periodLen = parseInt(data.settings.averagePeriodLength, 10);
         let cycleLen = this.calculateSmartCycleLength(data);

         if (activeCycle) {
             if (activeCycle.endDate) {
                  const s = new Date(activeCycle.startDate);
                  const e = new Date(activeCycle.endDate);
                  s.setHours(0,0,0,0);
                  e.setHours(0,0,0,0);
                  const diff = (e - s) / (1000 * 60 * 60 * 24);
                  if (diff >= 0) periodLen = Math.floor(diff) + 1;
             }
             const start = new Date(activeCycle.startDate);
             const check = new Date(dateStr);
             start.setHours(0,0,0,0);
             check.setHours(0,0,0,0);
             
             // Check if date is actually within this cycle's duration (approximately)
             // or if it's the latest cycle and we accept it continues
             // For simplicity, let's calculate dayInCycle relative to start
             const diff = (check - start) / (1000 * 60 * 60 * 24);
             
             // If we have an end date, strictly cap it? 
             // Logic in calendar says: if (diff >= 0 && dayInCycle <= totalCycleLen)
             if (diff >= 0) {
                 dayInCycle = Math.floor(diff) + 1;
                 
                  // If there is a newer cycle, use the diff as real length
                  const currentIndex = data.cycles.indexOf(activeCycle);
                  if (currentIndex > 0) {
                     const newerCycle = data.cycles[currentIndex - 1];
                     const newerStart = new Date(newerCycle.startDate);
                     const thisStart = new Date(activeCycle.startDate);
                     // Fix hours for accurate diff
                     newerStart.setHours(0,0,0,0);
                     thisStart.setHours(0,0,0,0); // 'start' var is already set but let's be safe
                     cycleLen = Math.round((newerStart - thisStart) / (1000 * 60 * 60 * 24));
                  }

             } else {
                 activeCycle = null; // Should not happen due to find logic but safety
             }
         }

         // 2. Check Predictions if no active cycle found OR if active cycle ended long ago?
         // Calendar logic: if (!activeCycle) predictNextPeriod...
         // Actually, calendar logic treats "activeCycle" as "Latest cycle that started before date".
         // Then it checks "dayInCycle <= totalCycleLen" to determine if it's still "in" that cycle.
         
         if (!activeCycle || dayInCycle > cycleLen) {
              const predictedStart = this.predictNextPeriod(data);
              if (predictedStart) {
                   const check = new Date(dateStr);
                   check.setHours(0,0,0,0);
                   predictedStart.setHours(0,0,0,0);
                   
                   const diff = (check - predictedStart) / (1000 * 60 * 60 * 24);
                   if (diff >= 0) {
                        // Infinite cycle math
                        const rawDays = Math.floor(diff);
                        dayInCycle = (rawDays % cycleLen) + 1;
                        isPredicted = true;
                   } else {
                        // Date is before prediction but after last cycle end? 
                        // Could be Luteal phase of previous cycle if we passed the length check?
                        // For now, return null if gap.
                        return null;
                   }
              } else {
                  return null;
              }
         }

         // Now determine phase based on dayInCycle
         if (dayInCycle <= cycleLen) {
             const lutealLen = parseInt(data.settings.lutealPhaseLength, 10) || 14;
             const ovulationDay = cycleLen - lutealLen;
             const fertileStart = ovulationDay - 5;
             const fertileEnd = ovulationDay + 1;

             if (dayInCycle <= periodLen) return { label: 'Règles', phase: 'period', isPredicted };
             if (dayInCycle === ovulationDay) return { label: 'Ovulation', phase: 'ovulation', isPredicted };
             if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) return { label: 'Fertilité', phase: 'fertile', isPredicted };
             if (dayInCycle < ovulationDay) return { label: 'Phase Folliculaire', phase: 'follicular', isPredicted };
             return { label: 'Phase Lutéale', phase: 'luteal', isPredicted };
         }
         
         return null;
    },

    /**
     * Calculate statistics from cycle history
     * @param {Object} data 
     * @returns {Object} { avgCycle, avgPeriod, history: [] }
     */
    getHistoryStats(data) {
        if (!data.cycles || data.cycles.length < 2) {
             return { avgCycle: 0, avgPeriod: 0, history: [] };
        }

        const history = [];
        let totalCycleDays = 0;
        let totalPeriodDays = 0;
        let cycleCount = 0;
        let periodCount = 0;
        
        // Data.cycles is sorted DESC (Newest first).
        
        for (let i = 0; i < data.cycles.length; i++) {
            const cycle = data.cycles[i];
            const start = new Date(cycle.startDate);
            let periodLen = 0;
            let cycleLen = 0;

            // 1. Period Length
            if (cycle.endDate) {
                const end = new Date(cycle.endDate);
                // Fix timezone/hours for diff
                const s = new Date(start); s.setHours(0,0,0,0);
                const e = new Date(end); e.setHours(0,0,0,0);
                periodLen = (e - s) / (1000 * 60 * 60 * 24) + 1;
            }

            if (periodLen > 0 && periodLen < 20) { // Sanity check
                totalPeriodDays += periodLen;
                periodCount++;
            }

            // 2. Cycle Length
            // Time from this start to NEXT start.
            // Since array is DESC, "next" chronological cycle is at index i-1.
            if (i > 0) {
                 const newerCycle = data.cycles[i-1];
                 const newerStart = new Date(newerCycle.startDate);
                 const s = new Date(start); s.setHours(0,0,0,0);
                 const ns = new Date(newerStart); ns.setHours(0,0,0,0);
                 
                 cycleLen = (ns - s) / (1000 * 60 * 60 * 24);
                 
                 if (cycleLen > 10 && cycleLen < 100) {
                     totalCycleDays += cycleLen;
                     cycleCount++;
                 }
            }
            
            // Add to history list (only if cycle len known)
            if (cycleLen > 0) {
                 history.push({
                     date: cycle.startDate,
                     cycleLength: cycleLen,
                     periodLength: periodLen || 0
                 });
            }
        }

        return {
            avgCycle: cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 0,
            avgPeriod: periodCount > 0 ? Math.round(totalPeriodDays / periodCount) : 0,
            history: history.reverse() // Chronological (Oldest -> Newest)
        };
    }
};
