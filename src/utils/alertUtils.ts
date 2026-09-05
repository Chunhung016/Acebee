import { ParentAlert } from '../types';

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  // Remove all non-digits except leading +
  let clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  } else if (clean.startsWith('0')) {
    // Default Malaysian/international prefix if starts with 0
    clean = '60' + clean.substring(1);
  }
  return clean;
}

export function buildParentAlertMessage(data: {
  parentName: string;
  studentName: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  teacherFeedback?: string;
  schoolName?: string;
}): string {
  const school = data.schoolName || 'ACEBEE Academy';
  const feedbackLine = data.teacherFeedback
    ? `\n\n📝 *Teacher Feedback:* "${data.teacherFeedback}"`
    : '';

  return (
    `📢 *${school} - Assessment Result Notification*\n\n` +
    `Dear ${data.parentName},\n` +
    `Your child *${data.studentName}*'s results for *${data.quizTitle}* (${data.subject}) have been released.\n\n` +
    `📊 *Score:* ${data.score} / ${data.totalPoints} (${data.percentage}%)\n` +
    `🎯 *Status:* Graded & Released` +
    feedbackLine +
    `\n\nYou can log in to the Parent Portal to review detailed answer breakdowns and personalized learning diagnostics.\n\n` +
    `Warm regards,\n*Academic Department, ${school}*`
  );
}

export function createWhatsAppShareLink(phone: string, message: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function createEmailShareLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
