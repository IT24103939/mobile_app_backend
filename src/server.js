require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDatabase } = require("./config/db");
const { seedDemoData } = require("./utils/seed");

const authRoutes = require("./routes/authRoutes");
const accountRoutes = require("./routes/accountRoutes");
const garageRoutes = require("./routes/garageRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sparePartsRoutes = require("./routes/sparePartsRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/garages", garageRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/spare-parts", sparePartsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("[Server Error]", {
    method: req.method,
    path: req.path,
    status: error.status || 500,
    message: error.message,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: error.message || "Internal server error"
  });
});

async function startServer() {
  const port = Number(process.env.PORT || 8080);
  await connectDatabase(process.env.MONGODB_URI);
  await seedDemoData();

  app.listen(port, '0.0.0.0', () => {
    console.log(`WMT Node backend listening on port ${port} (all interfaces)`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
