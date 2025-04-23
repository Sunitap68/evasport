// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const encoded = authHeader.split(' ')[1];
    const [username, password] = atob(encoded).split(':');

    if (username === 'kathiriya' && password === 'weUcIpxwV$@*&') {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: '/admin/dashboard', // You can change this to protect more routes
};
