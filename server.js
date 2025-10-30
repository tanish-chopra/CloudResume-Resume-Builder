require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const app = express();
const upload = multer();

// ✅ Enable CORS for frontend (use env or wildcard for EB)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- MySQL Connection --------------------
const db = mysql.createConnection({
  host: 'database-1.chisg40ye8v6.ap-south-1.rds.amazonaws.com',
  user: 'admin', // change if needed
  password: 'hINEFQwIrbOT1acfBPKR', // change if needed
  database: 'resume_builder_db' // change if needed
});

db.connect((err) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// -------------------- AWS S3 Setup --------------------
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Upload resume PDF to S3
async function uploadResume(userId, fileBuffer, fileName) {
  const key = `resumes/${userId}/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/pdf',
  });
  await s3.send(command);
  return key;
}

// Generate a pre-signed URL for downloading resume
async function getResumeUrl(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 60 });
}

// -------------------- Routes --------------------

// ✅ Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Test MySQL connection
app.get('/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      return res.status(500).send('MySQL connection failed: ' + err.message);
    }
    res.send('MySQL connection successful! Result: ' + results[0].result);
  });
});

// ✅ User signup
app.post('/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Error signing up' });
    }
    res.json({ message: 'Signup successful', userId: result.insertId });
  });
});

// ✅ User login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).send('Error logging in');
    }
    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', user: { id: results[0].id, email: results[0].email } });
  });
});

// ✅ Fetch all resumes for a user
app.get('/resumes', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  db.query('SELECT id, file_name, s3_key, uploaded_at FROM resumes WHERE user_id = ?', [userId], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching resumes' });
    }
    const validResumes = [];
    for (const resume of results) {
      // Check if file exists in S3
      try {
        await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: resume.s3_key }));
        const url = await getResumeUrl(resume.s3_key);
        validResumes.push({
          id: resume.id,
          fileName: resume.file_name,
          uploadedAt: resume.uploaded_at,
          url
        });
      } catch (err) {
        // File does not exist, skip this entry
      }
    }
    res.json(validResumes);
  });
});

// ✅ Upload resume endpoint
app.post('/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const file = req.file;
    if (!userId || !file) {
      return res.status(400).json({ error: 'User ID and resume file are required' });
    }
    const key = await uploadResume(userId, file.buffer, file.originalname);
    db.query('INSERT INTO resumes (user_id, file_name, s3_key, uploaded_at) VALUES (?, ?, ?, NOW())',
      [userId, file.originalname, key], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error saving resume metadata' });
        }
        res.json({ message: 'Resume uploaded successfully', resumeId: result.insertId });
      });
  } catch (err) {
    res.status(500).json({ error: 'Resume upload failed' });
  }
});

// ✅ Save resume from builder endpoint
app.post('/save-resume-from-builder', upload.single('resumePdf'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const resumeData = JSON.parse(req.body.resumeData);
    const file = req.file;
    
    if (!userId || !file) {
      return res.status(400).json({ error: 'User ID and resume PDF are required' });
    }

    const userName = resumeData.personalInfo?.fullName || 'Resume';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;
    
    const key = await uploadResume(userId, file.buffer, fileName);
    
    db.query('INSERT INTO resumes (user_id, file_name, s3_key, uploaded_at) VALUES (?, ?, ?, NOW())',
      [userId, fileName, key], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Error saving resume metadata' });
        }
        res.json({ message: 'Resume saved successfully to S3', resumeId: result.insertId, fileName });
      });
  } catch (err) {
    console.error('Resume save error:', err);
    res.status(500).json({ error: 'Resume save failed' });
  }
});

// -------------------- Start Server --------------------
const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


