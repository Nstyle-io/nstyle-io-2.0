import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { NailDesigner as NailDesignerComponent } from '@/components/nail-designer/NailDesigner';
import AIChatBubble from '@/components/ai/AIChatBubble';

const NailDesigner = () => {
  const [aiChatMessage, setAiChatMessage] = useState<string>('');

  const handleAIChat = (message: string) => {
    setAiChatMessage(message);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4">
          <NailDesignerComponent onAIChat={handleAIChat} />
        </div>
      </main>

      <BottomNav />
      <AIChatBubble onNailDesignerMessage={handleAIChat} />
    </div>
  );
};

export default NailDesigner;