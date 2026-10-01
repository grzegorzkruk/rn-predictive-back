import * as React from 'react';
import {useEffect, useState} from 'react';
import {BackHandler, StyleSheet, Switch, Text, View} from 'react-native';

/**
 * The React tree mounted by [NativeHostActivity]'s ReactFragment.
 *
 * `BackHandler.setInterceptEnabled` looks up a ReactActivity. This fragment's
 * host is not one, so that call cannot claim the gesture. The switch on the
 * native chrome does. Once it is on, a commit arrives here as
 * hardwareBackPress. Returning true keeps the activity. Returning false lets
 * the host finish, which is the pop back to the full React Native screen.
 */
export default function BrownfieldEmbed(): React.JSX.Element {
  const [keep, setKeep] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const line = `${new Date().toISOString().slice(11, 23)}  hardwareBackPress ${
        keep ? 'kept' : '-> host finishes'
      }`;
      setLog(current => [line, ...current].slice(0, 6));
      return keep;
    });
    return () => sub.remove();
  }, [keep]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Embedded RN fragment</Text>
      <Text style={styles.body}>
        This view is a ReactFragment inside the native host. It does not have
        its own back dispatcher.
      </Text>
      <View style={styles.row}>
        <Text style={styles.label}>Stay when the host forwards a commit</Text>
        <Switch value={keep} onValueChange={setKeep} />
      </View>
      <Text style={styles.body}>
        Host switch off: the swipe pops this activity back to the React Native
        screen, and this tree never hears it. Host switch on: the native
        callback gets progress, then hardwareBackPress on commit.
      </Text>
      <View style={styles.log}>
        {log.length === 0 ? (
          <Text style={styles.logLine}>No commit forwarded yet.</Text>
        ) : (
          log.map((line, i) => (
            <Text key={`${line}-${i}`} style={styles.logLine}>
              {line}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#132043',
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  log: {
    gap: 2,
  },
  logLine: {
    color: '#a5b4fc',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
