import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";
import { statusColor, statusLabel, formatTime } from "@/lib/utils";
import { Briefcase, Users, UserCheck, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: todayJobs }, { data: allJobs }, { data: customers }, { data: workers }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*, customer:customers(name), worker:workers(name)")
        .eq("scheduled_date", today)
        .order("scheduled_time", { ascending: true }),
      supabase.from("jobs").select("status"),
      supabase.from("customers").select("id"),
      supabase.from("workers").select("id").eq("active", true),
    ]);

  const completed = allJobs?.filter((j) => j.status === "completed").length ?? 0;

  const stats = [
    { label: "Today's Jobs", value: todayJobs?.length ?? 0, icon: Briefcase, color: "text-blue-600 bg-blue-50" },
    { label: "Customers", value: customers?.length ?? 0, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Active Workers", value: workers?.length ?? 0, icon: UserCheck, color: "text-green-600 bg-green-50" },
    { label: "Jobs Completed", value: completed, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Today's Jobs */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Today&apos;s Jobs</h2>
          <Link href="/jobs/new" className="text-xs text-green-600 font-medium hover:underline">+ New job</Link>
        </div>
        {!todayJobs?.length ? (
          <div className="p-8 text-center text-slate-400 text-sm">No jobs scheduled today</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(job.customer as { name: string })?.name}
                    {job.scheduled_time && ` · ${formatTime(job.scheduled_time)}`}
                    {job.worker && ` · ${(job.worker as { name: string })?.name}`}
                  </p>
                </div>
                <Badge label={statusLabel(job.status)} className={statusColor(job.status)} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
