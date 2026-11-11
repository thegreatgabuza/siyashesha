import { Redirect } from 'expo-router';

import AssistantScreen from './more/assistant';
import { useAppStore } from '@/store/useAppStore';

export default function AssistantRoute() {
  const userRole = useAppStore((s) => s.userRole);

  // Doctors do not have access to consumer symptom checker assistant; redirect to Practice
  if (userRole === 'doctor') {
    return <Redirect href="/" />;
  }

  return <AssistantScreen />;
}
