"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, PageHeader } from "@/components/ui";

export default function NewWorkerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("workers").insert({ ...form, owner_id: user.id });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/workers"); router.refresh(); }
  }

  return (
    <div>
      <PageHeader title="Add Worker" />
      <Card className="p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name *" value={form.name} onChange={set("name")} required placeholder="Alex Rivera" />
          <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="732-555-0100" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="alex@example.com" />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add worker"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
