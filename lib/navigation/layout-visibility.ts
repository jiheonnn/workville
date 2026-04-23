export function shouldHideMainNavigation(
  pathname: string,
  activeTeamId: string | null | undefined
) {
  // 이유: 팀이 없는 최초 사용자에게는 `/team`이 메인 앱이 아니라 온보딩 단계입니다.
  // 이때 상단/하단 메뉴를 보여주면 이동 가능한 앱처럼 보이지만 실제로는 다른 화면에 진입할 수 없어
  // 혼동만 커지므로, 팀 온보딩 상태에서만 메인 네비게이션을 숨깁니다.
  return pathname === '/team' && !activeTeamId
}
