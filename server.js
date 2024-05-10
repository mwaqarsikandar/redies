const express = require('express');
const axios = require('axios');
const tough = require('tough-cookie');
const { CookieJar } = tough;
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

let redditData = [];
let filteredData = [];
let currentPage = 1; // Global variable to track current page number

async function emptyDataFiles() {
    try {
        await fs.writeFile('all_reddit_data.json', '[]');
        await fs.writeFile('filtered_reddit_data.json', '[]');
        console.log('Data files emptied successfully.');
    } catch (error) {
        console.error('Error emptying data files:', error);
    }
}

// Empty data files when the script starts running
emptyDataFiles();

async function fetchRedditData() {
    try {
        const cookieJar = new CookieJar();
        const response = await axios.get('https://www.reddit.com/r/all/comments/.json?limit=100', {
            jar: cookieJar, // Use cookie jar with request
            withCredentials: true, // Send credentials with request
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Reddit data:', error);
        return null;
    }
}

// Function to extract relevant data from Reddit response
function extractRedditData(data) {
    const extractedData = [];
    data.data.children.forEach(child => {
        const subreddit = child.data.subreddit;
        const title = child.data.link_title;
        const permalink = child.data.permalink;
        extractedData.push({ subreddit, title, permalink });
    });
    return extractedData;
}

// Function to filter Reddit data based on keywords
function filterRedditData(data, keywords) {
    return data.filter(item => {
        const title = item.title.toLowerCase();
        const subreddit = item.subreddit.toLowerCase();
        return keywords.some(keyword => title.includes(keyword) || subreddit.includes(keyword));
    });
}

async function saveDataToFile(data, filename, page) {
    try {
        const existingData = await fs.readFile(filename);
        const existingJson = JSON.parse(existingData);
        const newData = data.map(item => ({ ...item, page })); // Add page number to each item
        const combinedData = existingJson.concat(newData);
        await fs.writeFile(filename, JSON.stringify(combinedData));
        console.log(`Data saved successfully. ${page}`);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

async function loadDataFromFile(filename) {
    try {
        const data = await fs.readFile(filename);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

async function updateRedditData() {
    try {
        const rawData = await fetchRedditData();
        redditData = extractRedditData(rawData);
        const keywords = ['Amazon','FBA','Private label','Query','Product Research','Product Hunting','Sourcing','1688','AliBaba','Launch','PPC','Ads','Advertising','Keywords','Online','Marketplace','Sales','Strategy','Branding','optimization','Campaign','Marketing','Inventory','Listing','Ranking','Reviews','Feedback','Competition','Trend','Demand','Niche','Research','Supplier','Shipping','Warehouse','Fulfillment','Quality','Revenue','Profit','Cost','Price','Deal','Discount','Promotion','Bundle','Coupon','Offer','Welcome','Click','Traffic','Conversion','Rate','CTR ','ROI','Budget','Bid','Campaign','Campaign','Keyword','Advertiser','CPM ','CPC','CTR ','Impression','Audience','Targeting','Segment','Demographic','Right','Remarketing','Advertorial','Native','Influencer','Social','Media','Content','Display','Video','Search','Engine','Optimization','Landing','Page','Conversion','Funnel','Lead','Generated','Acquisition','Customer','Service','Satisfaction','Loyalty','CRM ','Feedback','Review','Reputation','Trust','Authority','Secure','Payment','Checkout','Shipping','Return','Policy','Warranty','Long','Fraud','Protection','Authentication','SSL ','API ','Integration','Backend','Frontend','UX ','UI ','Design','Of','Technology','Platform','Software','Tool','App','Mobile','Website','Ecommerce','Marketplace','Retail','Online','Store','Shop','Seller','Buyer','Cart','Checkout','Payment','Gateway','Transaction','Account','Login','Registration','Dashboard','Analytics','Report','Metric','Data','Analysis','Insight','Trend','Forecast','Benchmark','Benchmarking','KPI ','Metric','Score','Measurement','Assessment','Evaluation','Comparison','Competitor','Benchmark','Warning','Alert','Notification','Tracking','Performance','Index','Rank','Position','Visibility','Organic','Paid','Sponsored','Algorithm','SERP ','SEO ','SEM ','SERM ','Keyword','Search','Query','P','Long-tail','Short-tail','Volume','Competition','Difficulty','Trend','Forecast','Analysis','Research','Tool','Software','Platform','Service','Agency','Expert','Consultant','Teacher','Special','Professional','Training','Course','Seminar','Workshop','Conference','Event','Webinar','Under','Blog','Article','Guide','Book','Resource','Tool','Calculator','Generator','Template','Example','Sample','Case','Study','Testimonial','Review','Rating','Feedback','Comment','Forum','Community','Group','Network','Association','Organization','Alliance','Collaborate','Partnership','Joint','Venture','Cooperation','Synergy','Integration','Merge','Acquisition','Merger','Expansion','Growth','Scale','Development','Innovation','Disruption','Transformation','Revolution','Evolution','Change','Trend','Future','Vision','Mission','Goal','Objective','Strategy','Plan','Roadmap','Initiative','Project','That','Action','Implementation','Execution','Result','Outcome','Achievement','Success','Failure','Lesson','Learning','Experience','Knowledge','Skill','Talent','Skilled','Capability','Competency','Qualification','Expertise','Specialization','Proficiency','Efficiency','Effectiveness','Performance','Improvement','Optimization','Enhancement','Innovation','Creativity','Adaptation','Resilience' ];
        filteredData = filterRedditData(redditData, keywords);

        // Save all data with the current page number
        await saveDataToFile(redditData, 'all_reddit_data.json', currentPage);
        await saveDataToFile(filteredData, 'filtered_reddit_data.json', currentPage);
        currentPage++;
    } catch (error) {
        console.error('Error updating Reddit data:', error);
    }
}

// Update Reddit data every 5 minutes (300,000 milliseconds)
setInterval(updateRedditData, 3000);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await updateRedditData();
});
