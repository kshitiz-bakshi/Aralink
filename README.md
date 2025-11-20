# Aralink - Residential Property Management App

A mobile application for small-scale landlords, property managers, and tenants to manage properties, tenants, maintenance requests, rental applications, and accounting—all in one place.

## ✨ Features

### 🏠 Dashboard
- Main navigation hub with quick-access tiles for all major functions

### 🏘️ Properties Management
- Add/view/edit/deactivate properties
- Define units and sub-units per property
- Manage tenant assignments

### 👥 Tenant Management
- Add/deactivate/delete tenants
- Mandatory property mapping
- Manage tenant documents (uploads)

### 🛠️ Maintenance
- Submit maintenance requests (with photo/video uploads ≤ 1 MB)
- Update ticket status and priority (low/medium/high)
- Track resolution notes
- Real-time status tracking (open → in-progress → resolved)

### 📝 Rental Applicants
- Add applicant information (Name, Email, Phone)
- Trigger rental application workflow
- Track application status (new → under-review → approved/rejected)
- Manage applicant documents

### 💰 Accounting
- Add/update/delete invoices and rent transactions
- Categorize expenses (maintenance, utilities, property tax, other)
- Generate rent and expense reports by property and date range
- Year-end tax reporting

### 🔐 Authentication
- User registration (Landlord, Tenant, Manager roles)
- Login via username/password
- OTP verification (email/phone) option
- Role-based access control

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Styling**: React Native StyleSheet + themed components
- **State**: Local React State (ready for Context/Redux integration)
- **Backend** (Optional): Supabase (Auth, PostgreSQL, Storage)

## 📁 Project Structure

```
app/
├── _layout.tsx                  # Root layout with auth routing
├── auth/                        # Authentication screens
│   ├── index.tsx               # Auth landing page
│   ├── login.tsx               # Login screen
│   ├── register.tsx            # Registration screen
│   └── otp.tsx                 # OTP verification screen
├── (tabs)/                     # Tab-based main navigation
│   ├── _layout.tsx             # Tab layout
│   ├── index.tsx               # Home dashboard
│   ├── properties.tsx          # Properties list
│   ├── tenants.tsx             # Tenants list
│   ├── maintenance.tsx         # Maintenance tickets
│   ├── applicants.tsx          # Rental applicants
│   ├── accounting.tsx          # Invoices & accounting
│   └── explore.tsx             # Placeholder explore tab
├── property-detail.tsx         # Property form (modal)
├── tenant-detail.tsx           # Tenant form (modal)
├── maintenance-detail.tsx      # Maintenance form (modal)
├── applicant-detail.tsx        # Applicant form (modal)
└── invoice-detail.tsx          # Invoice form (modal)

components/                     # Reusable UI components
├── themed-text.tsx
├── themed-view.tsx
└── ui/icon-symbol.tsx

context/                        # React Context
└── auth-context.ts

hooks/                          # Custom hooks
├── use-auth.ts                 # Auth hook (stub)
├── use-color-scheme.ts
└── use-theme-color.ts

types/                          # TypeScript definitions
└── index.ts                    # All data models

constants/
└── theme.ts                    # Color themes
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Setup & Run

1. **Navigate to project**:
   ```bash
   cd /Users/kshitiz/Documents/Aralink_v1.0.0/my-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npx expo start
   ```

4. **Open on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web Browser
   - Scan QR code with **Expo Go** app on physical device

## 📱 App Navigation

```
/auth (landing)
├── /auth/login       (login with email/password or OTP)
├── /auth/register    (create account with role selection)
└── /auth/otp         (verify one-time password)

/(tabs) (main app, after login)
├── index             (📊 Dashboard with 5 quick-access tiles)
├── properties        (🏘️  Properties list)
├── tenants           (👥 Tenants list)
├── maintenance       (🛠️  Maintenance tickets)
├── applicants        (📝 Rental applicants)
├── accounting        (💰 Invoices & reports)
└── explore           (🌐 Placeholder)

Modal screens (overlay on tabs):
├── /property-detail
├── /tenant-detail
├── /maintenance-detail
├── /applicant-detail
└── /invoice-detail
```

## 📊 Current State

✅ **Implemented**:
- Full UI/UX for all modules (auth, dashboard, properties, tenants, maintenance, applicants, accounting)
- TypeScript types for all data models
- Responsive design with light/dark theme support
- Mock data in all list screens
- Form screens for CRUD operations
- Navigation and routing setup

⚠️ **Stubbed** (Ready for integration):
- Authentication (login, register, OTP verification)
- Data persistence (all data is local, resets on app reload)
- Backend API calls
- File uploads for maintenance attachments and tenant documents
- Receipt scanning / OCR for invoices
- Report generation (PDF export)

## 🔌 Next Steps: Backend Integration

### Option 1: Supabase (Recommended)

```bash
npm install @supabase/supabase-js
```

**Setup:**
1. Create free account at https://supabase.com
2. Create new project with PostgreSQL
3. Enable Auth (Email + Phone OTP)
4. Create tables (copy schema from `/docs/database-schema.sql`)
5. Enable Storage buckets for file uploads
6. Get API keys from Project Settings

**Implement:**
- Update `/hooks/use-auth.ts` to call Supabase Auth
- Create `/api/supabase-client.ts` with initialized client
- Replace mock data with real API calls
- Add file upload handlers for maintenance & tenant documents

### Option 2: Firebase

- Use Firebase Auth for user management
- Firestore for database
- Cloud Storage for file uploads

### Option 3: Custom Backend

- Set up Node.js + Express server
- PostgreSQL database
- JWT authentication
- REST or GraphQL API

## 📝 Data Models

All types defined in `/types/index.ts`:

**Core Models:**
- `User` - Landlord, tenant, or property manager
- `Property` - Building with multiple units
- `Unit` - Individual apartment/room
- `Tenant` - Occupant linked to unit
- `MaintenanceTicket` - Service request with attachments
- `Applicant` - Rental application
- `Invoice` - Expense entry
- `RentTransaction` - Payment record
- `Report` - Generated financial report

## 🎨 Theming

- Uses `useColorScheme()` hook for light/dark mode
- All components respond to system theme preference
- Colors centralized in `/constants/theme.ts`
- Easy to customize brand colors

## 📦 Available Scripts

```bash
npm start                    # Start Expo server
npm run android             # Open Android Emulator
npm run ios                 # Open iOS Simulator
npm run web                 # Open in web browser
npm run lint                # Run ESLint
npm run reset-project       # Reset to template state
```

## 🔐 Environment Variables

Create `.env` file in project root (for Supabase):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🐛 Troubleshooting

**Port in use:**
```bash
npx expo start --clear
```

**Simulator won't open:**
```bash
# iOS
open -a Simulator

# Android
emulator -list-avds
emulator @avd_name
```

**Module errors:**
```bash
rm -rf node_modules package-lock.json
npm install && npx expo start --clear
```

**App crashes on startup:**
- Check console for TypeScript errors
- Verify all imports are correct
- Clear cache: `npx expo start --clear`

## 📚 Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/routing/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

Proprietary - Aralink Property Management 2024

## 🤝 Support

For issues, feature requests, or integration help, reach out to the development team.

---

**Happy coding! 🚀**
