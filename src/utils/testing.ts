// Testing utilities for voice functionality

export interface VoiceTestResult {
  feature: string;
  supported: boolean;
  details: string;
  error?: string;
}

export class VoiceTester {
  static async runComprehensiveTests(): Promise<VoiceTestResult[]> {
    const results: VoiceTestResult[] = [];

    // Test speech recognition support
    results.push(await this.testSpeechRecognitionSupport());
    
    // Test speech synthesis support
    results.push(await this.testSpeechSynthesisSupport());
    
    // Test microphone access
    results.push(await this.testMicrophoneAccess());
    
    // Test audio context
    results.push(await this.testAudioContext());
    
    // Test permissions API
    results.push(await this.testPermissionsAPI());
    
    // Test local storage
    results.push(await this.testLocalStorage());

    return results;
  }

  static async testSpeechRecognitionSupport(): Promise<VoiceTestResult> {
    try {
      const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
      const hasSpeechRecognition = 'SpeechRecognition' in window;
      
      if (hasWebkitSpeechRecognition || hasSpeechRecognition) {
        const SpeechRecognition = 
          window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // Try to create an instance
        if (SpeechRecognition) {
          new SpeechRecognition();
        }
        
        return {
          feature: 'Speech Recognition',
          supported: true,
          details: `Available via ${hasWebkitSpeechRecognition ? 'webkitSpeechRecognition' : 'SpeechRecognition'}`,
        };
      } else {
        return {
          feature: 'Speech Recognition',
          supported: false,
          details: 'Speech Recognition API not available in this browser',
        };
      }
    } catch (error) {
      return {
        feature: 'Speech Recognition',
        supported: false,
        details: 'Error creating SpeechRecognition instance',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async testSpeechSynthesisSupport(): Promise<VoiceTestResult> {
    try {
      if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        
        return {
          feature: 'Speech Synthesis',
          supported: true,
          details: `Available with ${voices.length} voices`,
        };
      } else {
        return {
          feature: 'Speech Synthesis',
          supported: false,
          details: 'Speech Synthesis API not available in this browser',
        };
      }
    } catch (error) {
      return {
        feature: 'Speech Synthesis',
        supported: false,
        details: 'Error accessing Speech Synthesis API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async testMicrophoneAccess(): Promise<VoiceTestResult> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          feature: 'Microphone Access',
          supported: false,
          details: 'getUserMedia API not available',
        };
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check audio tracks
      const audioTracks = stream.getAudioTracks();
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
      return {
        feature: 'Microphone Access',
        supported: true,
        details: `Microphone accessible with ${audioTracks.length} audio track(s)`,
      };
    } catch (error) {
      let details = 'Unknown error accessing microphone';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            details = 'Microphone access denied by user';
            break;
          case 'NotFoundError':
            details = 'No microphone device found';
            break;
          case 'NotReadableError':
            details = 'Microphone is already in use';
            break;
          case 'OverconstrainedError':
            details = 'Microphone constraints cannot be satisfied';
            break;
          default:
            details = error.message;
        }
      }
      
      return {
        feature: 'Microphone Access',
        supported: false,
        details,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async testAudioContext(): Promise<VoiceTestResult> {
    try {
      const windowWithWebkit = window as Window & { webkitAudioContext?: typeof AudioContext };
      if (!window.AudioContext && !windowWithWebkit.webkitAudioContext) {
        return {
          feature: 'Audio Context',
          supported: false,
          details: 'Web Audio API not available',
        };
      }

      const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      const details = `Audio Context available (state: ${audioContext.state}, sample rate: ${audioContext.sampleRate}Hz)`;
      
      // Clean up
      await audioContext.close();
      
      return {
        feature: 'Audio Context',
        supported: true,
        details,
      };
    } catch (error) {
      return {
        feature: 'Audio Context',
        supported: false,
        details: 'Error creating Audio Context',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async testPermissionsAPI(): Promise<VoiceTestResult> {
    try {
      if (!navigator.permissions) {
        return {
          feature: 'Permissions API',
          supported: false,
          details: 'Permissions API not available',
        };
      }

      // Test querying microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      return {
        feature: 'Permissions API',
        supported: true,
        details: `Available (microphone permission: ${micPermission.state})`,
      };
    } catch (error) {
      return {
        feature: 'Permissions API',
        supported: false,
        details: 'Error querying permissions',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async testLocalStorage(): Promise<VoiceTestResult> {
    try {
      if (!window.localStorage) {
        return {
          feature: 'Local Storage',
          supported: false,
          details: 'Local Storage not available',
        };
      }

      // Test writing and reading
      const testKey = 'voice-test-key';
      const testValue = 'voice-test-value';
      
      localStorage.setItem(testKey, testValue);
      const retrievedValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrievedValue === testValue) {
        return {
          feature: 'Local Storage',
          supported: true,
          details: 'Local Storage working correctly',
        };
      } else {
        return {
          feature: 'Local Storage',
          supported: false,
          details: 'Local Storage read/write test failed',
        };
      }
    } catch (error) {
      return {
        feature: 'Local Storage',
        supported: false,
        details: 'Error accessing Local Storage',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static generateTestReport(results: VoiceTestResult[]): string {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const url = window.location.href;
    
    let report = `Voice Documentation System - Test Report
Generated: ${timestamp}
URL: ${url}
User Agent: ${userAgent}

=== Test Results ===

`;

    results.forEach((result, index) => {
      report += `${index + 1}. ${result.feature}
   Status: ${result.supported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}
   Details: ${result.details}`;
      
      if (result.error) {
        report += `
   Error: ${result.error}`;
      }
      
      report += '\n\n';
    });

    const supportedCount = results.filter(r => r.supported).length;
    const totalCount = results.length;
    
    report += `=== Summary ===
Supported Features: ${supportedCount}/${totalCount}
Overall Compatibility: ${Math.round((supportedCount / totalCount) * 100)}%

=== Recommendations ===
`;

    if (supportedCount === totalCount) {
      report += '✅ All features are supported! You can use all voice functionality.\n';
    } else {
      report += '⚠️  Some features are not supported. Consider the following:\n\n';
      
      results.forEach(result => {
        if (!result.supported) {
          switch (result.feature) {
            case 'Speech Recognition':
              report += '• Speech Recognition: Try using Chrome or Edge for full support\n';
              break;
            case 'Speech Synthesis':
              report += '• Speech Synthesis: Most modern browsers support this feature\n';
              break;
            case 'Microphone Access':
              report += '• Microphone: Check browser permissions and ensure HTTPS connection\n';
              break;
            case 'Audio Context':
              report += '• Audio Context: Update to a modern browser version\n';
              break;
            case 'Permissions API':
              report += '• Permissions API: Feature will work but with limited permission management\n';
              break;
            case 'Local Storage':
              report += '• Local Storage: Settings and history will not be saved\n';
              break;
          }
        }
      });
    }

    return report;
  }

  static async exportTestReport(results: VoiceTestResult[]): Promise<void> {
    const report = this.generateTestReport(results);
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-system-test-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Mock data for testing
export const mockTestData = {
  sampleQuestions: [
    'How do I use voice recognition?',
    'What browsers are supported?',
    'How do I configure voice settings?',
    'What is talk mode?',
    'How do I troubleshoot microphone issues?',
  ],
  
  sampleResponses: [
    'Voice recognition uses your browser\'s built-in speech recognition API to convert speech to text.',
    'Chrome and Edge provide full support for all voice features.',
    'You can configure voice settings through the settings panel.',
    'Talk mode provides continuous hands-free conversation with the AI assistant.',
    'Check microphone permissions and ensure you\'re using HTTPS.',
  ],
  
  performanceThresholds: {
    speechRecognitionLatency: 500, // ms
    speechSynthesisLatency: 200, // ms
    aiResponseTime: 3000, // ms
    silenceDetection: 3000, // ms
  },
};

export default VoiceTester;
