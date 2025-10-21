const admin = require('../config/firebase');
const db = admin.firestore();

// Dummy job data for demonstration
const dummyJobs = [
  {
    id: '1',
    company: 'DoMedia',
    role: 'IT Support & Operations Intern (Web Hosting)',
    jobTitle: 'IT Support Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'We are seeking a motivated IT Support & Operations Intern to join our web hosting team. This role offers hands-on experience in technical support, server management, and customer service.',
    responsibilities: [
      'Provide technical support to customers via email, chat, and phone',
      'Assist in server maintenance and monitoring',
      'Help troubleshoot hosting-related issues',
      'Document support tickets and resolutions',
      'Collaborate with the operations team on infrastructure projects'
    ],
    requirements: [
      'Currently pursuing or recently completed a degree in IT, Computer Science, or related field',
      'Basic understanding of web hosting, DNS, and server management',
      'Strong problem-solving skills',
      'Excellent communication skills in English',
      'Ability to work in a fast-paced environment'
    ],
    offerings: [
      'Hands-on experience with enterprise hosting infrastructure',
      'Mentorship from experienced IT professionals',
      'Flexible working hours',
      'Opportunity for full-time employment upon successful completion',
      'Monthly stipend'
    ],
    companyInfo: 'DoMedia is a leading web hosting and digital services provider in Sri Lanka, serving over 5,000 clients worldwide.',
    postedDate: '2025-10-01',
    applicants: 45,
    alumni: [
      { name: 'Kamal Perera', position: 'Senior DevOps Engineer', company: 'DoMedia' },
      { name: 'Nisha Fernando', position: 'IT Manager', company: 'DoMedia' }
    ]
  },
  {
    id: '2',
    company: 'TechCorp Solutions',
    role: 'Software Engineering Intern',
    jobTitle: 'Software Engineer Intern',
    location: 'Remote',
    type: 'Internship',
    workMode: 'Remote',
    description: 'Join our innovative software development team to work on cutting-edge web and mobile applications.',
    responsibilities: [
      'Develop and maintain web applications using React and Node.js',
      'Write clean, maintainable code following best practices',
      'Participate in code reviews and team meetings',
      'Collaborate with designers and product managers',
      'Debug and fix software issues'
    ],
    requirements: [
      'Knowledge of JavaScript, React, and Node.js',
      'Understanding of RESTful APIs',
      'Git version control experience',
      'Strong analytical thinking',
      'Self-motivated and able to work independently'
    ],
    offerings: [
      'Remote work opportunity',
      'Competitive stipend',
      'Work on real-world projects',
      'Career growth opportunities',
      'Flexible schedule'
    ],
    companyInfo: 'TechCorp Solutions specializes in custom software development for startups and enterprises.',
    postedDate: '2025-10-05',
    applicants: 89,
    alumni: [
      { name: 'Ashan Silva', position: 'Full Stack Developer', company: 'TechCorp' }
    ]
  },
  {
    id: '3',
    company: 'DataMinds Analytics',
    role: 'Data Science Intern',
    jobTitle: 'Data Science Intern',
    location: 'Kandy, Central Province, Sri Lanka',
    type: 'Internship',
    workMode: 'Hybrid',
    description: 'Exciting opportunity to work with big data and machine learning algorithms in a dynamic analytics firm.',
    responsibilities: [
      'Analyze large datasets to extract meaningful insights',
      'Build predictive models using Python and ML libraries',
      'Create data visualizations and reports',
      'Assist in data cleaning and preprocessing',
      'Present findings to stakeholders'
    ],
    requirements: [
      'Strong background in statistics and mathematics',
      'Proficiency in Python (pandas, NumPy, scikit-learn)',
      'Experience with data visualization tools',
      'Excellent analytical skills',
      'Good presentation abilities'
    ],
    offerings: [
      'Mentorship from data science experts',
      'Access to premium datasets',
      'Hybrid work model',
      'Competitive compensation',
      'Certificate upon completion'
    ],
    companyInfo: 'DataMinds Analytics provides data-driven insights to businesses across various industries.',
    postedDate: '2025-10-03',
    applicants: 67,
    alumni: [
      { name: 'Dinesh Kumar', position: 'Data Analyst', company: 'DataMinds' },
      { name: 'Shalini Dias', position: 'ML Engineer', company: 'DataMinds' }
    ]
  },
  {
    id: '4',
    company: 'CreativeHub Digital',
    role: 'UI/UX Design Intern',
    jobTitle: 'UI/UX Design Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Join our creative team to design beautiful and intuitive user interfaces for web and mobile applications.',
    responsibilities: [
      'Create wireframes and prototypes using Figma',
      'Design user interfaces following brand guidelines',
      'Conduct user research and usability testing',
      'Collaborate with developers to implement designs',
      'Maintain design system documentation'
    ],
    requirements: [
      'Portfolio demonstrating UI/UX design skills',
      'Proficiency in Figma or Adobe XD',
      'Understanding of design principles and typography',
      'Creative thinking and attention to detail',
      'Good communication skills'
    ],
    offerings: [
      'Work with top brands and startups',
      'Modern design tools and resources',
      'Creative work environment',
      'Monthly allowance',
      'Portfolio building opportunities'
    ],
    companyInfo: 'CreativeHub Digital is a design agency specializing in brand identity and digital experiences.',
    postedDate: '2025-10-07',
    applicants: 103,
    alumni: [
      { name: 'Priya Jayawardena', position: 'Senior Designer', company: 'CreativeHub' }
    ]
  },
  {
    id: '5',
    company: 'CloudNet Systems',
    role: 'Cloud Infrastructure Intern',
    jobTitle: 'Cloud Infrastructure Intern',
    location: 'Galle, Southern Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Learn and work with cloud technologies including AWS, Azure, and containerization platforms.',
    responsibilities: [
      'Assist in deploying applications to cloud platforms',
      'Monitor cloud infrastructure and performance',
      'Help with containerization using Docker',
      'Support DevOps automation tasks',
      'Document cloud architecture and procedures'
    ],
    requirements: [
      'Basic knowledge of AWS or Azure',
      'Understanding of Linux systems',
      'Familiarity with networking concepts',
      'Interest in cloud technologies',
      'Problem-solving mindset'
    ],
    offerings: [
      'AWS/Azure certification support',
      'Hands-on cloud experience',
      'Training on latest technologies',
      'Stipend provided',
      'Full-time opportunity potential'
    ],
    companyInfo: 'CloudNet Systems helps businesses migrate and optimize their cloud infrastructure.',
    postedDate: '2025-10-02',
    applicants: 54,
    alumni: [
      { name: 'Rohan Mendis', position: 'Cloud Engineer', company: 'CloudNet' }
    ]
  },
  {
    id: '6',
    company: 'MobileFirst Apps',
    role: 'Mobile App Development Intern',
    jobTitle: 'Mobile Developer Intern',
    location: 'Remote',
    type: 'Internship',
    workMode: 'Remote',
    description: 'Build cross-platform mobile applications using React Native and Flutter.',
    responsibilities: [
      'Develop mobile apps for iOS and Android',
      'Implement UI designs in React Native',
      'Integrate APIs and third-party libraries',
      'Test apps on different devices',
      'Fix bugs and optimize performance'
    ],
    requirements: [
      'Knowledge of React Native or Flutter',
      'JavaScript/Dart programming skills',
      'Understanding of mobile app architecture',
      'Portfolio of mobile projects',
      'Passion for mobile development'
    ],
    offerings: [
      'Work on published apps',
      'Remote flexibility',
      'Mentorship program',
      'Competitive stipend',
      'Learning resources'
    ],
    companyInfo: 'MobileFirst Apps creates innovative mobile solutions for businesses and consumers.',
    postedDate: '2025-10-08',
    applicants: 78,
    alumni: []
  },
  {
    id: '7',
    company: 'SecureNet Cybersecurity',
    role: 'Cybersecurity Analyst Intern',
    jobTitle: 'Cybersecurity Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Gain hands-on experience in cybersecurity operations, threat analysis, and security monitoring.',
    responsibilities: [
      'Monitor security alerts and incidents',
      'Assist in vulnerability assessments',
      'Help maintain security documentation',
      'Support incident response activities',
      'Learn penetration testing techniques'
    ],
    requirements: [
      'Interest in cybersecurity',
      'Basic networking knowledge',
      'Understanding of security concepts',
      'Analytical mindset',
      'Ethical and trustworthy'
    ],
    offerings: [
      'Cybersecurity certification training',
      'Real-world security experience',
      'Industry mentorship',
      'Competitive compensation',
      'Career advancement path'
    ],
    companyInfo: 'SecureNet provides enterprise security solutions and consulting services.',
    postedDate: '2025-10-04',
    applicants: 41,
    alumni: [
      { name: 'Tharindu Rathnayake', position: 'Security Analyst', company: 'SecureNet' }
    ]
  },
  {
    id: '8',
    company: 'GreenTech Solutions',
    role: 'Sustainability Tech Intern',
    jobTitle: 'Sustainability Intern',
    location: 'Kandy, Central Province, Sri Lanka',
    type: 'Internship',
    workMode: 'Hybrid',
    description: 'Work on technology solutions for environmental sustainability and climate action.',
    responsibilities: [
      'Develop sustainability tracking applications',
      'Analyze environmental data',
      'Create reports on carbon footprint',
      'Research green technology solutions',
      'Support sustainability initiatives'
    ],
    requirements: [
      'Passion for environmental sustainability',
      'Programming skills (any language)',
      'Data analysis capabilities',
      'Research-oriented mindset',
      'Good written communication'
    ],
    offerings: [
      'Meaningful work with impact',
      'Hybrid work arrangement',
      'Networking with sustainability leaders',
      'Stipend',
      'Certificate of completion'
    ],
    companyInfo: 'GreenTech develops technology solutions for environmental sustainability.',
    postedDate: '2025-10-06',
    applicants: 35,
    alumni: []
  },
  {
    id: '9',
    company: 'FinanceHub Technologies',
    role: 'FinTech Development Intern',
    jobTitle: 'FinTech Developer Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Develop financial technology applications including payment systems and banking solutions.',
    responsibilities: [
      'Build FinTech applications using modern frameworks',
      'Implement secure payment integrations',
      'Work with financial APIs',
      'Ensure compliance with security standards',
      'Test and debug financial software'
    ],
    requirements: [
      'Strong programming skills',
      'Interest in financial technology',
      'Understanding of secure coding practices',
      'Attention to detail',
      'Mathematical aptitude'
    ],
    offerings: [
      'Exposure to FinTech industry',
      'Competitive stipend',
      'Security and compliance training',
      'Career growth in finance sector',
      'Modern office environment'
    ],
    companyInfo: 'FinanceHub Technologies builds innovative financial solutions for businesses and consumers.',
    postedDate: '2025-10-09',
    applicants: 92,
    alumni: [
      { name: 'Chamara Wickramasinghe', position: 'FinTech Developer', company: 'FinanceHub' }
    ]
  },
  {
    id: '10',
    company: 'EduTech Innovations',
    role: 'Educational Technology Intern',
    jobTitle: 'EdTech Intern',
    location: 'Remote',
    type: 'Internship',
    workMode: 'Remote',
    description: 'Create educational technology solutions that transform learning experiences.',
    responsibilities: [
      'Develop e-learning platforms and tools',
      'Create interactive educational content',
      'Test learning management systems',
      'Support online course development',
      'Gather user feedback and analytics'
    ],
    requirements: [
      'Passion for education and technology',
      'Web development skills',
      'Creative problem-solving',
      'Understanding of UX principles',
      'Good communication skills'
    ],
    offerings: [
      'Remote work flexibility',
      'Impact millions of learners',
      'Professional development',
      'Stipend provided',
      'Innovative work culture'
    ],
    companyInfo: 'EduTech Innovations creates digital learning solutions for schools and universities.',
    postedDate: '2025-10-10',
    applicants: 58,
    alumni: []
  },
  {
    id: '11',
    company: 'GameStudio Lanka',
    role: 'Game Development Intern',
    jobTitle: 'Game Developer Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Join our game development team to create engaging mobile and PC games.',
    responsibilities: [
      'Develop game features using Unity or Unreal Engine',
      'Implement gameplay mechanics',
      'Create game assets and animations',
      'Test and debug games',
      'Collaborate with artists and designers'
    ],
    requirements: [
      'Experience with Unity or Unreal Engine',
      'C# or C++ programming knowledge',
      'Passion for gaming',
      'Creative thinking',
      'Portfolio of game projects'
    ],
    offerings: [
      'Work on published games',
      'Creative work environment',
      'Game development training',
      'Monthly stipend',
      'Potential for permanent role'
    ],
    companyInfo: 'GameStudio Lanka develops mobile and PC games with millions of downloads worldwide.',
    postedDate: '2025-10-01',
    applicants: 127,
    alumni: [
      { name: 'Hasitha Gunasekara', position: 'Game Developer', company: 'GameStudio' }
    ]
  },
  {
    id: '12',
    company: 'AILabs Research',
    role: 'AI/ML Research Intern',
    jobTitle: 'AI Research Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'Hybrid',
    description: 'Conduct research in artificial intelligence and machine learning with cutting-edge technologies.',
    responsibilities: [
      'Research and implement ML algorithms',
      'Train and evaluate neural networks',
      'Work with NLP and computer vision',
      'Write research papers and documentation',
      'Present findings to research team'
    ],
    requirements: [
      'Strong mathematical background',
      'Python and ML framework experience',
      'Understanding of deep learning',
      'Research-oriented mindset',
      'Publication experience (preferred)'
    ],
    offerings: [
      'Cutting-edge AI research',
      'Access to GPUs and resources',
      'Research publication opportunities',
      'Competitive stipend',
      'Academic collaboration'
    ],
    companyInfo: 'AILabs Research is at the forefront of artificial intelligence research and applications.',
    postedDate: '2025-10-03',
    applicants: 83,
    alumni: [
      { name: 'Nuwan Dissanayake', position: 'ML Engineer', company: 'AILabs' }
    ]
  },
  {
    id: '13',
    company: 'MediaWorks Digital',
    role: 'Digital Marketing Intern',
    jobTitle: 'Digital Marketing Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Learn digital marketing strategies including SEO, social media, and content marketing.',
    responsibilities: [
      'Manage social media accounts',
      'Create marketing content and campaigns',
      'Analyze marketing metrics',
      'Assist with SEO optimization',
      'Support email marketing efforts'
    ],
    requirements: [
      'Interest in digital marketing',
      'Good writing and communication skills',
      'Basic understanding of social media',
      'Creative mindset',
      'Analytical thinking'
    ],
    offerings: [
      'Hands-on marketing experience',
      'Learn industry-standard tools',
      'Creative environment',
      'Networking opportunities',
      'Monthly allowance'
    ],
    companyInfo: 'MediaWorks Digital is a full-service digital marketing agency serving local and international clients.',
    postedDate: '2025-10-05',
    applicants: 95,
    alumni: []
  },
  {
    id: '14',
    company: 'RoboTech Engineering',
    role: 'Robotics Engineering Intern',
    jobTitle: 'Robotics Intern',
    location: 'Kandy, Central Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Work on robotics projects involving automation, sensors, and embedded systems.',
    responsibilities: [
      'Design and build robotic systems',
      'Program microcontrollers and sensors',
      'Test and calibrate robots',
      'Document engineering processes',
      'Assist in research and development'
    ],
    requirements: [
      'Electrical or mechanical engineering background',
      'Arduino or Raspberry Pi experience',
      'Programming skills (C++, Python)',
      'Problem-solving abilities',
      'Hands-on technical skills'
    ],
    offerings: [
      'Real robotics projects',
      'State-of-the-art lab facilities',
      'Engineering mentorship',
      'Stipend provided',
      'Innovation opportunities'
    ],
    companyInfo: 'RoboTech Engineering develops robotic solutions for industrial automation.',
    postedDate: '2025-10-07',
    applicants: 48,
    alumni: [
      { name: 'Lahiru Bandara', position: 'Robotics Engineer', company: 'RoboTech' }
    ]
  },
  {
    id: '15',
    company: 'HealthTech Plus',
    role: 'Healthcare IT Intern',
    jobTitle: 'Healthcare IT Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'Hybrid',
    description: 'Develop healthcare technology solutions including patient management and telemedicine systems.',
    responsibilities: [
      'Build healthcare applications',
      'Work with medical databases',
      'Ensure HIPAA compliance',
      'Support telemedicine platforms',
      'Create health analytics dashboards'
    ],
    requirements: [
      'Programming and database skills',
      'Interest in healthcare technology',
      'Understanding of data privacy',
      'Attention to detail',
      'Empathy and patient focus'
    ],
    offerings: [
      'Meaningful healthcare impact',
      'Hybrid work model',
      'Healthcare domain knowledge',
      'Competitive compensation',
      'Career in health tech'
    ],
    companyInfo: 'HealthTech Plus provides technology solutions for hospitals and healthcare providers.',
    postedDate: '2025-10-02',
    applicants: 62,
    alumni: []
  },
  {
    id: '16',
    company: 'LogiChain Solutions',
    role: 'Supply Chain Technology Intern',
    jobTitle: 'Supply Chain Tech Intern',
    location: 'Galle, Southern Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Optimize supply chain operations using technology and data analytics.',
    responsibilities: [
      'Develop supply chain tracking systems',
      'Analyze logistics data',
      'Create optimization algorithms',
      'Build inventory management tools',
      'Support warehouse automation'
    ],
    requirements: [
      'Programming and data analysis skills',
      'Interest in logistics and operations',
      'Problem-solving mindset',
      'Understanding of databases',
      'Good organizational skills'
    ],
    offerings: [
      'Real-world logistics experience',
      'Technology and business learning',
      'Monthly stipend',
      'Career advancement',
      'Industry exposure'
    ],
    companyInfo: 'LogiChain Solutions provides supply chain optimization services to global companies.',
    postedDate: '2025-10-08',
    applicants: 37,
    alumni: []
  },
  {
    id: '17',
    company: 'ContentCraft Agency',
    role: 'Content Writer Intern',
    jobTitle: 'Content Writer Intern',
    location: 'Remote',
    type: 'Internship',
    workMode: 'Remote',
    description: 'Write compelling content for websites, blogs, and marketing materials.',
    responsibilities: [
      'Write blog posts and articles',
      'Create website copy',
      'Research industry topics',
      'Edit and proofread content',
      'Optimize content for SEO'
    ],
    requirements: [
      'Excellent English writing skills',
      'Creativity and originality',
      'Research abilities',
      'Basic SEO knowledge',
      'Portfolio of writing samples'
    ],
    offerings: [
      'Remote work freedom',
      'Diverse writing opportunities',
      'Editorial mentorship',
      'Flexible hours',
      'Per-article compensation'
    ],
    companyInfo: 'ContentCraft Agency creates high-quality content for brands and businesses.',
    postedDate: '2025-10-04',
    applicants: 112,
    alumni: []
  },
  {
    id: '18',
    company: 'TravelTech Ventures',
    role: 'Travel Technology Intern',
    jobTitle: 'Travel Tech Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'Hybrid',
    description: 'Build technology solutions for the travel and tourism industry.',
    responsibilities: [
      'Develop travel booking systems',
      'Integrate with travel APIs',
      'Create itinerary planning tools',
      'Analyze travel data',
      'Support mobile travel apps'
    ],
    requirements: [
      'Web/mobile development skills',
      'Interest in travel industry',
      'API integration experience',
      'User-focused design thinking',
      'Good communication'
    ],
    offerings: [
      'Travel industry exposure',
      'Hybrid flexibility',
      'Innovative projects',
      'Stipend provided',
      'Travel perks'
    ],
    companyInfo: 'TravelTech Ventures creates digital solutions for travel agencies and tourists.',
    postedDate: '2025-10-09',
    applicants: 71,
    alumni: [
      { name: 'Sachini Amarasinghe', position: 'Product Manager', company: 'TravelTech' }
    ]
  },
  {
    id: '19',
    company: 'BlockChain Innovations',
    role: 'Blockchain Developer Intern',
    jobTitle: 'Blockchain Intern',
    location: 'Remote',
    type: 'Internship',
    workMode: 'Remote',
    description: 'Learn and develop blockchain applications and smart contracts.',
    responsibilities: [
      'Develop smart contracts',
      'Build decentralized applications (dApps)',
      'Work with Ethereum or other blockchains',
      'Test blockchain implementations',
      'Research blockchain use cases'
    ],
    requirements: [
      'Programming skills (Solidity, JavaScript)',
      'Understanding of blockchain concepts',
      'Interest in cryptocurrency',
      'Problem-solving abilities',
      'Self-learning attitude'
    ],
    offerings: [
      'Cutting-edge blockchain experience',
      'Remote work',
      'Cryptocurrency learning',
      'Competitive stipend',
      'Web3 career path'
    ],
    companyInfo: 'BlockChain Innovations develops blockchain solutions for enterprises.',
    postedDate: '2025-10-06',
    applicants: 86,
    alumni: []
  },
  {
    id: '20',
    company: 'QualityAssure Testing',
    role: 'QA Testing Intern',
    jobTitle: 'QA Tester Intern',
    location: 'Colombo, Western Province, Sri Lanka',
    type: 'Internship',
    workMode: 'On-site',
    description: 'Ensure software quality through manual and automated testing.',
    responsibilities: [
      'Perform manual testing of applications',
      'Write test cases and documentation',
      'Report and track bugs',
      'Learn automation testing',
      'Participate in quality reviews'
    ],
    requirements: [
      'Attention to detail',
      'Analytical mindset',
      'Basic programming knowledge',
      'Good documentation skills',
      'Team player'
    ],
    offerings: [
      'QA certification training',
      'Manual and automation testing',
      'Career in quality assurance',
      'Monthly stipend',
      'Permanent position potential'
    ],
    companyInfo: 'QualityAssure Testing provides software testing services to global clients.',
    postedDate: '2025-10-10',
    applicants: 53,
    alumni: [
      { name: 'Malinda Silva', position: 'QA Lead', company: 'QualityAssure' }
    ]
  }
];

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: dummyJobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};

// Get single job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = dummyJobs.find(job => job.id === id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message
    });
  }
};

// Submit job application
exports.submitApplication = async (req, res) => {
  try {
    const { jobId, fullName, email, phone, coverLetter, resumeUrl } = req.body;

    // Validate required fields
    if (!jobId || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create application document in Firestore
    const applicationData = {
      jobId,
      fullName,
      email,
      phone,
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: applicationRef.id,
        ...applicationData
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// Save/Unsave job
exports.toggleSaveJob = async (req, res) => {
  try {
    const { jobId, userId } = req.body;

    if (!jobId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing jobId or userId'
      });
    }

    // Check if job is already saved
    const savedJobRef = db.collection('savedJobs')
      .where('jobId', '==', jobId)
      .where('userId', '==', userId);

    const snapshot = await savedJobRef.get();

    if (!snapshot.empty) {
      // Job is saved, so unsave it
      const doc = snapshot.docs[0];
      await doc.ref.delete();

      return res.status(200).json({
        success: true,
        message: 'Job unsaved successfully',
        isSaved: false
      });
    } else {
      // Job is not saved, so save it
      await db.collection('savedJobs').add({
        jobId,
        userId,
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({
        success: true,
        message: 'Job saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Error toggling save job:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving/unsaving job',
      error: error.message
    });
  }
};

// Get saved jobs for a user
exports.getSavedJobs = async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('savedJobs')
      .where('userId', '==', userId)
      .get();

    const savedJobIds = snapshot.docs.map(doc => doc.data().jobId);
    const savedJobs = dummyJobs.filter(job => savedJobIds.includes(job.id));

    res.status(200).json({
      success: true,
      data: savedJobs
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs',
      error: error.message
    });
  }
};

// Check if job is saved
exports.checkIfJobSaved = async (req, res) => {
  try {
    const { jobId, userId } = req.query;

    if (!jobId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing jobId or userId'
      });
    }

    const snapshot = await db.collection('savedJobs')
      .where('jobId', '==', jobId)
      .where('userId', '==', userId)
      .get();

    res.status(200).json({
      success: true,
      isSaved: !snapshot.empty
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking saved status',
      error: error.message
    });
  }
};