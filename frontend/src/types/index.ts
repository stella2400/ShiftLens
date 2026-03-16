export type User = {
  id: number;
  email: string;
  full_name: string;
  employee_code: string;
  ward_name?: string | null;
};

export type Shift = {
  id: number;
  shift_date: string;
  shift_code: "M" | "P" | "N" | "S" | "R" | "ASS";
  shift_label: string;
  notes?: string | null;
};

export type Upload = {
  id: number;
  month_label: string;
  original_filename: string;
  processing_status: string;
  source_note?: string | null;
  created_at: string;
};

export type DashboardResponse = {
  user: User;
  summary: {
    total_days: number;
    work_days: number;
    rest_days: number;
    night_shifts: number;
    morning_shifts: number;
    afternoon_shifts: number;
    smonto_days: number;
  };
  shifts: Shift[];
  uploads: Upload[];
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};
