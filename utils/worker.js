import { Hono } from 'hono';

const app = new Hono();

app.post('/api/create', async (c) => {
    const { label_val, table_name } = await c.req.json();

    const xataUrl = `https://database-workspace-226h72.eu-central-1.xata.sh/db/fuzzlists:main/tables/${table_name}/data`;
    const response = await fetch(xataUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer xau_BbmBsRJ6GsRBDQt0kE9AzrvpZOuCGLAJ1',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label_val }),
    });

    if (response.ok) {
        return c.json({ message: 'Record inserted successfully' });
    } else {
        return c.json({ message: 'Error inserting record' }, 500);
    }
});

export default app;
