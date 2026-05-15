import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
// GitHub Pages 서브경로 호환을 위해 base 를 환경변수로 받음.
// 기본값: 사용자가 https://USER.github.io/toolfit/ 에 배포한다고 가정 → "/toolfit/"
// 로컬 개발에서는 vite dev 가 base 를 무시하므로 영향 없음.
// 다른 repo 이름을 쓰려면 VITE_BASE_PATH=/your-repo/ 로 빌드.
export default defineConfig(({ command }) => ({
  plugins: [react(), svgr()],
  base:
    command === 'build'
      ? (process.env.VITE_BASE_PATH || '/toolfit/')
      : '/',
}))
