// The graduation cap from the EduVice profile logo (flat royal blue, dark-blue band, cream trim).
// Decorative: the surrounding link/heading carries the accessible name.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" className={className}>
      <path d="M58 62 L58 104 Q120 132 182 104 L182 62 Z" fill="var(--color-blue-dark)" />
      <path d="M58 98 Q120 124 182 98" fill="none" stroke="var(--color-cream)" strokeWidth="6" strokeLinecap="round" />
      <polygon points="120,8 232,46 120,84 8,46" fill="var(--color-blue)" />
      <polygon points="120,8 232,46 120,30 8,46" fill="var(--color-blue-light)" opacity="0.6" />
      <ellipse cx="120" cy="46" rx="8" ry="4.5" fill="var(--color-blue-dark)" />
      <path d="M120 46 Q170 44 206 52" fill="none" stroke="var(--color-blue-dark)" strokeWidth="5" strokeLinecap="round" />
      <line x1="206" y1="52" x2="206" y2="104" stroke="var(--color-blue-dark)" strokeWidth="5" strokeLinecap="round" />
      <path d="M199 104 L213 104 L216 130 L196 130 Z" fill="var(--color-blue-dark)" />
    </svg>
  );
}
