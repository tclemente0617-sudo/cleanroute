import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import JobForm from "@/components/jobs/JobForm";

export default async function NewJobPage({ searchParams }: { searchParams: { customer_id?: string } }) {
  const supabase = await createClient();
  const [{ data: customers }, { data: workers }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("workers").select("*").eq("active", true).order("name"),
  ]);

  return (
    <div>
      <PageHeader title="New Job" />
      <Card className="p-6">
        <JobForm
          customers={customers ?? []}
          workers={workers ?? []}
          defaultCustomerId={searchParams.customer_id}
        />
      </Card>
    </div>
  );
}
