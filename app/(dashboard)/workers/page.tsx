import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Button } from "@/components/ui";
import { UserCheck, Phone, Mail } from "lucide-react";

export default async function WorkersPage() {
  const supabase = await createClient();
  const { data: workers } = await supabase.from("workers").select("*").order("name");

  return (
    <div>
      <PageHeader
        title="Workers"
        action={<Link href="/workers/new"><Button size="sm">+ Add worker</Button></Link>}
      />
      {!workers?.length ? (
        <Card className="p-12 text-center">
          <UserCheck size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No workers yet</p>
          <Link href="/workers/new" className="text-green-600 text-sm font-medium mt-2 inline-block hover:underline">Add your first worker</Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workers.map((w) => (
            <Card key={w.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{w.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  {w.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone size={12} />{w.phone}</span>}
                  {w.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail size={12} />{w.email}</span>}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${w.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {w.active ? "Active" : "Inactive"}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
