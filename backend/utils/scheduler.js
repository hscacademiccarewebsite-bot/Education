const cron = require("node-cron");
const CommunityController = require("../controllers/communityController");

/**
 * Helper to retry a function up to maxRetries times, with a delay.
 */
const retry = async (fn, maxRetries = 3, delayMs = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isNetworkError =
        error.name === "MongoNetworkError" ||
        error.name === "MongoNetworkTimeoutError" ||
        error.name === "MongoServerSelectionError" ||
        (error.message && error.message.includes("MongoPoolClearedError")) ||
        (error.message && error.message.includes("ENOTFOUND"));

      if (isNetworkError && attempt < maxRetries) {
        console.warn(`[Scheduler Warn]: Network error on attempt ${attempt}. Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Initializes all background scheduled tasks
 */
const initializeScheduler = () => {
  // 1. Daily Post Cleanup (Run every day at midnight)
  // Cron pattern: 0 0 * * *
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler]: Running daily community post cleanup...");
    try {
      // Retry up to 3 times, waiting 10 seconds between attempts
      const result = await retry(
        () => CommunityController.cleanupExpiredPosts(),
        3,
        10000
      );
      console.log(`[Scheduler]: Cleanup finished. Removed ${result.count} expired posts.`);
    } catch (error) {
      console.error("[Scheduler Error]: Cleanup failed:", error);
    }
  });

  console.log("[Scheduler]: Background tasks initialized.");
};

module.exports = {
  initializeScheduler,
};
