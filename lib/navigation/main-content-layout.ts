interface MainContentClassNameParams {
  pathname: string
  hideMainNavigation: boolean
}

export function getMainContentClassName({
  pathname,
  hideMainNavigation,
}: MainContentClassNameParams) {
  const maxWidthClassName = pathname === '/village' ? 'max-w-[1536px]' : 'max-w-7xl'
  const spacingClassName = hideMainNavigation
    ? 'py-12 px-4 sm:px-6 lg:px-8'
    : 'py-8 sm:px-6 lg:px-8 pb-20 sm:pb-8'

  // 이유: village 화면만 업무일지 작성 공간이 핵심 작업 영역이라 더 넓은 폭을 허용합니다.
  // 다른 메인 화면은 기존 최대폭을 유지해 의도치 않은 시각 변화가 퍼지지 않게 합니다.
  return `${maxWidthClassName} mx-auto animate-fadeIn ${spacingClassName}`
}
