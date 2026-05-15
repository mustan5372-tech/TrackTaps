import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Scroll Reveal Hook
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Blur Reveal Text Component (Optimized)
const BlurRevealText = React.memo(({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(8px)', y: 20 }}
      animate={isVisible ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      style={{ willChange: 'transform, filter, opacity' }}
    >
      {children}
    </motion.div>
  );
});

// Premium Founders & Core Team Card Component (Optimized)
const FounderCard = React.memo(({ member, index, onSelect }) => {
  const [ref, isVisible] = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => onSelect(member)}
      className="founder-card"
      style={{
        background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(168, 85, 247, 0.08) 100%)',
        border: '1.5px solid var(--primary-glow)',
        borderRadius: '24px',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        backdropFilter: window.innerWidth < 768 ? 'none' : 'blur(8px)',
        transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
        willChange: 'transform'
      }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Spotlight effect (Desktop Only) */}
      {isHovered && window.innerWidth >= 768 && (
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            borderRadius: '50%',
            left: mousePosition.x - 125,
            top: mousePosition.y - 125,
            pointerEvents: 'none',
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />
      )}

      {/* Avatar with premium glow */}
      <motion.div
        animate={isHovered ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
        style={{
          width: '90px',
          height: '90px',
          margin: '0 auto 24px',
          background: member.image ? 'none' : 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: '800',
          color: 'var(--text-main)',
          boxShadow: isHovered 
            ? '0 0 40px rgba(139, 92, 246, 0.6)' 
            : '0 0 20px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          border: '2px solid var(--primary-glow)'
        }}
      >
        {member.image ? (
          <img 
            src={member.image} 
            alt={member.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : member.initials}
      </motion.div>

      {/* Role Badge */}
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: 'var(--primary-light)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '10px',
          fontWeight: '700',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          position: 'relative',
          zIndex: 1
        }}
      >
        {member.role}
      </div>

      <h3 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: '800', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        {member.name}
      </h3>

      <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        {member.tagline || member.description.substring(0, 80) + '...'}
      </p>

      <div style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Tap to view profile →
      </div>
    </motion.div>
  );
});

// Detailed Profile Modal Component
const ProfileModal = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: window.innerWidth < 768 ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: window.innerWidth < 768 ? '0' : '20px'
      }}
    >
      <motion.div
        initial={window.innerWidth < 768 ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
        animate={window.innerWidth < 768 ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={window.innerWidth < 768 ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: window.innerWidth < 768 ? '32px 32px 0 0' : '32px',
          padding: '40px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--text-main)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >✕</button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 24px',
            background: member.image ? 'none' : 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
            overflow: 'hidden',
            border: '3px solid var(--primary-glow)'
          }}>
            {member.image ? (
              <img 
                src={member.image} 
                alt={member.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : member.initials}
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>{member.name}</h2>
          <div style={{ color: 'var(--primary-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px' }}>{member.role}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section>
            <h4 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>The Vision</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '16px', lineHeight: '1.8' }}>{member.description}</p>
          </section>

          {member.passions && (
            <section>
              <h4 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>Passions & Focus</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {member.passions.map((p, i) => (
                  <span key={i} style={{ padding: '6px 14px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '100px', fontSize: '13px', color: 'var(--primary-light)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </section>
          )}

          {member.quote && (
            <div style={{ padding: '24px', background: 'rgba(139, 92, 246, 0.05)', borderLeft: '4px solid var(--primary)', fontStyle: 'italic', color: 'var(--text-main)', fontSize: '18px', lineHeight: '1.6' }}>
              "{member.quote}"
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
            {member.github && (
              <motion.a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                GitHub
              </motion.a>
            )}
            {member.email && (
              <motion.a
                href={`mailto:${member.email}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email
              </motion.a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Premium Roadmap Phase Component (Optimized)
const RoadmapPhase = React.memo(({ phase, items, index }) => {
  const [ref, isVisible] = useScrollReveal();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="roadmap-phase"
      style={{
        position: 'relative',
        paddingLeft: index % 2 === 0 ? '0' : '50px',
        paddingRight: index % 2 === 0 ? '50px' : '0'
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="roadmap-timeline" style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '2px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.4) 0%, var(--primary-glow) 100%)',
        transform: 'translateX(-50%)',
        zIndex: 0
      }} />

      <div className="roadmap-dot" style={{
        position: 'absolute',
        left: '50%',
        top: '24px',
        width: '16px',
        height: '16px',
        background: 'var(--primary)',
        borderRadius: '50%',
        transform: 'translateX(-50%)',
        boxShadow: '0 0 20px var(--primary-glow)',
        zIndex: 1
      }} />

      <motion.div
        whileHover={{ y: -5 }}
        className="roadmap-phase-card"
        style={{
          background: 'var(--surface-glass)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          backdropFilter: window.innerWidth < 768 ? 'none' : 'blur(8px)',
          cursor: 'default'
        }}
      >
        <h4 style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>{phase}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '14px' }}>
              <div style={{ width: '6px', height: '6px', background: 'var(--primary-light)', borderRadius: '50%' }} />
              {item}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
});

function About() {
  const [ref, isVisible] = useScrollReveal();
  const [selectedMember, setSelectedMember] = useState(null);

  const TEAM_MEMBERS = useMemo(() => [
    {
      name: "Mustansir Sanawadwala",
      role: "Lead Developer",
      initials: "MS",
      tagline: "Visionary architect building the future of intelligent student tools.",
      description: "Mustansir is an AU EV student at Medicaps University with a passion for building high-performance, mobile-first SaaS products. As the visionary behind TrackTaps, he focuses on transforming complex academic data into actionable insights for students. His technical philosophy centers on extreme responsiveness, elegant UI, and AI-driven automation. Before TrackTaps, he built several student productivity tools and experimental tech projects focused on simplifying academic workflows.",
      passions: ["SaaS Architecture", "Mobile UX", "AI Automation", "Student Tech"],
      quote: "We didn't just want another attendance tracker. We wanted to build a smarter academic ecosystem for students.",
      github: "https://github.com/mustan5372-tech",
      email: "tracktaps@gmail.com",
      image: "/mustansir.jpg",
      projects: ["TrackTaps Plus", "AI Engine", "Native Mobile Bridge"]
    },
    {
      name: "Pranav Gohel",
      role: "CMO",
      initials: "PG",
      tagline: "Growth strategist focused on community and scale.",
      description: "Pranav is an AU EV student at Medicaps University leading the operational and marketing direction for TrackTaps. He is obsessed with community-driven growth and ensuring that TrackTaps reaches every student who needs it. His focus is on scaling the platform while maintaining the authentic, student-first identity that makes TrackTaps unique.",
      passions: ["Strategic Growth", "Community Building", "Brand Narrative"],
      quote: "Growth isn't just about numbers; it's about the impact we have on a student's daily life.",
      projects: ["TrackTaps Launch", "Community Outreach"]
    },
    {
      name: "Purandar Yadav",
      role: "Marketing Executive",
      initials: "PY",
      tagline: "Engagement specialist bridging the gap between product and user.",
      description: "Purandar is an AU EV student at Medicaps University focused on user engagement and the expansion of the TrackTaps ecosystem. He works closely with the student community to understand their pain points and translate them into product features, ensuring the platform remains relevant and indispensable.",
      passions: ["User Engagement", "Market Research", "Digital Outreach"],
      quote: "Listening to our users is our greatest competitive advantage.",
      projects: ["User Feedback Loop", "Regional Expansion"]
    }
  ], []);

  const roadmapPhases = [
    {
      phase: 'PHASE 1 — FOUNDATION',
      items: ['Smart Attendance Tracking', 'Timetable System', 'Analytics Dashboard']
    },
    {
      phase: 'PHASE 2 — AI & AUTOMATION',
      items: ['AI Assistant', 'Attendance Insights', 'POD.ai Integration']
    },
    {
      phase: 'PHASE 3 — PLATFORM EXPANSION',
      items: ['Android APK', 'PWA Support', 'Cross-device Sync']
    },
    {
      phase: 'PHASE 4 — FUTURE ECOSYSTEM',
      items: ['AI Study Planner', 'Smart Notifications', 'Academic Productivity Ecosystem']
    }
  ];

  return (
    <div className="about-view" style={{ position: 'relative', overflow: 'visible', width: '100%' }}>
      <AnimatePresence>
        {selectedMember && (
          <ProfileModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
          />
        )}
      </AnimatePresence>

      {/* Animated Background (Optimized) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, 15, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            width: '40vw',
            height: '40vw',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            willChange: 'transform'
          }}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-container { padding: 40px 0 120px 0 !important; }
          .about-hero-cinematic { padding: 0 20px !important; margin-bottom: 60px !important; }
          .about-hero-cinematic h1 { font-size: 32px !important; }
          .about-section { padding: 0 20px !important; margin-bottom: 80px !important; }
          .about-section h2 { font-size: 28px !important; margin-bottom: 40px !important; }
          .features-grid, .founders-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .roadmap-phase { padding: 0 !important; margin-bottom: 20px !important; }
          .roadmap-timeline, .roadmap-dot { left: 20px !important; }
        }
      `}</style>

      <div className="about-container" style={{ position: 'relative', zIndex: 1, padding: '60px 40px' }}>
        {/* HERO SECTION - REFACTORED FOR STABLE CENTERING */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ 
            marginBottom: '100px', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          {/* Top Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(139, 92, 246, 0.1)', 
              border: '1px solid var(--primary-glow)', 
              color: 'var(--primary-light)', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              marginBottom: '32px' 
            }}
          >
            <span style={{ fontSize: '14px' }}>✨</span> Premium Student Ecosystem
          </motion.div>

          {/* Main Heading */}
          <h1 style={{ 
            fontSize: 'clamp(32px, 8vw, 64px)', 
            fontWeight: '900', 
            color: 'var(--text-main)', 
            lineHeight: '1.1', 
            marginBottom: '24px',
            maxWidth: '900px'
          }}>
            Academic Intelligence <br/> 
            <span style={{ 
              background: 'linear-gradient(135deg, var(--primary-light) 0%, #d946ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Redefined.
            </span>
          </h1>

          {/* Description Paragraph */}
          <p style={{ 
            fontSize: '18px', 
            color: 'var(--text-dim)', 
            lineHeight: '1.7', 
            maxWidth: '650px', 
            marginBottom: '40px',
            fontWeight: '400'
          }}>
            TrackTaps is building the next generation of academic tools, starting with smart attendance tracking and AI-driven student insights.
          </p>

          {/* Call to Action */}
          <Link 
            to="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '16px 36px', 
              borderRadius: '16px', 
              textDecoration: 'none', 
              fontWeight: '800', 
              fontSize: '16px', 
              boxShadow: '0 15px 30px var(--primary-glow)',
              transition: 'all 0.3s ease'
            }}
          >
            Explore Platform
            <span style={{ fontSize: '18px' }}>→</span>
          </Link>
        </motion.section>

        {/* WHY TRACKTAPS SECTION */}
        <motion.section ref={ref} initial={{ opacity: 0 }} animate={isVisible ? { opacity: 1 } : {}} className="about-section" style={{ marginBottom: '120px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', textAlign: 'center', marginBottom: '60px', color: 'var(--text-main)' }}>Why TrackTaps?</h2>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🎯', title: 'Precision Tracking', desc: 'Sync directly with Pod.ai for 100% accurate attendance records.' },
              { icon: '🤖', title: 'AI Assistant', desc: 'Get smart predictions on how many classes you can skip safely.' },
              { icon: '📊', title: 'Life Optimization', desc: 'Simplify your academic schedule with our automated timetable system.' }
            ].map((f, idx) => (
              <div key={idx} style={{ background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* TEAM SECTION */}
        <motion.section className="about-section" style={{ marginBottom: '120px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', textAlign: 'center', marginBottom: '16px', color: 'var(--text-main)' }}>Founders & Core Team</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-dim)', textAlign: 'center', maxWidth: '600px', margin: '0 auto 60px' }}>Built by students from Medicaps University, focused on redefining academic productivity.</p>
          <div className="founders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>
            {TEAM_MEMBERS.map((m, idx) => (
              <FounderCard key={idx} member={m} index={idx} onSelect={setSelectedMember} />
            ))}
          </div>
        </motion.section>

        {/* ROADMAP SECTION */}
        <motion.section className="about-section" style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '800', textAlign: 'center', marginBottom: '60px', color: 'var(--text-main)' }}>The Roadmap</h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {roadmapPhases.map((p, idx) => (
              <RoadmapPhase key={idx} phase={p.phase} items={p.items} index={idx} />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default About;
