import type { ApplicationStatus, OfferDecisionStatus } from "@/lib/constants";

export type OfferListFilter = {
  decisionStatus?: OfferDecisionStatus | "all";
};

export type OfferListItem = {
  id: string;
  applicationId: string;
  companyName: string;
  applicationTitle: string;
  applicationStatus: ApplicationStatus;
  baseSalary: number | null;
  bonus: number | null;
  location: string | null;
  team: string | null;
  responseDeadlineAt: Date | null;
  decisionStatus: OfferDecisionStatus;
  pros: string | null;
  cons: string | null;
  updatedAt: Date;
};
