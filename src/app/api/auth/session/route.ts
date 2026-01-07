import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 55 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error setting auth cookie', error);
    return NextResponse.json(
      { error: 'Faild to set auth cookie' },
      { status: 500 }
    );
  }
}

export async function DELETE(){
  const response = NextResponse.json({success: true});
  response.cookies.delete('session');
  response.cookies.delete('firebaseToken');
  return response;
}
