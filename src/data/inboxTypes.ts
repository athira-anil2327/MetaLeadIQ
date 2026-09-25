export interface InboxMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'instagram';
  body: string;
  timestamp: string;
}

export interface InboxConversation {
  id: string;
  leadId: string;
  leadName: string;
  channel: 'whatsapp' | 'instagram';
  externalId: string; // phone number or IG handle
  createdAt: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  leadScore?: number;
  leadStatus?: 'Hot' | 'Warm' | 'Cold';
  unreadCount?: number;
}
