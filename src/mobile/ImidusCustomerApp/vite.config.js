import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['react-native-web'],
      },
    }),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, './src'),
      // Native module stubs for web preview
      'react-native-linear-gradient': path.resolve(__dirname, './src/web-stubs/react-native-linear-gradient.tsx'),
      '@react-native-firebase/messaging': path.resolve(__dirname, './src/web-stubs/firebase-messaging.ts'),
      '@react-native-firebase/app': path.resolve(__dirname, './src/web-stubs/firebase-app.ts'),
      'react-native-webview': path.resolve(__dirname, './src/web-stubs/react-native-webview.tsx'),
      '@gorhom/bottom-sheet': path.resolve(__dirname, './src/web-stubs/bottom-sheet.tsx'),
      'react-native-reanimated': path.resolve(__dirname, './src/web-stubs/reanimated.ts'),
      'react-native-gesture-handler': path.resolve(__dirname, './src/web-stubs/gesture-handler.ts'),
      '@react-native-community/slider': path.resolve(__dirname, './src/web-stubs/slider.tsx'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './src/web-stubs/async-storage.ts'),
      'react-native-screens': path.resolve(__dirname, './src/web-stubs/screens.ts'),
      'react-native-safe-area-context': path.resolve(__dirname, './src/web-stubs/safe-area-context.tsx'),
      '@react-native-masked-view/masked-view': path.resolve(__dirname, './src/web-stubs/masked-view.tsx'),
      'react-native-skeleton-placeholder': path.resolve(__dirname, './src/web-stubs/skeleton-placeholder.tsx'),
      'lucide-react-native': 'lucide-react',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  define: {
    __DEV__: JSON.stringify(true),
    'process.env': {},
  },
  optimizeDeps: {
    exclude: [
      'react-native-linear-gradient',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      'react-native-webview',
      '@gorhom/bottom-sheet',
      'react-native-reanimated',
      'react-native-gesture-handler',
      '@react-native-community/slider',
      '@react-native-async-storage/async-storage',
      'react-native-screens',
      'react-native-safe-area-context',
      '@react-native-masked-view/masked-view',
      'react-native-skeleton-placeholder',
    ],
  },
  server: {
    port: 3333,
    host: true,
  },
});
