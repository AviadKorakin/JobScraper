const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const {resolve} = require("node:path");

// Enable stealth mode
puppeteer.use(StealthPlugin());

async function scrapeLinkedinPosts () {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
    });
    const page = await browser.newPage();

    // Load cookies from file
    const cookiesPath = resolve(__dirname, 'LinkedinCookies.json'); // Ensure the correct path
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await browser.setCookie(...cookies);

    const baseURL = 'https://www.linkedin.com/jobs/search/';
    const filters = '&f_E=1%2C2&f_TPR=r86400&geoId=118529455';
    const keywords = ['junior software engineer', 'software engineer', 'software student' ,'intern software'];
    const filterKeywords = ['student', 'junior', 'משרה חלקית', 'part time','intern','semester' ,'סטודנט']; // Keywords for filtering

    let allJobs = [];
    const seenPlainText = new Set(); // Track already seen plainText values

    for (const keyword of keywords) {
        console.log(`Searching for: ${keyword}`);
        let start = 0;

        while (true) {
            const searchURL = `${baseURL}?keywords=${encodeURIComponent(keyword)}${filters}&start=${start}`;
            try {
                await page.goto(searchURL, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Extract job details including links
                const jobs = await page.evaluate(() => {
                    const jobCards = document.querySelectorAll('.job-card-container--clickable');
                    const jobDetails = [];

                    jobCards.forEach((job) => {
                        const titleElement = job.querySelector('a.job-card-container__link');
                        let title = titleElement?.getAttribute('aria-label') || 'No Title';
                        const link = titleElement?.href || 'No Link';

                        // Remove "with verification" or similar suffix if it exists
                        title = title.replace(/\s+with\s+verification$/i, '').trim();

                        jobDetails.push({ title, link });
                    });

                    return jobDetails;
                });

                if (jobs.length === 0) {
                    console.log(`No jobs found on page starting at ${start}. Ending pagination.`);
                    break;
                }

                for (const job of jobs) {
                    try {
                        await page.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 60000 });

                        // Wait for the job detail container to load
                        await page.waitForSelector('.jobs-description__container', { visible: true });

                        // Extract detailed information
                        const detail = await page.evaluate(() => {
                            const descriptionElement = document.querySelector('.jobs-box__html-content');
                            const plainText = descriptionElement?.innerText || 'No Description Available'; // Extract plain text
                            const outerHTML = descriptionElement?.outerHTML.trim() || 'No Description Available'; // Keep outerHTML
                            return { plainText, outerHTML };
                        });

                        // Check if the job matches the filter criteria using plain text
                        const isMatch = filterKeywords.some(keyword =>
                            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
                            detail.plainText.toLowerCase().includes(keyword.toLowerCase())
                        );

                        // Avoid duplicates
                        if (isMatch && !seenPlainText.has(detail.plainText)) {
                            seenPlainText.add(detail.plainText); // Mark this plainText as seen
                            allJobs.push({
                                ...job,
                                description: detail.outerHTML,
                                plainText: detail.plainText,
                                keyword,
                            });

                            console.log(`Fetched details for job: ${job.title}`);
                        } else if (!isMatch) {
                            console.log(`Filtered out job: ${job.title}`);
                        } else {
                            console.log(`Duplicate job found and skipped: ${job.title}`);
                        }
                    } catch (error) {
                        console.warn(`Could not fetch details for job: ${job.title}`, error.message);
                    }

                    // Allow some time between fetches to prevent blocking
                    await delay(2000);
                }

                // Increment start to move to the next page
                start += 25;
            } catch (error) {
                console.error(`Error searching for ${keyword}:`, error);
                break;
            }

            // Delay between pages
            await delay(2000);
        }
    }

    // Generate HTML file
    // Generate HTML file
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn Job Results</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #eef2f3;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            color: #0073b1;
            margin-bottom: 20px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            background: #fff;
            margin: 15px 0;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        li:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        h2 {
            color: #0073b1;
            margin: 0 0 15px;
            font-size: 1.5rem;
        }
        p {
            margin: 10px 0;
        }
        a {
            color: #0073b1;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .description {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #fafafa;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #555;
        }
        .rtl {
            direction: rtl;
            text-align: right;
        }
        .ltr {
            direction: ltr;
            text-align: left;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            li {
                padding: 15px;
            }
            h2 {
                font-size: 1.2rem;
            }
        }
    </style>
</head>
<body>
    <h1>LinkedIn Jobs</h1>
    <ul>
        ${allJobs.map((job) => {
        const isRTL = /^[\u0590-\u05FF]/.test(job.plainText.trim().charAt(job.plainText.length / 2) || '');
        const textDirectionClass = isRTL ? 'rtl' : 'ltr';
        return `
                <li>
                    <h2 class="${textDirectionClass}">${job.title}</h2>
                    <div class="description ${textDirectionClass}">
                        ${job.description || '<p>No Description Available</p>'}
                    </div>
                    <p><a href="${job.link}" target="_blank">View Job</a></p>
                </li>
            `;
    }).join('')}
    </ul>
</body>
</html>
`;

    // Save to file
    fs.writeFileSync('linkedin_jobs.html', htmlContent);
    console.log('Jobs saved to linkedin_jobs.html');
    await browser.close();
}


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports= scrapeLinkedinPosts;