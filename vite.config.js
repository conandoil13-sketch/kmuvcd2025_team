import { defineConfig } from 'vite';

export default defineConfig({
    // GitHub Pages용 경로 설정 (레포 이름과 완전히 동일해야 함)
    base: '/kmuvcd2025_team/',

    server: {
        host: true,
        port: 5173,
        open: true,
        strictPort: true
    },

    build: {
        outDir: 'dist', // 기본값, 명시적으로 지정
        assetsDir: 'assets', // 정적 자산 폴더
    }
});
