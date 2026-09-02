import { CalendarDays, MessageCircle } from "lucide-react";
import { CalendarBoard, KanbanColumn, Panel } from "../components/workspace";
import type { Client, Task, TaskStatus, TeamMember } from "../types";
import { buildEmployeeDigest } from "../utils/digests";

type EmployeeWorkspaceProps = {
  calendarDays: { iso: string; day: string; date: string; tasks: Task[] }[];
  clients: Client[];
  currentEmployee: TeamMember;
  employeeTasks: Task[];
  moveTask: (taskId: string, status: TaskStatus) => void;
};

export function EmployeeWorkspace({
  calendarDays,
  clients,
  currentEmployee,
  employeeTasks,
  moveTask,
}: EmployeeWorkspaceProps) {
  return (
    <>
      <section className="kanban-section employee-workspace">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Employee side</p>
            <h2>{currentEmployee.name}'s task board</h2>
            <p>Only your assigned work is shown here. Move cards as your status changes.</p>
          </div>
        </div>
        <div className="kanban">
          {(["assigned", "in-progress", "completed"] as TaskStatus[]).map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={employeeTasks.filter((task) => task.status === status)}
              clients={clients}
              onDropTask={moveTask}
            />
          ))}
        </div>
      </section>

      <section className="employee-grid">
        <Panel title="My calendar" icon={<CalendarDays />}>
          <CalendarBoard days={calendarDays} clients={clients} />
        </Panel>

        <Panel title="Today summary" icon={<MessageCircle />}>
          <div className="employee-summary">
            <span className="avatar">{currentEmployee.avatar}</span>
            <div>
              <p className="eyebrow">Signed in as employee</p>
              <h3>{currentEmployee.name}</h3>
              <p>
                {employeeTasks.filter((task) => task.status !== "completed").length} active task(s),{" "}
                {employeeTasks.filter((task) => task.priority === "urgent" || task.priority === "high").length} high
                priority item(s).
              </p>
            </div>
          </div>
          <pre className="employee-digest">{buildEmployeeDigest(employeeTasks)}</pre>
        </Panel>
      </section>
    </>
  );
}

