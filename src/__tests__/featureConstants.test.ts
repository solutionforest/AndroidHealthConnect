import { Availability, Feature, FeatureStatus, FhirVersion } from '../types';

describe('Feature / FeatureStatus / Availability / FhirVersion', () => {
  it('Feature constants match wire feature names', () => {
    expect(Feature.SKIN_TEMPERATURE).toBe('skinTemperature');
    expect(Feature.MATCHMAKING).toBe('matchmaking');
    expect(Feature.PLANNED_EXERCISE).toBe('plannedExercise');
  });

  it('FeatureStatus constants match wire status strings', () => {
    expect(FeatureStatus.AVAILABLE).toBe('available');
    expect(FeatureStatus.UNAVAILABLE).toBe('unavailable');
  });

  it('Availability constants match HC install status strings', () => {
    expect(Availability.AVAILABLE).toBe('available');
    expect(Availability.NOT_INSTALLED).toBe('notInstalled');
    expect(Availability.NOT_SUPPORTED).toBe('notSupported');
  });

  it('FhirVersion.R4 is FHIR R4 4.0.1', () => {
    expect(FhirVersion.R4).toEqual({ major: 4, minor: 0, patch: 1 });
    expect(FhirVersion.of(4, 3, 0)).toEqual({
      major: 4,
      minor: 3,
      patch: 0,
    });
  });
});
