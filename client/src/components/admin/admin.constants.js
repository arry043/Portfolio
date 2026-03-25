import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Medal,
  Users,
} from 'lucide-react';

export const adminNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: BarChart3 },
  { label: 'Manage Resume', to: '/admin/resume', icon: FileText },
  { label: 'Manage Certificates', to: '/admin/certificates', icon: Medal },
  { label: 'Manage Projects', to: '/admin/projects', icon: FolderKanban },
  { label: 'Experiences', to: '/admin/experiences', icon: BriefcaseBusiness },
  { label: 'User Management', to: '/admin/users', icon: Users },
];
