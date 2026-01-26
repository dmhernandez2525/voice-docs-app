/**
 * Voice Stocks Demo Page
 *
 * Demonstrates Voice Stocks features on a mock portfolio page.
 * Includes sections for navigation, tour functionality, and voice commands.
 */

import { useEffect } from 'react';
import { VoiceStocksWidget } from '../components/widget/VoiceStocksWidget';
import { portfolioTrainingData } from '../data/portfolioTrainingData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Code, Briefcase, GraduationCap, Mail, Github, Linkedin,
  ExternalLink, Star, Zap, Globe,
} from 'lucide-react';

export function VoiceStocksDemo() {
  // Update page title
  useEffect(() => {
    document.title = 'Voice Stocks Demo - Portfolio';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section id="hero" data-section="hero" className="relative py-20 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
            Voice Stocks Demo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Alex Developer
          </h1>
          <p className="text-xl text-purple-100 mb-8">
            Full-Stack Developer & AI Enthusiast
          </p>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto mb-8">
            Building innovative web applications with modern technologies.
            Passionate about creating accessible, voice-enabled user experiences.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="secondary" className="gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="secondary" className="gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
              <Mail className="w-4 h-4" />
              Contact
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
      </section>

      {/* Navigation */}
      <nav id="navigation" data-section="navigation" className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-600">Alex.dev</span>
            <div className="flex gap-6">
              <a href="#about" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">About</a>
              <a href="#skills" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">Skills</a>
              <a href="#projects" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">Projects</a>
              <a href="#experience" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">Experience</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* About Section */}
      <section id="about" data-section="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            About Me
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                I'm a full-stack developer with 5+ years of experience building web applications.
                I specialize in React, TypeScript, and Node.js, with a growing focus on AI integration
                and voice-enabled interfaces.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                My passion lies in creating accessible, intuitive user experiences that leverage
                the latest technologies. I believe in continuous learning and staying at the
                forefront of web development trends.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span>Based in San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <span>Open to remote opportunities</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span>5+ years of experience</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" data-section="skills" className="py-20 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Code className="w-8 h-8 text-purple-600" />
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frontend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Framer Motion'].map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Backend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'GraphQL'].map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI & Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['OpenAI', 'LangChain', 'Docker', 'AWS', 'Git'].map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" data-section="projects" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-600" />
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Voice Stocks',
                description: 'Embeddable voice-enabled AI assistant with guided tours and DOM navigation.',
                tech: ['React', 'TypeScript', 'Web Speech API', 'Chrome AI'],
              },
              {
                title: 'AI Code Review',
                description: 'Automated code review tool using LLMs to analyze pull requests.',
                tech: ['Python', 'FastAPI', 'OpenAI', 'GitHub API'],
              },
              {
                title: 'Real-time Dashboard',
                description: 'Analytics dashboard with live data updates and custom visualizations.',
                tech: ['Next.js', 'D3.js', 'WebSockets', 'PostgreSQL'],
              },
              {
                title: 'Mobile Task App',
                description: 'Cross-platform task management app with offline support.',
                tech: ['React Native', 'SQLite', 'Redux', 'Firebase'],
              },
            ].map(project => (
              <Card key={project.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {project.title}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" data-section="experience" className="py-20 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-purple-600" />
            Experience
          </h2>
          <div className="space-y-6">
            {[
              {
                role: 'Senior Frontend Developer',
                company: 'TechCorp Inc.',
                period: '2022 - Present',
                description: 'Leading frontend development for enterprise applications. Implemented design system used across 5+ products.',
              },
              {
                role: 'Full Stack Developer',
                company: 'StartupXYZ',
                period: '2020 - 2022',
                description: 'Built and scaled core product features. Reduced page load times by 60% through optimization.',
              },
              {
                role: 'Junior Developer',
                company: 'WebAgency',
                period: '2019 - 2020',
                description: 'Developed client websites and web applications. Collaborated with design team on UI/UX improvements.',
              },
            ].map(exp => (
              <Card key={exp.role}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{exp.role}</h3>
                      <p className="text-purple-600">{exp.company}</p>
                    </div>
                    <Badge variant="outline">{exp.period}</Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{exp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-section="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-purple-600" />
            Get In Touch
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Mail className="w-4 h-4" />
              alex@example.com
            </Button>
            <Button variant="outline" className="gap-2">
              <Linkedin className="w-4 h-4" />
              Connect on LinkedIn
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>Voice Stocks Demo - Built to showcase voice-enabled navigation and guided tours.</p>
          <p className="mt-2">
            Try saying "give me a tour" or "go to projects" to test Voice Stocks!
          </p>
        </div>
      </footer>

      {/* Voice Stocks Widget */}
      <VoiceStocksWidget
        config={{
          trainingData: portfolioTrainingData,
          enableVoiceStocks: true,
          showTourButton: true,
          showHelpButton: true,
          mode: 'floating',
          position: 'bottom-right',
          branding: {
            title: 'Voice Stocks',
            subtitle: 'Portfolio Assistant',
          },
        }}
      />
    </div>
  );
}

export default VoiceStocksDemo;
