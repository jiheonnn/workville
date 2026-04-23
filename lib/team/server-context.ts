import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  Database,
  Profile,
  TeamMember,
  TeamRole,
} from '@/types/database'

export type AppSupabaseClient = SupabaseClient<Database>

export interface AuthenticatedProfileContext {
  userId: string
  profile: Profile
}

export interface ActiveTeamContext extends AuthenticatedProfileContext {
  activeTeamId: string
}

export async function requireAuthenticatedProfile(
  supabase: AppSupabaseClient
): Promise<AuthenticatedProfileContext> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('UNAUTHORIZED')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('PROFILE_NOT_FOUND')
  }

  return {
    userId: user.id,
    profile,
  }
}

export async function requireActiveMembership(
  supabase: AppSupabaseClient,
  teamId: string,
  userId: string
) {
  const { data: membership, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !membership) {
    throw new Error('TEAM_ACCESS_DENIED')
  }

  return membership as TeamMember
}

export async function requireTeamRole(
  supabase: AppSupabaseClient,
  teamId: string,
  userId: string,
  role: TeamRole
) {
  const membership = await requireActiveMembership(supabase, teamId, userId)

  if (membership.role !== role) {
    throw new Error('TEAM_ROLE_DENIED')
  }

  return membership
}

export async function requireActiveTeam(
  supabase: AppSupabaseClient
): Promise<ActiveTeamContext> {
  const context = await requireAuthenticatedProfile(supabase)

  if (!context.profile.active_team_id) {
    throw new Error('ACTIVE_TEAM_REQUIRED')
  }

  await requireActiveMembership(supabase, context.profile.active_team_id, context.userId)

  return {
    ...context,
    activeTeamId: context.profile.active_team_id,
  }
}
