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






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});