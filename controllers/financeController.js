const Revenue = require("../models/Revenue");
const Expense = require("../models/Expense");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getStatsByRange = async (start, end) => {
    const revenueDocs = await Revenue.find({
      date: { $gte: start, $lte: end }
    });
    const totalRevenueAmount = revenueDocs.reduce((acc, curr) => acc + curr.amount, 0);

    const paidEnrollments = await Enrollment.find({
      paymentStatus: "paid",
      enrollmentDate: { $gte: start, $lte: end }
    });
    const totalTuition = paidEnrollments.reduce((acc, curr) => acc + (curr.feeAmount || 0), 0);
    
    const totalIncome = totalRevenueAmount + totalTuition;

    const expenseDocs = await Expense.find({
      date: { $gte: start, $lte: end }
    });
    const totalExpense = expenseDocs.reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = totalIncome - totalExpense;

    return { totalIncome, totalExpense, netProfit };
};

const calculateGrowth = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Math.round(((current - previous) / previous) * 100);
};

exports.getFinanceStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    let targetDate = new Date();
    
    if (month && year) {
        targetDate = new Date(Number(year), Number(month) - 1, 1);
    }

    const { start, end } = getMonthRange(targetDate);

    const prevDate = new Date(targetDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const { start: prevStart, end: prevEnd } = getMonthRange(prevDate);
    
    const [currentStats, prevStats] = await Promise.all([
        getStatsByRange(start, end),
        getStatsByRange(prevStart, prevEnd)
    ]);

    const incomeGrowth = calculateGrowth(currentStats.totalIncome, prevStats.totalIncome);
    const expenseGrowth = calculateGrowth(currentStats.totalExpense, prevStats.totalExpense);
    const profitGrowth = calculateGrowth(currentStats.netProfit, prevStats.netProfit);

    res.json({
      success: true,
      data: [
        { 
          label: 'Doanh Thu Tháng', 
          value: currentStats.totalIncome, 
          change: `${incomeGrowth > 0 ? '+' : ''}${incomeGrowth}%`, 
          sub: 'so với tháng trước',
          trend: incomeGrowth >= 0 ? 'up' : 'down'
        },
        { 
          label: 'Chi Phí Vận Hành', 
          value: currentStats.totalExpense, 
          change: `${expenseGrowth > 0 ? '+' : ''}${expenseGrowth}%`, 
          sub: 'trong tháng này',
          trend: expenseGrowth >= 0 ? 'up' : 'down'
        },
        { 
          label: 'Lợi Nhuận Ròng', 
          value: currentStats.netProfit, 
          change: `${profitGrowth > 0 ? '+' : ''}${profitGrowth}%`, 
          sub: 'mục tiêu đạt',
          trend: profitGrowth >= 0 ? 'up' : 'down'
        },
      ]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

exports.getFinanceChartData = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let anchorDate = new Date();
    if (month && year) {
        anchorDate = new Date(Number(year), Number(month), 0);
    }

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
      months.push({
        name: `T${d.getMonth() + 1}`,
        month: d.getMonth(),
        year: d.getFullYear()
      });
    }

    const data = await Promise.all(months.map(async (m) => {
        const start = new Date(m.year, m.month, 1);
        const end = new Date(m.year, m.month + 1, 0);
        end.setHours(23, 59, 59, 999);

        const revs = await Revenue.find({ date: { $gte: start, $lte: end } });
        const exps = await Expense.find({ date: { $gte: start, $lte: end } });
        const enrs = await Enrollment.find({ 
            paymentStatus: "paid", 
            enrollmentDate: { $gte: start, $lte: end } 
        });

        const income = revs.reduce((a, b) => a + b.amount, 0) + enrs.reduce((a, b) => a + (b.feeAmount || 0), 0);
        const expense = exps.reduce((a, b) => a + b.amount, 0);

        return {
            name: m.name,
            income: income / 1000000, 
            expense: expense / 1000000
        };
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCostStructure = async (req, res) => {
  try {
    const { month, year } = req.query;
    let targetDate = new Date();
    if (month && year) {
        targetDate = new Date(Number(year), Number(month) - 1, 1);
    }
    const { start, end } = getMonthRange(targetDate);

    const expenses = await Expense.find({ date: { $gte: start, $lte: end } });
    
    const categoryMap = {};
    let total = 0;

    expenses.forEach(e => {
        const cat = e.category || 'Khác';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
        total += e.amount;
    });

    const data = Object.keys(categoryMap).map(key => ({
        label: key,
        value: categoryMap[key],
        percent: total ? Math.round((categoryMap[key] / total) * 100) : 0,
        color: '#64748B' 
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;
    let queryFilter = {};

    let revenues, expenses, enrollments;

    if (month && year) {
        const targetDate = new Date(Number(year), Number(month) - 1, 1);
        const { start, end } = getMonthRange(targetDate);

        revenues = await Revenue.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
        expenses = await Expense.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
        enrollments = await Enrollment.find({ 
            paymentStatus: 'paid',
            enrollmentDate: { $gte: start, $lte: end }
        }).populate('studentId', 'fullName').sort({ enrollmentDate: -1 });
    } else {
        revenues = await Revenue.find().sort({ date: -1 }).limit(20);
        expenses = await Expense.find().sort({ date: -1 }).limit(20);
        enrollments = await Enrollment.find({ paymentStatus: 'paid' })
            .populate('studentId', 'fullName')
            .sort({ enrollmentDate: -1 })
            .limit(20);
    }

    const normalizedRevenues = revenues.map(r => ({
        id: `REV-${r.revenueId}`,
        content: r.source || 'Thu nhập khác',
        sub: r.description,
        type: 'income',
        date: r.date,
        amount: r.amount,
        status: 'completed'
    }));

    const normalizedExpenses = expenses.map(e => ({
        id: `EXP-${e.expenseId}`,
        content: e.category,
        sub: e.description,
        type: 'expense',
        date: e.date,
        amount: e.amount,
        status: 'completed'
    }));

    const normalizedEnrollments = enrollments.map(e => ({
        id: `ENR-${e.enrollmentId}`,
        content: `Thu học phí - ${e.studentId?.fullName || 'Học viên'}`,
        sub: 'Học phí',
        type: 'income',
        date: e.enrollmentDate,
        amount: e.feeAmount,
        status: 'completed'
    }));

    let all = [...normalizedRevenues, ...normalizedExpenses, ...normalizedEnrollments]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
        
    if (!month && !year) {
        all = all.slice(0, 20);
    }

    res.json({ success: true, data: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportFinanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        
        let revenues, expenses, enrollments;
        let filename = `BaoCaoTaiChinh_${year || 'All'}_${month || 'Recent'}.csv`;

        if (month && year) {
            const targetDate = new Date(Number(year), Number(month) - 1, 1);
            const { start, end } = getMonthRange(targetDate);

            revenues = await Revenue.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
            expenses = await Expense.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
            enrollments = await Enrollment.find({ 
                paymentStatus: 'paid',
                enrollmentDate: { $gte: start, $lte: end }
            }).populate('studentId', 'fullName').sort({ enrollmentDate: -1 });
        } else {
             const today = new Date();
             const { start, end } = getMonthRange(today);
             revenues = await Revenue.find({ date: { $gte: start, $lte: end } });
             expenses = await Expense.find({ date: { $gte: start, $lte: end } });
             enrollments = await Enrollment.find({ paymentStatus: 'paid', enrollmentDate: { $gte: start, $lte: end } }).populate('studentId', 'fullName');
             filename = `BaoCaoTaiChinh_Thang${today.getMonth()+1}_${today.getFullYear()}.csv`;
        }

        let csvContent = "Mã GD,Nội dung,Mô tả,Loại,Ngày,Số tiền,Trạng thái\n";

        const addToCsv = (id, content, desc, type, date, amount, status) => {
            const dateStr = new Date(date).toLocaleDateString('vi-VN');
            const safeContent = `"${(content || '').replace(/"/g, '""')}"`;
            const safeDesc = `"${(desc || '').replace(/"/g, '""')}"`;
            csvContent += `${id},${safeContent},${safeDesc},${type},${dateStr},${amount},${status}\n`;
        };

        revenues.forEach(r => addToCsv(`REV-${r.revenueId}`, r.source, r.description, 'Thu nhập', r.date, r.amount, 'Hoàn thành'));
        enrollments.forEach(e => addToCsv(`ENR-${e.enrollmentId}`, `Thu học phí - ${e.studentId?.fullName}`, 'Học phí', 'Thu nhập', e.enrollmentDate, e.feeAmount, 'Hoàn thành'));
        expenses.forEach(e => addToCsv(`EXP-${e.expenseId}`, e.category, e.description, 'Chi phí', e.date, e.amount, 'Hoàn thành'));

        res.uniqueHeader = true; 
        res.header('Content-Type', 'text/csv'); 
        res.attachment(filename);
        return res.send(csvContent);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
}

exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, description, category, date, source } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({ success: false, message: "Loại và số tiền là bắt buộc" });
    }

    if (type === 'income') {
      const lastRevenue = await Revenue.findOne().sort({ revenueId: -1 });
      const newId = lastRevenue ? lastRevenue.revenueId + 1 : 1;

      const newRevenue = new Revenue({
        revenueId: newId,
        source: source || 'Thu nhập khác',
        amount: Number(amount),
        description,
        date: date || new Date(),
      });
      await newRevenue.save();
      return res.json({ success: true, data: newRevenue, message: "Đã thêm doanh thu" });

    } else if (type === 'expense') {
      const lastExpense = await Expense.findOne().sort({ expenseId: -1 });
      const newId = lastExpense ? lastExpense.expenseId + 1 : 1;

      const newExpense = new Expense({
        expenseId: newId,
        category: category || 'Chi phí khác',
        amount: Number(amount),
        description,
        date: date || new Date(),
      });
      await newExpense.save();
      return res.json({ success: true, data: newExpense, message: "Đã thêm chi phí" });

    } else {
      return res.status(400).json({ success: false, message: "Loại giao dịch không hợp lệ" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category, date, source } = req.body;
    
    const [typePrefix, numericId] = id.split('-');
    
    if (!typePrefix || !numericId) {
        return res.status(400).json({ success: false, message: "Định dạng ID không hợp lệ" });
    }

    let updatedDoc;
    
    if (typePrefix === 'REV') {
        updatedDoc = await Revenue.findOneAndUpdate(
            { revenueId: Number(numericId) },
            { 
               amount: Number(amount),
               description,
               source,
               date: date
            },
            { new: true }
        );
    } else if (typePrefix === 'EXP') {
         updatedDoc = await Expense.findOneAndUpdate(
            { expenseId: Number(numericId) },
            { 
               amount: Number(amount),
               description,
               category,
               date: date
            },
            { new: true }
        );
    } else if (typePrefix === 'ENR') {
        return res.status(400).json({ success: false, message: "Không thể chỉnh sửa học phí tại đây. Vui lòng vào quản lý học viên." });
    } else {
        return res.status(400).json({ success: false, message: "Loại giao dịch không xác định" });
    }

    if (!updatedDoc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    }

    res.json({ success: true, message: "Cập nhật thành công", data: updatedDoc });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

exports.deleteTransaction = async (req, res) => {
    try {
      const { id } = req.params;
      const [typePrefix, numericId] = id.split('-');

      if (!typePrefix || !numericId) {
          return res.status(400).json({ success: false, message: "Định dạng ID không hợp lệ" });
      }
  
      let deletedDoc;
  
      if (typePrefix === 'REV') {
          deletedDoc = await Revenue.findOneAndDelete({ revenueId: Number(numericId) });
      } else if (typePrefix === 'EXP') {
           deletedDoc = await Expense.findOneAndDelete({ expenseId: Number(numericId) });
      } else if (typePrefix === 'ENR') {
          return res.status(400).json({ success: false, message: "Không thể xóa học phí tại đây." });
      }
  
      if (!deletedDoc) {
          return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
      }
  
      res.json({ success: true, message: "Xóa thành công" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};

exports.payTuition = async (req, res) => {
    try {
        const { enrollmentId } = req.body;
        
        const Enrollment = require("../models/Enrollment");
        const enrollment = await Enrollment.findOne({ enrollmentId });
        
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy ghi danh" });
        }
        
        if (enrollment.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: "Học phí đã được thanh toán" });
        }
        
        const lastRevenue = await Revenue.findOne().sort({ revenueId: -1 });
        const newRevenueId = lastRevenue ? lastRevenue.revenueId + 1 : 1;
        
        const student = await Student.findById(enrollment.studentId);
        const studentName = student ? student.fullName : "Học viên";
        
        const newRevenue = new Revenue({
            revenueId: newRevenueId,
            source: "Học phí",
            amount: enrollment.feeAmount || 0,
            description: `Thu học phí - ${studentName} - Mã GH: ${enrollmentId}`,
            date: new Date(),
        });
        await newRevenue.save();
        
        enrollment.paymentStatus = 'paid';
        await enrollment.save();
        
        res.json({ success: true, message: "Thanh toán thành công", data: {
            enrollment,
            revenue: newRevenue
        }});

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
