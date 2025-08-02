# Claim Expenses

A modern, full-stack expense claim management application built with React, TypeScript, and Supabase. This app helps employees submit claims, managers approve them, and finance teams manage reimbursements efficiently.

## Features

- **User Authentication** - Secure login/signup with role-based access
- **Dashboard** - Overview with statistics and recent activity
- **Claim Submission** - Multi-item expense forms with file uploads
- **Claims Management** - Search, filter, and sort claims
- **Approval Workflow** - Manager interface for reviewing claims
- **Real-time Updates** - Live status tracking and notifications
- **File Management** - Receipt upload and storage
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hazlijohar95/claimexpenses.git
cd claimexpenses
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
REACT_APP_SUPABASE_URL=https://dhhsmadffhlztiofrvjf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. **Set up the database**
- Go to your Supabase project dashboard
- Navigate to the SQL Editor
- Run the SQL commands from `database/schema.sql`

5. **Start the development server**
```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with roles and departments
- **claims** - Main expense claims with status tracking
- **expense_items** - Individual expense items within claims
- **attachments** - File attachments and receipts

## User Roles

- **Employee** - Can submit and view their own claims
- **Manager** - Can approve/reject claims and view team claims
- **Admin** - Full access to all claims and user management

## API Integration

The app integrates with Supabase for:
- **Authentication** - User signup, login, and session management
- **Database** - PostgreSQL with Row Level Security (RLS)
- **Storage** - File uploads for receipts and attachments
- **Real-time** - Live updates for claim status changes

## Project Structure

```
claimexpenses/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── lib/           # Supabase configuration
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   └── styles/        # Global styles and Tailwind config
├── database/          # Database schema and migrations
├── public/           # Static assets
└── docs/            # Documentation
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Deployment

The app can be deployed to any static hosting service:

1. **Build the app**
```bash
npm run build
```

2. **Deploy the `build` folder** to your hosting service

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
