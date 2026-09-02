import type { Task, TeamMember } from "../types";

export function buildEmployeeDigest(tasks: Task[]) {
  const assigned = tasks.filter((task) => task.status !== "completed");
  return `Good morning team.\n\nToday's tasks:\n${assigned
    .map((task, index) => `${index + 1}. ${task.title} - ${task.status} - due ${task.dueDate}`)
    .join("\n")}\n\nPlease update your board before end of day.`;
}

export function buildClientDigest(tasks: Task[], members: TeamMember[]) {
  const completed = tasks.filter((task) => task.status === "completed");
  const remaining = tasks.filter((task) => task.status !== "completed");
  const assigneeName = (id: string) => members.find((member) => member.id === id)?.name ?? "Unassigned";
  return `Daily client update\n\nCompleted:\n${completed
    .map((task) => `- ${task.title} (${assigneeName(task.assigneeId)})`)
    .join("\n") || "- No tasks completed yet"}\n\nRemaining:\n${remaining
    .map((task) => `- ${task.title} assigned to ${assigneeName(task.assigneeId)} (${task.status})`)
    .join("\n")}`;
}

