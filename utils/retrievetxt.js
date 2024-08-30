import pkg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const { Client } = pkg;
const client = new Client({
    connectionString: process.env.DB_CONNECT_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fetchLabels() {
    try {
        await client.connect();
        const res = await client.query('SELECT label_val FROM megadns;');
        return res.rows.map(row => row.label_val);
    } catch (error) {
        console.error('Error fetching labels:', error);
        return [];
    } finally {
        await client.end();
    }
}

async function saveLabelsToFile(labels) {
    try {
        const filePath = 'megadns.txt';
        fs.writeFileSync(filePath, labels.join('\n'), 'utf-8');
        console.log(`Labels successfully saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving labels to file:', error);
    }
}

(async () => {
    const labels = await fetchLabels();
    if (labels.length > 0) {
        await saveLabelsToFile(labels);
    } else {
        console.log('No labels found in the database.');
    }
})();
