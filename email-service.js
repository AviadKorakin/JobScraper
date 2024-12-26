const nodemailer = require('nodemailer');

// Function to send email with the HTML file
const sendEmail = async () => {
    try {
        // Configure the Gmail transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'restaurantemailmaker@gmail.com', // Replace with your email
                pass: 'aumjywjqjcnfitnc',   // Use an App Password (not your main password)
            },
        });
        // Define email options
        const mailOptions = {
            from: 'YourAssistant@gmail.com',
            to: 'aviad825@gmail.com', // Replace with your email
            subject: 'LinkedIn and Facebook Job Scraper Results',
            text: 'Find the attached HTML file with the job search results.',
            attachments: [
                {
                    filename: 'linkedin_jobs.html',
                    path: './linkedin_jobs.html', // Replace with actual path
                },
                {
                    filename: 'facebook_jobs.html',
                    path: './facebook_jobs.html', // Replace with actual path
                },
            ],
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = sendEmail;