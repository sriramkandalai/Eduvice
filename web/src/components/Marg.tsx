// Marg, EduVice's guide ("marg" means "path"). Flat, in the logo's colors: royal-blue body,
// a dark visor face with yellow eyes, and the logo's graduation cap.
// Animations live in globals.css (.marg…) and switch with `state`; reduced motion turns them off.

export type MargState = "idle" | "wave" | "thinking" | "talking" | "happy" | "surprised" | "walk";

const OUTLINE = {};

export function Marg({ state = "idle", className }: { state?: MargState; className?: string }) {
  return (
    <svg
      viewBox="0 0 130 124"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={`marg ${className ?? ""}`}
      data-state={state}
    >
      {/* ground shadow */}
      <ellipse className="marg-shadow" cx="60" cy="116" rx="28" ry="4.5" fill="var(--color-blue-dark)" opacity="0.18" />

      <g className="marg-body">
        {/* left arm */}
        <rect x="11" y="72" width="13" height="22" rx="6.5" transform="rotate(18 17 83)" fill="var(--color-blue)" {...OUTLINE} />

        {/* right arm (waves) */}
        <g className="marg-arm">
          <rect x="96" y="68" width="13" height="24" rx="6.5" transform="rotate(-22 103 80)" fill="var(--color-blue)" {...OUTLINE} />
        </g>

        {/* body */}
        <rect x="20" y="34" width="80" height="76" rx="32" fill="var(--color-blue)" {...OUTLINE} />
        <ellipse cx="42" cy="47" rx="12" ry="4.5" transform="rotate(-22 42 47)" fill="var(--color-blue-light)" />

        {/* visor face */}
        <rect x="29" y="52" width="62" height="36" rx="18" fill="var(--color-blue-dark)" />

        <g className="marg-eyes">
          <g className="marg-pupils">
            <rect x="42.5" y="62" width="9" height="14" rx="4.5" fill="var(--color-yellow)" />
            <rect x="68.5" y="62" width="9" height="14" rx="4.5" fill="var(--color-yellow)" />
            <circle cx="49" cy="65" r="1.6" fill="var(--color-white)" />
            <circle cx="75" cy="65" r="1.6" fill="var(--color-white)" />
          </g>
        </g>

        {/* happy eyes (^ ^) */}
        <g className="marg-happy" fill="none" stroke="var(--color-yellow)" strokeWidth="3.2" strokeLinecap="round">
          <path d="M42 71 Q47 62 52 71" />
          <path d="M68 71 Q73 62 78 71" />
        </g>
        {/* surprised eyes (big and round) and "O" mouth */}
        <g className="marg-wow">
          <circle cx="47" cy="68" r="6.5" fill="var(--color-yellow)" />
          <circle cx="73" cy="68" r="6.5" fill="var(--color-yellow)" />
          <circle cx="49" cy="66" r="2" fill="var(--color-white)" />
          <circle cx="75" cy="66" r="2" fill="var(--color-white)" />
        </g>
        <ellipse className="marg-o" cx="60" cy="81.5" rx="3.6" ry="4.2" fill="var(--color-yellow)" />

        {/* mouth: smile when idle, moving when talking */}
        <path
          className="marg-smile"
          d="M54 80 Q60 84.5 66 80"
          fill="none"
          stroke="var(--color-yellow)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <ellipse className="marg-talk" cx="60" cy="81" rx="5" ry="3" fill="var(--color-yellow)" />

        {/* cheeks */}
        <circle cx="33" cy="97" r="3.5" fill="var(--color-cream)" opacity="0.8" />
        <circle cx="87" cy="97" r="3.5" fill="var(--color-cream)" opacity="0.8" />

        {/* graduation cap (from the logo) */}
        <g className="marg-cap">
          <path d="M44 28 L44 38 Q60 44 76 38 L76 28 Z" fill="var(--color-blue-dark)" />
          <path d="M44 36 Q60 42 76 36" fill="none" stroke="var(--color-cream)" strokeWidth="1.8" strokeLinecap="round" />
          <polygon points="60,11 94,24 60,37 26,24" fill="var(--color-blue-dark)" />
          <polygon points="60,11 94,24 60,24 26,24" fill="var(--color-blue-light)" opacity="0.55" />
          <ellipse cx="60" cy="24" rx="3" ry="1.8" fill="var(--color-blue-dark)" />
          <g className="marg-tassel">
            <path d="M60 24 Q78 23 89 27" fill="none" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="89" y1="27" x2="89" y2="42" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="85" y="41" width="8" height="9" rx="2" fill="var(--color-yellow)" />
          </g>
        </g>
      </g>

      {/* thought dots (thinking) */}
      <g className="marg-think">
        <circle cx="107" cy="40" r="3" fill="var(--color-blue)" />
        <circle cx="115" cy="30" r="4" fill="var(--color-blue)" />
        <circle cx="124" cy="18" r="5" fill="var(--color-yellow)" />
      </g>
    </svg>
  );
}
