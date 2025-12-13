'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIDEBAR_WIDTH_EXPANDED = '16rem';
const SIDEBAR_WIDTH_COLLAPSED = '3.5rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextType = {
  state: 'expanded' | 'collapsed';
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultCollapsed?: boolean;
    storageKey?: string;
  }
>(({
  defaultCollapsed = false,
  storageKey = 'sidebar-state',
  children,
  ...props
}, ref) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
    if(typeof window !== 'undefined'){
      const storedValue = window.localStorage.getItem(storageKey);
      if(storedValue !== null){
        setIsOpen(JSON.parse(storedValue));
      }
    }
  }, [storageKey]);

  const toggle = React.useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(newState));
      }
      return newState;
    });
  }, [storageKey]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const state = (isClient && !isMobile && isOpen) ? 'expanded' : 'collapsed';
  
  return (
    <SidebarContext.Provider value={{ state, isMobile, isOpen: isMobile ? isOpen : true, setIsOpen, toggle }}>
      <TooltipProvider delayDuration={0}>
        <div
          ref={ref}
          style={{
            '--sidebar-width-expanded': SIDEBAR_WIDTH_EXPANDED,
            '--sidebar-width-collapsed': SIDEBAR_WIDTH_COLLAPSED,
          } as React.CSSProperties}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef<
  HTMLElement,
  React.ComponentProps<'aside'>
>(({ className, children, ...props }, ref) => {
  const { state, isMobile, isOpen, setIsOpen } = useSidebar();
  
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="w-[var(--sidebar-width-expanded)] bg-background p-0 [&>button]:hidden"
        >
          <aside ref={ref} className={cn('flex h-full flex-col', className)} {...props}>
            {children}
          </aside>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      ref={ref}
      data-state={state}
      className={cn(
        'hidden md:flex h-screen flex-col border-r bg-background text-foreground transition-[width] duration-300 ease-in-out',
        state === 'expanded' ? 'w-[var(--sidebar-width-expanded)]' : 'w-[var(--sidebar-width-collapsed)]',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';


const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggle, isMobile } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('h-7 w-7', isMobile ? 'flex' : 'hidden md:flex', className)}
      onClick={toggle}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>(({ className, ...props }, ref) => {
    const { state, isMobile } = useSidebar();

    return (
        <main
        ref={ref}
        className={cn(
            "flex-1 h-screen overflow-y-auto transition-[margin-left] duration-300 ease-in-out",
            !isMobile && (state === 'expanded' ? 'ml-[var(--sidebar-width-expanded)]' : 'ml-[var(--sidebar-width-collapsed)]'),
            className
        )}
        {...props}
        />
    )
});
SidebarInset.displayName = 'SidebarInset';


const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn('flex flex-col p-2', state === 'collapsed' ? 'items-center' : '', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-1 min-h-0 overflow-y-auto overflow-x-hidden', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col mt-auto border-t', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('flex flex-col gap-1 w-full min-w-0', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('group/item relative', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  'peer flex w-full items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-left text-sm font-medium outline-none ring-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      size: { default: 'h-9', lg: 'h-12' },
    },
    defaultVariants: { size: 'default' },
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | Omit<React.ComponentProps<typeof TooltipContent>, 'children'> & { children?: React.ReactNode };
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(({
  asChild,
  isActive = false,
  size,
  tooltip,
  className,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button';
  const { state, isMobile } = useSidebar();

  const buttonContent = (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        sidebarMenuButtonVariants({ size }),
        state === 'collapsed' && 'justify-center p-0 size-9',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, i) => {
        if (state === 'collapsed' && i > 0 && typeof child !== 'string') {
          return null; // Don't render complex children when collapsed
        }
        if (state === 'collapsed' && i === 1 && typeof child === 'string') {
          return <span className="sr-only">{child}</span>;
        }
        return child;
      })}
    </Comp>
  );

  if (!tooltip || state === 'expanded' || isMobile) {
    return buttonContent;
  }

  const tooltipProps = typeof tooltip === 'string' ? { children: tooltip } : tooltip;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right" align="center" {...tooltipProps} />
    </Tooltip>
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
