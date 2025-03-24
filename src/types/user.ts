
export interface User {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  role?: 'admin' | 'user';
  [key: string]: any;
}
