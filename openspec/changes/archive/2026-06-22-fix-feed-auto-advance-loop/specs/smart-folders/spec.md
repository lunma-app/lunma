## MODIFIED Requirements

### Requirement: Reading folders are a draining unread queue

A feed (`rss`) folder SHALL be a **draining unread queue**. An item is **unread**
until it is **consumed**; the folder surfaces the newest `maxItems` **unread**
items (see Requirement: Smart folders honour a per-folder maximum item count),
backfilling older unread as items are consumed. An item is **consumed** (marked
**read**) when the user **moves on** from it — NOT when it is merely opened:
opening (`openSmartItem`) binds a tab and keeps the entry in the list (bound,
active, unread); the item is marked read only when its bound tab is **deactivated**
(the user navigates to another tab — per-window, swept in the store's
`setActiveTab`) or **closed** (`onTabRemoved`). **Consume SHALL also close the
tab**: when an entry is consumed by navigating away, its bound (now-inactive) tab
is closed (`chrome.tabs.remove`) so the reading queue leaves no tab trail; the tab
you are actively on is never closed, and an already-read item is never re-closed.
The read set is persisted ids-only and pruned (see the `storage-and-migrations`
capability, Requirement: Smart-folder read-state is persisted and pruned).

**Auto-advance** keeps the reading flow going: when the user **manually closes**
the tab of the UNREAD item they are reading (`onTabRemoved` for an item still
unread at close time), the queue SHALL open the next unread, unbound item in the
**same section** (`nextUnreadFeedItemAfterClose` → `openSmartItem`). Auto-advance
SHALL NOT fire for a **consume=close**: when an item is consumed by navigating
away, the store marks it read BEFORE the SW closes its tab, so an
already-read closing item is the signal that the close is a drain, not a manual
close — advancing there would chase the consume into a runaway drain (consume →
open next → consume → …, emptying the whole section). `nextUnreadFeedItemAfterClose`
therefore SHALL return nothing when the closing item is already read.

The feed's resting state SHALL be **drained** — read rows hidden (the node's
`hideRead` defaults `true`). The sidebar SHALL expose, on a feed folder: a
**"Show recently read"** peek toggled via
`setSmartFolderHideRead { spaceId, folderId, hideRead }` (persisted; `hideRead:
false` reveals read rows in place), and a **"Mark all read"** action via
`markAllSmartItemsRead { spaceId, folderId }` (drains the whole folder). The
`markSmartItemRead { folderId, itemId }` command also exists for an explicit
single mark. Read-state behaviour SHALL apply to **feed sources only**; queue
items carry no read-state.

#### Scenario: Opening an entry keeps it; moving on drains it

- **GIVEN** an unread item in a feed folder
- **WHEN** the user activates its row (opening its tab)
- **THEN** the item is bound and **stays unread** in the list while its tab is the active tab
- **AND WHEN** the user navigates to another tab (its bound tab deactivates) or closes the tab
- **THEN** the item is marked read, its row drains, the next-oldest unread backfills, the unread badge decrements, AND (on the navigate-away path) its bound tab is closed (consume = close — no tab trail)

#### Scenario: Manually closing the reading tab advances to the next unread

- **GIVEN** an UNREAD feed item whose tab is open and active
- **WHEN** the user closes that tab themselves (it is still unread at close time)
- **THEN** the queue opens the next unread, unbound item in the same section

#### Scenario: A consume=close does NOT auto-advance (no runaway drain)

- **GIVEN** a feed item that was consumed by navigating away (marked read, then its now-inactive tab closed by the SW)
- **WHEN** `onTabRemoved` fires for that already-read tab
- **THEN** `nextUnreadFeedItemAfterClose` returns nothing and no next item is opened — so consuming one item never cascades into draining the section

#### Scenario: The resting state is drained; "Show recently read" reveals

- **GIVEN** a feed folder with read and unread items (`hideRead: true`, the default)
- **THEN** only the unread rows render (the read rows are collapsed)
- **WHEN** the user selects "Show recently read"
- **THEN** `setSmartFolderHideRead` persists `hideRead: false` and the read rows are revealed in place

#### Scenario: Mark all read empties the unread count

- **WHEN** the user selects "Mark all read" on a feed folder
- **THEN** `markAllSmartItemsRead` marks every current item read and the badge becomes absent
