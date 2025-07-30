# Nstyle - Social Platform for Nail Art Enthusiasts

A modern social media platform designed specifically for nail art lovers, salons, and beauty professionals. Built with React, TypeScript, and Supabase.

![Nstyle Logo](public/placeholder.svg)

## 🌟 Overview

Nstyle is a specialized social network that connects nail art enthusiasts, professional nail artists, and salons in one vibrant community. Share your nail art creations, discover new trends, book appointments, and connect with like-minded beauty enthusiasts.

## ✨ Key Features

### For Users
- **🔐 Passwordless Authentication**: Secure magic link email authentication with device-aware social login options
- **📸 Photo & Video Sharing**: Share your nail art creations with high-quality media support
- **📱 Stories**: Share temporary content that disappears after 24 hours
- **💬 Real-time Messaging**: Connect with other nail art enthusiasts through direct messages
- **🔍 Smart Discovery**: Find trending designs, artists, and salons near you
- **❤️ Social Interactions**: Like, comment, save, and share your favorite nail designs
- **🎨 AI-Powered Features**: Get nail design suggestions and virtual try-ons
- **👥 Follow System**: Build your network of favorite artists and salons

### For Salons & Professionals
- **🏪 Business Profiles**: Showcase your work, services, and salon information
- **📅 Appointment Booking**: Integrated booking system for managing client appointments
- **💼 Service Management**: List and manage all your nail services with pricing
- **📊 Analytics Dashboard**: Track engagement, bookings, and business performance
- **⭐ Reviews & Ratings**: Build trust with client testimonials and ratings
- **🗺️ Location-based Discovery**: Appear in local searches and on the map

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (free tier available)
- (Optional) Docker for containerized deployment

### Quick Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nstyle.git
cd nstyle
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Configure Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env`
   - Run the database migrations from `backend/supabase/migrations/`

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app running!

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Authentication**: Magic Links, Google OAuth, Apple Sign-In
- **Deployment**: Docker support, Vercel/Netlify ready

## 📁 Project Structure

```
nstyle/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/         # Base UI components
│   │   ├── auth/       # Authentication components
│   │   ├── feed/       # Social feed components
│   │   ├── booking/    # Appointment booking
│   │   └── ...
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── integrations/   # External service integrations
│   └── services/       # API and business logic
├── public/             # Static assets
├── backend/            # Supabase backend
│   └── supabase/
│       ├── functions/  # Edge functions
│       └── migrations/ # Database schema
├── docker/             # Docker configurations
└── docs/              # Documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For production
VITE_APP_URL=https://your-domain.com
```

### Authentication Setup

1. **Email Magic Links** (enabled by default)
   - No additional configuration needed
   - Emails are sent automatically via Supabase

2. **Google OAuth**
   - Enable in Supabase Dashboard → Authentication → Providers
   - Add Google Client ID and Secret
   - See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed instructions

3. **Apple Sign-In**
   - Enable in Supabase Dashboard → Authentication → Providers
   - Configure Apple credentials
   - Automatically shown only on Apple devices

### Database Setup

Run the migrations in order:
```bash
# Using Supabase CLI
supabase db push

# Or manually run each migration file in backend/supabase/migrations/
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See [DOCKER_README.md](DOCKER_README.md) for detailed Docker instructions.

## 📱 Mobile Support

Nstyle is a Progressive Web App (PWA) that can be installed on mobile devices:

- **iOS**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Menu → Add to Home Screen

## 🧪 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for pre-commit hooks (coming soon)

## 🚀 Deployment Options

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nstyle)

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/nstyle)

### Docker
See the Docker deployment section above.

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to any static hosting service
3. Configure environment variables on your hosting platform

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📚 Documentation

- [Supabase Auth Configuration](SUPABASE_AUTH_CONFIG.md)
- [Google OAuth Setup](GOOGLE_OAUTH_SETUP.md)
- [Docker Deployment](DOCKER_README.md)
- [API Documentation](docs/API.md) (coming soon)

## 🐛 Known Issues

- Google OAuth requires manual configuration in Supabase Dashboard
- PWA installation prompt may not appear on all browsers
- Some features require a Supabase Pro plan for optimal performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Authentication and backend by [Supabase](https://supabase.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 💬 Support

- 🐛 [Report bugs](https://github.com/yourusername/nstyle/issues)
- 💡 [Request features](https://github.com/yourusername/nstyle/issues)
- 💬 [Discussions](https://github.com/yourusername/nstyle/discussions)
- 📧 Email: support@nstyle.app (coming soon)

---

Built with ❤️ by the Nstyle Team