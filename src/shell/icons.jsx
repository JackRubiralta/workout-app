import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// ─── Tab bar icons ──────────────────────────────────────────────────────────

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

// ─── Action / chrome icons ──────────────────────────────────────────────────
// All accept `color` and `size`. Default size 20 for chrome; bump or shrink
// at the call site to match the surrounding type.

export function ChevronLeft({ color, size = 22, strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRight({ color, size = 22, strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ color, size = 18, strokeWidth = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon({ color, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16.5 3.5l4 4-12 12-4 .5.5-4 12-12.5z" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ color, size = 22, strokeWidth = 1.7 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9V19a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H17l-2-3H9L7 8H4a1 1 0 0 0-1 1z"
            stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function FlameIcon({ color, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c2 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 1-5 0 2 2 3 4 0 0-2 0-3 0-5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckCircle({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowUp({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7-7 7 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowDown({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7 7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UndoIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill={color} />
    </Svg>
  );
}
