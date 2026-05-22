import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, PageHeader, Badge, Button } from "@/components/ui";
import { statusColor, statusLabel, formatDate, formatTime } from "@/lib/utils";
import { format, startOfWeek, addDays, parseISO, isToday } from "date-fns";

export default async function SchedulePage() {
  const supabase = await createClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, customer:customers(name), worker:workers(name)")
    .gte("scheduled_date", format(weekStart, "yyyy-MM-dd"))
    .lte("scheduled_date", format(weekEnd, "yyyy-MM-dd"))
    .order("scheduled_time", { ascending: true });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      <PageHeader
        title="Schedule"
        action={<Link href="/jobs/new"><Button size="sm">+ New job</Button></Link>}
      />
      <p className="text-sm text-slate-500 mb-5">
        Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
      </p>

      <div className="grid gap-3">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayJobs = jobs?.filter((j) => j.scheduled_date === dateStr) ?? [];
          const today = isToday(day);

          return (
            <Card key={dateStr} className={today ? "border-green-300" : ""}>
              <div className={`px-4 py-2 border-b text-sm font-semibold flex items-center gap-2 ${today ? "bg-green-50 border-green-200 text-green-800" : "border-slate-100 text-slate-600"}`}>
                {format(day, "EEEE, MMM d")}
                {today && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Today</span>}
                <span className="ml-auto text-xs font-normal text-slate-400">{dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}</span>
              </div>
              {dayJobs.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400">No jobs</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {dayJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">
                          {(job.customer as { name: string })?.name}
                          {job.scheduled_time && ` · ${formatTime(job.scheduled_time)}`}
                        </p>
                      </div>
                      <Badge label={statusLabel(job.status)} className={statusColor(job.status)} />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
