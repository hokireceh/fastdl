<p align="center">
    <img width=200px height=200px src="./assets/icon.png" alt="Project logo">
</p>

<h1 align="center">Insta Saver Bot 🤖</h1>

### Description

A Telegram bot to download Instagram content (Reels, posts, images) with caption preservation and carousel support. Built with Node.js, PostgreSQL, and BullMQ for efficient job processing.

***Note:*** *This bot is not affiliated with Instagram in any way. It is an independent project developed for educational purposes only.*

---

### Features

1. **Content Variety:** Download Reels, regular posts, and images from Instagram.
2. **Caption Preservation:** Capture and include original captions with downloaded content.
3. **Carousel Support:** Seamlessly handle and download multiple items in carousel posts.
4. **Efficient Processing:** Uses BullMQ for reliable job queue management.
5. **PostgreSQL Database:** Stores user data and processing history.

---

### Tech Stack

- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Database:** PostgreSQL (Sequelize ORM)
- **Queue:** BullMQ + Redis
- **Bot:** node-telegram-bot-api
- **Scraping:** [fastdl](https://github.com/hokireceh/fastdl)

---

### How to Set Up Locally

#### 1. Clone Repository

```bash
git clone https://github.com/hokireceh/fastdl.git
cd fastdl
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Setup Environment Variables

Create `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
PORT=6060
TELEGRAM_TOKEN="your_telegram_bot_token"
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
PUPPETEER_EXECUTABLE_PATH="/path/to/chromium"
```

#### 4. Setup Database

Ensure PostgreSQL is running. Sequelize will automatically create tables on first run.

#### 5. Start Redis (for job queue)

```bash
redis-server --daemonize yes
```

#### 6. Run the Bot

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The bot will start listening on the port specified in `.env` (default: 6060).

---

### Usage

Send an Instagram URL to your bot on Telegram:

- Reels: `https://www.instagram.com/reel/xxxxx/`
- Posts: `https://www.instagram.com/p/xxxxx/`
- Carousel: `https://www.instagram.com/p/xxxxx/`

The bot will process the URL and send back the downloaded content.

---

### Database Schema

- **users** - Telegram users with request count
- **content_requests** - Instagram URLs pending processing
- **content_responses** - Cached responses
- **metrics** - Processing statistics

---

### Project Structure

```
├── src/
│   ├── config/           # Database & Telegram config
│   ├── models/           # Sequelize models
│   ├── utils/            # Helper functions
│   ├── apis.js           # API interactions with fastdl
│   ├── constants.js      # Constants & messages
│   ├── index.js          # Main entry point
│   ├── queue.js          # BullMQ job queue
│   └── telegramActions.js # Telegram bot handlers
├── assets/               # Bot icon/images
├── .env.example          # Environment template
├── package.json          # Dependencies
└── replit.md             # Development notes
```

---

### Deployment

For production on a home server:

```bash
redis-server --daemonize yes && npm start
```

---

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 6060 |
| `TELEGRAM_TOKEN` | Telegram Bot API token | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chromium executable | Auto-detect |

---

### Notes

- Requires Node.js v20 or higher
- Redis must be running for job queue functionality
- PostgreSQL connection string required for data persistence
- Chromium/Puppeteer for browser-based scraping

---

### License

ISC

Feel free to contribute and enhance the functionality of the Insta Saver Bot!
