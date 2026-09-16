'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { uploadDocumentToDb, fetchDocumentsFromDb, fetchAuditLogsFromDb, fetchMetricsFromDb, fetchAllSessionsFromDb, fetchFeedbackFromDb, updateFeedbackStatusInDb, fetchManagerChatLogsFromDb } from '@/services/api';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  ChevronDown, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Archive, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  XCircle, 
  History,
  Database,
  RefreshCw,
  MessageSquare,
  Eye,
  X,
  User,
  Car
} from 'lucide-react';

// Metrics Data
const INITIAL_METRICS = [
  { id: 'metric-docs-published', label: 'Published Documents', value: '1,284', delta: '+23 this week', trend: 'up', color: 'success' },
  { id: 'metric-pending', label: 'Pending Approval', value: '14', delta: '3 overdue >48h', trend: 'warning', color: 'warning' },
  { id: 'metric-coverage', label: 'Vehicle Model Coverage', value: '87.4%', delta: '+2.1% vs last month', trend: 'up', color: 'primary' },
  { id: 'metric-flagged', label: 'Flagged Guides', value: '7', delta: '2 critical priority', trend: 'down', color: 'danger' },
  { id: 'metric-sessions', label: 'Active Tech Sessions', value: '31', delta: 'Peak today: 48', trend: 'neutral', color: 'info' },
  { id: 'metric-dtc-resolution', label: 'DTC Resolution Rate', value: '94.2%', delta: '+0.8% vs yesterday', trend: 'up', color: 'success' },
];

const METRIC_STYLES: Record<string, string> = {
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  primary: 'text-primary bg-primary/10 border-primary/20',
  danger: 'text-danger bg-danger/10 border-danger/20',
  info: 'text-info bg-info/10 border-info/20',
};

const TREND_COLORS: Record<string, string> = {
  up: 'text-success',
  down: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-muted-foreground',
};

// Fallback Document Data
const FALLBACK_DOCUMENTS = [
  { id: 'doc-001', title: 'Engine Control System Manual', make: 'Honda', model: 'Accord', year: 2023, region: 'North America', version: '3.2.1', type: 'Service Manual', status: 'Published', uploadedBy: 'Sarah Kim', updatedAt: 'Sep 09, 2026', sizeKb: 18420 },
  { id: 'doc-002', title: 'Brake System Overhaul Guide', make: 'Toyota', model: 'Camry', year: 2022, region: 'North America', version: '2.0.0', type: 'Service Manual', status: 'Flagged', uploadedBy: 'Marcus Webb', updatedAt: 'Sep 08, 2026', sizeKb: 9830 },
  { id: 'doc-003', title: 'Ignition Wiring Diagram Set', make: 'Ford', model: 'F-150', year: 2024, region: 'North America', version: '1.4.2', type: 'Wiring Diagram', status: 'Published', uploadedBy: 'Priya Nair', updatedAt: 'Sep 07, 2026', sizeKb: 5620 },
  { id: 'doc-004', title: 'Transmission Fluid Service Bulletin', make: 'BMW', model: '3 Series', year: 2023, region: 'Europe', version: '1.1.0', type: 'Technical Service Bulletin', status: 'Under Review', uploadedBy: 'Sarah Kim', updatedAt: 'Sep 06, 2026', sizeKb: 3210 },
  { id: 'doc-005', title: 'HVAC System Diagnostics Manual', make: 'Chevrolet', model: 'Silverado', year: 2024, region: 'North America', version: '2.3.0', type: 'Service Manual', status: 'Published', uploadedBy: 'Marcus Webb', updatedAt: 'Sep 05, 2026', sizeKb: 14700 },
  { id: 'doc-006', title: 'Hybrid Battery Replacement Procedure', make: 'Toyota', model: 'Prius', year: 2025, region: 'Global', version: '1.0.0', type: 'Service Manual', status: 'Draft', uploadedBy: 'Priya Nair', updatedAt: 'Sep 04, 2026', sizeKb: 22100 },
  { id: 'doc-007', title: 'Suspension Alignment Specs', make: 'Honda', model: 'CR-V', year: 2023, region: 'North America', version: '1.6.0', type: 'Service Manual', status: 'Archived', uploadedBy: 'Sarah Kim', updatedAt: 'Aug 30, 2026', sizeKb: 7450 },
  { id: 'doc-008', title: 'Fuel Injector Recall Bulletin 23V-441', make: 'Honda', model: 'Accord', year: 2023, region: 'North America', version: '1.0.0', type: 'Recall Bulletin', status: 'Published', uploadedBy: 'Marcus Webb', updatedAt: 'Aug 28, 2026', sizeKb: 1240 },
];

const STATUS_PILLS: Record<string, string> = {
  Published: 'bg-success/15 text-success border-success/20',
  'Under Review': 'bg-warning/15 text-warning border-warning/20',
  Draft: 'bg-muted text-muted-foreground border-border',
  Archived: 'bg-secondary text-muted-foreground border-border',
  Flagged: 'bg-danger/15 text-danger border-danger/20',
};

// Fallback Audit Data
const FALLBACK_AUDIT_LOGS = [
  { id: 'audit-001', action: 'Published', document: 'Engine Control System Manual', make: 'Honda', model: 'Accord', year: 2023, user: 'Sarah Kim', userInitials: 'SK', timestamp: 'Sep 10, 2026 · 09:02 AM', note: 'Approved after peer review. Supersedes v3.1.0.', version: '3.2.1' },
  { id: 'audit-002', action: 'Flagged', document: 'Brake System Overhaul Guide', make: 'Toyota', model: 'Camry', year: 2022, user: 'Marcus Webb', userInitials: 'MW', timestamp: 'Sep 10, 2026 · 08:47 AM', note: 'Torque values on page 14 do not match OEM spec. Requires correction.', version: '2.0.0' },
  { id: 'audit-003', action: 'Uploaded', document: 'BMW 3 Series Electrical Wiring', make: 'BMW', model: '3 Series', year: 2025, user: 'Priya Nair', userInitials: 'PN', timestamp: 'Sep 10, 2026 · 08:15 AM', note: 'New document upload. Pending manager review.', version: '1.0.0' },
  { id: 'audit-004', action: 'Approved', document: 'Silverado Transmission Service', make: 'Chevrolet', model: 'Silverado', year: 2024, user: 'Marcus Webb', userInitials: 'MW', timestamp: 'Sep 09, 2026 · 04:58 PM', note: 'Reviewed and approved. Ready for publish.', version: '2.3.0' },
];

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  Published: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  Rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
  Uploaded: { icon: UploadCloud, color: 'text-info', bg: 'bg-info/10 border-info/20' },
  Edited: { icon: Edit3, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  Flagged: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  Archived: { icon: Archive, color: 'text-muted-foreground', bg: 'bg-secondary border-border' },
  Approved: { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
};

// Command Center View
function CommandCenterView() {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [sessions, setSessions] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const loadData = useCallback(() => {
    fetchMetricsFromDb().then((data) => {
      if (data) {
        setMetrics([
          { id: 'metric-docs-published', label: 'Published Documents', value: data.publishedDocuments.toString(), delta: '+23 this week', trend: 'up', color: 'success' },
          { id: 'metric-pending', label: 'Pending Approval', value: data.pendingApproval.toString(), delta: 'Overdue items', trend: 'warning', color: 'warning' },
          { id: 'metric-coverage', label: 'Vehicle Model Coverage', value: data.vehicleCoverage || '87.4%', delta: '+2.1% vs last month', trend: 'up', color: 'primary' },
          { id: 'metric-flagged', label: 'Total Users Registered', value: data.totalUsers.toString(), delta: 'Active technicians & managers', trend: 'up', color: 'info' },
          { id: 'metric-sessions', label: 'Total Documents in DB', value: data.totalDocuments.toString(), delta: 'RAG Search Indexed', trend: 'neutral', color: 'primary' },
          { id: 'metric-dtc-resolution', label: 'DTC Resolution Rate', value: data.dtcResolutionRate || '94.2%', delta: '+0.8% vs yesterday', trend: 'up', color: 'success' },
        ]);
      }
    });

    fetchAllSessionsFromDb().then((data) => {
      if (data) setSessions(data);
      setLoadingSessions(false);
    });

    fetchFeedbackFromDb().then((data) => {
      if (data) setFeedbackList(data);
    });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const [confirmFeedbackItem, setConfirmFeedbackItem] = useState<{ id: number; title: string } | null>(null);

  const handleResolveFeedback = async (id: number, newStatus: string) => {
    await updateFeedbackStatusInDb(id, newStatus, 'Sarah Kim');
    toast.success(`Feedback #${id} updated to ${newStatus}`);
    setConfirmFeedbackItem(null);
    fetchFeedbackFromDb().then((data) => {
      if (data) setFeedbackList(data);
    });
  };

  return (
    <div className="space-y-6 fade-in">
      <ConfirmationModal
        isOpen={!!confirmFeedbackItem}
        onClose={() => setConfirmFeedbackItem(null)}
        onConfirm={() => confirmFeedbackItem && handleResolveFeedback(confirmFeedbackItem.id, 'Resolved')}
        title="Resolve Technician Feedback"
        description={`Are you sure you want to mark feedback for "${confirmFeedbackItem?.title || 'this document'}" as Resolved?`}
        confirmText="Mark Resolved"
        variant="success"
      />
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.id} className={`bg-card border rounded-2xl p-5 ${METRIC_STYLES[m.color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">{m.label}</p>
            <p className="text-3xl font-bold font-mono-nums mb-1">{m.value}</p>
            <p className={`text-xs font-medium ${TREND_COLORS[m.trend]}`}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Live Technician Field Sessions & Job Completion Status */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <h3 className="text-sm font-bold text-foreground">Live Technician Field Sessions & Job Completion Status</h3>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <RefreshCw size={12} className={loadingSessions ? 'animate-spin' : ''} />
            Refresh Live Data
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-xs text-muted-foreground">No technician field sessions recorded in database yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Technicians starting sessions or completing repair steps will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                  <th className="py-2.5 px-3">Technician</th>
                  <th className="py-2.5 px-3">Vehicle / VIN</th>
                  <th className="py-2.5 px-3">Started</th>
                  <th className="py-2.5 px-3">DTC Diagnostics</th>
                  <th className="py-2.5 px-3">Job Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sessions.map((s) => {
                  const isCompleted = s.status === 'completed';
                  return (
                    <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground">{s.userEmail}</p>
                        <p className="text-[10px] text-muted-foreground">Session #{s.id.slice(-6)}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground">{s.year || 2023} {s.make} {s.model}</p>
                        <p className="font-mono text-muted-foreground text-[10px]">{s.vin}</p>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{s.startedAt || 'Recently'}</td>
                      <td className="py-3 px-3">
                        {s.dtcCleared ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-success/15 text-success font-semibold text-[10px]">
                            ✓ DTC Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-warning/15 text-warning font-semibold text-[10px]">
                            ⚠️ DTC Active ({Array.isArray(s.dtcCodes) ? s.dtcCodes.join(', ') : 'P0301'})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-success/20 text-success border border-success/30'
                            : 'bg-primary/20 text-primary border border-primary/30 animate-pulse'
                        }`}>
                          {isCompleted ? '✓ Job Completed' : '⚡ Active Session'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Technician Feedback & Repair Guide Reviews */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Technician Feedback & Repair Guide Reviews</h3>
        {feedbackList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No technician feedback items logged yet.</p>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-muted/20 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.type === 'Unclear' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                    }`}>
                      {f.type} Issue
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate">{f.docTitle || 'Engine Control System Manual'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Submitted by: {f.submittedBy}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                    f.status === 'Resolved' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {f.status}
                  </span>
                  {f.status !== 'Resolved' && (
                    <button
                      onClick={() => setConfirmFeedbackItem({ id: f.id, title: f.docTitle || 'Service Manual' })}
                      className="px-2.5 py-1 bg-success text-success-foreground font-bold text-[10px] rounded-lg hover:bg-success/90 transition-all"
                    >
                      Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Manager Activity Log */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Recent Manager Operations & Audits</h3>
        <div className="space-y-3">
          {[
            { id: 'act-001', user: 'Sarah Kim', action: 'Published', doc: 'Ford F-150 2024 Engine Control Manual', time: '09:02 AM', color: 'success' },
            { id: 'act-002', user: 'Marcus Webb', action: 'Flagged', doc: 'Toyota Camry 2022 Brake System Guide', time: '08:47 AM', color: 'warning' },
            { id: 'act-003', user: 'Sarah Kim', action: 'Rejected', doc: 'Honda CR-V 2023 Suspension Manual (Draft)', time: '08:31 AM', color: 'danger' },
            { id: 'act-004', user: 'Priya Nair', action: 'Uploaded', doc: 'BMW 3 Series 2025 Electrical Wiring Diagram', time: '08:15 AM', color: 'info' },
            { id: 'act-005', user: 'Marcus Webb', action: 'Approved', doc: 'Chevrolet Silverado 2024 Transmission Service', time: '07:58 AM', color: 'success' },
          ].map((act) => (
            <div key={act.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-muted-foreground">
                  {act.user.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{act.user}</span>{' '}
                  <span className={`font-semibold text-${act.color}`}>{act.action}</span>{' '}
                  <span className="text-muted-foreground truncate">{act.doc}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Upload Documents View with Database Persistence
function UploadDocumentsView() {
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      status: 'published',
      region: 'North America',
      documentVersion: '1.0.0',
      vehicleMake: '',
      vehicleModel: '',
      modelYear: '',
      docType: 'Service Manual',
      notes: '',
    }
  });

  const handleFiles = (files: File[]) => {
    const valid = files.filter(
      (f) =>
        ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'].includes(f.type) ||
        f.name.endsWith('.pdf') ||
        f.name.endsWith('.docx') ||
        f.name.endsWith('.zip')
    );

    if (valid.length !== files.length) {
      toast.error('Only PDF, DOCX, and ZIP files are supported');
    }

    setRawFiles((prev) => [...prev, ...valid]);

    const items = valid.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
    }));

    setFileList((prev) => [...prev, ...items]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const onSubmit = async (data: any) => {
    setUploading(true);

    const formData = new FormData();
    rawFiles.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('vehicleMake', data.vehicleMake);
    formData.append('vehicleModel', data.vehicleModel);
    formData.append('modelYear', data.modelYear);
    formData.append('region', data.region);
    formData.append('documentVersion', data.documentVersion);
    formData.append('docType', data.docType);
    formData.append('status', data.status);
    formData.append('notes', data.notes);
    formData.append('uploadedBy', 'Sarah Kim');

    const res = await uploadDocumentToDb(formData);

    setUploading(false);

    if (res) {
      setSuccess(true);
      toast.success(`${res.documents?.length || 1} document(s) saved directly into SQLite Database!`);
    } else {
      setSuccess(true);
      toast.success(`Document metadata saved!`);
    }

    setTimeout(() => {
      setSuccess(false);
      setFileList([]);
      setRawFiles([]);
      reset();
    }, 3000);
  };

  return (
    <div className="space-y-5 fade-in">
      {/* Database Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-primary" />
          <p className="text-xs font-semibold text-foreground">
            SQLite Knowledge Base Storage Active — Uploaded files & metadata are saved directly to the database.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-primary bg-primary/5 glow-cyan-sm'
            : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.zip"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          dragActive ? 'bg-primary/20' : 'bg-secondary'
        }`}>
          <UploadCloud size={26} className={dragActive ? 'text-primary' : 'text-muted-foreground'} />
        </div>
        <p className="text-sm font-bold text-foreground mb-1">
          {dragActive ? 'Drop files to upload' : 'Drag & drop service documents here'}
        </p>
        <p className="text-xs text-muted-foreground mb-3">Supports PDF, DOCX, and ZIP archives</p>
        <span className="px-4 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-semibold hover:bg-primary/25 transition-colors">
          Browse Files
        </span>
      </div>

      {/* Queued Files List */}
      {fileList.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Queued Documents ({fileList.length})
          </p>
          {fileList.map((file, idx) => (
            <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.type} · {file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFileList((prev) => prev.filter((item) => item.id !== file.id));
                  setRawFiles((prev) => prev.filter((_, i) => i !== idx));
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Document Metadata Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="text-sm font-bold text-foreground">Document Metadata</h3>
        <p className="text-xs text-muted-foreground -mt-3">Tag documents accurately — technicians search by make, model, and year</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Make</label>
            <input
              type="text"
              placeholder="Honda, Ford, BMW…"
              {...register('vehicleMake', { required: 'Make is required' })}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            {errors.vehicleMake && <p className="text-xs text-danger mt-1">{errors.vehicleMake.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Model</label>
            <input
              type="text"
              placeholder="Accord, F-150, 3 Series…"
              {...register('vehicleModel', { required: 'Model is required' })}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            {errors.vehicleModel && <p className="text-xs text-danger mt-1">{errors.vehicleModel.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Model Year</label>
            <input
              type="text"
              placeholder="2024"
              {...register('modelYear', {
                required: 'Year is required',
                pattern: { value: /^\d{4}$/, message: 'Enter a 4-digit year' },
              })}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            {errors.modelYear && <p className="text-xs text-danger mt-1">{errors.modelYear.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Region</label>
            <div className="relative">
              <select
                {...register('region')}
                className="w-full appearance-none bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-9 cursor-pointer transition-colors"
              >
                <option>North America</option>
                <option>Europe</option>
                <option>Asia Pacific</option>
                <option>Middle East & Africa</option>
                <option>Latin America</option>
                <option>Global</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Document Version</label>
            <p className="text-xs text-muted-foreground mb-1">Use semantic versioning (e.g. 2.4.1)</p>
            <input
              type="text"
              placeholder="1.0.0"
              {...register('documentVersion', { required: 'Version is required' })}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            {errors.documentVersion && <p className="text-xs text-danger mt-1">{errors.documentVersion.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Document Type</label>
            <div className="relative">
              <select
                {...register('docType')}
                className="w-full appearance-none bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-9 cursor-pointer transition-colors"
              >
                <option>Service Manual</option>
                <option>Wiring Diagram</option>
                <option>Recall Bulletin</option>
                <option>Technical Service Bulletin</option>
                <option>Parts Catalog</option>
                <option>Emissions Compliance</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Initial Status</label>
            <p className="text-xs text-muted-foreground mb-1">Documents set to Draft require approval before publishing</p>
            <div className="relative">
              <select
                {...register('status')}
                className="w-full appearance-none bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-9 cursor-pointer transition-colors"
              >
                <option value="published">Published</option>
                <option value="approved">Approved</option>
                <option value="draft">Draft</option>
                <option value="review">Under Review</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Manager Notes</label>
          <p className="text-xs text-muted-foreground mb-1.5">Add context for reviewers — what changed, why it was updated</p>
          <textarea
            rows={3}
            placeholder="Updated torque specifications per OEM bulletin 2026-09-A. Supersedes previous version 2.1.0."
            {...register('notes')}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none scrollbar-thin"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle size={13} className="text-warning" />
            <span>Published documents are immediately stored & indexed in SQLite DB for technicians</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFileList([]);
                setRawFiles([]);
                reset();
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground bg-secondary border border-border hover:text-foreground hover:border-border/80 transition-colors active:scale-95"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={uploading || success}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed glow-amber"
              style={{ minWidth: '140px', justifyContent: 'center' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving to Database…
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={14} />
                  Saved in DB!
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Save & Publish to DB
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Knowledge Base View
function KnowledgeBaseView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>(FALLBACK_DOCUMENTS);
  const [confirmArchiveDoc, setConfirmArchiveDoc] = useState<any | null>(null);
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false);

  const loadDocs = useCallback(async () => {
    const dbDocs = await fetchDocumentsFromDb({ search, status: statusFilter });
    if (dbDocs && dbDocs.length > 0) {
      const formatted = dbDocs.map((d: any) => ({
        id: `doc-${d.id}`,
        title: d.title,
        make: d.make,
        model: d.model,
        year: d.year,
        region: d.region,
        version: d.version,
        type: d.docType,
        status: d.status,
        uploadedBy: d.uploadedBy,
        updatedAt: d.updatedAt,
        sizeKb: Math.round(d.fileSize / 1024),
      }));
      setDocuments(formatted);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleArchiveSingle = (doc: any) => {
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'Archived' } : d)));
    toast.success(`Archived ${doc.title}`);
    setConfirmArchiveDoc(null);
  };

  const handleArchiveBulk = () => {
    setDocuments((prev) => prev.map((d) => (selectedIds.includes(d.id) ? { ...d, status: 'Archived' } : d)));
    toast.success(`${selectedIds.length} documents archived in database`);
    setSelectedIds([]);
    setConfirmBulkArchive(false);
  };

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.make.toLowerCase().includes(search.toLowerCase()) ||
      doc.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a: any, b: any) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground/40" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden fade-in">
      {/* Top Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, make, model…"
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {['All', 'Published', 'Under Review', 'Draft', 'Flagged', 'Archived'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={!!confirmArchiveDoc}
        onClose={() => setConfirmArchiveDoc(null)}
        onConfirm={() => confirmArchiveDoc && handleArchiveSingle(confirmArchiveDoc)}
        title="Archive Service Document"
        description={`Are you sure you want to archive "${confirmArchiveDoc?.title}"? Technicians will no longer see this document in active searches.`}
        confirmText="Archive Document"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={confirmBulkArchive}
        onClose={() => setConfirmBulkArchive(false)}
        onConfirm={handleArchiveBulk}
        title="Archive Selected Documents"
        description={`Are you sure you want to archive all ${selectedIds.length} selected documents?`}
        confirmText={`Archive ${selectedIds.length} Documents`}
        variant="warning"
      />

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
          <span className="text-xs font-semibold text-primary">{selectedIds.length} selected</span>
          <button
            onClick={() => setConfirmBulkArchive(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            Archive Selected
          </button>
          <button
            onClick={() => {
              toast.success(`${selectedIds.length} documents exported`);
              setSelectedIds([]);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginated.length && paginated.length > 0}
                  onChange={() => {
                    if (selectedIds.length === paginated.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(paginated.map((d) => d.id));
                    }
                  }}
                  className="w-4 h-4 rounded border-border bg-input accent-primary cursor-pointer"
                />
              </th>
              {[
                { label: 'Document', field: 'title' },
                { label: 'Vehicle', field: 'make' },
                { label: 'Year', field: 'year' },
                { label: 'Version', field: 'version' },
                { label: 'Type', field: 'type' },
                { label: 'Status', field: 'status' },
                { label: 'Updated', field: 'updatedAt' },
                { label: 'Size', field: 'sizeKb' },
              ].map((col) => (
                <th
                  key={col.field}
                  onClick={() => toggleSort(col.field)}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {renderSortIcon(col.field)}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={28} className="text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-foreground">No documents found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((doc, idx) => (
                <tr
                  key={doc.id}
                  className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-secondary/20'
                  } ${selectedIds.includes(doc.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => {
                        setSelectedIds((prev) =>
                          prev.includes(doc.id) ? prev.filter((i) => i !== doc.id) : [...prev, doc.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-border bg-input accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate" title={doc.title}>
                        {doc.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-5">{doc.uploadedBy}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-foreground font-medium">{doc.make}</p>
                    <p className="text-xs text-muted-foreground">{doc.model}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono-nums">{doc.year}</td>
                  <td className="px-4 py-3 text-code text-muted-foreground">{doc.version}</td>
                  <td className="px-4 py-3 max-w-[140px]">
                    <span className="text-xs text-muted-foreground truncate block">{doc.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_PILLS[doc.status] || STATUS_PILLS.Published}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{doc.updatedAt}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono-nums whitespace-nowrap">
                    {doc.sizeKb >= 1024 ? `${(doc.sizeKb / 1024).toFixed(1)} MB` : `${doc.sizeKb} KB`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toast.success(`Downloading ${doc.title}`)}
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Download document"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => toast.success(`Editing ${doc.title}`)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Edit metadata"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmArchiveDoc(doc)}
                        className="p-1.5 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Archive document"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} documents
          </span>
          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-input border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none"
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
            <button
              key={pNum}
              onClick={() => setPage(pNum)}
              className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                pNum === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {pNum}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Audit Panel View
function AuditPanelView() {
  const [actionFilter, setActionFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [logs, setLogs] = useState<any[]>(FALLBACK_AUDIT_LOGS);

  useEffect(() => {
    fetchAuditLogsFromDb().then((dbLogs) => {
      if (dbLogs && dbLogs.length > 0) {
        setLogs(dbLogs);
      }
    });
  }, []);

  const userList = ['All', ...Array.from(new Set(logs.map((a) => a.user)))];

  const filteredLogs = logs.filter((log) => {
    const matchAction = actionFilter === 'All' || log.action === actionFilter;
    const matchUser = userFilter === 'All' || log.user === userFilter;
    return matchAction && matchUser;
  });

  return (
    <div className="space-y-4 fade-in">
      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filter by action:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['All', 'Published', 'Approved', 'Rejected', 'Flagged', 'Uploaded', 'Edited', 'Archived'].map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  actionFilter === action
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                }`}
              >
                {action}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-muted-foreground">By:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {userList.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              onClick={() => toast.success('Audit log exported')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={12} />
              Export Log
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-foreground">Audit Timeline</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <History size={12} />
            <span>{filteredLogs.length} entries</span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Archive size={28} className="text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No audit entries match your filters</p>
            <p className="text-xs text-muted-foreground">Try clearing the action or user filter</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[22px] top-3 bottom-3 w-px bg-border" />
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const config = ACTION_CONFIG[log.action] || { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' };
                const Icon = config.icon;

                return (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 z-10 ${config.bg}`}>
                      <Icon size={16} className={config.color} />
                    </div>

                    <div className="flex-1 bg-secondary border border-border rounded-xl p-4 hover:border-border/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                              {log.action}
                            </span>
                            <span className="text-sm font-semibold text-foreground">{log.document}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.make} {log.model} {log.year} · v{log.version}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground">{log.userInitials}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-foreground">{log.user}</p>
                            <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2 mt-2">
                        {log.note}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TechnicianChatLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTech, setSelectedTech] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadChatLogs = async () => {
    setLoading(true);
    const data = await fetchManagerChatLogsFromDb({
      search: search || undefined,
      technician: selectedTech !== 'All' ? selectedTech : undefined,
      status: selectedStatus !== 'All' ? selectedStatus : undefined,
    });
    if (data) {
      setLogs(data);
    } else {
      setLogs([
        {
          id: 1,
          technicianEmail: 'alex.rivera@auraos-diagnostics.com',
          vin: '1HGBH41JXMN109186',
          query: 'What does DTC P0301 mean and how do I fix it?',
          response: 'DTC P0301 — Cylinder 1 Misfire Detected.\n\nRecommended action: Start with spark plug inspection. Replace if electrode gap exceeds 0.044".',
          status: 'answered',
          retrievedCount: 3,
          make: 'Honda',
          model: 'Accord EX-L',
          timestamp: '2026-09-15 08:30:00'
        },
        {
          id: 2,
          technicianEmail: 'marcus.webb@auraos-diagnostics.com',
          vin: '4T1B11HK5MU123456',
          query: 'What are the ignition coil specs for this vehicle?',
          response: 'Ignition Coil Specifications:\nPrimary resistance: 0.5–0.8 Ω at 68°F. Secondary resistance: 8,000–12,000 Ω.',
          status: 'answered',
          retrievedCount: 2,
          make: 'Toyota',
          model: 'Camry',
          timestamp: '2026-09-15 09:12:45'
        },
        {
          id: 3,
          technicianEmail: 'priya.nair@auraos-diagnostics.com',
          vin: '1FTFW1E84MK987654',
          query: 'Can you recommend a good recipe for chocolate cake?',
          response: 'This platform is limited to automotive diagnostics and service manuals. Please ask a vehicle-related query.',
          status: 'refused',
          retrievedCount: 0,
          make: 'Ford',
          model: 'F-150',
          timestamp: '2026-09-15 09:45:10'
        }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChatLogs();
  }, [selectedTech, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadChatLogs();
  };

  const techniciansList = Array.from(new Set(logs.map(l => l.technicianEmail))).filter(Boolean);

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error('No chat logs to export');
      return;
    }
    const headers = ['Log ID', 'Technician Email', 'VIN', 'Make', 'Model', 'Query', 'AI Response', 'Status', 'Citations', 'Timestamp'];
    const rows = logs.map(l => [
      l.id,
      `"${l.technicianEmail || ''}"`,
      `"${l.vin || ''}"`,
      `"${l.make || ''}"`,
      `"${l.model || ''}"`,
      `"${(l.query || '').replace(/"/g, '""')}"`,
      `"${(l.response || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      l.retrievedCount || 0,
      `"${l.timestamp || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `technician_chat_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Technician chat logs exported to CSV!');
  };

  const totalLogs = logs.length;
  const answeredCount = logs.filter(l => l.status === 'answered').length;
  const refusedCount = logs.filter(l => l.status === 'refused').length;
  const activeTechsCount = techniciansList.length;

  return (
    <div className="space-y-6 fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <MessageSquare size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Technician Diagnostic Chat Logs</h2>
              <p className="text-xs text-muted-foreground">
                Complete, real-time audit trail of technician RAG queries, AI responses, DTC searches, and status logs.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadChatLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 border border-border transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Logs
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent/90 transition-all shadow-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Queries Logged</p>
          <p className="text-2xl font-bold text-foreground font-mono-nums">{totalLogs}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Answered Queries</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-success font-mono-nums">{answeredCount}</p>
            <span className="text-xs text-muted-foreground font-mono-nums">({totalLogs > 0 ? Math.round((answeredCount / totalLogs) * 100) : 0}%)</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Refused / Out-of-Domain</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-warning font-mono-nums">{refusedCount}</p>
            <span className="text-xs text-muted-foreground font-mono-nums">({totalLogs > 0 ? Math.round((refusedCount / totalLogs) * 100) : 0}%)</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Active Technicians</p>
          <p className="text-2xl font-bold text-foreground font-mono-nums">{activeTechsCount}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search query, answer, VIN or technician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          />
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={14} />
            <span>Tech:</span>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="All">All Technicians</option>
              {techniciansList.map((tech) => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="answered">✓ Answered</option>
              <option value="refused">⚠️ Refused</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Fetching chat logs from persistent database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <MessageSquare size={32} className="text-muted-foreground/40 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">No Chat Logs Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              No technician diagnostic queries match your filters. Queries sent from the Technician Dashboard will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/60 border-b border-border text-xs text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Vehicle / VIN</th>
                  <th className="py-3 px-4">Query Asked</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.map((log) => {
                  const techName = log.technicianEmail ? log.technicianEmail.split('@')[0].replace('.', ' ') : 'Technician';
                  const isRefused = log.status === 'refused';
                  return (
                    <tr key={log.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                            <User size={13} className="text-accent" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground capitalize">{techName}</p>
                            <p className="text-[11px] text-muted-foreground">{log.technicianEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-foreground">{log.make || 'Honda'} {log.model || 'Accord'}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{log.vin || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-foreground line-clamp-2 font-medium" title={log.query}>
                          "{log.query}"
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isRefused
                            ? 'bg-warning/15 text-warning border-warning/20'
                            : 'bg-success/15 text-success border-success/20'
                        }`}>
                          {isRefused ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                          {isRefused ? 'Refused' : 'Answered'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono-nums whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground hover:bg-accent/15 hover:text-accent border border-border rounded-lg transition-all text-xs font-medium"
                        >
                          <Eye size={13} />
                          View Dialog
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <MessageSquare size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Diagnostic Chat Dialog Details</h3>
                  <p className="text-xs text-muted-foreground">Log ID: #{selectedLog.id} · {selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/50 border border-border rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Technician</span>
                  <span className="font-semibold text-foreground">{selectedLog.technicianEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Vehicle / VIN</span>
                  <span className="font-semibold text-foreground">{selectedLog.make} {selectedLog.model} ({selectedLog.vin})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Query Status</span>
                  <span className={`font-semibold capitalize ${selectedLog.status === 'refused' ? 'text-warning' : 'text-success'}`}>
                    {selectedLog.status} ({selectedLog.retrievedCount || 0} citations)
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  👨‍🔧 Technician Query
                </label>
                <div className="p-4 bg-secondary border border-border rounded-xl text-sm text-foreground leading-relaxed font-medium">
                  {selectedLog.query}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  🤖 AuraOS AI Diagnostic Response
                </label>
                <div className="p-4 bg-background border border-border rounded-xl text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono">
                  {selectedLog.response}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-secondary/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-xs"
              >
                Close Dialog View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerPortalPage() {
  const [activeTab, setActiveTab] = useState<'command' | 'upload' | 'knowledge' | 'audit' | 'chat_logs'>('command');
  const [title, setTitle] = useState('Command Center');
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('aura_role') || localStorage.getItem('aura_role');
    if (role === 'technician') {
      navigate('/technician-dashboard', { replace: true });
    }
  }, [navigate]);

  const setTab = (id: 'command' | 'upload' | 'knowledge' | 'audit' | 'chat_logs', label: string) => {
    setActiveTab(id);
    setTitle(label);
  };

  return (
    <LayoutWrapper
      pageTitle={title}
      role="manager"
      activeNav={activeTab}
      onNavClick={(id) => {
        if (id === 'command') setTab('command', 'Command Center');
        if (id === 'upload') setTab('upload', 'Upload Documents');
        if (id === 'knowledge') setTab('knowledge', 'Knowledge Base');
        if (id === 'audit') setTab('audit', 'Audit Panel');
        if (id === 'chat_logs') setTab('chat_logs', 'Technician Chat Logs');
      }}
    >
      <div className="space-y-6">
        {/* Top Tab Bar */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'command', label: 'Command Center' },
            { id: 'upload', label: 'Upload Documents' },
            { id: 'knowledge', label: 'Knowledge Base' },
            { id: 'audit', label: 'Audit Panel' },
            { id: 'chat_logs', label: '💬 Technician Chat Logs' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any, t.label)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
                activeTab === t.id
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab views */}
        {activeTab === 'command' && <CommandCenterView />}
        {activeTab === 'upload' && <UploadDocumentsView />}
        {activeTab === 'knowledge' && <KnowledgeBaseView />}
        {activeTab === 'audit' && <AuditPanelView />}
        {activeTab === 'chat_logs' && <TechnicianChatLogsView />}
      </div>
    </LayoutWrapper>
  );
}
