const User = require("./User");
const mongoose = require("mongoose");
const parentSchema = new mongoose.Schema({
  address: String, // Địa chỉ liên hệ
});

const Parent = User.discriminator("Parent", parentSchema);
module.exports = Parent;
