interface ResolveVillageCurrentUserIdInput {
  villageStoreUserId: string | null
  authStoreUserId: string | null
}

export function resolveVillageCurrentUserId({
  villageStoreUserId,
  authStoreUserId,
}: ResolveVillageCurrentUserIdInput) {
  return villageStoreUserId ?? authStoreUserId
}
