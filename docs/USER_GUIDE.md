# Tether User Guide

## The basics

Everything in the project is a **work item** with a typed ID: tasks (TASK-3),
features (FEAT-1), requirements (REQ-41), decisions (DEC-12), risks (RISK-8),
blockers (BLK-2), access requests (ACC-5), meeting notes (MTG-14), ideas, open
questions, defects, and research notes.

Create items with the **New item** button, `C` from the sidebar, or `Ctrl+K` →
"Create …". Click any row to open it.

## Navigation

- **Dashboard** — what needs attention: in-progress, blocked, access in flight,
  decisions needed, due/overdue, completed this week, milestone progress, activity.
  The health pill explains exactly why it is green/amber/red — click it.
- **All Work** — filter, group, and sort everything. Quick-change status/priority
  from the list without opening the item.
- **Board** — drag cards between statuses.
- **Roadmap** — milestones and releases with live progress; add/edit both here.
- **Access Tracker / Decisions / Meetings / Risks & Blockers** — purpose-built
  registers of the same items, organized for that job.
- **Reports** — generate leadership updates from live data, edit, copy for
  Teams/email, or save as Markdown. **Presentation mode** opens a full-screen
  walkthrough for screen sharing (←/→/Esc).
- **Activity** — the full change feed.
- **Conflicts** — appears when you and your teammate edited the same text at the
  same time; pick a version or merge by hand. Nothing is ever silently overwritten.

## The editor

Type `/` for blocks (headings, lists, tables, callouts, code, expandable sections),
`@` to mention your teammate, and an item ID like `REQ-1` followed by a space to
create a live **smart link** chip (shows title + status; click to jump). Markdown
shortcuts work (`# `, `- `, `> `, ``` etc.). Saving is automatic — the save state
is always visible in the toolbar.

**Meeting workflow:** write notes in a Meeting item, select any passage, and use the
"Convert selection to…" bar to spin it into a task, decision, risk, blocker,
requirement, access request, question, or idea — automatically linked back to the
meeting.

## Sharing with your teammate

Settings → Collaboration & sync → choose a folder that OneDrive or SharePoint syncs
on **both** computers (the same folder!). That's it. The sync pill in the top bar
shows Synced / pending / offline; offline edits queue and flush automatically.

## Sample data

Sample records carry a SAMPLE badge. Settings → Remove all sample data clears them
(your real records are untouched).

## Safety

- Manual backup: Settings → Back up database now.
- Automatic backup before every app upgrade that changes the database.
- Deleted items keep their history; archiving is preferred for anything you might revisit.
