import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET: Ambil pengaturan pengguna saat ini
export async function GET() {
  try {
    const cookieStore = await cookies();
    const phone = cookieStore.get('user_phone')?.value;

    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = Data belum ada
      throw error;
    }

    // Default settings jika user baru pertama kali buka
    const settings = data || {
      phone,
      reminder_enabled: true,
      reminder_interval: 2,
    };

    return NextResponse.json({ status: 'success', settings });
  } catch (err) {
    console.error('Get Settings Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Simpan/Update pengaturan pengguna
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const phone = cookieStore.get('user_phone')?.value;

    if (!phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reminder_enabled, reminder_interval } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        phone,
        reminder_enabled,
        reminder_interval: parseInt(reminder_interval, 10),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      message: 'Pengaturan berhasil disimpan!',
      settings: data,
    });
  } catch (err) {
    console.error('Save Settings Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}