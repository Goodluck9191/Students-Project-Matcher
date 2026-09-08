"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectPreview } from "@/components/projects/ProjectPreview";
import { mockCurrentStudent } from "@/lib/mock/students";
import {
  EMPTY_FORM,
  createProject,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "@/lib/services/projects";

/**
 * Create project: validate → mock project object → toast → /projects/[id].
 * Nothing is persisted to a real database (demo mode).
 */
export default function CreateProjectPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [values, setValues] = React.useState<ProjectFormValues>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<ProjectFormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateProjectForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      error("Check your form", "Please fix the highlighted fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const project = await createProject(values, {
        id: mockCurrentStudent.id,
        name: mockCurrentStudent.fullName,
      });
      success("Project created", "Saved locally in demo mode.");
      router.push(`/projects/${project.id}`);
    } catch {
      error("Couldn't create the project", "Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Create Project"
        subtitle="Describe your project so the right teammates can find you."
      />
      <form onSubmit={handleSubmit} noValidate>
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="min-w-0">
            <CardContent className="py-6">
              <ProjectForm values={values} errors={errors} onChange={setValues} />
              <div className="mt-7 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  href="/projects"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} className="w-full sm:w-auto" size="lg">
                  Create Project <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="min-w-0 lg:sticky lg:top-20">
            <ProjectPreview values={values} />
          </div>
        </div>
      </form>
    </div>
  );
}
