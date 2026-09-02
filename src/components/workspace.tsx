import { CheckCircle2, Timer } from "lucide-react";
import type { ReactNode } from "react";
import type { Client, Task, TaskStatus } from "../types";

export function IconButton({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <button className={active ? "rail-btn active" : "rail-btn"} title={label}>
      {icon}
    </button>
  );
}

export function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "blue" | "purple" | "green" | "orange";
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="info-line">
      {icon}
      <span>{label}</span>
      <strong>{value || "Not added"}</strong>
    </div>
  );
}

export function CalendarBoard({
  days,
  clients,
}: {
  days: { iso: string; day: string; date: string; tasks: Task[] }[];
  clients: Client[];
}) {
  return (
    <div className="calendar-board">
      {days.map((day) => (
        <article className="calendar-day" key={day.iso}>
          <div className="calendar-day-head">
            <span>{day.day}</span>
            <strong>{day.date}</strong>
          </div>
          <div className="calendar-day-tasks">
            {day.tasks.length === 0 && <p>No tasks</p>}
            {day.tasks.map((task) => (
              <div className={`calendar-task ${task.priority}`} key={task.id}>
                <strong>{task.title}</strong>
                <span>{clients.find((client) => client.id === task.clientId)?.company}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function KanbanColumn({
  status,
  tasks,
  clients,
  onDropTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  clients: Client[];
  onDropTask: (taskId: string, status: TaskStatus) => void;
}) {
  const title = status === "assigned" ? "Assigned" : status === "in-progress" ? "In progress" : "Completed";
  return (
    <div
      className="kanban-column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const taskId = event.dataTransfer.getData("text/task-id");
        if (taskId) onDropTask(taskId, status);
      }}
    >
      <div className="column-title">
        <h3>{title}</h3>
        <span>{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <article
          className={`task-card ${task.priority}`}
          key={task.id}
          draggable
          onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
        >
          <div className="task-top">
            <span>{clients.find((client) => client.id === task.clientId)?.company}</span>
            <strong>{task.priority}</strong>
          </div>
          <h4>{task.title}</h4>
          <p>{task.description}</p>
          <div className="task-meta">
            <span>
              <Timer size={14} />
              {task.dueDate}
            </span>
            <span>
              <CheckCircle2 size={14} />
              {task.checklist.filter((item) => item.done).length}/{task.checklist.length}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

