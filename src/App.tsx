import {
  Archive,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Columns3,
  Eye,
  EyeOff,
  FileText,
  LogIn,
  LogOut,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  MailCheck,
  MessageCircle,
  PartyPopper,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Upload,
  Users,
  Workflow,
} from "lucide-react";
import { type CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { IconButton, MetricCard } from "./components/workspace";
import {
  hasFirebaseConfig,
  refreshCurrentUser,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebase,
  signUpWithEmail,
  watchAuth,
} from "./services/firebaseAuth";
import {
  createRemoteWorkspace,
  getRemoteUserProfile,
  getRemoteWorkspace,
  hasFirestore,
  saveRemoteUserProfile,
  saveRemoteWorkspacePatch,
} from "./services/firestoreData";
import { requestEmailOtp, verifyEmailOtp } from "./services/otpAuth";
import type { UserRole } from "./types";
import { TrustOrbit } from "./website/TrustOrbit";
import { EmployeeWorkspace } from "./workspaces/EmployeeWorkspace";
import { EmployerWorkspace } from "./workspaces/EmployerWorkspace";

type TaskStatus = "assigned" | "in-progress" | "completed";
type Priority = "low" | "medium" | "high" | "urgent";

type Client = {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  shortDescription: string;
  longDescription: string;
  keywords: string[];
  profileLinks: { label: string; url: string }[];
  mapLinks: string[];
  timings: string[];
  credentials: { label: string; username: string; password: string }[];
  customFields: { label: string; value: string }[];
  whatsappGroup: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: "Employer" | "Manager" | "Employee" | "Client Viewer";
  email: string;
  avatar: string;
};

type TeamInvite = {
  id: string;
  email: string;
  name: string;
  role: "Manager" | "Employee" | "Client Viewer";
  agencyName: string;
  workspaceId?: string;
  token?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
};

type TemplateTask = {
  id: string;
  title: string;
  description: string;
  suggestedDays: number;
  checklist: string[];
};

type WorkTemplate = {
  id: string;
  name: string;
  category: string;
  color: string;
  tasks: TemplateTask[];
};

type Task = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  approval: "not-needed" | "internal-review" | "sent-to-client" | "approved" | "changes-requested";
  checklist: { title: string; done: boolean }[];
  comments: string[];
};

type KnowledgeItem = {
  id: string;
  clientId: string;
  type: "PDF" | "Doc" | "Transcript" | "URL";
  title: string;
  source: string;
};

type AuthAccount = {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
  inviteId?: string;
  agencyName?: string;
  emailVerified?: boolean;
  provider?: "email" | "google" | "local";
};

type AgencyProfile = {
  name: string;
  agencyType: string;
  size: string;
  description: string;
  primaryServices: string[];
  defaultWorkflow: string;
  firstGoal: string;
};

const AUTH_ACCOUNT_KEY = "operion-auth-account";
const AUTH_PROFILES_KEY = "operion-auth-profiles";
const AUTH_ROLES_KEY = "operion-auth-roles";
const AUTH_OTP_VERIFIED_KEY = "operion-auth-otp-verified";
const inMemoryStorage = new Map<string, unknown>();
const celebratedIds = new Set<string>();

const uid = () => Math.random().toString(36).slice(2, 10);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const team: TeamMember[] = [
  { id: "tm-1", name: "Yash Jangid", role: "Employer", email: "yash@agency.com", avatar: "YJ" },
  { id: "tm-2", name: "Ananya Sharma", role: "Manager", email: "ananya@agency.com", avatar: "AS" },
  { id: "tm-3", name: "Rohan Mehta", role: "Employee", email: "rohan@agency.com", avatar: "RM" },
  { id: "tm-4", name: "Priya Nair", role: "Employee", email: "priya@agency.com", avatar: "PN" },
];

const templates: WorkTemplate[] = [
  {
    id: "tpl-onboarding",
    name: "Client Onboarding",
    category: "Operations",
    color: "#9b7cff",
    tasks: [
      {
        id: "on-1",
        title: "Collect access and profile links",
        description: "Verify website, social profiles, maps links, login details, and basic client data.",
        suggestedDays: 1,
        checklist: ["Confirm website URL", "Collect socials", "Collect maps links", "Store credentials safely"],
      },
      {
        id: "on-2",
        title: "Create client workspace",
        description: "Create the client's project space, WhatsApp group, folder structure, and initial dashboard.",
        suggestedDays: 2,
        checklist: ["Create project", "Create WhatsApp group", "Invite team", "Add default docs"],
      },
      {
        id: "on-3",
        title: "Prepare first status report",
        description: "Create a simple launch report showing what is collected, missing, assigned, and pending.",
        suggestedDays: 3,
        checklist: ["Summarize details", "List pending items", "Share with manager"],
      },
    ],
  },
  {
    id: "tpl-marketing",
    name: "Marketing Retainer",
    category: "Recurring",
    color: "#00d4ff",
    tasks: [
      {
        id: "mk-1",
        title: "Build monthly campaign calendar",
        description: "Plan this month's deliverables, owner, approvals, and publishing windows.",
        suggestedDays: 2,
        checklist: ["Plan campaign themes", "Create publishing dates", "Assign owners"],
      },
      {
        id: "mk-2",
        title: "Prepare content and creative briefs",
        description: "Create briefs and requirements for the team from client data and current priorities.",
        suggestedDays: 4,
        checklist: ["Create brief", "Attach references", "Send for internal review"],
      },
      {
        id: "mk-3",
        title: "Send weekly client update",
        description: "Send a structured client-facing update with completed, active, and pending tasks.",
        suggestedDays: 7,
        checklist: ["Collect task states", "Write update", "Share to client group"],
      },
    ],
  },
  {
    id: "tpl-build",
    name: "Website / Cloud Build",
    category: "Delivery",
    color: "#a4ff4f",
    tasks: [
      {
        id: "bd-1",
        title: "Prepare build checklist",
        description: "Create implementation checklist, URLs, passwords, reference assets, and delivery milestones.",
        suggestedDays: 1,
        checklist: ["Review client brief", "Add required links", "Define milestones"],
      },
      {
        id: "bd-2",
        title: "Execute build tasks",
        description: "Assign build cards to the responsible team and track progress through the employee board.",
        suggestedDays: 5,
        checklist: ["Assign pages", "Review output", "Move approved cards"],
      },
      {
        id: "bd-3",
        title: "Final approval and handoff",
        description: "Run QA, prepare handoff notes, and request employer/client approval.",
        suggestedDays: 8,
        checklist: ["QA checklist", "Prepare report", "Send for approval"],
      },
    ],
  },
];

const initialClient: Client = {
  id: "cl-premier",
  company: "Premier Portable Potties",
  contactName: "Operations Lead",
  email: "hello@premier.example",
  phone: "+1 555 0198",
  website: "https://www.premier.boston/",
  shortDescription: "Portable restroom rental provider with city-specific service pages and local profiles.",
  longDescription:
    "Premier Portable Potties needs recurring operational tasks around profile management, listing updates, content execution, local visibility, task assignment, and reporting across multiple local service locations.",
  keywords: ["portable potty rental", "porta potty rental boston", "temporary restroom rental"],
  profileLinks: [
    { label: "Website", url: "https://www.premier.boston/" },
    { label: "Service page", url: "https://www.premier.boston/porta-potty-rental-boston/" },
    { label: "Facebook", url: "https://www.facebook.com/premierpotties/" },
    { label: "Instagram", url: "https://www.instagram.com/premierpottiesinc/" },
    { label: "X", url: "https://x.com/premierpotties" },
  ],
  mapLinks: [
    "https://maps.app.goo.gl/LIMtXJCERYYRFC4R9",
    "https://www.google.com/maps?cid=10417327836509592887",
  ],
  timings: ["Monday - Friday = 8 am-5 pm", "Saturday - 8 am-1:30 pm", "Sunday - Closed"],
  credentials: [{ label: "Website CMS", username: "client-admin", password: "stored-securely-later" }],
  customFields: [{ label: "Primary city", value: "Boston" }],
  whatsappGroup: "Premier Portable Potties - Client Group",
};

const initialTasks: Task[] = [
  {
    id: "task-1",
    clientId: initialClient.id,
    title: "Collect access and profile links",
    description: "Verify every profile and maps link before assigning work.",
    assigneeId: "tm-3",
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    priority: "high",
    status: "assigned",
    approval: "not-needed",
    checklist: [
      { title: "Website checked", done: true },
      { title: "Maps links checked", done: false },
      { title: "Social profiles checked", done: false },
    ],
    comments: ["Imported from onboarding sample."],
  },
  {
    id: "task-2",
    clientId: initialClient.id,
    title: "Create WhatsApp daily update format",
    description: "Prepare employer and client group message structure.",
    assigneeId: "tm-2",
    dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
    priority: "medium",
    status: "in-progress",
    approval: "internal-review",
    checklist: [
      { title: "Employee digest", done: true },
      { title: "Client group digest", done: false },
    ],
    comments: ["Needs final wording approval."],
  },
  {
    id: "task-3",
    clientId: initialClient.id,
    title: "Prepare first status report",
    description: "Summarize completed, remaining, and blocked tasks for the client group.",
    assigneeId: "tm-4",
    dueDate: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
    priority: "urgent",
    status: "completed",
    approval: "approved",
    checklist: [
      { title: "Completed list", done: true },
      { title: "Remaining list", done: true },
    ],
    comments: ["Ready to share."],
  },
];

const initialKnowledge: KnowledgeItem[] = [
  {
    id: "kb-1",
    clientId: initialClient.id,
    type: "URL",
    title: "Primary website",
    source: initialClient.website,
  },
  {
    id: "kb-2",
    clientId: initialClient.id,
    type: "Doc",
    title: "Client onboarding brief",
    source: "Internal notes",
  },
];

const defaultAgencyProfile: AgencyProfile = {
  name: "OperionOS Agency",
  agencyType: "Agency",
  size: "Team workspace",
  description:
    "A focused agency operating system for client onboarding, assigned work, approvals, reports, and daily delivery.",
  primaryServices: ["Client onboarding", "Project delivery", "Reporting"],
  defaultWorkflow: "Client onboarding",
  firstGoal: "Organize client delivery",
};

function App() {
  const [routePath, setRoutePath] = useState(() => window.location.pathname);
  const invitationFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("invite") ?? "";
    const action = params.get("action") ?? "accept";
    const workspaceId = params.get("workspace") ?? "";
    const token = params.get("token") ?? "";
    return inviteId ? { inviteId, action, workspaceId, token } : null;
  }, []);
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(() => {
    const saved = load<AuthAccount | null>(AUTH_ACCOUNT_KEY, null);
    if (!saved) return null;
    return { ...saved, role: saved.role === "employee" ? "employee" : "employer", provider: saved.provider ?? "local" };
  });
  const [authReady, setAuthReady] = useState(!hasFirebaseConfig);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile | null>(() => load("operion-agency-profile", null));
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>(() => load("operion-clients", [initialClient]));
  const [tasks, setTasks] = useState<Task[]>(() => load("operion-tasks", initialTasks));
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(() => load("operion-knowledge", initialKnowledge));
  const [activeClientId, setActiveClientId] = useState(clients[0]?.id ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [selectedTemplateTaskId, setSelectedTemplateTaskId] = useState(templates[0].tasks[0].id);
  const [assigneeId, setAssigneeId] = useState(team[2].id);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority>("high");
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>(() => load("operion-team-invites", []));
  const [remoteInvite, setRemoteInvite] = useState<TeamInvite | undefined>();
  const [inviteLookupComplete, setInviteLookupComplete] = useState(!invitationFromUrl?.workspaceId);
  const workspaceRole = authAccount?.role ?? "employer";
  const isWorkspaceRoute = routePath.startsWith("/app");
  const activeInvite = invitationFromUrl
    ? remoteInvite ??
      teamInvites.find((invite) => invite.id === invitationFromUrl.inviteId && invite.status === "pending")
    : undefined;
  const invalidInvite = Boolean(
    invitationFromUrl && invitationFromUrl.action !== "decline" && inviteLookupComplete && !activeInvite,
  );

  const activeClient = clients.find((client) => client.id === activeClientId) ?? clients[0];
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  const selectedTemplateTask =
    selectedTemplate.tasks.find((task) => task.id === selectedTemplateTaskId) ?? selectedTemplate.tasks[0];

  const navigateTo = (nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setRoutePath(nextPath);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const handlePopState = () => setRoutePath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig) return undefined;
    return watchAuth((user) => {
      if (!user) {
        setAuthAccount(null);
        setAuthReady(true);
        return;
      }
      const localAccount = saveAuthAccount(buildFirebaseAccount(user, getAuthProfile(user.email ?? "")));
      setAuthAccount((current) => (current?.id === user.uid ? current : localAccount));
      setAuthReady(true);
      void getRemoteUserProfile<AuthAccount>(localAccount.email)
        .then((remoteProfile) => {
          const account = saveAuthAccount({ ...localAccount, ...remoteProfile });
          setAuthAccount(account);
          if (account.workspaceId) {
            void hydrateWorkspaceSafely(account.workspaceId);
          }
          maybeCelebrate(user.uid);
        })
        .catch(() => {
          maybeCelebrate(user.uid);
      });
    });
  }, []);

  useEffect(() => {
    if (!authReady || !authAccount || isWorkspaceRoute) return;
    navigateTo("/app");
  }, [authAccount, authReady, isWorkspaceRoute]);

  useEffect(() => {
    if (!invitationFromUrl?.workspaceId) return;
    let cancelled = false;
    setInviteLookupComplete(false);
    void getRemoteWorkspace<{ teamInvites?: TeamInvite[]; agencyProfile?: AgencyProfile; clients?: Client[]; tasks?: Task[]; knowledge?: KnowledgeItem[] }>(
      invitationFromUrl.workspaceId,
    )
      .then((workspace) => {
        if (cancelled) return;
        if (!workspace) {
          setRemoteInvite(undefined);
          return;
        }
        hydrateWorkspaceFromData(workspace);
        const invite = workspace.teamInvites?.find(
          (item) =>
            item.id === invitationFromUrl.inviteId &&
            item.status === "pending" &&
            (!item.token || item.token === invitationFromUrl.token),
        );
        setRemoteInvite(invite);
      })
      .catch((error) => setAuthError(getErrorMessage(error)))
      .finally(() => {
        if (!cancelled) setInviteLookupComplete(true);
      });
    return () => {
      cancelled = true;
    };
  }, [invitationFromUrl]);

  useEffect(() => {
    if (!showConfetti) return undefined;
    const timer = window.setTimeout(() => setShowConfetti(false), 3600);
    return () => window.clearTimeout(timer);
  }, [showConfetti]);

  useEffect(() => {
    if (!invitationFromUrl || invitationFromUrl.action !== "decline") return;
    const invite = teamInvites.find(
      (item) => item.id === invitationFromUrl.inviteId && item.status === "pending",
    );
    if (!invite) return;
    persistTeamInvites(
      teamInvites.map((item) =>
        item.id === invite.id ? { ...item, status: "declined" as const } : item,
      ),
    );
    setAuthNotice("Invite declined. You can close this tab or ask the agency owner for a new invite.");
    window.history.replaceState(null, "", window.location.pathname);
  }, [invitationFromUrl, teamInvites]);

  const filteredCustomFields = activeClient?.customFields.filter((field) =>
    `${field.label} ${field.value}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const metrics = useMemo(() => {
    const assigned = tasks.filter((task) => task.status === "assigned").length;
    const progress = tasks.filter((task) => task.status === "in-progress").length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const urgent = tasks.filter((task) => task.priority === "urgent" || task.priority === "high").length;
    return { assigned, progress, completed, urgent };
  }, [tasks]);

  const teamRoster = useMemo<TeamMember[]>(() => {
    const acceptedMembers = teamInvites
      .filter((invite) => invite.status === "accepted")
      .map((invite) => {
        const initials =
          invite.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "TM";
        return {
          id: `invite-${invite.id}`,
          name: invite.name,
          role: invite.role,
          email: invite.email,
          avatar: initials,
        } satisfies TeamMember;
      });
    const existingEmails = new Set(team.map((member) => member.email.toLowerCase()));
    return [...team, ...acceptedMembers.filter((member) => !existingEmails.has(member.email.toLowerCase()))];
  }, [teamInvites]);

  const matchedTeamMember = teamRoster.find(
    (member) => member.email.toLowerCase() === authAccount?.email.toLowerCase(),
  );
  const currentEmployee = matchedTeamMember ?? teamRoster.find((member) => member.role === "Employee") ?? teamRoster[0];
  const employeeTasks = tasks.filter((task) => task.assigneeId === currentEmployee.id);
  const visibleKanbanTasks = workspaceRole === "employee" ? employeeTasks : tasks;
  const calendarSourceTasks = workspaceRole === "employee" ? employeeTasks : tasks;
  const calendarDays = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return {
        iso,
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        tasks: calendarSourceTasks.filter((task) => task.dueDate === iso),
      };
    });
  }, [calendarSourceTasks]);

  const persistClients = (next: Client[]) => {
    setClients(next);
    save("operion-clients", next);
  };

  const persistTasks = (next: Task[]) => {
    setTasks(next);
    save("operion-tasks", next);
  };

  const persistKnowledge = (next: KnowledgeItem[]) => {
    setKnowledge(next);
    save("operion-knowledge", next);
  };

  const persistTeamInvites = (next: TeamInvite[]) => {
    setTeamInvites(next);
    save("operion-team-invites", next);
    syncWorkspacePatch({ teamInvites: next });
  };

  const syncWorkspacePatch = (patch: Record<string, unknown>) => {
    if (!authAccount?.workspaceId || !hasFirestore) return;
    void saveRemoteWorkspacePatch(authAccount.workspaceId, patch).catch((error) => {
      console.warn("OperionOS Firestore sync failed", error);
    });
  };

  const hydrateWorkspaceFromData = (workspace: {
    agencyProfile?: AgencyProfile;
    clients?: Client[];
    tasks?: Task[];
    knowledge?: KnowledgeItem[];
    teamInvites?: TeamInvite[];
  }) => {
    if (workspace.agencyProfile) {
      setAgencyProfile(workspace.agencyProfile);
      save("operion-agency-profile", workspace.agencyProfile);
    }
    if (workspace.clients?.length) {
      setClients(workspace.clients);
      save("operion-clients", workspace.clients);
      setActiveClientId(workspace.clients[0].id);
    }
    if (workspace.tasks?.length) {
      setTasks(workspace.tasks);
      save("operion-tasks", workspace.tasks);
    }
    if (workspace.knowledge?.length) {
      setKnowledge(workspace.knowledge);
      save("operion-knowledge", workspace.knowledge);
    }
    if (workspace.teamInvites) {
      setTeamInvites(workspace.teamInvites);
      save("operion-team-invites", workspace.teamInvites);
    }
  };

  const hydrateWorkspace = async (workspaceId: string) => {
    const workspace = await getRemoteWorkspace<{
      agencyProfile?: AgencyProfile;
      clients?: Client[];
      tasks?: Task[];
      knowledge?: KnowledgeItem[];
      teamInvites?: TeamInvite[];
    }>(workspaceId);
    if (workspace) hydrateWorkspaceFromData(workspace);
  };

  const getUserProfileSafely = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const localProfile = getAuthProfile(normalizedEmail);
    try {
      const remoteProfile = await Promise.race([
        getRemoteUserProfile<AuthAccount>(normalizedEmail),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
      ]);
      return remoteProfile ?? localProfile;
    } catch (error) {
      console.warn("Could not load remote user profile. Continuing with local auth profile.", error);
      return localProfile;
    }
  };

  const saveUserProfileSafely = async (account: AuthAccount) => {
    try {
      await saveRemoteUserProfile(account);
    } catch (error) {
      console.warn("Could not sync remote user profile. Login will continue locally.", error);
    }
  };

  const hydrateWorkspaceSafely = async (workspaceId?: string) => {
    if (!workspaceId) return;
    try {
      await hydrateWorkspace(workspaceId);
    } catch (error) {
      console.warn("Could not hydrate remote workspace. Continuing with local workspace data.", error);
    }
  };

  const rememberRole = (email: string, role: UserRole) => {
    const normalizedEmail = normalizeEmail(email);
    const roleMap = load<Record<string, UserRole>>(AUTH_ROLES_KEY, {});
    save(AUTH_ROLES_KEY, { ...roleMap, [normalizedEmail]: role });
  };

  const acceptInviteForEmail = async (invite: TeamInvite, email: string) => {
    const normalizedEmail = normalizeEmail(email);
    const currentInvites = invite.workspaceId === authAccount?.workspaceId ? teamInvites : [invite, ...teamInvites];
    const nextInvites = currentInvites.map((item) =>
      item.id === invite.id
        ? { ...item, email: normalizedEmail, status: "accepted" as const, acceptedAt: new Date().toISOString() }
        : item,
    );
    persistTeamInvites(nextInvites);
    if (invite.workspaceId && hasFirestore) {
      try {
        await saveRemoteWorkspacePatch(invite.workspaceId, { teamInvites: nextInvites });
        await saveRemoteUserProfile({
          email: normalizedEmail,
          name: invite.name || normalizedEmail.split("@")[0],
          role: "employee",
          workspaceId: invite.workspaceId,
          inviteId: invite.id,
          agencyName: invite.agencyName,
        });
      } catch (error) {
        console.warn("Could not sync invite acceptance to Firestore. Continuing locally.", error);
      }
    }
    rememberRole(normalizedEmail, "employee");
  };

  const addTeamInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("inviteEmail") || "").trim().toLowerCase();
    const name = String(form.get("inviteName") || email.split("@")[0] || "Team member").trim();
    const role = String(form.get("inviteRole") || "Employee") as TeamInvite["role"];
    if (!email) return;
    if (!authAccount?.workspaceId) {
      setAuthError("Create the agency workspace before inviting team members.");
      return;
    }
    const invite: TeamInvite = {
      id: uid(),
      email,
      name,
      role,
      agencyName: agencyProfile?.name || "OperionOS Agency",
      workspaceId: authAccount.workspaceId,
      token: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const nextInvites = [invite, ...teamInvites];
    persistTeamInvites(nextInvites);
    if (hasFirestore) {
      try {
        await saveRemoteWorkspacePatch(authAccount.workspaceId, { teamInvites: nextInvites });
        await sendTeamInviteEmail(invite);
        setAuthNotice(`Invite sent to ${email}.`);
      } catch (error) {
        setAuthError(getErrorMessage(error));
      }
    }
    event.currentTarget.reset();
  };

  const declineActiveInvite = async () => {
    if (!activeInvite) return;
    const nextInvites = teamInvites.map((invite) =>
      invite.id === activeInvite.id
        ? { ...invite, status: "declined" as const, declinedAt: new Date().toISOString() }
        : invite,
    );
    persistTeamInvites(nextInvites);
    if (activeInvite.workspaceId && hasFirestore) {
      await saveRemoteWorkspacePatch(activeInvite.workspaceId, { teamInvites: nextInvites });
    }
    setAuthNotice("Invite declined. You can close this tab or ask the agency owner for a new invite.");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const maybeCelebrate = (id: string) => {
    const key = `operion-confetti-${id}`;
    if (celebratedIds.has(key)) return;
    celebratedIds.add(key);
    setShowConfetti(true);
  };

  const sendOtpAfterAuth = (email: string, name: string, mode: "signup" | "signin" | "resend") => {
    setAuthNotice("Opening verification. Sending OTP email...");
    void requestEmailOtp(email, name, mode)
      .then(() => {
        setAuthError("");
        setAuthNotice("OTP sent. Check your inbox and enter the code here.");
      })
      .catch((error) => {
        console.warn("OTP email could not be sent after authentication.", error);
        setAuthError("");
        setAuthNotice(`Signed in. OTP email could not be sent yet: ${getErrorMessage(error)}`);
      });
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");
    setOtpCode("");
    setIsAuthSubmitting(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const normalizedEmail = normalizeEmail(email);

    try {
      const storedProfile = getAuthProfile(normalizedEmail);
      const roleMap = load<Record<string, UserRole>>(AUTH_ROLES_KEY, {});
      const invitedAccount = teamInvites.find(
        (invite) => normalizeEmail(invite.email) === normalizedEmail && invite.status !== "declined",
      );
      const isInviteSignup = Boolean(activeInvite);
      const accountRole: UserRole =
        isInviteSignup || storedProfile?.role === "employee" || roleMap[normalizedEmail] === "employee" || invitedAccount?.status === "accepted"
          ? "employee"
          : "employer";
      const fallbackName = activeInvite?.name ?? (accountRole === "employee" ? currentEmployee.name : "Agency Owner");
      const name = String(form.get("name") || fallbackName).trim();
      if (!email || !password || (authMode === "signup" && !name)) {
        setAuthError("Please complete every required field.");
        return;
      }
      if (invalidInvite) {
        setAuthError("This invite link is not valid anymore. Ask the agency owner for a fresh invite.");
        return;
      }
      if (activeInvite && normalizeEmail(activeInvite.email) !== normalizedEmail) {
        setAuthError(`This invite was sent to ${activeInvite.email}. Sign up with that email or ask for a new invite.`);
        return;
      }
      if (authMode === "signup" && invitedAccount && !isInviteSignup) {
        setAuthError(
          "This email belongs to a team invite. Open the invite email/link to join the agency instead of creating a new owner workspace.",
        );
        return;
      }
      if (authMode === "signup" && storedProfile?.role === "employee" && !isInviteSignup) {
        setAuthError("This email is already a team member account. Sign in to open the agency workspace.");
        return;
      }
      if (authMode === "signup" && password.length < 8) {
        setAuthError("Password must be at least 8 characters long.");
        return;
      }

      rememberRole(normalizedEmail, accountRole);
      if (hasFirebaseConfig) {
        const user =
          authMode === "signup"
            ? await signUpWithEmail(name, email, password)
            : await signInWithEmail(email, password);
        if (activeInvite) {
          await acceptInviteForEmail(activeInvite, user.email ?? normalizedEmail);
        }
        const previousProfile = getAuthProfile(user.email ?? normalizedEmail);
        const verifiedByOtp = isOtpVerified(user.email ?? normalizedEmail);
        const account = saveAuthAccount({
          ...previousProfile,
          id: user.uid,
          name: user.displayName || previousProfile?.name || name,
          email: user.email ?? normalizedEmail,
          role: accountRole,
          workspaceId: activeInvite?.workspaceId ?? previousProfile?.workspaceId ?? storedProfile?.workspaceId,
          inviteId: activeInvite?.id ?? previousProfile?.inviteId,
          agencyName: activeInvite?.agencyName ?? previousProfile?.agencyName,
          emailVerified: user.emailVerified || verifiedByOtp,
          provider: "email",
        });
        setAuthAccount(account);
        maybeCelebrate(user.uid);
        navigateTo("/app");
        void saveUserProfileSafely(account);
        void hydrateWorkspaceSafely(account.workspaceId);
        setAuthNotice("");
        return;
      }

      const account: AuthAccount = {
        id: `local-${email}`,
        name: authMode === "signup" ? name : storedProfile?.name ?? fallbackName,
        email: normalizedEmail,
        role: accountRole,
        inviteId: activeInvite?.id ?? storedProfile?.inviteId,
        agencyName: activeInvite?.agencyName ?? storedProfile?.agencyName,
        emailVerified: isOtpVerified(normalizedEmail),
        provider: "local",
      };
      if (activeInvite) {
        await acceptInviteForEmail(activeInvite, normalizedEmail);
      }
      setAuthAccount(saveAuthAccount(account));
      maybeCelebrate(account.id ?? email);
      navigateTo("/app");
      setAuthNotice("");
    } catch (error) {
      console.error("Authentication failed", error);
      setAuthError(getErrorMessage(error));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    setAuthNotice("");
    if (!hasFirebaseConfig) {
      setAuthError("Firebase environment variables are not configured yet, so Google sign-in cannot start.");
      return;
    }
    if (invalidInvite) {
      setAuthError("This invite link is not valid anymore. Ask the agency owner for a fresh invite.");
      return;
    }
    setIsAuthSubmitting(true);
    try {
      const user = await signInWithGoogle();
      const email = user.email ?? "";
      const normalizedEmail = normalizeEmail(email);
      const storedProfile = getAuthProfile(normalizedEmail);
      const invitedAccount = teamInvites.find(
        (invite) => normalizeEmail(invite.email) === normalizedEmail && invite.status !== "declined",
      );
      if (activeInvite && normalizeEmail(activeInvite.email) !== normalizedEmail) {
        await signOutFirebase();
        setAuthError(`This invite was sent to ${activeInvite.email}. Sign in with that Google account or ask for a new invite.`);
        return;
      }
      if (invitedAccount?.status === "pending" && !activeInvite) {
        await signOutFirebase();
        setAuthError("This email has a pending team invite. Open the invite link to join that agency.");
        return;
      }
      if (storedProfile?.role === "employee" && !activeInvite && authMode === "signup") {
        await signOutFirebase();
        setAuthError("This email is already a team member account. Sign in to open the agency workspace.");
        return;
      }
      const role: UserRole =
        activeInvite || storedProfile?.role === "employee" || invitedAccount?.status === "accepted" ? "employee" : "employer";
      rememberRole(normalizedEmail, role);
      if (activeInvite) {
        await acceptInviteForEmail(activeInvite, normalizedEmail);
      }
      const account = saveAuthAccount({
        ...storedProfile,
        id: user.uid,
        name: user.displayName || storedProfile?.name || email.split("@")[0] || "Operion user",
        email: normalizedEmail,
        role,
        workspaceId: activeInvite?.workspaceId ?? storedProfile?.workspaceId,
        inviteId: activeInvite?.id ?? storedProfile?.inviteId,
        agencyName: activeInvite?.agencyName ?? storedProfile?.agencyName,
        emailVerified: true,
        provider: "google",
      });
      setAuthAccount(account);
      maybeCelebrate(user.uid);
      navigateTo("/app");
      void saveUserProfileSafely(account);
      void hydrateWorkspaceSafely(account.workspaceId);
      void getUserProfileSafely(normalizedEmail).then((remoteProfile) => {
        if (!remoteProfile) return;
        const nextAccount = saveAuthAccount({
          ...account,
          ...remoteProfile,
          id: account.id,
          email: account.email,
          provider: account.provider,
        });
        setAuthAccount(nextAccount);
        void hydrateWorkspaceSafely(nextAccount.workspaceId);
      });
    } catch (error) {
      console.error("Google authentication failed", error);
      setAuthError(getErrorMessage(error));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setAuthError("");
    setAuthNotice("");
    if (!email.trim()) {
      setAuthError("Enter your email first, then request a reset link.");
      return;
    }
    try {
      await resetPassword(email.trim());
      setAuthNotice("Password reset email sent. Check your inbox.");
    } catch (error) {
      setAuthError(getErrorMessage(error));
    }
  };

  const handleVerificationRefresh = async () => {
    setAuthError("");
    setAuthNotice("");
    if (!authAccount) return;
    try {
      const code = otpCode.replace(/\D/g, "");
      if (code) {
        if (code.length !== 6) {
          setAuthError("Enter the 6-digit OTP code from your email.");
          return;
        }
        await verifyEmailOtp(authAccount.email, code);
        markOtpVerified(authAccount.email);
        const next = saveAuthAccount({ ...authAccount, emailVerified: true });
        setAuthAccount(next);
        setOtpCode("");
        setAuthNotice("Email verified. Your workspace is ready.");
        return;
      }
      const user = await refreshCurrentUser();
      if (!user) return;
      const next = saveAuthAccount({ ...authAccount, emailVerified: user.emailVerified || isOtpVerified(authAccount.email) } as AuthAccount);
      setAuthAccount(next);
      setAuthNotice(next.emailVerified ? "Email verified. Your workspace is ready." : "Still waiting for verification. Enter the OTP code or verify from your email link.");
    } catch (error) {
      setAuthError(getErrorMessage(error));
    }
  };

  const handleVerificationResend = async () => {
    setAuthError("");
    setAuthNotice("");
    if (!authAccount) return;
    try {
      await requestEmailOtp(authAccount.email, authAccount.name, "resend");
      setAuthNotice("OTP sent again. Check your inbox.");
    } catch (error) {
      try {
        await resendVerificationEmail();
        setAuthNotice("OTP could not be sent, so Firebase sent a secure verification link instead.");
      } catch {
        setAuthError(getErrorMessage(error));
      }
    }
  };

  const completeAgencySetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profile: AgencyProfile = {
      name: String(form.get("agencyName") || "My Agency").trim(),
      agencyType: String(form.get("agencyType") || "Marketing agency"),
      size: String(form.get("size") || "2-10 people"),
      description: String(form.get("description") || "").trim(),
      primaryServices: splitLines(String(form.get("primaryServices") || "")),
      defaultWorkflow: String(form.get("defaultWorkflow") || "Client onboarding"),
      firstGoal: String(form.get("firstGoal") || "Organize client delivery").trim(),
    };
    try {
      const workspaceId =
        authAccount?.workspaceId ??
        (authAccount
          ? await createRemoteWorkspace(authAccount, {
              agencyProfile: profile,
              clients,
              tasks,
              knowledge,
              teamInvites,
              teamMembers: teamRoster,
            })
          : "");
      const nextAccount = authAccount && workspaceId ? saveAuthAccount({ ...authAccount, workspaceId }) : authAccount;
      if (nextAccount) {
        await saveRemoteUserProfile(nextAccount);
        setAuthAccount(nextAccount);
      }
      setAgencyProfile(profile);
      save("operion-agency-profile", profile);
      if (workspaceId) {
        await saveRemoteWorkspacePatch(workspaceId, {
          agencyProfile: profile,
          clients,
          tasks,
          knowledge,
          teamInvites,
          teamMembers: teamRoster,
        });
      }
      navigateTo("/app");
    } catch (error) {
      setAuthError(getErrorMessage(error));
    }
  };

  const addClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company = String(form.get("company") || "New Client").trim();
    const nextClient: Client = {
      id: `cl-${uid()}`,
      company,
      contactName: String(form.get("contactName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      website: String(form.get("website") || "").trim(),
      shortDescription: String(form.get("shortDescription") || "").trim(),
      longDescription: String(form.get("longDescription") || "").trim(),
      keywords: splitLines(String(form.get("keywords") || "")),
      profileLinks: splitLines(String(form.get("profileLinks") || "")).map((url, index) => ({
        label: `Profile ${index + 1}`,
        url,
      })),
      mapLinks: splitLines(String(form.get("mapLinks") || "")),
      timings: splitLines(String(form.get("timings") || "")),
      credentials: [
        {
          label: String(form.get("credentialLabel") || "Login").trim(),
          username: String(form.get("credentialUser") || "").trim(),
          password: String(form.get("credentialPassword") || "").trim(),
        },
      ].filter((item) => item.username || item.password),
      customFields: splitLines(String(form.get("customFields") || "")).map((line) => {
        const [label, ...value] = line.split(":");
        return { label: label.trim(), value: value.join(":").trim() || line };
      }),
      whatsappGroup: `${company} - Client Group`,
    };
    const next = [nextClient, ...clients];
    persistClients(next);
    setActiveClientId(nextClient.id);
    setShowClientForm(false);
    event.currentTarget.reset();
  };

  const assignTemplateTask = () => {
    if (!activeClient || !selectedTemplateTask) return;
    const nextTask: Task = {
      id: `task-${uid()}`,
      clientId: activeClient.id,
      title: selectedTemplateTask.title,
      description: selectedTemplateTask.description,
      assigneeId,
      dueDate,
      priority,
      status: "assigned",
      approval: "not-needed",
      checklist: selectedTemplateTask.checklist.map((title) => ({ title, done: false })),
      comments: [`Created from ${selectedTemplate.name} template.`],
    };
    persistTasks([nextTask, ...tasks]);
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    persistTasks(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const addKnowledge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!activeClient) return;
    const title = String(form.get("title") || "").trim();
    const source = String(form.get("source") || "").trim();
    if (!title || !source) return;
    const next: KnowledgeItem = {
      id: `kb-${uid()}`,
      clientId: activeClient.id,
      type: String(form.get("type") || "URL") as KnowledgeItem["type"],
      title,
      source,
    };
    persistKnowledge([next, ...knowledge]);
    event.currentTarget.reset();
  };

  const signOut = async () => {
    clearActiveAuthAccount();
    await signOutFirebase();
    setAuthAccount(null);
    setAuthMode("signin");
    setAuthError("");
    setAuthNotice("");
    navigateTo("/");
  };

  if (!authReady) {
    return (
      <main className="auth-loading branded-auth-loading">
        <img src="/logo.png" alt="OperionOS" />
        <strong>Opening OperionOS</strong>
        <span>Checking your secure session...</span>
      </main>
    );
  }

  if (!authAccount || !isWorkspaceRoute) {
    return (
      <CustomerOnboarding
        authError={authError}
        authMode={authMode}
        authNotice={authNotice}
        isAuthSubmitting={isAuthSubmitting}
        activeInvite={activeInvite}
        invalidInvite={invalidInvite}
        firebaseReady={hasFirebaseConfig}
        onGoogleAuth={handleGoogleAuth}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError("");
          setAuthNotice("");
        }}
        onPasswordReset={handlePasswordReset}
        onDeclineInvite={declineActiveInvite}
        onSubmit={handleAuth}
      />
    );
  }

  if (authAccount?.role === "employer" && !agencyProfile) {
    return <AgencySetup account={authAccount} onSubmit={completeAgencySetup} />;
  }

  const workspaceProfile = agencyProfile ?? defaultAgencyProfile;

  return (
    <div className="app-shell">
      {showConfetti && <ConfettiBurst />}
      <aside className="sidebar">
        <div className="brand-mark logo-mark">
          <img src="/logo.png" alt="OperionOS" />
        </div>
        <nav className="rail">
          <IconButton label="Dashboard" active icon={<LayoutDashboard />} />
          <IconButton label="Clients" icon={<BriefcaseBusiness />} />
          <IconButton label="Kanban" icon={<Columns3 />} />
          <IconButton label="Calendar" icon={<CalendarDays />} />
          <IconButton label="Docs" icon={<BookOpen />} />
          <IconButton label="Reports" icon={<FileText />} />
          <IconButton label="Settings" icon={<Settings />} />
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{workspaceProfile.agencyType} command center</p>
            <h1>{workspaceProfile.name}</h1>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={18} />
              <input placeholder="Search client fields, tasks, docs..." />
            </div>
            <span className={`role-badge ${workspaceRole}`}>
              {workspaceRole === "employer" ? "Employer workspace" : "Employee workspace"}
            </span>
            <button className="icon-btn" title="Notifications">
              <Bell size={18} />
              <span className="pulse" />
            </button>
            {workspaceRole === "employer" && (
              <button className="primary-btn">
                <Plus size={18} />
                Invite member
              </button>
            )}
            <button className="secondary-btn top-signout" type="button" onClick={signOut}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        <section className="command-hero">
          <div className="command-copy">
            <p className="eyebrow">{workspaceRole === "employer" ? workspaceProfile.firstGoal : "Employee task board"}</p>
            <h2>
              {workspaceRole === "employer"
                ? "Manage clients, templates, approvals, and delivery without opening every task board."
                : "Focus only on the work assigned to you and move cards as the status changes."}
            </h2>
            <p>
              {workspaceRole === "employer"
                ? workspaceProfile.description ||
                  "The employer workspace keeps client onboarding, work assignment, schedules, reports, and automation previews in one clean command center."
                : "This employee view removes owner controls and shows the simple Assigned, In progress, and Completed flow."}
            </p>
            <div className="chips hero-chips">
              {workspaceProfile.primaryServices.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>
          <div className="stat-strip">
            <MetricCard title="Assigned" value={workspaceRole === "employee" ? employeeTasks.filter((task) => task.status === "assigned").length : metrics.assigned} tone="blue" />
            <MetricCard title="In progress" value={workspaceRole === "employee" ? employeeTasks.filter((task) => task.status === "in-progress").length : metrics.progress} tone="purple" />
            <MetricCard title="Completed" value={workspaceRole === "employee" ? employeeTasks.filter((task) => task.status === "completed").length : metrics.completed} tone="green" />
            <MetricCard title="High priority" value={workspaceRole === "employee" ? employeeTasks.filter((task) => task.priority === "urgent" || task.priority === "high").length : metrics.urgent} tone="orange" />
          </div>
        </section>

        {workspaceRole === "employer" ? (
          <EmployerWorkspace
            activeClient={activeClient}
            activeClientId={activeClientId}
            addClient={addClient}
            addKnowledge={addKnowledge}
            assignTemplateTask={assignTemplateTask}
            assigneeId={assigneeId}
            calendarDays={calendarDays}
            clients={clients}
            dueDate={dueDate}
            filteredCustomFields={filteredCustomFields}
            knowledge={knowledge}
            metrics={metrics}
            priority={priority}
            searchTerm={searchTerm}
            selectedTemplate={selectedTemplate}
            selectedTemplateId={selectedTemplateId}
            selectedTemplateTask={selectedTemplateTask}
            selectedTemplateTaskId={selectedTemplateTaskId}
            setActiveClientId={setActiveClientId}
            setAssigneeId={setAssigneeId}
            setDueDate={setDueDate}
            setPriority={setPriority}
            setSearchTerm={setSearchTerm}
            setSelectedTemplateId={setSelectedTemplateId}
            setSelectedTemplateTaskId={setSelectedTemplateTaskId}
            setShowClientForm={setShowClientForm}
            showClientForm={showClientForm}
            tasks={tasks}
            team={teamRoster}
            teamInvites={teamInvites}
            templates={templates}
            addTeamInvite={addTeamInvite}
          />
        ) : (
          <EmployeeWorkspace
            calendarDays={calendarDays}
            clients={clients}
            currentEmployee={currentEmployee}
            employeeTasks={employeeTasks}
            moveTask={moveTask}
          />
        )}

      </main>
    </div>
  );
}

function CustomerOnboarding({
  authError,
  authMode,
  authNotice,
  isAuthSubmitting,
  activeInvite,
  invalidInvite,
  firebaseReady,
  onGoogleAuth,
  onModeChange,
  onPasswordReset,
  onDeclineInvite,
  onSubmit,
}: {
  authError: string;
  authMode: "signup" | "signin";
  authNotice: string;
  isAuthSubmitting: boolean;
  activeInvite?: TeamInvite;
  invalidInvite: boolean;
  firebaseReady: boolean;
  onGoogleAuth: () => Promise<void>;
  onModeChange: (mode: "signup" | "signin") => void;
  onPasswordReset: (email: string) => Promise<void>;
  onDeclineInvite: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isInviteFlow = Boolean(activeInvite);
  const [isAuthOpen, setIsAuthOpen] = useState(isInviteFlow || invalidInvite);

  useEffect(() => {
    if (isInviteFlow || invalidInvite) {
      setIsAuthOpen(true);
    }
  }, [invalidInvite, isInviteFlow]);

  useEffect(() => {
    if (authError) {
      setIsAuthOpen(true);
    }
  }, [authError]);

  useEffect(() => {
    if (!isAuthOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isAuthOpen]);

  const openAuth = (mode: "signup" | "signin") => {
    onModeChange(mode);
    setIsAuthOpen(true);
  };

  return (
    <main className="trillo-shell operion-website">
      <nav className="trillo-nav">
        <a className="brand-lockup" href="#top" aria-label="OperionOS home">
          <span className="brand-mark compact-mark logo-mark">
            <img src="/logo.png" alt="" />
          </span>
          <strong>OperionOS</strong>
        </a>
        <div className="nav-pills" aria-label="Landing sections">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#reviews">Reviews</a>
        </div>
        <div className="trillo-nav-actions">
          <button className="ghost-chip" type="button" onClick={() => openAuth("signin")}>
            Login
          </button>
          <button className="trillo-nav-cta" type="button" onClick={() => openAuth("signup")}>
            Start free
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="trillo-hero" id="top">
        <div className="trillo-hero-copy">
          <h1>Manage agency work with OperionOS</h1>
          <p>
            Onboard clients, assign reusable task templates, track team delivery, and keep every daily update moving
            from one calm operating system.
          </p>
          <div className="hero-actions">
            <button className="primary-btn raised" type="button" onClick={() => openAuth("signup")}>
              Create owner workspace
              <ArrowRight size={18} />
            </button>
            <button className="secondary-btn soft" type="button" onClick={() => openAuth("signin")}>
              Sign in
              <LogIn size={18} />
            </button>
          </div>
          <TrustOrbit />
        </div>
      </section>

      <section className="trillo-preview-wrap" aria-label="OperionOS workspace preview">
        <div className="trillo-preview">
          <div className="preview-toolbar">
            <span>Agency HQ</span>
            <strong>Client Delivery Timeline</strong>
            <em>Live</em>
          </div>
          <div className="preview-grid">
            <div className="timeline-preview">
              <div className="timeline-row">
                <span>Mon</span>
                <strong className="pill-task lime">Onboard PearlCare Dental</strong>
              </div>
              <div className="timeline-row">
                <span>Tue</span>
                <strong className="pill-task blue">Assign content brief</strong>
              </div>
              <div className="timeline-row">
                <span>Wed</span>
                <strong className="pill-task purple">Internal review</strong>
              </div>
              <div className="timeline-row">
                <span>Fri</span>
                <strong className="pill-task orange">Client update</strong>
              </div>
            </div>
            <div className="preview-side">
              <article>
                <span>Assigned</span>
                <strong>12</strong>
              </article>
              <article>
                <span>In progress</span>
                <strong>7</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>34</strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="trillo-logo-strip" aria-label="Trusted workflow areas">
        {["Client onboarding", "Task templates", "Calendar view", "Approvals", "Reports"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      {isAuthOpen && (
        <section className="trillo-auth-modal" role="dialog" aria-modal="true" aria-label="OperionOS authentication">
          <form className="auth-panel trillo-auth-card" onSubmit={onSubmit}>
            <div className="auth-logo-mark logo-mark">
              <img src="/logo.png" alt="OperionOS" />
            </div>
            <h2>
              {isInviteFlow
                ? `Join ${activeInvite?.agencyName}`
                : authMode === "signup"
                  ? "Seconds to sign up!"
                  : "Welcome back"}
            </h2>
            <p className="auth-mode-copy">
              {isInviteFlow
                ? `This invite was sent to ${activeInvite?.email}. Accept it to join as a team member.`
                : authMode === "signup"
                  ? (
                    <>
                      Already have an account?{" "}
                      <button className="inline-auth-link" type="button" onClick={() => onModeChange("signin")}>
                        Sign in
                      </button>
                    </>
                  )
                  : (
                    <>
                      Don't have an account?{" "}
                      <button className="inline-auth-link" type="button" onClick={() => onModeChange("signup")}>
                        Sign up
                      </button>
                    </>
                  )}
            </p>
            {isInviteFlow && (
              <div className="auth-alert success invite-alert">
                <strong>Team member invite</strong>
                <span>You will not create a new agency owner account with this email.</span>
                <button type="button" className="link-button" onClick={onDeclineInvite}>
                  Decline invite
                </button>
              </div>
            )}
            {invalidInvite && (
              <div className="auth-alert error">
                This invite link is missing, expired, or was opened outside the prototype browser state. Ask the agency owner
                for a fresh invite.
              </div>
            )}
            {!firebaseReady && (
              <div className="auth-alert warning">
                Firebase Web credentials are not configured. Email and Google auth will use prototype behavior until env vars are set.
              </div>
            )}
            {authError && <div className="auth-alert error">{authError}</div>}
            {authNotice && <div className="auth-alert success">{authNotice}</div>}
            <button
              className="google-btn"
              type="button"
              onClick={() => void onGoogleAuth()}
              disabled={isAuthSubmitting || invalidInvite}
            >
              <span>G</span>
              {isAuthSubmitting ? "Opening Google..." : "Continue with Google"}
            </button>
            <div className="or-line">
              <span />
              or
              <span />
            </div>
            <input name="accountRole" type="hidden" value={isInviteFlow ? "employee" : "employer"} />
            {authMode === "signup" && (
              <input
              name="name"
              placeholder="Full name"
              defaultValue={activeInvite?.name ?? "Yash Jangid"}
              disabled={isAuthSubmitting}
            />
            )}
            <input
              name="email"
              type="email"
              placeholder="Work email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isAuthSubmitting}
              required
            />
            <label className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                disabled={isAuthSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                disabled={isAuthSubmitting}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </label>
            {authMode === "signup" && <small className="field-hint">Must be at least 8 characters long.</small>}
            <button className="primary-btn full raised" type="submit" disabled={isAuthSubmitting || invalidInvite}>
              {isAuthSubmitting
                ? authMode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : authMode === "signup"
                  ? "Sign up with Email"
                  : "Log In"}
            </button>
            {authMode === "signin" && (
              <button
                className="link-button"
                type="button"
                onClick={() => void onPasswordReset(email)}
                disabled={isAuthSubmitting}
              >
                Forgot Password?
              </button>
            )}
            <p className="auth-footnote">
              {authMode === "signup"
                ? "By continuing, you agree to our Terms of Service and Privacy Policy. Need help?"
                : "Need help?"}
            </p>
          </form>
        </section>
      )}

      <section className="trillo-section" id="features">
        <p className="eyebrow">Innovative agency operations that help</p>
        <h2>Keep every client, employee, task, deadline, and update connected.</h2>
        <div className="trillo-feature-grid">
          {[
            ["Client profiles", "Store socials, map links, websites, credentials, descriptions, timings, keywords, and custom searchable fields."],
            ["Task templates", "Turn repeatable agency services into assignable task packs with priorities, assignees, due dates, and approval states."],
            ["Employee flow", "Team members work through assigned, in progress, and completed boards without seeing owner-only controls."],
          ].map(([title, copy]) => (
            <article key={title}>
              <span />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trillo-section trillo-workflow-section" id="workflow">
        <div>
          <p className="eyebrow">Intelligent way to manage work</p>
          <h2>From owner signup to daily execution in four clean steps.</h2>
        </div>
        <div className="trillo-workflow-grid">
          {[
            ["01", "Create agency workspace", "Direct signup creates the owner account and workspace setup flow."],
            ["02", "Invite team members", "Team members accept an invite link and join the existing agency only."],
            ["03", "Onboard clients", "Capture profile links, maps, hours, passwords, keywords, and custom fields."],
            ["04", "Assign and report", "Assign template tasks, track progress, and prepare daily WhatsApp-ready reports."],
          ].map(([number, title, copy]) => (
            <article key={number}>
              <strong>{number}</strong>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trillo-reviews" id="reviews">
        <div>
          <p className="eyebrow">Built around real agency work</p>
          <h2>Simple for the team. Deep enough for the owner.</h2>
        </div>
        <div className="trillo-review-grid">
          <article>
            <strong>4.9/5</strong>
            <p>Prototype UX target for client delivery, recurring work, and team visibility.</p>
          </article>
          <article>
            <strong>12+</strong>
            <p>Designed for small agency teams that need clarity without enterprise overhead.</p>
          </article>
          <article>
            <strong>Daily</strong>
            <p>Updates, deadlines, approvals, and reports stay visible from the same workspace.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

function EmailVerificationGate({
  account,
  authError,
  authNotice,
  otpCode,
  onOtpChange,
  onLogout,
  onRefresh,
  onResend,
}: {
  account: AuthAccount;
  authError: string;
  authNotice: string;
  otpCode: string;
  onOtpChange: (value: string) => void;
  onLogout: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onResend: () => Promise<void>;
}) {
  return (
    <main className="verification-shell">
      <section className="verification-card">
        <span className="auth-logo-mark logo-mark">
          <img src="/logo.png" alt="OperionOS" />
        </span>
        <MailCheck size={42} />
        <h1>Verify your email</h1>
        <p>Enter the 6-digit code sent to</p>
        <strong>{account.email}</strong>
        <input
          className="otp-code-input"
          inputMode="numeric"
          maxLength={6}
          name="otpCode"
          placeholder="000000"
          value={otpCode}
          onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <div className="verification-actions">
          <button className="primary-btn full raised" type="button" onClick={() => void onRefresh()}>
            Verify code
          </button>
          <button className="secondary-btn full" type="button" onClick={() => void onResend()}>
            Resend OTP email
          </button>
          <button className="link-button" type="button" onClick={() => void onLogout()}>
            Logout
          </button>
        </div>
        {authError && <div className="auth-alert error">{authError}</div>}
        {authNotice && <div className="auth-alert success">{authNotice}</div>}
        <small>
          Keep the local auth server running while you verify. Firebase's secure email verification link remains available
          as a fallback.
        </small>
      </section>
    </main>
  );
}

function ConfettiBurst() {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => (
        <span key={index} style={{ "--i": index } as CSSProperties} />
      ))}
      <div className="celebration-toast">
        <PartyPopper size={18} />
        Workspace unlocked
      </div>
    </div>
  );
}

function AgencySetup({ account, onSubmit }: { account: AuthAccount; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("Work");
  const [manageType, setManageType] = useState("Professional Services");
  const [source, setSource] = useState("AI Tools");
  const [tools, setTools] = useState<string[]>(["Google Drive", "Slack"]);
  const [features, setFeatures] = useState<string[]>(["Tasks & Projects", "Boards & Kanban", "Calendar"]);
  const [invites, setInvites] = useState("");
  const [workspaceName, setWorkspaceName] = useState(`${account.name}'s Workspace`);

  const toggleItem = (value: string, items: string[], setter: (next: string[]) => void) => {
    setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  };

  const progress = ((step + 1) / 7) * 100;

  return (
    <main className="setup-wizard-shell">
      <section className="setup-wizard-card">
        <div className="setup-brand-row">
          <span className="brand-mark compact-mark logo-mark">
            <img src="/logo.png" alt="OperionOS" />
          </span>
          <strong>OperionOS.io</strong>
          <span>{step + 1} / 7</span>
        </div>

        <form className="setup-wizard-form" onSubmit={onSubmit}>
          <input name="agencyName" type="hidden" value={workspaceName} />
          <input name="agencyType" type="hidden" value={manageType} />
          <input name="size" type="hidden" value={purpose === "Work" ? "2-10 people" : "Solo"} />
          <input
            name="description"
            type="hidden"
            value={`Purpose: ${purpose}. Managed work: ${manageType}. Current tools: ${tools.join(", ") || "None selected"}.`}
          />
          <input name="primaryServices" type="hidden" value={features.join("\n") || "Client onboarding\nTask management"} />
          <input name="defaultWorkflow" type="hidden" value={features.includes("Calendar") ? "Campaign execution" : "Client onboarding"} />
          <input name="firstGoal" type="hidden" value={`Launch ${workspaceName}`} />

          <div className={`setup-step ${step === 0 ? "active" : ""}`}>
            <h1>What would you like to use OperionOS for?</h1>
            <ChoiceRow options={["Work", "Personal", "School"]} value={purpose} onSelect={setPurpose} />
          </div>

          <div className={`setup-step ${step === 1 ? "active" : ""}`}>
            <h1>What would you like to manage?</h1>
            <ChoiceGrid
              options={[
                "HR & Recruiting",
                "Professional Services",
                "Sales & CRM",
                "Finance & Accounting",
                "IT",
                "Operations",
                "Support",
                "PMO",
                "Software Development",
                "Creative & Design",
                "Startup",
                "Marketing",
                "Other",
              ]}
              selected={[manageType]}
              onToggle={setManageType}
              single
            />
          </div>

          <div className={`setup-step ${step === 2 ? "active" : ""}`}>
            <h1>How did you hear about us?</h1>
            <ChoiceGrid
              options={[
                "Search Engine",
                "Friend / Colleague",
                "YouTube",
                "Reddit",
                "LinkedIn",
                "Facebook / Instagram",
                "AI Tools",
                "Podcasts / Radio",
                "Other",
              ]}
              selected={[source]}
              onToggle={setSource}
              single
            />
          </div>

          <div className={`setup-step ${step === 3 ? "active" : ""}`}>
            <h1>Invite people to your Workspace.</h1>
            <input
              className="setup-large-input"
              placeholder="Enter email addresses, separated by commas"
              value={invites}
              onChange={(event) => setInvites(event.target.value)}
            />
            <p className="setup-tip">Invite later is perfectly fine. Your owner workspace will still be created.</p>
          </div>

          <div className={`setup-step ${step === 4 ? "active" : ""}`}>
            <h1>Do you use any of these tools?</h1>
            <ChoiceGrid
              options={[
                "Figma",
                "Slack",
                "Asana",
                "GitHub",
                "Todoist",
                "Basecamp",
                "Wrike",
                "Excel & CSV",
                "Monday",
                "Dropbox",
                "Jira",
                "Zoom",
                "Notion",
                "Google Drive",
                "Salesforce",
                "Trello",
              ]}
              selected={tools}
              onToggle={(value) => toggleItem(value, tools, setTools)}
            />
          </div>

          <div className={`setup-step ${step === 5 ? "active" : ""}`}>
            <h1>Which features are you interested in trying?</h1>
            <ChoiceGrid
              options={[
                "Gantt Charts",
                "Whiteboards",
                "Calendar",
                "Forms",
                "Tasks & Projects",
                "Chat",
                "CRM",
                "Dashboards",
                "Automations",
                "AI",
                "Boards & Kanban",
                "Goals & OKRs",
                "Docs & Wikis",
                "Time Tracking",
              ]}
              selected={features}
              onToggle={(value) => toggleItem(value, features, setFeatures)}
            />
          </div>

          <div className={`setup-step ${step === 6 ? "active" : ""}`}>
            <h1>Lastly, what would you like to name your Workspace?</h1>
            <input
              className="setup-large-input"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              required
            />
            <p className="setup-tip">Use your agency, company, or team name.</p>
          </div>

          <div className="setup-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="setup-nav">
            <button className="secondary-btn" type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
              Back
            </button>
            {step < 6 ? (
              <button className="primary-btn raised" type="button" onClick={() => setStep(Math.min(6, step + 1))}>
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button className="primary-btn raised" type="submit">
                Finish
                <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

function ChoiceRow({
  onSelect,
  options,
  value,
}: {
  onSelect: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="choice-row">
      {options.map((option) => (
        <button className={value === option ? "selected" : ""} key={option} type="button" onClick={() => onSelect(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

function ChoiceGrid({
  onToggle,
  options,
  selected,
  single = false,
}: {
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
  single?: boolean;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          className={selected.includes(option) ? "selected" : ""}
          key={option}
          type="button"
          onClick={() => onToggle(option)}
        >
          <span>{option}</span>
          <small>{selected.includes(option) ? "Selected" : single ? "" : "+"}</small>
        </button>
      ))}
    </div>
  );
}

function load<T>(key: string, fallback: T): T {
  return (inMemoryStorage.get(key) as T | undefined) ?? fallback;
}

function save<T>(key: string, value: T) {
  inMemoryStorage.set(key, value);
}

function getStoredAuthProfiles() {
  return load<Record<string, AuthAccount>>(AUTH_PROFILES_KEY, {});
}

function getAuthProfile(email: string) {
  return getStoredAuthProfiles()[normalizeEmail(email)] ?? null;
}

function saveAuthAccount(account: AuthAccount) {
  const normalizedEmail = normalizeEmail(account.email);
  const normalizedAccount = { ...account, email: normalizedEmail };
  const profiles = getStoredAuthProfiles();
  save(AUTH_PROFILES_KEY, { ...profiles, [normalizedEmail]: normalizedAccount });
  save(AUTH_ACCOUNT_KEY, normalizedAccount);
  const roleMap = load<Record<string, UserRole>>(AUTH_ROLES_KEY, {});
  save(AUTH_ROLES_KEY, { ...roleMap, [normalizedEmail]: normalizedAccount.role });
  return normalizedAccount;
}

function clearActiveAuthAccount() {
  inMemoryStorage.delete(AUTH_ACCOUNT_KEY);
}

function getOtpVerifiedMap() {
  return load<Record<string, boolean>>(AUTH_OTP_VERIFIED_KEY, {});
}

function isOtpVerified(email: string) {
  return Boolean(getOtpVerifiedMap()[normalizeEmail(email)]);
}

function markOtpVerified(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  save(AUTH_OTP_VERIFIED_KEY, { ...getOtpVerifiedMap(), [normalizedEmail]: true });
}

function isAccountEmailVerified(account: AuthAccount) {
  return Boolean(account.emailVerified || isOtpVerified(account.email));
}

function buildFirebaseAccount(user: { uid: string; email: string | null; displayName: string | null; emailVerified: boolean; providerData?: { providerId: string }[] }, profile: AuthAccount | null): AuthAccount {
  const email = normalizeEmail(user.email ?? profile?.email ?? "");
  const provider = user.providerData?.some((item) => item.providerId === "google.com") ? "google" : "email";
  return {
    ...profile,
    id: user.uid,
    name: user.displayName || profile?.name || email.split("@")[0] || "Operion user",
    email,
    role: profile?.role ?? "employer",
    emailVerified: provider === "google" || user.emailVerified || isOtpVerified(email),
    provider,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("auth/unauthorized-domain")) {
      return "Firebase blocked this URL. Add 127.0.0.1 and localhost in Firebase Authentication > Settings > Authorized domains.";
    }
    if (message.includes("auth/operation-not-allowed")) {
      return "This Firebase sign-in method is disabled. Enable Email/Password and Google in Firebase Authentication > Sign-in method.";
    }
    if (message.includes("auth/email-already-in-use")) return "This email is already signed up. Please sign in instead.";
    if (message.includes("auth/invalid-credential")) return "The email or password is incorrect.";
    if (message.includes("auth/invalid-email")) return "Enter a valid work email address.";
    if (message.includes("auth/weak-password")) return "Password must be at least 6 characters for Firebase and 8 characters for OperionOS.";
    if (message.includes("auth/popup-closed-by-user")) return "Google sign-in was closed before it finished.";
    if (message.includes("auth/popup-blocked")) return "Your browser blocked the Google sign-in popup. Allow popups for this local site and try again.";
    if (message.includes("auth/account-exists-with-different-credential")) {
      return "This email already exists with a different sign-in method. Sign in with the method you used earlier.";
    }
    if (message.includes("auth/network-request-failed")) {
      return "Firebase could not be reached. Check your internet connection and Firebase project settings.";
    }
    if (message.includes("auth/too-many-requests")) return "Too many attempts. Please wait a little and try again.";
    if (message.includes("auth/user-disabled")) return "This account has been disabled in Firebase Authentication.";
    if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
      return "The email or password is incorrect.";
    }
    return message;
  }
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function sendTeamInviteEmail(invite: TeamInvite) {
  const apiBase = import.meta.env.VITE_AUTH_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787" : "");
  const inviteBaseUrl = `${window.location.origin}${window.location.pathname}`;
  const buildInviteLink = (action: "accept" | "decline") => {
    const params = new URLSearchParams({ invite: invite.id, action });
    if (invite.workspaceId) params.set("workspace", invite.workspaceId);
    if (invite.token) params.set("token", invite.token);
    return `${inviteBaseUrl}?${params.toString()}`;
  };

  const response = await fetch(`${apiBase}/api/invites/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: invite.email,
      name: invite.name,
      role: invite.role,
      agencyName: invite.agencyName,
      acceptUrl: buildInviteLink("accept"),
      declineUrl: buildInviteLink("decline"),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || `Invite email failed with HTTP ${response.status}.`);
  }
}

export default App;
