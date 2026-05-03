const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedDemoData() {
  try {
    // Check if admin user already exists
    const adminPhone = "0700000000";
    const existingAdmin = await User.findOne({ phone: adminPhone });
    
    if (!existingAdmin) {
      console.log("Creating default admin account...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("123456", salt);
      
      const adminUser = new User({
        fullName: "System Admin",
        phone: adminPhone,
        password: hashedPassword,
        role: "ADMIN"
      });
      
      await adminUser.save();
      console.log("Admin account created successfully.");
    } else {
      console.log("Admin account already exists.");
    }
  } catch (error) {
    console.error("Error seeding admin data:", error);
  }
}

module.exports = {
  seedDemoData
};
