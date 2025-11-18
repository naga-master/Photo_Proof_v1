import path from 'path';
import os from 'os';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Get local network IP address
function getNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const networkIP = getNetworkIP();
    
    // Use localhost for proxy since frontend and backend run on same machine
    // networkIP is only for showing mobile device access URLs
    const backendTarget = 'http://localhost:8000';
    
    console.log('\n🌐 Network Access:');
    console.log(`   Frontend - Local:   http://localhost:3001`);
    console.log(`   Frontend - Network: http://${networkIP}:3001`);
    console.log(`   Backend  - Local:   http://localhost:8000`);
    console.log(`   Backend  - Network: http://${networkIP}:8000`);
    console.log(`   Proxy Target:       ${backendTarget}\n`);
    
    return {
      server: {
        port: 3001,
        host: '0.0.0.0', // Listen on all interfaces for network access
        open: true,
        proxy: {
          '/api': {
            target: backendTarget,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
