import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  aggregateRecord,
  ensureAvailable,
  hasPermissions,
  openHealthConnectApp,
  Permission,
  readSteps,
  RecordType,
  requestPermissions,
  timeRangeLastDays,
  type HealthConnectAvailability,
  type StepsRecord,
} from '@solutionforest/android-health-connect';

// Must match the `permissions` passed to the config plugin in app.json.
const PERMISSIONS = [Permission.READ_STEPS];

export default function App() {
  const [availability, setAvailability] =
    useState<HealthConnectAvailability | null>(null);
  const [granted, setGranted] = useState(false);
  const [steps, setSteps] = useState<StepsRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wrap each action so a rejected native call shows up in the UI
  // instead of an unhandled promise rejection.
  const run = useCallback(
    (action: () => Promise<void>) => () => {
      setError(null);
      action().catch((e: unknown) => setError(String(e)));
    },
    []
  );

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    run(async () => {
      const status = await ensureAvailable({ openStoreIfMissing: false });
      setAvailability(status);
      if (status === 'available') {
        setGranted(await hasPermissions(PERMISSIONS));
      }
    })();
  }, [run]);

  const handleRequest = run(async () => {
    await requestPermissions(PERMISSIONS);
    setGranted(await hasPermissions(PERMISSIONS));
  });

  const handleReadSteps = run(async () => {
    const { records } = await readSteps({
      timeRangeFilter: timeRangeLastDays(7),
    });
    setSteps(records);
  });

  const handleAggregate = run(async () => {
    const result = await aggregateRecord({
      recordType: RecordType.STEPS,
      timeRangeFilter: timeRangeLastDays(7),
    });
    const value = result.metrics['COUNT_TOTAL'];
    setTotal(typeof value === 'number' ? value : null);
  });

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.center}>
        <Text>Health Connect is Android-only.</Text>
      </View>
    );
  }

  const ready = availability === 'available' && granted;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Health Connect + Expo</Text>

      <Section label="1. Availability">
        <Text>{availability ?? 'checking…'}</Text>
        {availability !== null && availability !== 'available' && (
          <Button
            title="Install / open Health Connect"
            onPress={openHealthConnectApp}
          />
        )}
      </Section>

      <Section label="2. Permission">
        <Text>READ_STEPS: {granted ? 'granted' : 'not granted'}</Text>
        <Button
          title="Request permission"
          onPress={handleRequest}
          disabled={availability !== 'available'}
        />
      </Section>

      <Section label="3. Steps, last 7 days">
        <Button
          title="Read steps"
          onPress={handleReadSteps}
          disabled={!ready}
        />
        <Text>{steps.length} record(s)</Text>
        {steps.slice(0, 10).map((r, i) => (
          <Text key={r.metadata?.id ?? i} style={styles.row}>
            {new Date(r.startTime).toLocaleString()}: {r.count}
          </Text>
        ))}
      </Section>

      <Section label="4. Aggregate, last 7 days">
        <Button
          title="Aggregate steps"
          onPress={handleAggregate}
          disabled={!ready}
        />
        <Text>Total: {total ?? '–'}</Text>
      </Section>

      {error !== null && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
  section: { gap: 8 },
  label: { fontWeight: '600' },
  row: { fontVariant: ['tabular-nums'] },
  error: { color: '#b00020' },
});
