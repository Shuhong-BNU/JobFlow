import type {
  ApplicationPriority,
  ApplicationSource,
  ApplicationStatus,
  EmploymentType,
  EventStatus,
  EventType,
  MaterialPurpose,
  MaterialType,
  NoteType,
  OfferDecisionStatus,
} from "@/lib/constants";

export type ApplicationListFilter = {
  query?: string;
  status?: ApplicationStatus | "all";
  priority?: ApplicationPriority | "all";
  sort?: "deadline_asc" | "deadline_desc" | "updated_desc";
};

export type ApplicationListItem = {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  department: string | null;
  location: string | null;
  currentStatus: ApplicationStatus;
  priority: ApplicationPriority;
  deadlineAt: Date | null;
  appliedAt: Date | null;
  updatedAt: Date;
  source: ApplicationSource;
  employmentType: EmploymentType;
};

export type ApplicationEventItem = {
  id: string;
  eventType: EventType;
  title: string;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  reminderAt: Date | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationNoteItem = {
  id: string;
  noteType: NoteType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationMaterialItem = {
  id: string;
  materialId: string;
  purpose: MaterialPurpose;
  createdAt: Date;
  name: string;
  type: MaterialType;
  version: string;
  fileUrl: string;
  tags: string[];
  notes: string | null;
};

export type ApplicationDetail = {
  id: string;
  companyId: string;
  companyName: string;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companyLocation: string | null;
  title: string;
  department: string | null;
  location: string | null;
  source: ApplicationSource;
  sourceUrl: string | null;
  employmentType: EmploymentType;
  deadlineAt: Date | null;
  appliedAt: Date | null;
  currentStatus: ApplicationStatus;
  priority: ApplicationPriority;
  salaryRange:
    | {
        min?: number;
        max?: number;
        currency?: string;
        period?: "monthly" | "yearly";
      }
    | null
    | undefined;
  referralName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  events: ApplicationEventItem[];
  detailNotes: ApplicationNoteItem[];
  materials: ApplicationMaterialItem[];
  offer:
    | {
        id: string;
        location: string | null;
        team: string | null;
        responseDeadlineAt: Date | null;
        decisionStatus: OfferDecisionStatus;
        baseSalary: number | null;
        bonus: number | null;
        pros: string | null;
        cons: string | null;
        updatedAt: Date;
      }
    | null;
};

export type ApplicationOption = {
  id: string;
  companyName: string;
  title: string;
  currentStatus: ApplicationStatus;
};
