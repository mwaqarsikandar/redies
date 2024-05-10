const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

let redditData = [];
let filteredData = [];

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
    const extractedData = [];
    data.data.children.forEach(child => {
        const subreddit = child.data.subreddit;
        const title = child.data.link_title;
        const permalink = child.data.permalink;
        extractedData.push({ subreddit, title, permalink });
    });
    return extractedData;
}

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

app.get('/reddit-data', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const redditData = await loadDataFromFile('all_reddit_data.json');
        const startIndex = (page - 1) * 100;
        const endIndex = page * 100;
        const paginatedData = redditData.slice(startIndex, endIndex);
        res.json(paginatedData);
    } catch (error) {
        console.error('Error serving Reddit data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/filtered-reddit-data', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const filteredData = await loadDataFromFile('filtered_reddit_data.json');
        const startIndex = (page - 1) * 100;
        const endIndex = page * 100;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        res.json(paginatedData);
    } catch (error) {
        console.error('Error serving filtered Reddit data:', error);
        res.status(500).send('Internal Server Error');
    }
});


let currentPage = 1; // Global variable to track current page number

async function updateRedditData() {
    try {
        const rawData = await fetchRedditData();
        redditData = extractRedditData(rawData);
        const keywords = ['amazon', 'etsy', 'job', 'ebay', 'alibaba', 'store', 'selling', 'account'];
        filteredData = filterRedditData(redditData, keywords);
        
        // Save data with the current page number and then increment the page number
        await saveDataToFile(redditData, 'all_reddit_data.json');
        await saveDataToFile(filteredData, 'filtered_reddit_data.json');
        currentPage++;
    } catch (error) {
        console.error('Error updating Reddit data:', error);
    }
}

async function saveDataToFile(data, filename) {
    try {
        const existingData = await fs.readFile(filename);
        const existingJson = JSON.parse(existingData);
        const startIndex = (currentPage - 1) * 100;
        const endIndex = currentPage * 100;
        const newData = data.slice(startIndex, endIndex).map(item => ({ ...item, page: currentPage }));
        const combinedData = existingJson.concat(newData);
        await fs.writeFile(filename, JSON.stringify(combinedData));
        console.log(`Data saved successfully.${currentPage}`);
    } catch (error) {
        console.error('Error saving data:', error);
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
