/**
 * email.js
 * 
 * E-posta gönderme yardımcı fonksiyonu.
 * Şifre sıfırlama ve bildirim e-postaları gönderir.
 */

const nodemailer = require('nodemailer');

/**
 * E-posta gönder
 * @param {Object} options - E-posta seçenekleri
 * @param {string} options.email - Alıcı e-posta adresi
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.message - E-posta içeriği
 * @param {string} options.html - HTML formatında e-posta içeriği (isteğe bağlı)
 */
exports.sendEmail = async (options) => {
  // SMTP yapılandırması
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    }
  });
  
  // E-posta seçenekleri
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'QuickyTrade'} <${process.env.FROM_EMAIL || 'noreply@quickytrade.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  
  // HTML içeriği varsa ekle
  if (options.html) {
    mailOptions.html = options.html;
  }
  
  // E-postayı gönder
  const info = await transporter.sendMail(mailOptions);
  
  console.log(`E-posta gönderildi: ${info.messageId}`);
  
  return info;
}; 