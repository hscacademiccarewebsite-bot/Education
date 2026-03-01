require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initializeCloudinary, isCloudinaryConfigured } = require("./config/cloudinary");

const userRoutes = require("./routes/userRoutes");
const batchRoutes = require("./routes/batchRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const videoRoutes = require("./routes/videoRoutes");
const enrollmentRequestRoutes = require("./routes/enrollmentRequestRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 8000;

if (isCloudinaryConfigured()) {
    initializeCloudinary();
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "API OK" });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes); // Backward compatibility alias.
app.use("/api/batches", batchRoutes);
app.use("/api/courses", batchRoutes); // Alias for course-focused frontend naming.
app.use("/api/subjects", subjectRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/enrollments", enrollmentRequestRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
};

startServer();
