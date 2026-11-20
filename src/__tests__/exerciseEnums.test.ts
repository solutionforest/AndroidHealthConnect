import { ExerciseSegmentType, ExerciseType } from '../types';

describe('ExerciseType (connect-client 1.2)', () => {
  it('matches SDK session type ids', () => {
    expect(ExerciseType.OTHER_WORKOUT).toBe(0);
    expect(ExerciseType.BADMINTON).toBe(2);
    expect(ExerciseType.RUNNING).toBe(56);
    expect(ExerciseType.EXERCISE_CLASS).toBe(26);
    expect(ExerciseType.FENCING).toBe(27);
    expect(ExerciseType.WHEELCHAIR).toBe(82);
    expect(ExerciseType.WHEEL_CHAIR).toBe(ExerciseType.WHEELCHAIR);
    expect(ExerciseType.YOGA).toBe(83);
  });
});

describe('ExerciseSegmentType (connect-client 1.2)', () => {
  it('matches SDK segment type ids', () => {
    expect(ExerciseSegmentType.UNKNOWN).toBe(0);
    expect(ExerciseSegmentType.BACK_EXTENSION).toBe(2);
    expect(ExerciseSegmentType.SQUAT).toBe(51);
    expect(ExerciseSegmentType.YOGA).toBe(67);
  });
});
