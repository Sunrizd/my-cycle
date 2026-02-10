import { API } from './api.js';

const defaultSettings = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  theme: 'sage'
};

export const Storage = {
  async getData(shareToken = null) {
    try {
      if (shareToken) {
          const data = await API.getSharedData(shareToken);
          // Data is already formatted as { user, cycles, symptoms, settings } from backend helper
          // We need to return structure matching our app expectations
          
          const defaultSettings = {
              averageCycleLength: 28,
              averagePeriodLength: 5,
              theme: 'sage'
          };
          
          // Apply Theme from settings immediately
          const settings = { ...defaultSettings, ...data.settings };
          
          const formattedCycles = data.cycles.map((c) => ({
            ...c,
            startDate: c.start_date,
            endDate: c.end_date
          }));
          
          return {
              cycles: formattedCycles,
              symptoms: data.symptoms,
              settings: settings,
              user: data.user // Pass user info too
          };
      }

      const t = new Date().getTime();
      const [cycles, symptoms, settingsArr] = await Promise.all([
        API.request(`${API_URL}/cycles?_t=${t}`),
        API.request(`${API_URL}/symptoms?_t=${t}`),
        API.request(`${API_URL}/settings?_t=${t}`)
      ]);

      // Transform Settings Array/Obj
      const settings = { ...defaultSettings, ...settingsArr };

      // Cycles already match {id, start_date, end_date} largely, just need startDate camelCase mapping if needed.
      // DB has start_date, frontend uses startDate.
      const formattedCycles = cycles.map((c) => ({
        ...c,
        startDate: c.start_date,
        endDate: c.end_date
      }));

      // Dashboard expects specific structure
      return {
        cycles: formattedCycles,
        symptoms,
        settings
      };
    } catch (error) {
      console.error('Failed to load data', error);
      return {
        cycles: [],
        symptoms: {},
        settings: defaultSettings
      };
    }
  },

  async logPeriodStart(date) {
    // Optimistic update or refresh?
    // Let's just create and then reload all data for simplicity in MVP
    await API.request(`${API_URL}/cycles`, {
      method: 'POST',
      body: JSON.stringify({ start_date: date })
    });
    return this.getData();
  },

  async logSymptom(date, data) {
    await API.request(`${API_URL}/symptoms`, {
      method: 'POST',
      body: JSON.stringify({ date, data })
    });
    return this.getData();
  },

  async logPeriodEnd(date) {
    // We need to know which cycle to update.
    // The backend `Upsert` logic we added handles this if the start date is close.
    // But here we are sending an END date.
    // We should actually find the current active cycle first?
    // Or simpler: The backend logic expects `start_date` to find the cycle.
    // So we need to pass the *start_date* of the current cycle and the *new end_date*.

    const data = await this.getData();
    const latestCycle = data.cycles[0]; // Assumes sorted

    if (!latestCycle) return data; // No cycle to end

    // Check if latest cycle is indeed the one we are ending (active)
    // If it's old, maybe we shouldn't touch it?
    // For now, assume user wants to end the *latest* recorded cycle.

    await API.request(`${API_URL}/cycles`, {
      method: 'POST',
      body: JSON.stringify({
        start_date: latestCycle.startDate,
        end_date: date
      })
    });
    return this.getData();
  }
};

const API_URL = '/api';
