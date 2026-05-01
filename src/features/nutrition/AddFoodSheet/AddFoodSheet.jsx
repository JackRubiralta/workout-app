import React, { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { DetailSheet } from '../../../ui';
import { confirm } from '../../../utils/confirm';
import { AnalyzeFoodForm } from './AnalyzeFoodForm';

// Single-screen Add Food sheet. The form (photos + free-text context)
// owns its inputs; this shell owns:
//   • visibility / dismiss
//   • the in-flight AbortController so a close-while-busy can cancel
//   • haptic-on-success and the call out to NutritionScreen.handleLogItems
//
// State that resets every time the sheet opens lives here so the form can
// stay pure-controlled.
export function AddFoodSheet({ visible, onClose, onLogItems }) {
  const [photos, setPhotos] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const abortRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setPhotos([]);
    setQuery('');
    setResults(null);
    setBusy(false);
    setStatus('');
    abortRef.current?.abort();
    abortRef.current = null;
  }, [visible]);

  const handleLogItems = (items, photoArr, meta) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onLogItems(items, photoArr ?? [], meta);
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
    <DetailSheet
      visible={visible}
      onClose={requestClose}
      title="Add Food"
      height="88%"
      dismissable={!busy}
    >
      <AnalyzeFoodForm
        photos={photos} setPhotos={setPhotos}
        query={query} setQuery={setQuery}
        results={results} setResults={setResults}
        busy={busy} setBusy={setBusy}
        status={status} setStatus={setStatus}
        onLog={handleLogItems}
        abortRef={abortRef}
      />
    </DetailSheet>
  );
}
