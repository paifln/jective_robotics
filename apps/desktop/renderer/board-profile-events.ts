export const BOARD_PROFILES_CHANGED='jective-board-profiles-changed';
export function refreshBoardProfiles(){window.dispatchEvent(new Event(BOARD_PROFILES_CHANGED));}
