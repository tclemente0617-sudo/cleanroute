import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import CustomerForm from "@/components/customers/CustomerForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { statusColor, statusLabel, formatDate } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const [{ data: customer }, { data: jobs }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", params.id).single(),
    supabase.from("jobs").select("*").eq("customer_id", params.id).order("scheduled_date", { ascending: false }),
  ]);

  if (!customer) notFound();

  return (
    <div>
      <PageHeader title={customer.name} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-500 mb-4">DETAILS</h2>
          <CustomerForm customer={customer} />
        </Card>

        <Card>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500">JOB HISTORY</h2>
            <Link href={`/jobs/new?customer_id=${customer.id}`} className="text-xs text-green-600 font-medium hover:underline">+ New job</Link>
          </div>
          {!jobs?.length ? (
            <div className="p-8 text-center text-slate-400 text-sm">No jobs yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {jobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{j.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(j.scheduled_date)}</p>
                  </div>
                  <Badge label={statusLabel(j.status)} className={statusColor(j.status)} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
