export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          salon_id: string
          service_id: string
          start_time: string
          status: string | null
          total_price_cents: number | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          salon_id: string
          service_id: string
          start_time: string
          status?: string | null
          total_price_cents?: number | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          salon_id?: string
          service_id?: string
          start_time?: string
          status?: string | null
          total_price_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          created_at: string
          id: string
          requested_id: string
          requester_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_id: string
          requester_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      hashtag_trends: {
        Row: {
          created_at: string | null
          hashtag: string
          id: string
          last_updated: string | null
          post_count: number | null
          trend_score: number | null
        }
        Insert: {
          created_at?: string | null
          hashtag: string
          id?: string
          last_updated?: string | null
          post_count?: number | null
          trend_score?: number | null
        }
        Update: {
          created_at?: string | null
          hashtag?: string
          id?: string
          last_updated?: string | null
          post_count?: number | null
          trend_score?: number | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          room_id: string | null
          session_type: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          room_id?: string | null
          session_type?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          room_id?: string | null
          session_type?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          media_url: string | null
          message_type: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_designs: {
        Row: {
          created_at: string
          design_data: Json
          id: string
          is_public: boolean | null
          name: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design_data: Json
          id?: string
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design_data?: Json
          id?: string
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nail_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          preview_url: string | null
          shape: string
          template_data: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          preview_url?: string | null
          shape: string
          template_data: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_url?: string | null
          shape?: string
          template_data?: Json
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          allowed_users: string[] | null
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          images: string[] | null
          likes_count: number | null
          updated_at: string
          user_id: string
          video_url: string | null
          visibility: string | null
        }
        Insert: {
          allowed_users?: string[] | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          images?: string[] | null
          likes_count?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          visibility?: string | null
        }
        Update: {
          allowed_users?: string[] | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          images?: string[] | null
          likes_count?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_messages_from: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_private: boolean | null
          is_setup_complete: boolean | null
          location: string | null
          show_email_publicly: boolean | null
          story_visibility: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          allow_messages_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_private?: boolean | null
          is_setup_complete?: boolean | null
          location?: string | null
          show_email_publicly?: boolean | null
          story_visibility?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          allow_messages_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_private?: boolean | null
          is_setup_complete?: boolean | null
          location?: string | null
          show_email_publicly?: boolean | null
          story_visibility?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      salon_profiles: {
        Row: {
          address: string | null
          business_email: string | null
          business_hours: Json | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          id: string
          instagram_handle: string | null
          is_verified: boolean | null
          logo_url: string | null
          owner_id: string
          phone: string | null
          salon_name: string
          state: string | null
          updated_at: string
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_id: string
          phone?: string | null
          salon_name: string
          state?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_email?: string | null
          business_hours?: Json | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          owner_id?: string
          phone?: string | null
          salon_name?: string
          state?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          salon_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          salon_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salon_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          allowed_users: string[] | null
          content: string | null
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          is_live: boolean | null
          live_viewers: number | null
          stream_key: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          visibility: string | null
        }
        Insert: {
          allowed_users?: string[] | null
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          is_live?: boolean | null
          live_viewers?: number | null
          stream_key?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          visibility?: string | null
        }
        Update: {
          allowed_users?: string[] | null
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          is_live?: boolean | null
          live_viewers?: number | null
          stream_key?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: []
      }
      user_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_post: {
        Args: {
          post_user_id: string
          post_visibility: string
          post_allowed_users: string[]
          viewer_id: string
        }
        Returns: boolean
      }
      can_view_private_profile_details: {
        Args: { profile_user_id: string; profile_is_private: boolean }
        Returns: boolean
      }
      can_view_story: {
        Args: {
          story_user_id: string
          story_visibility: string
          story_allowed_users: string[]
          viewer_id: string
        }
        Returns: boolean
      }
      get_trending_hashtags: {
        Args: { limit_count?: number }
        Returns: {
          hashtag: string
          post_count: number
          trend_score: number
          is_trending: boolean
        }[]
      }
      get_trending_posts: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          content: string
          image_url: string
          video_url: string
          user_id: string
          created_at: string
          likes_count: number
          comments_count: number
          trend_score: number
        }[]
      }
      send_notification: {
        Args: {
          _user_id: string
          _type: string
          _content: string
          _actor_id?: string
          _related_id?: string
        }
        Returns: undefined
      }
      update_hashtag_trends: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
