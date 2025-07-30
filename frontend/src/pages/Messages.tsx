import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SnapchatStyleMessages } from '@/components/messaging/SnapchatStyleMessages';
import { NewConversationModal } from '@/components/messaging/NewConversationModal';
import AIChatBubble from '@/components/ai/AIChatBubble';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface Conversation {
  id: string;
  last_message_at: string;
  participants: {
    user_id: string;
    profile: {
      display_name: string;
      username: string;
      avatar_url: string;
    };
  }[];
  last_message?: {
    content: string;
    sender_id: string;
  };
}

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; [key: string]: unknown } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [directMessageUserId, setDirectMessageUserId] = useState<string | null>(null);
  const [directMessageProfile, setDirectMessageProfile] = useState<{ id: string; username: string; avatar?: string; [key: string]: unknown } | null>(null);
  
  useEffect(() => {
    getCurrentUser();
    loadConversations();
    
    // Check for direct message request from URL
    const searchParams = new URLSearchParams(location.search);
    const userId = searchParams.get('user');
    
    if (userId) {
      setDirectMessageUserId(userId);
      createOrGetDirectConversation(userId);
    }
  }, [location, createOrGetDirectConversation]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`messages:${selectedChat}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedChat}`
          },
          (payload) => {
            console.log('New message:', payload);
            loadMessages(selectedChat); // Reload messages to get sender profile
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setCurrentUser({ ...user, profile });
    }
  };

  const createOrGetDirectConversation = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (!profile) {
        throw new Error('User not found');
      }
      
      setDirectMessageProfile(profile);
      
      // Check if conversation already exists
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      const { data: existingConversation } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(*)
        `)
        .eq('user_id', currentUser.id);
        
      if (existingConversation) {
        // Check if any of these conversations include the target user
        for (const conv of existingConversation) {
          const { data: otherParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .neq('user_id', currentUser.id);
            
          if (otherParticipants?.some(p => p.user_id === userId)) {
            setSelectedChat(conv.conversation_id);
            return;
          }
        }
      }
      
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
        
      if (newConversation) {
        // Add both participants
        await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConversation.id, user_id: currentUser.id },
            { conversation_id: newConversation.id, user_id: userId }
          ]);
          
        setSelectedChat(newConversation.id);
      }
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      toast({
        title: 'Error',
        description: 'Could not start conversation',
        variant: 'destructive'
      });
    }
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userConversations } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            last_message_at,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('conversations(last_message_at)', { ascending: false });

      if (userConversations) {
        const conversationsWithDetails = await Promise.all(
          userConversations.map(async (uc) => {
            // Get other participants
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select(`
                user_id
              `)
              .eq('conversation_id', uc.conversation_id)
              .neq('user_id', user.id);

            // Get participant profiles separately
            const participantProfiles = participants ? await Promise.all(
              participants.map(async (p) => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('display_name, username, avatar_url')
                  .eq('user_id', p.user_id)
                  .single();
                
                return {
                  user_id: p.user_id,
                  profile: profile || { display_name: 'Unknown', username: 'unknown', avatar_url: '' }
                };
              })
            ) : [];

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, sender_id')
              .eq('conversation_id', uc.conversation_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              id: uc.conversation_id,
              last_message_at: uc.conversations.last_message_at,
              participants: participantProfiles,
              last_message: lastMessage
            };
          })
        );

        setConversations(conversationsWithDetails);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messages) {
        // Get sender profiles separately
        const messagesWithProfiles = await Promise.all(
          messages.map(async (msg) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, avatar_url')
              .eq('user_id', msg.sender_id)
              .single();
            
            return {
              ...msg,
              sender_profile: profile || { display_name: 'Unknown', username: 'unknown', avatar_url: '' }
            };
          })
        );
        setCurrentMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat,
          sender_id: currentUser.id,
          content: messageInput.trim()
        });

      if (error) throw error;

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  if (selectedChat) {
    return (
      <div className="min-h-screen">
        <SnapchatStyleMessages
          selectedChat={selectedChat}
          onBack={() => {
            setSelectedChat(null);
            setDirectMessageProfile(null);
            setDirectMessageUserId(null);
            navigate('/messages', { replace: true });
          }}
          directMessageProfile={directMessageProfile}
        />
        <AIChatBubble />
      </div>
    );
    
    // Handle regular conversations
    const currentConversation = conversations.find(c => c.id === selectedChat);
    const otherParticipant = currentConversation?.participants[0];
    
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        
        <main className="pt-16 pb-20 md:pb-4">
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Chat Header */}
            <div className="glass-card p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedChat(null)}
                  >
                    ←
                  </Button>
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={otherParticipant?.profile.avatar_url} />
                      <AvatarFallback>
                        {otherParticipant?.profile.display_name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="font-semibold">{otherParticipant?.profile.display_name || 'User'}</h2>
                    <p className="text-xs text-muted-foreground">
                      @{otherParticipant?.profile.username || 'user'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender_id === currentUser?.id
                      ? 'bg-primary text-primary-foreground' 
                      : 'glass-card'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUser?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="glass-card p-4 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Image className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleSendMessage} size="sm" disabled={!messageInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <main className="pt-16 pb-20 md:pb-4">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-4">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Messages</h1>
            <Button 
              size="sm"
              onClick={() => setShowNewConversationModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 glass-card"
            />
          </div>

          {/* Conversations */}
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants[0];
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation.id)}
                  className="glass-card p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherParticipant?.profile.avatar_url} />
                        <AvatarFallback>
                          {otherParticipant?.profile.display_name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {otherParticipant?.profile.display_name || 'User'}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatConversationTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {conversations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Start a conversation with other nail enthusiasts
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <AIChatBubble />
      
      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onSelectUser={(userId) => {
          setShowNewConversationModal(false);
          createOrGetDirectConversation(userId);
        }}
        currentUserId={currentUser?.id || ''}
      />
    </div>
  );
};

export default Messages;