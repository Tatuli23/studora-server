const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Studora server is running!' });
});

// Fetch YouTube transcript
app.post('/transcript', async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'No videoId provided' });

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcriptItems.map(item => item.text).join(' ');

    res.json({ success: true, transcript: fullText });
  } catch (error) {
    console.error('Transcript error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate AI content (quiz, flashcards, summary)
app.post('/generate', async (req, res) => {
  try {
    const { prompt, imageData } = req.body;

    let messages = [];
    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
          { type: 'text', text: prompt }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: messages,
    });

    const text = response.content.map(c => c.text || '').join('');
    res.json({ success: true, text });
  } catch (error) {
    console.error('AI error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Studora server running on port ${PORT}`);
});