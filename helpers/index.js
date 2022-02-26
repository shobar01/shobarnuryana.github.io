const nodemailer = require('nodemailer');

exports.kirimEmail = dataEmail => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: 'shobarnuryana@gmail.com',
            pass: 'bdwsmdlhahyypoca',
        }
    })
    return (
        transporter.sendMail(dataEmail)
        .then(info => console.log(`Email Terkirim: ${info.message}`))
        .catch(err => console.log(`Terjadi Kesalahan: ${err}`))
    )
}