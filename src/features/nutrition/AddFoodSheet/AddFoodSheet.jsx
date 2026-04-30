import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, text } from '../../../theme';
import { Sheet } from '../../../components/primitives/Sheet';
import { confirm } from '../../../utils/confirm';
import { ScanTab } from './ScanTab';
import { SearchTab } from './SearchTab';
import { ManualTab } from './ManualTab';

const TABS = [
  { key: 'scan', label: 'Scan' },
  { key: 'search', label: 'Describe' },
  { key: 'manual', label: 'Manual' },
];

function TabSwitcher({ tab, onChange }) {
  return (
    <View style={ts.outer}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[ts.tab, tab === t.key && ts.active]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.8}
        >
          <Text style={[ts.label, tab === t.key && ts.labelActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ts = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  active: { backgroundColor: colors.surfaceHigh },
  label: { ...text.button, fontSize: fontSize.subhead, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  labelActive: { color: colors.text, fontWeight: '700' },
});

export function AddFoodSheet({ visible, initialTab = 'scan', onClose, onLogItems }) {
  const [tab, setTab] = useState('scan');
  const [photos, setPhotos] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  const abortRef = useRef(null);
  const busy = scanBusy || searchBusy;

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      setPhotos([]);
      setScanResults(null);
      setScanBusy(false);
      setScanStatus('');
      setQuery('');
      setSearchResults(null);
      setSearchBusy(false);
      setSearchStatus('');
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [visible, initialTab]);

  const handleLogItems = (items, photos, meta) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onLogItems(items, photos ?? [], meta);
  };

  const requestClose = () => {
    if (busy) {
      confirm({
        title: 'Cancel analysis?',
        message: 'Analysis is still running. Closing now will discard the result.',
        confirmLabel: 'Cancel',
        cancelLabel: 'Keep waiting',
        destructive: true,
        onConfirm: () => { abortRef.current?.abort(); onClose(); },
      });
      return;
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={requestClose} height="88%" flex dismissable={!busy}>
      <View style={s.header}>
        <Text style={[text.title3, { fontSize: fontSize.headline, flex: 1 }]}>Add Food</Text>
        <TouchableOpacity onPress={requestClose} style={s.closeBtn} hitSlop={12}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TabSwitcher tab={tab} onChange={setTab} />

      <View style={{ flex: 1 }}>
        {tab === 'scan' && (
          <ScanTab
            photos={photos} setPhotos={setPhotos}
            results={scanResults} setResults={setScanResults}
            onLog={handleLogItems}
            busy={scanBusy} setBusy={setScanBusy}
            status={scanStatus} setStatus={setScanStatus}
            abortRef={abortRef}
          />
        )}
        {tab === 'search' && (
          <SearchTab
            query={query} setQuery={setQuery}
            results={searchResults} setResults={setSearchResults}
            busy={searchBusy} setBusy={setSearchBusy}
            status={searchStatus} setStatus={setSearchStatus}
            onLog={handleLogItems}
            abortRef={abortRef}
          />
        )}
        {tab === 'manual' && <ManualTab onLog={handleLogItems} />}
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
