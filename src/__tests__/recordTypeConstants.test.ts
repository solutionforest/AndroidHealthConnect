import { RecordType } from '../types';
import type { RecordType as RecordTypeName } from '../types';

describe('RecordType constants', () => {
  it('matches Health Connect record type strings', () => {
    const steps: RecordTypeName = RecordType.STEPS;
    expect(steps).toBe('Steps');
    expect(RecordType.HEART_RATE).toBe('HeartRate');
    expect(RecordType.EXERCISE_SESSION).toBe('ExerciseSession');
    expect(RecordType.PLANNED_EXERCISE_SESSION).toBe('PlannedExerciseSession');
  });

  it('covers feature-gated and parity types', () => {
    expect(RecordType.MINDFULNESS_SESSION).toBe('MindfulnessSession');
    expect(RecordType.SKIN_TEMPERATURE).toBe('SkinTemperature');
    expect(RecordType.ACTIVITY_INTENSITY).toBe('ActivityIntensity');
    expect(RecordType.NUTRITION).toBe('Nutrition');
    expect(RecordType.HEART_RATE_VARIABILITY_RMSSD).toBe(
      'HeartRateVariabilityRmssd'
    );
  });

  it('exposes every RecordType value exactly once', () => {
    const values = Object.values(RecordType);
    expect(values).toHaveLength(42);
    expect(new Set(values).size).toBe(42);
  });
});
