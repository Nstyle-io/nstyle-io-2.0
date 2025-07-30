import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Send, Image, Smile, Video, Mic, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SnapMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'video';
  media_url?: string;
  is_read: boolean;
  expires_at?: string;
  sender_profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface SnapConversation {
  id: string;
  participants: {
    user_id: string;
    profile: {
      display_name: string;
      username: string;
      avatar_url: string;
    };
  }[];
  unread_count: number;
  last_snap_at: string;
}

interface SnapchatStyleMessagesProps {
  selectedChat: string | null;
  onBack: () => void;
  directMessageProfile?: any;
}

export const SnapchatStyleMessages: React.FC<SnapchatStyleMessagesProps> = ({
  selectedChat,
  onBack,
  directMessageProfile
}) => {
  const [messages, setMessages] = useState<SnapMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    if (selectedChat) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [selectedChat]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecording) {
        setRecordingTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

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

  const setupRealtimeSubscription = () => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`snap-messages:${selectedChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedChat}`
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    if (!selectedChat) return;

    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedChat)
        .order('created_at', { ascending: true });

      if (messages) {
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
        setMessages(messagesWithProfiles as SnapMessage[]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'video' = 'text', mediaUrl?: string) => {
    if (!selectedChat || !currentUser || (!content.trim() && !mediaUrl)) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat,
          sender_id: currentUser.id,
          content: content.trim() || '',
          message_type: type,
          media_url: mediaUrl
        });

      if (error) throw error;
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would upload the audio to storage and send as message
        // For now, just send a text message indicating voice message
        await sendMessage(`🎤 Voice message (${recordingTime}s)`, 'text');
        setIsRecording(false);
        setRecordingTime(0);
      };
      
      recorder.start();
      
      toast({
        title: 'Recording...',
        description: 'Hold to record voice message'
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone',
        variant: 'destructive'
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-yellow-400 via-pink-500 to-purple-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white">
            ←
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={directMessageProfile?.avatar_url} />
            <AvatarFallback className="bg-white/20 text-white">
              {directMessageProfile?.display_name?.slice(0, 2) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold text-sm">
              {directMessageProfile?.display_name || 'User'}
            </h3>
            <p className="text-white/70 text-xs">
              @{directMessageProfile?.username || 'user'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-white">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white">
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser?.id;
          const isUnread = !message.is_read && !isOwn;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              onClick={() => !isOwn && markMessageAsRead(message.id)}
            >
              <div className={`max-w-xs group ${isOwn ? 'order-2' : 'order-1'}`}>
                {!isOwn && (
                  <Avatar className="w-6 h-6 mb-1">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.sender_profile?.display_name?.slice(0, 1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`relative p-3 rounded-2xl ${
                    isOwn
                      ? 'bg-white text-black'
                      : 'bg-black/30 text-white backdrop-blur-sm'
                  }`}
                >
                  {message.message_type === 'text' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      {message.message_type === 'image' && <Image className="w-4 h-4" />}
                      {message.message_type === 'video' && <Video className="w-4 h-4" />}
                      <span className="text-sm">{message.content}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${isOwn ? 'text-black/60' : 'text-white/60'}`}>
                      {formatTime(message.created_at)}
                    </p>
                    {isUnread && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  
                  {!isOwn && isUnread && (
                    <div className="absolute -top-1 -right-1">
                      <Eye className="w-3 h-3 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onMouseLeave={stopVoiceRecording}
          >
            <Mic className={`w-5 h-5 ${isRecording ? 'text-red-400 animate-pulse' : ''}`} />
            {isRecording && (
              <span className="ml-1 text-xs">{recordingTime}s</span>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="text-white">
            <Camera className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-white">
            <Image className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send a chat"
              className="bg-white/20 border-white/30 text-white placeholder-white/60 rounded-full"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-white/60"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim()}
            className="bg-white text-black rounded-full w-10 h-10 p-0 hover:bg-white/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};