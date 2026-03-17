const Note = require("../model/noteSchema");
const Subject = require("../model/subjectSchema");
const EnrollmentRequest = require("../model/enrollmentRequestSchema");
const Notification = require("../model/notificationSchema");

const createNote = async (req, res) => {
  try {
    const { subjectId, title, googleDriveLink } = req.body;

    if (!subjectId || !title || !googleDriveLink) {
      return res.status(400).json({
        success: false,
        message: "Subject ID, title, and Google Drive link are required.",
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    const note = await Note.create({
      subject: subjectId,
      title,
      googleDriveLink,
      createdBy: req.user._id,
    });

    // Send notifications to enrolled students
    try {
      const enrollments = await EnrollmentRequest.find({
        batch: subject.batch,
        status: "approved",
      }).select("student");

      if (enrollments.length > 0) {
        const notifications = enrollments.map((enr) => ({
          recipient: enr.student,
          title: `New Note: ${subject.title}`,
          message: `A new resource "${title}" has been added to ${subject.title}.`,
          type: "new_note",
          link: `/notes/${subjectId}`,
          metadata: { noteId: note._id, subjectId },
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error("[Note Notification Error]:", notifError);
      // We don't fail the note creation if notification fails, but we log it.
    }

    res.status(201).json({
      success: true,
      message: "Note created successfully.",
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create note.",
      error: error.message,
    });
  }
};

const getNotesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required.",
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    // Access Control: Admin/Teacher/Moderator or Enrolled Student
    const isStaff = ["admin", "teacher", "moderator"].includes(req.user.role);
    if (!isStaff) {
      const enrollment = await EnrollmentRequest.findOne({
        student: req.user._id,
        batch: subject.batch,
        status: "approved",
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: "You must be enrolled in this course to access notes.",
        });
      }
    }

    const notes = await Note.find({ subject: subjectId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notes.",
      error: error.message,
    });
  }
};

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, googleDriveLink } = req.body;

    const note = await Note.findByIdAndUpdate(
      noteId,
      { title, googleDriveLink },
      { returnDocument: "after", runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note updated successfully.",
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update note.",
      error: error.message,
    });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findByIdAndDelete(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete note.",
      error: error.message,
    });
  }
};

module.exports = {
  createNote,
  getNotesBySubject,
  updateNote,
  deleteNote,
};
