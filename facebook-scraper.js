const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const {resolve} = require("node:path");

// Enable stealth mode
puppeteer.use(StealthPlugin());

const keywords = ['intern', 'student', 'ללא נסיון', 'סטודנט', 'junior', 'בלי ניסיון', 'בוגר.ת מצטיינ.ת', 'ג\'וניור', 'גוניור', 'משרת סטודנט'];
const search_keywords = ['intern', 'student',  'סטודנט', 'גוניור', 'משרת סטודנט'];

async function scrapeFacebookPosts(groupMap) {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized'],
    });

    const page = await browser.newPage();
    const cookiesPath = resolve(__dirname, 'FBcookies.json'); // Ensure the correct path
    const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    await browser.setCookie(...cookies);

    //24 hours extraction
    const allScrapedPosts = [];
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1); // Calculate the date 7 days ago
    const today = new Date();

    // Format dates in YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    const startDay = formatDate(oneDayAgo);
    const endDay = formatDate(today);

    for (const [groupURL, iterations] of Object.entries(groupMap)) {
        console.log(`Navigating to group: ${groupURL}`);

        for (const keyword of search_keywords) {
            // Construct the search URL for each keyword
            const filterJSON = {
                "rp_chrono_sort:0": "{\"name\":\"chronosort\",\"args\":\"\"}",
                "rp_creation_time:0": `{\"name\":\"creation_time\",\"args\":\"{\\\"start_year\\\":\\\"${startDay.split('-')[0]}\\\",\\\"start_month\\\":\\\"${startDay.split('-')[0]}-${startDay.split('-')[1]}\\\",\\\"end_year\\\":\\\"${endDay.split('-')[0]}\\\",\\\"end_month\\\":\\\"${endDay.split('-')[0]}-${endDay.split('-')[1]}\\\",\\\"start_day\\\":\\\"${startDay}\\\",\\\"end_day\\\":\\\"${endDay}\\\"}\"}`
            };


            const encodedFilters = Buffer.from(JSON.stringify(filterJSON)).toString('base64');
            const searchURL = `${groupURL}/search?q=${encodeURIComponent(keyword)}&filters=${encodeURIComponent(encodedFilters)}`;

            console.log(`Navigating to search URL: ${searchURL}`);
            await page.goto(searchURL);
            try {
                await page.waitForSelector("div[role='feed']", {timeout: 3000});
                console.log(`Loaded feed for keyword: ${keyword}`);
            } catch (error) {
                if (error.name === 'TimeoutError') {
                    console.log(`No feed found for keyword: ${keyword}. Skipping...`);
                    continue; // Skip to the next keyword
                } else {
                    throw error; // Re-throw if it's not a TimeoutError
                }
            }
            console.log(`Loaded feed for keyword: ${keyword}`);

            const scrapedPostUrls = new Set(); // To track processed posts

            for (let i = 0; i < iterations; i++) {
                console.log(`Starting scroll ${i + 1}/${iterations}`);

                // Scroll down
                await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
                await delay(1200 + Math.random() * 500);

                // Extract posts after scrolling down
                const newPosts = await extractPosts(page);
                console.log(`Found ${newPosts.length} new posts after scrolling down.`);

                // Add unique posts
                for (const post of newPosts) {
                    if (!scrapedPostUrls.has(post.url)) {
                        scrapedPostUrls.add(post.url);
                        allScrapedPosts.push(post);
                    }
                }
            }
        }
    }

    // Filter posts based on keywords
    const filteredPosts = allScrapedPosts.filter(post =>
        keywords.some(keyword => post.content.toLowerCase().includes(keyword.toLowerCase()))
    );


    const htmlContent = `
<!DOCTYPE html>
<html lang="en" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scraped Facebook Posts</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #eef2f3;
            color: #444;
            line-height: 1.8;
            margin: 0;
            padding: 0;
        }
        header {
            background: linear-gradient(45deg, #56ab2f, #a8e063);
            color: white;
            padding: 1.5rem 0;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        main {
            margin: 2rem auto;
            max-width: 800px;
            padding: 1.5rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #ddd;
        }
        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        ul li {
            background: #f9f9f9;
            margin: 0.8rem 0;
            padding: 1.2rem;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        ul li:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        ul li a {
            text-decoration: none;
            color: #56ab2f;
            font-weight: 600;
            font-size: 1.1rem;
            display: block;
        }
        ul li a:hover {
            text-decoration: underline;
        }
        footer {
            text-align: center;
            margin-top: 2rem;
            color: #888;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <header>
        <h1>פוסטים שנאספו מפייסבוק</h1>
    </header>
    <main>
        <ul>
            ${filteredPosts.map(post => `
                <li>
                    <a href="${post.url}" target="_blank">${post.content}</a>
                </li>
            `).join('\n')}
        </ul>
    </main>
    <footer>
        <p>נוצר אוטומטית על ידי הסקריפט שלך</p>
    </footer>
</body>
</html>`;


    // Save to file
    fs.writeFileSync('facebook_jobs.html', htmlContent);

    console.log(`Total posts found: ${allScrapedPosts.length}`);
    await browser.close();
}


    async function extractPosts(page) {
        return await page.evaluate(() => {
            const extractTextRecursively = (element) => {
                if (!element) return '';
                if (element.nodeType === Node.TEXT_NODE) return element.textContent.trim();
                if (element.tagName === 'BR') return '\n'; // Add a line break for <br> tags
                return Array.from(element.childNodes)
                    .map(child => extractTextRecursively(child))
                    .filter(text => text)
                    .join('\n');
            };

            const posts = [];
            const postElements = document.querySelectorAll('.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z');

            postElements.forEach((postElement) => {

                const seeButton = postElement.querySelector(
                    'div.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1sur9pj.xkrqix3.xzsf02u.x1s688f'
                );

                if (seeButton) {
                    seeButton.click(); // Click the button if it exists
                }

                const content = extractTextRecursively(postElement);

                // Extract post URL
                const urlElement = postElement.querySelector('a[role="link"][href*="/groups/"]');
                const url = urlElement ? urlElement.href : '';

                if (content) {
                    posts.push({content, url});
                }
            });

            return posts;
        });
    }

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



module.exports = scrapeFacebookPosts;