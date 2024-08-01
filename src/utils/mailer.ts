import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

interface MailOptions {
    to: string;
    subject: string;
    text: string;
}

export const sendMail = async (mailOptions: MailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text,
        });
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
