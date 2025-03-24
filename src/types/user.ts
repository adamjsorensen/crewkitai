
export interface User {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  user_roles?: {
    role: 'admin' | 'moderator' | 'user';
  }[];
  [key: string]: any;
}
