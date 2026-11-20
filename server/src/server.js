
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 1. Load environment variables
dotenv.config();

// 2. Import all 20 Mongoose models
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
const {
  notFound,
  errorHandler
} = require('./middleware/errorHandler');

// 3. Initialize Express application
const app = express();

// 4. Configure CORS
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));

// 5. Configure body parsing
app.use(express.json());

// 6. Serve uploaded files
app.use('/uploads', express.static(UPLOAD_ROOT));

// 7. Default route
app.get('/', (req, res) => {
  res.send('InternCloud API is running...');
});

// 8. Register API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/intern', require('./routes/internRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// 9. Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

// 10. Start server after successful MongoDB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
