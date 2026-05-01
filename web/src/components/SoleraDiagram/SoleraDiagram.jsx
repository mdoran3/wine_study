// Solera system flow diagram rendered as inline SVG.
// 4 rows × 3 barrels; each row fans out to all 3 barrels in the next row.

const COLS = [115, 235, 355];
const ROWS = [125, 230, 335, 440];
const R    = 42;
const FILL = 0.28; // fill line sits FILL*R above the barrel center (~65 % full)

const ROW_META = [
  { fill: '#f7efbe', stroke: '#c8b050', label: '3rd Criadera', italic: true,  bold: false },
  { fill: '#f0c050', stroke: '#c08820', label: '2nd Criadera', italic: true,  bold: false },
  { fill: '#e07828', stroke: '#a85010', label: '1st Criadera', italic: true,  bold: false },
  { fill: '#c05010', stroke: '#804010', label: 'Solera',       italic: false, bold: true  },
];

const CENTER_X  = 235;
const TOP_BOX   = { x: 155, y: 22,  w: 160, h: 28 };
const BOT_BOX   = { x: 130, y: 510, w: 210, h: 30 };

export default function SoleraDiagram() {
  // ── barrel descriptors ──────────────────────────────────────────────────
  const barrels = ROWS.flatMap((cy, ri) =>
    COLS.map((cx, ci) => ({ cx, cy, ri, ci, id: `r${ri}c${ci}`, ...ROW_META[ri] }))
  );

  // ── flow lines ──────────────────────────────────────────────────────────
  const rowLines = [];
  for (let ri = 0; ri < ROWS.length - 1; ri++) {
    for (let ci = 0; ci < COLS.length; ci++) {
      for (let cj = 0; cj < COLS.length; cj++) {
        rowLines.push({
          key: `rl-${ri}-${ci}-${cj}`,
          x1: COLS[ci], y1: ROWS[ri] + R,
          x2: COLS[cj], y2: ROWS[ri + 1] - R,
        });
      }
    }
  }

  const topLines = COLS.map((cx, ci) => ({
    key: `tl-${ci}`,
    x1: CENTER_X,           y1: TOP_BOX.y + TOP_BOX.h,
    x2: cx,                  y2: ROWS[0] - R,
  }));

  const botLines = COLS.map((cx, ci) => ({
    key: `bl-${ci}`,
    x1: cx,    y1: ROWS[3] + R,
    x2: CENTER_X, y2: BOT_BOX.y,
  }));

  const allLines = [...topLines, ...rowLines, ...botLines];

  return (
    <svg
      viewBox="0 0 515 560"
      style={{ display: 'block', width: '100%', maxWidth: 480, margin: '0 auto' }}
      aria-label="Solera system diagram showing four rows of sherry barrels from youngest (3rd Criadera) to oldest (Solera)"
    >
      <defs>
        <marker id="sdArr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#c0c0c0" />
        </marker>
        {barrels.map(b => {
          const fillY = b.cy - R * FILL;
          return (
            <clipPath key={`cp-${b.id}`} id={`cp-${b.id}`}>
              <rect x={b.cx - R - 1} y={fillY} width={R * 2 + 2} height={R + R * FILL + 2} />
            </clipPath>
          );
        })}
      </defs>

      {/* ── flow arrows (drawn behind barrels) ── */}
      {allLines.map(l => (
        <line key={l.key}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#d0d0d0" strokeWidth={1.2}
          markerEnd="url(#sdArr)"
        />
      ))}

      {/* ── barrels ── */}
      {barrels.map(b => {
        const fillY    = b.cy - R * FILL;
        const halfChord = Math.sqrt(R * R - (R * FILL) * (R * FILL));
        return (
          <g key={b.id}>
            {/* white background */}
            <circle cx={b.cx} cy={b.cy} r={R} fill="#fff" />
            {/* wine fill */}
            <circle cx={b.cx} cy={b.cy} r={R} fill={b.fill} clipPath={`url(#cp-${b.id})`} />
            {/* surface line */}
            <line
              x1={b.cx - halfChord + 1} y1={fillY}
              x2={b.cx + halfChord - 1} y2={fillY}
              stroke={b.stroke} strokeWidth={1.5}
            />
            {/* barrel outline */}
            <circle cx={b.cx} cy={b.cy} r={R} fill="none" stroke="#999" strokeWidth={2} />
          </g>
        );
      })}

      {/* ── input box ── */}
      <rect x={TOP_BOX.x} y={TOP_BOX.y} width={TOP_BOX.w} height={TOP_BOX.h}
        rx={4} fill="#f7efbe" stroke="#c8b050" strokeWidth={1.5} />
      <text x={CENTER_X} y={TOP_BOX.y + 18}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: '#6b4e06' }}>
        New wine (Sobretabla)
      </text>

      {/* ── output box ── */}
      <rect x={BOT_BOX.x} y={BOT_BOX.y} width={BOT_BOX.w} height={BOT_BOX.h}
        rx={4} fill="#c05010" stroke="#804010" strokeWidth={1.5} />
      <text x={CENTER_X} y={BOT_BOX.y + 19}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fill: '#fff' }}>
        Sherry bottled / blended / sold
      </text>

      {/* ── row labels ── */}
      {ROW_META.map((meta, ri) => (
        <text key={`lbl-${ri}`}
          x={413} y={ROWS[ri] + 5}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fill: '#6b4e06',
            fontStyle:  meta.italic ? 'italic'  : 'normal',
            fontWeight: meta.bold   ? '700'     : '400',
          }}>
          {meta.label}
        </text>
      ))}

      {/* ── age gradient annotations ── */}
      <text x={68} y={ROWS[0]}
        textAnchor="end"
        style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fill: '#bbb' }}>
        youngest
      </text>
      <text x={68} y={ROWS[3]}
        textAnchor="end"
        style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fill: '#bbb' }}>
        oldest
      </text>
    </svg>
  );
}
