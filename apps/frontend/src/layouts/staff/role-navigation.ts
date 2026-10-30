import type { StaffRole } from '@shiplens/contracts';
export const roleRoots: Record<StaffRole, string> = {
  SUPER_ADMIN: '/staff/super-admin',
  HR_LEAD: '/staff/hr',
  BRANCH_LEAD: '/staff/branch',
  FINANCE_REVIEWER: '/staff/finance',
  CONTENT_EDITOR: '/staff/content',
};
export const roleMenus = {
  SUPER_ADMIN: [
    'dashboard',
    'staff-accounts',
    'branches',
    'lead-assignments',
    'audit',
  ],
  HR_LEAD: ['dashboard', 'applications', 'members', 'transfers', 'hr-activity'],
  BRANCH_LEAD: [
    'dashboard',
    'branch-members',
    'teams',
    'transfer-requests',
    'collections',
    'remittances',
    'weekly-reports',
  ],
  FINANCE_REVIEWER: [
    'dashboard',
    'weekly-reports',
    'adjustments',
    'remittances',
    'financial-overview',
    'exports',
  ],
  CONTENT_EDITOR: [
    'dashboard',
    'programs',
    'events',
    'public-pages',
    'publishing',
  ],
} as const satisfies Record<StaffRole, readonly string[]>;
export type NavigationKey = (typeof roleMenus)[StaffRole][number];
export function navigationPath(role: StaffRole, key: string) {
  return roleRoots[role] + (key === 'dashboard' ? '' : `/${key}`);
}
export const dashboardConfig = {
  SUPER_ADMIN: {
    frame: '1:300',
    cards: [
      'totalBranches',
      'activeBranches',
      'activeStaff',
      'attentionBranches',
    ],
    panels: [
      'branchStatus',
      'staffDistribution',
      'adminActivity',
      'recentBranches',
    ],
    actions: [
      ['addStaff', 'staff-accounts'],
      ['createBranch', 'branches'],
      ['assignLead', 'lead-assignments'],
      ['viewAudit', 'audit'],
    ],
  },
  HR_LEAD: {
    frame: '1:390',
    cards: [
      'totalApplications',
      'pendingApplications',
      'activeMembers',
      'pendingTransfers',
    ],
    panels: [
      'recentApplications',
      'applicationStatus',
      'memberActivity',
      'transfersAwaiting',
    ],
    actions: [
      ['reviewApplications', 'applications'],
      ['viewMembers', 'members'],
      ['reviewTransfers', 'transfers'],
    ],
  },
  BRANCH_LEAD: {
    frame: '1:478',
    cards: [
      'activeMembers',
      'weekCollections',
      'outstandingRemittance',
      'reportStatus',
    ],
    panels: [
      'recentCollections',
      'memberActivity',
      'currentReport',
      'remittanceActivity',
    ],
    actions: [
      ['recordCollection', 'collections'],
      ['reviewReport', 'weekly-reports'],
      ['viewMembers', 'branch-members'],
      ['requestTransfer', 'transfer-requests'],
    ],
  },
  FINANCE_REVIEWER: {
    frame: '1:572',
    cards: [
      'totalCollections',
      'outstandingRemittances',
      'confirmedRemittances',
      'reportsAwaiting',
    ],
    panels: [
      'collectionTrends',
      'branchFinancial',
      'pendingReports',
      'financialActivity',
    ],
    actions: [
      ['reviewReports', 'weekly-reports'],
      ['reviewAdjustments', 'adjustments'],
      ['confirmRemittance', 'remittances'],
      ['exportReport', 'exports'],
    ],
  },
  CONTENT_EDITOR: {
    frame: '1:664',
    cards: [
      'publishedPrograms',
      'publishedEvents',
      'draftContent',
      'recentlyPublished',
    ],
    panels: [
      'recentContent',
      'draftsAwaiting',
      'publicationActivity',
      'contentStatus',
    ],
    actions: [
      ['createProgram', 'programs'],
      ['createEvent', 'events'],
      ['editPage', 'public-pages'],
      ['viewDrafts', 'publishing'],
    ],
  },
} as const;
