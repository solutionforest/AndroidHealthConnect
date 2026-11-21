import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ensureAvailable,
  requestPermissions,
  checkPermissions,
  hasPermissions,
  missingPermissions,
  readSteps,
  readHeartRate,
  writeRecords,
  updateRecords,
  openHealthConnectApp,
  aggregateRecord,
  getChangesToken,
  getChanges,
  getFeatureStatus,
  readExerciseSessions,
  requestExerciseRoute,
  readPlannedExerciseSessions,
  ExerciseType,
  ExerciseSegmentType,
  ExercisePhase,
  RecordingMethod,
  Permission,
  type HealthConnectAvailability,
  type StepsRecord,
  type HeartRateSample,
} from '@solutionforest/android-health-connect';

const CORE_PERMS = [
  Permission.READ_STEPS,
  Permission.WRITE_STEPS,
  Permission.READ_HEART_RATE,
  Permission.WRITE_HEART_RATE,
] as const;

const HISTORY_PERM = Permission.READ_HEALTH_DATA_HISTORY;
const BACKGROUND_PERM = Permission.READ_HEALTH_DATA_IN_BACKGROUND;
const EXERCISE_PERMS = [
  Permission.READ_EXERCISE,
  Permission.WRITE_EXERCISE,
  Permission.WRITE_EXERCISE_ROUTE,
  Permission.READ_EXERCISE_ROUTES,
] as const;
const PLANNED_PERMS = [
  Permission.READ_PLANNED_EXERCISE,
  Permission.WRITE_PLANNED_EXERCISE,
] as const;

export default function App() {
  const [availability, setAvailability] =
    useState<HealthConnectAvailability | null>(null);
  const [grantedPerms, setGrantedPerms] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepsRecord[]>([]);
  const [heartRateSamples, setHeartRateSamples] = useState<HeartRateSample[]>(
    []
  );
  const [status, setStatus] = useState('');
  const [changesToken, setChangesToken] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // ensureAvailable opens the store when notInstalled; still set status for UI.
    ensureAvailable({ openStoreIfMissing: false }).then(setAvailability);
  }, []);

  const weekRange = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    return {
      startTime: weekAgo.toISOString(),
      endTime: now.toISOString(),
    };
  };

  const handleRequestPermissions = async () => {
    setStatus('Requesting permissions…');
    const granted = await requestPermissions([...CORE_PERMS]);
    setGrantedPerms(granted);
    setStatus(`Granted: ${granted.length} permission(s)`);
  };

  const handleCheckPermissions = async () => {
    const needed = [Permission.READ_STEPS, Permission.READ_HEART_RATE];
    const granted = await checkPermissions(needed);
    setGrantedPerms(granted);
    const ok = await hasPermissions(needed);
    const missing = await missingPermissions(needed);
    setStatus(
      ok
        ? `All core read perms granted (${granted.length})`
        : `Missing: ${missing.map((p) => p.split('.').pop()).join(', ')}`
    );
  };

  /** Example-only: seed fake Steps + HeartRate + a short run for QA. */
  const handleSeedDemoData = async () => {
    setStatus('Seeding demo data…');
    await requestPermissions([...CORE_PERMS, ...EXERCISE_PERMS]);
    const end = new Date();
    const start = new Date(end.getTime() - 3600_000);
    const mid = new Date(end.getTime() - 1800_000);
    const lastSample = new Date(end.getTime() - 1000);
    const walkStart = new Date(end.getTime() - 45 * 60_000);
    const { recordIdsList } = await writeRecords([
      {
        recordType: 'Steps',
        count: 2500,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      {
        recordType: 'HeartRate',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        samples: [
          { time: start.toISOString(), beatsPerMinute: 72 },
          { time: mid.toISOString(), beatsPerMinute: 88 },
          { time: lastSample.toISOString(), beatsPerMinute: 76 },
        ],
      },
      {
        recordType: 'ExerciseSession',
        exerciseType: ExerciseType.WALKING,
        startTime: walkStart.toISOString(),
        endTime: end.toISOString(),
        title: 'Demo walk (seed)',
      },
    ]);
    setStatus(`Seeded ${recordIdsList.length} demo record(s)`);
  };

  const handleWriteSteps = async () => {
    setStatus('Writing steps…');
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600_000);
    const { recordIdsList } = await writeRecords([
      {
        recordType: 'Steps',
        count: 1500,
        startTime: hourAgo.toISOString(),
        endTime: now.toISOString(),
      },
    ]);
    setStatus(`Inserted record ID: ${recordIdsList[0]}`);
  };

  const handleReadSteps = async () => {
    setStatus('Reading steps…');
    const { records } = await readSteps({
      timeRangeFilter: weekRange(),
    });
    setSteps(records);
    setStatus(`Fetched ${records.length} steps record(s)`);
  };

  const handleReadHeartRate = async () => {
    setStatus('Reading heart rate…');
    const { records } = await readHeartRate({
      timeRangeFilter: weekRange(),
    });
    const allSamples = records.flatMap((r) => r.samples);
    setHeartRateSamples(allSamples);
    setStatus(`Fetched ${allSamples.length} heart rate sample(s)`);
  };

  /** Recipe: aggregate steps for the last 7 days. */
  const handleAggregateSteps = async () => {
    setStatus('Aggregating steps…');
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: weekRange(),
    });
    const total = result.metrics['COUNT_TOTAL'];
    setStatus(
      `Steps COUNT_TOTAL (7d): ${total == null ? 'n/a' : String(total)}`
    );
  };

  /** Recipe: changelog token + first page (optional pageSize). */
  const handleChanges = async () => {
    setStatus('Fetching changes…');
    let token = changesToken;
    if (!token) {
      token = await getChangesToken({ recordTypes: ['Steps'] });
      setChangesToken(token);
    }
    const page = await getChanges(token, { pageSize: 100 });
    setChangesToken(page.nextChangesToken);
    setStatus(
      `Changes: +${page.upsertionChanges.length} / -${page.deletionChanges.length}` +
        ` · hasMore=${page.hasMore}` +
        (page.changesTokenExpired ? ' · TOKEN EXPIRED' : '')
    );
  };

  /** Recipe: history permission (feature-gated). */
  const handleHistoryPermission = async () => {
    setStatus('Checking history feature…');
    const feature = await getFeatureStatus('readHealthDataHistory');
    if (feature !== 'available') {
      setStatus('READ_HEALTH_DATA_HISTORY feature unavailable on this device');
      return;
    }
    const granted = await requestPermissions([HISTORY_PERM]);
    setGrantedPerms((prev) => Array.from(new Set([...prev, ...granted])));
    setStatus(
      granted.includes(HISTORY_PERM)
        ? 'History permission granted'
        : 'History permission not granted'
    );
  };

  /** Recipe: background read permission (feature-gated). */
  const handleBackgroundPermission = async () => {
    setStatus('Checking background feature…');
    const feature = await getFeatureStatus('readHealthDataInBackground');
    if (feature !== 'available') {
      setStatus(
        'READ_HEALTH_DATA_IN_BACKGROUND feature unavailable on this device'
      );
      return;
    }
    const granted = await requestPermissions([BACKGROUND_PERM]);
    setGrantedPerms((prev) => Array.from(new Set([...prev, ...granted])));
    setStatus(
      granted.includes(BACKGROUND_PERM)
        ? 'Background permission granted'
        : 'Background permission not granted'
    );
  };

  /** Recipe: update the first Steps record (+100) using metadata.id. */
  const handleUpdateSteps = async () => {
    setStatus('Reading steps to update…');
    const { records } = await readSteps({ timeRangeFilter: weekRange() });
    const existing = records[0];
    if (!existing?.metadata?.id) {
      setStatus('No Steps record with metadata.id — write steps first');
      return;
    }
    setStatus(`Updating ${existing.metadata.id}…`);
    await updateRecords([
      {
        ...existing,
        count: existing.count + 100,
        metadata: {
          ...existing.metadata,
          id: existing.metadata.id,
          recordingMethod:
            existing.metadata.recordingMethod ?? RecordingMethod.MANUAL_ENTRY,
        },
      },
    ]);
    setStatus(
      `Updated steps ${existing.metadata.id}: ${existing.count} → ${existing.count + 100}`
    );
  };

  /** Recipe: write a short run with a 2-point exercise route. */
  const handleWriteExerciseRoute = async () => {
    setStatus('Requesting exercise permissions…');
    await requestPermissions([...EXERCISE_PERMS]);
    setStatus('Writing ExerciseSession + route…');
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 60_000);
    const mid = new Date(start.getTime() + 15 * 60_000);
    const { recordIdsList } = await writeRecords([
      {
        recordType: 'ExerciseSession',
        exerciseType: ExerciseType.RUNNING,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        title: 'Demo run',
        exerciseRoute: {
          route: [
            {
              time: start.toISOString(),
              latitude: 22.3193,
              longitude: 114.1694,
              altitude: 12,
            },
            {
              time: mid.toISOString(),
              latitude: 22.3201,
              longitude: 114.1702,
            },
          ],
        },
      },
    ]);
    setStatus(`ExerciseSession id: ${recordIdsList[0]}`);
  };

  /** Recipe: read sessions; request route if CONSENT_REQUIRED. */
  const handleReadExerciseRoute = async () => {
    setStatus('Reading exercise sessions…');
    await requestPermissions([...EXERCISE_PERMS]);
    const { records } = await readExerciseSessions({
      timeRangeFilter: weekRange(),
    });
    const first = records[0];
    if (!first) {
      setStatus('No ExerciseSession records in range');
      return;
    }
    const route = first.exerciseRoute;
    if (!route || !('type' in route)) {
      setStatus(`Session ${first.metadata?.id ?? '?'}: no route field`);
      return;
    }
    if (route.type === 'DATA') {
      setStatus(
        `Route DATA: ${route.route.length} point(s) on ${first.metadata?.id}`
      );
      return;
    }
    if (route.type === 'CONSENT_REQUIRED' && first.metadata?.id) {
      setStatus('CONSENT_REQUIRED — requesting route…');
      const consented = await requestExerciseRoute(first.metadata.id);
      if (!consented) {
        setStatus('Route consent cancelled / no result');
        return;
      }
      setStatus(
        consented.type === 'DATA'
          ? `Consented route: ${consented.route.length} point(s)`
          : `After consent: ${consented.type}`
      );
      return;
    }
    setStatus(`Route ${route.type} on ${first.metadata?.id ?? '?'}`);
  };

  /** Recipe: PlannedExerciseSession (feature-gated training plan). */
  const handleWritePlannedExercise = async () => {
    setStatus('Checking plannedExercise feature…');
    const feature = await getFeatureStatus('plannedExercise');
    if (feature !== 'available') {
      setStatus('plannedExercise feature unavailable on this device');
      return;
    }
    await requestPermissions([...PLANNED_PERMS]);
    setStatus('Writing PlannedExerciseSession…');
    const start = new Date(Date.now() + 2 * 86400_000);
    const end = new Date(start.getTime() + 90 * 60_000);
    const { recordIdsList } = await writeRecords([
      {
        recordType: 'PlannedExerciseSession',
        exerciseType: ExerciseType.RUNNING,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        title: 'Demo lake run (plan)',
        blocks: [
          {
            repetitions: 1,
            description: 'Three laps',
            steps: [
              {
                exerciseType: ExerciseSegmentType.RUNNING,
                exercisePhase: ExercisePhase.ACTIVE,
                completionGoal: { type: 'Repetitions', repetitions: 3 },
                performanceTargets: [
                  { type: 'HeartRate', minHeartRate: 90, maxHeartRate: 110 },
                ],
              },
            ],
          },
        ],
      },
    ]);
    setStatus(`PlannedExerciseSession id: ${recordIdsList[0]}`);
  };

  const handleReadPlannedExercise = async () => {
    setStatus('Reading planned exercise…');
    const feature = await getFeatureStatus('plannedExercise');
    if (feature !== 'available') {
      setStatus('plannedExercise feature unavailable on this device');
      return;
    }
    await requestPermissions([...PLANNED_PERMS]);
    const { records } = await readPlannedExerciseSessions({
      timeRangeFilter: {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 14 * 86400_000).toISOString(),
      },
    });
    setStatus(
      records.length === 0
        ? 'No PlannedExerciseSession in next 14 days'
        : `Fetched ${records.length} plan(s); first=${records[0]?.title ?? records[0]?.metadata?.id}`
    );
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          This library is Android-only. Run on an Android device or emulator.
        </Text>
      </View>
    );
  }

  if (availability === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Health Connect Demo</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Availability:</Text>
        <Text
          style={[styles.value, availability !== 'available' && styles.warn]}
        >
          {availability}
        </Text>
      </View>

      {availability !== 'available' && (
        <Button
          title="Install / Open Health Connect"
          onPress={openHealthConnectApp}
        />
      )}

      {availability === 'available' && (
        <>
          <View style={styles.buttonGroup}>
            <Button
              title="Request Permissions"
              onPress={handleRequestPermissions}
            />
            <Button
              title="Check Permissions"
              onPress={handleCheckPermissions}
            />
          </View>

          {grantedPerms.length > 0 && (
            <Text style={styles.small}>
              Granted:{'\n'}
              {grantedPerms.map((p) => `• ${p.split('.').pop()}`).join('\n')}
            </Text>
          )}

          <View style={styles.buttonGroup}>
            <Button title="Write 1,500 Steps" onPress={handleWriteSteps} />
            <Button title="Read Steps (7 days)" onPress={handleReadSteps} />
            <Button
              title="Read Heart Rate (7 days)"
              onPress={handleReadHeartRate}
            />
            <Button
              title="Seed Demo Data (fake)"
              onPress={handleSeedDemoData}
            />
          </View>

          <Text style={styles.section}>Recipes</Text>
          <View style={styles.buttonGroup}>
            <Button
              title="Aggregate Steps (7d)"
              onPress={handleAggregateSteps}
            />
            <Button title="Update Steps (+100)" onPress={handleUpdateSteps} />
            <Button title="getChanges (Steps)" onPress={handleChanges} />
            <Button
              title="Request History Permission"
              onPress={handleHistoryPermission}
            />
            <Button
              title="Request Background Permission"
              onPress={handleBackgroundPermission}
            />
            <Button
              title="Write Exercise + Route"
              onPress={handleWriteExerciseRoute}
            />
            <Button
              title="Read Exercise Route"
              onPress={handleReadExerciseRoute}
            />
            <Button
              title="Write Planned Exercise"
              onPress={handleWritePlannedExercise}
            />
            <Button
              title="Read Planned Exercise"
              onPress={handleReadPlannedExercise}
            />
          </View>

          {steps.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Steps Records</Text>
              {steps.map((r, i) => (
                <Text key={i} style={styles.small}>
                  {new Date(r.startTime).toLocaleDateString()} – {r.count} steps
                </Text>
              ))}
            </View>
          )}

          {heartRateSamples.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Heart Rate Samples</Text>
              {heartRateSamples.slice(0, 10).map((s, i) => (
                <Text key={i} style={styles.small}>
                  {new Date(s.time).toLocaleTimeString()} – {s.beatsPerMinute}{' '}
                  bpm
                </Text>
              ))}
              {heartRateSamples.length > 10 && (
                <Text style={styles.small}>
                  …and {heartRateSamples.length - 10} more
                </Text>
              )}
            </View>
          )}
        </>
      )}

      {status !== '' && <Text style={styles.status}>{status}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontWeight: '600', marginRight: 8 },
  value: { color: '#2e7d32' },
  warn: { color: '#c62828' },
  buttonGroup: {
    gap: 8,
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  small: {
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  status: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    fontSize: 13,
    color: '#1b5e20',
  },
  error: {
    color: '#c62828',
    textAlign: 'center',
  },
});
