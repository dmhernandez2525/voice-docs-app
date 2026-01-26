/**
 * Portfolio Training Data
 *
 * Sample training data for Daniel's portfolio website.
 * This data is used by Voice Stocks to provide contextual responses
 * about Daniel's background, projects, skills, and services.
 */

import type { VoiceStocksTrainingData } from '../types/voiceStocks';

export const portfolioTrainingData: VoiceStocksTrainingData = {
  version: '1.0.0',

  identity: {
    name: "Daniel's Portfolio Assistant",
    role: 'Professional portfolio guide and information assistant',
    personality:
      'Friendly, professional, and knowledgeable about Daniel\'s work and experience. I speak conversationally and help visitors learn about Daniel\'s skills and projects.',
    greeting:
      "Hi! I'm here to help you learn about Daniel's work and experience. You can ask me about his projects, skills, or background. What would you like to know?",
    avatar: '/assets/assistant-avatar.png',
  },

  knowledge: {
    faqs: [
      {
        id: 'faq-1',
        question: 'What does Daniel do?',
        answer:
          "Daniel is a full-stack software engineer with expertise in React, TypeScript, Python, and cloud technologies. He builds web applications, voice-enabled systems, and enterprise software solutions. He's particularly passionate about creating accessible, user-friendly interfaces and exploring AI integration in applications.",
        keywords: ['what', 'does', 'do', 'work', 'job', 'profession', 'role'],
        followUps: ['What are his main skills?', 'What projects has he worked on?'],
      },
      {
        id: 'faq-2',
        question: "What are Daniel's main skills?",
        answer:
          "Daniel's core technical skills include: React and Next.js for frontend development, TypeScript and JavaScript, Python for backend and data processing, Node.js, AWS and cloud architecture, Docker and containerization, and AI/ML integration including voice interfaces. He also has strong experience with database design, API development, and DevOps practices.",
        keywords: ['skills', 'technologies', 'tech', 'stack', 'expertise', 'know', 'proficient'],
        followUps: ['Show me his projects', 'Does he have experience with React?'],
      },
      {
        id: 'faq-3',
        question: 'Is Daniel available for hire?',
        answer:
          "For current availability and opportunities, please use the contact form on this website or reach out via LinkedIn. Daniel is always interested in discussing interesting projects and collaboration opportunities.",
        keywords: ['hire', 'available', 'work', 'job', 'opportunity', 'freelance', 'contract', 'employment'],
        followUps: ['How can I contact Daniel?', 'What services does he offer?'],
      },
      {
        id: 'faq-4',
        question: 'How can I contact Daniel?',
        answer:
          "You can reach Daniel through the contact form on this website, via email, or connect with him on LinkedIn and GitHub. Would you like me to take you to the contact section?",
        keywords: ['contact', 'reach', 'email', 'message', 'connect', 'linkedin', 'github'],
        followUps: ['Take me to the contact section', 'What is his LinkedIn?'],
      },
      {
        id: 'faq-5',
        question: 'What projects has Daniel worked on?',
        answer:
          "Daniel has worked on a variety of projects including voice-enabled documentation systems, web applications, and enterprise software. You can explore his portfolio in the Projects section to see detailed case studies, technologies used, and live demos where available. Would you like me to show you the projects?",
        keywords: ['projects', 'portfolio', 'work', 'built', 'created', 'developed', 'made'],
        followUps: ['Show me his React projects', 'What is his most recent project?'],
      },
      {
        id: 'faq-6',
        question: "What is Daniel's background?",
        answer:
          "Daniel has over 5 years of professional software development experience. He's worked on projects ranging from startup MVPs to enterprise-scale applications. His background includes both frontend and backend development, with a focus on creating intuitive user experiences and scalable architectures.",
        keywords: ['background', 'experience', 'history', 'education', 'career', 'years'],
        followUps: ['What are his main skills?', 'What projects has he worked on?'],
      },
      {
        id: 'faq-7',
        question: 'Does Daniel have experience with React?',
        answer:
          "Yes! React is one of Daniel's primary technologies. He has extensive experience building complex React applications, including this portfolio site. He works with React hooks, context, and modern patterns, and often pairs React with TypeScript for type-safe development.",
        keywords: ['react', 'reactjs', 'frontend', 'javascript', 'typescript'],
        followUps: ['Show me his React projects', 'What other technologies does he use?'],
      },
      {
        id: 'faq-8',
        question: 'What services does Daniel offer?',
        answer:
          "Daniel offers full-stack web development, frontend development with React/TypeScript, backend API development, cloud architecture and deployment, voice interface development, and technical consulting. For specific inquiries, please reach out through the contact form.",
        keywords: ['services', 'offer', 'provide', 'help', 'consulting', 'freelance'],
        followUps: ['How can I contact Daniel?', 'Is he available for hire?'],
      },
    ],

    facts: [
      {
        topic: 'projects_count',
        value: '40+',
        context: 'portfolio projects completed',
      },
      {
        topic: 'primary_tech_stack',
        value: ['React', 'TypeScript', 'Python', 'Node.js', 'AWS'],
        context: 'main technologies',
      },
      {
        topic: 'experience_years',
        value: '5+',
        context: 'years of professional software development',
      },
      {
        topic: 'specializations',
        value: ['Full-Stack Development', 'Voice Interfaces', 'AI Integration', 'Cloud Architecture'],
        context: 'areas of expertise',
      },
      {
        topic: 'frontend_technologies',
        value: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
        context: 'frontend stack',
      },
      {
        topic: 'backend_technologies',
        value: ['Node.js', 'Python', 'FastAPI', 'Express', 'PostgreSQL'],
        context: 'backend stack',
      },
      {
        topic: 'cloud_platforms',
        value: ['AWS', 'Render', 'Vercel', 'Docker'],
        context: 'deployment and infrastructure',
      },
    ],

    documents: [
      {
        id: 'resume',
        title: "Daniel's Resume",
        path: '/data/resume.md',
        type: 'markdown',
        tags: ['resume', 'experience', 'education'],
      },
      {
        id: 'bio',
        title: 'About Daniel',
        path: '/data/bio.md',
        type: 'markdown',
        tags: ['about', 'bio', 'introduction'],
      },
      {
        id: 'projects',
        title: 'Project Portfolio',
        path: '/data/projects.json',
        type: 'json',
        tags: ['projects', 'portfolio', 'work'],
      },
    ],
  },

  capabilities: [
    {
      name: 'project-search',
      description: 'Search and filter portfolio projects by technology or type',
      triggers: ['show me', 'find projects', 'what projects', 'search for', 'projects with', 'built with'],
      handler: 'handleProjectSearch',
    },
    {
      name: 'navigate',
      description: 'Navigate to specific sections of the portfolio',
      triggers: ['go to', 'navigate to', 'show me the', 'take me to', 'scroll to', 'where is'],
      handler: 'handleNavigation',
    },
    {
      name: 'contact',
      description: 'Help visitor contact Daniel',
      triggers: ['contact', 'email', 'reach out', 'get in touch', 'hire', 'message'],
      handler: 'handleContact',
    },
    {
      name: 'tour',
      description: 'Give a guided tour of the portfolio',
      triggers: ['give me a tour', 'show me around', 'tour', 'walk me through', 'guide me'],
      handler: 'handleTour',
    },
    {
      name: 'skills-info',
      description: 'Provide information about technical skills',
      triggers: ['skills', 'technologies', 'tech stack', 'what can you', 'expertise', 'proficient'],
      handler: 'handleSkillsInfo',
    },
  ],

  templates: {
    greeting:
      "Hi! I'm here to help you learn about Daniel's work. You can ask me about his projects, skills, or experience. What would you like to know?",
    fallback:
      "I'm not sure about that specific detail. Would you like me to help you navigate to a relevant section, or would you prefer to use the contact form to reach Daniel directly?",
    handoff:
      "I'll help connect you with Daniel. You can use the contact form below, or reach out via LinkedIn or GitHub.",
    goodbye:
      "Thanks for visiting! Feel free to come back if you have more questions. Have a great day!",
    error:
      "I encountered an issue processing your request. Please try again, or use the contact form if you need immediate assistance.",
    thinking: 'Let me find that information for you...',
  },

  integrations: {
    analytics: {
      provider: 'custom',
      enabled: true,
    },
  },
};

/**
 * Helper function to get FAQ by keywords
 */
export function findFAQByKeywords(keywords: string[]): typeof portfolioTrainingData.knowledge.faqs[0] | null {
  const keywordsLower = keywords.map((k) => k.toLowerCase());

  for (const faq of portfolioTrainingData.knowledge.faqs) {
    const hasMatch = faq.keywords.some((faqKeyword) =>
      keywordsLower.some((kw) => faqKeyword.includes(kw) || kw.includes(faqKeyword))
    );
    if (hasMatch) return faq;
  }

  return null;
}

/**
 * Helper function to get facts by topic
 */
export function getFactByTopic(topic: string): typeof portfolioTrainingData.knowledge.facts[0] | null {
  return portfolioTrainingData.knowledge.facts.find(
    (f) => f.topic.toLowerCase() === topic.toLowerCase()
  ) || null;
}

/**
 * Helper function to get capability by trigger
 */
export function getCapabilityByTrigger(
  text: string
): typeof portfolioTrainingData.capabilities[0] | null {
  const textLower = text.toLowerCase();

  for (const capability of portfolioTrainingData.capabilities) {
    const hasMatch = capability.triggers.some((trigger) => textLower.includes(trigger));
    if (hasMatch) return capability;
  }

  return null;
}

export default portfolioTrainingData;
