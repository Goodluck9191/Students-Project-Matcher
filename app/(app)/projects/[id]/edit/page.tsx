"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ProjectForm } from "@/components/projects/ProjectForm";
import {
  getProjectById,
  isProjectOwner,
  toFormValues,
  updateProject,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "@/lib/services/projects";

/** Edit project — reuses ProjectForm; owners only (mock ownership). */
export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();
  const [values, setValues] = React.useState<ProjectFormValues | null>(null);
  const [missing, setMissing] = React.useState(false);
  const [forbidden, setForbidden] = React.useState(false);
  const [errors, setErrors] = React.useState<ProjectFormErrors>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getProjectById(params.id).then((p) => {
      if (cancelled) return;
      if (!p) setMissing(true);
      else if (!isProjectOwner(p)) setForbidden(true);
      else setValues(toFormValues(p));
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    const validation = validateProjectForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      error("Check your form", "Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProject(params.id, values);
      if (!updated) {
        setMissing(true);
        return;
      }
      success("Project updated", "Saved locally in demo mode.");
      router.push(`/projects/${params.id}`);
    } catch {
      error("Couldn't save changes", "Please try again.");
      setSaving(false);
    }
  }

  if (missing || forbidden) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <ErrorState
          title={missing ? "Project not found" : "Not your project"}
          description={
            missing
              ? "This project doesn't exist or is no longer available."
              : "Only the project creator can edit this project (demo ownership)."
          }
        />
        <div className="mt-4 text-center">
          <Button href="/projects" variant="outline">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!values) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" role="status" aria-label="Loading project">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Project"
        subtitle="Update the details teammates see."
      />
      <form onSubmit={handleSubmit} noValidate>
        <Card className="mt-5">
          <CardContent className="py-6">
            <ProjectForm
              values={values}
              errors={errors}
              onChange={setValues}
              idPrefix="edit-project"
            />
            <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                href={`/projects/${params.id}`}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="w-full sm:w-auto" size="lg">
                Save Changes <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
