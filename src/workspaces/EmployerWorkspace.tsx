import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Link2,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
  Workflow,
  X,
} from "lucide-react";
import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from "react";
import { CalendarBoard, InfoLine, Panel } from "../components/workspace";
import type { Client, KnowledgeItem, Priority, Task, TeamInvite, TeamMember, TemplateTask, WorkTemplate } from "../types";
import { buildClientDigest, buildEmployeeDigest } from "../utils/digests";

type EmployerWorkspaceProps = {
  activeClient: Client | undefined;
  activeClientId: string;
  assigneeId: string;
  calendarDays: { iso: string; day: string; date: string; tasks: Task[] }[];
  clients: Client[];
  dueDate: string;
  filteredCustomFields: { label: string; value: string }[] | undefined;
  knowledge: KnowledgeItem[];
  metrics: { assigned: number; progress: number; completed: number; urgent: number };
  priority: Priority;
  searchTerm: string;
  selectedTemplate: WorkTemplate;
  selectedTemplateId: string;
  selectedTemplateTask: TemplateTask;
  selectedTemplateTaskId: string;
  showClientForm: boolean;
  tasks: Task[];
  team: TeamMember[];
  teamInvites: TeamInvite[];
  templates: WorkTemplate[];
  addClient: (event: FormEvent<HTMLFormElement>) => void;
  addKnowledge: (event: FormEvent<HTMLFormElement>) => void;
  addTeamInvite: (event: FormEvent<HTMLFormElement>) => void;
  assignTemplateTask: () => void;
  setActiveClientId: Dispatch<SetStateAction<string>>;
  setAssigneeId: Dispatch<SetStateAction<string>>;
  setDueDate: Dispatch<SetStateAction<string>>;
  setPriority: Dispatch<SetStateAction<Priority>>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setSelectedTemplateId: Dispatch<SetStateAction<string>>;
  setSelectedTemplateTaskId: Dispatch<SetStateAction<string>>;
  setShowClientForm: Dispatch<SetStateAction<boolean>>;
};

export function EmployerWorkspace({
  activeClient,
  activeClientId,
  assigneeId,
  calendarDays,
  clients,
  dueDate,
  filteredCustomFields,
  knowledge,
  metrics,
  priority,
  searchTerm,
  selectedTemplate,
  selectedTemplateId,
  selectedTemplateTask,
  selectedTemplateTaskId,
  showClientForm,
  tasks,
  team,
  teamInvites,
  templates,
  addClient,
  addKnowledge,
  addTeamInvite,
  assignTemplateTask,
  setActiveClientId,
  setAssigneeId,
  setDueDate,
  setPriority,
  setSearchTerm,
  setSelectedTemplateId,
  setSelectedTemplateTaskId,
  setShowClientForm,
}: EmployerWorkspaceProps) {
  const inviteBaseUrl = `${window.location.origin}${window.location.pathname}`;
  const buildInviteLink = (invite: TeamInvite, action: "accept" | "decline") => {
    const params = new URLSearchParams({ invite: invite.id, action });
    if (invite.workspaceId) params.set("workspace", invite.workspaceId);
    if (invite.token) params.set("token", invite.token);
    return `${inviteBaseUrl}?${params.toString()}`;
  };

  return (
    <>
      <section className="content-grid">
        <Panel title="Client onboarding" icon={<BriefcaseBusiness />}>
          <div className="onboarding-summary">
            <div>
              <p className="eyebrow">Structured intake</p>
              <h3>Create a client workspace from one guided form.</h3>
              <p>
                Store profile links, maps, contact details, credentials, keywords, timings, and custom searchable fields
                before assigning the first task.
              </p>
            </div>
            <button className="primary-btn raised" type="button" onClick={() => setShowClientForm(true)}>
              <Plus size={18} />
              Onboard client
            </button>
          </div>
        </Panel>

        <Panel title="Active client profile" icon={<ShieldCheck />}>
          {activeClient && (
            <div className="client-card">
              <select value={activeClientId} onChange={(event) => setActiveClientId(event.target.value)}>
                {clients.map((client) => (
                  <option value={client.id} key={client.id}>
                    {client.company}
                  </option>
                ))}
              </select>
              <h3>{activeClient.company}</h3>
              <p>{activeClient.shortDescription}</p>
              <div className="mini-list">
                <InfoLine icon={<Link2 />} label="Website" value={activeClient.website} />
                <InfoLine icon={<MessageCircle />} label="WhatsApp group" value={activeClient.whatsappGroup} />
                <InfoLine icon={<Clock3 />} label="Timings" value={activeClient.timings.join(" | ")} />
                <InfoLine icon={<LockKeyhole />} label="Credentials" value={`${activeClient.credentials.length} saved item(s)`} />
              </div>
              <div className="chips">
                {activeClient.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
              <div className="search small-search">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search custom client fields"
                />
              </div>
              <div className="custom-field-list">
                {filteredCustomFields?.map((field) => (
                  <div key={`${field.label}-${field.value}`}>
                    <strong>{field.label}</strong>
                    <span>{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Invite team members" icon={<UserPlus />}>
          <form className="form-grid compact invite-form" onSubmit={addTeamInvite}>
            <div className="two-col">
              <input name="inviteName" placeholder="Team member name" />
              <input name="inviteEmail" type="email" placeholder="Work email" required />
            </div>
            <select name="inviteRole" defaultValue="Employee">
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Client Viewer">Client Viewer</option>
            </select>
            <button className="primary-btn full" type="submit">
              <UserPlus size={18} />
              Create invite
            </button>
          </form>
          <div className="invite-list">
            {teamInvites.length === 0 && (
              <p className="muted-copy">Create an invite to generate the accept/decline links that the email system will send later.</p>
            )}
            {teamInvites.map((invite) => (
              <div key={invite.id} className={`invite-card ${invite.status}`}>
                <div>
                  <strong>{invite.name || invite.email}</strong>
                  <p>
                    {invite.email} · {invite.role} · {invite.status}
                  </p>
                </div>
                <div className="invite-links">
                  <a href={buildInviteLink(invite, "accept")}>Accept link</a>
                  <a href={buildInviteLink(invite, "decline")}>Decline link</a>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="template-board">
        <Panel title="Work templates and sticky tasks" icon={<Archive />}>
          <div className="template-selector">
            {templates.map((template) => (
              <button
                className={template.id === selectedTemplateId ? "template active" : "template"}
                style={{ "--accent": template.color } as CSSProperties}
                key={template.id}
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  setSelectedTemplateTaskId(template.tasks[0].id);
                }}
              >
                <span>{template.category}</span>
                <strong>{template.name}</strong>
              </button>
            ))}
          </div>
          <div className="sticky-grid">
            {selectedTemplate.tasks.map((task) => (
              <button
                key={task.id}
                className={task.id === selectedTemplateTaskId ? "sticky active" : "sticky"}
                onClick={() => setSelectedTemplateTaskId(task.id)}
              >
                <strong>{task.title}</strong>
                <span>{task.description}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Assign selected task" icon={<Send />}>
          <div className="assign-card">
            <p className="eyebrow">Selected task</p>
            <h3>{selectedTemplateTask.title}</h3>
            <p>{selectedTemplateTask.description}</p>
            <div className="form-grid compact">
              <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent priority</option>
              </select>
              <button className="primary-btn full" onClick={assignTemplateTask}>
                Assign to employee
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid bottom">
        <Panel title="Calendar view" icon={<CalendarDays />}>
          <CalendarBoard days={calendarDays} clients={clients} />
        </Panel>

        <Panel title="Knowledge base / future RAG" icon={<BookOpen />}>
          <form className="form-grid compact" onSubmit={addKnowledge}>
            <input name="title" placeholder="Knowledge item title" />
            <input name="source" placeholder="PDF, doc, transcript, or URL source" />
            <select name="type">
              <option>URL</option>
              <option>PDF</option>
              <option>Doc</option>
              <option>Transcript</option>
            </select>
            <button className="secondary-btn" type="submit">
              <Upload size={16} />
              Add source
            </button>
          </form>
          <div className="knowledge-list">
            {knowledge
              .filter((item) => item.clientId === activeClient?.id)
              .map((item) => (
                <div key={item.id}>
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.source}</p>
                </div>
              ))}
          </div>
        </Panel>

        <Panel title="WhatsApp automation preview" icon={<MessageCircle />}>
          <div className="digest">
            <p className="eyebrow">Employer profile daily message</p>
            <pre>{buildEmployeeDigest(tasks)}</pre>
            <p className="eyebrow">Client group daily update</p>
            <pre>{buildClientDigest(tasks, team)}</pre>
            <small>
              WhatsApp community/group creation will need an approved WhatsApp Business API provider later. This screen
              defines the backend workflow and message format first.
            </small>
          </div>
        </Panel>

        <Panel title="Reports and role access" icon={<Workflow />}>
          <div className="report-card">
            <div>
              <strong>Completion rate</strong>
              <span>{Math.round((metrics.completed / Math.max(tasks.length, 1)) * 100)}%</span>
            </div>
            <div>
              <strong>Pending approval</strong>
              <span>{tasks.filter((task) => task.approval !== "not-needed" && task.approval !== "approved").length}</span>
            </div>
            <div>
              <strong>Team roles</strong>
              <span>{team.length}</span>
            </div>
          </div>
          <div className="role-list">
            {team.map((member) => (
              <div key={member.id}>
                <span className="avatar">{member.avatar}</span>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.role} access</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {showClientForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Client onboarding form">
          <section className="modal-panel">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Client onboarding</p>
                <h2>Create client workspace</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowClientForm(false)} title="Close form">
                <X size={18} />
              </button>
            </div>
            <form className="form-grid onboarding-form" onSubmit={addClient}>
              <div className="two-col">
                <input name="company" placeholder="Company / client name" required />
                <input name="contactName" placeholder="Contact person" />
              </div>
              <div className="two-col">
                <input name="email" placeholder="Contact email" />
                <input name="phone" placeholder="Phone number" />
              </div>
              <input name="website" placeholder="Website link" />
              <textarea name="shortDescription" placeholder="Short description" rows={2} />
              <textarea name="longDescription" placeholder="Long description" rows={3} />
              <textarea name="profileLinks" placeholder="Profile links: Instagram, Facebook, X, YouTube, LinkedIn..." rows={4} />
              <div className="two-col">
                <textarea name="mapLinks" placeholder="Google Maps links, one per line" rows={3} />
                <textarea name="timings" placeholder="Timings, one per line" rows={3} />
              </div>
              <textarea name="keywords" placeholder="Keywords, one per line" rows={3} />
              <div className="triple">
                <input name="credentialLabel" placeholder="Credential label" />
                <input name="credentialUser" placeholder="Email / username" />
                <input name="credentialPassword" placeholder="Password" type="password" />
              </div>
              <textarea
                name="customFields"
                placeholder="Custom searchable fields, one per line. Example: Primary city: Boston"
                rows={3}
              />
              <button className="primary-btn full" type="submit">
                <Sparkles size={18} />
                Onboard client and create workspace
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
