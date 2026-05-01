import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// True while the soft keyboard is on screen. Used by sheets so they can hide
// fixed-bottom footers (e.g. Save / Delete) when the user is typing — the
// keyboard already provides a "Done" affordance and the footer just steals
// vertical space.
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);
  return visible;
}
