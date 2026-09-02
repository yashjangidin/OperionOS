import {
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  GripVertical,
  LayoutGrid,
  LogOut,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";

type Role = "employer" | "employee";
type TaskStatus = "assigned" | "ongoing" | "completed";
type ViewMode = "board" | "calendar";
type AuthMode = "signup" | "signin";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  designation: string;
  workspaceId: string;
  companyName: string;
};

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
};

type WorkspaceRecord = {
  id: string;
  companyName: string;
  employerId: string;
  tasks: TaskRecord[];
};

type SessionRecord = {
  email: string;
};

const STORAGE_KEYS = {
  users: "operion-mvp-users",
  workspaces: "operion-mvp-workspaces",
  session: "operion-mvp-session",
};

const TASK_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "assigned", title: "Assigned" },
  { status: "ongoing", title: "Ongoing" },
  { status: "completed", title: "Completed" },
];

function MvpApp() {
  const [users, setUsers] = usePersistentState<UserRecord[]>(STORAGE_KEYS.users, []);
  const [workspaces, setWorkspaces] = usePersistentState<WorkspaceRecord[]>(STORAGE_KEYS.workspaces, []);
  const [session, setSession] = usePersistentState<SessionRecord | null>(STORAGE_KEYS.session, null);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<TaskStatus | null>(null);
  const [dropEmployeeId, setDropEmployeeId] = useState<string | null>(null);

  const currentUser = useMemo(() => {
    if (!session) return null;
    return users.find((user) => user.email === normalizeEmail(session.email)) ?? null;
  }, [session, users]);

  const currentWorkspace = useMemo(() => {
    if (!currentUser) return null;
    return workspaces.find((workspace) => workspace.id === currentUser.workspaceId) ?? null;
  }, [currentUser, workspaces]);

  const isEmployer = currentUser?.role === "employer";

  const teamMembers = useMemo(() => {
    if (!currentWorkspace) return [];
    return users
      .filter((user) => user.workspaceId === currentWorkspace.id && user.role === "employee")
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [currentWorkspace, users]);

  const memberLookup = useMemo(() => {
    const entries = new Map<string, UserRecord>();
    if (currentUser) entries.set(currentUser.id, currentUser);
    teamMembers.forEach((member) => entries.set(member.id, member));
    return entries;
  }, [currentUser, teamMembers]);

  const visibleTasks = useMemo(() => {
    if (!currentUser || !currentWorkspace) return [];
    return isEmployer ? currentWorkspace.tasks : currentWorkspace.tasks.filter((task) => task.employeeId === currentUser.id);
  }, [currentUser, currentWorkspace, isEmployer]);

  const selectedEmployee = useMemo(() => {
    if (!teamMembers.length) return null;
    return teamMembers.find((member) => member.id === selectedEmployeeId) ?? teamMembers[0];
  }, [selectedEmployeeId, teamMembers]);

  const selectedEmployeeTasks = useMemo(() => {
    if (!selectedEmployee || !currentWorkspace) return [];
    return currentWorkspace.tasks.filter((task) => task.employeeId === selectedEmployee.id);
  }, [currentWorkspace, selectedEmployee]);

  const taskStats = useMemo(() => {
    return {
      total: visibleTasks.length,
      assigned: visibleTasks.filter((task) => task.status === "assigned").length,
      ongoing: visibleTasks.filter((task) => task.status === "ongoing").length,
      completed: visibleTasks.filter((task) => task.status === "completed").length,
    };
  }, [visibleTasks]);

  useEffect(() => {
    if (!teamMembers.length) {
      setSelectedEmployeeId("");
      if (!isEmployer) {
        setTaskAssigneeId("");
      }
      return;
    }

    if (!selectedEmployeeId || !teamMembers.some((member) => member.id === selectedEmployeeId)) {
      setSelectedEmployeeId(teamMembers[0].id);
    }
  }, [isEmployer, selectedEmployeeId, teamMembers]);

  useEffect(() => {
    if (!isEmployer) {
      setTaskAssigneeId(currentUser?.id ?? "");
      return;
    }

    if (!taskAssigneeId || !teamMembers.some((member) => member.id === taskAssigneeId)) {
      setTaskAssigneeId(teamMembers[0]?.id ?? "");
    }
  }, [currentUser?.id, isEmployer, taskAssigneeId, teamMembers]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (currentUser && !currentWorkspace) {
      setErrorMessage("The account does not belong to a workspace. Please sign out and try again.");
    }
  }, [currentUser, currentWorkspace]);

  const updateWorkspace = (workspaceId: string, mutate: (workspace: WorkspaceRecord) => WorkspaceRecord) => {
    setWorkspaces((existing) => existing.map((workspace) => (workspace.id === workspaceId ? mutate(workspace) : workspace)));
  };

  const resetDragState = () => {
    setDragTaskId(null);
    setDropStatus(null);
    setDropEmployeeId(null);
  };

  const handleEmployerSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const companyName = getString(form, "companyName");
    const employerName = getString(form, "employerName");
    const email = normalizeEmail(getString(form, "email"));
    const password = getString(form, "password");

    if (!companyName || !employerName || !email || !password) {
      setErrorMessage("Please fill in every field to create the employer account.");
      return;
    }

    if (findUser(users, email)) {
      setErrorMessage("That email already exists. Please sign in instead.");
      return;
    }

    const employerId = createId();
    const workspaceId = createId();

    const employer: UserRecord = {
      id: employerId,
      name: employerName,
      email,
      password,
      role: "employer",
      designation: "Employer",
      workspaceId,
      companyName,
    };

    const workspace: WorkspaceRecord = {
      id: workspaceId,
      companyName,
      employerId,
      tasks: [],
    };

    setUsers((existing) => [...existing, employer]);
    setWorkspaces((existing) => [...existing, workspace]);
    setSession({ email });
    setStatusMessage(`${companyName} workspace created.`);
    event.currentTarget.reset();
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(getString(form, "email"));
    const password = getString(form, "password");
    const user = findUser(users, email);

    if (!user || user.password !== password) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    setSession({ email });
    setStatusMessage(`Welcome back, ${user.name}.`);
    event.currentTarget.reset();
  };

  const handleInviteEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!currentWorkspace || !currentUser || !isEmployer) {
      setErrorMessage("Only the employer can add team members.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = getString(form, "name");
    const designation = getString(form, "designation");
    const email = normalizeEmail(getString(form, "email"));
    const password = getString(form, "password");

    if (!name || !designation || !email || !password) {
      setErrorMessage("Please add the employee name, designation, email, and password.");
      return;
    }

    if (findUser(users, email)) {
      setErrorMessage("That email already has an account. Duplicate accounts are not allowed.");
      return;
    }

    const employee: UserRecord = {
      id: createId(),
      name,
      email,
      password,
      role: "employee",
      designation,
      workspaceId: currentWorkspace.id,
      companyName: currentWorkspace.companyName,
    };

    setUsers((existing) => [...existing, employee]);
    setStatusMessage(`${name} has been added to the team.`);
    event.currentTarget.reset();
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!currentWorkspace || !isEmployer) {
      setErrorMessage("Only the employer can create tasks.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const title = getString(form, "title");
    const description = getString(form, "description");
    const employeeId = getString(form, "employeeId");
    const assignedDate = getString(form, "assignedDate") || isoToday();
    const dueDate = getString(form, "dueDate");

    if (!title || !description || !employeeId || !dueDate) {
      setErrorMessage("Please choose an employee and complete the task details.");
      return;
    }

    const employee = teamMembers.find((member) => member.id === employeeId);
    if (!employee) {
      setErrorMessage("Please choose a valid team member.");
      return;
    }

    const task: TaskRecord = {
      id: createId(),
      title,
      description,
      employeeId,
      assignedDate,
      dueDate,
      status: "assigned",
    };

    updateWorkspace(currentWorkspace.id, (workspace) => ({
      ...workspace,
      tasks: [task, ...workspace.tasks],
    }));

    setTaskAssigneeId(employeeId);
    setStatusMessage(`Task "${title}" assigned to ${employee.name}.`);
    event.currentTarget.reset();
  };

  const handleMoveTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!currentWorkspace) return;
    updateWorkspace(currentWorkspace.id, (workspace) => ({
      ...workspace,
      tasks: workspace.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }));
    setStatusMessage(`Task moved to ${status.replace("-", " ")}.`);
  };

  const handleReassignTask = (taskId: string, employeeId: string) => {
    if (!currentWorkspace) return;
    const employee = teamMembers.find((member) => member.id === employeeId);
    if (!employee) return;

    updateWorkspace(currentWorkspace.id, (workspace) => ({
      ...workspace,
      tasks: workspace.tasks.map((task) => (task.id === taskId ? { ...task, employeeId } : task)),
    }));

    setStatusMessage(`Task reassigned to ${employee.name}.`);
  };

  const handleLogout = () => {
    setSession(null);
    setViewMode("board");
    setStatusMessage("");
    setErrorMessage("");
    resetDragState();
  };

  if (!currentUser || !currentWorkspace) {
    return (
      <AuthScreen
        authMode={authMode}
        errorMessage={errorMessage}
        onEmployerSignup={handleEmployerSignup}
        onLogin={handleLogin}
        onModeChange={setAuthMode}
        statusMessage={statusMessage}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Operion OS MVP</p>
          <h1>{currentWorkspace.companyName}</h1>
          <p className="topbar-copy">
            {isEmployer ? "Employer workspace" : "Employee workspace"} · logged in as {currentUser.name}
          </p>
        </div>

        <div className="topbar-actions">
          <div className="pill">
            <Users size={16} />
            {teamMembers.length} team
          </div>
          <div className="pill">
            <CheckCircle2 size={16} />
            {taskStats.completed}/{taskStats.total} done
          </div>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div className="mode-switch">
        <button className={viewMode === "board" ? "active" : ""} type="button" onClick={() => setViewMode("board")}>
          <LayoutGrid size={16} />
          Board
        </button>
        <button className={viewMode === "calendar" ? "active" : ""} type="button" onClick={() => setViewMode("calendar")}>
          <CalendarDays size={16} />
          Calendar
        </button>
      </div>

      {statusMessage && <div className="banner success">{statusMessage}</div>}
      {errorMessage && <div className="banner error">{errorMessage}</div>}

      {viewMode === "board" ? (
        isEmployer ? (
          <EmployerBoard
            dragTaskId={dragTaskId}
            dropEmployeeId={dropEmployeeId}
            dropStatus={dropStatus}
            memberLookup={memberLookup}
            onCreateTask={handleCreateTask}
            onInviteEmployee={handleInviteEmployee}
            onMoveTaskStatus={handleMoveTaskStatus}
            onReassignTask={handleReassignTask}
            onSelectEmployee={setSelectedEmployeeId}
            selectedEmployee={selectedEmployee}
            selectedEmployeeTasks={selectedEmployeeTasks}
            selectedEmployeeId={selectedEmployeeId}
            setTaskAssigneeId={setTaskAssigneeId}
            setDragTaskId={setDragTaskId}
            setDropEmployeeId={setDropEmployeeId}
            setDropStatus={setDropStatus}
            taskAssigneeId={taskAssigneeId}
            teamMembers={teamMembers}
            tasks={visibleTasks}
          />
        ) : (
          <EmployeeBoard
            currentUser={currentUser}
            dragTaskId={dragTaskId}
            dropStatus={dropStatus}
            memberLookup={memberLookup}
            onMoveTaskStatus={handleMoveTaskStatus}
            setDragTaskId={setDragTaskId}
            setDropStatus={setDropStatus}
            tasks={visibleTasks}
          />
        )
      ) : (
        <CalendarBoard tasks={visibleTasks} memberLookup={memberLookup} />
      )}
    </main>
  );
}

function AuthScreen({
  authMode,
  errorMessage,
  onEmployerSignup,
  onLogin,
  onModeChange,
  statusMessage,
}: {
  authMode: AuthMode;
  errorMessage: string;
  onEmployerSignup: (event: FormEvent<HTMLFormElement>) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: AuthMode) => void;
  statusMessage: string;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup">
          <span className="brand-mark">O</span>
          <div>
            <p className="eyebrow">Operion OS</p>
            <h1>Project management MVP</h1>
          </div>
        </div>

        <p className="auth-copy">
          Employer signup creates the workspace. Employees are added only by the employer with name, designation, email,
          and password.
        </p>

        <div className="mode-switch compact">
          <button className={authMode === "signup" ? "active" : ""} type="button" onClick={() => onModeChange("signup")}>
            Employer signup
          </button>
          <button className={authMode === "signin" ? "active" : ""} type="button" onClick={() => onModeChange("signin")}>
            Sign in
          </button>
        </div>

        {authMode === "signup" ? (
          <form className="stack" onSubmit={onEmployerSignup}>
            <input name="companyName" placeholder="Company name" required />
            <input name="employerName" placeholder="Your name" required />
            <input name="email" type="email" placeholder="Employer email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button className="primary-button" type="submit">
              Create employer account
              <ArrowRightLeft size={16} />
            </button>
          </form>
        ) : (
          <form className="stack" onSubmit={onLogin}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button className="primary-button" type="submit">
              Sign in
              <ArrowRightLeft size={16} />
            </button>
          </form>
        )}

        {errorMessage && <div className="banner error">{errorMessage}</div>}
        {statusMessage && <div className="banner success">{statusMessage}</div>}

        <p className="auth-note">No employee signup screen, no duplicate accounts, and no extra features beyond the MVP.</p>
      </section>
    </main>
  );
}

function EmployerBoard({
  dragTaskId,
  dropEmployeeId,
  dropStatus,
  memberLookup,
  onCreateTask,
  onInviteEmployee,
  onMoveTaskStatus,
  onReassignTask,
  onSelectEmployee,
  selectedEmployee,
  selectedEmployeeTasks,
  selectedEmployeeId,
  setTaskAssigneeId,
  setDragTaskId,
  setDropEmployeeId,
  setDropStatus,
  taskAssigneeId,
  teamMembers,
  tasks,
}: {
  dragTaskId: string | null;
  dropEmployeeId: string | null;
  dropStatus: TaskStatus | null;
  memberLookup: Map<string, UserRecord>;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  onInviteEmployee: (event: FormEvent<HTMLFormElement>) => void;
  onMoveTaskStatus: (taskId: string, status: TaskStatus) => void;
  onReassignTask: (taskId: string, employeeId: string) => void;
  onSelectEmployee: (employeeId: string) => void;
  selectedEmployee: UserRecord | null;
  selectedEmployeeTasks: TaskRecord[];
  selectedEmployeeId: string;
  setTaskAssigneeId: (employeeId: string) => void;
  setDragTaskId: (taskId: string | null) => void;
  setDropEmployeeId: (employeeId: string | null) => void;
  setDropStatus: (status: TaskStatus | null) => void;
  taskAssigneeId: string;
  teamMembers: UserRecord[];
  tasks: TaskRecord[];
}) {
  return (
    <section className="board-stack">
      <div className="dual-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Add task</p>
              <h2>Assign work to the team</h2>
            </div>
            <Plus size={18} />
          </div>
          <form className="stack" onSubmit={onCreateTask}>
            <input name="title" placeholder="Task title" required />
            <textarea name="description" placeholder="Task details" rows={3} required />
            <div className="two-col">
              <input name="assignedDate" type="date" defaultValue={isoToday()} required />
              <input name="dueDate" type="date" required />
            </div>
            <select
              name="employeeId"
              value={taskAssigneeId}
              onChange={(event) => setTaskAssigneeId(event.target.value)}
              required
            >
              <option value="" disabled>
                Select employee
              </option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.designation}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit" disabled={teamMembers.length === 0}>
              Add task
              <Plus size={16} />
            </button>
          </form>
          {teamMembers.length === 0 && <p className="muted-copy">Invite at least one employee before creating tasks.</p>}
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Invite employee</p>
              <h2>Add team members</h2>
            </div>
            <UserPlus size={18} />
          </div>
          <form className="stack" onSubmit={onInviteEmployee}>
            <input name="name" placeholder="Employee name" required />
            <input name="designation" placeholder="Designation" required />
            <input name="email" type="email" placeholder="Employee email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button className="secondary-button" type="submit">
              Add employee
              <UserPlus size={16} />
            </button>
          </form>
        </article>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Team</p>
            <h2>Employee cards</h2>
          </div>
          <div className="panel-note">Drop a task card on a team card to reassign it.</div>
        </div>

        <div className="employee-grid">
          {teamMembers.length === 0 ? (
            <div className="empty-state">No employees yet. Use the invite form above.</div>
          ) : (
            teamMembers.map((member) => {
              const memberTasks = tasks.filter((task) => task.employeeId === member.id);
              const isSelected = selectedEmployeeId === member.id;
              const isDropTarget = dropEmployeeId === member.id && Boolean(dragTaskId);

              return (
                <button
                  className={`employee-card ${isSelected ? "active" : ""} ${isDropTarget ? "drop-active" : ""}`}
                  key={member.id}
                  type="button"
                  onClick={() => onSelectEmployee(member.id)}
                  onDragOver={(event) => {
                    if (!dragTaskId) return;
                    event.preventDefault();
                    setDropEmployeeId(member.id);
                  }}
                  onDragLeave={() => {
                    if (dropEmployeeId === member.id) setDropEmployeeId(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragTaskId) onReassignTask(dragTaskId, member.id);
                    setDragTaskId(null);
                    setDropEmployeeId(null);
                    setDropStatus(null);
                  }}
                >
                  <span className="employee-avatar">{initials(member.name)}</span>
                  <div className="employee-body">
                    <strong>{member.name}</strong>
                    <span>{member.designation}</span>
                    <small>
                      {memberTasks.length} task{memberTasks.length === 1 ? "" : "s"}
                    </small>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedEmployee && (
          <div className="employee-detail">
            <div className="panel-head tight">
              <div>
                <p className="eyebrow">Employee detail</p>
                <h3>
                  {selectedEmployee.name} · {selectedEmployee.designation}
                </h3>
              </div>
            </div>
            <div className="task-mini-list">
              {selectedEmployeeTasks.length === 0 ? (
                <div className="empty-state small">No tasks assigned to this employee yet.</div>
              ) : (
                selectedEmployeeTasks.map((task) => (
                  <div key={task.id} className="task-mini">
                    <strong>{task.title}</strong>
                    <span>{statusLabel(task.status)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Task board</p>
            <h2>Move work across statuses</h2>
          </div>
          <div className="panel-note">Drag cards between the three columns. You can also reassign them from the employee cards above.</div>
        </div>

        <div className="task-board">
          {TASK_COLUMNS.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            const isDropTarget = dropStatus === column.status && Boolean(dragTaskId);

            return (
              <section
                className={`task-column ${isDropTarget ? "drop-active" : ""}`}
                key={column.status}
                onDragOver={(event) => {
                  if (!dragTaskId) return;
                  event.preventDefault();
                  setDropStatus(column.status);
                }}
                onDragLeave={() => {
                  if (dropStatus === column.status) setDropStatus(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragTaskId) onMoveTaskStatus(dragTaskId, column.status);
                  setDragTaskId(null);
                  setDropStatus(null);
                  setDropEmployeeId(null);
                }}
              >
                <div className="column-head">
                  <h3>{column.title}</h3>
                  <span>{columnTasks.length}</span>
                </div>

                <div className="task-list">
                  {columnTasks.length === 0 ? (
                    <div className="empty-state small">Drop tasks here</div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        assignee={memberLookup.get(task.employeeId)}
                        onDragStart={() => setDragTaskId(task.id)}
                        onDragEnd={() => {
                          setDragTaskId(null);
                          setDropStatus(null);
                          setDropEmployeeId(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function EmployeeBoard({
  currentUser,
  dragTaskId,
  dropStatus,
  memberLookup,
  onMoveTaskStatus,
  setDragTaskId,
  setDropStatus,
  tasks,
}: {
  currentUser: UserRecord;
  dragTaskId: string | null;
  dropStatus: TaskStatus | null;
  memberLookup: Map<string, UserRecord>;
  onMoveTaskStatus: (taskId: string, status: TaskStatus) => void;
  setDragTaskId: (taskId: string | null) => void;
  setDropStatus: (status: TaskStatus | null) => void;
  tasks: TaskRecord[];
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Employee view</p>
          <h2>{currentUser.name}’s kanban board</h2>
        </div>
        <div className="panel-note">Drag tasks between assigned, ongoing, and completed.</div>
      </div>

      <div className="task-board">
        {TASK_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          const isDropTarget = dropStatus === column.status && Boolean(dragTaskId);

          return (
            <section
              className={`task-column ${isDropTarget ? "drop-active" : ""}`}
              key={column.status}
              onDragOver={(event) => {
                if (!dragTaskId) return;
                event.preventDefault();
                setDropStatus(column.status);
              }}
              onDragLeave={() => {
                if (dropStatus === column.status) setDropStatus(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragTaskId) onMoveTaskStatus(dragTaskId, column.status);
                setDragTaskId(null);
                setDropStatus(null);
              }}
            >
              <div className="column-head">
                <h3>{column.title}</h3>
                <span>{columnTasks.length}</span>
              </div>

              <div className="task-list">
                {columnTasks.length === 0 ? (
                  <div className="empty-state small">Drop tasks here</div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assignee={memberLookup.get(task.employeeId)}
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => {
                        setDragTaskId(null);
                        setDropStatus(null);
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function CalendarBoard({
  memberLookup,
  tasks,
}: {
  memberLookup: Map<string, UserRecord>;
  tasks: TaskRecord[];
}) {
  const days = useMemo(() => buildCalendarDays(tasks), [tasks]);
  const gridTemplateColumns = `220px repeat(${days.length}, minmax(72px, 1fr))`;

  if (tasks.length === 0) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Calendar</p>
            <h2>No tasks yet</h2>
          </div>
          <CalendarDays size={18} />
        </div>
        <div className="empty-state">Create tasks first so the calendar can show their date range.</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Task timeline</h2>
        </div>
        <CalendarDays size={18} />
      </div>

      <div className="calendar-wrap">
        <div className="calendar-grid calendar-header" style={{ gridTemplateColumns }}>
          <div className="calendar-corner">Task</div>
          {days.map((day) => (
            <div className="calendar-day-head" key={day.iso}>
              <strong>{day.label}</strong>
              <span>{day.shortDate}</span>
            </div>
          ))}
        </div>

        <div className="calendar-body" style={{ gridTemplateColumns }}>
          {tasks.map((task, index) => {
            const startIndex = dayIndex(task.assignedDate, days[0].iso) + 2;
            const endIndex = dayIndex(task.dueDate, days[0].iso) + 3;
            return (
              <div
                className="calendar-row"
                key={task.id}
                style={{ gridColumn: "1 / -1", gridRow: index + 1 }}
              >
                <div className="calendar-task-label">
                  <strong>{task.title}</strong>
                  <span>{memberLookup.get(task.employeeId)?.name ?? "Unassigned"}</span>
                </div>
                <div
                  className="calendar-task-bar"
                  style={
                    {
                      gridColumn: `${startIndex} / ${endIndex}`,
                      background: deadlineGradient(task.assignedDate, task.dueDate),
                    } as CSSProperties
                  }
                >
                  <span>{task.title}</span>
                  <small>
                    {formatCalendarDate(task.assignedDate)} - {formatCalendarDate(task.dueDate)}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TaskCard({
  assignee,
  onDragEnd,
  onDragStart,
  task,
}: {
  assignee: UserRecord | undefined;
  onDragEnd: () => void;
  onDragStart: () => void;
  task: TaskRecord;
}) {
  return (
    <article
      className={`task-card ${task.status}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-top">
        <span className={`status-pill ${task.status}`}>{statusLabel(task.status)}</span>
        <GripVertical size={16} />
      </div>
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <div className="task-meta">
        <span>{assignee ? `${assignee.name} · ${assignee.designation}` : "No assignee"}</span>
        <span>{formatCalendarDate(task.dueDate)}</span>
      </div>
    </article>
  );
}

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadValue(key, fallback));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function loadValue<T>(key: string, fallback: T) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function findUser(users: UserRecord[], email: string) {
  return users.find((user) => user.email === normalizeEmail(email)) ?? null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createId() {
  return crypto.randomUUID();
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function buildCalendarDays(tasks: TaskRecord[]) {
  const fallbackStart = parseDate(isoToday());
  if (tasks.length === 0) {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(fallbackStart, index);
      return buildCalendarDay(date);
    });
  }

  const start = tasks.reduce((lowest, task) => {
    const assigned = parseDate(task.assignedDate);
    return assigned.getTime() < lowest.getTime() ? assigned : lowest;
  }, parseDate(tasks[0].assignedDate));

  const end = tasks.reduce((highest, task) => {
    const due = parseDate(task.dueDate);
    return due.getTime() > highest.getTime() ? due : highest;
  }, parseDate(tasks[0].dueDate));

  const days: { iso: string; label: string; shortDate: string }[] = [];
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - 1);
  const finalDay = addDays(end, 1);

  while (cursor <= finalDay) {
    days.push(buildCalendarDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildCalendarDay(date: Date) {
  return {
    iso: date.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    shortDate: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
  };
}

function dayIndex(value: string, startIso: string) {
  const start = parseDate(startIso);
  const current = parseDate(value);
  return Math.max(0, Math.round((current.getTime() - start.getTime()) / 86400000));
}

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseDate(value));
}

function deadlineGradient(assignedDate: string, dueDate: string) {
  const start = parseDate(assignedDate);
  const due = parseDate(dueDate);
  const today = parseDate(isoToday());
  const total = Math.max(1, due.getTime() - start.getTime());
  const progress = Math.min(1, Math.max(0, (today.getTime() - start.getTime()) / total));
  const hue = 120 - progress * 120;
  return `linear-gradient(90deg, hsl(${hue} 70% 42%), hsl(${Math.max(0, hue - 10)} 72% 34%))`;
}

function statusLabel(status: TaskStatus) {
  if (status === "assigned") return "Assigned";
  if (status === "ongoing") return "Ongoing";
  return "Completed";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default MvpApp;
