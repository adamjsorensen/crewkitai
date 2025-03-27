
import { usePgConversations } from './usePgConversations';

// This hook now acts as a redirect to usePgConversations
export const useConversations = () => {
  // Use PgCoach conversations instead
  return usePgConversations();
};
