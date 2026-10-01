import type { GroupColour } from "@plan-app/domain";

/** Tailwind classes per named Group colour (light and dark). */
export const GROUP_COLOUR_CLASSES: Record<GroupColour, string> = {
  slate: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-50",
  red: "bg-red-200 text-red-950 dark:bg-red-900 dark:text-red-50",
  orange: "bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-50",
  amber: "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-50",
  green: "bg-green-200 text-green-950 dark:bg-green-900 dark:text-green-50",
  teal: "bg-teal-200 text-teal-950 dark:bg-teal-900 dark:text-teal-50",
  blue: "bg-blue-200 text-blue-950 dark:bg-blue-900 dark:text-blue-50",
  violet: "bg-violet-200 text-violet-950 dark:bg-violet-900 dark:text-violet-50",
};

export function groupColourClass(colour: string): string {
  return GROUP_COLOUR_CLASSES[colour as GroupColour] ?? GROUP_COLOUR_CLASSES.slate;
}
