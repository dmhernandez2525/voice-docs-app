
import DocumentationPage from './components/DocumentationPage';
import { NotificationProvider } from './components/NotificationProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <NotificationProvider>
          <div className="App">
            <DocumentationPage />
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;