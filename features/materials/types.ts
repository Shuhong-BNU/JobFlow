import type { MaterialPurpose, MaterialType } from "@/lib/constants";

export type MaterialListFilter = {
  query?: string;
  type?: MaterialType | "all";
};

export type MaterialListItem = {
  id: string;
  type: MaterialType;
  name: string;
  fileUrl: string;
  version: string;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MaterialAttachmentItem = {
  id: string;
  applicationId: string;
  materialId: string;
  purpose: MaterialPurpose;
  createdAt: Date;
  materialName: string;
  materialType: MaterialType;
  version: string;
  fileUrl: string;
  tags: string[];
  applicationTitle?: string;
  companyName?: string;
};

export type MaterialDetail = MaterialListItem & {
  attachments: MaterialAttachmentItem[];
};
