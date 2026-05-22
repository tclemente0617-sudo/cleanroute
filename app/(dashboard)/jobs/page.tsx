import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Button, Badge } from "@/components/ui";
import { statusColor, statusLabel, formatDate, formatTime } from "@/lib/utils";
import { Briefcase } from "lucide-react";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, customer:customers(name), worker:workers(name)")
    .order("scheduled_date", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Jobs"
        action={<Link href="/jobs/new"><Button size="sm">+ New job</Button></Link>}
      />

      {!jobs?.length ? (
        <Card className="p-12 text-center">
          <Briefcase size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No jobs yet</p>
          <Link href="/jobs/new" className="text-green-600 text-sm font-medium mt-2 inline-block hover:underline">Create your first job</Link>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-slate-50">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(job.customer as { name: string })?.name} · {formatDate(job.scheduled_date)}
                    {job.scheduled_time && ` · ${formatTime(job.scheduled_time)}`}
                    {job.worker && ` · ${(job.worker as { name: string })?.name}`}
                  </p>
                </div>
                <Badge label={statusLabel(job.status)} className={statusColor(job.status)} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
