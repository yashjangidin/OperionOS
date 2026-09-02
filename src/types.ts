import type { FormEvent } from "react";

export type TaskStatus = "assigned" | "in-progress" | "completed";
export type Priority = "low" | "medium" | "high" | "urgent";
export type UserRole = "employer" | "employee";

export type Client = {
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

export type TeamMember = {
  id: string;
  name: string;
  role: "Employer" | "Manager" | "Employee" | "Client Viewer";
  email: string;
  avatar: string;
};

export type TeamInvite = {
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

export type TemplateTask = {
  id: string;
  title: string;
  description: string;
  suggestedDays: number;
  checklist: string[];
};

export type WorkTemplate = {
  id: string;
  name: string;
  category: string;
  color: string;
  tasks: TemplateTask[];
};

export type Task = {
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

export type KnowledgeItem = {
  id: string;
  clientId: string;
  type: "PDF" | "Doc" | "Transcript" | "URL";
  title: string;
  source: string;
};

export type AuthAccount = {
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

export type AgencyProfile = {
  name: string;
  agencyType: string;
  size: string;
  description: string;
  primaryServices: string[];
  defaultWorkflow: string;
  firstGoal: string;
};

export type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;
