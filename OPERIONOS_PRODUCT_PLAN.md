# OperionOS.io Product Plan

Owner: Yash Jangid  
Project name: OperionOS.io  
Status: Auth, workspace, and invite foundation implementation  
Product type: Project management operating system for agencies  
Reference inspiration: MagnetOS.io, ClickUp-style feature depth, premium dashboard/timeline UI references supplied by Yash

## Product Vision

OperionOS.io will be a project management operating system for agencies.

The product should help agencies manage clients, projects, tasks, teams, approvals, documents, reporting, and recurring work from one simple and visually premium workspace.

It should not be limited to SEO in the first version. SEO can become one agency template or vertical later.

## Core Workflow

The main product flow is client-first:

0. [x] Agency owner first lands on a polished customer-first website.
0. [x] Customer-facing website adapted as a close OperionOS implementation of the supplied `OperionOS Design` Framer flow.
0. [x] Public marketing website and workspace app are separated: `/` is the website, `/app` is the product workspace/auth app.
0. [x] Public auth uses one user login.
0. [x] Direct public signup creates an agency owner account.
0. [x] Team members can register only from an agency invite link.
0. [x] Firebase Web Auth adapter added for email/password, Google sign-in, email verification, and password reset.
0. [x] First-login confetti added after account unlock.
0. [x] Create the live Firebase project and add real Vite Firebase credentials.
0. [x] Create Firebase Web app `OperionOS` under project `operionos`.
0. [ ] Enable Google provider in Firebase Authentication.
0. [ ] Replace Firebase email-link verification with personalized one-time-code email after a backend mail service is added.
0. [ ] Add authenticator app/TOTP after Firebase Authentication with Identity Platform MFA is enabled.
0. [x] Login resolves owner/team access automatically from direct signup or invite membership.
0. [x] Firestore persistence foundation added for user profiles and agency workspaces.
0. [x] Direct signup creates an employer profile and workspace record.
0. [x] Team invite records include workspace ID, secure token, accept link, and decline link.
0. [x] Local Resend auth server supports OTP request/verification routes.
0. [x] Local Resend auth server supports team invite email sending.
0. [ ] Add production Vercel API routes for OTP and invite endpoints.
0. [ ] Add final Firestore security rules before public production use.
0. [x] Agency owner completes a guided setup flow with purpose, agency category, discovery source, invites, tools, features, and workspace name.
1. [x] Employer onboards a client through a dedicated form launched from an Onboard Client button.
2. [x] Employer enters all important client data in one structured profile.
3. OperionOS creates the client's workspace and planned WhatsApp group identity.
4. Employer selects a work template based on the service/package being delivered.
5. Template tasks appear as sticky task cards.
6. Employer opens a task, assigns it to a team member, sets deadline/priority/details, and sends it to the employee board.
7. [x] Employee sees a separate workspace file with three simple task states: Assigned, In Progress, Completed.
8. [x] Employee can drag tasks between states, including moving a mistakenly completed task back to In Progress.
9. Daily employer-to-employee task messages are generated from task state.
10. Daily client-group update messages are generated with completed work, remaining work, assignees, and status.
11. Reports, calendar, approvals, notifications, and knowledge base connect to the same client/project/task data.

## Client Onboarding Data

Client profile should support:

- [x] Company/client name
- [x] Contact person
- [x] Contact email
- [x] Contact phone
- [x] Website link
- [x] Short description
- [x] Long description
- [x] Keywords
- [x] Social/profile links: Instagram, Facebook, X, YouTube, LinkedIn, website, other profiles
- [x] Google Maps links
- [x] Timings/business hours
- [x] Emails and passwords/credentials placeholder
- [x] Custom employer-defined fields
- [x] Searchable custom fields
- [x] Planned WhatsApp client group identity
- [ ] Secure encrypted credential storage
- [ ] Real WhatsApp community/group creation

## Positioning

Project management built for agencies.

OperionOS should feel simpler than ClickUp, more agency-focused than Trello, less heavy than Plane, and more polished than a generic internal dashboard.

## Product Differentiator

The strongest differentiator will be UI and UX.

OperionOS should feel:

- Fast
- Premium
- Minimal
- Visual
- Agency-first
- Easy for non-technical team members
- Useful without needing heavy setup
- Beautiful enough to feel like a modern product, not an admin panel

## UI / UX Reference Analysis

### Supplied OperionOS Design Folder

Source reviewed:

- [x] `D:\Codex\2026-08-03\files-mentioned-by-the-user-you\OperionOS Design`
- [x] Framer/HTTrack mirror structure inspected
- [x] Gradient and abstract visual assets identified
- [x] Local landing assets copied into `public/design`
- [x] Customer-first landing screen adapted to the supplied design direction

Implementation notes:

- The first screen now behaves like a customer website for the agency owner, not just an internal dashboard.
- The hero follows the supplied clean white Trillo/Framer landing flow: centered navigation, large centered headline, pill CTAs, trust chips, product-preview band, and a separate signup/signin conversion block.
- The auth UI keeps OperionOS logic: direct signup creates the agency owner workspace, while invite-link signup joins the existing agency as a team member without exposing employer/employee role buttons.
- The owner onboarding journey is explicit: create account, onboard clients, assign template work.
- The internal workspace remains accessible after signup/setup and still contains clients, tasks, Kanban, calendar, templates, reports, and WhatsApp message previews.

### Reference 1: Dark Timeline / Gantt UI

Key ideas to use:

- Dark immersive workspace
- Left vertical icon navigation
- Project timeline as a major view
- Color-coded task bars
- Avatar chips inside tasks
- Floating quick-add button
- Timeline zoom and detailed view toggle
- Strong sense of movement and scheduling

Potential OperionOS usage:

- Timeline view for agency campaigns
- Project delivery roadmap
- Retainer planning
- Team workload over time

### Reference 2: Sketch-to-Product Timeline Concept

Key ideas to use:

- Transformation from planning/sketch into actual execution UI
- Rounded timeline pills
- Drag handles
- Avatar identity
- Connected task flow
- Energetic purple/blue visual language

Potential OperionOS usage:

- Smooth task planning experience
- Drag-and-drop timeline
- Task dependency visualization
- Premium onboarding/demo animation later

### Reference 3: Dark Analytics Dashboard

Key ideas to use:

- Very bold dark UI
- Rounded black cards
- Neon lime/orange status colors
- Compact visual widgets
- Timeline activity panel
- Pills, filters, and profile controls
- Strong product personality

Potential OperionOS usage:

- Agency owner dashboard
- Client performance overview
- Project health dashboard
- Team workload and monitoring

### Reference 4: Light Agency Dashboard

Key ideas to use:

- Clean sidebar navigation
- White/green premium cards
- Large metric tiles
- Add project and import actions
- Project analytics
- Reminders
- Team collaboration list
- Project progress ring
- Time tracker card

Potential OperionOS usage:

- Main dashboard layout
- Light mode inspiration
- Agency management homepage
- Team and project summaries

## Design Direction

- [ ] Decide final visual theme: dark-first, light-first, or dual theme
- [ ] Define design tokens
- [x] Define sidebar structure
- [x] Define dashboard card style
- [ ] Define timeline card style
- [x] Define kanban board style
- [ ] Define task drawer/modal style
- [ ] Define table/list style
- [ ] Define empty states
- [x] Define first responsive behavior

Preferred current direction:

Dark-first premium agency dashboard with optional light mode later.

## Full Feature Ambition

- [ ] Workspaces
- [x] Clients
- [ ] Spaces / folders / lists equivalent
- [ ] Projects
- [x] Tasks
- [ ] Subtasks
- [x] Kanban board
- [ ] List view
- [x] Calendar view
- [ ] Table view
- [ ] Timeline / Gantt view
- [x] Assignees
- [x] Due dates
- [x] Priorities
- [x] Statuses
- [ ] Tags
- [x] Custom fields
- [ ] Checklists
- [x] Comments
- [ ] Attachments
- [ ] Mentions
- [x] Notifications
- [ ] Recurring tasks
- [x] Templates
- [x] Docs / knowledge base
- [x] Forms / intake
- [x] Dashboards
- [ ] Time tracking
- [ ] Goals / OKRs
- [x] Automations
- [x] Approvals
- [ ] Client portal
- [x] Employer / employee role-separated workspace shell
- [x] Role-based login routing: employer login opens owner workspace, employee login opens employee workspace
- [x] Reporting
- [ ] Integrations
- [ ] AI summaries later

## First Build Scope

Yash wants the product to be designed with the full feature ambition from the start, not treated as a tiny MVP.

Initial implementation should still be built in clean foundations so features can grow without rewrites.

First build should include:

- [x] Authentication UI
- [x] Firebase Auth client integration
- [x] Email/password signup and signin
- [x] Google sign-in UI and client adapter
- [x] Password reset UI and client adapter
- [x] Email verification gate
- [ ] Personalized OTP email verification backend
- [ ] Authenticator app MFA backend
- [x] Workspace setup
- [x] Client management
- [ ] Project management
- [x] Task management
- [ ] Subtasks
- [x] Kanban view
- [ ] List view
- [x] Assignees
- [x] Due dates
- [x] Priority
- [x] Status
- [x] Comments
- [ ] Attachments
- [x] Templates
- [x] Simple dashboard
- [x] Client approval status
- [x] Basic team roles
- [x] Client onboarding form modal instead of always-visible intake form
- [x] Redesigned weekly calendar board
- [x] Separate role workspace files: `src/workspaces/EmployerWorkspace.tsx` and `src/workspaces/EmployeeWorkspace.tsx`

## Core Data Model Draft

- Workspace
- User
- Team member
- Client
- Project
- Space
- Folder
- List
- Task
- Subtask
- Comment
- Attachment
- Tag
- Status
- Priority
- Custom field
- Template
- Approval
- Notification
- Document
- Dashboard widget
- Time entry
- Goal
- Automation rule

## Suggested Main Navigation

- Dashboard
- Clients
- Projects
- Tasks
- Calendar
- Timeline
- Docs
- Templates
- Reports
- Team
- Settings

## Client Workspace Concept

Each client should have:

- Client profile
- Contact details
- Active projects
- Tasks
- Files
- Notes
- Approvals
- Reports
- Timeline
- Internal comments

## Project Concept

Each project should have:

- Overview
- Board
- List
- Calendar
- Timeline
- Files
- Docs
- Team
- Activity
- Reports

## Task Concept

Each task should have:

- Title
- Description
- Status
- Priority
- Assignee
- Due date
- Client
- Project
- Tags
- Subtasks
- Checklist
- Attachments
- Comments
- Approval state
- Time tracking
- Activity log

## Approval Workflow

- [ ] Draft
- [ ] Internal review
- [ ] Sent for approval
- [ ] Changes requested
- [ ] Approved
- [ ] Completed

## Template Ideas

- [ ] Client onboarding
- [ ] Website project
- [ ] Branding project
- [ ] Social media campaign
- [ ] SEO campaign
- [ ] Ads campaign
- [ ] Content calendar
- [ ] Monthly retainer
- [ ] Design sprint
- [ ] Reporting cycle

## Future AI Features

AI should be added later after the product foundation is stable.

Potential AI features:

- [ ] Summarize project status
- [ ] Generate tasks from brief
- [ ] Generate client update
- [ ] Summarize comments
- [ ] Detect overdue risks
- [ ] Suggest next actions
- [ ] Search client docs conversationally

## Technical Direction To Decide

- [ ] Frontend framework
- [ ] Backend framework
- [ ] Database
- [ ] Auth provider
- [ ] File storage
- [ ] Hosting
- [ ] Realtime requirements
- [ ] Notification system
- [ ] Deployment strategy

## Open Questions

- [ ] Should OperionOS start as SaaS or internal tool?
- [ ] Should clients get portal access in v1?
- [ ] Should dark mode be the default?
- [ ] Should timeline/Gantt be in first build?
- [ ] Should docs/knowledge base be native or simple notes first?
- [ ] Should we support multiple agencies from the beginning?
- [ ] Should billing/subscriptions be planned now or later?

## Completed

- [x] Created project folder
- [x] Renamed folder from `OperoOS.io` to `OperionOS.io`
- [x] Deleted old SEO agency Plane planning file
- [x] Defined product as general agency project management OS
- [x] Confirmed UI/UX will be the main differentiator
- [x] Captured full feature ambition
- [x] Captured first build scope
- [x] Captured UI reference analysis
- [x] Created React + Vite + TypeScript foundation
- [x] Added customer-first public landing screen
- [x] Copied selected visual assets from `OperionOS Design`
- [x] Adapted the landing/auth screen to the supplied customer-facing design direction
- [x] Added local sign up and sign in flow
- [x] Removed public employer/employee role selector from auth
- [x] Added prototype team invite records with accept/decline links
- [x] Blocked invited emails from creating a separate owner workspace through direct signup
- [x] Added agency setup flow
- [x] Added agency profile persistence
- [x] Added Material 3-inspired raised and soft buttons
- [x] Integrated supplied `logo.png` across app branding, auth surfaces, setup, verification, and favicon
- [x] Rebuilt the public landing as native OperionOS UI inspired by the reference design, without embedding/copying the external template site
- [x] Centered login/signup modal, removed unsupported SSO and close controls, and clarified Firebase verification-link behavior while keeping code-style verification UI ready
- [x] Added premium dark-first dashboard UI
- [x] Added client onboarding form
- [x] Added profile/social/maps/timing/credential/custom-field capture
- [x] Added searchable custom fields
- [x] Added work templates with sticky task cards
- [x] Added employer task assignment flow
- [x] Added employee kanban board with drag-and-drop status movement
- [x] Added calendar task list
- [x] Added knowledge base/RAG planning panel
- [x] Added WhatsApp automation preview messages
- [x] Added basic reports and role-access panel
- [x] Verified production build with `npm.cmd run build`
- [x] Restored Vite `index.html` after accidental HTTrack mirror content was found

## Next Action

- [x] Choose initial frontend stack
- [x] Create initial architecture
- [x] Design first dashboard wireframe in code
- [x] Design navigation system in code
- [x] Start implementation
- [ ] Start local dev server and visually review
- [ ] Add persistent backend/database
- [ ] Replace local prototype auth with backend authentication
- [ ] Add full role-based access
- [ ] Add projects as first-class objects
- [ ] Add real invite email delivery and server-side invite storage
- [ ] Add real notification engine
- [ ] Add WhatsApp Business API integration plan
- [ ] Add secure credential vault
