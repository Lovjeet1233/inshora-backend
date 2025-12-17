# Inshora CRM Frontend

A modern, responsive CRM dashboard built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI** - Beautiful gradient design with Tailwind CSS
- 🔐 **Authentication** - JWT-based authentication with persistent sessions
- 📊 **Dashboard** - Comprehensive overview with real-time analytics
- ⚙️ **Settings** - Manage all integrations (WhatsApp, Facebook, Email, SMS, Voice)
- 📧 **Campaigns** - Create and manage SMS, Email, and Call campaigns
- 🤖 **AI Content Generator** - Generate social media images with DALL-E 3
- 📱 **Social Media Studio** - Manage Facebook posts with insights
- 📈 **Analytics** - Detailed performance metrics and insights
- 💬 **WhatsApp Chat** - Real-time conversations with AI chatbot integration
- 📱 **Responsive Design** - Mobile-first approach with beautiful mobile UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (v5)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Project Structure

```
frontend/
├── app/                          # Next.js app directory
│   ├── analytics/               # Analytics page
│   ├── campaigns/               # Campaigns management
│   ├── dashboard/               # Main dashboard
│   ├── login/                   # Login page
│   ├── settings/                # Settings page
│   ├── social-media/            # Social media studio
│   ├── whatsapp/                # WhatsApp chat
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Root page (redirects)
│   ├── providers.tsx            # React Query provider
│   └── globals.css              # Global styles
├── components/                  # React components
│   ├── ui/                      # Shadcn/ui components
│   ├── Header.tsx               # App header
│   ├── Sidebar.tsx              # Navigation sidebar
│   └── LoadingSpinner.tsx       # Loading components
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts               # Authentication
│   ├── useAnalytics.ts          # Analytics data
│   ├── useCampaigns.ts          # Campaign management
│   ├── useSettings.ts           # Settings management
│   ├── useSocialPosts.ts        # Social media posts
│   └── useWhatsApp.ts           # WhatsApp messaging
├── lib/                         # Utility libraries
│   ├── api.ts                   # Axios instance & interceptors
│   └── utils.ts                 # Helper functions
├── store/                       # Zustand stores
│   └── authStore.ts             # Auth state management
├── types/                       # TypeScript type definitions
│   └── index.ts                 # All type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5000`

### Installation

1. **Navigate to frontend directory**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. **Run development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

## Pages

### Login Page (`/login`)

- Modern gradient design
- Email and password fields
- Remember me checkbox
- Demo credentials displayed
- Automatic redirect to dashboard on success

### Dashboard (`/dashboard`)

- Overview cards (campaigns, posts, engagement)
- Campaign performance metrics
- Social media engagement stats
- WhatsApp activity
- Recent activity timeline

### Settings (`/settings`)

Five tabs for different integrations:

1. **WhatsApp** - Configure WhatsApp Business API
2. **Facebook** - Configure Facebook Page integration
3. **Email** - SMTP settings for email campaigns
4. **SMS** - SMS provider configuration
5. **Voice Call** - Outbound call settings

### Campaigns (`/campaigns`)

- List view with filters (Draft, Running, Completed)
- Create campaign modal with:
  - Name and type selection (SMS/Email/Call)
  - CSV upload for contacts
  - Message template editor
- Start/Pause campaign actions
- Real-time status updates

### Social Media Studio (`/social-media`)

- **Content Generator**:
  - AI-powered image generation
  - Style selection (Professional, Modern, Vibrant, etc.)
  - Caption generation
  - Post directly to Facebook

- **Posts Management**:
  - Grid view of all posts
  - Post details modal
  - Edit captions
  - Refresh insights
  - Delete posts
  - Engagement metrics (likes, comments, shares)

### Analytics (`/analytics`)

- Overview cards
- Campaign performance by type
- Campaign status breakdown
- Social media engagement metrics
- Top performing posts

### WhatsApp Chat (`/whatsapp`)

- **Conversation List**:
  - Search functionality
  - Real-time updates (polls every 3 seconds)
  - Unread count badges

- **Chat Area**:
  - Message history
  - AI response indicators
  - Send messages
  - Auto-scroll to latest message

## Authentication Flow

1. User enters credentials on `/login`
2. JWT token stored in localStorage
3. Token automatically added to all API requests
4. Protected routes check for token
5. Logout clears token and redirects to login

## API Integration

All API calls use React Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Loading states
- Error handling

Example usage:

```typescript
const { campaigns, isLoading } = useCampaigns();
const { createCampaign, isCreating } = useCampaigns();
```

## State Management

### Zustand Store (Auth)

```typescript
const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### React Query (Data)

All server data managed through React Query hooks.

## Styling

### Tailwind Configuration

Custom color palette:
- Primary: Indigo (#6366f1)
- Secondary: Pink (#ec4899)
- Background: Slate dark theme
- Accent colors for different states

### Component Variants

Using class-variance-authority for component variants:

```typescript
buttonVariants({ variant: "default", size: "lg" })
```

## Error Handling

- Toast notifications for all errors
- Automatic retry for failed requests
- 401 responses redirect to login
- Form validation with helpful messages

## Performance Optimizations

- Next.js automatic code splitting
- Image optimization with Next/Image
- React Query caching
- Debounced search inputs
- Lazy loading of components

## Responsive Design

- Mobile-first approach
- Hamburger menu on mobile
- Stacked layouts on small screens
- Touch-friendly buttons
- Responsive grid systems

## Demo Credentials

```
Email: admin@inshora.com
Password: Inshora@2025
```

## Development Tips

### Adding a New Page

1. Create page in `app/[page-name]/page.tsx`
2. Add route to sidebar in `components/Sidebar.tsx`
3. Implement the page component
4. Add any required API hooks in `hooks/`

### Creating API Hooks

Example:

```typescript
export function useMyData() {
  const { data, isLoading } = useQuery({
    queryKey: ["myData"],
    queryFn: async () => {
      const { data } = await api.get("/endpoint");
      return data;
    },
  });

  return { data, isLoading };
}
```

### Adding UI Components

Use shadcn/ui CLI or copy components from `components/ui/`

## Troubleshooting

### API Connection Issues

- Verify backend is running on port 5000
- Check CORS configuration
- Verify `.env.local` has correct API URL

### Authentication Issues

- Clear localStorage and try again
- Check JWT token in browser DevTools
- Verify backend is returning valid tokens

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## License

ISC
