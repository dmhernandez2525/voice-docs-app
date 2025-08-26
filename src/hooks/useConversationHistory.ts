import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  links?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'external' | 'generated';
  }>;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 100;

export const useConversationHistory = () => {
  const [sessions, setSessions, clearSessions] = useLocalStorage<ConversationSession[]>(
    'voice-docs-conversation-history',
    []
  );

  // Create a new conversation session
  const createSession = useCallback((title?: string): ConversationSession => {
    const newSession: ConversationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || `Conversation ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      // Keep only the most recent sessions
      return updated.slice(0, MAX_SESSIONS);
    });

    return newSession;
  }, [setSessions]);

  // Add a message to a session
  const addMessage = useCallback((sessionId: string, message: Omit<ConversationMessage, 'id'>) => {
    const messageWithId: ConversationMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(message.timestamp),
    };

    setSessions(prev => 
      prev.map(session => {
        if (session.id === sessionId) {
          const updatedMessages = [...session.messages, messageWithId];
          // Keep only the most recent messages
          const trimmedMessages = updatedMessages.slice(-MAX_MESSAGES_PER_SESSION);
          
          return {
            ...session,
            messages: trimmedMessages,
            updatedAt: new Date(),
          };
        }
        return session;
      })
    );

    return messageWithId;
  }, [setSessions]);

  // Update session title
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, title, updatedAt: new Date() }
          : session
      )
    );
  }, [setSessions]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  }, [setSessions]);

  // Get a specific session
  const getSession = useCallback((sessionId: string): ConversationSession | undefined => {
    return sessions.find(session => session.id === sessionId);
  }, [sessions]);

  // Get recent sessions
  const getRecentSessions = useCallback((limit: number = 10): ConversationSession[] => {
    return sessions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [sessions]);

  // Search sessions by content
  const searchSessions = useCallback((query: string): ConversationSession[] => {
    const lowercaseQuery = query.toLowerCase();
    return sessions.filter(session =>
      session.title.toLowerCase().includes(lowercaseQuery) ||
      session.messages.some(message =>
        message.content.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [sessions]);

  // Export conversation history
  const exportHistory = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      sessions: sessions.map(session => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-docs-conversations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sessions]);

  // Import conversation history
  const importHistory = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.sessions || !Array.isArray(data.sessions)) {
            throw new Error('Invalid file format');
          }

          interface ImportedMessage {
            id: string;
            type: 'user' | 'assistant';
            content: string;
            timestamp: string;
            confidence?: number;
          }

          interface ImportedSession {
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
            messages: ImportedMessage[];
          }

          const importedSessions: ConversationSession[] = data.sessions.map((session: ImportedSession) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map((msg: ImportedMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));

          setSessions(prev => {
            const combined = [...importedSessions, ...prev];
            // Remove duplicates and keep most recent
            const unique = combined.filter((session, index, arr) =>
              arr.findIndex(s => s.id === session.id) === index
            );
            return unique.slice(0, MAX_SESSIONS);
          });

          resolve();
        } catch (error) {
          console.error('Failed to parse conversation history file:', error);
          reject(new Error('Failed to parse conversation history file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [setSessions]);

  // Get conversation statistics
  const getStatistics = useCallback(() => {
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const userMessages = sessions.reduce(
      (sum, session) => sum + session.messages.filter(msg => msg.type === 'user').length,
      0
    );
    const aiMessages = sessions.reduce(
      (sum, session) => sum + session.messages.filter(msg => msg.type === 'assistant').length,
      0
    );

    const oldestSession = sessions.reduce((oldest, session) =>
      !oldest || new Date(session.createdAt) < new Date(oldest.createdAt) ? session : oldest,
      null as ConversationSession | null
    );

    const newestSession = sessions.reduce((newest, session) =>
      !newest || new Date(session.createdAt) > new Date(newest.createdAt) ? session : newest,
      null as ConversationSession | null
    );

    return {
      totalSessions,
      totalMessages,
      userMessages,
      aiMessages,
      averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
      oldestSessionDate: oldestSession?.createdAt,
      newestSessionDate: newestSession?.createdAt,
    };
  }, [sessions]);

  return {
    sessions,
    createSession,
    addMessage,
    updateSessionTitle,
    deleteSession,
    getSession,
    getRecentSessions,
    searchSessions,
    exportHistory,
    importHistory,
    clearHistory: clearSessions,
    getStatistics,
  };
};
