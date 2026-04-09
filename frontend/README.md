# Global Times Rwanda - Frontend

## Description

This is the frontend application for Global Times Rwanda, a comprehensive news platform built for Rwanda. It provides news articles, announcements, advertisements, and media content with multilingual support.

## Features

- News articles and trending news
- Announcements and contact forms
- Media uploads and management
- User authentication and session management
- Multilingual support (English, French, Kinyarwanda)
- Responsive design with Tailwind CSS
- Modern UI components with ShadCN UI

## Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (via ShadCN)
- **State Management**: React Query for API calls
- **Routing**: React Router (assumed from context)
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation

## Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   cd globaltimes-rwanda/frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. Open your browser to `http://localhost:5173` (default Vite port)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN UI components
│   └── ...             # Custom components (Navbar, NewsCard, etc.)
├── contexts/           # React contexts (Language, News)
├── hooks/              # Custom React hooks
├── lib/                # Utilities (API, translations, etc.)
├── pages/              # Page components
└── assets/             # Static assets
```

## Contributing

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Test your changes thoroughly

## License

This project is private and proprietary.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fa36c367-dca1-48ac-bf05-c4a1e0ce797c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
