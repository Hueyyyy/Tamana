# Tamana - Project Overview

This document provides a technical overview of the Tamana project, its architecture, and development patterns.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **API Layer**: [Hono](https://hono.dev/) (Integrated as a catch-all route at `/api/[[...route]]`)
- **Backend-as-a-Service**: [Appwrite](https://appwrite.io/) (Auth, Database, Storage)
- **Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Type Safety**: [Zod](https://zod.dev/) for validation and Hono RPC for end-to-end typing.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/) (Radix UI)
- **Forms**: `react-hook-form` with Zod resolvers.
- **State in URL**: `nuqs` for managing search parameters.

---

## 🏗️ Architecture & Project Structure

The project follows a **modular feature-based architecture**. Each core functionality is encapsulated within its own directory in `src/features/`.

### Folder Structure
- `src/app/`: Next.js pages, layouts, and the root Hono API handler.
- `src/components/`: Reusable global UI components (generic).
- `src/features/`: Feature-specific logic (e.g., `auth`, `workspaces`, `tasks`).
- `src/hooks/`: Reusable React hooks.
- `src/lib/`: Library initializations and shared utilities.
- `src/public/`: Static assets.

### Inside a Feature (`src/features/[featureName]`)
- `api/`: React Query hooks for client-side data fetching.
- `components/`: UI components specific to this feature.
- `hooks/`: Custom hooks for this feature.
- `server/route.ts`: Hono API endpoints for this feature.
- `schemas.ts`: Zod validation schemas.
- `types.ts`: TypeScript interfaces/types.
- `utils.ts`: Helper functions.

---

## ✨ Key Features

- **Multi-tenant Workspaces**: Create and manage multiple isolated workspaces.
- **Project Organization**: Organize tasks within specific projects.
- **Advanced Task Management**:
    - **Multiple Views**: Switch between List, Kanban (with drag-and-drop), and Calendar views.
    - **Filtering**: Filter tasks by status, assignee, project, and due date.
    - **Bulk Updates**: Support for updating task positions and statuses across the board.
- **Analytics Dashboards**: Visual metrics for workspaces and projects showing task completion trends and overdue counts.
- **Robust Authentication**: Secure sign-in/sign-up with Appwrite, including OAuth support.
- **Member Management**: Invite members to workspaces via unique invite codes with Role-Based Access Control (RBAC).
- **Profile Customization**: Personalize user profiles with avatars and secure account management.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS and Shadcn UI.

---

## 📡 API Architecture (Hono RPC)

The API is built using Hono, mounted at `/api`. This setup provides several benefits:
1. **Lightweight Middleware**: Efficient request handling.
2. **Type-Safe RPC**: By exporting the `AppType` from `src/app/api/[[...route]]/route.ts`, the frontend can use a typed client (`src/lib/rpc.ts`) to make requests with full IntelliSense.

**Key File**: `src/app/api/[[...route]]/route.ts` - Aggregates all feature routes.

---

## 🔐 Authentication Flow

1. **Session Management**: Uses Appwrite's session cookies (`tmn_session`).
2. **Middleware**: `src/lib/session-middleware.ts` is a Hono middleware that:
   - Validates the session cookie with Appwrite.
   - Injects the `databases`, `storage`, `users`, and current `user` into the Hono context.
3. **Route Protection**: Use `sessionMiddleware` in Hono routes to ensure the user is authenticated.

---

## 🗃️ Database & Storage (Appwrite)

- **Database**: Appwrite's NoSQL database is used for storing workspaces, members, projects, and tasks.
- **Storage**: Appwrite's bucket storage is used for profile avatars and workspace/project images.
- **Configurations**: Environment-specific IDs (Database, Buckets, Collections) are managed in `src/config.ts`.

---

## 🛠️ Key Files & Entry Points

- `src/app/layout.tsx`: Root layout with `QueryProvider` and `Toaster`.
- `src/lib/appwrite.ts`: Factory functions for creating Appwrite clients (Admin vs. Session-based).
- `src/lib/rpc.ts`: The Hono RPC client used by the frontend.
- `src/features/auth/server/route.ts`: Core authentication logic.

---

## 🔄 Common Workflows

### Adding a New API Endpoint
1. Define the Zod schema in `features/[feature]/schemas.ts`.
2. Add the route to `features/[feature]/server/route.ts`.
3. Create a React Query hook in `features/[feature]/api/use-[action].ts`.

### Adding a New Feature
1. Create a new folder in `src/features/`.
2. Define its routes and mount them in `src/app/api/[[...route]]/route.ts`.
3. Add the feature's types, schemas, and components.

---

## 📅 Recent Updates

### 🔐 Profile & Security (April 2026)
- **Profile Management**: Users can now update their name and profile picture.
- **Account Security**: Implemented functionality for users to change their email and password (requires current password verification).
- **Avatar Storage**: Profile images are stored in Appwrite Storage, with `imageId` managed in user preferences. Includes automatic cleanup of old avatars in storage when updated.
- **Settings Page**: Added a dedicated profile settings page for managing these attributes.

### 📊 Analytics & Insights
- **Workspace & Project Analytics**: Real-time tracking of task statistics:
    - Total task count and month-over-month difference.
    - Assigned tasks count and progress.
    - Incomplete, completed, and overdue task tracking.
- **Data Visualization**: Integrated charts and cards to display these metrics on workspace and project dashboards.

### 🛠️ UI & API Improvements
- **Optimized Image Uploads**: Refactored image upload logic to handle base64 previews and storage more efficiently.
- **Refined Task Management**: Improved the Kanban board and task status transitions.
- **Bug Fixes**: Addressed form validation issues and ensured consistent data fetching across feature modules.
