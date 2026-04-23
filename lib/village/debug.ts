type VillageDebugPayload = Record<string, unknown>

function shouldLogVillageDebug() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_VILLAGE === 'true'
}

export function createVillageTraceId(action: string) {
  return `${action}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function logVillageDebug(event: string, payload: VillageDebugPayload = {}) {
  if (!shouldLogVillageDebug()) {
    return
  }

  const timestamp =
    typeof performance !== 'undefined'
      ? Number(performance.now().toFixed(1))
      : Date.now()

  console.log(`[village-debug:${timestamp}] ${event}`, payload)
}
