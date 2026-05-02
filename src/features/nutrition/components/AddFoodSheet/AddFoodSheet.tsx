import React, { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { DetailSheet } from '@/shared/components';
import { confirm } from '@/shared/utils/confirm';
import { AnalyzeFoodForm } from './AnalyzeFoodForm';
import type { AnalyzeResultsState } from './ResultsView';
import type {
  AnalyzedItem,
  ConfidenceValue,
  FoodPhoto,
  FoodSourceValue,
} from '../../types/nutritionTypes';

/**
 * In-memory representation of a photo the user has selected but not yet
 * sent to the AI. We capture only the URI + native dimensions here — the
 * base64 payload is generated lazily by `prepareFoodImage` at analyze
 * time so the picker UI stays instant and we never hold large strings in
 * React state. Exported so `AnalyzeFoodForm` consumes the same shape.
 */
export type CapturedPhoto = {
  uri: string;
  width: number;
  height: number;
};

type LogMeta = { mealName: string | null };

export type AddFoodSheetProps = {
  visible: boolean;
  onClose: () => void;
  onLogItems: (
    items: Array<AnalyzedItem & { source: FoodSourceValue | null; notes: string | null; confidence: ConfidenceValue | null }>,
    photos: FoodPhoto[],
    meta: LogMeta,
  ) => void;
};

// Single-screen Add Food sheet. The form (photos + free-text context)
// owns its inputs; this shell owns:
//   • visibility / dismiss
//   • the in-flight AbortController so a close-while-busy can cancel
//   • haptic-on-success and the call out to NutritionScreen.handleLogItems
export function AddFoodSheet({ visible, onClose, onLogItems }: AddFoodSheetProps) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnalyzeResultsState | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const abortRef = useRef<AbortController | null>(null);

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

  const handleLogItems = (
    items: Parameters<AddFoodSheetProps['onLogItems']>[0],
    photoArr: FoodPhoto[],
    meta: LogMeta,
  ) => {
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
        onConfirm: () => {
          abortRef.current?.abort();
          onClose();
        },
      });
      return;
    }
    onClose();
  };

  return (
    <DetailSheet visible={visible} onClose={requestClose} title="Add Food" height="88%" dismissable={!busy}>
      <AnalyzeFoodForm
        photos={photos}
        setPhotos={setPhotos}
        query={query}
        setQuery={setQuery}
        results={results}
        setResults={setResults}
        busy={busy}
        setBusy={setBusy}
        status={status}
        setStatus={setStatus}
        onLog={handleLogItems}
        abortRef={abortRef}
      />
    </DetailSheet>
  );
}
