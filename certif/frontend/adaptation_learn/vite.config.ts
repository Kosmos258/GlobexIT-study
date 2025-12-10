import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

export default ({ mode }: {mode: string}) => {
  const isProduction = mode === 'production';
  
  return defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, './src/shared'),
			'@app': path.resolve(__dirname, './src/app'),
			'@api': path.resolve(__dirname, './src/api'),
			'@pages': path.resolve(__dirname, './src/pages'),
			'@store': path.resolve(__dirname, './src/store'),
		},
	},
	base: isProduction ? '/certif/frontend/adaptation_learn/dist' : '',
	server: {
		open: true,
		port: 5173,
		proxy: {
			'/custom_web_template': {
				target: 'http://localhost:80',
				changeOrigin: true,
			},
		}
	},
	build: {
		sourcemap: false,
	},
  });
};