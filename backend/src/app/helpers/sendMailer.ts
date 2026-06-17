// import nodemailer from 'nodemailer';
// import config from '../config';

// console.log('Email configuration:', {
//   host: config.email.host,
//   port: config.email.port,
//   post: config.email.address,
//   pass: config.email.pass,
// });
// const sendMailer = async (email: string, subject?: string, html?: string) => {
//   const transporter = nodemailer.createTransport({
//     host: config.email.host,
//     port: Number(config.email.port),
//     secure: false,
//     auth: {
//       user: config.email.address,
//       pass: config.email.pass,
//     },
//   } as any);

//   const info = await transporter.sendMail({
//     from: `"your company name" ${config.email.from}`,
//     to: email,
//     subject,
//     html,
//   });

//   console.log('Message sent:', info.messageId);
// };

// export default sendMailer;


import nodemailer from 'nodemailer';
import config from '../config';

const sendMailer = async (email: string, subject?: string, html?: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',   
    port: 465,                
    secure: true,             
    family: 4,                
    auth: {
      user: config.email.address,
      pass: config.email.pass,
    },
  } as any);

  const info = await transporter.sendMail({
    from: `"Mess Management" ${config.email.from}`,
    to: email,
    subject,
    html,
  });
};

export default sendMailer;



// import { Resend } from 'resend';
// import config from '../config';

// const resend = new Resend(config.resend_apiKey);

// const sendMailer = async (email: string, subject?: string, html?: string) => {
//   const { data, error } = await resend.emails.send({
//     from: 'onboarding@resend.dev', // use resend's default until you verify a domain
//     to: email,
//     subject: subject || '',
//     html: html || '',
//   });

//   if (error) throw new Error(error.message);

//   console.log('Message sent:', data?.id);
// };

// export default sendMailer;