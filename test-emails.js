require("dotenv").config();
const emailService = require("./src/services/emailService");

const TEST_EMAIL = process.env.EMAIL_USER; // Send test emails to yourself

const mockOrder = {
  _id: "507f1f77bcf86cd799439011",
  id: "507f1f77bcf86cd799439011",
  totalAmount: 15500,
  items: [
    { partName: "Brake Pad Set", quantity: 2, unitPrice: 5000, subtotal: 10000 },
    { partName: "Oil Filter", quantity: 1, unitPrice: 5500, subtotal: 5500 }
  ]
};

const mockBooking = {
  garageName: "AutoFix Garage",
  service: "Full Engine Service",
  appointmentDate: "2026-05-10",
  appointmentTime: "10:00 AM"
};

async function runTests() {
  console.log("=".repeat(60));
  console.log("  WMT Email Function Tests");
  console.log("=".repeat(60));
  console.log(`Sending all test emails to: ${TEST_EMAIL}\n`);

  const tests = [
    {
      name: "1. Order Confirmed Email",
      fn: () => emailService.sendOrderConfirmedEmail(TEST_EMAIL, "Test User", mockOrder)
    },
    {
      name: "2. Order Shipped Email",
      fn: () => emailService.sendOrderShippedEmail(TEST_EMAIL, "Test User", mockOrder)
    },
    {
      name: "3. Booking Added Email (Customer + Owner)",
      fn: () => emailService.sendBookingAddedEmail(
        TEST_EMAIL, "Test Customer",
        TEST_EMAIL, "Test Owner",
        mockBooking
      )
    },
    {
      name: "4. Booking Confirmed Email",
      fn: () => emailService.sendBookingConfirmedEmail(TEST_EMAIL, "Test Customer", mockBooking)
    },
    {
      name: "5. Booking Cancelled Email",
      fn: () => emailService.sendBookingCancelledEmail(
        TEST_EMAIL, "Test Customer",
        TEST_EMAIL, "Test Owner",
        mockBooking
      )
    },
    {
      name: "6. Account Deletion Email",
      fn: () => emailService.sendAccountDeletionEmail(TEST_EMAIL, "Test User", "Violation of terms", "Admin")
    },
    {
      name: "7. Account Locked Email",
      fn: () => emailService.sendAccountLockedEmail(TEST_EMAIL, "Test User", "Suspicious activity detected", "Admin")
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`  Testing: ${test.name} ... `);
    try {
      await test.fn();
      console.log("✅ PASSED");
      passed++;
    } catch (error) {
      console.log(`❌ FAILED`);
      console.error(`     Error: ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log("=".repeat(60));

  if (failed === 0) {
    console.log("\n  ✅ All email functions are working! Check your inbox.");
  } else {
    console.log("\n  ⚠️  Some emails failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env");
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Fatal error running tests:", err);
  process.exit(1);
});
