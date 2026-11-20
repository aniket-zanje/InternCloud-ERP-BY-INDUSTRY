const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 1. Load environment variables (must run before anything reads process.env)
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

const { UPLOAD_ROOT } = require('./middleware/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// 4. Initialize Express App
const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Uploaded profile photos + task submissions
app.use('/uploads', express.static(UPLOAD_ROOT));

// 5. Routes
app.get('/', (req, res) => {
  res.send('InternCloud API is running...');
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/intern', require('./routes/internRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// 6. Errors (must be last)
app.use(notFound);
app.use(errorHandler);

// 7. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
