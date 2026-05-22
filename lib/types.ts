export type Customer = {
  id: string;
  owner_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

export type Worker = {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
};

export type Job = {
  id: string;
  owner_id: string;
  customer_id: string;
  worker_id: string | null;
  title: string;
  address: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  frequency: "once" | "weekly" | "biweekly" | "monthly";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  created_at: string;
  customer?: Customer;
  worker?: Worker;
};

export type ChecklistItem = {
  id: string;
  job_id: string;
  owner_id: string;
  label: string;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
};

export type JobPhoto = {
  id: string;
  job_id: string;
  owner_id: string;
  storage_path: string;
  photo_type: "before" | "after";
  uploaded_at: string;
};
