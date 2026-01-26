import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Search,
  Bot,
  Sparkles,
  ChevronRight,
  FileText,
  Mic,
  ExternalLink,
  Settings,
  Keyboard,
  Command,
  Home,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import EnhancedAIAssistantModal from './EnhancedAIAssistantModal';
import VoiceSettingsPanel from './VoiceSettingsPanel';
import ThemeSwitcher from './ThemeSwitcher';
import { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
import { VoiceCommandReference } from './VoiceCommandReference';
import { CommandPalette } from './CommandPalette';
import { mockDocumentation } from '../data/mockDocumentation';
import type { DocumentationSubsection } from '../types/documentation';
import { useTheme } from '../hooks/useTheme';

const DocumentationPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('getting-started');
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);

  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const { isDark, toggleDarkMode } = useTheme();

  // Keyboard shortcut for command palette (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter documentation based on search query
  const filteredDocumentation = useMemo(() => {
    if (!searchQuery.trim()) return mockDocumentation;

    const query = searchQuery.toLowerCase();
    return mockDocumentation.map(section => ({
      ...section,
      subsections: section.subsections.filter(subsection =>
        subsection.title.toLowerCase().includes(query) ||
        (typeof subsection.content === 'string' ? subsection.content.toLowerCase().includes(query) : false) ||
        subsection.tags?.some(tag => tag.toLowerCase().includes(query))
      ),
    })).filter(section => section.subsections.length > 0);
  }, [searchQuery]);

  // Get current section and subsection
  const currentSection = mockDocumentation.find(section => section.id === selectedCategory);
  const currentSubsection = selectedSubsection
    ? currentSection?.subsections.find(sub => sub.id === selectedSubsection)
    : null;

  const handleNavigateToContent = useCallback((contentId: string) => {
    // Parse contentId to navigate to specific section/subsection
    const cleanId = contentId.replace('#', '');

    // Find section and subsection
    for (const section of mockDocumentation) {
      const subsection = section.subsections.find(sub => sub.id === cleanId);
      if (subsection) {
        setSelectedCategory(section.id);
        setSelectedSubsection(subsection.id);
        setShowAIModal(false);
        return;
      }
    }

    // If not found, try to find section
    const section = mockDocumentation.find(s => s.id === cleanId);
    if (section) {
      setSelectedCategory(section.id);
      setSelectedSubsection(null);
      setShowAIModal(false);
    }
  }, []);

  const readCurrentSection = useCallback(() => {
    if (!currentSubsection) return;
    const content = typeof currentSubsection.content === 'string'
      ? currentSubsection.content
      : '';
    if (content && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentSubsection]);

  const renderSubsectionContent = (subsection: DocumentationSubsection) => {
    const content = typeof subsection.content === 'string'
      ? subsection.content
      : JSON.stringify(subsection.content);

    return (
      <div className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap text-foreground">
          {content}
        </div>

        {/* Tags */}
        {subsection.tags && subsection.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {subsection.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {subsection.links && subsection.links.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Related Links:</h4>
            <div className="space-y-2">
              {subsection.links.map((link, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (link.type === 'external') {
                      window.open(link.url, '_blank');
                    } else {
                      handleNavigateToContent(link.url);
                    }
                  }}
                  className="justify-start h-auto p-3 text-left w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{link.title}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {link.type}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Home</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Mic className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">VoiceDocs</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <Command className="w-3 h-3" />
              <span className="text-xs">Search</span>
              <kbd className="text-xs bg-muted px-1 rounded">⌘K</kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVoiceCommands(true)}
              title="Voice Commands"
            >
              <Mic className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </Button>

            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Voice-Enabled Documentation
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Intelligent documentation with voice recognition and AI-powered search
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="search"
                placeholder="Search documentation or press ⌘K for commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* AI Assistant Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setShowAIModal(true)}
              data-ai-assistant-trigger
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl px-8 py-3 text-lg"
              size="lg"
            >
              <Bot className="h-5 w-5 mr-2" />
              Open AI Assistant
              <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
            </Button>

            <Button
              onClick={() => setShowSettingsPanel(true)}
              data-voice-settings-trigger
              variant="outline"
              size="lg"
              className="px-6 py-3"
            >
              <Settings className="h-5 w-5 mr-2" />
              Voice Settings
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Mic className="h-3.5 w-3.5" />
              Voice Input
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Search className="h-3.5 w-3.5" />
              Smart Search
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Bot className="h-3.5 w-3.5" />
              AI Responses
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Volume2 className="h-3.5 w-3.5" />
              Text-to-Speech
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Keyboard className="h-3.5 w-3.5" />
              Shortcuts
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-4">
            Press <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">?</kbd> for keyboard shortcuts or{' '}
            <button onClick={() => setShowVoiceCommands(true)} className="text-primary hover:underline">
              view voice commands
            </button>
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
                <CardDescription>
                  Browse by category or use search
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {filteredDocumentation.map((section) => (
                    <div key={section.id}>
                      <Button
                        variant={selectedCategory === section.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start px-4 py-2 h-auto"
                        onClick={() => {
                          setSelectedCategory(section.id);
                          setSelectedSubsection(null);
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{section.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {section.subsections.length} topics
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        </div>
                      </Button>

                      {/* Subsections */}
                      {selectedCategory === section.id && (
                        <div className="ml-6 mt-2 space-y-1">
                          {section.subsections.map((subsection) => (
                            <Button
                              key={subsection.id}
                              variant={selectedSubsection === subsection.id ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => setSelectedSubsection(subsection.id)}
                            >
                              {subsection.title}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Help Card */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Quick Help
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors w-full"
                  >
                    <Keyboard className="w-3 h-3" />
                    Keyboard shortcuts
                  </button>
                  <button
                    onClick={() => setShowVoiceCommands(true)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors w-full"
                  >
                    <Mic className="w-3 h-3" />
                    Voice commands
                  </button>
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors w-full"
                  >
                    <Bot className="w-3 h-3" />
                    AI Assistant
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {currentSubsection ? (
              /* Subsection View */
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>{currentSection?.title}</span>
                      <ChevronRight className="h-4 w-4" />
                      <span>{currentSubsection.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={readCurrentSection}
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Read
                    </Button>
                  </div>
                  <CardTitle className="text-2xl">{currentSubsection.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderSubsectionContent(currentSubsection)}
                </CardContent>
              </Card>
            ) : currentSection ? (
              /* Section Overview */
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{currentSection.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {currentSection.description}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Subsections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentSection.subsections.map((subsection) => (
                    <Card
                      key={subsection.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                      onClick={() => setSelectedSubsection(subsection.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {subsection.title}
                          <ChevronRight className="h-4 w-4" />
                        </CardTitle>
                        <CardDescription>
                          {typeof subsection.content === 'string'
                            ? subsection.content.substring(0, 150) + '...'
                            : 'Click to view content'
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {subsection.tags && (
                          <div className="flex flex-wrap gap-1">
                            {subsection.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {subsection.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subsection.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* Welcome/Search Results */
              <Card>
                <CardContent className="p-12 text-center">
                  <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Welcome to VoiceDocs
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Use the navigation menu to browse documentation sections, search for specific topics,
                    or open the AI Assistant for intelligent question answering with voice support.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => setSelectedCategory('getting-started')}
                      variant="outline"
                      size="lg"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Browse Documentation
                    </Button>
                    <Button
                      onClick={() => setShowAIModal(true)}
                      size="lg"
                    >
                      <Bot className="h-5 w-5 mr-2" />
                      Ask AI Assistant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced AI Assistant Modal */}
      <EnhancedAIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onNavigateToContent={handleNavigateToContent}
      />

      {/* Voice Settings Panel */}
      <VoiceSettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />

      {/* Voice Commands Reference */}
      <VoiceCommandReference
        open={showVoiceCommands}
        onOpenChange={setShowVoiceCommands}
      />

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onOpenAIAssistant={() => setShowAIModal(true)}
        onOpenVoiceSettings={() => setShowSettingsPanel(true)}
        onOpenKeyboardShortcuts={() => setShowShortcuts(true)}
        onOpenVoiceCommands={() => setShowVoiceCommands(true)}
        onToggleTheme={toggleDarkMode}
        isDarkMode={isDark}
      />
    </div>
  );
};

export default DocumentationPage;
