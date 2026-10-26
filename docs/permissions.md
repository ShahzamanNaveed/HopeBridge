# Permission matrix - pending approval

## Official Requirements

Exactly five authenticated roles with server-enforced permissions and branch isolation.

## Confirmed HWF Decisions

| Role             | Primary responsibility                                         |
| ---------------- | -------------------------------------------------------------- |
| Super Admin      | Users, branches and overall administration                     |
| Finance Reviewer | Approve/return weekly reports and monitor unsent collections   |
| Content Editor   | Manage and publish public website content                      |
| Branch Lead      | Manage assigned branch members, collections and weekly reports |
| HR Lead          | Review and accept/decline volunteer applications               |

No separate Head Office Admin role. HR operations are centralized at Head Office initially. Volunteers are member records, not another login role; public visitors need no authentication. Staff accounts are provisioned through an authorized administrative process.

## Pending Decisions

Responsibilities do not constitute a complete action-level permission matrix. Exact grants and cross-branch boundaries remain pending; the table below does not negate the confirmed responsibilities.

| Resource/workflow              | Super Admin | Finance Reviewer | Content Editor | Branch Lead | HR Lead |
| ------------------------------ | ----------- | ---------------- | -------------- | ----------- | ------- |
| Branch lifecycle               | Pending     | Pending          | Pending        | Pending     | Pending |
| Volunteer/HR decisions         | Pending     | Pending          | Pending        | Pending     | Pending |
| Collections and weekly reports | Pending     | Pending          | Pending        | Pending     | Pending |
| Content draft/publish          | Pending     | Pending          | Pending        | Pending     | Pending |
| Audit access                   | Pending     | Pending          | Pending        | Pending     | Pending |

Pending is not a grant. Default deny once authorization is introduced. Verify each approved action and forbidden role/branch combination with integration tests.
