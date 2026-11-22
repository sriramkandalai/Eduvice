// Marg, EduVice's guide ("marg" means "path"). Animations live in globals.css (.marg…) and
// switch with `state`. All motion is disabled for people who prefer reduced motion.

export type MargState = "idle" | "wave" | "thinking" | "talking";

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
      <ellipse className="marg-shadow" cx="60" cy="116" rx="30" ry="5" fill="var(--color-blue-dark)" opacity="0.15" />

      <g className="marg-body">
        {/* left arm */}
        <ellipse cx="22" cy="80" rx="7" ry="11" transform="rotate(20 22 80)" fill="var(--color-blue-dark)" />

        {/* right arm (waves) */}
        <g className="marg-arm">
          <ellipse cx="99" cy="78" rx="7" ry="12" transform="rotate(-25 99 78)" fill="var(--color-blue-dark)" />
        </g>

        {/* body */}
        <path
          d="M60 30 C88 30 101 49 101 73 C101 97 85 111 60 111 C35 111 19 97 19 73 C19 49 32 30 60 30 Z"
          fill="var(--color-blue)"
        />
        <ellipse cx="41" cy="50" rx="10" ry="5.5" transform="rotate(-30 41 50)" fill="var(--color-blue-light)" opacity="0.8" />

        {/* face */}
        <ellipse cx="60" cy="78" rx="29" ry="23" fill="var(--color-cream)" />
        <ellipse cx="43" cy="86" rx="5" ry="3" fill="var(--color-yellow)" opacity="0.9" />
        <ellipse cx="77" cy="86" rx="5" ry="3" fill="var(--color-yellow)" opacity="0.9" />

        <g className="marg-eyes">
          <g className="marg-pupils">
            <ellipse cx="50" cy="73" rx="4.5" ry="6" fill="var(--color-blue-dark)" />
            <ellipse cx="70" cy="73" rx="4.5" ry="6" fill="var(--color-blue-dark)" />
            <circle cx="51.6" cy="70.6" r="1.6" fill="var(--color-white)" />
            <circle cx="71.6" cy="70.6" r="1.6" fill="var(--color-white)" />
          </g>
        </g>

        {/* mouth: smile when idle, open and moving when talking */}
        <path
          className="marg-smile"
          d="M52 87 Q60 94 68 87"
          fill="none"
          stroke="var(--color-blue-dark)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse className="marg-talk" cx="60" cy="89" rx="5.5" ry="4" fill="var(--color-blue-dark)" />

        {/* graduation cap (from the EduVice logo) */}
        <g className="marg-cap">
          <path d="M43 27 L43 36 Q60 43 77 36 L77 27 Z" fill="var(--color-blue-dark)" />
          <polygon points="60,8 94,21 60,34 26,21" fill="var(--color-blue-dark)" />
          <polygon points="60,8 94,21 60,20 26,21" fill="var(--color-blue-light)" opacity="0.55" />
          <ellipse cx="60" cy="21" rx="3" ry="1.8" fill="var(--color-blue)" />
          <g className="marg-tassel">
            <path d="M60 21 Q78 20 89 25" fill="none" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="89" y1="25" x2="89" y2="41" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M85.5 41 L92.5 41 L94 50 L84 50 Z" fill="var(--color-yellow)" />
          </g>
        </g>
      </g>

      {/* thought dots (thinking) */}
      <g className="marg-think">
        <circle cx="106" cy="40" r="3" fill="var(--color-blue-dark)" />
        <circle cx="114" cy="30" r="4" fill="var(--color-blue-dark)" />
        <circle cx="123" cy="18" r="5" fill="var(--color-blue-dark)" />
      </g>
    </svg>
  );
}
