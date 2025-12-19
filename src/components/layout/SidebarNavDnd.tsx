import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  area: string;
  badge?: string;
};

export type MenuGroup = {
  id: string;
  label: string;
  image: string;
  color: string;
  items: MenuItem[];
};

type SidebarLayoutV1 = {
  version: 1;
  groupOrder: string[];
  itemOrderByGroup: Record<string, string[]>; // groupId -> area[]
  groupByItem: Record<string, string>; // area -> groupId
};

function safeParseLayout(raw: string): SidebarLayoutV1 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    if (!Array.isArray(parsed.groupOrder)) return null;
    if (typeof parsed.itemOrderByGroup !== "object" || !parsed.itemOrderByGroup) return null;
    if (typeof parsed.groupByItem !== "object" || !parsed.groupByItem) return null;
    return parsed as SidebarLayoutV1;
  } catch {
    return null;
  }
}

function buildDefaultLayout(groups: MenuGroup[]): SidebarLayoutV1 {
  const groupOrder = groups.map((g) => g.id);
  const itemOrderByGroup: Record<string, string[]> = {};
  const groupByItem: Record<string, string> = {};

  groups.forEach((g) => {
    itemOrderByGroup[g.id] = g.items.map((i) => i.area);
    g.items.forEach((i) => {
      groupByItem[i.area] = g.id;
    });
  });

  return { version: 1, groupOrder, itemOrderByGroup, groupByItem };
}

function applyLayout(groups: MenuGroup[], layout: SidebarLayoutV1): MenuGroup[] {
  const groupMap = new Map(groups.map((g) => [g.id, g] as const));
  const itemMap = new Map<string, MenuItem>();
  groups.forEach((g) => g.items.forEach((i) => itemMap.set(i.area, i)));

  // group order
  const baseGroupIds = groups.map((g) => g.id);
  const orderedGroupIds = [
    ...layout.groupOrder.filter((id) => baseGroupIds.includes(id)),
    ...baseGroupIds.filter((id) => !layout.groupOrder.includes(id)),
  ];

  // items to groups
  const nextGroups: MenuGroup[] = orderedGroupIds
    .map((id) => groupMap.get(id))
    .filter(Boolean)
    .map((g) => ({ ...g!, items: [] }));

  const nextGroupIndex = new Map(nextGroups.map((g, idx) => [g.id, idx] as const));

  // place each item based on layout.groupByItem (fallback to original)
  itemMap.forEach((item) => {
    const desiredGroup = layout.groupByItem[item.area] ?? groups.find((g) => g.items.some((i) => i.area === item.area))?.id;
    const idx = desiredGroup ? nextGroupIndex.get(desiredGroup) : undefined;
    if (idx === undefined) return;
    nextGroups[idx].items.push(item);
  });

  // order within each group
  nextGroups.forEach((g) => {
    const baseAreas = g.items.map((i) => i.area);
    const desired = layout.itemOrderByGroup[g.id] ?? [];
    const orderedAreas = [...desired.filter((a) => baseAreas.includes(a)), ...baseAreas.filter((a) => !desired.includes(a))];
    const byArea = new Map(g.items.map((i) => [i.area, i] as const));
    g.items = orderedAreas.map((a) => byArea.get(a)).filter(Boolean) as MenuItem[];
  });

  // remove empty groups (after permissions filtering)
  return nextGroups.filter((g) => g.items.length > 0);
}

function SortableGroup(props: {
  id: string;
  children: (opts: { attributes: any; listeners: any; setActivatorNodeRef: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } = useSortable({ id: `group:${props.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

function SortableItem(props: {
  groupId: string;
  area: string;
  children: (opts: { attributes: any; listeners: any; setActivatorNodeRef: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef } = useSortable({
    id: `item:${props.area}`,
    data: { groupId: props.groupId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

export function SidebarNavDnd(props: {
  collapsed: boolean;
  groups: MenuGroup[];
  canEditLayout: boolean;
  getContent: (key: string, fallback?: string) => string;
  updateContent: (key: string, value: string, type?: string) => Promise<boolean>;
  isActive: (path: string) => boolean;
}) {
  const { collapsed, groups, canEditLayout, getContent, updateContent, isActive } = props;

  const layoutKey = "nav_sidebar_layout_v1";
  const persisted = getContent(layoutKey, "");

  const baseLayout = useMemo(() => buildDefaultLayout(groups), [groups]);
  const parsedLayout = useMemo(() => safeParseLayout(persisted) ?? baseLayout, [persisted, baseLayout]);

  // state we mutate with DnD
  const [layout, setLayout] = useState<SidebarLayoutV1>(parsedLayout);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLayout(parsedLayout);
  }, [parsedLayout]);

  const orderedGroups = useMemo(() => applyLayout(groups, layout), [groups, layout]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const persist = useCallback(
    async (next: SidebarLayoutV1) => {
      await updateContent(layoutKey, JSON.stringify(next), "json");
    },
    [updateContent]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const a = String(active.id);
    const o = String(over.id);

    // group reorder
    if (a.startsWith("group:") && o.startsWith("group:")) {
      const from = a.replace("group:", "");
      const to = o.replace("group:", "");
      const current = layout.groupOrder.length ? layout.groupOrder : groups.map((g) => g.id);
      const fromIdx = current.indexOf(from);
      const toIdx = current.indexOf(to);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

      const next: SidebarLayoutV1 = {
        ...layout,
        groupOrder: arrayMove(current, fromIdx, toIdx),
      };

      setLayout(next);
      if (canEditLayout) await persist(next);
      return;
    }

    // item move within/between groups (drop on item)
    if (a.startsWith("item:") && o.startsWith("item:")) {
      const activeArea = a.replace("item:", "");
      const overArea = o.replace("item:", "");

      const fromGroup = (active.data.current as any)?.groupId as string | undefined;
      const toGroup = (over.data.current as any)?.groupId as string | undefined;
      if (!fromGroup || !toGroup) return;

      const next = structuredClone(layout) as SidebarLayoutV1;

      const fromList = [
        ...(next.itemOrderByGroup[fromGroup] ??
          orderedGroups.find((g) => g.id === fromGroup)?.items.map((i) => i.area) ??
          []),
      ];

      const toList =
        fromGroup === toGroup
          ? fromList
          : [
              ...(next.itemOrderByGroup[toGroup] ??
                orderedGroups.find((g) => g.id === toGroup)?.items.map((i) => i.area) ??
                []),
            ];

      // ensure presence
      if (!fromList.includes(activeArea)) fromList.push(activeArea);
      if (!toList.includes(overArea)) toList.push(overArea);

      const fromIdx = fromList.indexOf(activeArea);
      const toIdx = toList.indexOf(overArea);

      if (fromGroup === toGroup) {
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
        next.itemOrderByGroup[fromGroup] = arrayMove(fromList, fromIdx, toIdx);
      } else {
        // remove from old group
        next.itemOrderByGroup[fromGroup] = fromList.filter((x) => x !== activeArea);
        // insert into new group
        const insertAt = Math.max(0, toIdx);
        const newTo = [...toList.filter((x) => x !== activeArea)];
        newTo.splice(insertAt, 0, activeArea);
        next.itemOrderByGroup[toGroup] = newTo;
        next.groupByItem[activeArea] = toGroup;
      }

      setLayout(next);
      if (canEditLayout) await persist(next);
      return;
    }

    // item drop on group header (more forgiving)
    if (a.startsWith("item:") && o.startsWith("group:")) {
      const activeArea = a.replace("item:", "");
      const toGroup = o.replace("group:", "");
      const fromGroup = (active.data.current as any)?.groupId as string | undefined;
      if (!fromGroup || !toGroup) return;
      if (fromGroup === toGroup) return;

      const next = structuredClone(layout) as SidebarLayoutV1;

      const fromList = [
        ...(next.itemOrderByGroup[fromGroup] ??
          orderedGroups.find((g) => g.id === fromGroup)?.items.map((i) => i.area) ??
          []),
      ].filter((x) => x !== activeArea);

      const toList = [
        ...(next.itemOrderByGroup[toGroup] ??
          orderedGroups.find((g) => g.id === toGroup)?.items.map((i) => i.area) ??
          []),
      ].filter((x) => x !== activeArea);

      toList.push(activeArea); // move to end

      next.itemOrderByGroup[fromGroup] = fromList;
      next.itemOrderByGroup[toGroup] = toList;
      next.groupByItem[activeArea] = toGroup;

      setLayout(next);
      if (canEditLayout) await persist(next);
    }
  };

  // no DnD in collapsed mode
  if (collapsed) {
    return (
      <AnimatePresence>
        {orderedGroups.map((group, idx) => (
          <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.area}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <NavLink to={item.url} end className="flex items-center gap-3" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        ))}
      </AnimatePresence>
    );
  }

  const groupIds = orderedGroups.map((g) => `group:${g.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {orderedGroups.map((group, idx) => {
            const items = group.items.map((i) => `item:${i.area}`);
            return (
              <SortableGroup key={group.id} id={group.id}>
                {({ attributes, listeners, setActivatorNodeRef }) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <SidebarGroup>
                      <div className="relative mb-2 rounded-lg overflow-hidden h-12 group">
                        <img src={group.image} alt={group.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className={`absolute inset-0 bg-gradient-to-r ${group.color} to-transparent flex items-center px-3`}>
                          {canEditLayout && (
                            <button
                              type="button"
                              ref={setActivatorNodeRef}
                              {...attributes}
                              {...listeners}
                              className="mr-2 inline-flex items-center justify-center rounded-md px-1.5 py-1 text-white/80 hover:text-white hover:bg-white/10 touch-none"
                              aria-label="Arrastar categoria"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          )}
                          <span className="text-xs font-bold text-white drop-shadow-lg">{group.label}</span>
                        </div>
                      </div>

                      <SidebarGroupLabel className="sr-only">{group.label}</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          <SortableContext items={items} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                              {group.items.map((item) => (
                                <SortableItem key={item.area} groupId={group.id} area={item.area}>
                                  {({ attributes, listeners, setActivatorNodeRef }) => (
                                    <SidebarMenuItem>
                                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                                        <NavLink
                                          to={item.url}
                                          end
                                          className="flex items-center gap-3"
                                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                        >
                                          <item.icon className="h-4 w-4 shrink-0" />
                                          <span className="flex items-center gap-2 min-w-0">
                                            {canEditLayout && (
                                              <button
                                                type="button"
                                                ref={setActivatorNodeRef}
                                                {...attributes}
                                                {...listeners}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                }}
                                                className="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 touch-none"
                                                aria-label="Arrastar item"
                                              >
                                                <GripVertical className="h-4 w-4" />
                                              </button>
                                            )}
                                            <span className="truncate" data-editable-key={`nav_${item.area}_title`}>
                                              {getContent(`nav_${item.area}_title`, item.title)}
                                            </span>
                                            {item.badge && (
                                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                {item.badge}
                                              </Badge>
                                            )}
                                          </span>
                                        </NavLink>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  )}
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </motion.div>
                )}
              </SortableGroup>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <div className="rounded-lg border border-border bg-background/95 px-3 py-2 text-sm shadow-xl">
            Movendo...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
