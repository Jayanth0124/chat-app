import React from 'react';

const MUTED_COLORS = [
  'bg-[#2A2438]', // Muted purple
  'bg-[#1E293B]', // Muted slate
  'bg-[#27272A]', // Muted zinc
  'bg-[#2D2424]', // Muted red/brown
  'bg-[#1F292E]', // Muted teal/slate
  'bg-[#262433]', // Muted indigo
];

const getInitials = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

const getColor = (name) => {
  if (!name) return MUTED_COLORS[0];

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return MUTED_COLORS[Math.abs(hash) % MUTED_COLORS.length];
};

export default function Avatar({
  src,
  name,
  className = '',
  sizeClass = 'w-10 h-10',
  textClass = '',
  roundedClass = 'rounded-full'
}) {
  // Ignore legacy hardcoded logo strings
  const isValidSrc = src?.trim() && !src.includes('/logo.png');

  if (isValidSrc) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`
          ${sizeClass}
          ${className}
          ${roundedClass}
          object-cover
        `}
      />
    );
  }

  const initials = getInitials(name);
  const bgColor = getColor(name);
  
  // If no text sizing is provided in sizeClass or textClass, default to text-sm
  const hasTextSize = sizeClass.includes('text-') || textClass.includes('text-');
  const finalTextClass = hasTextSize ? textClass : `text-sm ${textClass}`;

  return (
    <div
      title={name || 'User'}
      className={`
        ${sizeClass}
        ${className}
        relative
        shrink-0
        select-none
        ${roundedClass}
        flex
        items-center
        justify-center
        font-medium
        text-white/90
        ${bgColor}
        overflow-hidden
      `}
    >
      <span className={`relative z-10 tracking-wide ${finalTextClass}`}>
        {initials}
      </span>
    </div>
  );
}