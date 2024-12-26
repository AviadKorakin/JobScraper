// dailyScript.js

const runScriptsAndSendEmail = require("./combine-runner")
const runService = async () => {
    try {
        console.log('Running scheduled job...');
        await runScriptsAndSendEmail();
        console.log('Job completed. Scheduling the next run in 24 hours...');
        setTimeout(runService, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    } catch (error) {
        console.error('Error in scheduled job:', error);
        setTimeout(runService, 24 * 60 * 60 * 1000); // Ensure the next run is still scheduled
    }
};

runService();