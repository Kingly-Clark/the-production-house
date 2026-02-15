import { createClient } from '@/lib/supabase/server';
import { getUserOrganization } from '@/lib/auth/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const organization = await getUserOrganization(supabase);

    return NextResponse.json(organization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
