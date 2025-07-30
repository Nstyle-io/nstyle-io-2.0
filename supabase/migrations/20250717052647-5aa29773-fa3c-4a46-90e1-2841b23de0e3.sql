-- Add some sample salon data for testing the map
INSERT INTO public.salon_profiles (
  salon_name, 
  owner_id, 
  address, 
  city, 
  state, 
  phone, 
  business_email, 
  description, 
  is_verified
) VALUES 
(
  'Elite Nail Studio', 
  '22142f0c-65d4-427b-bfb5-603c5d9d116f', 
  '123 Main Street', 
  'New York', 
  'NY', 
  '(555) 123-4567', 
  'info@elitenails.com', 
  'Premium nail salon offering the latest in nail art and design trends.', 
  true
),
(
  'Glamour Nails & Spa', 
  '22142f0c-65d4-427b-bfb5-603c5d9d116f', 
  '456 Broadway Ave', 
  'New York', 
  'NY', 
  '(555) 987-6543', 
  'contact@glamournails.com', 
  'Full-service nail salon and spa with relaxing atmosphere and expert technicians.', 
  true
),
(
  'Urban Nail Bar', 
  '22142f0c-65d4-427b-bfb5-603c5d9d116f', 
  '789 Fifth Avenue', 
  'New York', 
  'NY', 
  '(555) 246-8135', 
  'hello@urbannailbar.com', 
  'Modern nail bar specializing in trendy designs and quick service.', 
  true
);