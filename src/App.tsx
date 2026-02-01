import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppEntry } from './components/AppEntry';
import { LandingPage } from './components/LandingPage';
import { VoiceStocksDemo } from './pages/VoiceStocksDemo';
import { NotificationProvider } from './components/NotificationProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <NotificationProvider>
          <BrowserRouter>
            <div className="App">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<AppEntry />} />
                <Route path="/voice-stocks-demo" element={<VoiceStocksDemo />} />
              </Routes>
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
