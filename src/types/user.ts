
export interface User {
  id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  role?: 'admin' | 'user';
  phone?: string;
  address?: string;
  bio?: string;
  business_address?: string;
  company_description?: string;
  website?: string;
  [key: string]: any;
}
