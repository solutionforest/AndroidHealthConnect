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
  isHealthConnectAvailable,
  requestPermissions,
  checkPermissions,
  readSteps,
  readHeartRate,
  writeRecords,
  openHealthConnectApp,
  type HealthConnectAvailability,
  type StepsRecord,
  type HeartRateSample,
} from '@solutionforest/android-health-connect';

export default function App() {
  const [availability, setAvailability] =
    useState<HealthConnectAvailability | null>(null);
  const [grantedPerms, setGrantedPerms] = useState<string[]>([]);
  const [steps, setSteps] = useState<StepsRecord[]>([]);
  const [heartRateSamples, setHeartRateSamples] = useState<HeartRateSample[]>(
    []
  );
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    isHealthConnectAvailable().then(setAvailability);
  }, []);

  const handleRequestPermissions = async () => {
    setStatus('Requesting permissions…');
    const granted = await requestPermissions([
      'android.permission.health.READ_STEPS',
      'android.permission.health.WRITE_STEPS',
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.WRITE_HEART_RATE',
    ]);
    setGrantedPerms(granted);
    setStatus(`Granted: ${granted.length} permission(s)`);
  };

  const handleCheckPermissions = async () => {
    const granted = await checkPermissions([
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_HEART_RATE',
    ]);
    setGrantedPerms(granted);
    setStatus(`Currently granted: ${granted.join(', ')}`);
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
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const { records } = await readSteps({
      timeRangeFilter: {
        startTime: weekAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    setSteps(records);
    setStatus(`Fetched ${records.length} steps record(s)`);
  };

  const handleReadHeartRate = async () => {
    setStatus('Reading heart rate…');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const { records } = await readHeartRate({
      timeRangeFilter: {
        startTime: weekAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    const allSamples = records.flatMap((r) => r.samples);
    setHeartRateSamples(allSamples);
    setStatus(`Fetched ${allSamples.length} heart rate sample(s)`);
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
