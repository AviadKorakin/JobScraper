const scrapeFacebookPosts = require('./facebook-scraper');
const sendEmail = require("./email-service");
const scrapeLinkedinPosts = require("./linkedin-scraper");


const runScriptsAndSendEmail = async () => {
    try {
        console.log('Starting LinkedIn Scraper...');
        await scrapeLinkedinPosts(); // Run LinkedIn scraper


        // Define the group map
        const groupMap = {
            'https://www.facebook.com/groups/israel.hightech': 10,
            'https://www.facebook.com/groups/JuniorJobs': 10,
            'https://www.facebook.com/groups/609641652802760': 10,
            'https://www.facebook.com/groups/2786770884931764': 10,
            'https://www.facebook.com/groups/2424974257725140': 10,
            'https://www.facebook.com/groups/1920854911477422': 10,
            'https://www.facebook.com/groups/926122620829127': 10,
            'https://www.facebook.com/groups/hitech.jobs.il': 10,
            'https://www.facebook.com/groups/start.hightech': 10,
            'https://www.facebook.com/groups/262663949723327': 10
        };
        console.log('Starting Facebook Scraper...');
        // Run the scraper
        await scrapeFacebookPosts(groupMap).catch(err => {
            console.error('Unexpected Error:', err);
        });

        console.log('Sending email...');
        await sendEmail(); // Send the email with the results
    } catch (error) {
        console.error('Error in main script:', error);
    }
};

// Export the function
module.exports = runScriptsAndSendEmail;