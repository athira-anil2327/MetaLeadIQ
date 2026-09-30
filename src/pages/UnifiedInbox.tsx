import React, { useState } from 'react';
import { 
  MessageSquare, Send, Search, 
  CheckCheck, PlusCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { AddLeadModal } from '../components/ui/AddLeadModal';

export const UnifiedInbox: React.FC = () => {
  const { 
    conversations, 
    messages, 
    sendReply, 
    leads, 
    updateLead
  } = useAppContext();

  const [activeConvId, setActiveConvId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'instagram'>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const filteredConversations = conversations
    .filter(c => channelFilter === 'all' || c.channel === channelFilter)
    .filter(c => 
      c.leadName.toLowerCase().includes(search.toLowerCase()) || 
      c.externalId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return timeB - timeA;
    });

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeMessages = activeConvId ? (messages[activeConvId] || []) : [];
  const activeLead = activeConv ? leads.find(l => l.id === activeConv.leadId || l.name === activeConv.leadName) : null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvId) return;

    const text = replyText.trim();
    setReplyText('');
    await sendReply(activeConvId, text);
    
    // Automatically mark lead as contacted when an agent replies
    if (activeLead && !activeLead.contacted) {
      updateLead(activeLead.id, { contacted: true });
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-status-cold bg-status-cold/10';
    if (score >= 70) return 'text-status-hot bg-status-hot/10';
    if (score >= 40) return 'text-status-warm bg-status-warm/10';
    return 'text-status-cold bg-status-cold/10';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Omnichannel Unified Inbox</h1>
            <p className="text-xs text-text-muted">
              Live WhatsApp Cloud API & Instagram Messaging threads with real-time lead score badges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsSimModalOpen(true)}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Simulate Inbound Message
          </Button>
        </div>
      </div>

      {/* Main Inbox Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row border border-border bg-background-card rounded-2xl overflow-hidden min-h-0">
        
        {/* Left Column: Conversation Directory */}
        <div className="w-full lg:w-80 xl:w-96 border-r border-border flex flex-col bg-background-card">
          
          {/* Channel Filter & Search */}
          <div className="p-3 border-b border-border bg-background-elevated/40 space-y-2.5">
            <div className="flex rounded-lg bg-background-primary p-0.5 border border-border">
              {(['all', 'whatsapp', 'instagram'] as const).map(chan => (
                <button
                  key={chan}
                  onClick={() => setChannelFilter(chan)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                    channelFilter === chan 
                      ? 'bg-background-card text-text-primary shadow-sm' 
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {chan === 'all' ? 'All Channels' : chan}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-input-bg border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted space-y-3">
                <MessageSquare className="w-8 h-8 text-text-muted/40 mx-auto" />
                <p>No conversations found on {channelFilter === 'all' ? 'any channel' : channelFilter}.</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsSimModalOpen(true)}
                  className="text-xs"
                >
                  Simulate Inbound DM
                </Button>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors hover:bg-hover-bg/50 relative ${
                    activeConvId === conv.id ? 'bg-primary/5 border-l-3 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-background-elevated border border-border flex items-center justify-center font-bold text-xs text-primary">
                          {conv.leadName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background-card flex items-center justify-center text-[9px] font-bold ${
                          conv.channel === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                        }`}>
                          {conv.channel === 'whatsapp' ? 'W' : 'IG'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-text-primary truncate">
                          {conv.leadName}
                        </div>
                        <div className="text-[11px] text-text-muted truncate">
                          {conv.externalId}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {conv.leadScore && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getScoreColor(conv.leadScore)}`}>
                          {conv.leadScore}
                        </span>
                      )}
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {conv.lastMessage && (
                    <p className="text-xs text-text-secondary mt-2 truncate line-clamp-1">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center / Right Column: Active Thread & Quick Reply */}
        <div className="flex-1 flex flex-col min-w-0 bg-background-primary/30">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted">
              <MessageSquare className="w-12 h-12 text-text-muted/30 mb-3" />
              <h3 className="font-semibold text-text-primary text-sm">Select a Conversation</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                Choose a WhatsApp or Instagram thread from the left, or simulate an inbound message to start communicating with scored leads.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Thread Header */}
              <div className="px-6 py-3.5 border-b border-border bg-background-card flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-background-elevated border border-border flex items-center justify-center font-bold text-xs text-primary">
                    {activeConv.leadName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">{activeConv.leadName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        activeConv.channel === 'whatsapp' 
                          ? 'bg-green-500/15 text-green-400' 
                          : 'bg-purple-500/15 text-purple-400'
                      }`}>
                        {activeConv.channel}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">{activeConv.externalId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeLead && (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted">XGBoost Score</div>
                        <div className="text-sm font-bold text-primary">{activeLead.currentScore}/100</div>
                      </div>
                      <StatusBadge status={activeLead.status} />
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-text-muted">
                    No messages in this conversation yet. Send a greeting to initiate contact.
                  </div>
                ) : (
                  activeMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.direction === 'outbound' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          msg.direction === 'outbound'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-background-card border border-border text-text-primary rounded-tl-none'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted px-1">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.direction === 'outbound' && <CheckCheck className="w-3 h-3 text-primary" />}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSend} className="p-4 border-t border-border bg-background-card flex gap-2 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply via ${activeConv.channel === 'whatsapp' ? 'WhatsApp Cloud API' : 'Instagram Direct Message'}...`}
                  className="flex-1 bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                />
                <Button type="submit" disabled={!replyText.trim()} className="px-4">
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send
                </Button>
              </form>

            </div>
          )}
        </div>

        {/* Optional Right Details Sidebar */}
        {activeLead && (
          <div className="hidden xl:flex w-72 border-l border-border bg-background-card p-5 flex-col space-y-5 overflow-y-auto">
            <div>
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Prospect Profile</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Ingested via MetaLeadIQ Pipeline</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-background-elevated/40 border border-border space-y-1">
                <div className="text-[11px] text-text-muted">Campaign Source</div>
                <div className="font-semibold text-text-primary">{activeLead.leadSource} • {activeLead.placement}</div>
              </div>

              <div className="p-3 rounded-xl bg-background-elevated/40 border border-border space-y-1">
                <div className="text-[11px] text-text-muted">Conversion Probability</div>
                <div className="font-semibold text-primary">{activeLead.conversionProbability}%</div>
              </div>

              <div className="p-3 rounded-xl bg-background-elevated/40 border border-border space-y-1">
                <div className="text-[11px] text-text-muted">Confidence Interval</div>
                <div className="font-semibold text-text-primary">
                  [{activeLead.predictionLower}%, {activeLead.predictionUpper}%] ({activeLead.confidence})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background-elevated/40 border border-border space-y-1">
                <div className="text-[11px] text-text-muted">Engagement History</div>
                <div className="font-semibold text-text-primary">{activeLead.totalVisits} visits • {activeLead.timeOnWebsite} min</div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                variant={activeLead.contacted ? "outline" : "primary"}
                size="sm"
                className="w-full text-xs"
                onClick={() => updateLead(activeLead.id, { contacted: !activeLead.contacted })}
              >
                {activeLead.contacted ? 'Contacted (Decay Frozen)' : 'Mark as Contacted'}
              </Button>
            </div>
          </div>
        )}

      </div>

      <AddLeadModal 
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        initialTab="webhook"
      />
    </div>
  );
};
