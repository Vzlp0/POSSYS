import { getStatusLabel } from './prHelpers';

export interface PRNotificationData {
  prNumber: string;
  status: string;
  managerName: string;
  requesterEmail: string;
  requesterName: string;
  comment?: string;
}

export const generateEmailNotification = (data: PRNotificationData): string => {
  const subject = `Purchase Request ${data.prNumber} - ${getStatusLabel(data.status)}`;

  let body = `Dear ${data.requesterName},\n\n`;
  body += `Your Purchase Request ${data.prNumber} has been ${getStatusLabel(data.status).toLowerCase()}.\n\n`;
  body += `Status: ${getStatusLabel(data.status)}\n`;
  body += `Updated by: ${data.managerName}\n`;
  body += `Date: ${new Date().toLocaleString()}\n\n`;

  if (data.comment) {
    body += `Comment/Reason:\n${data.comment}\n\n`;
  }

  body += `Please log in to the system to view full details.\n\n`;
  body += `Best regards,\nProcurement System`;

  return `mailto:${data.requesterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const generateWhatsAppMessage = (data: PRNotificationData): string => {
  let message = `*Purchase Request Update*\n\n`;
  message += `PR Number: ${data.prNumber}\n`;
  message += `Status: ${getStatusLabel(data.status)}\n`;
  message += `Updated by: ${data.managerName}\n`;
  message += `Date: ${new Date().toLocaleString()}\n`;

  if (data.comment) {
    message += `\nComment:\n${data.comment}\n`;
  }

  message += `\nPlease check the system for full details.`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const sendNotification = (data: PRNotificationData, type: 'email' | 'whatsapp') => {
  if (type === 'email') {
    window.open(generateEmailNotification(data), '_blank');
  } else {
    window.open(generateWhatsAppMessage(data), '_blank');
  }
};
