import { defineConfig } from 'vite';

export default defineConfig({
    // ✅ 깃허브 레포 이름 그대로 써야 함!
    base: '/kmuvcd2025_team/',

    server: {
        host: true,
        port: 5173,
        open: true,
        strictPort: true,
    },

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
});
