
import { ReactElement } from "react";

export interface NavLinkItem {
  name: string;
  icon: React.ElementType;
  path: string;
  end?: boolean;
  badge?: {
    text: string;
    variant: "secondary" | "default" | "destructive" | "outline";
  };
}

export interface NavAccordionItem {
  name: string;
  icon: React.ElementType;
  children: NavLinkItem[];
}

export type NavItemType = NavLinkItem | NavAccordionItem;
