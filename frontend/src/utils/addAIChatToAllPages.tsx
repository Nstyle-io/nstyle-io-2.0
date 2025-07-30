import React from 'react';
import AIChatBubble from '@/components/ai/AIChatBubble';

export const withAIChat = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => (
    <>
      <WrappedComponent {...props} />
      <AIChatBubble />
    </>
  );
};

export default withAIChat;