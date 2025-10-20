const express = require('express');
const cors = require('cors');
require('dotenv').config();

// express and middleware setup
const app = express();
app.use(cors());
app.use(express.json());


// --------------------- route handlers --------------------- //
app.get('/', (req, res) => {
  res.send('Hello from the SkillBridge Backend!');
});
 
// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Student routes
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

// Register course routes
const courseRoutes = require('./routes/courseRoutes');
app.use('/courses', courseRoutes);




// -------------------- server setup -------------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});