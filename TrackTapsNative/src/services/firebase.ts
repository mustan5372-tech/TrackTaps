import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Native Firebase connects automatically using native configuration files (google-services.json / GoogleService-Info.plist)
export const db = firestore();
export const nativeAuth = auth();

export default {
  db,
  auth: nativeAuth,
};
