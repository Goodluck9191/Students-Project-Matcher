import { Construction } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";

export function StagePlaceholder({
  title,
  subtitle,
  stage,
}: {
  title: string;
  subtitle: string;
  stage: string;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mt-6">
        <EmptyState
          icon={<Construction className="h-6 w-6" />}
          title={`${stage} — coming next`}
          description="The layout shell, navigation and design tokens are live. This screen's full UI ships in its scheduled stage."
        />
      </div>
    </div>
  );
}
