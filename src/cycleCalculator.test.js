import { describe, it, expect, vi } from 'vitest';
import { CycleCalculator } from './cycleCalculator.js';

describe('CycleCalculator', () => {
  const mockData = {
    settings: {
      averagePeriodLength: 5,
      averageCycleLength: 28
    },
    cycles: [{ startDate: '2023-10-01', endDate: '2023-10-05' }]
  };

  describe('predictNextPeriod', () => {
    it('should return null if no cycles exist', () => {
      const data = { cycles: [], settings: mockData.settings };
      const result = CycleCalculator.predictNextPeriod(data);
      expect(result).toBeNull();
    });

    it('should predict date based on last start date + average cycle length', () => {
      const result = CycleCalculator.predictNextPeriod(mockData);
      expect(result).toBeInstanceOf(Date);
      // Default behavior (not enough history) -> 28 days
      expect(result.toISOString().split('T')[0]).toBe('2023-10-29');
    });

    it('should use smart prediction (average of history) if enough data exists', () => {
        const historyData = {
            settings: { averageCycleLength: 35 }, // Default is 35
            cycles: [
                { startDate: '2023-04-01' }, // Cycle 3 (Ends ???)
                { startDate: '2023-03-03' }, // Cycle 2 (29 days)
                { startDate: '2023-02-01' }, // Cycle 1 (30 days)
            ]
        };
        // Intervals: 
        // Apr 1 - Mar 3 = 29 days
        // Mar 3 - Feb 1 = 30 days
        // Average = 29.5 -> 30 days.
        // Prediction = Apr 1 + 30 days = May 1.
        // If it used settings (35), it would be May 6.
        
        const result = CycleCalculator.predictNextPeriod(historyData);
        expect(result.toISOString().split('T')[0]).toBe('2023-05-01');
    });
  });

  describe('getDaysUntilNext', () => {
    it('should return null if prediction is impossible', () => {
      const data = { cycles: [], settings: mockData.settings };
      expect(CycleCalculator.getDaysUntilNext(data)).toBeNull();
    });

    it('should calculate correct days difference', () => {
      // Mock System Time to 2023-10-20
      vi.useFakeTimers();
      const today = new Date('2023-10-20T10:00:00');
      vi.setSystemTime(today);

      // Prediction is 2023-10-29
      // Diff should be 9 days
      const days = CycleCalculator.getDaysUntilNext(mockData);
      expect(days).toBe(9);

      vi.useRealTimers();
    });
  });

  describe('getCurrentStatus', () => {
    it('should return unknown if no history', () => {
      const data = { cycles: [], settings: mockData.settings };
      expect(CycleCalculator.getCurrentStatus(data)).toEqual({ phase: 'unknown', dayInCycle: 0 });
    });

    it('should detect Period phase', () => {
      vi.useFakeTimers();
      // Cycle started Oct 1. Today Oct 3. Day 3.
      vi.setSystemTime(new Date('2023-10-03'));

      const result = CycleCalculator.getCurrentStatus(mockData);
      expect(result.phase).toBe('period');
      expect(result.dayInCycle).toBe(3);

      vi.useRealTimers();
    });

    it('should detect Follicular phase (after period, before ovulation)', () => {
      vi.useFakeTimers();
      // Cycle started Oct 1. Ovulation is D14 (Oct 14). Fertile starts D9 (Oct 9).
      // Let's pick Oct 7 (D7).
      vi.setSystemTime(new Date('2023-10-07'));

      const result = CycleCalculator.getCurrentStatus(mockData);
      expect(result.phase).toBe('follicular');
      expect(result.dayInCycle).toBe(7);

      vi.useRealTimers();
    });

    it('should detect Fertile window', () => {
      vi.useFakeTimers();
      // Ovulation D14. Fertile D9-D15.
      // Pick Oct 10 (D10).
      vi.setSystemTime(new Date('2023-10-10'));

      const result = CycleCalculator.getCurrentStatus(mockData);
      expect(result.phase).toBe('fertile');

      vi.useRealTimers();
    });

    it('should detect Ovulation day', () => {
      vi.useFakeTimers();
      // Ovulation D14 => Oct 14.
      vi.setSystemTime(new Date('2023-10-14'));

      const result = CycleCalculator.getCurrentStatus(mockData);
      expect(result.phase).toBe('ovulation');

      vi.useRealTimers();
    });

    it('should detect Luteal phase', () => {
      vi.useFakeTimers();
      // After ovulation D15+. Pick Oct 20 (D20).
      vi.setSystemTime(new Date('2023-10-20'));

      const result = CycleCalculator.getCurrentStatus(mockData);
      expect(result.phase).toBe('luteal');

      vi.useRealTimers();
    });
  });
  describe('Regression Tests', () => {
    it('should reproduce negative days if end date is attached to an old start date', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-05')); // Today is Feb 5

        const mockData = {
            settings: {
                averagePeriodLength: 5,
                averageCycleLength: 32
            },
            cycles: [
                { startDate: '2026-01-01', endDate: '2026-02-05' } 
            ]
        };

        const days = CycleCalculator.getDaysUntilNext(mockData);
        expect(days).toBeGreaterThan(25); 
        expect(days).toBeLessThan(30);
        
        vi.useRealTimers();
    });
  });
});

