import { Permission, type HealthPermission } from '../types';

describe('Permission constants', () => {
  it('matches Health Connect permission string for steps', () => {
    const read: HealthPermission = Permission.READ_STEPS;
    expect(read).toBe('android.permission.health.READ_STEPS');
    expect(Permission.WRITE_STEPS).toBe(
      'android.permission.health.WRITE_STEPS'
    );
  });

  it('covers special history / background / route permissions', () => {
    expect(Permission.READ_HEALTH_DATA_HISTORY).toBe(
      'android.permission.health.READ_HEALTH_DATA_HISTORY'
    );
    expect(Permission.READ_HEALTH_DATA_IN_BACKGROUND).toBe(
      'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND'
    );
    expect(Permission.READ_EXERCISE_ROUTES).toBe(
      'android.permission.health.READ_EXERCISE_ROUTES'
    );
    expect(Permission.WRITE_EXERCISE_ROUTE).toBe(
      'android.permission.health.WRITE_EXERCISE_ROUTE'
    );
  });

  it('covers full record-parity permissions', () => {
    expect(Permission.READ_NUTRITION).toBe(
      'android.permission.health.READ_NUTRITION'
    );
    expect(Permission.WRITE_VO2_MAX).toBe(
      'android.permission.health.WRITE_VO2_MAX'
    );
    expect(Permission.READ_MENSTRUATION).toBe(
      'android.permission.health.READ_MENSTRUATION'
    );
    expect(Permission.WRITE_HEART_RATE_VARIABILITY).toBe(
      'android.permission.health.WRITE_HEART_RATE_VARIABILITY'
    );
  });

  it('exposes a stable set of keys', () => {
    expect(Object.keys(Permission).length).toBeGreaterThanOrEqual(82);
  });
});
