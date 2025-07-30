import { useState } from 'react';
import { Bot, Send, X, Sparkles, Palette, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "What nail shape suits my fingers?",
  "Trending nail colors for winter",
  "How to make nails last longer?",
  "Best nail care routine",
];

const AIChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm Nora, your AI nail assistant! 💅 Ask me anything about nail care, trends, or find the perfect salon for you!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (input: string): string => {
    const responses = [
      "Great question! For your nail type, I'd recommend trying a gel manicure with a square shape. It's trending and durable! 💎",
      "Based on current trends, holographic and chrome finishes are super popular right now! Would you like salon recommendations? ✨",
      "For longer-lasting nails, try using a base coat, thin layers of polish, and always seal with a top coat. Don't forget cuticle oil! 💪",
      "I'd love to help you find the perfect nail look! What's your style preference - classic, bold, or trendy? 🎨",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <>
      {/* Chat Bubble Trigger */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full btn-gradient animate-pulse-glow shadow-lg"
      >
        <Bot className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96 glass-panel border border-white/20 rounded-2xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Nora AI</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-60 overflow-y-auto custom-scrollbar space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'glass-card border border-white/10'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2">
              <div className="flex items-center space-x-1 mb-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Quick questions:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestedQuestions.map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about nails..."
                className="flex-1 glass-card border-white/10"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="btn-gradient px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBubble;