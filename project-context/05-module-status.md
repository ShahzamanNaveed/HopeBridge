# Module status

| Module       | Frontend                  | Backend               | Business tests/deployment       |
| ------------ | ------------------------- | --------------------- | ------------------------------- |
| auth         | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| users        | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| branches     | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| applications | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| members      | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| collections  | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| reports      | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| dashboard    | Public shell preview only | Placeholder directory | Not implemented/tested/deployed |
| content      | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |
| audit        | Placeholder directory     | Placeholder directory | Not implemented/tested/deployed |

Infrastructure has real code and tests; see 09-testing-status. Public page shells do not imply completed content management or branch functionality.

## Documentation versus implementation baseline (2026-10-28)

All 27 role/public workflows documented; approved policy families: SA-001 to SA-008; HR-001 to HR-010; HWF-XM-001 to HWF-XM-004; BL-001 to BL-005; FIN-001 to FIN-018; AUTH-001 to AUTH-006; WR-001 to WR-006; APP-001 to APP-008; CE-001 to CE-005; CMS-001 to CMS-007; PERM-001 to PERM-005; EXP-001 to EXP-004. [Decision log](06-decisions-log.md) and [permissions](../docs/permissions.md) govern the baseline; architecture/API/database now define shared integration contracts. This changes documentation status only; every business implementation/test/deployment cell above remains accurate.

One shared audit implementation, single-owner-at-a-time business schema/migrations and reviewed domain transport/transaction ports are prerequisites for protected integration. Auth/users remain separate from members; collections owns financial sources/accounting and reports owns canonical reports/revisions/snapshots; dashboard/export reads canonical projections. See [architecture](../docs/architecture.md) and [handoff plan](04-development-roadmap.md).

Foundation source exists, schema defines only FoundationMarker and business modules/permission acceptance tests remain unimplemented. Official fixture gate, live Render and latest green main CI are NOT VERIFIED. [Member specification gaps](modules/members.md) and other [classified pending paths](../docs/requirements/clarifications.md) remain; choosing a nonessential library does not block unrelated core implementation. Documentation freeze is a change-reviewed baseline, not implemented/tested/deployed completion.
