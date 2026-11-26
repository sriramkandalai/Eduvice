// Illustrated props that stand in the home page "rooms". Decorative only (aria-hidden).

type PropProps = { className?: string };

/** Wooden stool with a stack of books and a pencil cup. */
export function BookStool({ className }: PropProps) {
  return (
    <svg viewBox="0 0 220 300" aria-hidden="true" focusable="false" className={className}>
      {/* legs */}
      <rect x="46" y="150" width="26" height="148" rx="3" fill="var(--color-wood)" />
      <rect x="148" y="150" width="26" height="148" rx="3" fill="var(--color-wood)" />
      <rect x="64" y="150" width="8" height="148" fill="var(--color-wood-dark)" opacity="0.5" />
      <rect x="166" y="150" width="8" height="148" fill="var(--color-wood-dark)" opacity="0.5" />
      <rect x="62" y="230" width="98" height="12" rx="2" fill="var(--color-wood-dark)" />
      {/* seat */}
      <rect x="18" y="132" width="184" height="22" rx="6" fill="var(--color-wood-dark)" />
      <ellipse cx="110" cy="132" rx="92" ry="16" fill="var(--color-wood)" />
      <ellipse cx="110" cy="130" rx="70" ry="9" fill="var(--color-white)" opacity="0.18" />
      {/* books */}
      <rect x="42" y="104" width="138" height="24" rx="3" fill="var(--color-blue)" />
      <rect x="46" y="110" width="128" height="3" fill="var(--color-paper)" opacity="0.7" />
      <rect x="54" y="80" width="118" height="24" rx="3" fill="var(--color-yellow)" />
      <rect x="58" y="86" width="108" height="3" fill="var(--color-paper)" opacity="0.8" />
      <rect x="46" y="58" width="126" height="22" rx="3" fill="var(--color-charcoal)" />
      <rect x="50" y="64" width="116" height="3" fill="var(--color-paper)" opacity="0.5" />
      {/* pencil cup */}
      <rect x="128" y="20" width="10" height="44" rx="2" fill="var(--color-yellow)" transform="rotate(-12 133 42)" />
      <rect x="142" y="14" width="10" height="48" rx="2" fill="var(--color-blue-light)" transform="rotate(8 147 38)" />
      <rect x="120" y="30" width="40" height="30" rx="6" fill="var(--color-paper)" />
      <rect x="120" y="30" width="10" height="30" rx="4" fill="var(--color-sand)" />
    </svg>
  );
}

/** Tall floor lamp with a yellow shade. */
export function FloorLamp({ className }: PropProps) {
  return (
    <svg viewBox="0 0 180 460" aria-hidden="true" focusable="false" className={className}>
      <ellipse cx="96" cy="446" rx="58" ry="12" fill="var(--color-yellow)" />
      <ellipse cx="96" cy="442" rx="58" ry="10" fill="#f2c200" />
      <rect x="91" y="110" width="10" height="334" rx="5" fill="var(--color-yellow)" />
      <rect x="97" y="110" width="4" height="334" fill="#e0b400" />
      <path d="M96 116 Q96 70 60 62" fill="none" stroke="var(--color-yellow)" strokeWidth="9" strokeLinecap="round" />
      {/* shade */}
      <g transform="rotate(-24 50 60)">
        <path d="M18 92 L82 92 L66 30 L34 30 Z" fill="var(--color-yellow)" />
        <path d="M66 30 L82 92 L74 92 L60 30 Z" fill="#e0b400" />
        <ellipse cx="50" cy="92" rx="32" ry="7" fill="var(--color-paper)" />
      </g>
    </svg>
  );
}

/** Chalkboard for the wall. The chalk marks are universal (ABC, math), so no translation needed. */
export function Chalkboard({ className }: PropProps) {
  return (
    <svg viewBox="0 0 340 220" aria-hidden="true" focusable="false" className={className}>
      <rect x="0" y="0" width="340" height="210" rx="8" fill="var(--color-wood-dark)" />
      <rect x="12" y="12" width="316" height="186" rx="4" fill="var(--color-charcoal)" />
      <g fill="none" stroke="var(--color-paper)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        {/* A B C */}
        <path d="M40 90 L56 44 L72 90 M46 74 H66" />
        <path d="M86 90 V44 H100 Q114 44 114 56 Q114 66 100 67 H86 M100 67 Q118 68 118 79 Q118 90 102 90 H86" />
        <path d="M162 50 Q150 42 140 48 Q128 56 130 70 Q132 88 146 90 Q156 91 162 84" />
        {/* 2 + 2 = 4 */}
        <path d="M40 130 Q48 118 58 124 Q64 132 40 156 H62" />
        <path d="M80 140 H98 M89 131 V149" />
        <path d="M112 130 Q120 118 130 124 Q136 132 112 156 H134" />
        <path d="M152 136 H170 M152 146 H170" />
        <path d="M200 120 L186 146 H206 M200 120 V160" />
        {/* check mark + star */}
        <path d="M232 70 L246 84 L274 52" stroke="var(--color-yellow)" />
        <path d="M262 132 L268 146 L283 147 L271 156 L275 170 L262 162 L249 170 L253 156 L241 147 L256 146 Z" stroke="var(--color-yellow)" />
      </g>
      <rect x="40" y="198" width="260" height="10" rx="3" fill="var(--color-wood)" />
      <rect x="70" y="194" width="22" height="6" rx="2" fill="var(--color-paper)" />
    </svg>
  );
}

/** School desk with books and an apple-yellow mug. */
export function SchoolDesk({ className }: PropProps) {
  return (
    <svg viewBox="0 0 320 220" aria-hidden="true" focusable="false" className={className}>
      <rect x="30" y="96" width="12" height="122" rx="3" fill="var(--color-charcoal)" />
      <rect x="278" y="96" width="12" height="122" rx="3" fill="var(--color-charcoal)" />
      <rect x="30" y="150" width="260" height="8" rx="2" fill="var(--color-charcoal)" opacity="0.85" />
      <rect x="10" y="82" width="300" height="18" rx="4" fill="var(--color-wood-dark)" />
      <rect x="10" y="78" width="300" height="10" rx="4" fill="var(--color-wood)" />
      {/* books */}
      <rect x="40" y="54" width="92" height="24" rx="3" fill="var(--color-blue)" />
      <rect x="48" y="34" width="80" height="20" rx="3" fill="var(--color-paper)" />
      <rect x="48" y="40" width="80" height="3" fill="var(--color-sand)" />
      {/* open notebook */}
      <path d="M170 76 L170 66 Q200 58 226 66 Q252 58 282 66 L282 76 Z" fill="var(--color-white)" />
      <path d="M226 66 V76" stroke="var(--color-sand)" strokeWidth="2" />
      {/* mug */}
      <rect x="140" y="46" width="22" height="30" rx="4" fill="var(--color-yellow)" />
      <path d="M162 54 Q172 56 170 64 Q168 70 162 70" fill="none" stroke="var(--color-yellow)" strokeWidth="4" />
    </svg>
  );
}
