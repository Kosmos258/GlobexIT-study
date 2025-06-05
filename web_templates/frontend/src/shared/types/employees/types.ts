export type Department = {
  id: number;
  name: string;
  parentId: number | null;
};

export type Employee = {
  id: number;
  name: string;
  department: string;
};

export type ChangeHistory = {
  change_id: number;
  position_name: string;
  department: string;
  organization: string;
  change_date: string;
};

export type StateHistory = {
  code_id: number;
  state_id: string;
  start_date: string;
  finish_date: string;
  komment: string;
};
