# Voice Stocks - Software Design Document

## Document Information

- **Version:** 1.0.0
- **Last Updated:** January 2026
- **Status:** Implementation Phase 1

---

## 1. Executive Summary

Voice Stocks is an extension to the VoiceDocs platform that adds visual guidance, browser-native AI, and portfolio-specific capabilities. It transforms the voice assistant from a Q&A tool into an interactive guide that can visually walk users through a website.

### Key Differentiators

1. **Visual Guidance** - Physically highlights and points to elements while explaining
2. **Browser AI** - Uses Chrome's built-in Gemini Nano for private, on-device processing
3. **Semantic DOM Understanding** - Maps page structure for intelligent navigation
4. **Training Data System** - Configurable knowledge base for domain-specific responses

---

## 2. System Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | System shall scan and map DOM structure semantically | High |
| FR-2 | System shall highlight elements with visual effects | High |
| FR-3 | System shall scroll to and focus on elements | High |
| FR-4 | System shall generate responses using browser AI | High |
| FR-5 | System shall fall back gracefully when AI unavailable | High |
| FR-6 | System shall support guided tours through pages | Medium |
| FR-7 | System shall route voice commands to appropriate handlers | High |
| FR-8 | System shall be configurable with custom training data | Medium |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Page scan < 100ms | Performance |
| NFR-2 | Voice response < 2s | Performance |
| NFR-3 | Bundle size < 100KB gzipped | Size |
| NFR-4 | WCAG 2.1 AA compliant | Accessibility |
| NFR-5 | Works without browser AI | Reliability |

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Voice Stocks                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Input    │  │  Process   │  │   Output   │  │  Visual   │ │
│  │   Layer    │  │   Layer    │  │   Layer    │  │   Layer   │ │
│  │            │  │            │  │            │  │           │ │
│  │ • Speech   │  │ • Router   │  │ • TTS      │  │ • Highlt  │ │
│  │ • Text     │  │ • AI       │  │ • Text     │  │ • Scroll  │ │
│  │ • Commands │  │ • Training │  │ • Actions  │  │ • Point   │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│         │               │               │               │       │
│         └───────────────┴───────────────┴───────────────┘       │
│                                │                                 │
│                    ┌───────────▼───────────┐                    │
│                    │    DOM Navigator      │                    │
│                    │    (Foundation)       │                    │
│                    └───────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Design

#### DOM Navigator Extension

**Purpose:** Extend existing DOM Navigator with semantic mapping capabilities.

**Interface:**
```typescript
interface VoiceStocksDOMNavigator {
  // Generate comprehensive page map
  generatePageMap(root?: HTMLElement): PageMap;

  // Get cached or fresh page map
  getVSPageMap(): PageMap;

  // Find element by natural language description
  findElementByDescription(description: string): HTMLElement | null;

  // Get context about what an element does
  getElementContext(element: HTMLElement): ElementContext;

  // Find elements for a capability (contact, projects, etc.)
  findElementsForCapability(capability: string): HTMLElement[];

  // Cache management
  invalidateVSCache(): void;
  destroyVS(): void;
}
```

**PageMap Structure:**
```typescript
interface PageMap {
  sections: Section[];      // Semantic sections with headings
  navigation: NavItem[];    // Navigation links
  buttons: ButtonInfo[];    // Interactive buttons
  forms: FormInfo[];        // Input forms with fields
  media: MediaInfo[];       // Images, videos, iframes
  landmarks: LandmarkInfo[]; // ARIA landmarks
  lastUpdated: number;      // Cache timestamp
}
```

#### Browser AI Service

**Purpose:** Integrate Chrome Prompt API for on-device AI processing.

**Interface:**
```typescript
interface BrowserAIService {
  // Initialize with training data
  initialize(trainingData?: VoiceStocksTrainingData): Promise<void>;

  // Check availability
  isAvailable(): Promise<boolean>;
  checkCapabilities(): Promise<BrowserAICapabilities>;

  // Session management
  createSession(systemPrompt: string): Promise<AISession | null>;
  getVoiceStocksSession(): Promise<AISession | null>;
  destroySession(): void;

  // Response generation
  generateResponse(question: string, context?: string): Promise<string>;

  // Page interpretation
  interpretPage(html: string): Promise<PageInterpretation>;
  matchIntentToElement(query: string, elements: ElementInfo[]): Promise<string | null>;

  // Training data
  setTrainingData(data: VoiceStocksTrainingData): void;
}
```

**Fallback Strategy:**
```
User Question
      │
      ▼
┌─────────────────┐
│ Match FAQ       │──▶ Found? Return FAQ answer
│ (Keywords)      │
└─────────────────┘
      │ Not found
      ▼
┌─────────────────┐
│ Browser AI      │──▶ Available? Generate response
│ (Gemini Nano)   │
└─────────────────┘
      │ Not available
      ▼
┌─────────────────┐
│ Pattern Match   │──▶ Return template response
│ (Fallback)      │
└─────────────────┘
```

#### Training Data System

**Purpose:** Provide domain-specific knowledge for contextual responses.

**Structure:**
```typescript
interface VoiceStocksTrainingData {
  version: string;

  identity: {
    name: string;         // "Daniel's Portfolio Assistant"
    role: string;         // "Professional guide"
    personality: string;  // Tone description
    greeting: string;     // Welcome message
  };

  knowledge: {
    faqs: FAQ[];          // Q&A pairs with keywords
    facts: Fact[];        // Key data points
    documents: DocumentRef[]; // External content refs
  };

  capabilities: Capability[]; // What the assistant can do

  templates: {
    greeting: string;
    fallback: string;
    handoff: string;
    goodbye: string;
  };
}
```

### 3.3 Data Flow

#### Voice Command Processing

```
┌──────────┐    ┌───────────┐    ┌──────────────┐
│  Voice   │───▶│  Command  │───▶│   Handler    │
│  Input   │    │  Router   │    │  (Category)  │
└──────────┘    └───────────┘    └──────────────┘
                     │
     ┌───────────────┼───────────────┬──────────────┐
     │               │               │              │
     ▼               ▼               ▼              ▼
┌─────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
│  Nav    │   │   Tour    │   │  Query   │   │  System  │
│ Handler │   │  Handler  │   │ Handler  │   │ Handler  │
└─────────┘   └───────────┘   └──────────┘   └──────────┘
     │               │               │              │
     ▼               ▼               ▼              ▼
┌─────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
│   DOM   │   │  Guided   │   │ Browser  │   │  Voice   │
│Navigator│   │   Tour    │   │    AI    │   │ Settings │
└─────────┘   └───────────┘   └──────────┘   └──────────┘
     │               │               │              │
     └───────────────┴───────────────┴──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  TTS Output  │
                    │  + Visual FX │
                    └──────────────┘
```

---

## 4. Detailed Design

### 4.1 PageMap Generation Algorithm

```typescript
function generatePageMap(root: HTMLElement): PageMap {
  return {
    sections: scanSections(root),      // semantic + ID-based
    navigation: scanNavigation(root),  // nav elements + header links
    buttons: scanButtons(root),        // button, [role=button], inputs
    forms: scanForms(root),            // form elements with fields
    media: scanMedia(root),            // img, video, audio, iframe
    landmarks: scanLandmarks(root),    // ARIA + HTML5 semantic
    lastUpdated: Date.now(),
  };
}

function scanSections(root: HTMLElement): Section[] {
  const sections = [];
  const seen = new Set();

  // 1. Semantic elements
  for (const el of root.querySelectorAll('section, article, main, aside')) {
    if (!seen.has(el)) {
      seen.add(el);
      sections.push(createSection(el));
    }
  }

  // 2. Elements with meaningful IDs
  for (const el of root.querySelectorAll('[id]')) {
    if (!seen.has(el) && isLikelySection(el)) {
      seen.add(el);
      sections.push(createSection(el));
    }
  }

  return sections;
}

function isLikelySection(el: HTMLElement): boolean {
  // Check size (large enough)
  const rect = el.getBoundingClientRect();
  if (rect.height < 100 || rect.width < 200) return false;

  // Check content (has text)
  if ((el.textContent?.trim().length || 0) < 50) return false;

  // Check ID for section keywords
  const keywords = ['hero', 'about', 'project', 'skill', 'contact', ...];
  return keywords.some(kw => el.id.toLowerCase().includes(kw));
}
```

### 4.2 Element Matching Algorithm

```typescript
function findElementByDescription(description: string): HTMLElement | null {
  const map = getVSPageMap();
  const descLower = description.toLowerCase();

  // Build scored list from all elements
  const candidates = [
    ...map.sections.map(s => ({
      element: s.element,
      text: `${s.title} ${s.description || ''}`,
      score: 0
    })),
    ...map.navigation.map(n => ({
      element: n.element,
      text: n.text,
      score: 0
    })),
    // ... other element types
  ];

  // Score each candidate
  for (const candidate of candidates) {
    candidate.score = calculateMatchScore(descLower, candidate.text.toLowerCase());
  }

  // Sort and return best match above threshold
  candidates.sort((a, b) => b.score - a.score);

  if (candidates[0]?.score > 0.3) {
    return candidates[0].element;
  }

  // Fallback: try as CSS selector or ID
  return trySelector(description) || document.getElementById(description);
}

function calculateMatchScore(query: string, text: string): number {
  // Exact match
  if (text.includes(query)) return 1.0;

  // Word overlap
  const queryWords = query.split(/\s+/);
  const textWords = text.split(/\s+/);

  let matched = 0;
  for (const qw of queryWords) {
    if (textWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
      matched++;
    }
  }

  return matched / queryWords.length;
}
```

### 4.3 Browser AI Integration

```typescript
async function generateResponse(question: string): Promise<string> {
  // 1. Try FAQ match first (fast path)
  const faqMatch = matchFAQ(question);
  if (faqMatch) {
    return faqMatch.answer;
  }

  // 2. Try browser AI
  if (await isAvailable()) {
    const session = await getVoiceStocksSession();
    if (session) {
      try {
        return await session.prompt(question);
      } catch (error) {
        console.warn('Browser AI failed:', error);
      }
    }
  }

  // 3. Pattern-based fallback
  return generateFallbackResponse(question);
}

function matchFAQ(question: string): FAQ | null {
  const qLower = question.toLowerCase();

  for (const faq of trainingData.knowledge.faqs) {
    // Keyword match
    if (faq.keywords.some(kw => qLower.includes(kw.toLowerCase()))) {
      return faq;
    }

    // Question similarity (word overlap)
    const faqWords = faq.question.toLowerCase().split(/\s+/);
    const questionWords = qLower.split(/\s+/);
    const overlap = faqWords.filter(w => questionWords.includes(w)).length;

    if (overlap >= 3 || overlap / faqWords.length > 0.5) {
      return faq;
    }
  }

  return null;
}
```

---

## 5. API Specifications

### 5.1 VoiceStocksDOMNavigator API

```typescript
// Get singleton instance
const navigator = getVoiceStocksDOMNavigator(selectors?, config?);

// Generate page map
const map: PageMap = navigator.generatePageMap();

// Find element
const element = navigator.findElementByDescription("contact section");

// Get element context
const context = navigator.getElementContext(element);
// Returns: { purpose, interactionHint, relatedElements, path }

// Find by capability
const projectsElements = navigator.findElementsForCapability("projects");
```

### 5.2 BrowserAIService API

```typescript
// Get singleton instance
const ai = BrowserAIService.getInstance();

// Initialize
await ai.initialize(portfolioTrainingData);

// Check availability
const available = await ai.isAvailable();

// Generate response
const response = await ai.generateResponse("What does Daniel do?");

// Interpret page
const interpretation = await ai.interpretPage(document.body.innerHTML);
// Returns: { summary, mainPurpose, keyElements, suggestedActions }

// Match intent to element
const elementId = await ai.matchIntentToElement(
  "show me projects",
  [{ id: "projects-section", text: "My Projects", type: "section" }]
);
```

### 5.3 Training Data API

```typescript
import {
  portfolioTrainingData,
  findFAQByKeywords,
  getFactByTopic,
  getCapabilityByTrigger
} from './data/portfolioTrainingData';

// Find FAQ
const faq = findFAQByKeywords(['skills', 'technologies']);

// Get fact
const fact = getFactByTopic('experience_years');
// Returns: { topic: 'experience_years', value: '5+', context: '...' }

// Get capability
const capability = getCapabilityByTrigger("show me projects");
// Returns: { name: 'project-search', triggers: [...], handler: '...' }
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Component | Test Cases |
|-----------|------------|
| DOM Navigator | Section scanning, element matching, capability lookup |
| Browser AI | Availability check, response generation, fallback |
| Training Data | FAQ matching, fact retrieval, capability triggers |

### 6.2 Integration Tests

| Scenario | Verification |
|----------|--------------|
| Voice command → Navigation | Element scrolled into view |
| Voice query → AI response | Relevant answer returned |
| Tour start → Visual effects | Elements highlighted in sequence |

### 6.3 E2E Tests

| Flow | Steps |
|------|-------|
| Portfolio tour | Start tour → Visit all sections → Complete |
| Contact guidance | Ask about contact → Navigate to form → Highlight |
| Project search | Search for React projects → Filter displayed |

---

## 7. Security Considerations

1. **DOM Access** - Only reads visible, non-sensitive content
2. **Browser AI** - All processing on-device, no data sent externally
3. **Training Data** - Loaded from same-origin only
4. **User Consent** - Microphone requires explicit permission
5. **Content Isolation** - No access to cookies, localStorage, or credentials

---

## 8. Performance Considerations

| Operation | Target | Strategy |
|-----------|--------|----------|
| Page scan | < 100ms | Lazy scanning, caching |
| Element match | < 50ms | Pre-computed maps |
| AI response | < 2s | FAQ fast path, session reuse |
| Highlight render | < 16ms | CSS animations, RAF |

---

## 9. Deployment

### Build Configuration

```typescript
// vite.config.ts additions for widget build
export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget/index.ts',
      name: 'VoiceStocks',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

### Embed Usage

```html
<!-- Script embed -->
<script src="https://cdn.example.com/voice-stocks.js"></script>
<voice-stocks
  data-config="/config.json"
  data-theme="dark"
  data-position="bottom-right">
</voice-stocks>
```

```tsx
// React embed
import { VoiceStocksWidget } from 'voice-stocks';

<VoiceStocksWidget
  trainingData={portfolioData}
  theme="dark"
  position="bottom-right"
/>
```

---

## 10. Appendix

### A. Type Definitions

See `src/types/voiceStocks.ts` for complete TypeScript definitions.

### B. Training Data Schema

See `src/data/portfolioTrainingData.ts` for example training data structure.

### C. Browser Compatibility

| Feature | Chrome | Safari | Firefox |
|---------|--------|--------|---------|
| Speech Recognition | ✅ | ⚠️ Partial | ❌ |
| Speech Synthesis | ✅ | ✅ | ✅ |
| Prompt API | ✅ 127+ | ❌ | ❌ |
| DOM Navigation | ✅ | ✅ | ✅ |
| Visual Effects | ✅ | ✅ | ✅ |

### D. References

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Web Speech API Specification](https://wicg.github.io/speech-api/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
