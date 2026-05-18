import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        color: '#ffffff',
        fontSize: 96,
        fontWeight: 800,
        letterSpacing: -4,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        borderRadius: 36,
      }}
    >
      NK
    </div>,
    { ...size }
  )
}
