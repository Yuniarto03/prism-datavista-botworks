
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  uploadedData?: any[];
  currentSheet?: string;
}

// Initialize Google AI (you'll need to set your API key)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

export const ChatBot: React.FC<ChatBotProps> = ({ uploadedData = [], currentSheet = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m June Assist, your AI analytics companion. I can help you analyze your data, create insights, and answer questions about your datasets. How can I assist you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateAIResponse = async (userMessage: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Create context about the data
      const dataContext = uploadedData.length > 0 
        ? `The user has uploaded data with ${uploadedData.length} rows and columns: ${Object.keys(uploadedData[0] || {}).join(', ')}. Current sheet: ${currentSheet}.`
        : 'The user has not uploaded any data yet.';
      
      const prompt = `You are June Assist, an AI analytics companion. ${dataContext} User question: ${userMessage}. Provide helpful, concise responses about data analysis and insights.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI response error:', error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again or check if your Google AI API key is configured correctly.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Generate AI response
    const aiResponse = await generateAIResponse(inputValue);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      isUser: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-lg hover:shadow-xl transition-all duration-300 animate-glow-pulse"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-cyber-dark border border-neon-blue/30 rounded-lg shadow-2xl z-40 flex flex-col cyber-card">
          {/* Header */}
          <div className="p-4 border-b border-neon-blue/30 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-full flex items-center justify-center animate-glow-pulse">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neon-blue glow-text">June Assist</h3>
                <p className="text-xs text-gray-400">AI Analytics Companion</p>
              </div>
              <div className="ml-auto">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser 
                        ? 'bg-gradient-to-br from-neon-green to-neon-blue' 
                        : 'bg-gradient-to-br from-neon-purple to-neon-blue'
                    }`}>
                      {message.isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.isUser 
                        ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' 
                        : 'bg-cyber-light text-gray-300 border border-neon-purple/30'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-cyber-light border border-neon-purple/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-neon-purple animate-pulse" />
                        <span className="text-sm text-gray-300">June is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-neon-blue/30">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask June about your data..."
                className="flex-1 bg-cyber-light border-neon-blue/30 text-white placeholder-gray-400"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {uploadedData.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                💡 Ask about your {uploadedData.length} data rows {currentSheet && `from ${currentSheet}`}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
