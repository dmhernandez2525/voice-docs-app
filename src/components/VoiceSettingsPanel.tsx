import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Settings,
  Volume2,
  Mic,
  Clock,
  Languages,
  Download,
  Upload,
  RotateCcw,
  TestTube,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useNotificationContext } from '../hooks/useNotificationContext';

interface VoiceSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSetting,
    resetToDefaults,
    exportSettings,
    importSettings,
    getAvailableLanguages,

  } = useVoiceSettings();
  
  const speechSynthesis = useSpeechSynthesis();
  const notification = useNotificationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [testResults, setTestResults] = useState<{
    microphone: boolean | null;
    speechRecognition: boolean | null;
    speechSynthesis: boolean | null;
  }>({
    microphone: null,
    speechRecognition: null,
    speechSynthesis: null,
  });

  // Test microphone access
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setTestResults(prev => ({ ...prev, microphone: true }));
      notification.success('Microphone test passed!');
    } catch (error) {
      console.error('Microphone test failed:', error);
      setTestResults(prev => ({ ...prev, microphone: false }));
      notification.error('Microphone test failed. Please check permissions.');
    }
  };

  // Test speech recognition
  const testSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setTestResults(prev => ({ ...prev, speechRecognition: true }));
      notification.success('Speech recognition is supported!');
    } else {
      setTestResults(prev => ({ ...prev, speechRecognition: false }));
      notification.error('Speech recognition is not supported in this browser.');
    }
  };

  // Test speech synthesis
  const testSpeechSynthesis = async () => {
    if (speechSynthesis.isSupported) {
      try {
        await speechSynthesis.speak('Voice synthesis test successful!', {
          rate: settings.rate,
          pitch: settings.pitch,
          volume: settings.volume,
        });
        setTestResults(prev => ({ ...prev, speechSynthesis: true }));
        notification.success('Speech synthesis test completed!');
      } catch (error) {
        console.error('Speech synthesis test failed:', error);
        setTestResults(prev => ({ ...prev, speechSynthesis: false }));
        notification.error('Speech synthesis test failed.');
      }
    } else {
      setTestResults(prev => ({ ...prev, speechSynthesis: false }));
      notification.error('Speech synthesis is not supported in this browser.');
    }
  };

  // Handle settings import
  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importSettings(file);
        notification.success('Settings imported successfully!');
      } catch (error) {
        notification.error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle settings export
  const handleExportSettings = () => {
    try {
      exportSettings();
      notification.success('Settings exported successfully!');
    } catch (error) {
      console.error('Failed to export settings:', error);
      notification.error('Failed to export settings.');
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    resetToDefaults();
    notification.success('Settings reset to defaults!');
  };

  const availableLanguages = getAvailableLanguages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">Voice Settings</span>
              <div className="text-sm text-gray-500 mt-1">
                Configure voice recognition and synthesis preferences
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Customize your voice interaction experience with advanced settings for speech recognition,
            text-to-speech, and user interface preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Speech Recognition Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Speech Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Silence Timeout: {settings.silenceTimeout / 1000}s
                  </label>
                  <Slider
                    value={[settings.silenceTimeout]}
                    onValueChange={([value]) => updateSetting('silenceTimeout', value)}
                    min={1000}
                    max={10000}
                    step={500}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">
                    Time to wait before processing speech
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Live Transcription</label>
                  <Switch
                    checked={settings.showLiveTranscription}
                    onCheckedChange={(checked) => updateSetting('showLiveTranscription', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Show Confidence Scores</label>
                  <Switch
                    checked={settings.showConfidenceScores}
                    onCheckedChange={(checked) => updateSetting('showConfidenceScores', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Interim Results</label>
                  <Switch
                    checked={settings.interimResults}
                    onCheckedChange={(checked) => updateSetting('interimResults', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Speech Synthesis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Text-to-Speech
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice</label>
                  <Select
                    value={settings.voice || 'default'}
                    onValueChange={(value) => updateSetting('voice', value === 'default' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Voice</SelectItem>
                      {speechSynthesis.voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Speech Rate: {settings.rate.toFixed(1)}x
                  </label>
                  <Slider
                    value={[settings.rate]}
                    onValueChange={([value]) => updateSetting('rate', value)}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Pitch: {settings.pitch.toFixed(1)}
                  </label>
                  <Slider
                    value={[settings.pitch]}
                    onValueChange={([value]) => updateSetting('pitch', value)}
                    min={0.0}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Volume: {Math.round(settings.volume * 100)}%
                  </label>
                  <Slider
                    value={[settings.volume]}
                    onValueChange={([value]) => updateSetting('volume', value)}
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Audio Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Noise Reduction</label>
                  <Switch
                    checked={settings.noiseReduction}
                    onCheckedChange={(checked) => updateSetting('noiseReduction', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Echo Cancellation</label>
                  <Switch
                    checked={settings.echoCancellation}
                    onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto Gain Control</label>
                  <Switch
                    checked={settings.autoGainControl}
                    onCheckedChange={(checked) => updateSetting('autoGainControl', checked)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-start Listening</label>
                <Switch
                  checked={settings.autoStartListening}
                  onCheckedChange={(checked) => updateSetting('autoStartListening', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                System Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Button
                    onClick={testMicrophone}
                    variant="outline"
                    className="w-full"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Test Microphone
                  </Button>
                  {testResults.microphone !== null && (
                    <div className="flex items-center gap-2">
                      {testResults.microphone ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {testResults.microphone ? 'Working' : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={testSpeechRecognition}
                    variant="outline"
                    className="w-full"
                  >
                    <Languages className="h-4 w-4 mr-2" />
                    Test Recognition
                  </Button>
                  {testResults.speechRecognition !== null && (
                    <div className="flex items-center gap-2">
                      {testResults.speechRecognition ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {testResults.speechRecognition ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={testSpeechSynthesis}
                    variant="outline"
                    className="w-full"
                    disabled={speechSynthesis.isSpeaking}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Speech
                  </Button>
                  {testResults.speechSynthesis !== null && (
                    <div className="flex items-center gap-2">
                      {testResults.speechSynthesis ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {testResults.speechSynthesis ? 'Working' : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Management */}
          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleExportSettings}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Settings
                </Button>

                <Button
                  onClick={handleImportSettings}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Settings
                </Button>

                <Button
                  onClick={handleResetToDefaults}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Browser Compatibility Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Browser Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Full Support:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Chrome/Chromium 25+</li>
                    <li>• Microsoft Edge 79+</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Limited Support:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Firefox 44+ (requires manual enabling)</li>
                    <li>• Safari 14.1+ (partial support)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSettingsPanel;
