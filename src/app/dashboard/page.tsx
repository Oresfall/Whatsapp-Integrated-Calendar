"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  due_date: string;
  due_time: string;
  category: string;
  is_completed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();

  // Tab Sidebar: "calendar" atau "settings"
  const [activeTab, setActiveTab] = useState<"calendar" | "settings">("calendar");

  // State Kalender & Data
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // State Settings (Pengingat)
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState("24"); // Default 24 jam (1x sehari)
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");

  // Fetch data tugas & pengaturan dari API
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch Tasks
        const resTasks = await fetch("/api/tasks");
        if (resTasks.ok) {
          const dataTasks = await resTasks.json();
          setTasks(dataTasks.tasks || []);
        }

        // Fetch Settings
        const resSettings = await fetch("/api/settings");
        if (resSettings.ok) {
          const dataSettings = await resSettings.json();
          if (dataSettings.settings) {
            setReminderEnabled(dataSettings.settings.reminder_enabled);
            setReminderInterval(String(dataSettings.settings.reminder_interval || "24"));
          }
        }
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Simpan Pengaturan
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsStatus("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_enabled: reminderEnabled,
          reminder_interval: reminderInterval,
        }),
      });

      if (res.ok) {
        setSettingsStatus("Pengaturan berhasil disimpan!");
      } else {
        setSettingsStatus("Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      setSettingsStatus("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Helper Navigasi Bulan
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper Perhitungan Kalender
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const formatDateString = (dayNumber: number) => {
    const formattedMonth = String(month + 1).padStart(2, "0");
    const formattedDay = String(dayNumber).padStart(2, "0");
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* ----------------- SIDEBAR KIRI ----------------- */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 px-3 py-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
              W
            </div>
            <span className="font-bold text-lg tracking-wide text-white">WA Calendar</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === "calendar"
                  ? "bg-slate-800 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                activeTab === "settings"
                  ? "bg-slate-800 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* ----------------- AREA UTAMA (KANAN) ----------------- */}
      <main className="flex-1 flex flex-col bg-slate-900 overflow-y-auto">
        
        {/* TAB 1: KALENDER */}
        {activeTab === "calendar" && (
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  &larr; Bulan Lalu
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Bulan Depan &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Memuat data jadwal...
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {calendarCells.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <div key={`empty-${idx}`} className="bg-slate-950/40 rounded-xl border border-slate-800/30"></div>;
                  }

                  const dateStr = formatDateString(dayNum);
                  const dayTasks = tasks.filter((t) => t.due_date === dateStr);

                  return (
                    <div
                      key={dateStr}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <span className="text-sm font-semibold text-slate-300">
                        {dayNum}
                      </span>

                      <div className="mt-1 space-y-1 overflow-y-auto max-h-24">
                        {dayTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="w-full text-left text-xs p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 truncate hover:bg-emerald-900/60 transition block"
                          >
                            <span className="font-semibold">{task.due_time?.slice(0, 5)}</span> {task.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SETTINGS (PENGINGAT) */}
        {activeTab === "settings" && (
          <div className="p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Pengaturan Pengingat</h2>
            <p className="text-sm text-slate-400 mb-6">
              Atur bagaimana sistem WhatsApp bot mengirimkan pesan pengingat ke nomor Anda.
            </p>

            <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">Notifikasi Pengingat WhatsApp</h3>
                  <p className="text-xs text-slate-400">Aktifkan pengiriman otomatis pesan pengingat jadwal.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    reminderEnabled ? "bg-emerald-500 justify-end" : "bg-slate-700 justify-start"
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                </button>
              </div>

              <hr className="border-slate-800" />

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Interval Pengiriman Pesan
                </label>
                <select
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(e.target.value)}
                  disabled={!reminderEnabled}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="24">Sekali Sehari (Setiap Pagi jam 08.00)</option>
                </select>

                {/* Banner Informasi Batasan Plan */}
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <span className="font-semibold block mb-0.5">Batasan Server Gratisan:</span>
                    Pengiriman otomatis saat ini dibatasi maksimal <strong>1 kali per hari</strong>. Fitur interval per jam akan diaktifkan setelah integrasi layanan cron eksternal.
                  </div>
                </div>
              </div>

              {settingsStatus && (
                <div className={`text-xs p-3 rounded-lg border ${
                  settingsStatus.includes("berhasil") 
                    ? "bg-emerald-950/50 border-emerald-800 text-emerald-400" 
                    : "bg-rose-950/50 border-rose-800 text-rose-400"
                }`}>
                  {settingsStatus}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
              >
                {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETAIL TASK */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {selectedTask.category || "Tugas"}
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tenggat: <span className="text-slate-200 font-medium">{selectedTask.due_date}</span> jam <span className="text-slate-200 font-medium">{selectedTask.due_time}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}