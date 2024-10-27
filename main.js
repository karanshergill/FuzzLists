import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Client } = pkg;
const client = new Client({
    connectionString: process.env.DB_CONNECT_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const sources = JSON.parse(fs.readFileSync('sources.json', 'utf-8')).sources;
const dnsConfig = sources.find(source => source.table === 'dns');

if (!dnsConfig) {
    console.error('DNS configuration not found in sources.json');
    process.exit(1);
} else {
    console.log('Processing DNS')
}

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        const entries = response.data
            .split('\n')
            .filter(entry => entry.trim().length > 0)
            .filter(entry => !entry.trim().startsWith('#'));
        console.log(`Fetched ${entries.length} valid words from ${url}`);
        return entries;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return [];
    }
}

async function insertData(entries) {
    const batchSize = 50000;
    const totalBatches = Math.ceil(entries.length / batchSize);
    console.log(`Total batches: ${totalBatches}`);
    try {
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            const values = batch.map((entry, index) => `($${index + 1})`).join(', ');
            const query = `
                INSERT INTO megadns (label_val) 
                VALUES ${values} 
                ON CONFLICT (label_val) DO NOTHING;
            `;
            await client.query(query, batch);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${totalBatches} containing ${batch.length} entries.`);
        }
        console.log('All batches processed successfully.');
    } catch (error) {
        console.error('Error inserting data:', error);
    }
}

(async () => {
    try {
        await client.connect();
        for (const url of dnsConfig.urls) {
            const data = await fetchData(url);
            if (data.length > 0) {
                await insertData(data);
            }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
})();