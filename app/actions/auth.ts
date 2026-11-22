'use server';

export async function verifyCommandCenterPassword(password: string) {
  const expectedPassword = process.env.COMMAND_CENTER_PASSWORD || 'Osama@2026';

  if (!password || password !== expectedPassword) {
    return {
      success: false,
      error: 'رمز الدخول غير صحيح. الوصول مصرح لمدير العمليات فقط.',
    };
  }

  return { success: true };
}