"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ImageUploader,
  type SelectedMachineImage,
} from "@/components/seller/image-uploader";
import {
  machineListingSchema,
  type MachineListingInput,
} from "@/lib/validations/machine";

type Option = { id: string; name: string };

export type MachineFormInitial = {
  id: string;
  title: string;
  categoryId: string;
  brandId: string;
  model: string;
  year: number;
  condition: "NEW" | "USED" | "REFURBISHED";
  hours: number;
  price: number;
  location: string;
  description: string;
  status: "DRAFT";
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  images: SelectedMachineImage[];
};

type MachineListingFormProps = {
  categories: Option[];
  brands: Option[];
  mode?: "create" | "edit";
  initialMachine?: MachineFormInitial;
};

type FormValues = MachineListingInput;

export function MachineListingForm({
  categories,
  brands,
  mode = "create",
  initialMachine,
}: MachineListingFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(initialMachine);
  const [images, setImages] = useState<SelectedMachineImage[]>(
    initialMachine?.images ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(machineListingSchema) as Resolver<FormValues>,
    defaultValues: {
      title: initialMachine?.title ?? "",
      categoryId: initialMachine?.categoryId ?? "",
      brandId: initialMachine?.brandId ?? "",
      model: initialMachine?.model ?? "",
      year: initialMachine?.year ?? new Date().getFullYear() - 5,
      condition: initialMachine?.condition ?? "USED",
      hours: initialMachine?.hours ?? 0,
      price: initialMachine?.price,
      location: initialMachine?.location ?? "",
      description: initialMachine?.description ?? "",
      images: [],
      status: "DRAFT",
    },
  });

  async function persistListing(values: FormValues, submitAfterSave: boolean) {
    setFormError(null);
    setSuccess(null);

    const payload = {
      ...values,
      model: values.model || "",
      images: images.map((image) => ({
        id: image.id,
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
      })),
      status: "DRAFT" as const,
    };

    const parsed = machineListingSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || "Please fix the form errors");
      return;
    }

    if (submitAfterSave && parsed.data.images.length < 1) {
      setFormError("Add at least one machine image before submitting for approval.");
      return;
    }

    try {
      const endpoint = isEdit
        ? `/api/seller/machines/${initialMachine!.id}`
        : "/api/seller/machines";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(
          result?.error ||
            (isEdit ? "Failed to update machine." : "Unable to save draft.")
        );
        return;
      }

      const machineId = isEdit ? initialMachine!.id : result?.machine?.id;
      if (submitAfterSave && machineId) {
        const submitResponse = await fetch(`/api/seller/machines/${machineId}/submit`, {
          method: "POST",
        });
        const submitResult = await submitResponse.json().catch(() => null);
        if (!submitResponse.ok) {
          setFormError(submitResult?.error || "Draft saved, but submission failed.");
          return;
        }
        setSuccess("Listing submitted for admin approval.");
      } else {
        setSuccess(isEdit ? "Draft saved." : "Draft created.");
      }

      router.push("/seller/machines");
      router.refresh();
    } catch {
      setFormError(
        isEdit ? "Failed to update machine." : "Unable to save draft."
      );
    }
  }

  async function onSubmit(values: FormValues) {
    await persistListing(values, false);
  }

  async function onSubmitForApproval(values: FormValues) {
    await persistListing(values, true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Title, category, brand, and optional model.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Machine Title</Label>
            <Input
              id="title"
              placeholder="HAMM HD 90 Road Roller"
              disabled={isSubmitting}
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" disabled={isSubmitting} {...register("categoryId")}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.categoryId ? (
              <p className="text-xs text-red-600">{errors.categoryId.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brandId">Brand</Label>
            <Select id="brandId" disabled={isSubmitting} {...register("brandId")}>
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
            {errors.brandId ? (
              <p className="text-xs text-red-600">{errors.brandId.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="model">Model (optional)</Label>
            <Input
              id="model"
              placeholder="HD 90"
              disabled={isSubmitting}
              {...register("model")}
            />
            {errors.model ? (
              <p className="text-xs text-red-600">{errors.model.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Machine Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="year">Manufacturing Year</Label>
            <Input id="year" type="number" disabled={isSubmitting} {...register("year")} />
            {errors.year ? (
              <p className="text-xs text-red-600">{errors.year.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condition">Condition</Label>
            <Select id="condition" disabled={isSubmitting} {...register("condition")}>
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="REFURBISHED">Refurbished</option>
            </Select>
            {errors.condition ? (
              <p className="text-xs text-red-600">{errors.condition.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hours">Engine Hours</Label>
            <Input id="hours" type="number" disabled={isSubmitting} {...register("hours")} />
            {errors.hours ? (
              <p className="text-xs text-red-600">{errors.hours.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Pricing & Location</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="45000"
              disabled={isSubmitting}
              {...register("price")}
            />
            {errors.price ? (
              <p className="text-xs text-red-600">{errors.price.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Houston, TX"
              disabled={isSubmitting}
              {...register("location")}
            />
            {errors.location ? (
              <p className="text-xs text-red-600">{errors.location.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <div className="mt-5 space-y-1.5">
          <Label htmlFor="description">Machine Description</Label>
          <textarea
            id="description"
            rows={6}
            disabled={isSubmitting}
            placeholder="Describe condition, maintenance history, specifications, and seller notes."
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Images</h2>
        <p className="mt-1 text-sm text-gray-500">
          Keep existing photos, remove any you do not want, or upload new ones.
        </p>
        <div className="mt-5">
          <ImageUploader value={images} onChange={setImages} disabled={isSubmitting} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push("/seller/machines")}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save as Draft"
          )}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmitForApproval)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-sm font-bold text-gray-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </button>
      </div>
    </form>
  );
}
