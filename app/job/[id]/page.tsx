"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Job, ChecklistItem, JobPhoto } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { MapPin, Clock, CheckCircle, Camera, Upload } from "lucide-react";

export default function WorkerJobPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [job, setJob] = useState<Job | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState<"before" | "after">("before");

  useEffect(() => {
    async function load() {
      const [{ data: j }, { data: c }, { data: p }] = await Promise.all([
        supabase.from("jobs").select("*, customer:customers(name), worker:workers(name)").eq("id", params.id).single(),
        supabase.from("job_checklist_items").select("*").eq("job_id", params.id).order("sort_order"),
        supabase.from("job_photos").select("*").eq("job_id", params.id),
      ]);
      setJob(j);
      setChecklist(c ?? []);
      setPhotos(p ?? []);
      setCompleted(j?.status === "completed");
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function checkIn() {
    await supabase.from("jobs").update({ status: "in_progress", arrived_at: new Date().toISOString() }).eq("id", params.id);
    setJob((j) => j ? { ...j, status: "in_progress", arrived_at: new Date().toISOString() } : j);
  }

  async function toggleItem(item: ChecklistItem) {
    const next = !item.is_checked;
    await supabase.from("job_checklist_items").update({ is_checked: next }).eq("id", item.id);
    setChecklist((c) => c.map((i) => i.id === item.id ? { ...i, is_checked: next } : i));
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${params.id}/${photoType}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("job-photos").upload(path, file);
    if (!error) {
      const { data } = await supabase.from("job_photos").insert({
        job_id: params.id,
        owner_id: job!.owner_id,
        storage_path: path,
        photo_type: photoType,
      }).select().single();
      if (data) setPhotos((p) => [...p, data]);
    }
    setUploading(false);
    if (photoInput.current) photoInput.current.value = "";
  }

  async function markComplete() {
    await supabase.from("jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", params.id);
    setCompleted(true);
    setJob((j) => j ? { ...j, status: "completed" } : j);
  }

  const { data: { publicUrl: base } } = supabase.storage.from("job-photos").getPublicUrl("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Job not found.</p></div>;
  }

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Job Complete!</h1>
        <p className="text-slate-500 mt-2">{job.title}</p>
        <p className="text-sm text-slate-400 mt-1">{formatDate(job.scheduled_date)}</p>
      </div>
    );
  }

  const checkedCount = checklist.filter((i) => i.is_checked).length;
  const allChecked = checklist.length > 0 && checkedCount === checklist.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-xs font-bold">CR</div>
          <span className="text-xs text-slate-400">CleanRoute</span>
        </div>
        <h1 className="text-xl font-bold mt-3">{job.title}</h1>
        <p className="text-slate-400 text-sm mt-1">{(job.customer as { name: string })?.name}</p>
        <div className="flex items-center gap-4 mt-3">
          {job.address && <span className="flex items-center gap-1 text-xs text-slate-300"><MapPin size={12} />{job.address}</span>}
          {job.scheduled_time && <span className="flex items-center gap-1 text-xs text-slate-300"><Clock size={12} />{formatTime(job.scheduled_time)}</span>}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Check in */}
        {job.status === "scheduled" && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-900 mb-1">Check In</h2>
            <p className="text-sm text-slate-500 mb-4">Tap when you arrive on site</p>
            <button onClick={checkIn}
              className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-transform">
              ✓ I&apos;ve Arrived
            </button>
          </div>
        )}

        {job.arrived_at && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            Arrived at {new Date(job.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}

        {/* Photos */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Camera size={16} /> Photos</h2>
          <div className="flex gap-2 mb-3">
            {(["before", "after"] as const).map((t) => (
              <button key={t} onClick={() => setPhotoType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${photoType === t ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => photoInput.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-5 text-sm text-slate-500 flex flex-col items-center gap-2 hover:border-green-400 transition-colors">
            <Upload size={20} className={uploading ? "animate-bounce text-green-500" : "text-slate-400"} />
            {uploading ? "Uploading..." : `Upload ${photoType} photo`}
          </button>
          <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadPhoto} />
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {photos.map((p) => (
                <div key={p.id} className="relative">
                  <img src={`${base}${p.storage_path}`} alt={p.photo_type} className="w-full h-28 object-cover rounded-lg" />
                  <span className="absolute top-1.5 left-1.5 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full capitalize">{p.photo_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Checklist</h2>
              <span className="text-sm text-slate-500">{checkedCount}/{checklist.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {checklist.map((item) => (
                <button key={item.id} onClick={() => toggleItem(item)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-slate-50 transition-colors">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.is_checked ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                    {item.is_checked && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm ${item.is_checked ? "line-through text-slate-400" : "text-slate-800"}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Complete */}
        {job.status === "in_progress" && (
          <button onClick={markComplete}
            disabled={checklist.length > 0 && !allChecked}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform">
            {checklist.length > 0 && !allChecked
              ? `Complete checklist first (${checkedCount}/${checklist.length})`
              : "Mark Job Complete"}
          </button>
        )}

        {job.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Notes</p>
            <p>{job.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
