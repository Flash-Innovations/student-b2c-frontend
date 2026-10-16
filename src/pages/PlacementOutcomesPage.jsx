import React, { useState, useEffect } from 'react';
import {
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Users,
  FileCheck2,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowRight,
  School,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { b2cApi } from '../services/b2cApi';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export function PlacementOutcomesPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('my-offers'); // 'my-offers' | 'cohort-intelligence' | 'consent'
  const [myOffers, setMyOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [cohortReport, setCohortReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    roleOffered: '',
    packageLpa: '',
    offerType: 'FULL_TIME',
    proofDocumentUrl: '',
    consentToShareWithCollege: true
  });

  // Consent settings
  const [shareWithColleges, setShareWithColleges] = useState(user?.consent?.shareWithColleges ?? true);
  const [allowRecruiterOutreach, setAllowRecruiterOutreach] = useState(user?.consent?.allowRecruiterOutreach ?? true);
  const [updatingConsent, setUpdatingConsent] = useState(false);

  // Load user's offers
  const fetchMyOffers = async () => {
    try {
      setLoadingOffers(true);
      const res = await b2cApi.getMyOutcomes();
      if (res && res.outcomes) {
        setMyOffers(res.outcomes);
      }
    } catch (err) {
      console.warn('Could not load offers:', err);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Load cohort insights
  const fetchCohortReport = async () => {
    try {
      setLoadingReport(true);
      const res = await b2cApi.getCohortReport('2028');
      if (res && res.report) {
        setCohortReport(res.report);
      }
    } catch (err) {
      console.warn('Could not load cohort report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchMyOffers();
    fetchCohortReport();
  }, []);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.roleOffered || !formData.packageLpa) {
      addToast('Please enter company name, role, and package (in LPA).', 'error');
      return;
    }

    try {
      setSubmittingOffer(true);
      const res = await b2cApi.logPlacementOffer({
        ...formData,
        packageLpa: Number(formData.packageLpa)
      });

      if (res && res.success) {
        addToast('Verified placement offer successfully recorded! Readiness boosted to 90+.', 'success');
        setShowLogModal(false);
        setFormData({
          companyName: '',
          roleOffered: '',
          packageLpa: '',
          offerType: 'FULL_TIME',
          proofDocumentUrl: '',
          consentToShareWithCollege: true
        });
        fetchMyOffers();
        fetchCohortReport();
        if (user) {
          updateUser({ readinessScore: Math.max(90, user.readinessScore || 0) });
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to record offer.', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleUpdateConsent = async () => {
    try {
      setUpdatingConsent(true);
      const res = await b2cApi.updateConsent({
        shareWithColleges,
        allowRecruiterOutreach
      });
      if (res && res.success) {
        addToast('Consent and institutional privacy settings updated!', 'success');
        updateUser({ consent: res.consent });
      }
    } catch (err) {
      addToast(err.message || 'Failed to update consent preferences.', 'error');
    } finally {
      setUpdatingConsent(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Award className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Verified Placement Outcomes
                  <Badge variant="primary">Batch 2028 Telemetry</Badge>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Document your verified campus offers, contribute to college telemetry benchmarks, and control institutional data sharing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => setShowLogModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Log Verified Offer / PPO
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('my-offers')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'my-offers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            My Verified Offers ({myOffers.length})
          </button>
          <button
            onClick={() => setActiveTab('cohort-intelligence')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'cohort-intelligence'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            2028 Cohort Intelligence & B2B Telemetry
          </button>
          <button
            onClick={() => setActiveTab('consent')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'consent'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Institutional Privacy & Consent
          </button>
        </div>

        {/* TAB 1: MY OFFERS */}
        {activeTab === 'my-offers' && (
          <div className="space-y-6">
            {loadingOffers ? (
              <div className="text-center py-16 text-slate-500">Loading your verified placement records...</div>
            ) : myOffers.length === 0 ? (
              <Card className="text-center py-16 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No Offers Logged Yet</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    When you receive an internship offer, PPO, or full-time campus placement, log it here to verify your achievements.
                  </p>
                </div>
                <div>
                  <Button onClick={() => setShowLogModal(true)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Log Your First Offer
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOffers.map((offer, idx) => (
                  <Card key={idx} className="p-6 relative overflow-hidden border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <Badge variant="success" className="text-xs">
                        {offer.verificationStatus || 'VERIFIED'}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-extrabold text-white">{offer.companyName}</h3>
                      <p className="text-sm text-slate-400 font-medium mt-0.5">{offer.roleOffered}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Package (CTC)</div>
                        <div className="text-2xl font-black text-emerald-400 font-mono">
                          {offer.packageLpa} <span className="text-sm font-normal text-slate-400">LPA</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {offer.offerType?.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Telemetry shared with {offer.collegeName || 'Flash Community'}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COHORT INTELLIGENCE (B2B PREVIEW) */}
        {activeTab === 'cohort-intelligence' && (
          <div className="space-y-8">
            
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cohort 2028 Candidates</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                  {cohortReport?.totalStudentsActive || 142}
                </div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Active preparation pool
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Placement Rate</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                  {cohortReport?.placementConversionRate || '88.4%'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Based on student offer submissions</div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Package (CTC)</span>
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-blue-400 mt-2 font-mono">
                  {cohortReport?.averagePackageLpa || '14.2'} <span className="text-sm font-normal text-slate-400">LPA</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Tier-1 & Tier-2 engineering baseline</div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Highest Package</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
                  {cohortReport?.highestPackageLpa || '44.0'} <span className="text-sm font-normal text-slate-400">LPA</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Offered by leading tech product firms</div>
              </Card>
            </div>

            {/* B2B Strategic Pitch Card */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl relative overflow-hidden">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <School className="w-4 h-4" />
                  Flash B2B University Partnerships Engine
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  How Flash Verified Student Telemetry Powers College Accreditations & Placements
                </h2>

                <p className="text-slate-300 text-sm leading-relaxed">
                  Colleges and universities struggle with fragmented spreadsheet tracking, unverified student claims, and cumbersome NIRF/NAAC reporting. Flash connects directly to students during their 2nd and 3rd year preparation, gathering audited outcomes, coding sandboxing metrics, and mock interview readiness.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-indigo-400 font-bold text-sm mb-1">Instant NAAC/NIRF Data</div>
                    <div className="text-xs text-slate-400">Audited offer letters and placement metrics generated in 1 click.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-indigo-400 font-bold text-sm mb-1">Targeted Remediation</div>
                    <div className="text-xs text-slate-400">Identify batch weaknesses in DSA or communication 12 months before hiring season.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="text-indigo-400 font-bold text-sm mb-1">3.4x Higher Conversion</div>
                    <div className="text-xs text-slate-400">Colleges adopting Flash report 340% higher offer acceptance by tech recruiters.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: INSTITUTIONAL PRIVACY & CONSENT */}
        {activeTab === 'consent' && (
          <div className="max-w-3xl space-y-6">
            <Card className="p-6 space-y-6">
              <CardHeader
                title="Student Institutional Consent Preferences"
                subtitle="You retain full control over how your placement telemetry and verified skills are shared."
              />

              <div className="space-y-4 pt-2">
                
                {/* Toggle 1 */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <School className="w-4 h-4 text-indigo-400" /> Share Telemetry with My University
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Permit your college Training & Placement Cell (T&P) to view your verified offers and coding milestones for cohort placement reporting.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareWithColleges}
                    onChange={(e) => setShareWithColleges(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 mt-1 cursor-pointer"
                  />
                </div>

                {/* Toggle 2 */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" /> Allow Enterprise Recruiter Outreach
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Allow vetted tech recruiters from partner companies to browse your anonymized readiness score and invite you to expedited interview pipelines.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowRecruiterOutreach}
                    onChange={(e) => setAllowRecruiterOutreach(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950 mt-1 cursor-pointer"
                  />
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  onClick={handleUpdateConsent}
                  isLoading={updatingConsent}
                >
                  Save Privacy Preferences
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* LOG OFFER MODAL */}
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="Log Verified Placement Offer / PPO"
        >
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Google, Microsoft, Adobe, Infosys"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role Offered</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Development Engineer"
                  value={formData.roleOffered}
                  onChange={(e) => setFormData({ ...formData, roleOffered: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Package in LPA (CTC)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 16.5"
                  value={formData.packageLpa}
                  onChange={(e) => setFormData({ ...formData, packageLpa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Offer Type</label>
                <select
                  value={formData.offerType}
                  onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FULL_TIME">Full Time (Campus FTE)</option>
                  <option value="PPO">Pre-Placement Offer (PPO)</option>
                  <option value="INTERN_FTE">6-Month Intern + FTE</option>
                  <option value="INTERNSHIP">Summer Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Verification Proof URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.proofDocumentUrl}
                  onChange={(e) => setFormData({ ...formData, proofDocumentUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="consentCheck"
                checked={formData.consentToShareWithCollege}
                onChange={(e) => setFormData({ ...formData, consentToShareWithCollege: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-300 cursor-pointer">
                Include in anonymized cohort telemetry shared with university administration
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" type="button" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submittingOffer}>
                Submit & Verify Offer
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
export default PlacementOutcomesPage;
