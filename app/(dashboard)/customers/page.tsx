import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, Badge, PageHeader, Button } from "@/components/ui";
import { Building2, Phone, Mail } from "lucide-react";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Customers"
        action={
          <Link href="/customers/new">
            <Button size="sm">+ Add customer</Button>
          </Link>
        }
      />

      {!customers?.length ? (
        <Card className="p-12 text-center">
          <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No customers yet</p>
          <Link href="/customers/new" className="text-green-600 text-sm font-medium mt-2 inline-block hover:underline">Add your first customer</Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="p-4 hover:border-green-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    {c.contact_name && <p className="text-sm text-slate-500 mt-0.5">{c.contact_name}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      {c.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={12} />{c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail size={12} />{c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
