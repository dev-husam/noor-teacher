// 📜 Certificates of appreciation: drawn on a canvas so the preview, PNG, share and print are identical.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CERT_KINDS } from '../data/games';
import { gregToday, hijriToday } from '../i18n';
import { CAN_PRINT } from '../lib/platform';
import { sfx } from '../lib/sound';
import { Student, useClass, useStore } from '../store';
import { Empty, useUI } from './ui';

const W = 1600, H = 1130;
const DISPLAY = "'Baloo Bhaijaan 2', 'Tajawal', sans-serif";
const BODY = "'Tajawal', sans-serif";

function star8(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.save(); c.translate(x, y); c.fillStyle = fill;
  for (const rot of [0, Math.PI / 4]) { c.save(); c.rotate(rot); c.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); c.restore(); }
  c.fillStyle = '#FFFBF0'; c.beginPath(); c.arc(0, 0, r * 0.38, 0, Math.PI * 2); c.fill(); c.restore();
}
function fitFont(c: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxW: number) {
  let s = size;
  do { c.font = `${weight} ${s}px ${family}`; s -= 4; } while (c.measureText(text).width > maxW && s > 24);
}

type CertData = { student: Student; title: string; emoji: string; reason: string; teacher: string; className: string };

export async function drawCertificate(cv: HTMLCanvasElement, d: CertData) {
  try { await Promise.all([document.fonts.load(`800 80px ${DISPLAY}`), document.fonts.load(`700 40px ${BODY}`)]); } catch { /* fall back to system fonts */ }
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!;
  const girl = d.student.gender === 'girl';
  c.direction = 'rtl'; c.textBaseline = 'middle';

  // paper + faint star pattern
  c.fillStyle = '#FFFBF0'; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.06;
  for (let y = 120; y < H - 80; y += 120) for (let x = 120 + ((y / 120) % 2) * 60; x < W - 80; x += 120) star8(c, x, y, 22, '#0FA968');
  c.globalAlpha = 1;

  // frames + corner stars
  c.strokeStyle = '#0A7C5C'; c.lineWidth = 16; c.strokeRect(32, 32, W - 64, H - 64);
  c.strokeStyle = '#E0A800'; c.lineWidth = 4; c.strokeRect(62, 62, W - 124, H - 124);
  c.setLineDash([2, 14]); c.lineCap = 'round'; c.strokeStyle = '#0FA968'; c.lineWidth = 6; c.strokeRect(80, 80, W - 160, H - 160); c.setLineDash([]);
  for (const [x, y] of [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]]) star8(c, x, y, 34, '#E0A800');

  c.textAlign = 'center';
  // header
  c.font = `64px serif`; c.fillText('🌙', W / 2, 150);
  c.fillStyle = '#0A7C5C'; c.font = `800 112px ${DISPLAY}`; c.fillText('شهادة تقدير', W / 2, 250);

  // award pill
  const pill = `${d.emoji}  ${d.title}`;
  c.font = `800 44px ${BODY}`;
  const pw = Math.min(W - 400, c.measureText(pill).width + 90);
  c.fillStyle = '#FFE8A3'; c.strokeStyle = '#E0A800'; c.lineWidth = 4;
  c.beginPath(); if (c.roundRect) c.roundRect(W / 2 - pw / 2, 312, pw, 76, 38); else c.rect(W / 2 - pw / 2, 312, pw, 76); c.fill(); c.stroke();
  c.fillStyle = '#6B4E00'; c.fillText(pill, W / 2, 352);

  c.fillStyle = '#334155'; c.font = `500 40px ${BODY}`;
  c.fillText(`يسرّنا أن نمنح ${girl ? 'الطالبة المتميّزة' : 'الطالب المتميّز'}`, W / 2, 450);

  // avatar + name
  c.fillStyle = d.student.color; c.globalAlpha = 0.18; c.beginPath(); c.arc(W / 2, 560, 74, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = d.student.color; c.lineWidth = 6; c.stroke();
  c.font = `84px serif`; c.fillText(d.student.avatar, W / 2, 566);
  c.fillStyle = '#142034'; fitFont(c, d.student.name, 800, 104, DISPLAY, W - 420); c.fillText(d.student.name, W / 2, 712);
  const nw = Math.min(W - 420, c.measureText(d.student.name).width + 80);
  c.strokeStyle = '#E0A800'; c.lineWidth = 5; c.beginPath(); c.moveTo(W / 2 - nw / 2, 778); c.lineTo(W / 2 + nw / 2, 778); c.stroke();

  if (d.reason) { c.fillStyle = '#334155'; fitFont(c, d.reason, 600, 42, BODY, W - 360); c.fillText(d.reason, W / 2, 840); }
  c.fillStyle = '#A16207'; c.font = `700 36px ${BODY}`;
  c.fillText(girl ? 'بارك الله فيها ونفع بها، وجعلها من أهل القرآن 🤲' : 'بارك الله فيه ونفع به، وجعله من أهل القرآن 🤲', W / 2, 908);

  // footer: teacher (right) · class (centre) · date (left)
  const fy = 1010;
  c.fillStyle = '#475569'; c.font = `600 30px ${BODY}`;
  c.textAlign = 'right'; c.fillText(d.teacher ? `المعلّم/ـة: ${d.teacher}` : 'توقيع المعلّم/ـة', W - 170, fy);
  c.strokeStyle = '#94A3B8'; c.lineWidth = 2; c.beginPath(); c.moveTo(W - 520, fy - 44); c.lineTo(W - 170, fy - 44); c.stroke();
  c.textAlign = 'center'; c.fillStyle = '#0A7C5C'; c.font = `800 32px ${BODY}`; c.fillText(d.className, W / 2, fy);
  c.textAlign = 'left'; c.fillStyle = '#475569'; c.font = `600 28px ${BODY}`;
  c.fillText(hijriToday('ar'), 170, fy - 18); c.fillText(gregToday('ar'), 170, fy + 22);
}

export default function CertificateMaker({ sid: initialSid }: { sid?: string }) {
  const c = useClass();
  const teacherName = useStore((s) => s.settings.teacherName);
  const toast = useUI((s) => s.toast);
  const [sid, setSid] = useState(initialSid || c.students[0]?.id || '');
  const [kind, setKind] = useState(CERT_KINDS[0].id);
  const [customTitle, setCustomTitle] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [printing, setPrinting] = useState<string | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const student = c.students.find((s) => s.id === sid);
  const k = CERT_KINDS.find((x) => x.id === kind)!;
  const title = kind === 'custom' ? customTitle.trim() || k.title : k.title;
  const reason = kind === 'custom' ? customReason.trim() : k.reason[student?.gender === 'girl' ? 1 : 0];

  useEffect(() => {
    if (cv.current && student) drawCertificate(cv.current, { student, title, emoji: k.emoji, reason, teacher: teacherName, className: c.name });
  }, [student, title, reason, k.emoji, teacherName, c.name]);
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add('print-cert');
    const done = () => { document.body.classList.remove('print-cert'); setPrinting(null); };
    window.addEventListener('afterprint', done, { once: true });
    const id = setTimeout(() => window.print(), 150);
    return () => { clearTimeout(id); window.removeEventListener('afterprint', done); document.body.classList.remove('print-cert'); };
  }, [printing]);

  if (!c.students.length) return <Empty emoji="📜" title="أضف طلابًا أولًا" text="ثم صمّم لهم شهادات التقدير" />;
  const fileName = `شهادة-${student?.name || 'طالب'}.png`;
  const blob = () => new Promise<Blob | null>((res) => cv.current?.toBlob(res, 'image/png'));
  const download = async () => {
    const b = await blob(); if (!b) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); sfx.coin(); toast('📥 تم حفظ الشهادة');
  };
  const file = async () => { const b = await blob(); return b ? new File([b], fileName, { type: 'image/png' }) : null; };
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare;
  const share = async () => {
    const f = await file(); if (!f) return;
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: 'شهادة تقدير' }); } catch { /* cancelled */ } }
    else download();
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', alignItems: 'start' }}>
      <div className="card col" style={{ gap: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>📜 صمّم الشهادة</div>
        <div><label className="label">الطالب</label>
          <select className="select" value={sid} onChange={(e) => setSid(e.target.value)}>
            {c.students.map((s) => <option key={s.id} value={s.id}>{s.avatar} {s.name}</option>)}
          </select></div>
        <div><label className="label">نوع الشهادة</label>
          <div className="row wrap" style={{ gap: 6 }}>
            {CERT_KINDS.map((x) => <button key={x.id} className={`btn sm ${kind === x.id ? 'primary' : ''}`} onClick={() => setKind(x.id)}>{x.emoji} {x.id === 'custom' ? 'مخصّصة' : x.title}</button>)}
          </div></div>
        {kind === 'custom' && (
          <>
            <div><label className="label">عنوان الشهادة</label><input className="input" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="مثال: بطل المسابقة" maxLength={40} /></div>
            <div><label className="label">سبب التقدير</label><input className="input" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="مثال: لفوزه في مسابقة السيرة النبوية" maxLength={70} /></div>
          </>
        )}
        {!teacherName && <p className="muted" style={{ fontSize: 13, margin: 0 }}>💡 أضف اسمك من «الإعدادات» ليظهر في توقيع الشهادة.</p>}
      </div>
      <div className="card col" style={{ gap: 12 }}>
        <canvas ref={cv} width={W} height={H} style={{ width: '100%', height: 'auto', borderRadius: 12, boxShadow: 'var(--shadow)' }} aria-label={`شهادة ${student?.name ?? ''}`} />
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn primary" onClick={download}>📥 حفظ صورة</button>
          {canShare && <button className="btn" onClick={share}>📤 مشاركة</button>}
          {CAN_PRINT && <button className="btn" onClick={() => setPrinting(cv.current?.toDataURL('image/png') || null)}>🖨️ طباعة</button>}
        </div>
      </div>
      {printing && createPortal(<div className="cert-print"><img src={printing} alt="" /></div>, document.body)}
    </div>
  );
}
