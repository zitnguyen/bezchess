const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function verifyStudentSync() {
  console.log('--- Starting Verification ---');

  // 1. Get a student ID
  try {
    const studentsRes = await axios.get(`${BASE_URL}/students`);
    const students = studentsRes.data;
    if (students.length === 0) {
      console.error('No students found to test with.');
      return;
    }
    const student1 = students[0];
    const student2 = students[1] || students[0]; // Use same if only 1 exists
    
    console.log(`Using Student 1: ${student1._id} (${student1.fullName})`);

    // 2. Create a Class with Student 1
    const classData = {
        classId: 9999,
        className: 'Test Class for Sync',
        // Copied course fields structure
        description: "Test Description",
        fee: 1000000,
        level: "Beginner",
        maxStudents: 10,
        totalSessions: 16
    };

    // Removed Course fetching logic as Course model is deleted
    // const coursesRes = await axios.get(`${BASE_URL}/courses`);

    console.log('Creating class with 1 student...');
    const createRes = await axios.post(`${BASE_URL}/classes`, {
        ...classData,
        students: [student1._id]
    });
    
    const newClassId = createRes.data._id;
    console.log('Class created:', newClassId);

    // 3. Verify Enrollment Created
    const enrollmentsRes1 = await axios.get(`${BASE_URL}/enrollments?classId=${newClassId}`);
    const enrolledStudents1 = enrollmentsRes1.data.map(e => e.studentId._id || e.studentId);
    console.log('Enrollments after create:', enrolledStudents1);
    
    if (enrolledStudents1.includes(student1._id)) {
        console.log('PASS: Student 1 is enrolled.');
    } else {
        console.error('FAIL: Student 1 is NOT enrolled.');
    }

    // 4. Update Class: Remove Student 1, Add Student 2
    console.log('Updating class: Swapping Student 1 for Student 2 (or adding if same)...');
    // If we only have 1 student, we effectively remove and add same, which is a no-op, so let's try to just remove if only 1.
    const newStudentList = (students.length > 1) ? [student2._id] : [];
    
    await axios.put(`${BASE_URL}/classes/${newClassId}`, {
        students: newStudentList
    });

    // 5. Verify Enrollment Updated
    const enrollmentsRes2 = await axios.get(`${BASE_URL}/enrollments?classId=${newClassId}`);
    const enrolledStudents2 = enrollmentsRes2.data.map(e => e.studentId._id || e.studentId);
    console.log('Enrollments after update:', enrolledStudents2);

    if (newStudentList.length > 0) {
         if (enrolledStudents2.includes(student2._id) && !enrolledStudents2.includes(student1._id)) {
            console.log('PASS: Student 1 removed, Student 2 added.');
        } else {
            console.error('FAIL: Enrollments not updated correctly.');
        }
    } else {
        if (enrolledStudents2.length === 0) {
             console.log('PASS: All students removed.');
        } else {
             console.error('FAIL: Students not removed.');
        }
    }

    // Cleanup
    console.log('Cleaning up...');
    await axios.delete(`${BASE_URL}/classes/${newClassId}`);
    console.log('Test Class deleted.');
    
    // Note: Enrollments might need manual cleanup if deleteClass doesn't cascade, 
    // but the controller logic might not handle cascade delete yet. 
    // Let's check if deleteClass handles it? 
    // Based on previous reads, deleteClass in controller does NOT seem to delete enrollments automatically?
    // Wait, let's check classController.deleteClass again.
    
  } catch (err) {
    console.error('Verification Failed:', err.response?.data || err.message);
  }
}

verifyStudentSync();
