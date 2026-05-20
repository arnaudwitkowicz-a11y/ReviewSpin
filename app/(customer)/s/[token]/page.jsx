"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Design tokens — Light luxury palette ─────────────────────────────────────
const GOLD        = "#B8952A";
const GOLD_LIGHT  = "#D4AF50";
const GOLD_PALE   = "#F0E4BC";
const GOLD_BG     = "#FFFDF5";
const WARM_WHITE  = "#FFFFFF";
const CHARCOAL    = "#1C1C1C";
const DARK        = "#2D2D2D";
const MID         = "#6B6460";
const BORDER      = "#E8E0CC";
const BORDER_GOLD = "#D4AF50";
const SURFACE     = "#F7F3E8";
const IVORY       = "#FAFAF7";

// ─── Default wheel segments ───────────────────────────────────────────────────
const DEFAULT_SEGMENTS = [
  { label: "Free Dessert",   color: "#B8952A", textColor: "#FFFFFF", probability: 0.12, isLose: false },
  { label: "Better Luck",    color: "#E8E0CC", textColor: "#6B6460", probability: 0.20, isLose: true  },
  { label: "Free Coffee",    color: "#D4AF50", textColor: "#1C1C1C", probability: 0.15, isLose: false },
  { label: "10% Off",        color: "#F0E4BC", textColor: "#1C1C1C", probability: 0.15, isLose: false },
  { label: "Better Luck",    color: "#E8E0CC", textColor: "#6B6460", probability: 0.13, isLose: true  },
  { label: "Free Mocktail",  color: "#C9A84C", textColor: "#FFFFFF", probability: 0.10, isLose: false },
  { label: "Giveaway Entry", color: "#B8952A", textColor: "#FFFFFF", probability: 0.05, isLose: false },
  { label: "5% Off",         color: "#F7F3E8", textColor: "#2D2D2D", probability: 0.10, isLose: false },
];

function pickReward(segs) {
  const total = segs.reduce((s, g) => s + g.probability, 0);
  let r = Math.random() * total, cum = 0;
  for (let i = 0; i < segs.length; i++) {
    cum += segs[i].probability;
    if (r < cum) return i;
  }
  return segs.findIndex(s => s.isLose) ?? 0;
}

function makeCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "RS-" + Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.rs{min-height:100dvh;background:${GOLD_BG};color:${CHARCOAL};font-family:'Jost',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;overflow-x:hidden;position:relative}
.rs::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 70% 35% at 50% -5%,rgba(184,149,42,.1) 0%,transparent 70%),radial-gradient(ellipse 40% 20% at 100% 100%,rgba(184,149,42,.05) 0%,transparent 60%);pointer-events:none;z-index:0}
.pg{position:relative;z-index:2;min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:0 24px 64px;max-width:480px;margin:0 auto}
@keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .6s cubic-bezier(.16,1,.3,1) both}
.se{animation:fu .5s cubic-bezier(.16,1,.3,1) both}
.orn{width:48px;height:1px;background:linear-gradient(90deg,transparent,${GOLD_LIGHT},transparent);margin:0 auto}
.logo{width:88px;height:88px;border-radius:50%;border:1.5px solid ${BORDER_GOLD};background:${WARM_WHITE};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 28px rgba(184,149,42,.18),0 0 0 6px rgba(184,149,42,.06);overflow:hidden}
.inp{width:100%;background:${WARM_WHITE};border:1.5px solid ${BORDER};border-radius:10px;padding:14px 16px;color:${CHARCOAL};font-family:'Jost',sans-serif;font-size:14px;font-weight:400;letter-spacing:.03em;transition:border-color .2s,box-shadow .2s;outline:none}
.inp::placeholder{color:#B0A898}
.inp:focus{border-color:${GOLD_LIGHT};box-shadow:0 0 0 3px rgba(184,149,42,.1)}
.inp.err{border-color:#D06060;box-shadow:0 0 0 3px rgba(208,96,96,.1)}
.lbl{font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${MID};margin-bottom:6px;display:flex;align-items:center;gap:4px}
.req{color:${GOLD}}
.emsg{font-size:11px;color:#B04040;margin-top:4px;letter-spacing:.02em}
.cta{width:100%;padding:16px 32px;border-radius:10px;border:1.5px solid ${GOLD};background:linear-gradient(135deg,#9A7018,${GOLD},${GOLD_LIGHT});color:#fff;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.13em;text-transform:uppercase;cursor:pointer;transition:all .2s;box-shadow:0 4px 18px rgba(184,149,42,.28)}
.cta:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(184,149,42,.38)}
.cta:active{transform:translateY(0)}
.cta:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}
.ghost{width:100%;padding:13px 24px;border-radius:10px;border:1.5px solid ${BORDER};background:transparent;color:${MID};font-family:'Jost',sans-serif;font-size:13px;font-weight:400;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .2s}
.ghost:hover{border-color:${GOLD_LIGHT};color:${CHARCOAL}}
.sbtn{width:100%;border:1.5px solid ${BORDER};border-radius:14px;background:${WARM_WHITE};color:${CHARCOAL};font-family:'Jost',sans-serif;font-size:15px;font-weight:400;letter-spacing:.03em;padding:20px;cursor:pointer;display:flex;align-items:center;gap:16px;transition:all .25s;text-align:left;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.sbtn:hover{border-color:${GOLD_LIGHT};transform:translateY(-2px);box-shadow:0 8px 28px rgba(184,149,42,.13)}
.sico{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.chip{padding:10px 16px;border-radius:24px;border:1.5px solid ${BORDER};background:${WARM_WHITE};color:${MID};font-family:'Jost',sans-serif;font-size:13px;font-weight:400;letter-spacing:.04em;cursor:pointer;transition:all .18s;white-space:nowrap}
.chip.on{border-color:${GOLD};background:${GOLD_PALE};color:${DARK}}
.chip:hover:not(.on){border-color:${GOLD_LIGHT};color:${CHARCOAL}}
.wwrap{position:relative;width:300px;height:300px;margin:0 auto}
.wptr{position:absolute;top:-20px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:26px solid ${GOLD};filter:drop-shadow(0 2px 6px rgba(184,149,42,.5));z-index:10}
.wctr{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:${WARM_WHITE};border:2px solid ${GOLD_LIGHT};display:flex;align-items:center;justify-content:center;z-index:10;box-shadow:0 2px 14px rgba(184,149,42,.22)}
.rcard{background:${WARM_WHITE};border:1.5px solid ${BORDER_GOLD};border-radius:18px;padding:32px 24px;text-align:center;box-shadow:0 8px 40px rgba(184,149,42,.12);position:relative;overflow:hidden}
.rcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${GOLD},${GOLD_LIGHT},${GOLD})}
.code{font-family:'Jost',monospace;font-size:26px;font-weight:500;letter-spacing:.2em;color:${GOLD};background:${GOLD_BG};border:1.5px dashed ${BORDER_GOLD};border-radius:10px;padding:16px 24px;margin:16px 0;cursor:pointer;transition:background .2s}
.code:hover{background:${GOLD_PALE}}
.pbar{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#9A7018,${GOLD},${GOLD_LIGHT});transition:width .5s cubic-bezier(.4,0,.2,1);z-index:100;box-shadow:0 0 8px rgba(184,149,42,.4)}
@keyframes cf{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.cp{position:fixed;pointer-events:none;z-index:1000;animation:cf linear forwards}
.star{font-size:30px;cursor:pointer;color:${BORDER};transition:all .15s}
.star.on{color:${GOLD}}
.star:hover{transform:scale(1.2);color:${GOLD_LIGHT}}
.qrf{background:${WARM_WHITE};border:2px solid ${BORDER_GOLD};border-radius:20px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(184,149,42,.14);position:relative}
.rbr{background:${SURFACE};border:1.5px solid ${BORDER_GOLD};border-radius:16px;padding:32px 24px;text-align:center}
.gbtn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:16px 24px;border-radius:10px;border:1.5px solid ${BORDER};background:${WARM_WHITE};color:${DARK};font-family:'Jost',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.gbtn:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,.12);border-color:${GOLD_LIGHT}}
.si{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:${MID};margin-bottom:8px}
.se-in{background:${IVORY};border:1px solid ${BORDER};border-radius:6px;padding:7px 10px;font-family:'Jost',sans-serif;font-size:13px;color:${CHARCOAL};outline:none;width:100%;transition:border-color .15s}
.se-in:focus{border-color:${GOLD_LIGHT}}
.delbtn{width:28px;height:28px;border-radius:6px;border:1px solid ${BORDER};background:transparent;color:#C05050;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;line-height:1;padding:0}
.delbtn:hover{background:#FFF0F0}
.floatbtn{position:fixed;bottom:28px;right:20px;z-index:50;background:${WARM_WHITE};border:1.5px solid ${BORDER_GOLD};border-radius:40px;padding:9px 16px;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;color:${GOLD};cursor:pointer;letter-spacing:.06em;box-shadow:0 4px 18px rgba(184,149,42,.2);display:flex;align-items:center;gap:6px;transition:box-shadow .2s}
.floatbtn:hover{box-shadow:0 6px 28px rgba(184,149,42,.32)}
`;

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = [GOLD, GOLD_LIGHT, GOLD_PALE, "#D4AF50", "#F0E4BC", WARM_WHITE];
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      id: i, left: Math.random() * 100, color: cols[i % cols.length],
      delay: Math.random() * .8, dur: 2.5 + Math.random() * 2,
      size: 6 + Math.random() * 7, rot: Math.random() * 360,
      round: Math.random() > .5,
    })));
    const t = setTimeout(() => setPieces([]), 5500);
    return () => clearTimeout(t);
  }, [active]);
  return <>{pieces.map(p => (
    <div key={p.id} className="cp" style={{
      left: `${p.left}%`, top: -20, width: p.size, height: p.size,
      background: p.color, animationDuration: `${p.dur}s`,
      animationDelay: `${p.delay}s`, borderRadius: p.round ? "50%" : "2px",
    }} />
  ))}</>;
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ name, logoUrl, tableLabel }) {
  return (
    <div style={{ width: "100%", textAlign: "center", paddingTop: 44 }}>
      <div className="fu" style={{ animationDelay: ".05s" }}>
        <div className="logo" style={{ margin: "0 auto 18px" }}>
          {logoUrl
            ? <img src={logoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: GOLD, fontWeight: 600 }}>{name.charAt(0)}</span>
          }
        </div>
      </div>
      <div className="fu" style={{ animationDelay: ".15s" }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: ".25em", color: GOLD_LIGHT, textTransform: "uppercase", marginBottom: 6 }}>Welcome to</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 400, letterSpacing: ".06em", color: CHARCOAL, lineHeight: 1.2 }}>{name}</h1>
        {tableLabel && <p style={{ fontSize: 11, color: MID, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 5 }}>{tableLabel}</p>}
        <div className="orn" style={{ marginTop: 14 }} />
      </div>
    </div>
  );
}

// ─── Screen: QR ───────────────────────────────────────────────────────────────
function ScreenQR({ restaurant, onScan }) {
  // Deterministic pixel pattern for QR placeholder
  const SIZE = 21;
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const inFinder = (r < 8 && c < 8) || (r < 8 && c > SIZE - 9) || (r > SIZE - 9 && c < 8);
      let filled;
      if (inFinder) {
        filled =
          (r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= SIZE - 7 && c <= SIZE - 5) ||
          (r >= SIZE - 7 && r <= SIZE - 5 && c >= 2 && c <= 4);
      } else {
        filled = (((r * 17 + c * 13 + r * c) ^ 42) % 3) !== 0;
      }
      if (filled) cells.push(`${r},${c}`);
    }
  }

  return (
    <div className="se pg">
      <Header name={restaurant.name} logoUrl={restaurant.logoUrl} tableLabel={restaurant.tableLabel} />
      <div style={{ width: "100%", marginTop: 28 }}>
        <div className="fu qrf" style={{ animationDelay: ".2s" }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: ".14em", color: MID, textTransform: "uppercase", marginBottom: 20 }}>
            Scan to share your experience
          </p>
          <svg width="190" height="190" viewBox={`0 0 ${SIZE * 10} ${SIZE * 10}`} style={{ margin: "0 auto 18px", display: "block", borderRadius: 8 }}>
            <rect width={SIZE * 10} height={SIZE * 10} fill="white" />
            {cells.map(k => {
              const [r, c] = k.split(",").map(Number);
              return <rect key={k} x={c * 10} y={r * 10} width="9" height="9" fill={DARK} rx="1" />;
            })}
            <rect x="78" y="78" width="54" height="54" rx="8" fill="white" />
            <rect x="82" y="82" width="46" height="46" rx="6" fill={GOLD} />
            <text x="105" y="112" textAnchor="middle" fill="white" fontSize="22" fontFamily="serif" fontWeight="600">R</text>
          </svg>
          <p style={{ fontSize: 11, color: MID, letterSpacing: ".05em", marginBottom: 4 }}>
            reviewspin.app/s/{restaurant.id}_t7
          </p>
          <p style={{ fontSize: 11, color: GOLD_LIGHT, letterSpacing: ".1em", textTransform: "uppercase" }}>
            {restaurant.tableLabel}
          </p>
        </div>

        <div className="fu" style={{ animationDelay: ".4s", marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="cta" onClick={onScan}>▶ Simulate QR Scan</button>
          <p style={{ fontSize: 11, color: MID, textAlign: "center", letterSpacing: ".03em", lineHeight: 1.7 }}>
            In production, scanning this QR opens directly in the customer's browser — no app required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Landing ─────────────────────────────────────────────────────────
function ScreenLanding({ restaurant, onContinue }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Your name is required";
    if (!email.trim()) e.email = "Your email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Please enter a valid email address";
    return e;
  }
  function submit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onContinue({ name: name.trim(), email: email.trim() });
  }

  return (
    <div className="se pg">
      <Header name={restaurant.name} logoUrl={restaurant.logoUrl} tableLabel={restaurant.tableLabel} />
      <div className="fu" style={{ animationDelay: ".25s", width: "100%", marginTop: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontStyle: "italic", color: MID, lineHeight: 1.7, letterSpacing: ".02em" }}>
          Your experience matters to us.<br />Spin for a chance to win a reward.
        </p>
      </div>
      <div className="fu" style={{ animationDelay: ".38s", width: "100%", marginTop: 26, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="lbl">Name <span className="req">*</span></div>
          <input className={`inp${errors.name ? " err" : ""}`} placeholder="Your full name" value={name}
            onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
            onKeyDown={e => e.key === "Enter" && submit()} />
          {errors.name && <div className="emsg">{errors.name}</div>}
        </div>
        <div>
          <div className="lbl">Email <span className="req">*</span></div>
          <input className={`inp${errors.email ? " err" : ""}`} placeholder="your@email.com" type="email" value={email}
            onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: null })); }}
            onKeyDown={e => e.key === "Enter" && submit()} />
          {errors.email && <div className="emsg">{errors.email}</div>}
        </div>
      </div>
      <div className="fu" style={{ animationDelay: ".52s", width: "100%", marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="cta" onClick={submit}>Begin Your Experience</button>
        <p style={{ fontSize: 11, color: MID, textAlign: "center", letterSpacing: ".03em", lineHeight: 1.7 }}>Your details are kept private and never shared.</p>
      </div>
    </div>
  );
}

// ─── Screen: Sentiment ────────────────────────────────────────────────────────
function ScreenSentiment({ restaurant, onSelect }) {
  return (
    <div className="se pg">
      <Header name={restaurant.name} logoUrl={restaurant.logoUrl} tableLabel={restaurant.tableLabel} />
      <div style={{ width: "100%", marginTop: 44 }}>
        <div className="fu" style={{ animationDelay: ".1s", textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, letterSpacing: ".05em", color: CHARCOAL }}>How was your experience?</h2>
          <div className="orn" style={{ marginTop: 14 }} />
        </div>
        <div className="fu" style={{ animationDelay: ".22s", display: "flex", flexDirection: "column", gap: 14 }}>
          <button className="sbtn" onClick={() => onSelect("positive")}>
            <div className="sico" style={{ background: GOLD_BG, fontSize: 26 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: CHARCOAL, marginBottom: 3 }}>It was great</div>
              <div style={{ fontSize: 12, color: MID }}>I'd love to share my experience</div>
            </div>
            <div style={{ color: GOLD_LIGHT, fontSize: 20, fontWeight: 300 }}>›</div>
          </button>
          <button className="sbtn" onClick={() => onSelect("negative")}>
            <div className="sico" style={{ background: SURFACE, fontSize: 26 }}>💬</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: CHARCOAL, marginBottom: 3 }}>Something could be better</div>
              <div style={{ fontSize: 12, color: MID }}>Help us improve privately</div>
            </div>
            <div style={{ color: BORDER, fontSize: 20, fontWeight: 300 }}>›</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Google Review bridge ────────────────────────────────────────────
function ScreenReview({ restaurant, onDone }) {
  const [clicked, setClicked] = useState(false);
  function go() {
    setClicked(true);
    window.open(restaurant.googleReviewUrl || "https://g.page/r/demo/review", "_blank");
    setTimeout(onDone, 2200);
  }
  return (
    <div className="se pg">
      <div style={{ width: "100%", marginTop: 64, textAlign: "center" }}>
        <div className="fu" style={{ animationDelay: ".1s", marginBottom: 28 }}>
          <div style={{ fontSize: 50, marginBottom: 14 }}>⭐</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: CHARCOAL, letterSpacing: ".04em", marginBottom: 10 }}>We're so glad you enjoyed it</h2>
          <p style={{ fontSize: 14, color: MID, lineHeight: 1.7, letterSpacing: ".02em" }}>A Google review helps others discover us — it takes just 30 seconds.</p>
          <div className="orn" style={{ marginTop: 18, marginBottom: 24 }} />
        </div>
        <div className="fu rbr" style={{ animationDelay: ".25s" }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: MID, marginBottom: 20, lineHeight: 1.6 }}>
            After leaving your review, come back to unlock your reward spin.
          </p>
          <button className="gbtn" onClick={go}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {clicked ? "Opening Google Reviews…" : "Leave a Google Review"}
          </button>
          {clicked && <p style={{ fontSize: 12, color: GOLD, marginTop: 14, letterSpacing: ".05em" }}>Thank you — preparing your reward spin…</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Private feedback ────────────────────────────────────────────────
const CATS = [
  { id: "food",        label: "Food & Drink",  icon: "🍽" },
  { id: "service",     label: "Service",        icon: "🤝" },
  { id: "waiting",     label: "Waiting Time",   icon: "⏳" },
  { id: "cleanliness", label: "Cleanliness",    icon: "✨" },
  { id: "value",       label: "Price & Value",  icon: "💎" },
  { id: "other",       label: "Other",          icon: "💬" },
];
function ScreenFeedback({ onSubmit }) {
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const toggle = id => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <div className="se pg">
      <div style={{ width: "100%", marginTop: 44 }}>
        <div className="fu" style={{ animationDelay: ".1s", textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 400, color: CHARCOAL, letterSpacing: ".04em" }}>Help us do better</h2>
          <p style={{ fontSize: 13, color: MID, marginTop: 8, lineHeight: 1.6, letterSpacing: ".02em" }}>Your feedback goes directly to management — never public.</p>
          <div className="orn" style={{ marginTop: 14 }} />
        </div>
        <div className="fu" style={{ animationDelay: ".2s", marginBottom: 20 }}>
          <div className="si" style={{ marginBottom: 10 }}>What could we improve?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATS.map(c => <button key={c.id} className={`chip${sel.includes(c.id) ? " on" : ""}`} onClick={() => toggle(c.id)}>{c.icon} {c.label}</button>)}
          </div>
        </div>
        <div className="fu" style={{ animationDelay: ".3s", marginBottom: 20 }}>
          <div className="si" style={{ marginBottom: 10 }}>Overall rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(n => <span key={n} className={`star${n <= rating ? " on" : ""}`} onClick={() => setRating(n)}>★</span>)}
          </div>
        </div>
        <div className="fu" style={{ animationDelay: ".38s", marginBottom: 26 }}>
          <div className="si" style={{ marginBottom: 10 }}>Tell us more (optional)</div>
          <textarea className="inp" rows={4} placeholder="Any specific details we should know…" value={msg} onChange={e => setMsg(e.target.value)} style={{ resize: "none" }} />
        </div>
        <div className="fu" style={{ animationDelay: ".46s" }}>
          <button className="cta" disabled={sel.length === 0 && rating === 0} onClick={() => onSubmit({ categories: sel, rating, message: msg })}>
            Submit & Spin to Win
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Spin wheel (fixed) ──────────────────────────────────────────────
function ScreenSpin({ segments, onComplete }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const rotRef    = useRef(0);
  const spinning  = useRef(false);
  const spunOnce  = useRef(false);
  const [phase, setPhase] = useState("idle"); // idle | spinning | result
  const [result, setResult] = useState(null);

  const segCount = segments.length;
  const segAngle = (2 * Math.PI) / segCount;

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback((rotation) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width, cx = W / 2, cy = W / 2, R = W / 2 - 6;
    ctx.clearRect(0, 0, W, W);

    // Outer ring
    ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = "rgba(184,149,42,.25)";
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Segments
    segments.forEach((seg, i) => {
      const a0 = rotation + i * segAngle - Math.PI / 2;
      const a1 = a0 + segAngle;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = seg.color; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1; ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(a0 + segAngle / 2);
      ctx.textAlign = "right"; ctx.fillStyle = seg.textColor;
      ctx.font = "500 10px 'Jost',sans-serif";
      const lbl = seg.label.length > 12 ? seg.label.slice(0, 11) + "…" : seg.label;
      ctx.fillText(lbl, R - 10, 4);
      ctx.restore();
    });

    // Centre
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = WARM_WHITE; ctx.fill();
    ctx.strokeStyle = GOLD_LIGHT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = GOLD; ctx.font = "bold 14px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✦", cx, cy);
  }, [segments, segAngle]);

  useEffect(() => { draw(0); }, [draw]);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Which segment is under the pointer ───────────────────────────────────
  // The draw function places segment i starting at: rotation + i*segAngle - PI/2
  // The pointer is at the TOP of the canvas = canvas angle -PI/2
  // So we need: which segment contains angle -PI/2?
  // Segment i spans: [rotation + i*segAngle - PI/2,  rotation + (i+1)*segAngle - PI/2]
  // Pointer is at -PI/2, so: rotation + i*segAngle - PI/2 <= -PI/2 < rotation + (i+1)*segAngle - PI/2
  // => i*segAngle <= -rotation < (i+1)*segAngle
  // => i = floor((-rotation mod 2PI) / segAngle)
  function getSegmentAt(rotation) {
    const angle = ((-rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(angle / segAngle) % segCount;
  }

  // ── Spin ──────────────────────────────────────────────────────────────────
  function startSpin() {
    if (spinning.current || spunOnce.current) return;
    spinning.current = true;
    spunOnce.current = true;
    setPhase("spinning");

    // Pick target segment
    const targetIdx = pickReward(segments);

    // We need getSegmentAt(finalRot) === targetIdx
    // getSegmentAt(rot) = floor((-rot mod 2PI) / segAngle)
    // So we need: -finalRot mod 2PI to be in [targetIdx*segAngle, (targetIdx+1)*segAngle)
    // Pick the midpoint of that range: targetIdx*segAngle + segAngle/2
    // => -finalRot ≡ targetIdx*segAngle + segAngle/2  (mod 2PI)
    // => finalRot ≡ -(targetIdx*segAngle + segAngle/2)  (mod 2PI)
    const targetAngle = -(targetIdx * segAngle + segAngle / 2);
    const finalNorm = ((targetAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const currentNorm = ((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const gap = ((finalNorm - currentNorm) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const finalRot = rotRef.current + gap + (7 + Math.floor(Math.random() * 4)) * 2 * Math.PI;

    const DUR = 5200, t0 = performance.now(), r0 = rotRef.current;
    const ease = t => 1 - Math.pow(1 - t, 4);

    function frame(now) {
      const t = Math.min((now - t0) / DUR, 1);
      rotRef.current = r0 + (finalRot - r0) * ease(t);
      draw(rotRef.current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        // Read actual landed segment as ground truth
        const landedIdx = getSegmentAt(rotRef.current);
        spinning.current = false;
        setResult(segments[landedIdx]);
        setPhase("result");
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  return (
    <div className="se pg">
      <div style={{ width: "100%", marginTop: 36, textAlign: "center" }}>

        {/* Title */}
        <div className="fu" style={{ animationDelay: ".1s", marginBottom: 10 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: CHARCOAL, letterSpacing: ".04em" }}>Spin & Win</h2>
          <p style={{ fontSize: 13, color: MID, marginTop: 6, letterSpacing: ".03em" }}>
            {phase === "idle" ? "Tap the button to spin the wheel" : phase === "spinning" ? "Spinning…" : "The wheel has spoken!"}
          </p>
          <div className="orn" style={{ marginTop: 14 }} />
        </div>

        {/* Wheel */}
        <div className="fu" style={{ animationDelay: ".2s", margin: "20px auto", position: "relative" }}>
          <div className="wwrap">
            <div className="wptr" />
            <canvas
              ref={canvasRef}
              width={300} height={300}
              style={{ borderRadius: "50%", display: "block" }}
            />
            <div className="wctr">
              <span style={{ fontSize: 16, color: GOLD }}>✦</span>
            </div>
          </div>
        </div>

        {/* Result overlay — shown after spin */}
        {phase === "result" && result && (
          <div className="fu" style={{ animationDelay: "0s", width: "100%", marginTop: 8 }}>
            {result.isLose ? (
              /* ── No win ── */
              <div style={{ background: WARM_WHITE, border: `1.5px solid ${BORDER}`, borderRadius: 16, padding: "24px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🌟</div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, color: CHARCOAL }}>Better luck next time</p>
                <p style={{ fontSize: 13, color: MID, marginTop: 8, lineHeight: 1.6 }}>Come back on your next visit for another chance to win.</p>
              </div>
            ) : (
              /* ── Win ── */
              <div style={{ background: WARM_WHITE, border: `1.5px solid ${BORDER_GOLD}`, borderRadius: 16, padding: "24px 20px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${GOLD},${GOLD_LIGHT},${GOLD})` }} />
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, letterSpacing: ".12em", color: GOLD, textTransform: "uppercase", marginBottom: 4 }}>You won</p>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: CHARCOAL }}>{result.label}</p>
                <p style={{ fontSize: 13, color: MID, marginTop: 8, lineHeight: 1.6 }}>Tap below to get your reward code.</p>
              </div>
            )}

            <button
              className="cta"
              onClick={() => onComplete(result)}
              style={{ marginTop: 4 }}
            >
              {result.isLose ? "Continue" : "Claim My Reward →"}
            </button>
          </div>
        )}

        {/* Spin button — only before spinning */}
        {phase === "idle" && (
          <div className="fu" style={{ animationDelay: ".35s", marginTop: 4 }}>
            <button className="cta" onClick={startSpin} style={{ maxWidth: 240, margin: "0 auto" }}>
              Spin the Wheel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Screen: Reward code ──────────────────────────────────────────────────────
function ScreenReward({ reward, customer, restaurant }) {
  const [code] = useState(makeCode);
  const [copied, setCopied] = useState(false);
  const isWin = !reward.isLose;
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!isWin) {
    return (
      <div className="se pg">
        <div style={{ width: "100%", marginTop: 80, textAlign: "center" }}>
          <div className="fu" style={{ animationDelay: ".1s" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 400, color: CHARCOAL }}>Better luck next time</h2>
            <p style={{ fontSize: 14, color: MID, marginTop: 12, lineHeight: 1.7 }}>Come back on your next visit for another chance to win a reward.</p>
            <div className="orn" style={{ marginTop: 20 }} />
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: MID, marginTop: 24, lineHeight: 1.7 }}>Thank you for dining with us.</p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: GOLD, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 6 }}>— The {restaurant?.name ?? "Team"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="se pg">
      <div style={{ width: "100%", marginTop: 52, textAlign: "center" }}>

        <div className="fu" style={{ animationDelay: ".1s", marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, letterSpacing: ".2em", color: GOLD_LIGHT, textTransform: "uppercase", marginBottom: 6 }}>Congratulations{customer?.name ? `, ${customer.name.split(" ")[0]}` : ""}!</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 400, color: CHARCOAL }}>You've won</h2>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 600, color: GOLD, marginTop: 4 }}>{reward.label}</p>
          <div className="orn" style={{ marginTop: 16 }} />
        </div>

        {/* Coupon card */}
        <div className="fu" style={{ animationDelay: ".25s", marginBottom: 24 }}>
          <div style={{
            background: WARM_WHITE,
            border: `1.5px solid ${BORDER_GOLD}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(184,149,42,.15)",
          }}>
            {/* Top gold bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg,${GOLD},${GOLD_LIGHT},${GOLD})` }} />

            {/* Coupon body */}
            <div style={{ padding: "28px 24px" }}>
              <p style={{ fontSize: 10, color: MID, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Your reward</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: CHARCOAL, marginBottom: 20 }}>{reward.label}</p>

              {/* Dashed divider */}
              <div style={{ borderTop: `2px dashed ${BORDER}`, margin: "0 -24px 20px", position: "relative" }}>
                <div style={{ position: "absolute", top: -10, left: -10, width: 20, height: 20, borderRadius: "50%", background: GOLD_BG, border: `1.5px solid ${BORDER_GOLD}` }} />
                <div style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", background: GOLD_BG, border: `1.5px solid ${BORDER_GOLD}` }} />
              </div>

              {/* Code */}
              <p style={{ fontSize: 10, color: MID, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>Promo code</p>
              <div
                onClick={copy}
                style={{
                  fontFamily: "'Jost',monospace",
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: ".22em",
                  color: GOLD,
                  background: GOLD_BG,
                  border: `1.5px dashed ${BORDER_GOLD}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "background .2s",
                  marginBottom: 8,
                }}
              >
                {code}
              </div>
              <p style={{ fontSize: 12, color: copied ? GOLD : MID, letterSpacing: ".05em", transition: "color .2s" }}>
                {copied ? "✓ Copied to clipboard" : "Tap code to copy"}
              </p>

              {/* Dashed divider bottom */}
              <div style={{ borderTop: `2px dashed ${BORDER}`, margin: "20px -24px 20px", position: "relative" }}>
                <div style={{ position: "absolute", top: -10, left: -10, width: 20, height: 20, borderRadius: "50%", background: GOLD_BG, border: `1.5px solid ${BORDER_GOLD}` }} />
                <div style={{ position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%", background: GOLD_BG, border: `1.5px solid ${BORDER_GOLD}` }} />
              </div>

              <p style={{ fontSize: 12, color: MID, lineHeight: 1.6 }}>Valid until <strong>{expiry}</strong></p>
              <p style={{ fontSize: 12, color: MID, marginTop: 4, lineHeight: 1.6 }}>Show to your server or at the counter to redeem.</p>
            </div>

            {/* Bottom gold bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg,${GOLD},${GOLD_LIGHT},${GOLD})` }} />
          </div>
        </div>

        <div className="fu" style={{ animationDelay: ".4s" }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: MID, marginBottom: 6, lineHeight: 1.7 }}>Thank you for dining with us.</p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: GOLD, letterSpacing: ".12em", textTransform: "uppercase" }}>— The {restaurant?.name ?? "Team"}</p>
        </div>

      </div>
    </div>
  );
}


// ─── App shell ────────────────────────────────────────────────────────────────
const RESTAURANT = {
  id: "rest_001", name: "Noura Dubai", logoUrl: null,
  googleReviewUrl: "https://g.page/r/demo/review", tableLabel: "Table 7",
};
const PROG = { qr: 0, landing: 10, sentiment: 30, review: 60, feedback: 60, spin: 78, reward: 100 };

async function saveToDatabase(customer, sentiment, reward, code) {
  try {
    await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        sentiment: sentiment,
        reward_label: reward?.label,
        reward_code: code,
        qr_token: 'rest_001_t7',
      }),
    })
  } catch (e) {
    console.error('Failed to save:', e)
  }
}

export default function Page() {
  const [screen, setScreen]     = useState("qr");
  const [customer, setCustomer] = useState({});
  const [reward, setReward]     = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [segments] = useState(DEFAULT_SEGMENTS);

  function onSpinDone(seg) {
    setReward(seg);
    if (!seg.isLose) { setConfetti(true); setTimeout(() => setConfetti(false), 5500); }
    saveToDatabase(customer, screen === "feedback" ? "negative" : "positive", seg, makeCode());
    setScreen("reward");
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rs">
        <div className="pbar" style={{ width: `${PROG[screen] ?? 0}%` }} />
        <Confetti active={confetti} />

        {screen === "qr"        && <ScreenQR        restaurant={RESTAURANT} onScan={() => setScreen("landing")} />}
        {screen === "landing"   && <ScreenLanding   restaurant={RESTAURANT} onContinue={d => { setCustomer(d); setScreen("sentiment"); }} />}
        {screen === "sentiment" && <ScreenSentiment restaurant={RESTAURANT} onSelect={s => setScreen(s === "positive" ? "review" : "feedback")} />}
        {screen === "review"    && <ScreenReview    restaurant={RESTAURANT} onDone={() => setScreen("spin")} />}
        {screen === "feedback"  && <ScreenFeedback  onSubmit={() => setScreen("spin")} />}
        {screen === "spin"      && <ScreenSpin key={segments.length} segments={segments} onComplete={onSpinDone} />}
        {screen === "reward"    && <ScreenReward    reward={reward} customer={customer} restaurant={RESTAURANT} />}

        <div style={{ position: "fixed", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "rgba(107,100,96,.3)", letterSpacing: ".12em", textTransform: "uppercase", zIndex: 5, fontFamily: "'Jost',sans-serif", pointerEvents: "none" }}>
          {RESTAURANT.tableLabel} · ReviewSpin
        </div>
      </div>
    </>
  );
}
