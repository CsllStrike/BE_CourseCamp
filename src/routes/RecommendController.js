module.exports = (express, con, authenticateToken) => {
    const app = express.Router();
    const axios = require('axios');
    const cron = require('node-cron');
    const { PythonShell } = require('python-shell');
    const path = require('path')

    const pythonPort = process.env.PYTHONPORT;
    const host = process.env.HOST;

    const getRecommendationsScriptPath = path.join(__dirname, 'app.py');

    PythonShell.run(getRecommendationsScriptPath, { args: [pythonPort, host] }, function (err, result) {
        if (err) {
            console.error('Error running Python script:', err);
            process.exit(1);
        }

        console.log(`Flask server has started. ${result}`);
    });

    cron.schedule('0 1 0 * * *', async () => {
        try {
            const response = await axios.post(`http://localhost:${pythonPort}/train`);
            console.log(response.data.message);
        } catch (error) {
            console.error('Error training model:', error);
        }
    });

    app.post('/recommend-course', authenticateToken, async (req, res) => {
        try {
            const response = await axios.post(`http://localhost:${pythonPort}/recommend-course`, { id_course: req.body.id_course });
            res.json(response.data);
        } catch (error) {
            console.error('recommendations error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/recommend-minat', authenticateToken, async (req, res) => {
        try {
            const response = await axios.post(`http://localhost:${pythonPort}/recommend-minat`, { minat: req.body.minat });
            res.json(response.data);
        } catch (error) {
            console.error('recommendations error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return app;
} 