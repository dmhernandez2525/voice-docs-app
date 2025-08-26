# AI Assistant

## Overview

The AI assistant provides documentation-aware responses using a mock service that simulates intelligent question answering.

## Features

### Contextual Responses
- Answers based on documentation content
- Keyword matching for relevant information
- Confidence scoring for response quality
- Follow-up question suggestions

### Smart Link Generation
- Automatic creation of relevant documentation links
- Links to specific sections and topics
- Generated content references
- External resource links when applicable

### Conversation Memory
- Maintains context throughout conversation
- Chat-like interface with message history
- Copy responses to clipboard
- Timestamp tracking for all interactions

## Response Types

### Documentation Queries
Questions about voice features, search functionality, or system capabilities receive detailed explanations with relevant links.

### How-To Questions
Setup, configuration, and usage questions get step-by-step guidance with actionable steps.

### General Inquiries
Broad questions receive overview information with suggestions for more specific queries.

## Implementation

### Mock Service
The AI service is completely simulated:
- No external API calls or tokens
- Local text processing and matching
- Configurable response templates
- Extensible for real AI integration

### Customization
To integrate with real AI services:
1. Modify `src/services/aiService.ts`
2. Add your API configuration
3. Update response processing logic
4. Maintain the same interface for components

## Usage Tips

### Effective Questions
- Be specific about what you need help with
- Ask about particular features or functionality
- Request step-by-step guidance when needed
- Follow up on responses for clarification

### Navigation
- Click generated links to jump to relevant sections
- Use follow-up questions for related topics
- Copy responses for reference
- Switch between manual and talk modes as needed

See [Talk Mode Guide](./talk-mode.md) for hands-free conversation features.
