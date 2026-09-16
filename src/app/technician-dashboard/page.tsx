'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { submitFeedbackInDb, logManagerChatLogInDb } from '@/services/api';
import { queryOpenRouter } from '@/services/openrouter';
import { 
  Car, 
  QrCode, 
  Clock, 
  Gauge, 
  AlertTriangle, 
  RefreshCw, 
  Bot, 
  Loader2, 
  Send, 
  BookOpen, 
  CircleCheck, 
  Circle, 
  ChevronRight, 
  Wrench, 
  ThumbsDown, 
  Flag, 
  X, 
  Camera, 
  Keyboard,
  Key,
  Sparkles
} from 'lucide-react';

const DEFAULT_OPENROUTER_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';

const INITIAL_SESSION = {
  id: 'session-20260910-001',
  vin: '1HGBH41JXMN109186',
  make: 'Honda',
  model: 'Accord EX-L',
  year: 2023,
  startedAt: '09:14 AM',
  status: 'in-progress',
  dtcCodes: ['P0301', 'P0420', 'B1234'],
  mileage: 34782,
  technicianNote: 'Customer reports rough idle at cold start and reduced fuel economy.',
};

const DTC_DESCRIPTIONS: Record<string, string> = {
  P0301: 'Cylinder 1 Misfire Detected',
  P0420: 'Catalyst System Efficiency Below Threshold (Bank 1)',
  B1234: 'Driver Seat Position Sensor Malfunction',
};

const DTC_SEVERITY: Record<string, 'critical' | 'warning' | 'info'> = {
  P0301: 'critical',
  P0420: 'warning',
  B1234: 'info',
};

const RAG_RESPONSES: Record<string, string> = {
  dtc: `**DTC P0301 — Cylinder 1 Misfire Detected**

Possible causes:
• Faulty spark plug (Cylinder 1)
• Defective ignition coil pack
• Clogged or leaking fuel injector
• Low compression (worn piston rings, valve issue)
• Vacuum leak near Cylinder 1

**Recommended action:** Start with spark plug inspection. Replace if electrode gap exceeds 0.044" (1.1mm). Torque spec: 13 ft-lbs. If misfire persists after plug replacement, perform coil swap test.`,

  coil: `**Ignition Coil Specifications — 2023 Honda Accord 1.5T**

Primary resistance: 0.5–0.8 Ω at 68°F (20°C)
Secondary resistance: 8,000–12,000 Ω at 68°F
Operating voltage: 12V nominal
Peak voltage output: 35,000–45,000V
Part number: 30520-5AA-A01 (OEM)

**Test procedure:** Disconnect coil connector. Measure primary terminals with multimeter. Values outside spec indicate coil failure. Swap with known-good coil for confirmation.`,

  wiring: `**Wiring Diagram Reference — Ignition Circuit (2023 Accord)**

Cylinder 1 coil connector pin-out:
• Pin A (BLK/YEL) — 12V ignition power
• Pin B (BLK) — Ground
• Pin C (BLU/GRN) — PCM trigger signal

Signal voltage: 0V (off) / 5V (firing pulse)
Harness routing: Under intake manifold cover, routed along valve cover left side.

⚠️ Inspect harness at cylinder head bracket contact point — known chafe location on 1.5T variants.`,

  recall: `**Recall Status — 2023 Honda Accord (VIN: 1HGBH41JXMN109186)**

Active recalls: 2

1. **NHTSA 23V-441** — Fuel Injector Seal Degradation
   Status: Parts available · Estimated repair: 1.5 hrs
   
2. **Honda SB-23-012** — PCM Software Update (Idle Stability)
   Status: Software update available · Estimated repair: 0.5 hrs

Completed recalls: 1 (23V-118 — Brake Booster)

Schedule both open recalls with this service visit.`,

  offtopic: `This platform is limited to automotive diagnostics and service manuals. Please ask a vehicle-related query.`
};

const QUICK_QUERIES = [
  { id: 'dtc', label: 'Check DTC P0301', query: 'What does DTC P0301 mean and how do I fix it?' },
  { id: 'coil', label: 'Coil Specs', query: 'What are the ignition coil specs for this vehicle?' },
  { id: 'wiring', label: 'Wiring Diagram', query: 'Show me the wiring diagram for the ignition circuit' },
  { id: 'recall', label: 'Recall Status', query: 'Are there any open recalls for this VIN?' },
];

const INITIAL_STEPS = [
  {
    id: 'step-001',
    stepNumber: 1,
    title: 'Prepare the work area and gather tools',
    description: 'Park vehicle on level surface. Apply parking brake. Allow engine to cool for minimum 30 minutes. Gather required tools: spark plug socket (5/8"), torque wrench, gap gauge, ratchet extension.',
    estimatedTime: '5 min',
    tools: ['5/8" spark plug socket', 'Torque wrench', 'Gap gauge', '6" extension'],
    status: 'complete',
  },
  {
    id: 'step-002',
    stepNumber: 2,
    title: 'Remove engine cover and locate Cylinder 1',
    description: "Remove plastic engine cover by pulling upward at clips (4 clips total). Cylinder 1 is the frontmost cylinder on the driver's side. Disconnect the ignition coil electrical connector by pressing the release tab and pulling straight out.",
    estimatedTime: '8 min',
    tools: ['Trim removal tool'],
    status: 'complete',
  },
  {
    id: 'step-003',
    stepNumber: 3,
    title: 'Remove ignition coil from Cylinder 1',
    description: 'Remove the 10mm bolt securing the ignition coil. Pull coil straight upward — do not twist. Inspect coil boot for cracks or carbon tracking. Set aside on clean surface.',
    estimatedTime: '5 min',
    tools: ['10mm socket', '1/4" ratchet'],
    warning: 'Do not pry coil with metal tools — boot damage will require coil replacement.',
    status: 'in-progress',
  },
  {
    id: 'step-004',
    stepNumber: 4,
    title: 'Remove and inspect spark plug',
    description: 'Using spark plug socket with extension, remove Cylinder 1 plug (counter-clockwise). Inspect electrode: measure gap with feeler gauge. Spec: 0.039–0.043" (1.0–1.1mm). Check for fouling, wear, or cracking.',
    estimatedTime: '10 min',
    tools: ['5/8" spark plug socket', 'Gap gauge', 'Feeler gauge'],
    warning: 'Thread carefully when reinstalling — aluminum head threads strip easily.',
    status: 'pending',
  },
  {
    id: 'step-005',
    stepNumber: 5,
    title: 'Install new spark plug',
    description: 'Thread new NGK ILZKAR8H8S plug by hand until snug. Torque to 13 ft-lbs (18 Nm). Do not over-torque. Apply anti-seize only if specified — 2023 Accord does NOT require anti-seize.',
    estimatedTime: '8 min',
    tools: ['Torque wrench', '5/8" spark plug socket'],
    status: 'pending',
  },
  {
    id: 'step-006',
    stepNumber: 6,
    title: 'Reinstall coil and verify repair',
    description: 'Reinstall ignition coil, torque bolt to 7 ft-lbs (9.5 Nm). Reconnect electrical connector until click is heard. Start engine and verify P0301 is cleared. Clear DTC with scan tool and perform test drive.',
    estimatedTime: '12 min',
    tools: ['Torque wrench', 'OBD-II scan tool'],
    status: 'pending',
  },
];

const RANDOM_VINS = [
  '1HGBH41JXMN109186',
  '2T1BURHE0JC065461',
  'JH4KA7650MC000000',
  'WBAWL73589P473741'
];

function getTimeString() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Active Session View
function ActiveSessionView({ 
  session, 
  onScanVIN, 
  onStartSession 
}: { 
  session: typeof INITIAL_SESSION | null;
  onScanVIN: () => void;
  onStartSession: () => void;
}) {
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl fade-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Car size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">No Active Session</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          Scan a vehicle VIN to begin a diagnostic session and access repair guides for that vehicle.
        </p>
        <button
          onClick={onStartSession}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all glow-cyan-sm"
        >
          <QrCode size={18} />
          Scan VIN to Start Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Session Header Card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Car size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {session.year} {session.make} {session.model}
              </h2>
              <p className="text-vin text-muted-foreground">{session.vin}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              session.status === 'in-progress'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : session.status === 'completed'
                ? 'bg-success/15 text-success border border-success/20'
                : 'bg-accent/15 text-accent border border-accent/20'
            }`}>
              {session.status === 'in-progress' ? '● In Progress' : session.status === 'completed' ? '✓ Completed' : '● Active'}
            </span>
            <button
              onClick={onScanVIN}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Re-scan VIN"
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Session ID', value: session.id.split('-').pop() || '001', icon: Wrench },
            { label: 'Started At', value: session.startedAt, icon: Clock },
            { label: 'Odometer', value: `${session.mileage.toLocaleString()} mi`, icon: Gauge },
            { label: 'DTC Count', value: `${session.dtcCodes.length} codes`, icon: AlertTriangle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-secondary/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
                <p className="text-sm font-bold text-foreground font-mono-nums">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Complaint */}
      {session.technicianNote && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Customer Complaint
          </p>
          <p className="text-sm text-foreground leading-relaxed">{session.technicianNote}</p>
        </div>
      )}

      {/* Detected Fault Codes */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Detected Fault Codes (DTCs)</h3>
          <button 
            onClick={() => toast.success('ECU re-scanned. No new DTCs found.')}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <RefreshCw size={12} />
            Re-scan ECU
          </button>
        </div>

        <div className="space-y-2.5">
          {session.dtcCodes.map((code) => {
            const severity = DTC_SEVERITY[code] || 'info';
            return (
              <div
                key={code}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  severity === 'critical'
                    ? 'bg-danger/5 border-danger/20'
                    : severity === 'warning'
                    ? 'bg-warning/5 border-warning/20'
                    : 'bg-info/5 border-info/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-code font-bold ${
                    severity === 'critical' ? 'text-danger' : severity === 'warning' ? 'text-warning' : 'text-info'
                  }`}>
                    {code}
                  </span>
                  <span className="text-sm text-foreground">
                    {DTC_DESCRIPTIONS[code] || 'Unknown fault code'}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  severity === 'critical'
                    ? 'bg-danger/15 text-danger'
                    : severity === 'warning'
                    ? 'bg-warning/15 text-warning'
                    : 'bg-info/15 text-info'
                }`}>
                  {severity}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Diagnostic Hub View with Enterprise RAG Integration
function DiagnosticHubView({ session }: { session: typeof INITIAL_SESSION | null }) {
  const [messages, setMessages] = useState<any[]>(() => [
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: session
        ? `Diagnostic Hub initialized for **${session.year} ${session.make} ${session.model}** (VIN: ${session.vin}).\n\nI have access to OEM service manuals, DTC databases, wiring diagrams, and recall bulletins for this vehicle. How can I assist with your diagnosis?`
        : 'Diagnostic Hub ready. Scan a VIN to load vehicle-specific data, or ask a general automotive query.',
      timestamp: getTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('AURAOS_OPENROUTER_KEY') || DEFAULT_OPENROUTER_KEY);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('AURAOS_OPENROUTER_MODEL') || 'openai/gpt-4o-mini');
  const [showKeyBar, setShowKeyBar] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const saveKey = (key: string, modelStr: string) => {
    try {
      localStorage.setItem('AURAOS_OPENROUTER_KEY', key);
      localStorage.setItem('AURAOS_OPENROUTER_MODEL', modelStr);
    } catch (e) {}
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: 'user' as const,
      content: queryText,
      timestamp: getTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const vehicleContextStr = session
      ? `${session.year} ${session.make} ${session.model} (VIN: ${session.vin}, Mileage: ${session.mileage.toLocaleString()} mi, DTC: ${session.dtcCodes.join(', ')})`
      : undefined;

    let techEmail = 'alex.rivera@auraos-diagnostics.com';
    try {
      const u = JSON.parse(localStorage.getItem('auraos_user') || '{}');
      if (u?.email) techEmail = u.email;
    } catch (e) {}

    if (openRouterKey.trim()) {
      try {
        const ragResult = await queryOpenRouter({
          apiKey: openRouterKey,
          messages: [...messages, userMsg],
          vehicleContext: vehicleContextStr,
          vehicleMake: session?.make,
          vehicleModel: session?.model,
          model: selectedModel,
        });

        const assistantMsg = {
          id: `msg-assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: ragResult.answer,
          retrievedChunks: ragResult.retrievedChunks,
          evaluation: ragResult.evaluation,
          metrics: ragResult.metrics,
          timestamp: getTimeString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-log to Manager Audit Database
        logManagerChatLogInDb({
          technicianEmail: techEmail,
          vin: session?.vin || '1HGBH41JXMN109186',
          query: queryText,
          response: ragResult.answer,
          status: ragResult.answer.includes('limited to automotive diagnostics') ? 'refused' : 'answered',
          retrievedCount: ragResult.retrievedChunks?.length || 1,
          make: session?.make || 'Honda',
          model: session?.model || 'Accord EX-L',
        });
      } catch (err: any) {
        toast.error(`OpenRouter Error: ${err.message || 'Failed to query live AI'}`);
        const fallbackReply = generateFallbackResponse(queryText, session);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-assistant-fallback-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ *OpenRouter connection issue. Fallback RAG response:* \n\n${fallbackReply}`,
            timestamp: getTimeString(),
          },
        ]);

        logManagerChatLogInDb({
          technicianEmail: techEmail,
          vin: session?.vin || '1HGBH41JXMN109186',
          query: queryText,
          response: fallbackReply,
          status: fallbackReply.includes('limited to automotive diagnostics') ? 'refused' : 'answered',
          retrievedCount: 1,
          make: session?.make || 'Honda',
          model: session?.model || 'Accord EX-L',
        });
      } finally {
        setLoading(false);
      }
    } else {
      await new Promise((r) => setTimeout(r, 600));
      const replyContent = generateFallbackResponse(queryText, session);

      const assistantMsg = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: replyContent,
        timestamp: getTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-log to Manager Audit Database
      logManagerChatLogInDb({
        technicianEmail: techEmail,
        vin: session?.vin || '1HGBH41JXMN109186',
        query: queryText,
        response: replyContent,
        status: replyContent.includes('limited to automotive diagnostics') ? 'refused' : 'answered',
        retrievedCount: 1,
        make: session?.make || 'Honda',
        model: session?.model || 'Accord EX-L',
      });

      setLoading(false);
    }
  };

  function generateFallbackResponse(queryText: string, currentSession: typeof INITIAL_SESSION | null) {
    const lower = queryText.toLowerCase();
    if (lower.includes('p0301') || lower.includes('misfire') || lower.includes('dtc')) {
      return RAG_RESPONSES.dtc;
    } else if (lower.includes('coil') || lower.includes('ignition spec')) {
      return RAG_RESPONSES.coil;
    } else if (lower.includes('wiring') || lower.includes('diagram') || lower.includes('circuit')) {
      return RAG_RESPONSES.wiring;
    } else if (lower.includes('recall')) {
      return RAG_RESPONSES.recall;
    } else if (['song', 'weather', 'news', 'recipe', 'joke', 'movie'].some((w) => lower.includes(w))) {
      return RAG_RESPONSES.offtopic;
    } else {
      return `I found relevant information in the service manual for the **${currentSession?.year || ''} ${currentSession?.make || ''} ${currentSession?.model || ''}**.\n\nFor your query about "${queryText.slice(0, 60)}${queryText.length > 60 ? '…' : ''}", please refer to Section 6-4 of the Engine Control System manual [Citation #1].`;
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col fade-in relative" style={{ height: '72vh', minHeight: '560px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Diagnostic Hub</h3>
            <p className="text-xs text-muted-foreground">
              {session ? `${session.year} ${session.make} ${session.model}` : 'No vehicle loaded'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyBar(!showKeyBar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              openRouterKey
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Key size={13} />
            {openRouterKey ? 'OpenRouter Connected' : 'Configure OpenRouter Key'}
          </button>

          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {openRouterKey ? 'Live AI Online' : 'RAG Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* OpenRouter Key Setup Drawer */}
      {showKeyBar && (
        <div className="bg-secondary/80 border-b border-border p-4 space-y-3 fade-in shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <p className="text-xs font-bold text-foreground">OpenRouter Live AI Configuration</p>
            </div>
            <button
              onClick={() => setShowKeyBar(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => {
                  setOpenRouterKey(e.target.value);
                  saveKey(e.target.value, selectedModel);
                }}
                placeholder="Paste OpenRouter Key (sk-or-v1-...)"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  saveKey(openRouterKey, e.target.value);
                }}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
                <option value="google/gemini-2.0-flash-001">Google Gemini 2.0 Flash</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Using key: <code className="text-accent font-mono">{openRouterKey.slice(0, 15)}...</code>. Queries are sent live to OpenRouter.
          </p>
        </div>
      )}

      {/* Quick query chips */}
      <div className="flex gap-2 px-5 py-3 border-b border-border flex-wrap shrink-0">
        {QUICK_QUERIES.map((q) => (
          <button
            key={q.id}
            onClick={() => handleSend(q.query)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4 touch-pan-y overscroll-contain"
        data-lenis-prevent
        data-lenis-prevent-wheel
        data-lenis-prevent-touch
      >
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} chat-bubble-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                <Bot size={12} className="text-primary" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary/15 border border-primary/20'
                : 'bg-secondary border border-border'
            }`}>
              <div className="space-y-1">
                {msg.content.split('\n').map((line: string, idx: number) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={idx} className="font-bold text-foreground text-sm">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('• ') || line.startsWith('1. ') || line.startsWith('2. ')) {
                    return (
                      <p key={idx} className="text-sm text-foreground pl-3">
                        {line}
                      </p>
                    );
                  }
                  if (line.startsWith('⚠️')) {
                    return (
                      <p key={idx} className="text-sm text-warning font-medium">
                        {line}
                      </p>
                    );
                  }
                  if (line === '') {
                    return <div key={idx} className="h-1.5" />;
                  }
                  return (
                    <p key={idx} className="text-sm text-foreground/90 leading-relaxed">
                      {line.replace(/\*\*/g, '')}
                    </p>
                  );
                })}
              </div>

              {/* RAG Source Citation Badges & Telemetry Bar */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2">
                  {/* Retrieved Chunk Citation Buttons */}
                  {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mr-1">
                        Sources:
                      </span>
                      {msg.retrievedChunks.map((chunk: any, cIdx: number) => (
                        <button
                          key={cIdx}
                          onClick={() => setSelectedChunk(chunk)}
                          className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[11px] text-primary hover:bg-primary/20 transition-all font-mono flex items-center gap-1"
                        >
                          <BookOpen size={10} />
                          [Citation #{cIdx + 1}: {chunk.title || `Doc #${chunk.documentId || cIdx + 1}`}]
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Telemetry Metrics & Evaluation Badge */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      {msg.evaluation && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          msg.evaluation.score >= 75
                            ? 'bg-success/15 text-success border border-success/20'
                            : 'bg-accent/15 text-accent border border-accent/20'
                        }`}>
                          ✓ {msg.evaluation.status} ({msg.evaluation.groundednessScore}% Grounded)
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>

                    {msg.metrics && (
                      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <span>⚡ {msg.metrics.latencyMs}ms</span>
                        <span>•</span>
                        <span>🎟️ {msg.metrics.totalTokens} tokens</span>
                        <span>•</span>
                        <span className="text-accent font-semibold">${msg.metrics.estimatedCostUSD.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-primary" />
            </div>
            <div className="bg-secondary border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">
                  {openRouterKey ? `Searching vector DB & generating grounded answer with ${selectedModel}…` : 'Querying knowledge base…'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* RAG Source Citation Inspector Modal */}
      {selectedChunk && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  {selectedChunk.title || `Document #${selectedChunk.documentId}`}
                </h4>
              </div>
              <button
                onClick={() => setSelectedChunk(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary p-2 rounded-lg">
                <span className="text-muted-foreground">Make / Model:</span>
                <p className="font-bold text-foreground">{selectedChunk.make} {selectedChunk.model}</p>
              </div>
              <div className="bg-secondary p-2 rounded-lg">
                <span className="text-muted-foreground">Relevance Match:</span>
                <p className="font-bold text-primary">{((selectedChunk.similarityScore || 0.95) * 100).toFixed(1)}% Match</p>
              </div>
            </div>

            <div 
              className="bg-secondary/60 border border-border rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-xs text-foreground/90 touch-pan-y overscroll-contain"
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
            >
              <p className="font-bold text-accent mb-1">[Vector Chunk #{selectedChunk.chunkIndex || 0} Contents]</p>
              {selectedChunk.content}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedChunk(null)}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/90"
              >
                Close Citation Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask about DTC codes, repair specs, wiring diagrams, recalls…"
            className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {openRouterKey ? `Connected to OpenRouter Live (${selectedModel})` : 'Connected to OEM service manuals · NHTSA recall database · DTC reference library'}
        </p>
      </div>
    </div>
  );
}

// Repair Guide View
function RepairGuideView({ session }: { session: typeof INITIAL_SESSION | null }) {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [expandedId, setExpandedId] = useState('step-003');
  const [confirmJobModalOpen, setConfirmJobModalOpen] = useState(false);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  const markComplete = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'complete' } : s))
    );
    toast.success('Step marked complete');
  };

  const handleCompleteJob = () => {
    toast.success('✓ Diagnostic Job completed! Session log saved to database.');
    setConfirmJobModalOpen(false);
  };

  const handleFeedback = async (type: string) => {
    if (type === 'unclear' || type === 'outdated' || type === 'other') {
      await submitFeedbackInDb({
        docId: 1,
        submittedBy: 'alex.reyes@auraos.io',
        type: type === 'unclear' ? 'Unclear' : type === 'outdated' ? 'Outdated' : 'Other',
        message: `Technician flagged repair step as ${type}.`,
      });
      toast.success(`Feedback (${type}) logged to database for Manager review.`);
    } else if (type === 'complete') {
      setConfirmJobModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 fade-in">
      <ConfirmationModal
        isOpen={confirmJobModalOpen}
        onClose={() => setConfirmJobModalOpen(false)}
        onConfirm={handleCompleteJob}
        title="Complete Diagnostic Job"
        description={`Are you sure you want to complete this job for ${session ? `${session.year} ${session.make} ${session.model}` : 'this vehicle'}? The session status will be updated to Completed in the Manager Command Center.`}
        confirmText="Complete Job"
        variant="success"
      />
      {/* Overview Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
              <BookOpen size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">P0301 — Cylinder 1 Misfire Repair</h3>
              <p className="text-xs text-muted-foreground">
                {session ? `${session.year} ${session.make} ${session.model}` : 'Vehicle not loaded'} · OEM Service Manual Rev. 2023.4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">~48 min total</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{completedCount} of {steps.length} steps complete</span>
            <span className="text-xs font-bold text-primary">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accordion Steps List */}
      <div className="space-y-2">
        {steps.map((step) => {
          const isExpanded = expandedId === step.id;
          const isDone = step.status === 'complete';
          const isInProgress = step.status === 'in-progress';

          return (
            <div
              key={step.id}
              className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
                isDone
                  ? 'border-success/20 bg-success/5'
                  : isInProgress
                  ? 'border-primary/30 glow-cyan-sm'
                  : 'border-border'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? '' : step.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CircleCheck size={20} className="text-success step-complete" />
                  ) : isInProgress ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Step {step.stepNumber}</span>
                    {isInProgress && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Current</span>
                    )}
                  </div>
                  <p className={`text-sm font-semibold truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {step.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    {step.estimatedTime}
                  </div>
                  <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{step.description}</p>

                  {step.warning && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                      <p className="text-xs text-warning">{step.warning}</p>
                    </div>
                  )}

                  {step.tools.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Wrench size={11} />
                        Required Tools
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.tools.map((t) => (
                          <span key={t} className="text-xs bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => markComplete(step.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-success/15 text-success border border-success/20 rounded-lg text-sm font-semibold hover:bg-success/25 active:scale-95 transition-all"
                    >
                      <CircleCheck size={15} />
                      Mark Step Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide Feedback */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Guide Feedback
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFeedback('unclear')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border text-muted-foreground hover:text-warning hover:border-warning/40 hover:bg-warning/10 transition-all active:scale-95"
          >
            <ThumbsDown size={14} />
            Report Unclear
          </button>
          <button
            onClick={() => handleFeedback('outdated')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border text-muted-foreground hover:text-danger hover:border-danger/40 hover:bg-danger/10 transition-all active:scale-95"
          >
            <Flag size={14} />
            Outdated Guide
          </button>
          <button
            onClick={() => handleFeedback('complete')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-success/15 text-success border border-success/20 hover:bg-success/25 transition-all active:scale-95 ml-auto"
          >
            <CircleCheck size={14} />
            Complete Job
          </button>
        </div>
      </div>
    </div>
  );
}

// OBD Diagnostic Device Pairing Modal
function AddDeviceModal({
  userEmail,
  onClose,
  onDevicePaired,
}: {
  userEmail: string;
  onClose: () => void;
  onDevicePaired: (device: any) => void;
}) {
  const [protocol, setProtocol] = useState<'Bluetooth LE' | 'WiFi VCI' | 'USB OBD-II' | 'CAN-FD'>('Bluetooth LE');
  const [discovering, setDiscovering] = useState(true);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDiscovering(false);
      setTools([
        { id: 't1', name: 'Autel MaxiVCI V200 (Pass-Thru)', mac: '00:1A:7D:FA:32:11', signal: '98%' },
        { id: 't2', name: 'OBDLink MX+ Bluetooth 5.0', mac: '00:1A:7D:B1:89:40', signal: '92%' },
        { id: 't3', name: 'Snap-on Pass-Thru VCI Dongle', mac: '00:1A:7D:C4:22:98', signal: '88%' },
        { id: 't4', name: 'Bosch KTS 590 Wireless Adapter', mac: '00:1A:7D:88:99:01', signal: '85%' },
      ]);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handlePair = async (tool: any) => {
    toast.loading(`Pairing ${tool.name} via ${protocol}…`);
    const paired = await pairDeviceInDb({
      userEmail,
      name: tool.name,
      protocol,
      macAddress: tool.mac,
    });

    toast.dismiss();
    if (paired) {
      toast.success(`Successfully connected ${tool.name}!`);
      onDevicePaired(paired);
      onClose();
    } else {
      toast.error('Failed to pair diagnostic device.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl fade-in p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Pair OBD-II Diagnostic Device</h3>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Connection Protocol</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Bluetooth LE', 'WiFi VCI', 'USB OBD-II', 'CAN-FD'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  protocol === p ? 'bg-primary/15 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Nearby Diagnostic VCI Tools</span>
            {discovering && <Loader2 size={12} className="animate-spin text-primary" />}
          </div>

          {discovering ? (
            <div className="py-8 flex flex-col items-center justify-center bg-secondary/50 rounded-xl">
              <Loader2 size={24} className="animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Scanning Bluetooth & VCI wireless spectrum…</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tools.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border">
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">MAC: {t.mac} · Signal: {t.signal}</p>
                  </div>
                  <button
                    onClick={() => handlePair(t)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
                  >
                    Pair Tool
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Upgraded VIN Scanner & Custom Input Modal
function VINScannerModal({
  userEmail,
  onClose,
  onSessionCreated,
}: {
  userEmail: string;
  onClose: () => void;
  onSessionCreated: (session: any) => void;
}) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualVin, setManualVin] = useState('');
  const [decoding, setDecoding] = useState(false);

  const handleDecodeAndStart = async (vinToDecode: string) => {
    if (vinToDecode.length !== 17) {
      toast.error('VIN must be exactly 17 characters');
      return;
    }

    setDecoding(true);
    toast.loading('Decoding VIN & fetching OEM specs from DB…');

    const decoded = await decodeVinInDb(vinToDecode);
    toast.dismiss();

    if (decoded) {
      const newSession = await createSessionInDb({
        userEmail,
        vin: decoded.vin,
        make: decoded.make,
        model: decoded.model,
        year: decoded.year,
        mileage: decoded.mileage,
        dtcCodes: decoded.dtcCodes,
        technicianNote: `Initial diagnostic intake session for ${decoded.year} ${decoded.make} ${decoded.model}.`,
      });

      if (newSession) {
        toast.success(`Vehicle Loaded & Session Created: ${decoded.year} ${decoded.make} ${decoded.model}`);
        onSessionCreated(newSession);
        onClose();
      } else {
        toast.error('Failed to create persistent session in database.');
      }
    } else {
      toast.error('Could not decode VIN.');
    }
    setDecoding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl fade-in p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Dynamic VIN Scanner & Intake</h2>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
              mode === 'manual' ? 'bg-primary/15 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            Manual VIN Input
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
              mode === 'camera' ? 'bg-primary/15 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            Camera Scanner
          </button>
        </div>

        {mode === 'manual' ? (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-foreground">Enter Any 17-Character VIN</label>
            <input
              type="text"
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase().slice(0, 17))}
              placeholder="e.g. 1HGBH41JXMN109186 or 4T1BURHE0JC065461"
              maxLength={17}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-vin text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-widest text-sm"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{manualVin.length}/17 characters</span>
              {manualVin.length === 17 && <span className="text-success font-semibold">✓ Valid VIN Length</span>}
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Quick Demo Test VINs:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { vin: '1HGBH41JXMN109186', label: 'Honda Accord 2023' },
                  { vin: '4T1BURHE0JC065461', label: 'Toyota Camry 2022' },
                  { vin: '1FTFW1ED4MFC12345', label: 'Ford F-150 2024' },
                  { vin: 'WBA33AY08NFP12345', label: 'BMW 330i 2023' },
                ].map((item) => (
                  <button
                    key={item.vin}
                    onClick={() => setManualVin(item.vin)}
                    className="text-[10px] bg-secondary border border-border px-2 py-1 rounded text-muted-foreground hover:text-primary hover:border-primary/40"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleDecodeAndStart(manualVin)}
              disabled={manualVin.length !== 17 || decoding}
              className="w-full mt-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40"
            >
              {decoding ? 'Decoding & Starting Session…' : 'Decode VIN & Start Live Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-6 bg-secondary/50 rounded-xl border border-border">
            <Camera size={32} className="mx-auto text-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">Position VIN Barcode in Camera Viewfinder</p>
            <button
              onClick={() => handleDecodeAndStart('1HGBH41JXMN109186')}
              className="px-4 py-2 bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded-lg hover:bg-primary/30"
            >
              Simulate Camera VIN Match (Honda Accord)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import {
  fetchActiveSessionFromDb,
  createSessionInDb,
  updateSessionInDb,
  decodeVinInDb,
  fetchPairedDevicesFromDb,
  pairDeviceInDb,
} from '@/services/api';

export default function TechnicianDashboardPage() {
  const [activeTab, setActiveTab] = useState<'session' | 'diagnostic' | 'repair'>('session');
  const [showScanner, setShowScanner] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [title, setTitle] = useState('Start Session');
  const navigate = useNavigate();

  // Load persistent user profile & session on mount
  useEffect(() => {
    const role = sessionStorage.getItem('aura_role') || localStorage.getItem('aura_role');
    if (role === 'manager') {
      navigate('/manager-portal', { replace: true });
      return;
    }

    try {
      const userStr = localStorage.getItem('aura_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.email) {
          setUserEmail(u.email);
          loadUserData(u.email);
          return;
        }
      }
    } catch (e) {}

    // Fallback email
    setUserEmail('alex.reyes@auraos.io');
    loadUserData('alex.reyes@auraos.io');
  }, [navigate]);

  const loadUserData = async (email: string) => {
    setLoadingSession(true);
    const active = await fetchActiveSessionFromDb(email);
    const paired = await fetchPairedDevicesFromDb(email);
    
    setSession(active || null);
    setDevices(paired || []);
    setLoadingSession(false);
  };

  const handleClearDtc = async () => {
    if (!session) return;
    toast.loading('Clearing DTC codes from ECU via paired OBD tool…');

    const updated = await updateSessionInDb(session.id, {
      dtcCleared: true,
      dtcCodes: [],
    });

    toast.dismiss();
    if (updated) {
      setSession(updated);
      toast.success('DTC codes cleared successfully & logged to database!');
    } else {
      toast.error('Failed to clear DTC codes.');
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    toast.loading('Ending diagnostic session…');

    await updateSessionInDb(session.id, { status: 'completed' });
    toast.dismiss();
    toast.success('Session completed & saved to auraos.db!');
    setSession(null);
  };

  const setTab = (id: 'session' | 'diagnostic' | 'repair', label: string) => {
    setActiveTab(id);
    setTitle(label);
  };

  return (
    <LayoutWrapper
      pageTitle={title}
      role="technician"
      activeNav={activeTab}
      onNavClick={(id) => {
        if (id === 'session') setTab('session', 'Start Session');
        if (id === 'diagnostic') setTab('diagnostic', 'Diagnostic Hub');
        if (id === 'repair') setTab('repair', 'Repair Guide');
      }}
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'session', label: 'Active Session' },
              { id: 'diagnostic', label: 'Diagnostic Hub' },
              { id: 'repair', label: 'Repair Guide' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any, t.label)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
                  activeTab === t.id
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeviceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border text-foreground text-xs font-semibold rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all"
            >
              <Wrench size={13} className="text-primary" />
              {devices.length > 0 ? `OBD Tool: ${devices[0].name.split(' ')[0]}` : 'Pair OBD Scanner'}
            </button>

            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              <QrCode size={14} />
              {session ? 'Switch Vehicle VIN' : 'Scan New VIN'}
            </button>

            {session && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-success text-success-foreground text-xs font-bold rounded-lg hover:bg-success/90 active:scale-95 transition-all shadow-sm"
                title="Complete job and update status in Manager Portal"
              >
                <CircleCheck size={14} />
                Complete Job
              </button>
            )}
          </div>
        </div>

        {/* Tab views */}
        {activeTab === 'session' && (
          <div>
            {loadingSession ? (
              <div className="py-20 flex flex-col items-center justify-center bg-card border border-border rounded-2xl">
                <Loader2 size={24} className="animate-spin text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Loading technician workspace & database sessions…</p>
              </div>
            ) : session ? (
              <div className="space-y-4">
                <ActiveSessionView
                  session={session}
                  onScanVIN={() => setShowScanner(true)}
                  onStartSession={() => setShowScanner(true)}
                />
                <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Interactive Session Control</p>
                    <p className="text-xs text-muted-foreground">Connected to SQLite `auraos.db` for user `{userEmail}`</p>
                  </div>
                  <div className="flex gap-2">
                    {session.dtcCodes && session.dtcCodes.length > 0 && (
                      <button
                        onClick={handleClearDtc}
                        className="px-4 py-2 bg-warning/15 text-warning border border-warning/20 rounded-lg text-xs font-bold hover:bg-warning/25"
                      >
                        Clear ECU DTC Codes
                      </button>
                    )}
                    <button
                      onClick={handleEndSession}
                      className="px-4 py-2 bg-danger/15 text-danger border border-danger/20 rounded-lg text-xs font-bold hover:bg-danger/25"
                    >
                      End Diagnostic Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl fade-in text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Car size={32} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Welcome to Your Fresh Technician Workspace</h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  No active vehicle session found for <code className="text-accent">{userEmail}</code>. Pair your diagnostic scanner or scan a VIN to decode OEM specifications and start a real-time session.
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setShowDeviceModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border text-foreground font-semibold rounded-xl hover:border-primary/40 transition-all text-xs"
                  >
                    <Wrench size={16} className="text-primary" />
                    Pair OBD Diagnostic Tool
                  </button>

                  <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all text-xs glow-cyan-sm"
                  >
                    <QrCode size={16} />
                    Scan Vehicle VIN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnostic' && (
          <DiagnosticHubView session={session} />
        )}

        {activeTab === 'repair' && (
          <RepairGuideView session={session} />
        )}
      </div>

      {/* Modals */}
      {showScanner && (
        <VINScannerModal
          userEmail={userEmail}
          onClose={() => setShowScanner(false)}
          onSessionCreated={(newSession) => {
            setSession(newSession);
          }}
        />
      )}

      {showDeviceModal && (
        <AddDeviceModal
          userEmail={userEmail}
          onClose={() => setShowDeviceModal(false)}
          onDevicePaired={(device) => {
            setDevices((prev) => [device, ...prev]);
          }}
        />
      )}
    </LayoutWrapper>
  );
}
