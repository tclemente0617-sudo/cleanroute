import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader, Badge, Button } from "@/components/ui";
import { statusColor, statusLabel, formatDate, formatTime } from "@/lib/utils";
import { MapPin, Clock, User, RefreshCw, ExternalLink } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const [{ data: job }, { data: checklist }, { data: photos }, { data: customers }, { data: workers }] =
    await Promise.all([
      supabase.from("jobs").select("*, customer:customers(name), worker:workers(name)").eq("id", params.id).single(),
      supabase.from("job_checklist_items").select("*").eq("job_id", params.id).order("sort_order"),
      supabase.from("job_photos").select("*").eq("job_id", params.id),
      supabase.from("customers").select("*").order("name"),
      supabase.from("workers").select("*").eq("active", true).order("name"),
    ]);

  if (!job) notFound();

  const { data: { publicUrl: bucketBase } } = supabase.storage.from("job-photos").getPublicUrl("");
  const workerPageUrl = `/job/${job.id}`;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {(job.customer as { name: string })?.name} · {formatDate(job.scheduled_date)}
            {job.scheduled_time && ` · ${formatTime(job.scheduled_time)}`}
          </p>
        </div>
        <Badge label={statusLabel(job.status)} className={statusColor(job.status)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job info + edit */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Job Details</h2>
            {job.address && <div className="flex gap-2 text-sm"><MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" /><span>{job.address}</span></div>}
            {job.scheduled_time && <div className="flex gap-2 text-sm"><Clock size={14} className="text-slate-400 mt-0.5 shrink-0" /><span>{formatTime(job.scheduled_time)}</span></div>}
            {job.worker && <div className="flex gap-2 text-sm"><User size={14} className="text-slate-400 mt-0.5 shrink-0" /><span>{(job.worker as { name: string })?.name}</span></div>}
            {job.frequency !== "once" && <div className="flex gap-2 text-sm"><RefreshCw size={14} className="text-slate-400 mt-0.5 shrink-0" /><span className="capitalize">{job.frequency}</span></div>}
            {job.notes && <p className="text-sm text-slate-600 border-t border-slate-100 pt-3">{job.notes}</p>}
          </Card>

          {/* Worker link */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Worker Mobile Link</p>
            <p className="text-xs text-slate-500 mb-3">Send this to your cleaner. They can check in, complete the checklist, and upload photos.</p>
            <a href={workerPageUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="w-full">
                <ExternalLink size={14} />
                Open worker page
              </Button>
            </a>
          </Card>

          {/* Edit form */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Edit Job</h2>
            <JobForm job={job} customers={customers ?? []} workers={workers ?? []} />
          </Card>
        </div>

        {/* Checklist + photos */}
        <div className="space-y-4">
          {checklist && checklist.length > 0 && (
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Checklist ({checklist.filter(i => i.is_checked).length}/{checklist.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.is_checked ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                      {item.is_checked && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${item.is_checked ? "line-through text-slate-400" : "text-slate-700"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Photos */}
          {photos && photos.length > 0 && (
            <Card className="p-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Photos</h2>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative">
                    <img src={`${bucketBase}${p.storage_path}`} alt={p.photo_type} className="w-full h-32 object-cover rounded-lg" />
                    <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full capitalize">{p.photo_type}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {job.arrived_at && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Timeline</p>
              <p className="text-sm text-slate-700">Arrived: {new Date(job.arrived_at).toLocaleString()}</p>
              {job.completed_at && <p className="text-sm text-slate-700">Completed: {new Date(job.completed_at).toLocaleString()}</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
