# OperionOS Architecture

## Runtime

OperionOS is a Vite-powered React single-page application. `src/main.tsx` mounts `ProjectMvpApp`, which owns session state, workspace state, navigation history, task creation, and role-aware rendering for the current MVP surface.

## Data Flow

1. Authentication identifies the current user and workspace.
2. Workspace data is read from browser storage for local/prototype operation.
3. When Firebase is configured, authentication uses Firebase Auth and workspace/profile patches are synchronized with Firestore.
4. Task records store assignees, creator, dates, status, priority, project, and privacy metadata.
5. UI components derive role-specific views from the current user role rather than duplicating workspace data.

## Task Model

Tasks support one legacy `employeeId` plus the newer `employeeIds` array for multiple assignees. New tasks also store `createdBy`, allowing My Tasks, project lists, and task details to show the creator. Older records without `createdBy` remain readable and display an unknown creator where needed.

## Roles

- `employer`: workspace owner and full management access
- `admin`: project/task management access without People administration
- `employee`: personal task creation and assigned-work access

Client-side role checks improve the user experience, but production authorization must also be enforced by Firebase Security Rules or a trusted backend. Never rely on hidden buttons as the only security boundary.

## Navigation

The app uses browser history state for project and home views. The sidebar can collapse fully, and its project list remains independently scrollable when expanded.
