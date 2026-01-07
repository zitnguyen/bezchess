const ClassModel = require("../models/Class");
const Enrollment = require("../models/Enrollment");

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.aggregate([
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
          courseName: { $first: "$className" },
          description: { $first: "$description" },
          fee: { $first: "$fee" },
          level: { $first: "$level" },
          maxStudents: { $first: "$maxStudents" },
          totalSessions: { $first: "$totalSessions" },
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
          description: 1,
          fee: 1,
          level: 1,
          maxStudents: 1,
          totalSessions: 1,
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
    
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const classes = await ClassModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
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
          courseName: { $first: "$className" },
          description: { $first: "$description" },
          fee: { $first: "$fee" },
          level: { $first: "$level" },
          maxStudents: { $first: "$maxStudents" },
          totalSessions: { $first: "$totalSessions" },
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
          description: 1,
          fee: 1,
          level: 1,
          maxStudents: 1,
          totalSessions: 1,
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
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }
    
    res.json(classes[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const syncClassEnrollments = async (classId, studentIds) => {
  if (!studentIds) return;

  const uniqueStudentIds = [...new Set(studentIds)];

  const currentEnrollments = await Enrollment.find({ classId });
  const currentStudentIds = currentEnrollments.map(e => e.studentId.toString());

  const toAdd = uniqueStudentIds.filter(id => !currentStudentIds.includes(id));
  const toRemove = currentStudentIds.filter(id => !uniqueStudentIds.includes(id));

  for (const studentId of toAdd) {
    const lastEnrollment = await Enrollment.findOne().sort({ enrollmentId: -1 });
    const nextId = lastEnrollment && lastEnrollment.enrollmentId ? lastEnrollment.enrollmentId + 1 : 1;

    const classInfo = await ClassModel.findById(classId);
    const courseFee = classInfo ? classInfo.fee : 0;
    const courseSessions = classInfo ? classInfo.totalSessions : 16;

    await new Enrollment({
      enrollmentId: nextId, 
      classId,
      studentId,
      status: 'Active', 
      enrollmentDate: new Date(),
      feeAmount: courseFee, 
      paymentStatus: 'Pending',
      sessionsTotal: courseSessions,
      sessionsUsed: 0
    }).save();
  }

  if (toRemove.length > 0) {
    await Enrollment.deleteMany({
      classId,
      studentId: { $in: toRemove }
    });
  }

  const count = await Enrollment.countDocuments({ classId });
  await ClassModel.findByIdAndUpdate(classId, { currentStudents: count });
};

exports.createClass = async (req, res) => {
  try {
    const { students, ...classData } = req.body;
    const newClass = new ClassModel(classData);
    await newClass.save();

    if (students && Array.isArray(students)) {
       await syncClassEnrollments(newClass._id, students);
    }

    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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

exports.deleteClass = async (req, res) => {
  try {
    await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa lớp học" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
