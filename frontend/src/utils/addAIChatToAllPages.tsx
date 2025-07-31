import React from 'react';
import AIChatBubble from '@/components/ai/AIChatBubble';

export const withAIChat = (WrappedComponent: React.ComponentType<unknown>) => {
  return (props: unknown) => (
    <>
      <WrappedComponent {...props} />
      <AIChatBubble />
    </>
  );
};

export default withAIChat;