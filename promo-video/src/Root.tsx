import "./index.css";
import { Composition } from 'remotion';
import { TrackTapsPromo } from './Promo';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="TrackTapsPromo"
				component={TrackTapsPromo}
				durationInFrames={600}
				fps={30}
				width={1280}
				height={720}
			/>
		</>
	);
};
