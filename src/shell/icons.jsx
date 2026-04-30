import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function DumbbellIcon({ color = '#fff', size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 9v6M5 6v12M8 4.5h2v15H8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M10 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M22 9v6M19 6v12M16 4.5h-2v15h2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AppleIcon({ color = '#fff', size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7c0-1.5.5-3 2-4 .5-.4 1.5-.5 2-.4-.2 1.4-.7 2.4-1.6 3.2C13.6 6.6 12.7 7 12 7zm-6 9c0-3 2-7 5-7 1.5 0 2.5.7 3.5.7s2-.7 3.5-.7c2.5 0 4 2.7 4 5 0 3-3 7-4.5 7-1 0-1.5-.6-2.7-.6-1.2 0-1.7.6-2.8.6C9 21 6 17 6 14z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClockIcon({ color = '#fff', size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 2M21 12C21 16.97 16.97 21 12 21S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
