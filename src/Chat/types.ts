type ChatMessage = {
  // API messages carry a UUID string; the local-only fallback and optimistic
  // sends use a numeric/templated id instead — either is fine as a React key.
  id: string | number;
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
