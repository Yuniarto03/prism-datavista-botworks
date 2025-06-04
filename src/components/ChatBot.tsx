
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageCircle, Loader2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  uploadedData?: any[];
  currentSheet?: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ uploadedData = [], currentSheet = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m June Assist, your intelligent data analysis companion. I can help you understand your uploaded data, answer questions about your dataset, provide insights, and guide you through the platform features. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Draggable and resizable states
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 384, height: 384 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const chatRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create context about the current data
      const dataContext = uploadedData.length > 0 ? {
        rowCount: uploadedData.length,
        columns: Object.keys(uploadedData[0] || {}),
        currentSheet,
        sampleData: uploadedData.slice(0, 3)
      } : null;

      // Initialize Google AI (using a placeholder for demo - in production you'd need a real API key)
      // For now, we'll create a smart response based on the context
      let botResponse = '';

      if (dataContext) {
        botResponse = `Based on your data analysis request about "${inputMessage}", I can see you have ${dataContext.rowCount} records with columns: ${dataContext.columns.join(', ')}. `;
        
        if (inputMessage.toLowerCase().includes('summary')) {
          botResponse += 'I recommend using the Generate Summary feature in the Data Summary section to get comprehensive insights about your dataset.';
        } else if (inputMessage.toLowerCase().includes('chart') || inputMessage.toLowerCase().includes('visual')) {
          botResponse += 'You can create various visualizations in the Visualization section. Try different chart types to best represent your data patterns.';
        } else if (inputMessage.toLowerCase().includes('pivot')) {
          botResponse += 'The Data Summary section offers powerful pivot table functionality. Drag fields from the Field Library to create custom data aggregations.';
        } else {
          botResponse += 'Would you like me to help you explore specific aspects of your data or guide you through the available analysis features?';
        }
      } else {
        botResponse = `I understand you're asking about "${inputMessage}". To provide more specific insights, please upload your data first. Once you have data loaded, I can help you with detailed analysis, summaries, and visualizations.`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "June Assist Error",
        description: "Failed to get response from assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Global mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y))
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        setSize({
          width: Math.max(320, Math.min(800, resizeStart.width + deltaX)),
          height: Math.max(200, Math.min(600, resizeStart.height + deltaY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={chatRef}
      className="fixed z-50 bg-cyber-dark border border-neon-purple/30 rounded-lg shadow-2xl flex flex-col select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        ref={headerRef}
        className="flex items-center justify-between p-4 border-b border-neon-purple/30 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 cursor-grab active:cursor-grabbing rounded-t-lg"
      >
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-neon-purple" />
          <h3 className="font-semibold text-white">June Assist</h3>
          <GripHorizontal className="h-4 w-4 text-gray-400" />
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-neon-purple/20 text-white border border-neon-purple/30'
                    : 'bg-cyber-light text-gray-300 border border-neon-blue/30'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && <Bot className="h-4 w-4 text-neon-blue mt-0.5 flex-shrink-0" />}
                  {message.type === 'user' && <User className="h-4 w-4 text-neon-purple mt-0.5 flex-shrink-0" />}
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-cyber-light text-gray-300 border border-neon-blue/30 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-neon-blue" />
                  <Loader2 className="h-4 w-4 animate-spin text-neon-blue" />
                  <span className="text-sm">June is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-neon-purple/30">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask June about your data..."
            className="bg-cyber-light border-neon-blue/30 text-white placeholder-gray-400 focus:border-neon-blue"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-neon-purple/50 rounded-tl-lg" />
      </div>
    </div>
  );
};
