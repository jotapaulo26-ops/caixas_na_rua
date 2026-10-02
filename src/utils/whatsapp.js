export function formatWhatsAppMessage({
  clientName,
  operationType, // 'DELIVERED' or 'COLLECTED'
  crateName,
  quantity,
  newBalance,
  date = new Date(),
  notes = ''
}) {
  const d = new Date(date);
  const dateFormatted = d.toLocaleDateString('pt-BR');
  const timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isDelivered = operationType === 'DELIVERED';
  const icon = isDelivered ? '🟢' : '🔄';
  const opText = isDelivered ? 'DEIXAMOS (Empréstimo)' : 'RECOLHEMOS (Devolução)';

  let message = `📦 *COMPROVANTE DE VASILHAMES*\n`;
  message += `━━━━━━━━━━━━━━━━━━━\n`;
  message += `📍 *Cliente:* ${clientName}\n`;
  message += `📅 *Data/Hora:* ${dateFormatted} às ${timeFormatted}\n\n`;

  message += `${icon} *Operação:* ${opText}\n`;
  message += `📦 *Tipo:* ${crateName}\n`;
  message += `🔢 *Quantidade:* ${quantity} un.\n`;
  if (notes) {
    message += `📝 *Obs:* ${notes}\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 *SALDO ATUAL EM POSSE:* *${newBalance} caixas*\n`;
  message += `_Controle de caixas e vasilhames do entregador_\n`;
  message += `Obrigado pela parceria! 🤝`;

  return message;
}

export function openWhatsAppLink(phone, message) {
  // Clean phone number (remove non-digits)
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);

  if (cleanPhone) {
    // Add Brazil country code if not present (10 or 11 digits: DDD + number)
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodedText}`, '_blank');
  } else {
    // Open WhatsApp picker with pre-filled text
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }
}
