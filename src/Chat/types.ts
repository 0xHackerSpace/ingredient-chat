type ChatMessage = {
  id: number;
  own: boolean;
  text: string;
};

// Deliberately narrow and camelCase — this is the contract a host promises to
// fill, decoupled from however it models a "profile" internally.
type UserProfile = {
  role: string;
  tenantName: string;
};

export type { ChatMessage, UserProfile };
