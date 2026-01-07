require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const financeRoutes = require("./routes/financeRoutes");
const parentRoutes = require("./routes/parentRoutes");

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/revenues", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/parents", parentRoutes);

const PORT = process.env.PORT || 5000;

console.log("Mongo URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));
