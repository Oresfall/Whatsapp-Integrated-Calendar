import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function sendWhatsAppReminder(targetPhone, taskTitle, dueDate, dueTime) {
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (!fonnteToken) return;

  const message = `🔔 *PENGINGAT JADWAL MENDATANG*\n\nHalo! Kamu memiliki tugas/jadwal yang mendekati tenggat waktu:\n\n📌 *Judul:* ${taskTitle}\n📅 *Tanggal:* ${dueDate}\n⏰ *Jam:* ${dueTime}\n\nJangan lupa diselesaikan ya!`;

  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': fonnteToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: targetPhone,
      message: message,
    }),
  });
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // 1. Ambil seluruh tasks hari ini yang belum selesai
    const { data: upcomingTasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .eq('due_date', todayStr);

    if (taskError) throw taskError;

    if (!upcomingTasks || upcomingTasks.length === 0) {
      return NextResponse.json({ status: 'success', message: 'Tidak ada jadwal untuk diingatkan saat ini' });
    }

    // 2. Ambil seluruh pengaturan pengguna
    const { data: allSettings } = await supabaseAdmin
      .from('user_settings')
      .select('*');

    const settingsMap = new Map();
    if (allSettings) {
      allSettings.forEach(s => settingsMap.set(s.phone, s));
    }

    let sentCount = 0;

    for (const task of upcomingTasks) {
      if (!task.user_phone) continue;

      const userSetting = settingsMap.get(task.user_phone);

      // Cek apakah notifikasi di-disable oleh pengguna
      if (userSetting && userSetting.reminder_enabled === false) {
        continue; // Skip jika pengingat dinonaktifkan
      }

      // Cek interval jam pengiriman
      const interval = userSetting?.reminder_interval || 2;
      if (currentHour % interval !== 0) {
        continue; // Skip jika belum masuk siklus interval jamnya
      }

      await sendWhatsAppReminder(
        task.user_phone,
        task.title,
        task.due_date,
        task.due_time || '23:59'
      );
      sentCount++;
    }

    return NextResponse.json({
      status: 'success',
      message: `Berhasil mengirim ${sentCount} pengingat WhatsApp`,
      processedTasks: upcomingTasks.length
    });

  } catch (err) {
    console.error('Cron Reminder Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}