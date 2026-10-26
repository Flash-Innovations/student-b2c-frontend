import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Mail,
  GraduationCap,
  Briefcase,
  GitBranch,
  Edit2,
  Check,
  Plus,
  Trash2,
  FileText,
  Upload,
  CheckCircle2,
  RefreshCw,
  Camera,
  X,
  Eye,
  EyeOff,
  Star,
  GitFork,
  ExternalLink,
  FolderGit2,
  ArrowUp,
  ArrowDown,
  Search,
  Layers,
  Globe,
  Copy,
  Lock,
  BookOpen,
  Code,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  User,
  Award,
  Phone,
  CheckCircle
} from "lucide-react";
import { Avatar } from "../components/common/Avatar";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { SkillSelector } from "../components/common/SkillSelector";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { b2cApi } from "../services/b2cApi";
import { findCatalogueSkill, getCanonicalSkillName } from "../data/skillCatalogue";
import { cn } from "../utils/cn";

function LinkedinIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  const diffInSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffInSec < 60) return "just now";
  const minutes = Math.floor(diffInSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function StudentProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Profile Modal State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    branch: "",
    degree: "",
    batch: "2028",
    cgpa: "",
    phone: "",
    targetRoles: []
  });
  const [newRoleInput, setNewRoleInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Modal State
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Skills State
  const [skillsList, setSkillsList] = useState([]);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  // Handles State
  const [githubHandle, setGithubHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isEditingHandles, setIsEditingHandles] = useState(false);
  const [savingHandles, setSavingHandles] = useState(false);

  // Featured Projects State
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  const [savingProjects, setSavingProjects] = useState(false);
  const [syncingProjects, setSyncingProjects] = useState(false);
  const [repoSearchFilter, setRepoSearchFilter] = useState("");

  // Public Career Profile State
  const [publicProfileConfig, setPublicProfileConfig] = useState({
    enabled: false,
    username: "",
    bio: "",
    showResume: false,
    showGithub: true,
    showLinkedIn: true,
    showSkills: true,
    showProjects: true,
    showCodingProfiles: true
  });
  const [isPublicProfileModalOpen, setIsPublicProfileModalOpen] = useState(false);
  const [publicProfileForm, setPublicProfileForm] = useState({
    enabled: false,
    username: "",
    bio: "",
    showResume: false,
    showGithub: true,
    showLinkedIn: true,
    showSkills: true,
    showProjects: true,
    showCodingProfiles: true,
    linkedin: ""
  });
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState("");

  // Coding Profiles State
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [loadingCodingProfiles, setLoadingCodingProfiles] = useState(false);
  const [isCodingProfileModalOpen, setIsCodingProfileModalOpen] = useState(false);
  const [codingProfileForm, setCodingProfileForm] = useState({
    platform: "LEETCODE",
    username: "",
    showOnPublicProfile: true
  });
  const [savingCodingProfile, setSavingCodingProfile] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState("");
  const [codingProfileError, setCodingProfileError] = useState("");

  // Resume Hub State
  const resumeFileInputRef = useRef(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [isResumeSkillReviewModalOpen, setIsResumeSkillReviewModalOpen] = useState(false);
  const [detectedSkillsList, setDetectedSkillsList] = useState([]);
  const [selectedDetectedSkills, setSelectedDetectedSkills] = useState([]);
  const [confirmingSkills, setConfirmingSkills] = useState(false);

  // Initial Data Fetch
  const loadProfileData = async () => {
    try {
      setLoading(true);
      const res = await b2cApi.getProfile();
      if (res && res.success && res.user) {
        const u = res.user;
        setStudent(u);
        setSkillsList(u.skills || []);
        setGithubHandle(u.github || "");
        setLinkedinUrl(u.linkedin || "");
        setCodingProfiles(Array.isArray(u.codingProfiles) ? u.codingProfiles : []);
        setPublicProfileConfig(u.publicProfile || {});
        setProfileForm({
          name: u.name || "",
          branch: u.branch || "",
          degree: u.degree || "B.Tech / B.E.",
          batch: u.graduationYear || u.batch || "2028",
          cgpa: u.cgpa > 0 ? String(u.cgpa) : "",
          phone: u.phone || "",
          targetRoles: u.targetRoles || ["Software Development Engineer (SDE-1)"]
        });
      }
    } catch (err) {
      console.warn("Failed to fetch profile:", err);
      showError("Could not load candidate profile. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Calculate Profile Strength / Completeness Score
  const profileCompletion = useMemo(() => {
    if (!student) return { percentage: 0, items: [] };
    const items = [
      { label: "Full Name & Specialization", done: Boolean(student.name && student.branch), weight: 15 },
      { label: "Graduation Year & CGPA", done: Boolean(student.graduationYear && student.cgpa > 0), weight: 15 },
      { label: "Target Career Roles", done: Boolean(student.targetRoles && student.targetRoles.length > 0), weight: 10 },
      { label: "Technical Skills (5+ skills)", done: Boolean(student.skills && student.skills.length >= 5), weight: 20 },
      { label: "Professional Photo Avatar", done: Boolean(student.profileImageUrl || student.avatar), weight: 10 },
      { label: "GitHub Handle Connected", done: Boolean(student.github), weight: 10 },
      { label: "Featured Showcase Projects", done: Boolean(student.projects && student.projects.length > 0), weight: 10 },
      { label: "Competitive Coding Connected", done: Boolean(codingProfiles && codingProfiles.length > 0), weight: 10 }
    ];

    const completedWeight = items.filter(i => i.done).reduce((acc, curr) => acc + curr.weight, 0);
    return {
      percentage: Math.min(100, completedWeight),
      items
    };
  }, [student, codingProfiles]);

  // 1. Avatar Upload & Delete Handlers
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image file size must be under 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    try {
      const res = await b2cApi.uploadProfileImage(formData);
      if (res && res.success) {
        setStudent(prev => ({ ...prev, profileImageUrl: res.profileImageUrl, avatar: res.profileImageUrl }));
        refreshProfile();
        showSuccess("Profile photo updated successfully!");
      }
    } catch (err) {
      showError(err.message || "Failed to upload profile photo.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm("Remove profile photo and restore default initials avatar?")) return;
    setUploadingImage(true);
    try {
      const res = await b2cApi.deleteProfileImage();
      if (res && res.success) {
        setStudent(prev => ({ ...prev, profileImageUrl: null, avatar: null }));
        refreshProfile();
        showSuccess("Profile photo removed.");
      }
    } catch (err) {
      showError(err.message || "Failed to remove profile photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // 2. Profile Details Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showError("Full name is required.");
      return;
    }

    let parsedCgpa = 0;
    if (profileForm.cgpa.trim() !== "") {
      const c = parseFloat(profileForm.cgpa);
      if (isNaN(c) || c < 0 || c > 10) {
        showError("Invalid CGPA: Must be a number between 0.0 and 10.0.");
        return;
      }
      parsedCgpa = Math.round(c * 100) / 100;
    }

    setSavingProfile(true);
    try {
      const res = await b2cApi.updateProfile({
        name: profileForm.name.trim(),
        branch: profileForm.branch.trim(),
        degree: profileForm.degree.trim(),
        graduationYear: profileForm.batch.trim(),
        batch: profileForm.batch.trim(),
        cgpa: parsedCgpa,
        phone: profileForm.phone.trim(),
        targetRoles: profileForm.targetRoles
      });

      if (res && res.success) {
        setStudent(res.student || res.user);
        refreshProfile();
        setEditProfileModalOpen(false);
        showSuccess("Career profile updated successfully.");
      }
    } catch (err) {
      showError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Password Change Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError("New password must be at least 6 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await b2cApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res && res.success) {
        setChangePasswordModalOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        showSuccess("Password changed successfully.");
      }
    } catch (err) {
      showError(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // 4. Skills Save Handler
  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const res = await b2cApi.updateProfile({ skills: skillsList });
      if (res && res.success) {
        setStudent(prev => ({ ...prev, skills: skillsList }));
        refreshProfile();
        setIsEditingSkills(false);
        showSuccess("Verified technical skills saved successfully!");
      }
    } catch (err) {
      showError(err.message || "Failed to save technical skills.");
    } finally {
      setSavingSkills(false);
    }
  };

  // 5. Handles Save Handler (GitHub & LinkedIn)
  const handleSaveHandles = async () => {
    setSavingHandles(true);
    try {
      const cleanGithub = githubHandle.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "").replace(/^@+/, "").trim();
      const res = await b2cApi.updateProfile({
        github: cleanGithub,
        linkedin: linkedinUrl.trim()
      });
      if (res && res.success) {
        setStudent(prev => ({ ...prev, github: cleanGithub, linkedin: linkedinUrl.trim() }));
        setGithubHandle(cleanGithub);
        setIsEditingHandles(false);
        refreshProfile();
        showSuccess("Social and developer handles updated successfully.");
      }
    } catch (err) {
      showError(err.message || "Failed to save handles.");
    } finally {
      setSavingHandles(false);
    }
  };

  // 6. Featured GitHub Projects Handlers
  const handleOpenProjectsModal = async () => {
    if (!student?.github || !student.github.trim()) {
      showWarning("Please connect your GitHub profile handle first.");
      setIsEditingHandles(true);
      return;
    }

    setIsProjectsModalOpen(true);
    setSelectedRepoIds((student.projects || []).map(p => Number(p.repoId)));
    setLoadingRepos(true);
    setRepoSearchFilter("");

    try {
      const res = await b2cApi.fetchGithubRepositories(student.github);
      setGithubRepos(res?.repositories || []);
    } catch (e) {
      showError(e.message || "Could not fetch repositories from GitHub. Please try again.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleToggleProject = (repoId) => {
    const id = Number(repoId);
    if (selectedRepoIds.includes(id)) {
      setSelectedRepoIds(selectedRepoIds.filter(item => item !== id));
    } else {
      if (selectedRepoIds.length >= 3) {
        showWarning("You can select up to 3 featured showcase projects.");
        return;
      }
      setSelectedRepoIds([...selectedRepoIds, id]);
    }
  };

  const handleMoveProject = (repoId, direction) => {
    const id = Number(repoId);
    const index = selectedRepoIds.indexOf(id);
    if (index === -1) return;

    const newIds = [...selectedRepoIds];
    if (direction === "up" && index > 0) {
      const temp = newIds[index - 1];
      newIds[index - 1] = newIds[index];
      newIds[index] = temp;
      setSelectedRepoIds(newIds);
    } else if (direction === "down" && index < newIds.length - 1) {
      const temp = newIds[index + 1];
      newIds[index + 1] = newIds[index];
      newIds[index] = temp;
      setSelectedRepoIds(newIds);
    }
  };

  const handleSaveProjects = async () => {
    setSavingProjects(true);
    try {
      const res = await b2cApi.saveProjects({ repoIds: selectedRepoIds });
      if (res && res.success) {
        setStudent(prev => ({
          ...prev,
          projects: res.projects
        }));
        setIsProjectsModalOpen(false);
        showSuccess("Featured projects updated successfully!");
      }
    } catch (e) {
      showError(e.message || "Failed to update featured projects.");
    } finally {
      setSavingProjects(false);
    }
  };

  const handleSyncProjects = async () => {
    if (syncingProjects) return;
    setSyncingProjects(true);
    try {
      const res = await b2cApi.syncProjects();
      if (res && res.projects) {
        setStudent(prev => ({
          ...prev,
          projects: res.projects
        }));
        showSuccess(`Refreshed ${res.updatedCount ?? res.projects.length} project(s) from GitHub live!`);
      }
    } catch (e) {
      showError(e.message || "Failed to sync GitHub projects.");
    } finally {
      setSyncingProjects(false);
    }
  };

  // 7. Public Career Profile Handlers
  const handleOpenPublicProfileModal = () => {
    setPublicProfileForm({
      enabled: publicProfileConfig.enabled === true,
      username: publicProfileConfig.username || "",
      bio: publicProfileConfig.bio || "",
      showResume: publicProfileConfig.showResume === true,
      showGithub: publicProfileConfig.showGithub !== false,
      showLinkedIn: publicProfileConfig.showLinkedIn !== false,
      showSkills: publicProfileConfig.showSkills !== false,
      showProjects: publicProfileConfig.showProjects !== false,
      showCodingProfiles: publicProfileConfig.showCodingProfiles !== false,
      linkedin: linkedinUrl || ""
    });
    setPublicProfileError("");
    setIsPublicProfileModalOpen(true);
  };

  const handleSavePublicProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPublicProfileError("");
    setSavingPublicProfile(true);
    try {
      const res = await b2cApi.updatePublicProfileConfig(publicProfileForm);
      if (res && res.success) {
        setPublicProfileConfig(res.publicProfile || {});
        if (res.linkedin !== undefined) {
          setLinkedinUrl(res.linkedin);
          setStudent(prev => ({ ...prev, linkedin: res.linkedin }));
        }
        setIsPublicProfileModalOpen(false);
        showSuccess("Public career profile settings updated successfully!");
      } else {
        setPublicProfileError(res?.message || "Failed to update public career profile settings.");
      }
    } catch (err) {
      setPublicProfileError(err.message || "Failed to update public career profile settings.");
    } finally {
      setSavingPublicProfile(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!publicProfileConfig.username) {
      showWarning("Please configure a username for your public profile first.");
      handleOpenPublicProfileModal();
      return;
    }
    const publicUrl = `${window.location.origin}/u/${publicProfileConfig.username}`;
    try {
      navigator.clipboard.writeText(publicUrl);
      setCopiedPublicUrl(true);
      showSuccess("Public profile URL copied to clipboard!");
      setTimeout(() => setCopiedPublicUrl(false), 2500);
    } catch (e) {
      showError("Could not copy link to clipboard.");
    }
  };

  // 8. Competitive Coding Handlers (LeetCode & Codeforces)
  const handleOpenConnectCodingModal = (platform = "LEETCODE") => {
    const existing = codingProfiles.find(p => p.platform === platform);
    setCodingProfileForm({
      platform,
      username: existing ? existing.username : "",
      showOnPublicProfile: existing ? existing.showOnPublicProfile !== false : true
    });
    setCodingProfileError("");
    setIsCodingProfileModalOpen(true);
  };

  const handleSaveCodingProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!codingProfileForm.username.trim()) {
      setCodingProfileError("Username or profile URL is required.");
      return;
    }

    setCodingProfileError("");
    setSavingCodingProfile(true);

    try {
      const res = await b2cApi.connectCodingProfile({
        platform: codingProfileForm.platform,
        username: codingProfileForm.username.trim(),
        showOnPublicProfile: codingProfileForm.showOnPublicProfile
      });

      if (res && res.success) {
        setCodingProfiles(res.codingProfiles || []);
        setIsCodingProfileModalOpen(false);
        showSuccess(res.message || `Connected ${codingProfileForm.platform} profile successfully!`);
      } else {
        setCodingProfileError(res?.message || `Failed to connect ${codingProfileForm.platform} profile.`);
      }
    } catch (err) {
      setCodingProfileError(err.message || `Failed to connect ${codingProfileForm.platform} profile.`);
    } finally {
      setSavingCodingProfile(false);
    }
  };

  const handleSyncCodingProfile = async (platform) => {
    setSyncingPlatform(platform);
    try {
      const res = await b2cApi.syncCodingProfile(platform);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
        showSuccess(res.message || `Synchronized ${platform} statistics successfully!`);
      }
    } catch (err) {
      showError(err.message || `Failed to sync ${platform} profile.`);
    } finally {
      setSyncingPlatform("");
    }
  };

  const handleToggleCodingProfileVisibility = async (platform, currentVisibility) => {
    const nextVisibility = !currentVisibility;
    try {
      const res = await b2cApi.updateCodingProfileVisibility(platform, nextVisibility);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
      }
      showSuccess(`${platform} visibility ${nextVisibility ? 'enabled' : 'hidden'} on public profile.`);
    } catch (err) {
      showError(err.message || `Failed to update ${platform} visibility.`);
    }
  };

  const handleDisconnectCodingProfile = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${platform} profile?`)) {
      return;
    }

    try {
      const res = await b2cApi.disconnectCodingProfile(platform);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
      } else {
        setCodingProfiles(prev => prev.filter(p => p.platform !== platform));
      }
      showSuccess(`Disconnected ${platform} profile.`);
    } catch (err) {
      showError(err.message || `Failed to disconnect ${platform} profile.`);
    }
  };

  // 9. Resume Hub Handlers
  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("Please upload a valid PDF resume document.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showError("Resume file size must be less than 8MB.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setUploadingResume(true);
    try {
      const res = await b2cApi.uploadResume(formData);
      if (res && res.success) {
        setStudent(prev => ({
          ...prev,
          resumeUrl: res.resumeUrl,
          resumeDetectedSkills: res.detectedSkills || []
        }));
        showSuccess("Placement resume uploaded and parsed successfully!");

        // If detected skills exist, show the skill review modal
        if (res.detectedSkills && res.detectedSkills.length > 0) {
          const newSkills = res.detectedSkills.filter(
            ds => !skillsList.some(s => s.toLowerCase() === ds.toLowerCase())
          );
          if (newSkills.length > 0) {
            setDetectedSkillsList(newSkills);
            setSelectedDetectedSkills(newSkills);
            setIsResumeSkillReviewModalOpen(true);
          }
        }
      }
    } catch (err) {
      showError(err.message || "Failed to upload resume document.");
    } finally {
      setUploadingResume(false);
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to delete your uploaded resume?")) return;
    try {
      const res = await b2cApi.deleteResume();
      if (res && res.success) {
        setStudent(prev => ({ ...prev, resumeUrl: null, resumeDetectedSkills: [] }));
        showSuccess("Resume removed.");
      }
    } catch (err) {
      showError(err.message || "Failed to remove resume.");
    }
  };

  const handleConfirmDetectedSkills = async () => {
    if (selectedDetectedSkills.length === 0) {
      setIsResumeSkillReviewModalOpen(false);
      return;
    }

    setConfirmingSkills(true);
    try {
      const res = await b2cApi.confirmResumeSkills(selectedDetectedSkills);
      if (res && res.success) {
        setSkillsList(res.skills);
        setStudent(prev => ({ ...prev, skills: res.skills }));
        refreshProfile();
        setIsResumeSkillReviewModalOpen(false);
        showSuccess(`Added ${selectedDetectedSkills.length} new skill(s) from resume!`);
      }
    } catch (err) {
      showError(err.message || "Failed to add resume skills.");
    } finally {
      setConfirmingSkills(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-56 bg-white rounded-3xl border border-slate-200/80 p-6 flex gap-6 items-center">
          <div className="w-24 h-24 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-3">
            <div className="w-48 h-6 bg-slate-100 rounded-lg" />
            <div className="w-64 h-4 bg-slate-100 rounded-lg" />
            <div className="w-32 h-4 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl border border-slate-200/80" />
          <div className="h-64 bg-white rounded-3xl border border-slate-200/80" />
        </div>
      </div>
    );
  }

  const leetcodeProfile = codingProfiles.find(p => p.platform === "LEETCODE");
  const codeforcesProfile = codingProfiles.find(p => p.platform === "CODEFORCES");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={resumeFileInputRef}
        onChange={handleResumeFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* 1. Hero Profile Card (No Roll No, No College Name) */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600" />
        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
            {/* Avatar & Photo Action */}
            <div className="flex items-end gap-4">
              <div className="relative group">
                <Avatar
                  src={student?.profileImageUrl || student?.avatar}
                  name={student?.name || "Student"}
                  size="2xl"
                  variant="rounded"
                  className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-md bg-white rounded-2xl"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-1 right-1 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  title="Upload / Change Profile Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {student?.name || "Student Candidate"}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Verified Candidate
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    {student?.degree || "B.Tech"} • {student?.branch || "Computer Science"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-indigo-600 font-semibold">
                    Class of {student?.graduationYear || student?.batch || "2028"}
                  </span>
                  {student?.cgpa > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700">
                        CGPA: {Number(student.cgpa).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{student?.email}</span>
                  {student?.phone && (
                    <>
                      <span className="text-slate-300">•</span>
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{student.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {student?.profileImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteImage}
                  disabled={uploadingImage}
                  className="text-slate-500 hover:text-rose-600 hover:border-rose-200 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Remove Photo
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditProfileModalOpen(true)}
                className="text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangePasswordModalOpen(true)}
                className="text-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1" /> Password
              </Button>
            </div>
          </div>

          {/* Target Career Roles Badges */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Target Roles:
            </span>
            {(student?.targetRoles || ["Software Development Engineer (SDE-1)"]).map((role, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Portfolio Completeness Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Portfolio Strength
              </span>
              <span className="font-mono font-bold text-indigo-600">
                {profileCompletion.percentage}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
            {profileCompletion.percentage < 100 && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Tip: Complete your GitHub projects and connect LeetCode/Codeforces to reach 100% recruiter readiness.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Public Career Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold tracking-tight">Public Career Portfolio URL</h2>
            {publicProfileConfig.enabled ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE & PUBLIC
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
                PRIVATE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Share your verified skills, GitHub projects, and competitive coding stats directly with tech recruiters and hiring partners.
          </p>
          {publicProfileConfig.username ? (
            <div className="pt-1 flex items-center gap-2 font-mono text-xs text-indigo-300 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 max-w-fit">
              <span>{window.location.origin}/u/{publicProfileConfig.username}</span>
            </div>
          ) : (
            <p className="text-[11px] text-amber-300 font-medium">
              * Set a custom username to activate your shareable profile link.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {publicProfileConfig.username && (
            <button
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
            >
              {copiedPublicUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPublicUrl ? "Copied!" : "Copy Link"}
            </button>
          )}
          {publicProfileConfig.username && publicProfileConfig.enabled && (
            <a
              href={`/u/${publicProfileConfig.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview
            </a>
          )}
          <button
            onClick={handleOpenPublicProfileModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            Configure Privacy & Bio
          </button>
        </div>
      </div>

      {/* 3. Main Grid: Skills (Left) + Placement Resume Hub & Handles (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Technical Skills Catalogue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Verified Technical Skills Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verified Technical Skills</h3>
                  <p className="text-xs text-slate-500">
                    Standardized taxonomy spanning 30 engineering & analytical domains
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditingSkills ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSkillsList(student?.skills || []);
                        setIsEditingSkills(false);
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="text-xs"
                    >
                      {savingSkills ? "Saving..." : "Save Skills"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingSkills(true)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit Skills
                  </Button>
                )}
              </div>
            </div>

            {/* Skill Selector Component */}
            {isEditingSkills ? (
              <SkillSelector
                selectedSkills={skillsList}
                onChange={setSkillsList}
                maxSkills={50}
                placeholder="Search skills by name, framework, acronym (e.g. React, Spring Boot, PyTorch, SQL)..."
              />
            ) : (
              <div>
                {skillsList && skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skillName, idx) => {
                      const match = findCatalogueSkill(skillName);
                      const name = match ? match.name : skillName;
                      const category = match ? match.category.split("&")[0].trim() : "Custom";
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-800 shadow-2xs transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>{name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            • {category}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">
                      No technical skills added yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingSkills(true)}
                      className="mt-3 text-xs"
                    >
                      + Add Verified Skills
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Featured GitHub Projects Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Featured Showcase Projects</h3>
                  <p className="text-xs text-slate-500">
                    Up to 3 top repositories displayed on your public candidate portfolio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {student?.projects && student.projects.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncProjects}
                    disabled={syncingProjects}
                    className="text-xs"
                    title="Refresh star counts and descriptions from GitHub"
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-1", syncingProjects && "animate-spin")} />
                    {syncingProjects ? "Syncing..." : "Sync Live"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenProjectsModal}
                  className="text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> Select Projects
                </Button>
              </div>
            </div>

            {/* Projects List */}
            {student?.projects && student.projects.length > 0 ? (
              <div className="space-y-3">
                {student.projects.map((proj, idx) => (
                  <div
                    key={proj.repoId || idx}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <a
                          href={proj.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate flex items-center gap-1"
                        >
                          {proj.name}
                          <ExternalLink className="w-3 h-3 text-slate-400 inline shrink-0" />
                        </a>
                        {proj.primaryLanguage && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                            {proj.primaryLanguage}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {proj.description || "No repository description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono font-medium text-slate-500 shrink-0">
                      <span className="flex items-center gap-1" title="Stars">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {proj.stars || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Forks">
                        <GitFork className="w-3.5 h-3.5 text-slate-400" />
                        {proj.forks || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  {student?.github
                    ? "No featured projects selected yet."
                    : "Connect your GitHub profile handle to import showcase repositories."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenProjectsModal}
                  className="mt-3 text-xs"
                >
                  {student?.github ? "+ Choose 3 Showcase Projects" : "Connect GitHub First"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Handles + Competitive Coding + Placement Resume */}
        <div className="space-y-6">
          {/* Social & Professional Handles Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" /> Developer Handles
              </h3>
              {isEditingHandles ? (
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGithubHandle(student?.github || "");
                      setLinkedinUrl(student?.linkedin || "");
                      setIsEditingHandles(false);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveHandles}
                    disabled={savingHandles}
                    className="text-xs"
                  >
                    {savingHandles ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingHandles(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* GitHub */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GithubIcon className="w-3.5 h-3.5" /> GitHub
                  </span>
                  {student?.github && (
                    <a
                      href={`https://github.com/${student.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      Visit <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                {isEditingHandles ? (
                  <input
                    type="text"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    placeholder="e.g. torvalds or https://github.com/torvalds"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <p className="text-xs font-mono text-slate-600 truncate">
                    {student?.github ? `@${student.github}` : "Not linked yet"}
                  </p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn
                  </span>
                  {student?.linkedin && (
                    <a
                      href={student.linkedin.startsWith("http") ? student.linkedin : `https://${student.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      Visit <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                {isEditingHandles ? (
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="e.g. linkedin.com/in/username"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <p className="text-xs text-slate-600 truncate">
                    {student?.linkedin || "Not linked yet"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Competitive Coding Profiles Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-600" /> Competitive Coding
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">LeetCode & Codeforces</span>
            </div>

            <div className="space-y-3">
              {/* LeetCode Card */}
              {leetcodeProfile ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                        LC
                      </span>
                      <div>
                        <a
                          href={leetcodeProfile.profileUrl || `https://leetcode.com/u/${leetcodeProfile.username}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                        >
                          {leetcodeProfile.username}
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                        <p className="text-[10px] text-slate-400">
                          Synced {formatTimeAgo(leetcodeProfile.lastSyncedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCodingProfileVisibility("LEETCODE", leetcodeProfile.showOnPublicProfile)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={leetcodeProfile.showOnPublicProfile !== false ? "Visible on public profile" : "Hidden from public profile"}
                      >
                        {leetcodeProfile.showOnPublicProfile !== false ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleSyncCodingProfile("LEETCODE")}
                        disabled={syncingPlatform === "LEETCODE"}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Sync live stats"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", syncingPlatform === "LEETCODE" && "animate-spin")} />
                      </button>
                      <button
                        onClick={() => handleDisconnectCodingProfile("LEETCODE")}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Disconnect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* LeetCode Stats Breakdown */}
                  {leetcodeProfile.stats ? (
                    <div className="space-y-2 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Problems Solved</span>
                        <span className="font-mono font-bold text-slate-900">
                          {leetcodeProfile.stats.totalSolved || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                          <p className="text-[9px] text-emerald-600 font-sans uppercase">Easy</p>
                          <p className="font-bold">{leetcodeProfile.stats.easySolved || 0}</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                          <p className="text-[9px] text-amber-600 font-sans uppercase">Medium</p>
                          <p className="font-bold">{leetcodeProfile.stats.mediumSolved || 0}</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-100">
                          <p className="text-[9px] text-rose-600 font-sans uppercase">Hard</p>
                          <p className="font-bold">{leetcodeProfile.stats.hardSolved || 0}</p>
                        </div>
                      </div>
                      {leetcodeProfile.stats.ranking && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Global Ranking</span>
                          <span className="font-mono font-semibold text-slate-700">
                            #{Number(leetcodeProfile.stats.ranking).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnectCodingModal("LEETCODE")}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-200 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/60 text-xs font-semibold text-amber-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" /> Connect LeetCode Profile
                </button>
              )}

              {/* Codeforces Card */}
              {codeforcesProfile ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        CF
                      </span>
                      <div>
                        <a
                          href={codeforcesProfile.profileUrl || `https://codeforces.com/profile/${codeforcesProfile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                        >
                          {codeforcesProfile.username}
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                        <p className="text-[10px] text-slate-400">
                          Synced {formatTimeAgo(codeforcesProfile.lastSyncedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCodingProfileVisibility("CODEFORCES", codeforcesProfile.showOnPublicProfile)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={codeforcesProfile.showOnPublicProfile !== false ? "Visible on public profile" : "Hidden from public profile"}
                      >
                        {codeforcesProfile.showOnPublicProfile !== false ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleSyncCodingProfile("CODEFORCES")}
                        disabled={syncingPlatform === "CODEFORCES"}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Sync live stats"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", syncingPlatform === "CODEFORCES" && "animate-spin")} />
                      </button>
                      <button
                        onClick={() => handleDisconnectCodingProfile("CODEFORCES")}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Disconnect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {codeforcesProfile.stats ? (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/60 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans text-xs">Rating</span>
                        <span className="font-bold text-indigo-600">
                          {codeforcesProfile.stats.rating || 0}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (max: {codeforcesProfile.stats.maxRating || 0})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans text-xs">Rank</span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {codeforcesProfile.stats.rank || "Unrated"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => handleOpenConnectCodingModal("CODEFORCES")}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 text-xs font-semibold text-blue-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" /> Connect Codeforces Profile
                </button>
              )}
            </div>
          </div>

          {/* Placement Resume Hub Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Placement Resume Hub
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ATS Engine
              </span>
            </div>

            {student?.resumeUrl ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white text-indigo-600 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Resume.pdf</p>
                      <p className="text-[10px] text-slate-500">Verified & ATS Ready</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (student.resumeUrl.startsWith("data:")) {
                        const win = window.open();
                        win.document.write(`<iframe src="${student.resumeUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      } else {
                        window.open(student.resumeUrl, "_blank");
                      }
                    }}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeFileInputRef.current?.click()}
                    disabled={uploadingResume}
                    className="text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" /> Replace
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteResume}
                  className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete Resume
                </Button>
              </div>
            ) : (
              <div
                onClick={() => resumeFileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl text-center space-y-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/30"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {uploadingResume ? "Uploading & Analyzing..." : "Click to upload candidate resume"}
                  </p>
                  <p className="text-[11px] text-slate-400">PDF documents only (max 8MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Profile (No Roll No, No College Name) */}
      <Modal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title="Edit Candidate Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
              <input
                type="text"
                value={profileForm.degree}
                onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                placeholder="e.g. B.Tech / B.E. or BCA"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Specialization</label>
              <input
                type="text"
                value={profileForm.branch}
                onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Cohort</label>
              <input
                type="text"
                value={profileForm.batch}
                onChange={(e) => setProfileForm({ ...profileForm, batch: e.target.value })}
                placeholder="e.g. 2028"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profileForm.cgpa}
                onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                placeholder="e.g. 8.75"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Roles</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profileForm.targetRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        targetRoles: profileForm.targetRoles.filter((_, i) => i !== idx)
                      })
                    }
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="Add role (e.g. Backend Developer, Data Analyst)"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newRoleInput.trim()) {
                      setProfileForm({
                        ...profileForm,
                        targetRoles: [...profileForm.targetRoles, newRoleInput.trim()]
                      });
                      setNewRoleInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newRoleInput.trim()) {
                    setProfileForm({
                      ...profileForm,
                      targetRoles: [...profileForm.targetRoles, newRoleInput.trim()]
                    });
                    setNewRoleInput("");
                  }
                }}
              >
                + Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Change Password */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Change Security Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChangePasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Manage Featured GitHub Projects */}
      <Modal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        title="Select Featured GitHub Projects"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Select up to 3 showcase repositories from your GitHub account. Use the arrows to reorder which project appears #1, #2, and #3.
          </p>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={repoSearchFilter}
              onChange={(e) => setRepoSearchFilter(e.target.value)}
              placeholder="Search repositories by name or language..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>

          {loadingRepos ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading repositories from GitHub...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {githubRepos
                .filter(r => !repoSearchFilter || r.name.toLowerCase().includes(repoSearchFilter.toLowerCase()))
                .map((repo) => {
                  const isSelected = selectedRepoIds.includes(repo.repoId);
                  const order = selectedRepoIds.indexOf(repo.repoId);

                  return (
                    <div
                      key={repo.repoId}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs",
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      )}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProject(repo.repoId)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{repo.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {repo.primaryLanguage || "Repo"} • ★ {repo.stars || 0}
                          </p>
                        </div>
                      </label>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-xs font-bold text-indigo-600 px-1.5 py-0.5 rounded bg-indigo-100">
                            #{order + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(repo.repoId, "up")}
                            disabled={order === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(repo.repoId, "down")}
                            disabled={order === selectedRepoIds.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">
              {selectedRepoIds.length} / 3 selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProjectsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveProjects}
                disabled={savingProjects}
              >
                {savingProjects ? "Saving..." : "Save Featured Projects"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Public Career Profile Privacy Settings */}
      <Modal
        isOpen={isPublicProfileModalOpen}
        onClose={() => setIsPublicProfileModalOpen(false)}
        title="Public Profile & Privacy Controls"
      >
        <form onSubmit={handleSavePublicProfile} className="space-y-4">
          {publicProfileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{publicProfileError}</span>
            </div>
          )}

          {/* Master Enable Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Make Profile Public</p>
              <p className="text-[11px] text-slate-500">Allow recruiters to view your verified portfolio</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={publicProfileForm.enabled}
                onChange={(e) => setPublicProfileForm({ ...publicProfileForm, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          {/* Username Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Public Username URL</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="px-3 py-2 bg-slate-50 text-slate-400 font-mono text-xs border-r border-slate-200">
                /u/
              </span>
              <input
                type="text"
                value={publicProfileForm.username}
                onChange={(e) => setPublicProfileForm({ ...publicProfileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="e.g. alex-kumar"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          {/* Professional Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio / Elevator Pitch</label>
            <textarea
              rows={3}
              value={publicProfileForm.bio}
              onChange={(e) => setPublicProfileForm({ ...publicProfileForm, bio: e.target.value })}
              placeholder="Aspiring software engineer passionate about scalable backend systems and distributed data structures..."
              maxLength={500}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 text-right">{publicProfileForm.bio.length} / 500</p>
          </div>

          {/* Granular Privacy Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800">Section Visibility On Public URL</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showSkills}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showSkills: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Technical Skills</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showProjects}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showProjects: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Featured Projects</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showCodingProfiles}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showCodingProfiles: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Coding Stats</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showResume}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showResume: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Placement Resume</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showGithub}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showGithub: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>GitHub Handle</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showLinkedIn}
                  onChange={(e) => setPublicProfileForm({ ...publicProfileForm, showLinkedIn: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>LinkedIn Link</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPublicProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingPublicProfile}
            >
              {savingPublicProfile ? "Saving..." : "Save Privacy Settings"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Connect Coding Profile (LeetCode / Codeforces) */}
      <Modal
        isOpen={isCodingProfileModalOpen}
        onClose={() => setIsCodingProfileModalOpen(false)}
        title={`Connect ${codingProfileForm.platform} Profile`}
      >
        <form onSubmit={handleSaveCodingProfile} className="space-y-4">
          {codingProfileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{codingProfileError}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your public {codingProfileForm.platform} handle or profile link. We'll automatically verify and fetch your problems solved, rankings, and contest ratings.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {codingProfileForm.platform} Username or Profile URL
            </label>
            <input
              type="text"
              required
              value={codingProfileForm.username}
              onChange={(e) => setCodingProfileForm({ ...codingProfileForm, username: e.target.value })}
              placeholder={
                codingProfileForm.platform === "LEETCODE"
                  ? "e.g. tourist or https://leetcode.com/u/tourist/"
                  : "e.g. tourist or https://codeforces.com/profile/tourist"
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={codingProfileForm.showOnPublicProfile}
              onChange={(e) => setCodingProfileForm({ ...codingProfileForm, showOnPublicProfile: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Display this platform on your shareable public profile</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCodingProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingCodingProfile}
            >
              {savingCodingProfile ? "Connecting & Verifying..." : "Connect Profile"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: Resume Detected Skills Review */}
      <Modal
        isOpen={isResumeSkillReviewModalOpen}
        onClose={() => setIsResumeSkillReviewModalOpen(false)}
        title="Add Resume Detected Skills"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Our ATS parser extracted the following technical skills from your uploaded resume. Check the ones you'd like to add to your verified profile:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {detectedSkillsList.map((skill, idx) => {
              const isChecked = selectedDetectedSkills.includes(skill);
              return (
                <label
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors",
                    isChecked
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                      : "bg-white border-slate-200 text-slate-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedDetectedSkills(selectedDetectedSkills.filter(s => s !== skill));
                        } else {
                          setSelectedDetectedSkills([...selectedDetectedSkills, skill]);
                        }
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold">{skill}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Extracted from Resume</span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (selectedDetectedSkills.length === detectedSkillsList.length) {
                  setSelectedDetectedSkills([]);
                } else {
                  setSelectedDetectedSkills([...detectedSkillsList]);
                }
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              {selectedDetectedSkills.length === detectedSkillsList.length ? "Deselect All" : "Select All"}
            </button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResumeSkillReviewModalOpen(false)}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDetectedSkills}
                disabled={confirmingSkills || selectedDetectedSkills.length === 0}
              >
                {confirmingSkills ? "Adding..." : `Add ${selectedDetectedSkills.length} Skills`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default StudentProfilePage;
