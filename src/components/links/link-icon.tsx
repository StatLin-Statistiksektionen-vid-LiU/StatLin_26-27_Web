import { BarChart, Calendar, Chain, Clock, Door, Edit, FileText, Key, Mail, MapFold, Printer, Users } from "@/components/icons";

/** Ikonerna i LINK_ICONS (src/lib/links.ts). Okända namn blir en vanlig länkikon. */
const ICONS = {
  link: Chain,
  calendar: Calendar,
  door: Door,
  map: MapFold,
  printer: Printer,
  pen: Edit,
  mail: Mail,
  chart: BarChart,
  file: FileText,
  users: Users,
  key: Key,
  clock: Clock,
};

export function LinkIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Chain;
  return <Icon size={size} className={className} />;
}
