// Small helpers that behave well both locally and inside a published claude.ai page.

/** True when built for the shareable claude.ai page (`VITE_ARTIFACT=1 npm run build`). */
export const IS_ARTIFACT = import.meta.env.VITE_ARTIFACT === '1';
/** The published page's frame cannot open the print dialog. */
export const CAN_PRINT = !IS_ARTIFACT;

/** Save a generated file: uses the viewer's downloads capability when present, else a normal browser download. */
export async function saveFile(filename: string, data: string, mime: string): Promise<'saved' | 'declined' | 'failed'> {
  const c = (window as any).claude;
  if (c?.use) {
    const d = await c.use('downloads').catch(() => null);
    if (d) {
      try { await d.save({ filename, data }); return 'saved'; } catch (e: any) { return e?.code === 'declined' ? 'declined' : 'failed'; }
    }
    if (IS_ARTIFACT) return 'failed';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: mime }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'saved';
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
