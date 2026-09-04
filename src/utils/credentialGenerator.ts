import { User, UserRole } from '../types';

/**
 * Normalizes a full name into a clean, alphanumeric slug for username generation
 */
export const sanitizeNameForUsername = (fullName: string): string => {
  if (!fullName) return 'user';
  return fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12) || 'user';
};

/**
 * Generates a clean, friendly, guaranteed-unique username based on role, name, and existing users
 */
export const generateUsername = (
  fullName: string,
  role: UserRole = 'student',
  existingUsers: User[] = []
): string => {
  const rolePrefixMap: Record<UserRole, string> = {
    student: 'stu',
    teacher: 'tea',
    parent: 'par',
    admin: 'adm',
  };

  const prefix = rolePrefixMap[role] || 'usr';
  const nameSlug = sanitizeNameForUsername(fullName);
  
  const existingUsernames = new Set(
    existingUsers
      .map((u) => u.username?.toLowerCase() || u.email.split('@')[0].toLowerCase())
      .filter(Boolean)
  );

  // Generate with 3-digit random number
  for (let i = 0; i < 50; i++) {
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 100-999
    const candidate = `${prefix}.${nameSlug}.${randomSuffix}`;
    if (!existingUsernames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Fallback with timestamp
  return `${prefix}.${nameSlug}.${Date.now().toString().slice(-4)}`;
};

/**
 * Generates an easy-to-read, secure temporary password
 */
export const generatePassword = (_role: UserRole = 'student'): string => {
  const prefixes = ['Ace', 'Learn', 'Star', 'Edu', 'Nova', 'Quest', 'Spark'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  const specialChars = ['#', '@', '!'];
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  return `${prefix}${special}${num}`;
};

/**
 * Clean phone number into international WhatsApp format (digits only, no spaces or dashes)
 */
export const cleanPhoneNumberForWhatsApp = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  return digits;
};

export interface WhatsAppCredentialPayload {
  fullName: string;
  role: UserRole;
  username: string;
  password?: string;
  email?: string;
  className?: string;
  schoolName?: string;
  portalUrl?: string;
}

/**
 * Formats a WhatsApp-ready clipboard message with bold headings, clean alignment, and instructions
 */
export const formatWhatsAppCredentials = ({
  fullName,
  role,
  username,
  password,
  email,
  className,
  schoolName = 'ACEBEE Academy',
  portalUrl = window.location.origin,
}: WhatsAppCredentialPayload): string => {
  const roleDisplay = role.toUpperCase();
  const classLine = className ? `🏫 *Class:* ${className}\n` : '';
  const emailLine = email && !email.endsWith('@acebee.local') ? `📧 *Email:* ${email}\n` : '';
  const passwordLine = password ? `🔒 *Password:* ${password}\n` : '';

  return (
    `🎓 *${schoolName.toUpperCase()} — LOGIN CREDENTIALS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Name:* ${fullName}\n` +
    `🏷️ *Role:* ${roleDisplay}\n` +
    classLine +
    emailLine +
    `🔑 *Login Username:* ${username}\n` +
    passwordLine +
    `🌐 *Portal Link:* ${portalUrl}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_📌 Tip: You can sign in using your Login Username and Password._\n` +
    `_Please keep your credentials confidential._`
  );
};

/**
 * Generates a direct WhatsApp web/app link to send the credentials to a specific phone number or general share
 */
export const getWhatsAppDirectUrl = (phone?: string, message?: string): string => {
  const cleanPhone = cleanPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(message || '');
  if (cleanPhone && cleanPhone.length >= 7) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};
