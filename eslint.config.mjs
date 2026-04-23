import { defineConfig, globalIgnores } from 'eslint/config'
import nextConfig from 'eslint-config-next'

const eslintConfig = defineConfig([
  ...nextConfig,
  {
    rules: {
      // 이유: 이 프로젝트는 클라이언트 컴포넌트에서 fetch 후 상태를 갱신하는 패턴이 많고,
      // 이 규칙은 그런 정상적인 비동기 데이터 로딩까지 과하게 금지해 리팩터링 범위를 불필요하게 키웁니다.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  globalIgnores([
    '.yarn/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
