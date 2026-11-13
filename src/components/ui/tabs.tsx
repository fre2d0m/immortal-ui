"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative isolate inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ref,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => listRef.current!, []);

  const measureIndicator = React.useCallback((animate: boolean) => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]',
    );
    if (!selected || !selected.offsetWidth || !selected.offsetHeight) {
      delete list.dataset.indicatorReady;
      return;
    }
    const geometry = {
      x: selected.offsetLeft,
      y: selected.offsetTop,
      width: selected.offsetWidth,
      height: selected.offsetHeight,
    };
    if (
      list.dataset.indicatorReady &&
      Object.entries(geometry).every(
        ([key, size]) =>
          list.style.getPropertyValue(`--tab-indicator-${key}`) === `${size}px`,
      )
    )
      return;
    // Offset coordinates stay correct when the list scrolls; theme/font changes
    // remeasure without animating. Only selection moves the shared indicator.
    list.dataset.indicatorMotion = String(
      animate && !!list.dataset.indicatorReady,
    );
    for (const [key, size] of Object.entries(geometry)) {
      list.style.setProperty(`--tab-indicator-${key}`, `${size}px`);
    }
    list.dataset.indicatorReady = "true";
  }, []);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const resize = new ResizeObserver(() => measureIndicator(false));
    const observeSizes = () => {
      resize.disconnect();
      resize.observe(list);
      list
        .querySelectorAll('[data-slot="tabs-trigger"]')
        .forEach((tab) => resize.observe(tab));
      measureIndicator(false);
    };
    observeSizes();
    // Radix owns selection and keyboard behavior. Observe its committed state
    // instead of keeping a second selection state just for the visual indicator.
    const changes = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList")) observeSizes();
      else measureIndicator(true);
    });
    changes.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => {
      resize.disconnect();
      changes.disconnect();
    };
  }, [measureIndicator, variant]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-[color,background-color,border-color,box-shadow] group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
