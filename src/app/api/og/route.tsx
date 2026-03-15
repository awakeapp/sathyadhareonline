import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Sathyadhare';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || 'Sathyadhare Editorial';
  const imageUrl = searchParams.get('image') || '';
  const readTime = searchParams.get('readTime') || '';

  // Truncate title for display
  const displayTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
          background: '#0d0d0d',
          overflow: 'hidden',
        }}
      >
        {/* Background image with overlay */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.2,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(13,13,13,0.95) 0%, rgba(104,93,230,0.3) 100%)',
          }}
        />

        {/* Accent line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            background: 'linear-gradient(180deg, #685de6 0%, #ffe500 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 70px',
            width: '100%',
          }}
        >
          {/* Top: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: '#685de6',
                borderRadius: '10px',
                padding: '6px 14px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              SATHYADHARE
            </div>
            {category && (
              <div
                style={{
                  background: 'rgba(255,229,0,0.15)',
                  border: '1px solid rgba(255,229,0,0.4)',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  color: '#ffe500',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {category}
              </div>
            )}
          </div>

          {/* Middle: Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: displayTitle.length > 50 ? '42px' : '52px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {displayTitle}
            </div>
          </div>

          {/* Bottom: Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Author avatar placeholder */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #685de6, #ffe500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 900,
                color: '#fff',
              }}
            >
              {author[0]?.toUpperCase() || 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{author}</span>
              {readTime && (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {readTime}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              sathyadhare.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
