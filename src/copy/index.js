// Single import surface for all user-facing strings. Today every key is a
// plain English literal; tomorrow it can be a thin wrapper around an i18n
// library without changing call sites:
//
//   import { copy } from '../copy';
//   <Text>{copy.empty.foodLog.title}</Text>
//
// Group strings by *intent* (empty states, error states, action labels)
// rather than by where they happen to render — that way a refactor that
// relocates a screen doesn't fragment the translations.
import { emptyCopy } from './empty';

export const copy = {
  empty: emptyCopy,
};
