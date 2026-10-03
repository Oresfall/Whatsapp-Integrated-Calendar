import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('user_phone')?.value;

  if (!phone) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, phone });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('user_phone');
  return NextResponse.json({ status: 'success', message: 'Logged out' });
}