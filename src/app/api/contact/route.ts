import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  phone: string;
  trafficSource: string;
  utm: Record<string, string>;
  submittedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ContactPayload = await request.json();

    const response = await fetch(
      'https://webhook.elev8.com.br/webhook/e400a55e-a59d-4130-9add-db88cd65bfd1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao enviar (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota de contato:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
