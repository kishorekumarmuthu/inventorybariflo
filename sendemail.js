const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'bestwork08@gmail.com',
        pass: 'sunshine0518',
    },
});

async function emailAlert(to, subject, message){
    const mailOptions = {
        from: 'bestwork08@gmail.com',
        to: to,
        subject: subject,
        html: message
    };
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        }
        console.log(`Message sent: ${info.response}`);
    });
}

module.exports = {emailAlert}


