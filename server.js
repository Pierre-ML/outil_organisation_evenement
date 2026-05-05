import { handler } from './dist/server/entry.mjs';
import express from 'express';

const app = express();
app.use(express.static('dist/client'));
app.use(handler);
app.listen(3000, () => console.log('Server running on port 3000'));
