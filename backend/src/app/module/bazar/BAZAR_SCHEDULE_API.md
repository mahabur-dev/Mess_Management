# Bazar Duty Schedule API

Base URL: `/api/v1/bazar`

The existing bazar shopping-entry endpoints are unchanged. These endpoints manage monthly duty scheduling.

## Lifecycle

1. The mess manager saves repeating settings with `PUT /schedule-settings/:messId`, or includes `bazarScheduleSettings` while creating a mess.
2. The manager generates the current month with `POST /schedules/generate`.
3. Generation snapshots the settings. Editing repeating settings later never changes an already generated month.
4. When a new month is generated, the previous active schedule becomes `FINISHED` and the new schedule becomes `ACTIVE`.
5. Each bazar date contains one or more independent duty slots. A member may hold at most one slot on the same date.

## Settings payload

```json
{
  "frequency": "SPECIFIC_WEEKDAYS",
  "weekdays": [0, 2, 5],
  "customDays": [],
  "defaultMembersPerDate": 2,
  "dutyLimit": 3,
  "includeManager": false,
  "releaseNoticeDays": 5,
  "strictFairness": false
}
```

Weekdays use `0=Sunday` through `6=Saturday`. With `CUSTOM_DATES`, `customDays` repeats every month until settings change. `EVERY_DAY` ignores both arrays.

## Routes

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| PUT | `/schedule-settings/:messId` | Manager | Save repeating settings |
| GET | `/schedule-settings/:messId` | Mess user | Read settings |
| POST | `/schedules/generate` | Manager | Generate current month |
| GET | `/schedules/mess/:messId?year=&month=` | Mess user | Calendar, slots, totals, distribution |
| GET | `/schedules/mess/:messId/history` | Mess user | Monthly version history |
| POST | `/schedules/:scheduleId/dates` | Manager | Add a date with a reason |
| PATCH | `/schedule-dates/:dateId/status` | Manager | Open/close an unassigned date |
| PATCH | `/schedule-dates/:dateId/capacity` | Manager | Override people required on one date |
| POST | `/duty-slots/:slotId/claim` | Eligible member | Claim an available slot |
| POST | `/duty-slots/:slotId/assign` | Manager | Assign/reassign, with limit-bypass warning |
| POST | `/duty-slots/:slotId/unassign` | Manager | Immediately unassign with a reason |
| POST | `/duty-slots/:slotId/release` | Assigned member | Auto-release or request approval |
| GET | `/release-requests/mess/:messId` | Mess user | Visible release requests |
| PATCH | `/release-requests/:requestId/respond` | Manager | Approve/reject late release |
| POST | `/swap-requests` | Assigned member | Request a direct two-date swap |
| GET | `/swap-requests/mess/:messId` | Mess user | Visible swap requests |
| PATCH | `/swap-requests/:requestId/respond` | Target member | Accept/decline swap |
| PATCH | `/swap-requests/:requestId/cancel` | Requester | Cancel pending swap |

Request lists accept an optional `status=PENDING|APPROVED|REJECTED|CANCELLED` query.

## Important rules

- Schedule generation is restricted to the current Dhaka calendar month.
- Past dates are locked. Current-day swaps remain allowed.
- Claims enforce the common monthly `dutyLimit`; manager assignment may bypass it and returns a warning.
- If strict fairness is enabled, a member cannot move more than one duty ahead of the least-assigned eligible member.
- Release with at least `releaseNoticeDays` notice is automatic. Later release remains assigned until manager approval.
- Swap acceptance atomically exchanges the two assignees and does not need manager approval.
- Slot claiming and schedule generation use serializable transactions plus database uniqueness constraints.
- Business mutations create audit-log records. Relevant requests and decisions create in-app and push notifications.
