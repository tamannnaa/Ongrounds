const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'whateverrbroochill@gmail.com',
        pass: 'azbskeczkkruabyt'
    }
});

const sendEmail = (to, subject, html) => {
    const mailOptions = {
        from: '"Ongrounds" <whateverrbroochill@gmail.com>',
        to,
        subject,
        html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email: ", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};



module.exports = { sendEmail };
