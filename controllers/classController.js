const ClassModel = require("../models/Class");
const Enrollment = require("../models/Enrollment");

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher"
        }
      },
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "classId",
          as: "enrollments"
        }
      },
      {
        $unwind: {
          path: "$enrollments",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "enrollments.studentId",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          classId: { $first: "$classId" },
          className: { $first: "$className" },
          course: { $first: { $arrayElemAt: ["$course", 0] } },
          teacher: { $first: { $arrayElemAt: ["$teacher", 0] } },
          startDate: { $first: "$startDate" },
          schedule: { $first: "$schedule" },
          currentStudents: { $first: "$currentStudents" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          students: {
            $push: {
              $cond: [
                { $ifNull: ["$studentInfo._id", false] },
                {
                  _id: "$studentInfo._id",
                  studentId: "$studentInfo.studentId",
                  fullName: "$studentInfo.fullName",
                  skillLevel: "$studentInfo.skillLevel"
                },
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          classId: 1,
          className: 1,
          courseId: {
            _id: "$course._id",
            courseName: "$course.courseName",
            level: "$course.level",
            fee: "$course.fee"
          },
          teacherId: {
            _id: "$teacher._id",
            username: "$teacher.username",
            specialization: "$teacher.specialization",
            experienceYears: "$teacher.experienceYears"
          },
          startDate: 1,
          schedule: 1,
          currentStudents: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          students: 1
        }
      }
    ]);

    console.error('=== AGGREGATION DEBUG ===');
    console.error('Number of classes:', classes.length);
    if (classes.length > 0) {
      console.error('First class keys:', Object.keys(classes[0]));
      console.error('Students field:', classes[0].students);
    }
    console.error('=== END DEBUG ===');
    
    res.json(classes);
  } catch (err) {
    console.error('Error in getAllClasses:', err);
    res.status(500).json({ message: err.message });
  }
};

// Lấy chi tiết lớp học
exports.getClassById = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const classes = await ClassModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher"
        }
      },
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "classId",
          as: "enrollments"
        }
      },
      {
        $unwind: {
          path: "$enrollments",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "enrollments.studentId",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          classId: { $first: "$classId" },
          className: { $first: "$className" },
          course: { $first: { $arrayElemAt: ["$course", 0] } },
          teacher: { $first: { $arrayElemAt: ["$teacher", 0] } },
          startDate: { $first: "$startDate" },
          schedule: { $first: "$schedule" },
          currentStudents: { $first: "$currentStudents" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          students: {
            $push: {
              $cond: [
                { $ifNull: ["$studentInfo._id", false] },
                {
                  _id: "$studentInfo._id",
                  studentId: "$studentInfo.studentId",
                  fullName: "$studentInfo.fullName",
                  skillLevel: "$studentInfo.skillLevel"
                },
                "$$REMOVE"
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          classId: 1,
          className: 1,
          courseId: {
            _id: "$course._id",
            courseName: "$course.courseName",
            level: "$course.level",
            fee: "$course.fee"
          },
          teacherId: {
            _id: "$teacher._id",
            username: "$teacher.username",
            specialization: "$teacher.specialization"
          },
          startDate: 1,
          schedule: 1,
          currentStudents: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          students: 1
        }
      }
    ]);
    
    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    
    res.json(classes[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Helper to sync enrollments
const syncClassEnrollments = async (classId, studentIds) => {
  if (!studentIds) return;

  // Ensure unique list of student IDs
  const uniqueStudentIds = [...new Set(studentIds)];

  // Get current enrollments for this class
  const currentEnrollments = await Enrollment.find({ classId });
  const currentStudentIds = currentEnrollments.map(e => e.studentId.toString());

  // Determine needed actions
  const toAdd = uniqueStudentIds.filter(id => !currentStudentIds.includes(id));
  const toRemove = currentStudentIds.filter(id => !uniqueStudentIds.includes(id));

  // Add new enrollments
  for (const studentId of toAdd) {
    // Generate new enrollmentId
    const lastEnrollment = await Enrollment.findOne().sort({ enrollmentId: -1 });
    const nextId = lastEnrollment && lastEnrollment.enrollmentId ? lastEnrollment.enrollmentId + 1 : 1;

    await new Enrollment({
      enrollmentId: nextId, // Note: In a high concurrency environment, this needs better handling (e.g. sequence counter)
      classId,
      studentId,
      status: 'Active', // Default status
      enrollmentDate: new Date(),
      feeAmount: 0, // Should be calculated based on course fee if needed
      paymentStatus: 'Pending'
    }).save();
  }

  // Remove old enrollments
  if (toRemove.length > 0) {
    await Enrollment.deleteMany({
      classId,
      studentId: { $in: toRemove }
    });
  }

  // Update class student count
  const count = await Enrollment.countDocuments({ classId });
  await ClassModel.findByIdAndUpdate(classId, { currentStudents: count });
};

// Tạo lớp học
exports.createClass = async (req, res) => {
  try {
    const { students, ...classData } = req.body;
    const newClass = new ClassModel(classData);
    await newClass.save();

    if (students && Array.isArray(students)) {
       await syncClassEnrollments(newClass._id, students);
       // Refetch to get updated currentStudents count if needed, or just return newClass
       // Ideally return the class with students populated, but for now basic return is fine
    }

    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cập nhật lớp
exports.updateClass = async (req, res) => {
  try {
    const { students, ...updateData } = req.body;
    
    const updatedClass = await ClassModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (students && Array.isArray(students)) {
        await syncClassEnrollments(req.params.id, students);
    }

    res.json(updatedClass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Xóa lớp
exports.deleteClass = async (req, res) => {
  try {
    await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Class deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
