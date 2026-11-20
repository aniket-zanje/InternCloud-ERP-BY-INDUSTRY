const router = require('express').Router();
const { protect, requireIntern } = require('../middleware/auth');
const { profilePhoto, taskFile } = require('../middleware/upload');
const intern = require('../controllers/internController');
const certificate = require('../controllers/certificateController');

router.use(protect, requireIntern);

router.get('/profile', intern.getProfile);
router.put('/profile/photo', profilePhoto, intern.updatePhoto);

router.get('/overview', intern.getOverview);

router.get('/tasks', intern.getTasks);
router.post('/tasks/:taskId/submit', taskFile, intern.submitTask);

router.get('/attendance', intern.getAttendance);
router.get('/ai-score', intern.getAiScore);
router.get('/certificate', certificate.getCertificate);

module.exports = router;
