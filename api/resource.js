import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 5001;

app.use(cors());

app.get('/api/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const serpApiUrl = new URL('https://serpapi.com/search.json');
    serpApiUrl.searchParams.append('q', `books:${query}`);
    serpApiUrl.searchParams.append('location', 'India');
    serpApiUrl.searchParams.append('hl', 'hi');
    serpApiUrl.searchParams.append('gl', 'in');
    serpApiUrl.searchParams.append('google_domain', 'google.co.in');
    serpApiUrl.searchParams.append('api_key', '555e1650dcfeb69fdfe704d298b0396b66172413026edf642b954be707bfaa50');

    try {
        const response = await fetch(serpApiUrl.toString());
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ error: 'Failed to fetch data from SerpAPI' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});