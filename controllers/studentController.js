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
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { 
        fullName, dateOfBirth, address, skillLevel, enrollmentDate, // Basic info
        parentName, parentPhone, parentEmail, // Parent info (Direct input)
        scheduleSlots, sessionsTotal // Schedule info (New: scheduleSlots)
    } = req.body;

    // 1. Auto-Generate Student ID
    const lastStudent = await Student.findOne().sort({ studentId: -1 });
    const nextId = lastStudent && lastStudent.studentId ? lastStudent.studentId + 1 : 1000;

    // 2. Handle Parent (Find or Create)
    const Parent = require('../models/Parents');
    let parentId = null;

    if (parentPhone) {
        let parent = await Parent.findOne({ phone: parentPhone });
        if (!parent) {
             // Create new parent
             parent = await Parent.create({
                 fullName: parentName || 'Phụ huynh',
                 phone: parentPhone,
                 email: parentEmail || `${parentPhone}@zchess.local`,
                 username: parentPhone,
                 password: '123456', // Default
                 role: 'Parent'
             });
        }
        parentId = parent._id;
    }

    // 3. Create Student
    const student = new Student({
        studentId: nextId,
        fullName,
        dateOfBirth,
        address,
        skillLevel,
        enrollmentDate: enrollmentDate || new Date(),
        parentId,
        schedule: {
            slots: scheduleSlots || [], // [{ day: 1, time: '18:00' }]
            startDate: enrollmentDate || new Date()
        },
        sessions: {
            total: sessionsTotal || 16,
            used: 0
        }
    });

    await student.save();
    
    // (Optional) Auto-create Enrollment to keep Finance consistent?
    // For now, let's stick to Student. Attendance will need to read Student directly.
    
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    console.log("updateStudent payload:", req.body); // Debug log

    const { 
        fullName, dateOfBirth, address, skillLevel, enrollmentDate,
        scheduleSlots, sessionsTotal, // New field
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

    // Handle Parent Update
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.parentId && (parentName || parentPhone || parentEmail)) { 
        const Parent = require('../models/Parents');
        const parentUpdates = {};
        if (parentName !== undefined) parentUpdates.fullName = parentName;
        if (parentPhone !== undefined) parentUpdates.phone = parentPhone;
        if (parentEmail !== undefined) parentUpdates.email = parentEmail;
        
        await Parent.findByIdAndUpdate(student.parentId, parentUpdates);
    }

    console.log("Applying updates:", updates); // Debug log

    const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id, 
        { $set: updates }, 
        { new: true }
    );
    
    res.json(updatedStudent);
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
