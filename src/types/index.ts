
export interface Project {
  id: string;
  title: string;
  company: string;
  description: string;
  expectedCloseDate: string;
  createdAt: string;
  notes: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  revenue: string;
  lastContact: string;
  notes: string;
  call_status: 'not_called' | 'answered' | 'no_response' | 'voicemail' | 'busy' | 'wrong_number';
  industry: string;
  website: string;
  ceo: string;
  whose_phone: string;
  go_skip: string;
  createdAt: string;
  scheduled_call?: string; // ISO datetime string for scheduled call
}

export interface Demo {
  id: string;
  title: string;
  description: string;
  leadId?: string;
  projectId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  user_id: string;
  target_type: 'demo' | 'project';
  target_id: string;
  comment: string;
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  lead_id?: string;
  title: string;
  company: string;
  description: string;
  deal_value: number;
  payment_type: 'one_time' | 'monthly';
  monthly_amount: number;
  installation_fee: number;
  contract_length_months: number;
  closed_date: string;
  status: 'active' | 'completed' | 'cancelled';
  salesman_name: string;
  salesman_email: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  description: string;
  leadId: string;
  projectId?: string;
  createdAt: string;
}