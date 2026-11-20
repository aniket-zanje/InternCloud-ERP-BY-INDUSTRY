const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 1. Load environment variables
dotenv.config();

// 2. Connect to Database
connectDB();

// 3. Import all 20 Models (forces Mongoose to register them)
require('./models/Organization');
require('./models/User');
require('./models/InternshipOpening');
require('./models/Application');
require('./models/Intern');
require('./models/Task');
require('./models/TaskSubmission');
require('./models/Attendance');
require('./models/Evaluation');
require('./models/Announcement');
require('./models/AnnouncementRead');
require('./models/Stipend');
require('./models/Feedback');
require('./models/AiInsight');
require('./models/VirtualId');
require('./models/Certification');
require('./models/DomainCertification');
require('./models/InternCertificationProgress');
require('./models/Notification');
require('./models/AuditLog');

// 4. Initialize Express App
const app = express();
app.use(express.json());

// 5. Test Route
app.get('/', (req, res) => {
  res.send('InternCloud API is running...');
});

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});