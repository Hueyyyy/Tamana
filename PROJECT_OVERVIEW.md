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
  - **Filtering**: Filter tasks by status, assignee, project, priority, and due date.
  - **Bulk Updates**: Support for updating task positions and statuses across the board.
  - **Task Comments**: Collaborative thread for each task with member tagging and real-time updates.
  - **Activity Log**: Automatically tracks and displays all changes made to a task (status, assignee, due date, etc.).
- **Real-time Notifications**: Instant alerts for task assignments, mentions in comments, and status changes.
- **Analytics Dashboards**: Visual metrics for workspaces and projects showing task completion trends and overdue counts.
- **Robust Authentication**: Secure sign-in/sign-up with Appwrite, including OAuth support.
- **Member Management**: Invite members to workspaces via unique invite codes with Role-Based Access Control (RBAC).
- **Profile Customization**: Personalize user profiles with avatars and secure account management.
- **Responsive Design & Dark Mode**: Fully responsive UI built with Tailwind CSS and Shadcn UI, supporting animated toggling between Light, Dark, and System themes.

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

### 🌙 Animated Dark Mode Support (May 2026)

- **Infrastructure Integration**: Configured `next-themes` with a client-safe `ThemeProvider` in the root layout, avoiding hydration mismatches using `suppressHydrationWarning`.
- **Micro-animated Theme Toggle**: Created a custom `ThemeToggle` button inside the main navigation bar that spins and scales Sun and Moon icons when clicked.
- **Sidebar & Workspace Switcher Overhauls**: Re-styled the sidebar layout, active links, and workspace switcher trigger elements to seamlessly shift backgrounds (`dark:bg-zinc-950`, `dark:bg-neutral-800`), borders, and text colors in dark mode.
- **Card & List Views Enhancements**: Updated Project, Member, Kanban board cards, and calendar event cards to support dynamic dark-mode styling variables.
- **Comments & Forms Upgrades**: Updated the comments section, mention suggestion overlays, text areas, button variants (`secondary`, `muted`, `tertiary`), and form labels to adapt cleanly in dark mode.

### ⚡ Simple Visual Priorities & Sub-task Progress Visualization (May 2026)

- **Task Priorities**: Introduced support for task priorities (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) with corresponding colored status badges (Crimson/rose for Urgent, Amber/orange for High, Blue for Medium, and Slate/gray-blue for Low). Priorities default to `MEDIUM` on creation.
- **Priority Filter**: Added a priority selector filter to the tasks dashboard, enabling filtering of tasks by priority state (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) dynamically synchronized through the URL query state.
- **Sub-task Progress Tracking**: Added completion fraction indicators (e.g., `2/4`) and visual progress bars (`bg-emerald-500`) to both Kanban cards and task list table columns when a task has one or more sub-tasks.
- **Interactive Inline Priority Switcher**: Integrated an inline dropdown selection menu for task priority in the task details overview, allowing users to modify a task's priority on the fly, which automatically logs audit activity records.

### 📋 Task Usability, Defaults, & Layout Spacing (May 2026)

- **Optional Assignees**: Set the assignee field to be optional when creating or editing tasks. Tasks can now be unassigned, displaying clean fallbacks (e.g. "Unassigned" text and neutral avatars) across Kanban, Table, Calendar, and Overview pages.
- **Smart Sub-task Defaults**: Sub-tasks automatically inherit the assignee of their parent task by default when opened from the sub-task creation menu.
- **Backlog Default Status**: Newly created sub-tasks and tasks created from the project page switcher default to the `BACKLOG` status (excluding direct creation in specific Kanban columns).
- **Styled Status Filters**: Upgraded the status dropdown filter to display colored indicator dots next to each status matching their corresponding badge colors.
- **Unassigned Filtering**: Added an "Unassigned" option to the assignee filter to easily query and view tasks that currently have no assignee, with `MemberAvatar` components displayed next to each assignee option (and the "Unassigned" item) in the dropdown list.
- **Layout Alignment**: Equalized the height of the Task Overview and Task Description cards on the Task Detail page, and enabled the description container/textarea to dynamically stretch to fill the vertical space.
- **Mobile & Desktop Navigation Spacing**: Added a consistent bottom margin (`mb-4`) to the main navigation bar on all screen sizes to prevent the navbar from being squished against the content.
- **Edit/Cancel Button Click-away Fix**: Resolved a race condition on the description's edit/cancel button toggle by checking button references inside the `useClickAway` hook.

### 💬 Task Comment System (April 2026)

- **Collaborative Threading**: Each task now supports a full comment history.
- **Rich CRUD Operations**: Users can create, edit, and delete comments with built-in safety confirmations.
- **Role-Based Access Control**: Strict permissions ensure only authors can edit comments, while both authors and workspace admins can delete them.
- **Smart Member Tagging**: Integrated `@mention` system with a real-time member selection dropdown. Supports names with spaces and provides visual highlighting of tags.
- **Mention Notifications**: Automatically triggers in-app alerts and email notifications for tagged members.
- **Polished UI**: Includes relative timestamps (e.g., "5 minutes ago"), "(edited)" indicators, and initials-based avatars for commentators.

### 📜 Task Activity Log & Collaborative Tabs (April 2026)

- **Automated Event Tracking**: Changes to task name, description, status, assignee, due date, and project are automatically recorded as activity logs.
- **Unified Collaboration Hub**: Implemented a tabbed interface on the task detail page to seamlessly switch between **Comments** and **Activity Log**.
- **Enhanced UI Layout**: Added a fixed-height scrollable area for both collaboration sections, ensuring the task detail page remains compact and usable regardless of the amount of activity or conversation.
- **Populated Data**: Activities are displayed with the user's name and avatar for clear accountability.

### 🔔 Notification System (April 2026)

- **Real-time Alerts**: Integrated Appwrite Realtime to provide instant notifications to users.
- **Comprehensive Activity Tracking**: Notifications are triggered for:
  - Task assignments and status changes.
  - Being tagged in a comment (@mentions).
  - Being removed from a workspace.
  - Having your role upgraded (to Admin) or downgraded (to Member).
- **Email Integration**: Critical notifications (mentions, assignments, member events) also trigger email alerts.
- **Notification Bell**: Global component with unread counts and smart linking based on notification type.

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
