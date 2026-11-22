// Graduation-cap mark from the coming-soon page, using the theme's CSS color variables.
// Decorative: the surrounding link/heading carries the accessible name.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M58 62 L58 104 Q120 132 182 104 L182 62 Z" fill="var(--color-blue-dark)" />
      <path
        d="M58 98 Q120 124 182 98"
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <polygon points="120,8 232,46 120,84 8,46" fill="var(--color-blue)" />
      <polygon
        points="120,8 232,46 120,84 8,46"
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <polygon points="120,8 232,46 120,30 8,46" fill="var(--color-blue-light)" opacity="0.55" />
      <ellipse cx="120" cy="46" rx="7" ry="4" fill="var(--color-blue-dark)" />
      <path
        d="M120 46 Q170 44 206 52"
        fill="none"
        stroke="var(--color-blue-dark)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="206"
        y1="52"
        x2="206"
        y2="104"
        stroke="var(--color-blue-dark)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M200 104 L212 104 L215 128 L197 128 Z" fill="var(--color-blue-dark)" />
      <rect x="199" y="100" width="14" height="6" rx="2" fill="var(--color-blue)" />
    </svg>
  );
}
