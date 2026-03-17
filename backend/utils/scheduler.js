const cron = require("node-cron");
const CommunityController = require("../controllers/communityController");

/**
 * Initializes all background scheduled tasks
 */
const initializeScheduler = () => {
  // 1. Daily Post Cleanup (Run every day at midnight)
  // Cron pattern: 0 0 * * *
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler]: Running daily community post cleanup...");
    try {
      const result = await CommunityController.cleanupExpiredPosts();
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
