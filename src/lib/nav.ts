import {
  Boxes,
  Factory,
  Gauge,
  History,
  IndianRupee,
  ScanSearch,
  SlidersHorizontal,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  /** The question a manager is asking when they click it. */
  hint: string;
  icon: typeof Gauge;
  group: 'Operations' | 'Decisions' | 'Trust';
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Command Center', hint: 'What needs me right now?', icon: Gauge, group: 'Operations' },
  { to: '/quality', label: 'Quality Intelligence', hint: 'What is defective, and why?', icon: ScanSearch, group: 'Operations' },
  { to: '/production', label: 'Production Intelligence', hint: 'Where is the bottleneck?', icon: Factory, group: 'Operations' },
  { to: '/profitability', label: 'Profitability', hint: 'Where is money leaking?', icon: IndianRupee, group: 'Operations' },
  { to: '/simulator', label: 'What-If Simulator', hint: 'What happens if we change it?', icon: SlidersHorizontal, group: 'Decisions' },
  { to: '/decision-shadow', label: 'Decision Shadow AI', hint: 'Has this call gone badly before?', icon: History, group: 'Decisions' },
  { to: '/confidence', label: 'Data & Model Confidence', hint: 'How much of this can I trust?', icon: Boxes, group: 'Trust' },
];

export const navGroups = ['Operations', 'Decisions', 'Trust'] as const;
