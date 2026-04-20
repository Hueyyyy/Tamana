# Tamana - Project Overview

This document provides a technical overview of the Tamana project, its architecture, and development patterns.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **API Layer**: [Hono](https://hono.dev/) (Integrated as a catch-all route at `/api/[[...route]]`)
- **Backend-as-a-Service**: [Appwrite](https://appwrite.io/) (Auth, Database, Storage, Realtime)
- **Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Real-time Updates**: Appwrite Realtime for instant notifications.
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
- `src/features/`: Feature-specific logic (e.g., `auth`, `workspaces`, `tasks`, `notifications`).
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
  - **Task Comments**: Collaborative thread for each task with member tagging and real-time updates.
- **Real-time Notifications**: Instant alerts for task assignments, mentions in comments, and status changes.
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
- **Storage**: Appwrite's bucket storage is used for profile avatars and project images.
- **Realtime**: Appwrite Realtime is used for push-based updates to the UI, particularly for notifications.
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

### 📅 Recent Updates

### 💬 Task Comment System (April 2026)

- **Collaborative Threading**: Each task now supports a full comment history.
- **Rich CRUD Operations**: Users can create, edit, and delete comments with built-in safety confirmations.
- **Role-Based Access Control**: Strict permissions ensure only authors can edit comments, while both authors and workspace admins can delete them.
- **Smart Member Tagging**: Integrated `@mention` system with a real-time member selection dropdown. Supports names with spaces and provides visual highlighting of tags.
- **Mention Notifications**: Automatically triggers in-app alerts and email notifications for tagged members.
- **Polished UI**: Includes relative timestamps (e.g., "5 minutes ago"), "(edited)" indicators, and initials-based avatars for commentators.

### 🔔 Notification System (April 2026)


- **Real-time Alerts**: Integrated Appwrite Realtime to provide instant notifications to users.
- **Activity Tracking**: Notifications are triggered for task assignments, unassignments, and task status changes.
- **Notification Bell**: Added a global notification component with unread counts and quick actions.

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

### 🛠️ UI, Navigation & API Improvements

- **Redirect Back System**: Implemented a robust redirection system using Next.js Middleware and a `next` query parameter. This ensures users are returned to their intended destination (e.g., a specific task page from an email link) after successful authentication.
- **Enhanced Session Persistence**: Optimized authentication cookie settings by switching to `SameSite: Lax` and implementing environment-dependent `Secure` flags. This improves the user experience when navigating to the app from external links (like email notifications) while maintaining security in production.
- **Email Notification Reliability**: Fixed critical bugs in the email notification utility to ensure reliable delivery of task assignment and status update alerts.
- **Optimized Image Uploads**: Refactored image upload logic to handle base64 previews and storage more efficiently.
- **Refined Task Management**: Improved the Kanban board and task status transitions.
- **Bug Fixes**: Addressed form validation issues and ensured consistent data fetching across feature modules.
