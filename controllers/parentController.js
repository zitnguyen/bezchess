const Parent = require('../models/Parents');
const Student = require('../models/Student');

// Get all parents
exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find();
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get parent by ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    res.json(parent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new parent
exports.createParent = async (req, res) => {
  try {
    const { fullName, phone, email, address, students } = req.body;
    
    // Check if phone/email already exists
    // Auto-generate credentials
    const username = phone; 
    const password = "123456"; // Default password
    const emailToUse = email || `${phone}@zchess.local`; // Fallback email

    // Check if user exists by username (phone) or email
    const existingUser = await Parent.findOne({ $or: [{ username }, { email: emailToUse }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Parent with this phone/username or email already exists' });
    }

    const parent = new Parent({
      username,
      password,
      fullName,
      phone,
      email: emailToUse,
      address,
      role: 'Parent' 
    });
    
    // If students are provided (array of IDs or Objects), logic to link them could be here,
    // but typically we link Student -> Parent. 
    // If specific logic is needed to update Students with this parentId, we can add it.
    
    await parent.save();
    res.status(201).json(parent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    res.json(parent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete parent
exports.deleteParent = async (req, res) => {
  try {
    await Parent.findByIdAndDelete(req.params.id);
    // Optional: Remove parentId from associated students?
    // await Student.updateMany({ parentId: req.params.id }, { $unset: { parentId: "" } });
    res.json({ message: 'Parent deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get students associated with a parent
exports.getParentStudents = async (req, res) => {
    try {
        const students = await Student.find({ parentId: req.params.id });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
