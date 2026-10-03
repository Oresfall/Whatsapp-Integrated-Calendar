import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Nomor WhatsApp dan Kode OTP wajib diisi' }, { status: 400 });
    }

    // 1. STANDARDISASI FORMAT NOMOR TELEPON (PENTING!)
    let formattedPhone = phone.trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    // 2. Cari OTP yang cocok menggunakan formattedPhone
    const { data, error } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('otp_code', otp.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Kode OTP salah atau tidak ditemukan' }, { status: 400 });
    }

    // 3. Cek apakah OTP sudah kadaluarsa
    const isExpired = new Date() > new Date(data.expires_at);
    if (isExpired) {
      await supabaseAdmin.from('otps').delete().eq('id', data.id);
      return NextResponse.json({ error: 'Kode OTP sudah kadaluarsa, silakan minta kode baru' }, { status: 400 });
    }

    // 4. Hapus OTP setelah berhasil diverifikasi
    await supabaseAdmin.from('otps').delete().eq('id', data.id);

    // 5. Set Cookie Session Login
    const cookieStore = await cookies();
    cookieStore.set('user_phone', formattedPhone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
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