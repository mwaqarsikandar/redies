const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

async function fetchRedditData() {
    try {
        const response = await axios.get('https://www.reddit.com/r/all/comments/.json?limit=100');
        return response.data;
    } catch (error) {
        console.error('Error fetching Reddit data:', error);
        return null;
    }
}

function extractRedditData(data) {
    const redditData = [];
    data.data.children.forEach(child => {
        const subreddit = child.data.subreddit;
        const title = child.data.link_title;
        const permalink = child.data.permalink;
        redditData.push({ subreddit, title, permalink });
    });
    return redditData;
}

function filterSubredditData(subredditData, keywords) {
    return subredditData.filter(item => {
        const title = item.title.toLowerCase();
        const subreddit = item.subreddit.toLowerCase();
        return keywords.some(keyword => title.includes(keyword) || subreddit.includes(keyword));
    });
}

let redditData = [];
let filteredData = [];

async function updateRedditData() {
    try {
        const data = await fetchRedditData();
        redditData = extractRedditData(data);
        const keywords = ['amazon', 'etsy', 'job', 'ebay', 'alibaba', 'store', 'selling', 'account'];
        filteredData = filterSubredditData(redditData, keywords);
    } catch (error) {
        console.error('Error updating Reddit data:', error);
    }
}

// Update Reddit data every 5 minutes (300,000 milliseconds)
setInterval(updateRedditData, 300000);

app.get('/reddit-data', (req, res) => {
    res.json(redditData);
});

app.get('/filtered-reddit-data', (req, res) => {
    res.json(filteredData);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    updateRedditData(); // Fetch initial Reddit data
});
