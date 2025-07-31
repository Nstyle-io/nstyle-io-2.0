import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          
          // UI vendor chunks (split Radix UI components)
          'radix-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs'
          ],
          'radix-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider'
          ],
          
          // Backend services
          'supabase-vendor': ['@supabase/supabase-js'],
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/analytics'
          ],
          
          // Large third-party libraries
          'fabric-vendor': ['fabric'],
          'maps-vendor': ['@googlemaps/js-api-loader'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],
          
          // Feature-based chunks
          'auth-features': [
            './src/components/auth/AuthGuard.tsx',
            './src/components/auth/EnhancedAuth.tsx',
            './src/components/auth/PasswordlessAuth.tsx',
            './src/services/unified-auth.ts',
            './src/hooks/useFirebaseAuth.tsx',
            './src/hooks/useSocialAuth.tsx'
          ],
          
          'social-features': [
            './src/components/social/SocialFeed.tsx',
            './src/components/feed/PostCard.tsx',
            './src/components/feed/PostActions.tsx',
            './src/components/social/CommentSection.tsx',
            './src/hooks/usePosts.ts'
          ],
          
          'salon-features': [
            './src/pages/SalonDashboard.tsx',
            './src/pages/SalonProfile.tsx',
            './src/pages/SalonSetup.tsx',
            './src/components/booking/BookingModal.tsx'
          ],
          
          'discovery-features': [
            './src/pages/Discover.tsx',
            './src/components/discover/GoogleMapsInterface.tsx',
            './src/components/maps/SalonMap.tsx',
            './src/components/maps/SalonSearchList.tsx'
          ],
          
          'messaging-features': [
            './src/pages/Messages.tsx',
            './src/components/messaging/SnapchatStyleMessages.tsx',
            './src/components/messaging/NewConversationModal.tsx'
          ],
          
          'media-features': [
            './src/components/camera/CameraCapture.tsx',
            './src/components/camera/ProfilePictureUpload.tsx',
            './src/components/stories/CreateStory.tsx',
            './src/components/stories/StoryViewer.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false // Speed up build
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      'fabric', // Large canvas library - lazy load
      '@googlemaps/js-api-loader' // Load on demand
    ]
  },
  
  // CSS optimization
  css: {
    devSourcemap: mode === 'development'
  }
}));