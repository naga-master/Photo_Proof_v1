# Network Access Guide

Access the Photo Proof application from any device on your local network (WiFi).

## Quick Start

### 1. Start the Backend
```bash
cd ../photo_proof_api
python main.py
# OR
./start.sh
```

The backend will display network URLs:
```
🚀 Photo Proof API Server
==================================================
📍 Local:   http://localhost:8000
🌐 Network: http://192.168.1.5:8000
📚 Docs:    http://localhost:8000/docs
==================================================
```

### 2. Start the Frontend
```bash
cd Photo_Proof_v1
npm run dev
```

The frontend will display network URLs:
```
🌐 Network Access:
   Frontend - Local:   http://localhost:3001
   Frontend - Network: http://192.168.1.5:3001
   Backend  - Local:   http://localhost:8000
   Backend  - Network: http://192.168.1.5:8000
```

### 3. Access from Mobile Device
On your mobile device (connected to the same WiFi):
- Open browser
- Navigate to the **Network URL** displayed (e.g., `http://192.168.1.5:3001`)

## How It Works

### Dynamic IP Detection
- **Backend**: Automatically detects local network IP on startup
- **Frontend**: Vite config dynamically finds network IP and configures proxy
- **CORS**: Wildcard patterns allow any IP address on specific ports

### Wildcard CORS Configuration
The backend accepts requests from any IP on these ports:
- `http://*.*.*.*:3001` - Frontend
- `http://*.*.*.*:8000` - Direct backend access
- Plus localhost URLs for local development

This means when your IP changes (WiFi reconnect), the app continues to work without reconfiguration.

## Troubleshooting

### Mobile Can't Connect

**Check WiFi Connection**
- Ensure mobile device is on the **same WiFi network** as your computer
- Guest networks may block device-to-device communication

**Check Firewall**
Your Mac's firewall might be blocking incoming connections:
1. Open **System Preferences** → **Security & Privacy** → **Firewall**
2. Click **Firewall Options**
3. Ensure "Block all incoming connections" is **not** checked
4. Add Python and Node to allowed apps if needed

**Verify IP Address**
Run this command to check your current IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Backend Errors (500)
If you see 500 errors:
- Ensure **backend starts BEFORE frontend**
- Backend must be running on port 8000
- Check backend logs for errors

### CORS Errors
If you see CORS errors in browser console:
- Backend `.env` should have wildcard patterns
- Restart backend after changing `.env`
- Check browser console for specific origin being blocked

## Network Requirements

- **Ports**: 3001 (frontend), 8000 (backend)
- **Network**: All devices on same WiFi
- **Firewall**: Must allow incoming connections
- **IP Range**: Works with any private IP (192.168.x.x, 10.x.x.x, etc.)

## Security Note

The wildcard CORS configuration is designed for **local network development**. For production deployment:
1. Replace wildcard patterns with specific domain names
2. Use HTTPS with valid certificates
3. Implement proper authentication
4. Use environment variables to control CORS settings
