import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { AnalyzeImageInput } from '../types/nutritionTypes';

// ─── Cost rationale ─────────────────────────────────────────────────────────
// Anthropic charges per image roughly proportional to its pixel count
// (~ width × height / 750 input tokens). A native phone photo at 4032×3024
// costs ~16k tokens per image; capping the long edge at 1024 px brings that
// down to ~1.1k tokens (~15× cheaper) with no measurable accuracy loss for
// food identification at typical plate framing.
//
// Compress only affects the on-disk / network payload size — token cost is
// driven entirely by pixel dimensions. 0.8 is a comfortable floor for food
// photos; below that JPEG ringing starts showing on packaging text.

/** Long edge in pixels for the image we send to the AI. */
export const FOOD_IMAGE_MAX_DIMENSION = 1024;

/** JPEG compression quality (0–1) applied by the manipulator on save. */
export const FOOD_IMAGE_JPEG_QUALITY = 0.8;

export type PreparedFoodImage = AnalyzeImageInput & {
  /** Local file URI of the resized, re-encoded image (cache directory). */
  uri: string;
  width: number;
  height: number;
};

/** Subset of `ImagePicker.ImagePickerAsset` we actually need to prep an image. */
export type PreparableAsset = {
  uri: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Resize and re-encode a picked image so the AI request stays cheap.
 *
 * Behaviour:
 *  - Skips the resize when the source long edge is already at or below
 *    `FOOD_IMAGE_MAX_DIMENSION`. Upscaling would waste tokens AND look
 *    worse than the original.
 *  - Always re-encodes as JPEG with `FOOD_IMAGE_JPEG_QUALITY`. PNG inputs
 *    become JPEG (food has no transparency to preserve).
 *  - Returns base64 + media type ready to hand to `analyzeFood`.
 *
 * Pure: no UI, no state, no caching. Each call produces a new file in
 * the cache directory. The OS reclaims those files; we don't.
 */
export async function prepareFoodImage(asset: PreparableAsset): Promise<PreparedFoodImage> {
  if (!asset.uri) throw new Error('prepareFoodImage: asset has no uri');

  const ctx = ImageManipulator.manipulate(asset.uri);

  const sourceWidth = asset.width ?? 0;
  const sourceHeight = asset.height ?? 0;
  const longEdge = Math.max(sourceWidth, sourceHeight);

  // We can only skip resizing when we actually know the source dims AND the
  // image is already small enough. If dims are missing (some pickers omit
  // them), fall through to the resize call — it's a no-op when the picked
  // image is already smaller than the target.
  const shouldResize =
    sourceWidth === 0 || sourceHeight === 0 || longEdge > FOOD_IMAGE_MAX_DIMENSION;

  if (shouldResize) {
    if (sourceHeight > sourceWidth) {
      ctx.resize({ height: FOOD_IMAGE_MAX_DIMENSION });
    } else {
      ctx.resize({ width: FOOD_IMAGE_MAX_DIMENSION });
    }
  }

  const ref = await ctx.renderAsync();
  const result = await ref.saveAsync({
    base64: true,
    compress: FOOD_IMAGE_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  if (!result.base64) {
    throw new Error('prepareFoodImage: manipulator returned no base64 data');
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    mediaType: 'image/jpeg',
    base64: result.base64,
  };
}
