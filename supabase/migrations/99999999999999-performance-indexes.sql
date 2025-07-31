-- Performance optimization indexes for production deployment
-- This migration should be run last to add all critical indexes

-- User authentication and profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Social feed performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_visibility_created_at ON posts(visibility, created_at DESC) WHERE visibility = 'public';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;

-- Social interactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_status ON follows(following_id, status) WHERE status = 'accepted';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_created ON likes(post_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);

-- Follow requests indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follow_requests_following_status ON follow_requests(following_id, status) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follow_requests_follower ON follow_requests(follower_id);

-- Salon and appointment system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salon_profiles_location ON salon_profiles(city, state) WHERE is_verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salon_profiles_search ON salon_profiles USING gin(to_tsvector('english', salon_name || ' ' || COALESCE(description, ''))) WHERE is_verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_salon_date_status ON appointments(salon_id, appointment_date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client_status ON appointments(client_id, status) WHERE client_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_salon_active ON services(salon_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category ON services(category, is_active) WHERE is_active = true;

-- Staff management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_salon_active ON staff(salon_id, is_active) WHERE is_active = true;

-- Messaging system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);

-- Hashtag trends indexes (performance critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtag_trends_score ON hashtag_trends(trend_score DESC, last_updated DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hashtag_trends_hashtag ON hashtag_trends(hashtag);

-- Saved posts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_posts_user_created ON saved_posts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_posts_post_user ON saved_posts(post_id, user_id);

-- Additional composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_visibility_created ON posts(user_id, visibility, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_salon_date_time ON appointments(salon_id, appointment_date, start_time) WHERE status = 'scheduled';

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_public_recent ON posts(created_at DESC) WHERE visibility = 'public' AND created_at > NOW() - INTERVAL '30 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_salon_profiles_verified ON salon_profiles(salon_name, city, state) WHERE is_verified = true;

-- Add statistics collection for better query planning
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Update table statistics
ANALYZE profiles;
ANALYZE posts; 
ANALYZE follows;
ANALYZE likes;
ANALYZE comments;
ANALYZE salon_profiles;
ANALYZE appointments;
ANALYZE services;
ANALYZE messages;
ANALYZE conversation_participants;
ANALYZE hashtag_trends;