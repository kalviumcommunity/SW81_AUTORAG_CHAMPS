'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Wrench, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Server
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do I pair an OBD-II diagnostic scanner with AuraOS?',
    a: 'Go to your Technician Dashboard, click the "Pair OBD Scanner" button in the top bar, select your protocol (Bluetooth LE, WiFi, USB, CAN), and tap Connect. Your paired device will be saved persistently to your profile.'
  },
  {
    q: 'What should I do if a DTC code does not clear after repair?',
    a: 'Ensure all repair steps in the Repair Guide are completed and the ignition switch is in Key-On Engine-Off (KOEO) mode. If the code persists, verify sensor wiring harness connections or submit a support ticket.'
  },
  {
    q: 'How do Managers upload and publish OEM Service Manuals?',
    a: 'Managers can navigate to the Manager Portal -> Knowledge Base Upload tab. Drag and drop PDF or DOCX files, tag the vehicle Make, Model, and Year, and click Upload. The RAG Engine automatically generates 128D vector embeddings for technician search.'
  },
  {
    q: 'How do I trigger secret Super Admin access?',
    a: 'Click the AuraOS platform logo in the top-left header 3 times in rapid succession. Enter the Master Security PIN (8899) when prompted.'
  }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'ticket' | 'faq'>('ticket');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ email: 'alex.reyes@auraos.io', role: 'technician', name: 'Alex Reyes' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    category: 'OEM Manual Request',
    priority: 'Medium',
    description: '',
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('aura_user') || localStorage.getItem('aura_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      }
    } catch (e) {}
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.error('Please enter a subject and detailed description.');
      return;
    }

    setLoading(true);
    toast.loading('Logging support ticket with Python backend…');

    try {
      const res = await fetch('http://localhost:5000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userRole: user.role,
          subject: formData.subject,
          category: formData.category,
          priority: formData.priority,
          description: formData.description,
        }),
      });

      const data = await res.json();
      toast.dismiss();

      if (res.ok) {
        toast.success(`Support Ticket #${data.ticketId} Created Successfully!`);
        setFormData({ subject: '', category: 'OEM Manual Request', priority: 'Medium', description: '' });
      } else {
        toast.error(data.error || 'Failed to create support ticket');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error('Network error connecting to Python backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper
      pageTitle="Support Center & Technical Helpdesk"
      role={user.role as any || 'technician'}
      activeNav="support"
      onNavClick={(id) => {
        if (id === 'session') navigate('/technician-dashboard');
        if (id === 'command') navigate('/manager-portal');
      }}
    >
      <div className="space-y-6 max-w-4xl mx-auto fade-in">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-surface via-card to-surface border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <HelpCircle className="text-primary" size={22} />
                <h1 className="text-xl font-bold text-foreground">AuraOS Support & Knowledge Helpdesk</h1>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Need OEM manual clarifications, DTC diagnostic assistance, or platform escalation? Submit a ticket directly to the engineering team or search common solutions below.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Server size={14} className="animate-pulse" />
              <span>Python FastAPI Backend Connected</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ticket'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <MessageSquare size={15} />
            Submit Support Ticket
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'faq'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <HelpCircle size={15} />
            Frequently Asked Questions
          </button>
        </div>

        {/* Form View */}
        {activeTab === 'ticket' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-foreground mb-4">Create New Helpdesk Ticket</h2>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Requester Email</label>
                  <input
                    type="text"
                    disabled
                    value={user.email}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 text-xs text-muted-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Issue Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="OEM Manual Request">📚 OEM Manual Request</option>
                    <option value="DTC Diagnostic Help">⚡ DTC Diagnostic Assistance</option>
                    <option value="Hardware OBD Tool Issue">🔌 Hardware OBD Tool Pairing</option>
                    <option value="Software Bug">🐞 Software Bug / Interface</option>
                    <option value="Compliance Escalation">🚨 Manager Compliance Escalation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="Brief description of the issue..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Low">Low (Standard Question)</option>
                    <option value="Medium">Medium (Normal Field Work)</option>
                    <option value="High">High (Urgent Repair Stoppage)</option>
                    <option value="Critical">Critical (Safety / Compliance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Detailed Description & Steps to Reproduce</label>
                <textarea
                  rows={4}
                  placeholder="Provide VIN, vehicle model, DTC code, or specific manual details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-input border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Support Ticket
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQ View */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
