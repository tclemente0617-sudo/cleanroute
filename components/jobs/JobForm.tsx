"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea, Select } from "@/components/ui";
import type { Customer, Worker, Job } from "@/lib/types";

type Props = {
  job?: Job;
  customers: Customer[];
  workers: Worker[];
  defaultCustomerId?: string;
};

const DEFAULT_CHECKLIST = [
  "Vacuum all floors",
  "Mop hard floors",
  "Clean bathrooms",
  "Empty trash bins",
  "Wipe counters and surfaces",
  "Clean kitchen/break room",
];

export default function JobForm({ job, customers, workers, defaultCustomerId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!job;

  const [form, setForm] = useState({
    title: job?.title ?? "",
    customer_id: job?.customer_id ?? defaultCustomerId ?? "",
    worker_id: job?.worker_id ?? "",
    address: job?.address ?? "",
    scheduled_date: job?.scheduled_date ?? "",
    scheduled_time: job?.scheduled_time ?? "",
    frequency: job?.frequency ?? "once",
    notes: job?.notes ?? "",
  });
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_CHECKLIST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      ...form,
      worker_id: form.worker_id || null,
      owner_id: user.id,
    };

    let jobId = job?.id;

    if (isEdit) {
      const { error } = await supabase.from("jobs").update(payload).eq("id", job!.id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("jobs").insert(payload).select().single();
      if (error) { setError(error.message); setLoading(false); return; }
      jobId = data.id;

      // Insert checklist items
      const items = checklist
        .filter((l) => l.trim())
        .map((label, i) => ({ job_id: jobId!, owner_id: user.id, label, sort_order: i }));
      if (items.length) await supabase.from("job_checklist_items").insert(items);
    }

    router.push(`/jobs/${jobId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Job title *" value={form.title} onChange={set("title")} required placeholder="Office deep clean" />

      <Select label="Customer *" value={form.customer_id} onChange={set("customer_id")} required>
        <option value="">Select customer...</option>
        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      <Select label="Assign worker" value={form.worker_id} onChange={set("worker_id")}>
        <option value="">Unassigned</option>
        {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </Select>

      <Input label="Job address" value={form.address} onChange={set("address")} placeholder="Same as customer" />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={form.scheduled_date} onChange={set("scheduled_date")} required />
        <Input label="Time" type="time" value={form.scheduled_time} onChange={set("scheduled_time")} />
      </div>

      <Select label="Frequency" value={form.frequency} onChange={set("frequency")}>
        <option value="once">One time</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">Bi-weekly</option>
        <option value="monthly">Monthly</option>
      </Select>

      <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={2} placeholder="Access code, special instructions..." />

      {!isEdit && (
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Checklist</label>
          <div className="space-y-1.5">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={item}
                  onChange={(e) => {
                    const next = [...checklist];
                    next[i] = e.target.value;
                    setChecklist(next);
                  }}
                />
                <button type="button" onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-500 text-lg leading-none">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setChecklist([...checklist, ""])}
              className="text-xs text-green-600 font-medium hover:underline mt-1">+ Add item</button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save changes" : "Create job"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
