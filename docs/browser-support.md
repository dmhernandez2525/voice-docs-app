# Browser Support

## Speech Recognition Support

### Full Support
- **Chrome/Chromium** - Complete implementation with all features
- **Microsoft Edge** - Full compatibility with Chrome APIs

### Limited Support
- **Firefox** - Basic speech recognition, may require user activation
- **Safari** - Partial support, some features may not work

### Requirements
- Modern browser with ES2022 support
- HTTPS connection (required for microphone access in production)
- Microphone permissions granted by user

## Speech Synthesis Support

### Universal Support
All modern browsers support the `speechSynthesis` API:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop and mobile platforms

### Voice Availability
- System voices vary by platform
- English voices prioritized for selection
- Fallback to first available voice if no English voice found

## Feature Compatibility

### Core Features (All Browsers)
- Basic voice recognition (where supported)
- Speech synthesis output
- Manual mode functionality
- Documentation browsing

### Advanced Features (Chrome/Edge)
- Continuous listening in Talk Mode
- Real-time transcription display
- Automatic silence detection
- Seamless conversation flow

## Production Deployment

### HTTPS Requirement
Voice features require secure context:
- Development: `localhost` works with HTTP
- Production: Must use HTTPS
- Self-signed certificates not recommended

### Performance Considerations
- Voice processing happens locally in browser
- No external API calls for speech features
- Minimal bandwidth usage
- Works offline for voice functionality

## Troubleshooting

### Common Issues
- **Microphone not working**: Check HTTPS and permissions
- **No voice output**: Verify browser TTS support
- **Recognition errors**: Try Chrome/Edge for best results
- **Permission denied**: Check browser settings and HTTPS

### Testing
Use the built-in voice testing utilities to verify browser compatibility and diagnose issues.
