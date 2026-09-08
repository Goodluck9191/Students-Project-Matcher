"use client";

import { Input, Select, Textarea } from "@/components/ui/Input";
import { InterestSelector, SkillSelector } from "@/components/profile";
import {
  PROGRAM_OPTIONS,
  PROJECT_CATEGORY_OPTIONS,
  SKILL_CATALOGUE,
  type ProjectType,
} from "@/types";
import type { ProjectFormErrors, ProjectFormValues } from "@/lib/services/projects";

const TYPE_OPTIONS: ProjectType[] = ["Coursework", "Final Year", "Hackathon", "Research", "Side Project"];
const SIZE_OPTIONS = ["2", "3", "4", "5", "6", "7", "8"];
const YEAR_OPTIONS = ["1", "2", "3", "4", "5"].map((y) => ({ value: y, label: `Year ${y}` }));

/**
 * Shared project form — used by both create (/projects/create) and edit
 * (/projects/[id]/edit). Structured skill/interest arrays, never CSV text.
 */
export function ProjectForm({
  values,
  errors,
  onChange,
  idPrefix = "project",
}: {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  onChange: (next: ProjectFormValues) => void;
  idPrefix?: string;
}) {
  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-900">Basic information</h3>
        <div className="mt-3 space-y-4">
          <Input
            label="Project title"
            name={`${idPrefix}-title`}
            placeholder="e.g. University Asset Management System"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            error={errors.title}
          />
          <Textarea
            label="Description"
            name={`${idPrefix}-description`}
            placeholder="What will the team build, for whom, and what does success look like?"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            rows={5}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              name={`${idPrefix}-category`}
              options={PROJECT_CATEGORY_OPTIONS}
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              error={errors.category}
            />
            <Select
              label="Project type"
              name={`${idPrefix}-type`}
              options={TYPE_OPTIONS}
              value={values.projectType}
              onChange={(e) => set("projectType", e.target.value as ProjectType)}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Academic information</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Select
            label="Program"
            name={`${idPrefix}-program`}
            options={PROGRAM_OPTIONS}
            value={values.program}
            onChange={(e) => set("program", e.target.value)}
            error={errors.program}
          />
          <Select
            label="Year (optional)"
            name={`${idPrefix}-year`}
            options={YEAR_OPTIONS}
            value={values.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="Any year"
          />
        </div>
      </section>

      <section className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Team requirements</h3>
        <div className="mt-3 space-y-5">
          <Select
            label="Maximum team size"
            name={`${idPrefix}-size`}
            options={SIZE_OPTIONS}
            value={values.maxTeamSize}
            onChange={(e) => set("maxTeamSize", e.target.value)}
            error={errors.maxTeamSize}
            placeholder="Select size…"
          />
          <SkillSelector
            selected={values.requiredSkills}
            onChange={(requiredSkills) => set("requiredSkills", requiredSkills)}
            options={SKILL_CATALOGUE}
            error={errors.requiredSkills}
          />
        </div>
      </section>

      <section className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Project interests</h3>
        <div className="mt-3">
          <InterestSelector
            selected={values.interests}
            onChange={(interests) => set("interests", interests)}
            error={errors.interests}
          />
        </div>
      </section>

      <section className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Deadline</h3>
        <div className="mt-3 max-w-xs">
          <Input
            label="Project deadline"
            name={`${idPrefix}-deadline`}
            type="date"
            min={today}
            value={values.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            error={errors.deadline}
          />
        </div>
      </section>
    </div>
  );
}
