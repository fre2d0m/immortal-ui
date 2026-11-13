import * as React from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "cn";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuSub = MenuPrimitive.Sub;

function DropdownMenuContent({
  className,
  sideOffset = 6,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 overflow-y-auto max-h-(--radix-dropdown-menu-content-available-height)",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 select-none data-disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSubTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.SubTrigger>) {
  return (
    <MenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex cursor-default items-center gap-2 select-none data-disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight
        className="ms-auto size-4 shrink-0 rtl:rotate-180"
        aria-hidden="true"
      />
    </MenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  sideOffset = 8,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.SubContent>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 overflow-y-auto max-h-(--radix-dropdown-menu-content-available-height)",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuCheckboxItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 select-none data-disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Check className="size-4" aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuLabel(
  props: React.ComponentProps<typeof MenuPrimitive.Label>,
) {
  return <MenuPrimitive.Label data-slot="dropdown-menu-label" {...props} />;
}

function DropdownMenuSeparator(
  props: React.ComponentProps<typeof MenuPrimitive.Separator>,
) {
  return (
    <MenuPrimitive.Separator data-slot="dropdown-menu-separator" {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
