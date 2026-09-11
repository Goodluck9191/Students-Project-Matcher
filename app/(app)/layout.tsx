import { AppShell } from "@/components/layout/AppShell";
import { StudentGate } from "@/components/layout/StudentGate";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentGate>
      <AppShell>{children}</AppShell>
    </StudentGate>
  );
}
