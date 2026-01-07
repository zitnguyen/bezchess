const Student = require("../models/Student");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate(
      "parentId",
      "fullName phone email"
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "parentId",
      "fullName phone email"
    );
    if (!student) return res.status(404).json({ message: "Không tìm thấy học viên" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { 
        fullName, dateOfBirth, address, skillLevel, enrollmentDate,
        parentName, parentPhone, parentEmail,
        scheduleSlots, sessionsTotal
    } = req.body;

    const lastStudent = await Student.findOne().sort({ studentId: -1 });
    const nextId = lastStudent && lastStudent.studentId ? lastStudent.studentId + 1 : 1000;

    const Parent = require('../models/Parents');
    let parentId = null;

    if (parentPhone) {
        let parent = await Parent.findOne({ phone: parentPhone });
        if (!parent) {
             parent = await Parent.create({
                 fullName: parentName || 'Phụ huynh',
                 phone: parentPhone,
                 email: parentEmail || `${parentPhone}@zchess.local`,
                 username: parentPhone,
                 password: '123456',
                 role: 'Parent'
             });
        }
        parentId = parent._id;
    }

    const student = new Student({
        studentId: nextId,
        fullName,
        dateOfBirth,
        address,
        skillLevel,
        enrollmentDate: enrollmentDate || new Date(),
        parentId,
        schedule: {
            slots: scheduleSlots || [],
            startDate: enrollmentDate || new Date()
        },
        sessions: {
            total: sessionsTotal || 16,
            used: 0
        }
    });

    await student.save();
    
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { 
        fullName, dateOfBirth, address, skillLevel, enrollmentDate,
        scheduleSlots, sessionsTotal,
        parentName, parentPhone, parentEmail, 
        note 
    } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (address !== undefined) updates.address = address;
    if (skillLevel !== undefined) updates.skillLevel = skillLevel;
    if (enrollmentDate !== undefined) {
        updates.enrollmentDate = enrollmentDate;
    }
    if (note !== undefined) updates.note = note;

    if (scheduleSlots !== undefined) updates["schedule.slots"] = scheduleSlots;
    if (sessionsTotal !== undefined) updates["sessions.total"] = sessionsTotal;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Không tìm thấy học viên" });

    if (student.parentId) { 
        if (parentName || parentPhone || parentEmail) {
            const Parent = require('../models/Parents');
            const parentUpdates = {};
            if (parentName !== undefined) parentUpdates.fullName = parentName;
            if (parentPhone !== undefined) parentUpdates.phone = parentPhone;
            if (parentEmail !== undefined) parentUpdates.email = parentEmail;
            
            await Parent.findByIdAndUpdate(student.parentId, parentUpdates, { runValidators: true });
        }
    } 
    else if (parentPhone) {
         const Parent = require('../models/Parents');
         let parent = await Parent.findOne({ phone: parentPhone });
         
         if (!parent) {
             parent = await Parent.create({
                 fullName: parentName || 'Phụ huynh',
                 phone: parentPhone,
                 email: parentEmail || `${parentPhone}@zchess.com`,
                 username: parentPhone,
                 password: '123456', 
                 role: 'Parent'
             });
         }
         updates.parentId = parent._id;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id, 
        { $set: updates }, 
        { new: true, runValidators: true }
    );
    
    res.json(updatedStudent);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
        return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    if (student.parentId) {
        const siblingsCount = await Student.countDocuments({ 
            parentId: student.parentId, 
            _id: { $ne: student._id } 
        });
        
        if (siblingsCount === 0) {
            const Parent = require('../models/Parents');
            await Parent.findByIdAndDelete(student.parentId);
        }
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa học viên" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsByParent = async (req, res) => {
    try {
        const students = await Student.find({ parentId: req.params.parentId });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
