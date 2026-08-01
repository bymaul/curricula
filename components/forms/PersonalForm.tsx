'use client';

import {
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading } from './shared';

export const PersonalForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CVData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'links',
  });

  return (
    <div className="p-2">
      <div className="mb-4">
        <SectionHeading
          title="Personal Details"
          description="Get started with your contact information and summary."
        />
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend>Contact Information</FieldLegend>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
            <FormField
              name="name"
              label="Full Name"
              placeholder="e.g. Alex Johnson"
              register={register}
              error={errors.name?.message}
            />
            <FormField
              name="jobTitle"
              label="Job Title"
              placeholder="e.g. Senior Software Engineer"
              register={register}
              error={errors.jobTitle?.message}
            />
            <FormField
              name="email"
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              register={register}
              error={errors.email?.message}
            />
            <FormField
              name="phone"
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              register={register}
              error={errors.phone?.message}
            />
            <FormField
              name="location"
              label="Location (Optional)"
              placeholder="e.g. San Francisco, CA"
              register={register}
              className="sm:col-span-2"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Custom Links</FieldLegend>
          <FieldGroup>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border relative"
              >
                <div className="flex gap-3 items-end">
                  <FormField
                    name={`links.${index}.url` as const}
                    label="URL (e.g., github.com/username)"
                    placeholder="github.com/username"
                    register={register}
                    error={errors.links?.[index]?.url?.message}
                    className="flex-1"
                  />

                  <ItemRemoveButton
                    onClick={() => remove(index)}
                    title="Remove Link"
                  />
                </div>
              </div>
            ))}

            <AddItemButton size="sm" onClick={() => append({ url: '' })}>
              Add Link
            </AddItemButton>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Professional Summary</FieldLegend>
          <FieldGroup>
            <FormField
              as="textarea"
              name="summary"
              placeholder="A brief overview of your professional background, key achievements, and core strengths..."
              register={register}
              error={errors.summary?.message}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  );
};
