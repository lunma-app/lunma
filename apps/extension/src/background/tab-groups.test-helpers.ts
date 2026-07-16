import { vi } from 'vitest';

/**
 * In-memory fake of the slice of `chrome.tabGroups` / `chrome.tabs` that the
 * tab-group orchestration touches. Installed on `globalThis.chrome`. Records an
 * ordered `calls` log so tests can assert the activate-then-collapse sequence
 * (D3), and exposes `failGroupUpdate` to simulate a `chrome.tabGroups.update`
 * rejection for the rename-atomicity revert test.
 */
export interface FakeGroup {
  id: number;
  windowId: number;
  collapsed: boolean;
  title?: string;
  color?: string;
}

export interface FakeTab {
  id: number;
  windowId: number;
  groupId: number;
  active: boolean;
  /** Live URL — used by the authoritative home-tab query (`isNewTabUrl`). A
   * URL-less `tabs.create` lands on the new-tab page, so `create` defaults it. */
  url?: string;
  /** Strip position — set by `tabs.move`. */
  index?: number;
  /** Native tab-strip pin — set by `tabs.update` (favorite native pinning). */
  pinned?: boolean;
}

export interface TabGroupsController {
  groups: Map<number, FakeGroup>;
  tabs: Map<number, FakeTab>;
  calls: string[];
  /** Return true for a groupId whose `tabGroups.update` should reject. */
  failGroupUpdate: (groupId: number) => boolean;
  addGroup: (g: Partial<FakeGroup> & { id: number; windowId: number }) => void;
  addTab: (t: Partial<FakeTab> & { id: number; windowId: number }) => void;
}

const NO_GROUP = -1;

export function installTabGroupsChrome(): TabGroupsController {
  const ctrl: TabGroupsController = {
    groups: new Map(),
    tabs: new Map(),
    calls: [],
    failGroupUpdate: () => false,
    addGroup(g) {
      ctrl.groups.set(g.id, { collapsed: false, ...g });
    },
    addTab(t) {
      ctrl.tabs.set(t.id, { groupId: NO_GROUP, active: false, ...t });
    },
  };

  let nextGroupId = 9000;
  let nextTabId = 8000;

  const chromeStub = {
    tabGroups: {
      get: vi.fn(async (groupId: number) => {
        const group = ctrl.groups.get(groupId);
        if (!group) throw new Error(`No group with id: ${groupId}`);
        return { ...group };
      }),
      update: vi.fn(
        async (groupId: number, props: { collapsed?: boolean; title?: string; color?: string }) => {
          if (ctrl.failGroupUpdate(groupId)) {
            throw new Error(`tabGroups.update rejected for ${groupId}`);
          }
          const group = ctrl.groups.get(groupId);
          if (!group) throw new Error(`No group with id: ${groupId}`);
          if (props.collapsed !== undefined) {
            group.collapsed = props.collapsed;
            ctrl.calls.push(`tabGroups.update:collapsed=${props.collapsed}:${groupId}`);
          }
          if (props.title !== undefined) {
            group.title = props.title;
            ctrl.calls.push(`tabGroups.update:title=${props.title}:${groupId}`);
          }
          if (props.color !== undefined) {
            group.color = props.color;
            ctrl.calls.push(`tabGroups.update:color=${props.color}:${groupId}`);
          }
          return { ...group };
        },
      ),
      query: vi.fn(async (q: { windowId?: number }) => {
        return [...ctrl.groups.values()]
          .filter((g) => q.windowId === undefined || g.windowId === q.windowId)
          .map((g) => ({ ...g }));
      }),
    },
    tabs: {
      group: vi.fn(
        async (options: {
          tabIds: number | number[];
          groupId?: number;
          createProperties?: { windowId?: number };
        }) => {
          const ids = Array.isArray(options.tabIds) ? options.tabIds : [options.tabIds];
          // Chrome validates the WHOLE batch before grouping anything: one dead
          // tab id (or a dissolved target group) rejects the entire call and no
          // tab moves. Faking it leniently hid the stale-id batch poisoning.
          for (const id of ids) {
            if (!ctrl.tabs.has(id)) throw new Error(`No tab with id: ${id}`);
          }
          if (options.groupId !== undefined && !ctrl.groups.has(options.groupId)) {
            throw new Error(`No group with id: ${options.groupId}`);
          }
          let groupId = options.groupId;
          if (groupId === undefined) {
            groupId = nextGroupId++;
            const windowId =
              options.createProperties?.windowId ?? ctrl.tabs.get(ids[0] as number)?.windowId ?? 0;
            ctrl.groups.set(groupId, { id: groupId, windowId, collapsed: false });
          }
          for (const id of ids) {
            const tab = ctrl.tabs.get(id);
            if (tab) tab.groupId = groupId;
          }
          ctrl.calls.push(`tabs.group:[${ids.join(',')}]->${groupId}`);
          return groupId;
        },
      ),
      ungroup: vi.fn(async (tabIds: number | number[]) => {
        const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
        for (const id of ids) {
          const tab = ctrl.tabs.get(id);
          if (tab) tab.groupId = NO_GROUP;
        }
        ctrl.calls.push(`tabs.ungroup:[${ids.join(',')}]`);
      }),
      move: vi.fn(async (tabId: number, props: { index: number }) => {
        const tab = ctrl.tabs.get(tabId);
        if (!tab) throw new Error(`No tab with id: ${tabId}`);
        tab.index = props.index;
        ctrl.calls.push(`tabs.move:${tabId}->${props.index}`);
        return { ...tab };
      }),
      update: vi.fn(
        async (tabId: number, props: { active?: boolean; url?: string; pinned?: boolean }) => {
          const tab = ctrl.tabs.get(tabId);
          // A missing tab rejects — the in-place open's stale-`replaceTabId` path
          // (newtab-hearth) relies on this to fall back to the create path.
          if (!tab) throw new Error(`No tab with id: ${tabId}`);
          if (props.url !== undefined) {
            tab.url = props.url;
            ctrl.calls.push(`tabs.update:url:${tabId}`);
          }
          if (props.pinned !== undefined) {
            tab.pinned = props.pinned;
            // Chrome never allows a pinned tab inside a tab group.
            if (props.pinned) tab.groupId = NO_GROUP;
            ctrl.calls.push(`tabs.update:pinned=${props.pinned}:${tabId}`);
          }
          if (props.active) {
            for (const t of ctrl.tabs.values()) {
              if (t.windowId === tab.windowId) t.active = t.id === tabId;
            }
            ctrl.calls.push(`tabs.update:active:${tabId}`);
          }
          return { ...tab };
        },
      ),
      create: vi.fn(async (props: { windowId?: number; url?: string; active?: boolean }) => {
        const id = nextTabId++;
        const windowId = props.windowId ?? 0;
        // A URL-less create opens the browser's new-tab page (Lunma's home).
        const url = props.url ?? 'chrome://newtab/';
        const active = props.active ?? true;
        ctrl.addTab({ id, windowId, active, url });
        if (active) {
          for (const t of ctrl.tabs.values()) {
            if (t.windowId === windowId) t.active = t.id === id;
          }
        }
        ctrl.calls.push(`tabs.create:${windowId}->${id}`);
        return { id, windowId, url, active };
      }),
      query: vi.fn(async (q: { groupId?: number; windowId?: number; active?: boolean }) => {
        return [...ctrl.tabs.values()]
          .filter((t) => q.groupId === undefined || t.groupId === q.groupId)
          .filter((t) => q.windowId === undefined || t.windowId === q.windowId)
          .filter((t) => q.active === undefined || t.active === q.active)
          .map((t) => ({ ...t }));
      }),
      remove: vi.fn(async (tabIds: number | number[]) => {
        const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
        for (const id of ids) ctrl.tabs.delete(id);
        ctrl.calls.push(`tabs.remove:[${ids.join(',')}]`);
      }),
    },
  };

  (globalThis as unknown as { chrome: typeof chromeStub }).chrome = chromeStub;
  return ctrl;
}
