"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea } from "@/components/ui";
import type { Customer } from "@/lib/types";

export default function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!customer;

  const [form, setForm] = useState({
    name: customer?.name ?? "",
    contact_name: customer?.contact_name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...form, owner_id: user.id };

    const { error } = isEdit
      ? await supabase.from("customers").update(payload).eq("id", customer!.id)
      : await supabase.from("customers").insert(payload);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/customers");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this customer?")) return;
    await supabase.from("customers").delete().eq("id", customer!.id);
    router.push("/customers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <Input label="Business name *" value={form.name} onChange={set("name")} required placeholder="Acme Corp" />
      <Input label="Contact name" value={form.contact_name} onChange={set("contact_name")} placeholder="Jane Smith" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="732-555-0100" />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="jane@acme.com" />
      </div>
      <Input label="Address" value={form.address} onChange={set("address")} placeholder="123 Main St, NJ" />
      <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={3} placeholder="Key code, gate access, preferences..." />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save changes" : "Add customer"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        {isEdit && (
          <Button type="button" variant="danger" className="ml-auto" onClick={handleDelete}>Delete</Button>
        )}
      </div>
    </form>
  );
}
