import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

interface LocalDbData {
  users: any[];
  resumes: any[];
  atsResults: any[];
  roadmaps: any[];
  chatSessions?: any[];
  supportTickets?: any[];
  systemErrorLogs?: any[];
}

function readDb(): LocalDbData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = { users: [], resumes: [], atsResults: [], roadmaps: [], chatSessions: [], supportTickets: [], systemErrorLogs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(content || '{"users":[],"resumes":[],"atsResults":[],"roadmaps":[],"chatSessions":[],"supportTickets":[],"systemErrorLogs":[]}');
    if (!parsed.chatSessions) parsed.chatSessions = [];
    if (!parsed.supportTickets) parsed.supportTickets = [];
    if (!parsed.systemErrorLogs) parsed.systemErrorLogs = [];
    return parsed;
  } catch (err) {
    console.error("[localDb] Error reading file:", err);
    return { users: [], resumes: [], atsResults: [], roadmaps: [], chatSessions: [], supportTickets: [], systemErrorLogs: [] };
  }
}

function writeDb(data: LocalDbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("[localDb] Error writing file:", err);
  }
}

export const localDb = {
  // Users
  getAllUsers() {
    const db = readDb();
    return db.users ? [...db.users] : [];
  },

  deleteUser(uid: string) {
    const db = readDb();
    db.users = (db.users || []).filter(u => u.uid !== uid);
    db.resumes = (db.resumes || []).filter(r => r.userId !== uid);
    db.atsResults = (db.atsResults || []).filter(a => a.userId !== uid);
    db.roadmaps = (db.roadmaps || []).filter(rm => rm.userId !== uid);
    db.chatSessions = (db.chatSessions || []).filter(cs => cs.userId !== uid);
    writeDb(db);
  },

  getUserByEmail(email: string) {
    const db = readDb();
    const found = db.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    return found ? { ...found } : null;
  },
  
  getUserByUid(uid: string) {
    const db = readDb();
    const found = db.users.find(u => u.uid === uid);
    return found ? { ...found } : null;
  },
  
  saveUser(user: any) {
    const db = readDb();
    const uid = user.uid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const idx = db.users.findIndex(u => u.uid === uid);
    
    const existing = idx >= 0 ? db.users[idx] : {};
    
    const preferences = {
      fullname: user.preferences?.fullname || user.displayName || existing.preferences?.fullname || '',
      targetRole: user.preferences?.targetRole || existing.preferences?.targetRole || 'Senior Full Stack Engineer',
      careerStatus: user.preferences?.careerStatus || existing.preferences?.careerStatus || 'Working',
      experienceYears: user.preferences?.experienceYears || existing.preferences?.experienceYears || '',
      preferredWorkStyle: user.preferences?.preferredWorkStyle || existing.preferences?.preferredWorkStyle || '',
      targetLocation: user.preferences?.targetLocation || existing.preferences?.targetLocation || '',
      expectedSalary: user.preferences?.expectedSalary || existing.preferences?.expectedSalary || '',
      linkedinUrl: user.preferences?.linkedinUrl || existing.preferences?.linkedinUrl || '',
      githubUrl: user.preferences?.githubUrl || existing.preferences?.githubUrl || '',
      portfolioUrl: user.preferences?.portfolioUrl || existing.preferences?.portfolioUrl || '',
      bio: user.preferences?.bio || existing.preferences?.bio || '',
      academicFoundation: user.preferences?.academicFoundation || existing.preferences?.academicFoundation || []
    };

    const serialized = {
      ...existing,
      uid,
      email: user.email || existing.email || `temp_${uid}@careernav.ai`,
      password: user.password || existing.password || null,
      displayName: user.displayName || existing.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL !== undefined ? user.photoURL : (existing.photoURL || ''),
      xpPoints: user.xpPoints !== undefined ? user.xpPoints : (existing.xpPoints || 1250),
      streak: user.streak !== undefined ? user.streak : (existing.streak || 7),
      plan: user.plan || existing.plan || 'FREE',
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : (existing.emailVerified ?? false),
      otp: user.otp !== undefined ? user.otp : (existing.otp || null),
      otpExpires: user.otpExpires !== undefined ? user.otpExpires : (existing.otpExpires || null),
      usage: user.usage || existing.usage || { analysisCount: 0, windowStartDate: new Date().toISOString() },
      preferences,
      createdAt: user.createdAt || existing.createdAt || new Date().toISOString()
    };

    if (idx >= 0) {
      db.users[idx] = serialized;
    } else {
      db.users.push(serialized);
    }
    
    writeDb(db);
    return serialized;
  },

  // Resumes
  getResumes(userId: string) {
    const db = readDb();
    return db.resumes
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  getLatestResume(userId: string) {
    const resumes = this.getResumes(userId);
    return resumes[0] || null;
  },
  
  saveResume(resume: any) {
    const db = readDb();
    const serialized = {
      _id: resume._id || resume.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: resume.userId,
      text: resume.text,
      filename: resume.filename,
      targetRole: resume.targetRole || 'Full Stack Developer',
      parsedData: resume.parsedData || {},
      createdAt: resume.createdAt || new Date().toISOString()
    };
    db.resumes.push(serialized);
    writeDb(db);
    return serialized;
  },
  
  deleteResume(userId: string, id: string) {
    const db = readDb();
    db.resumes = db.resumes.filter(r => !((r._id === id || r.id === id) && r.userId === userId));
    db.atsResults = db.atsResults.filter(a => !(a.resumeId === id && a.userId === userId));
    db.roadmaps = db.roadmaps.filter(r => !(r.resumeId === id && r.userId === userId));
    writeDb(db);
  },
  
  deleteAllResumes(userId: string) {
    const db = readDb();
    db.resumes = db.resumes.filter(r => r.userId !== userId);
    db.atsResults = db.atsResults.filter(a => a.userId !== userId);
    db.roadmaps = db.roadmaps.filter(r => r.userId !== userId);
    writeDb(db);
  },

  cleanupOldResumes(cutoffDate: Date) {
    const db = readDb();
    const cutoffMs = cutoffDate.getTime();
    const expiredIds = new Set<string>();
    
    db.resumes = db.resumes.filter(r => {
      const ms = new Date(r.createdAt || 0).getTime();
      if (ms < cutoffMs) {
        expiredIds.add(r._id || r.id);
        return false;
      }
      return true;
    });

    if (expiredIds.size > 0) {
      db.atsResults = db.atsResults.filter(a => !expiredIds.has(a.resumeId));
      db.roadmaps = db.roadmaps.filter(rd => !expiredIds.has(rd.resumeId));
      writeDb(db);
    }
  },

  getAllResumes() {
    const db = readDb();
    return [...(db.resumes || [])].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  migrateUserData(tempUid: string, uid: string) {
    if (!tempUid || !uid || tempUid === uid) return;
    const db = readDb();
    let updated = false;
    db.resumes.forEach(r => {
      if (r.userId === tempUid) {
        r.userId = uid;
        updated = true;
      }
    });
    db.atsResults.forEach(a => {
      if (a.userId === tempUid) {
        a.userId = uid;
        updated = true;
      }
    });
    db.roadmaps.forEach(rd => {
      if (rd.userId === tempUid) {
        rd.userId = uid;
        updated = true;
      }
    });
    if (updated) {
      writeDb(db);
    }
  },

  // ATS Results
  getLatestAtsResult(userId: string, resumeId?: string) {
    const db = readDb();
    const filtered = db.atsResults.filter(a => {
      if (resumeId) {
        return a.userId === userId && a.resumeId === resumeId;
      }
      return a.userId === userId;
    });
    const sorted = filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return sorted[0] || null;
  },
  
  saveAtsResult(atsResult: any) {
    const db = readDb();
    const finalFixes = atsResult.top_3_fixes || atsResult.priority_fixes || [];
    const serialized = {
      _id: atsResult._id || `ats_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: atsResult.userId,
      resumeId: atsResult.resumeId,
      score: atsResult.score,
      market_match: atsResult.market_match || 0,
      label: atsResult.label,
      color: atsResult.color,
      breakdown: atsResult.breakdown || [],
      top_3_fixes: Array.isArray(finalFixes) ? (typeof finalFixes[0] === 'object' ? finalFixes.map((f: any) => f.fix || f.problem) : finalFixes) : [],
      createdAt: atsResult.createdAt || new Date().toISOString()
    };
    db.atsResults.push(serialized);
    writeDb(db);
    return serialized;
  },

  // Roadmaps
  getLatestRoadmap(userId: string, resumeId?: string) {
    const db = readDb();
    const filtered = db.roadmaps.filter(r => {
      if (resumeId) {
        return r.userId === userId && r.resumeId === resumeId;
      }
      return r.userId === userId;
    });
    const sorted = filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return sorted[0] || null;
  },
  
  saveRoadmap(roadmap: any) {
    const db = readDb();
    const serialized = {
      _id: roadmap._id || `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: roadmap.userId,
      resumeId: roadmap.resumeId,
      title: roadmap.title,
      sprints: roadmap.sprints || [],
      salary_projection: roadmap.salary_projection || {},
      skill_gap_report: roadmap.skill_gap_report || {},
      marketAnalysis: roadmap.marketAnalysis || {},
      createdAt: roadmap.createdAt || new Date().toISOString()
    };
    db.roadmaps.push(serialized);
    writeDb(db);
    return serialized;
  },

  updateRoadmapLearningResources(userId: string, resumeId: string, resources: any, expertTip?: string) {
    const db = readDb();
    const target = db.roadmaps.find(r => (resumeId && r.resumeId === resumeId) || (userId && r.userId === userId));
    if (target) {
      target.learning_resources = resources;
      if (expertTip) target.expertTip = expertTip;
      writeDb(db);
      return target;
    }
    return null;
  },

  // Chat Sessions
  getChatSessions(userId: string) {
    const db = readDb();
    const sessions = (db.chatSessions || []).filter(cs => cs.userId === userId);
    return sessions.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  },

  getChatSession(userId: string, sessionId: string) {
    const db = readDb();
    return (db.chatSessions || []).find(cs => cs.userId === userId && cs._id === sessionId) || null;
  },

  createChatSession(userId: string, title?: string, model?: string) {
    const db = readDb();
    const serialized = {
      _id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      title: title || 'New Career Discussion',
      model: model || 'gemini-3.7-flash',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!db.chatSessions) db.chatSessions = [];
    db.chatSessions.push(serialized);
    writeDb(db);
    return serialized;
  },

  updateChatSession(userId: string, sessionId: string, updateFn: (session: any) => void) {
    const db = readDb();
    if (!db.chatSessions) db.chatSessions = [];
    const session = db.chatSessions.find(cs => cs.userId === userId && cs._id === sessionId);
    if (!session) return null;
    updateFn(session);
    session.updatedAt = new Date().toISOString();
    writeDb(db);
    return session;
  },

  deleteChatSession(userId: string, sessionId: string) {
    const db = readDb();
    if (!db.chatSessions) db.chatSessions = [];
    db.chatSessions = db.chatSessions.filter(cs => !(cs.userId === userId && cs._id === sessionId));
    writeDb(db);
    return true;
  },

  // Support Tickets
  saveTicket(ticket: any) {
    const db = readDb();
    if (!db.supportTickets) db.supportTickets = [];
    const existingIndex = db.supportTickets.findIndex(t => t.ticketId === ticket.ticketId);
    if (existingIndex >= 0) {
      db.supportTickets[existingIndex] = { ...db.supportTickets[existingIndex], ...ticket, updatedAt: new Date().toISOString() };
    } else {
      db.supportTickets.unshift({
        ...ticket,
        createdAt: ticket.createdAt || new Date().toISOString(),
        updatedAt: ticket.updatedAt || new Date().toISOString()
      });
    }
    writeDb(db);
    return ticket;
  },

  getAllTickets() {
    const db = readDb();
    return db.supportTickets ? [...db.supportTickets] : [];
  },

  getTicketsByEmailOrUser(emailOrUid: string) {
    const db = readDb();
    const query = (emailOrUid || '').toLowerCase().trim();
    if (!query) return [];
    return (db.supportTickets || []).filter(t => 
      (t.userEmail && t.userEmail.toLowerCase() === query) ||
      (t.userId && t.userId === query)
    );
  },

  getTicketById(ticketId: string) {
    const db = readDb();
    return (db.supportTickets || []).find(t => t.ticketId?.toLowerCase() === ticketId?.toLowerCase()) || null;
  },

  updateTicket(ticketId: string, updateData: any) {
    const db = readDb();
    if (!db.supportTickets) db.supportTickets = [];
    const index = db.supportTickets.findIndex(t => t.ticketId?.toLowerCase() === ticketId?.toLowerCase());
    if (index >= 0) {
      db.supportTickets[index] = {
        ...db.supportTickets[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      return db.supportTickets[index];
    }
    return null;
  },

  // System Error Telemetry Logs
  saveSystemErrorLog(log: any) {
    const db = readDb();
    if (!db.systemErrorLogs) db.systemErrorLogs = [];
    const entry = {
      ...log,
      resolved: log.resolved ?? false,
      createdAt: log.createdAt || new Date().toISOString()
    };
    db.systemErrorLogs.unshift(entry);
    // Keep max 500 in local fallback file
    if (db.systemErrorLogs.length > 500) {
      db.systemErrorLogs = db.systemErrorLogs.slice(0, 500);
    }
    writeDb(db);
    return entry;
  },

  getSystemErrorLogs(limit = 100) {
    const db = readDb();
    const logs = db.systemErrorLogs || [];
    return logs.slice(0, limit);
  },

  resolveSystemErrorLog(errorId: string) {
    const db = readDb();
    if (!db.systemErrorLogs) return null;
    const item = db.systemErrorLogs.find(l => l.errorId === errorId);
    if (item) {
      item.resolved = !item.resolved;
      writeDb(db);
      return item;
    }
    return null;
  },

  clearSystemErrorLogs(onlyResolved = true) {
    const db = readDb();
    if (!db.systemErrorLogs) return 0;
    const initialCount = db.systemErrorLogs.length;
    if (onlyResolved) {
      db.systemErrorLogs = db.systemErrorLogs.filter(l => !l.resolved);
    } else {
      db.systemErrorLogs = [];
    }
    writeDb(db);
    return initialCount - db.systemErrorLogs.length;
  }
};
