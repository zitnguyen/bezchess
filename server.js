require("dotenv").config(); // load .env phải ở đầu
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// import routes
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes"); // thêm course
const classRoutes = require("./routes/classRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const revenueRoutes = require("./routes/revenueRoutes"); // thêm revenue
const expenseRoutes = require("./routes/expenseRoutes"); // thêm expense
const financeRoutes = require("./routes/financeRoutes"); // thêm finance
const parentRoutes = require("./routes/parentRoutes"); // thêm parent routes

const app = express();
app.use(cors());
app.use(express.json());

// map routes
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/revenues", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/parents", parentRoutes);

// chạy server
const PORT = process.env.PORT || 5000;

// debug: kiểm tra env
console.log("Mongo URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));
