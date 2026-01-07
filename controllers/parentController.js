const Parent = require('../models/Parents');
const Student = require('../models/Student');

exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find();
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Không tìm thấy phụ huynh' });
    res.json(parent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createParent = async (req, res) => {
  try {
    const { fullName, phone, email, address, students } = req.body;
    
    const username = phone; 
    const password = "123456";
    const emailToUse = email || `${phone}@zchess.com`;

    const existingUser = await Parent.findOne({ 
        $or: [
            { username }, 
            { email: emailToUse },
            { phone: phone }
        ] 
    });
    
    if (existingUser) {
      if (existingUser.phone === phone) return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký' });
      if (existingUser.email === emailToUse) return res.status(400).json({ message: 'Email này đã được sử dụng' });
      return res.status(400).json({ message: 'Phụ huynh với số điện thoại hoặc email này đã tồn tại' });
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
    
    await parent.save();
    res.status(201).json(parent);
  } catch (err) {
    if (err.code === 11000) {
        if (err.keyPattern.phone) return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký' });
        if (err.keyPattern.email) return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.updateParent = async (req, res) => {
  try {
    if (req.body.phone) {
        const duplicate = await Parent.findOne({ 
            phone: req.body.phone, 
            _id: { $ne: req.params.id }
        });
        if (duplicate) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' });
        }
    }

    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { 
        new: true,
        runValidators: true
    });
    if (!parent) return res.status(404).json({ message: 'Không tìm thấy phụ huynh' });
    res.json(parent);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.phone) {
         return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    const deletedParent = await Parent.findByIdAndDelete(req.params.id);
    if (!deletedParent) {
        return res.status(404).json({ message: 'Không tìm thấy phụ huynh' });
    }
    
    await Student.deleteMany({ parentId: req.params.id });
    
    res.json({ message: 'Đã xóa phụ huynh và các học viên liên quan', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getParentStudents = async (req, res) => {
    try {
        const students = await Student.find({ parentId: req.params.id });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
