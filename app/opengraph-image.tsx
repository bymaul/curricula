import { ImageResponse } from 'next/og';

export const alt = 'Curricula - free offline resume and CV builder';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        backgroundColor: '#09090b',
        color: '#fafafa',
      }}
    >
      <div style={{ display: 'flex', fontSize: 110, fontWeight: 700 }}>
        Curricula
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 52, color: '#a1a1aa' }}>
          Free offline resume & CV builder
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#71717a' }}>
          Harvard-style templates, clean PDF printing, AI import. No account
          needed.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
