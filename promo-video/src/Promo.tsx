import {
	AbsoluteFill,
	interpolate,
	Sequence,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Video,
	Audio,
	staticFile,
} from 'remotion';

// --- Assets ---
const SCREEN_RECORDING = staticFile('recording.mp4');
const BG_MUSIC = staticFile('music.mp3'); 

// --- Components ---

const LaptopMockup = ({ src }: { src: string }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entrance = spring({
		frame,
		fps,
		config: { damping: 12 },
	});

	// Dynamic zoom effect
	const zoom = interpolate(frame, [0, 150, 240], [1, 1.2, 1.1]);

	return (
		<div style={{
			position: 'relative',
			width: '1000px',
			height: '620px',
			background: '#1e293b',
			borderRadius: '24px',
			border: '10px solid #475569',
			boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 40px rgba(139, 92, 246, 0.2)',
			overflow: 'hidden',
			transform: `scale(${entrance * zoom}) translateY(${interpolate(entrance, [0, 1], [100, 0])}px)`,
		}}>
			<div style={{
				position: 'absolute',
				top: 0,
				width: '100%',
				height: '28px',
				background: '#334155',
				display: 'flex',
				alignItems: 'center',
				padding: '0 12px',
				gap: '8px',
				zIndex: 5
			}}>
				<div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
				<div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
				<div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
			</div>
			<div style={{ marginTop: '28px', height: 'calc(100% - 28px)' }}>
				<Video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
			</div>
		</div>
	);
};

const CalloutText = ({ text, delay, color = '#8b5cf6' }: { text: string; delay: number; color?: string }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const progress = spring({
		frame: frame - delay,
		fps,
		config: { stiffness: 100 },
	});

	if (frame < delay) return null;

	return (
		<div style={{
			fontSize: '48px',
			fontWeight: 900,
			color: 'white',
			textTransform: 'uppercase',
			letterSpacing: '4px',
			textShadow: `0 0 20px ${color}`,
			opacity: interpolate(progress, [0, 1], [0, 1]),
			transform: `translateX(${interpolate(progress, [0, 1], [-50, 0])}px)`,
			background: `linear-gradient(90deg, ${color}44 0%, transparent 100%)`,
			padding: '10px 40px',
			borderRadius: '0 50px 50px 0',
			borderLeft: `6px solid ${color}`,
			marginBottom: '20px'
		}}>
			{text}
		</div>
	);
};

const CinematicText = ({ text, subtitle }: { text: string; subtitle?: string }) => {
	const frame = useCurrentFrame();
	const words = text.split(' ');

	return (
		<div style={{ textAlign: 'center' }}>
			<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
				{words.map((word, i) => {
					const opacity = interpolate(frame - (i * 4), [0, 10], [0, 1], { extrapolateLeft: 'clamp' });
					return (
						<span key={i} style={{ 
							fontSize: '110px', 
							fontWeight: 900, 
							color: 'white', 
							opacity,
							letterSpacing: '-2px',
							textShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
							transform: `scale(${interpolate(opacity, [0, 1], [0.8, 1])})`
						}}>
							{word}
						</span>
					);
				})}
			</div>
			{subtitle && (
				<div style={{ 
					color: '#8b5cf6', 
					fontSize: '36px', 
					fontWeight: 600, 
					marginTop: '20px',
					opacity: interpolate(frame, [40, 60], [0, 1]),
					letterSpacing: '8px',
					textTransform: 'uppercase'
				}}>
					{subtitle}
				</div>
			)}
		</div>
	);
};

export const TrackTapsPromo = () => {
	const { fps } = useVideoConfig();

	return (
		<AbsoluteFill style={{ 
			backgroundColor: '#020617', 
			fontFamily: 'Outfit, sans-serif',
			overflow: 'hidden'
		}}>
			<Audio src={BG_MUSIC} volume={0.4} />

			{/* Scene 1: Cinematic Intro (0-4s) */}
			<Sequence durationInFrames={fps * 4}>
				<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
					<CinematicText text="TRACK TAPS" subtitle="EVOLVED TRACKING" />
				</AbsoluteFill>
			</Sequence>

			{/* Scene 2: Live UI Reveal (4-14s) */}
			<Sequence from={fps * 4} durationInFrames={fps * 10}>
				<AbsoluteFill style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 80px' }}>
					{/* Left Side: Callouts */}
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
						<CalloutText text="SMART SYNC" delay={fps * 0.5} />
						<CalloutText text="AI PREDICTIONS" delay={fps * 2.5} color="#10b981" />
						<CalloutText text="BUNK MASTER" delay={fps * 4.5} color="#f59e0b" />
						<CalloutText text="OLED THEMES" delay={fps * 6.5} color="#ec4899" />
					</div>

					{/* Right Side: Laptop Showcase */}
					<div style={{ flex: 1.5, display: 'flex', justifyContent: 'center' }}>
						<LaptopMockup src={SCREEN_RECORDING} />
					</div>
				</AbsoluteFill>
			</Sequence>

			{/* Scene 3: Feature Montage (14-17s) */}
			<Sequence from={fps * 14} durationInFrames={fps * 3}>
				<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, #2e1065 0%, #020617 100%)' }}>
					<div style={{ fontSize: '140px', marginBottom: '40px' }}>⚡</div>
					<CinematicText text="LIGHTNING FAST" />
				</AbsoluteFill>
			</Sequence>

			{/* Scene 4: Outro (17-20s) */}
			<Sequence from={fps * 17} durationInFrames={fps * 3}>
				<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
					<CinematicText text="JOIN THE BEST" subtitle="TRACKTAPS.ONLINE" />
					<div style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						background: 'linear-gradient(transparent, rgba(139, 92, 246, 0.1))',
						pointerEvents: 'none'
					}} />
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};
