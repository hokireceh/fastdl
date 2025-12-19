const { Queue, Worker, QueueEvents } = require("bullmq");
const { REQUEST_STATUS } = require("./constants");
const { log, waitFor } = require("./utils");
const { sendRequestedData } = require("./telegramActions");
const { scrapWithFastDl } = require("./apis");
const { getModels } = require("./config/database");
const { Op } = require("sequelize");

// Initialize BullMQ queue
const requestQueue = new Queue("contentRequestQueue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

// Function to clear the queue
const clearQueue = async () => {
    try {
        log("Clearing existing jobs in the queue...");
        await requestQueue.drain();
        await requestQueue.clean(0, "completed");
        await requestQueue.clean(0, "failed");
        log("Queue cleared.");
    } catch (error) {
        log("Error clearing queue:", error);
    }
};

// Process the queue using a Worker
const requestWorker = new Worker(
    "contentRequestQueue",
    async (job) => {
        const { id, requestUrl, retryCount } = job.data;
        let models = getModels();
        if (!models || !models.ContentRequest) {
            const { getSequelize } = require("./config/database");
            const seq = getSequelize();
            if (!seq) {
                log(`Error: Cannot get sequelize instance for job ${id}`);
                return;
            }
            const { initModels } = require("./models");
            models = initModels(seq);
        }
        const { ContentRequest, Metrics } = models;

        log(`Processing job: ${id}`);

        // Mark the job as PROCESSING in the database
        await ContentRequest.update(
            { status: REQUEST_STATUS.PROCESSING, updatedAt: new Date() },
            { where: { id } }
        );

        try {
            const result = await scrapWithFastDl(requestUrl);

            if (!result.success) {
                const newRetryCount = retryCount + 1;

                if (newRetryCount <= 5) {
                    await ContentRequest.update(
                        {
                            updatedAt: new Date(),
                            status: REQUEST_STATUS.PENDING,
                            retryCount: newRetryCount,
                        },
                        { where: { id } }
                    );
                } else {
                    await ContentRequest.destroy({ where: { id } });
                    log(`Request document deleted: ${id}`);
                }

                log(`Job ${id} failed. Retry count: ${newRetryCount}`);
                log("Scraping failed");
            } else {
                await waitFor(500);

                // Send requested data
                await sendRequestedData({ ...result.data, ...job.data });

                // Delete document after successful processing
                await ContentRequest.destroy({ where: { id } });
                log(`Request document deleted: ${id}`);

                const mediaTypeKey = result.data?.mediaType === 'GraphVideo' 
                    ? 'graphVideoCount' 
                    : result.data?.mediaType === 'GraphImage' 
                    ? 'graphImageCount' 
                    : 'graphSidecarCount';

                const [metrics] = await Metrics.findOrCreate({
                    where: { id: 1 },
                    defaults: { totalRequests: 0 }
                });

                await metrics.increment({
                    totalRequests: 1,
                    [mediaTypeKey]: 1,
                });
            }
        } catch (error) {
            log(`Error processing job ${id}:`, error);

            const newRetryCount = retryCount + 1;

            if (newRetryCount <= 5) {
                await ContentRequest.update(
                    {
                        updatedAt: new Date(),
                        status: REQUEST_STATUS.PENDING,
                        retryCount: newRetryCount,
                    },
                    { where: { id } }
                );
            } else {
                await ContentRequest.destroy({ where: { id } });
                log(`Request document deleted: ${id}`);
            }

            log(`Updated request ${id} for retry. Retry count: ${newRetryCount}`);
        }
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
        concurrency: 5,
    }
);

// Log job events using QueueEvents
const queueEvents = new QueueEvents("contentRequestQueue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

queueEvents.on("completed", ({ jobId }) => {
    log(`Job ${jobId} completed successfully.`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
    log(`Job ${jobId} failed: ${failedReason}`);
});

// Fetch pending requests from PostgreSQL and add them to the queue
const fetchPendingRequests = async (models) => {
    try {
        if (!models) {
            models = getModels();
        }
        const { ContentRequest } = models;
        
        const existingJobs = await requestQueue.getJobs([
            "waiting",
            "delayed",
            "active",
        ]);
        const existingJobIds = new Set(existingJobs.map((job) => job.data.id));

        const pendingRequests = await ContentRequest.findAll({
            where: {
                status: REQUEST_STATUS.PENDING,
                retryCount: { [Op.lt]: 5 }
            },
            order: [['requestedAt', 'ASC']],
        });

        log(`Fetched ${pendingRequests.length} pending requests from DB.`);
        for (const request of pendingRequests) {
            if (!existingJobIds.has(request.id)) {
                await requestQueue.add("contentRequest", {
                    id: request.id,
                    messageId: request.messageId,
                    shortCode: request.shortCode,
                    requestUrl: request.requestUrl,
                    requestedBy: {
                        userName: request.requestedByUserName,
                        firstName: request.requestedByFirstName,
                    },
                    retryCount: request.retryCount,
                    chatId: request.chatId,
                });
            }
        }
    } catch (error) {
        log("Error fetching pending requests:", error);
    }
};

// Initialize the queue
const initQueue = async (models) => {
    try {
        await clearQueue();
        await fetchPendingRequests(models);
        log("Queue initialized with pending requests.");

        setInterval(() => fetchPendingRequests(models), 60000);

        // Periodically clean completed/failed jobs
        setInterval(async () => {
            await requestQueue.clean(3600 * 1000, "completed");
            await requestQueue.clean(3600 * 1000, "failed");
            log("Cleaned up old jobs from the queue.");
        }, 60000);
    } catch (error) {
        log("Error initializing queue:", error);
    }
};

module.exports = { initQueue };
