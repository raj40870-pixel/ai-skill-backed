import mongoose from 'mongoose';

// User and Career Preferences Schema
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // Hashed password
  displayName: { type: String, default: 'User' },
  photoURL: { type: String, default: '' },
  xpPoints: { type: Number, default: 1250 },
  streak: { type: Number, default: 7 },
  plan: { type: String, default: 'FREE' },
  usage: {
    analysisCount: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    tokenLimit: { type: Number, default: 50000 }, // Default free limit
    windowStartDate: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String }, // Hashed OTP
  otpExpires: { type: Date },
  otpResendCount: { type: Number, default: 0 },
  preferences: {
    fullname: { type: String, default: '' },
    targetRole: { type: String, default: '' },
    careerStatus: { type: String, default: '' },
    experienceYears: { type: String, default: '' },
    preferredWorkStyle: { type: String, default: '' },
    targetLocation: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    academicFoundation: { type: [mongoose.Schema.Types.Mixed], default: [] }
  }
});

// Resume Schema
const ResumeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  filename: { type: String, required: true },
  contentHash: { type: String, index: true },
  targetRole: { type: String, default: 'Full Stack Developer' },
  parsedData: { type: mongoose.Schema.Types.Mixed, default: {} },
  expiryWarned: { type: Boolean, default: false },
  expiryWarnedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// ATS Result Schema
const AtsResultSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  resumeId: { type: String, required: true },
  score: { type: Number, required: true },
  market_match: { type: Number, default: 0 },
  label: { type: String, default: 'Moderate Traction' },
  color: { type: String, default: 'amber' },
  breakdown: { type: [mongoose.Schema.Types.Mixed], default: [] },
  top_3_fixes: { type: [String], default: [] },
  priority_fixes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const RoadmapSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  resumeId: { type: String, required: true },
  title: { type: String },
  sprints: { type: [mongoose.Schema.Types.Mixed], default: [] },
  salary_projection: { type: mongoose.Schema.Types.Mixed, default: {} },
  skill_gap_report: { type: mongoose.Schema.Types.Mixed, default: {} },
  marketAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  learning_resources: { type: [mongoose.Schema.Types.Mixed], default: [] },
  expertTip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ChatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Career Discussion' },
  messages: { 
    type: [{
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      tokens: { type: Number, default: 0 },
      attachments: { type: Array, default: [] }
    }], 
    default: [] 
  },
  model: { type: String, default: 'gemini-3.7-flash' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SupportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: '', index: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  userName: { type: String, default: 'User' },
  category: { type: String, default: 'Bug / Technical Error' },
  priority: { type: String, default: 'Medium' }, // Low, Medium, High, Critical
  title: { type: String, required: true },
  description: { type: String, required: true },
  pageUrl: { type: String, default: '' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
  adminReply: { type: String, default: '' },
  adminRepliedAt: { type: Date },
  adminRepliedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Automatic Crash & Error Telemetry Schema
const SystemErrorLogSchema = new mongoose.Schema({
  errorId: { type: String, required: true, unique: true, index: true },
  type: { 
    type: String, 
    enum: ['API_FAILURE', 'GEMINI_QUOTA', 'FRONTEND_CRASH', 'NETWORK_TIMEOUT'], 
    default: 'API_FAILURE',
    index: true 
  },
  message: { type: String, required: true },
  pageUrl: { type: String, default: '/' },
  component: { type: String, default: 'General' },
  userId: { type: String, default: '' },
  browserInfo: { type: String, default: '' },
  severity: { 
    type: String, 
    enum: ['CRITICAL', 'WARNING', 'INFO'], 
    default: 'WARNING',
    index: true 
  },
  resolved: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const User = mongoose.model('User', UserSchema);
export const Resume = mongoose.model('Resume', ResumeSchema);
export const AtsResult = mongoose.model('AtsResult', AtsResultSchema);
export const Roadmap = mongoose.model('Roadmap', RoadmapSchema);
export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
export const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);
export const SystemErrorLog = mongoose.model('SystemErrorLog', SystemErrorLogSchema);
