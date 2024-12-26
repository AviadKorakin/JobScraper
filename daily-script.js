// dailyScript.js

const runScriptsAndSendEmail = require("./combine-runner")
const runService = async () => {
    try {
        console.log('Job Scrapping Starts .... ');
        await runScriptsAndSendEmail();
        console.log('Job Scrapping Complete.');
    } catch (error) {
        console.log('Job Scrapping Failed.');
    }
};

runService();