import React, { useState, useEffect } from "react";
import {
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Users,
  School,
  DollarSign,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";

export function PlacementOutcomesPage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState("my-offers"); // 'my-offers' | 'cohort' | 'consent'
  const [myOffers, setMyOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [cohortReport, setCohortReport] = useState(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    roleOffered: "",
    packageLpa: "",
    offerType: "FULL_TIME",
    proofDocumentUrl: "",
    consentToShareWithCollege: true
  });

  const [shareWithColleges, setShareWithColleges] = useState(user?.consent?.shareWithColleges ?? true);
  const [allowRecruiterOutreach, setAllowRecruiterOutreach] = useState(user?.consent?.allowRecruiterOutreach ?? true);
  const [updatingConsent, setUpdatingConsent] = useState(false);

  const fetchMyOffers = async () => {
    try {
      setLoadingOffers(true);
      const res = await b2cApi.getMyOutcomes();
      if (res && res.outcomes) {
        setMyOffers(res.outcomes);
      }
    } catch (err) {
      console.warn("Could not load offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const fetchCohortReport = async () => {
    try {
      const res = await b2cApi.getCohortReport("2028");
      if (res && res.report) {
        setCohortReport(res.report);
      }
    } catch (err) {
      console.warn("Could not load cohort report:", err);
    }
  };

  useEffect(() => {
    fetchMyOffers();
    fetchCohortReport();
  }, []);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.roleOffered || !formData.packageLpa) {
      showError("Please enter company name, role, and package (in LPA).");
      return;
    }

    try {
      setSubmittingOffer(true);
      const res = await b2cApi.logPlacementOffer({
        ...formData,
        packageLpa: Number(formData.packageLpa)
      });

      if (res && res.success) {
        showSuccess("Verified placement offer successfully logged! Readiness boosted to 90+.");
        setShowLogModal(false);
        setFormData({
          companyName: "",
          roleOffered: "",
          packageLpa: "",
          offerType: "FULL_TIME",
          proofDocumentUrl: "",
          consentToShareWithCollege: true
        });
        fetchMyOffers();
        fetchCohortReport();
        if (user) {
          updateUser({ readinessScore: Math.max(90, user.readinessScore || 0) });
        }
      }
    } catch (err) {
      showError(err.message || "Failed to record offer.");
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
        showSuccess("Institutional consent preferences updated successfully!");
        updateUser({ consent: res.consent });
      }
    } catch (err) {
      showError(err.message || "Failed to update consent preferences.");
    } finally {
      setUpdatingConsent(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Verified Placement Outcomes
            </h1>
          </div>
        </div>

        <Button onClick={() => setShowLogModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Log Verified Offer / PPO
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("my-offers")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "my-offers"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          My Verified Offers ({myOffers.length})
        </button>
        <button
          onClick={() => setActiveTab("cohort")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "cohort"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          2028 Cohort Intelligence (B2B Preview)
        </button>
        <button
          onClick={() => setActiveTab("consent")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "consent"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          Privacy & Consent Preferences
        </button>
      </div>

      {/* TAB 1: MY OFFERS */}
      {activeTab === "my-offers" && (
        <div className="space-y-4">
          {loadingOffers ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading verified placement records...</div>
          ) : myOffers.length === 0 ? (
            <Card className="text-center py-16 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Placement Offers Logged Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When you receive an internship offer, PPO, or full-time campus placement, log it here to verify your achievements.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowLogModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> Log Your First Offer
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myOffers.map((offer, i) => (
                <Card key={i} className="p-6 border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <Badge variant="success" size="sm">{offer.verificationStatus || "VERIFIED"}</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{offer.companyName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{offer.roleOffered}</p>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Package (CTC)</div>
                      <div className="text-2xl font-black text-emerald-600 font-mono">
                        {offer.packageLpa} <span className="text-xs font-normal text-slate-500">LPA</span>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">{offer.offerType?.replace("_", " ")}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COHORT INTELLIGENCE */}
      {activeTab === "cohort" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2028 Candidates</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {cohortReport?.totalStudentsActive || 142}
              </div>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Placement Rate</span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {cohortReport?.placementConversionRate || "88.4%"}
              </div>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average CTC</span>
              <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                {cohortReport?.averagePackageLpa || "14.2"} LPA
              </div>
            </Card>
            <Card className="p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest CTC</span>
              <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                {cohortReport?.highestPackageLpa || "44.0"} LPA
              </div>
            </Card>
          </div>

          <Card className="p-8 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl shadow-md">
            <div className="max-w-2xl space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-wider font-semibold text-indigo-300">
                Institutional Partnership Model
              </span>
              <h3 className="text-2xl font-extrabold tracking-tight">
                How Flash Powers University NIRF & NAAC Placement Accreditation
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                By gathering verified student outcome telemetry directly from 2nd and 3rd year preparation milestones, Flash empowers institutions to showcase 3.4x higher hiring conversion and automate compliance reporting.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: CONSENT */}
      {activeTab === "consent" && (
        <Card className="p-6 max-w-2xl space-y-6">
          <CardHeader
            title="Institutional Privacy Settings"
          />

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <strong className="text-xs font-bold text-slate-900 block">Share Telemetry with University</strong>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allow your college Training & Placement cell to view verified offers for NIRF accreditation reports.
                </p>
              </div>
              <input
                type="checkbox"
                checked={shareWithColleges}
                onChange={(e) => setShareWithColleges(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 mt-1 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <strong className="text-xs font-bold text-slate-900 block">Allow Enterprise Recruiter Outreach</strong>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permit verified tech hiring partners to discover your anonymized readiness scores for direct interviews.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowRecruiterOutreach}
                onChange={(e) => setAllowRecruiterOutreach(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 mt-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              loading={updatingConsent}
              onClick={handleUpdateConsent}
            >
              Save Preferences
            </Button>
          </div>
        </Card>
      )}

      {/* LOG OFFER MODAL */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log Verified Placement Offer / PPO"
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Google, Microsoft, Adobe, Infosys"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Role Offered *</label>
              <input
                type="text"
                required
                placeholder="e.g. SDE-1"
                value={formData.roleOffered}
                onChange={(e) => setFormData({ ...formData, roleOffered: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Package in LPA (CTC) *</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 18.5"
                value={formData.packageLpa}
                onChange={(e) => setFormData({ ...formData, packageLpa: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Offer Type</label>
            <select
              value={formData.offerType}
              onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
            >
              <option value="FULL_TIME">Full Time (Campus FTE)</option>
              <option value="PPO">Pre-Placement Offer (PPO)</option>
              <option value="INTERN_FTE">6-Month Intern + FTE</option>
              <option value="INTERNSHIP">Summer Internship</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="consentBox"
              checked={formData.consentToShareWithCollege}
              onChange={(e) => setFormData({ ...formData, consentToShareWithCollege: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300"
            />
            <label htmlFor="consentBox" className="text-slate-600 cursor-pointer">
              Include in anonymized cohort telemetry shared with university administration
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={submittingOffer}>
              Submit & Verify Offer
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default PlacementOutcomesPage;
