# OperionOS

OperionOS is a role-based project and task management workspace for employers, administrators, and employees. It provides project organization, task assignment, due dates, status tracking, multiple assignees, creator history, team roles, and responsive dashboard views.

## Features

- Employer workspaces with projects and team members
- Employee and admin access levels
- Task creation with multiple assignees
- Creator and assignee history on tasks
- Due-date ordering across My Tasks, project lists, and boards
- Assigned, ongoing, and completed task states
- Project sections with drag-and-drop task organization
- Project member management for employers and admins
- Responsive dashboard with collapsible sidebar
- Firebase Authentication and Firestore synchronization when configured
- Local browser storage fallback for prototype/development use

## Roles

### Employer

The workspace owner can create and manage projects, invite and remove team members, assign tasks, change member roles, and manage workspace data.

### Admin

An admin can manage project work and project members, but cannot access the People management list, invite employees, remove team members, or change team roles.

### Employee

An employee can view assigned project work, update permitted task status, and create personal tasks for themselves from the Home screen. Employees cannot create tasks for other people or create project tasks.

## Getting Started

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at `http://127.0.0.1:5173`.

To run the optional local OTP server in a second terminal:

```bash
npm run dev:auth
```

Create a local environment file from `.env.example` when Firebase or email verification is needed. Never commit `.env`, `.env.local`, or server secrets.

## Production Build

```bash
npm run build
npm run preview
```

The production output is written to `dist/` for hosting platforms such as Vercel.

## Vercel Deployment

1. Push this repository to GitHub.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Keep the detected framework as **Vite**.
4. Use `npm run build` as the build command.
5. Use `dist` as the output directory.
6. Add the variables from `.env.example` in Vercel Project Settings when using Firebase or the OTP server.
7. Add the Vercel production domain to Firebase Authentication authorized domains.
8. Deploy and test employer signup, invitation, employee login, task assignment, and role restrictions.

The Firebase client variables are safe to expose to the browser, but Firestore Security Rules must still protect workspace data. `RESEND_API_KEY` is server-only and must never be prefixed with `VITE_` or committed.

## Project Structure

```text
src/
  ProjectMvpApp.tsx       Main MVP workspace UI and local task flows
  mvp.css                 MVP workspace styling
  services/               Firebase, Firestore, and OTP integrations
  workspaces/             Workspace components used by the broader app shell
server/
  auth-server.mjs         Optional local OTP email server
public/
  design/                 Product design assets
docs/
  ARCHITECTURE.md         Runtime and data-flow notes
  DEPLOYMENT.md           Hosting and production checklist
```

## Verification

Before opening a pull request or deploying:

```bash
npm run build
```

This runs TypeScript checking and the Vite production build.

## Product Notes

The current MVP supports browser persistence and optional Firebase synchronization. For a public launch, review the Firestore rules, move all authorization checks to trusted backend rules/functions, add automated tests, and configure a production email provider for invitations and OTP verification.
