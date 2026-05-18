export function metersToMiles(meters: number): number {
  return meters / 1609.344
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084
}

export function formatDistance(meters: number): string {
  const miles = metersToMiles(meters)
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles).toLocaleString()} mi`
}

export function formatElevation(meters: number): string {
  const feet = metersToFeet(meters)
  return `${Math.round(feet).toLocaleString()} ft`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatPace(metersPerSecond: number): string {
  if (metersPerSecond <= 0) return '—'
  const secondsPerMile = 1609.344 / metersPerSecond
  const minutes = Math.floor(secondsPerMile / 60)
  const seconds = Math.round(secondsPerMile % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')} /mi`
}

export function formatSpeed(metersPerSecond: number): string {
  const mph = metersPerSecond * 2.23694
  return `${mph.toFixed(1)} mph`
}

export function formatActivityDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}
