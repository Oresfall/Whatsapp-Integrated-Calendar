import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Nomor WhatsApp dan Kode OTP wajib diisi' }, { status: 400 });
    }

    // 1. Cari OTP yang cocok di database
    const { data, error } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('otp_code', otp)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Kode OTP salah atau tidak ditemukan' }, { status: 400 });
    }

    // 2. Cek apakah OTP sudah kadaluarsa
    const isExpired = new Date() > new Date(data.expires_at);
    if (isExpired) {
      await supabaseAdmin.from('otps').delete().eq('id', data.id);
      return NextResponse.json({ error: 'Kode OTP sudah kadaluarsa, silakan minta kode baru' }, { status: 400 });
    }

    // 3. OTP Valid! Hapus OTP agar tidak bisa dipakai 2 kali
    await supabaseAdmin.from('otps').delete().eq('id', data.id);

    // 4. Set HTTP-Only Cookie untuk menandai Session Login
    const cookieStore = await cookies();
    cookieStore.set('user_phone', phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // Login bertahan selama 7 hari
    });

    return NextResponse.json({ 
      status: 'success', 
      message: 'Verifikasi berhasil, selamat datang!' 
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}