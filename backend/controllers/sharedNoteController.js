const SharedNote = require("../model/sharedNoteSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");

class SharedNoteController {
  // Create a new shared note
  static async createNote(req, res) {
    try {
      const { title, googleDriveLink, description, privacy, enrolledBatches } = req.body;

      if (!title || !googleDriveLink) {
        return res.status(400).json({
          success: false,
          message: "Title and Google Drive Link are required.",
        });
      }

      const note = await SharedNote.create({
        author: req.user._id,
        title,
        googleDriveLink,
        description: description || "",
        privacy: privacy || "public",
        enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
      });

      const populatedNote = await SharedNote.findById(note._id).populate("author", "fullName profilePhoto role");

      res.status(201).json({
        success: true,
        data: populatedNote,
      });
    } catch (error) {
      console.error("Create Share Note Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get shared notes (with privacy filtering)
  static async getNotes(req, res) {
    try {
      const { page = 1, limit = 10, author } = req.query;
      const skip = (page - 1) * limit;

      let query = {};

      if (author === "me") {
        query.author = req.user._id;
      } else if (req.user.role === "student") {
        const myEnrollments = await EnrollmentRequest.find({
          user: req.user._id,
          status: "approved",
        });
        const myBatchIds = myEnrollments.map((e) => String(e.batch));

        query = {
          $or: [
            { privacy: "public" },
            { author: req.user._id },
            {
              privacy: "enrolled_members",
              enrolledBatches: { $in: myBatchIds },
            },
          ],
        };
      }

      const notes = await SharedNote.find(query)
        .populate("author", "fullName profilePhoto role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await SharedNote.countDocuments(query);

      res.status(200).json({
        success: true,
        data: notes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get Shared Notes Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete a shared note
  static async deleteNote(req, res) {
    try {
      const { noteId } = req.params;
      const note = await SharedNote.findById(noteId);

      if (!note) {
        return res.status(404).json({ success: false, message: "Note not found." });
      }

      if (String(note.author) !== String(req.user._id) && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      await SharedNote.findByIdAndDelete(noteId);

      res.status(200).json({
        success: true,
        message: "Note deleted successfully.",
      });
    } catch (error) {
      console.error("Delete Shared Note Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update a shared note
  static async updateNote(req, res) {
    try {
      const { noteId } = req.params;
      const { title, googleDriveLink, description, privacy, enrolledBatches } = req.body;

      const note = await SharedNote.findById(noteId);

      if (!note) {
        return res.status(404).json({ success: false, message: "Note not found." });
      }

      if (String(note.author) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      const updatedNote = await SharedNote.findByIdAndUpdate(
        noteId,
        {
          title,
          googleDriveLink,
          description,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
        },
        { returnDocument: "after" }
      ).populate("author", "fullName profilePhoto role");

      res.status(200).json({
        success: true,
        data: updatedNote,
        message: "Note updated successfully.",
      });
    } catch (error) {
      console.error("Update Shared Note Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = SharedNoteController;
