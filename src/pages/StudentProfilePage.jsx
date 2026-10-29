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
import { validatePasswordStrength } from "../utils/passwordPolicy";
import { PasswordRequirements } from "../components/common/PasswordRequirements";

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
    batch: "",
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
        const rawLi = u.linkedin || "";
        const cleanLi = rawLi.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "").replace(/^(https?:\/\/)?(www\.)?linkedin\.com\//i, "").replace(/^@+/, "").replace(/\/+$/, "").trim();
        setLinkedinUrl(cleanLi);
        setCodingProfiles(Array.isArray(u.codingProfiles) ? u.codingProfiles : []);
        setPublicProfileConfig(u.publicProfile || {});
        setProfileForm({
          name: u.name || "",
          branch: u.branch || "",
          degree: u.degree || "B.Tech / B.E.",
          batch: u.graduationYear || u.batch || "",
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

  const specializationDisplay = useMemo(() => {
    const degree = student?.degree?.trim() || "";
    const branch = student?.branch?.trim() || "";
    if (branch && degree && branch.toLowerCase() !== degree.toLowerCase()) {
      return `${degree} • ${branch}`;
    }
    return branch || degree || "Engineering Candidate";
  }, [student?.degree, student?.branch]);

  const latestProjectsSyncedAt = useMemo(() => {
    return (student?.projects || []).reduce((latest, p) => {
      if (!p.syncedAt) return latest;
      if (!latest) return p.syncedAt;
      return new Date(p.syncedAt) > new Date(latest) ? p.syncedAt : latest;
    }, null);
  }, [student?.projects]);

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
    const passwordError = validatePasswordStrength(passwordForm.newPassword);
    if (passwordError) {
      showError(passwordError);
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
      const cleanGithub = githubHandle.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "").replace(/^@+/, "").replace(/\/+$/, "").trim();
      const cleanLinkedin = linkedinUrl.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "").replace(/^(https?:\/\/)?(www\.)?linkedin\.com\//i, "").replace(/^@+/, "").replace(/\/+$/, "").trim();
      const res = await b2cApi.updateProfile({
        github: cleanGithub,
        linkedin: cleanLinkedin
      });
      if (res && res.success) {
        setStudent(prev => ({ ...prev, github: cleanGithub, linkedin: cleanLinkedin }));
        setLinkedinUrl(cleanLinkedin);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
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

      {/* 1. Header Profile Hero Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Interactive Avatar Container with Hover Overlay */}
              <div className="-mt-12 sm:-mt-14 relative group shrink-0 z-10">
                <Avatar
                  src={student?.profileImageUrl || student?.avatar}
                  name={student?.name || "Student"}
                  size="2xl"
                  variant="rounded"
                  className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-md rounded-2xl sm:rounded-3xl"
                />

                {/* Upload Overlay / Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={cn(
                    "absolute inset-0 rounded-2xl sm:rounded-3xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity border-4 border-white",
                    uploadingImage && "opacity-100"
                  )}
                  title="Upload profile photo"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">Change</span>
                    </>
                  )}
                </button>

                {/* Remove button badge if photo is uploaded */}
                {(student?.profileImageUrl || student?.avatar) && !uploadingImage && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer border-2 border-white z-20"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="pt-1 sm:pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{student?.name || "Candidate"}</h1>
                  <Badge variant="success" size="sm">
                    Verified Candidate
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {specializationDisplay}{student?.graduationYear || student?.batch ? ` • Class of ${student.graduationYear || student.batch}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={() => setEditProfileModalOpen(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Lock}
                onClick={() => setChangePasswordModalOpen(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
              >
                Password
              </Button>
            </div>
          </div>

          {/* Quick Contact & Verification Badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {student?.email}
            </span>
            {student?.phone && (
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> CGPA: {student?.cgpa > 0 ? Number(student.cgpa).toFixed(2) : "Not Set"}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Target Roles: {(student?.targetRoles && student.targetRoles.length > 0) ? student.targetRoles.join(", ") : (student?.targetRole || "Software Development Engineer (SDE-1)")}
            </span>
          </div>

          {/* Portfolio Strength Bar */}
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
      </Card>

      {/* 2. 2-Column Grid: Skills Management & Connected Handles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Technical Skills Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Verified Technical Skills</h3>
              <p className="text-xs text-slate-500">Skills are verified from the 30-domain technical catalogue</p>
            </div>
            {!isEditingSkills ? (
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={() => setIsEditingSkills(true)}
              >
                Edit Skills
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSkillsList(student?.skills || []);
                    setIsEditingSkills(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Check}
                  disabled={savingSkills}
                  onClick={handleSaveSkills}
                >
                  {savingSkills ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          {isEditingSkills ? (
            <div className="space-y-4">
              <SkillSelector
                selectedSkills={skillsList}
                onChange={setSkillsList}
                maxSkills={50}
                placeholder="Search catalogue by name, alias or select category (e.g. React, Python, Cloud)..."
                helperText="Select verified technical skills from the 30-domain catalogue."
              />
            </div>
          ) : (
            skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, index) => {
                  const catalogueMatch = findCatalogueSkill(skill);
                  const canonicalName = catalogueMatch ? catalogueMatch.name : skill;
                  return (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {canonicalName}
                      {catalogueMatch && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          • {catalogueMatch.category.split("&")[0].trim()}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                No verified technical skills added yet. Click "Edit Skills" to choose from the predefined skill catalogue.
              </div>
            )
          )}
        </Card>

        {/* Connected Accounts Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Connected Accounts</h3>
              <p className="text-xs text-slate-500">Developer and professional profiles connected to your account</p>
            </div>
            {!isEditingHandles ? (
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={() => setIsEditingHandles(true)}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setGithubHandle(student?.github || "");
                    setLinkedinUrl(student?.linkedin || "");
                    setIsEditingHandles(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Check}
                  disabled={savingHandles}
                  onClick={handleSaveHandles}
                >
                  {savingHandles ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* GitHub Profile Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <GithubIcon className="w-4 h-4 text-indigo-600" /> GitHub Profile
                </span>
                <Badge variant={student?.github ? "success" : "neutral"} size="sm">
                  {student?.github ? "Linked" : "Not Linked"}
                </Badge>
              </div>

              {isEditingHandles ? (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="GitHub username (e.g. torvalds)..."
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                  {student?.github ? (
                    <>
                      <span className="font-semibold text-slate-900">@{student.github}</span>
                      <a
                        href={`https://github.com/${student.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        View Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  ) : (
                    <span className="text-slate-400">No GitHub handle linked yet</span>
                  )}
                </div>
              )}
            </div>

            {/* LinkedIn Profile Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <LinkedinIcon className="w-4 h-4 text-blue-600" /> LinkedIn Profile
                </span>
                <Badge variant={student?.linkedin ? "success" : "neutral"} size="sm">
                  {student?.linkedin ? "Linked" : "Not Linked"}
                </Badge>
              </div>

              {isEditingHandles ? (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="LinkedIn username (e.g. satyanadella)..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                  {student?.linkedin ? (() => {
                    const cleanLi = String(student.linkedin).replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "").replace(/^(https?:\/\/)?(www\.)?linkedin\.com\//i, "").replace(/^@+/, "").replace(/\/+$/, "").trim();
                    return (
                      <>
                        <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                          in/{cleanLi}
                        </span>
                        <a
                          href={`https://linkedin.com/in/${cleanLi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold shrink-0"
                        >
                          View Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    );
                  })() : (
                    <span className="text-slate-400">No LinkedIn username linked yet</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Public Career Profile Management Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Public Career Profile
              </h3>
              <Badge
                variant={publicProfileConfig.enabled ? "success" : "neutral"}
                size="sm"
              >
                {publicProfileConfig.enabled ? "Publicly Accessible" : "Disabled / Private"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create a shareable, recruiter-facing portfolio link to showcase your verified skills, projects, and resume
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={Edit2}
              onClick={handleOpenPublicProfileModal}
            >
              Configure Profile
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Your Shareable Public Link:</span>
              <div className="flex flex-wrap items-center gap-2">
                <code className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-indigo-700 font-semibold select-all">
                  {publicProfileConfig.username 
                    ? `${window.location.origin}/u/${publicProfileConfig.username}`
                    : `${window.location.origin}/u/<your-username>`
                  }
                </code>
                {publicProfileConfig.username && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={copiedPublicUrl ? Check : Copy}
                    onClick={handleCopyPublicLink}
                    className="text-slate-600 hover:text-indigo-600"
                  >
                    {copiedPublicUrl ? "Copied" : "Copy Link"}
                  </Button>
                )}
                {publicProfileConfig.enabled && publicProfileConfig.username && (
                  <a
                    href={`/u/${publicProfileConfig.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Visibility Settings Summary */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Visibility:</span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showSkills !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Skills: {publicProfileConfig.showSkills !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showProjects !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Projects: {publicProfileConfig.showProjects !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showResume ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Resume: {publicProfileConfig.showResume ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showGithub !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                GitHub: {publicProfileConfig.showGithub !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showLinkedIn !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                LinkedIn: {publicProfileConfig.showLinkedIn !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showCodingProfiles !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Coding: {publicProfileConfig.showCodingProfiles !== false ? 'On' : 'Off'}
              </span>
            </div>
          </div>
          {!publicProfileConfig.enabled && (
            <p className="text-[11px] text-amber-700 mt-2.5 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" /> Profile is currently disabled. External visitors will receive a 404 response until you enable it.
            </p>
          )}
        </div>
      </Card>

      {/* 4. Featured GitHub Projects Section */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-600" /> Featured GitHub Projects
              </h3>
              <Badge variant={student?.projects && student.projects.length > 0 ? "primary" : "neutral"} size="sm">
                {student?.projects?.length || 0} / 3 Selected
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
              <span>Showcase your top 3 public repositories to tech recruiters and hiring managers</span>
              {latestProjectsSyncedAt && (
                <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  Last synced: {formatTimeAgo(latestProjectsSyncedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {student?.projects && student.projects.length > 0 && (
              <Button
                variant="outline"
                size="xs"
                icon={RefreshCw}
                onClick={handleSyncProjects}
                disabled={syncingProjects}
                className={syncingProjects ? "opacity-75 cursor-not-allowed" : ""}
              >
                {syncingProjects ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    Syncing...
                  </span>
                ) : (
                  "Sync GitHub Projects"
                )}
              </Button>
            )}
            {student?.github ? (
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={handleOpenProjectsModal}
              >
                {student?.projects && student.projects.length > 0 ? "Manage Projects" : "Select Projects"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="xs"
                icon={GitBranch}
                onClick={() => setIsEditingHandles(true)}
              >
                Connect GitHub First
              </Button>
            )}
          </div>
        </div>

        {!student?.github ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
            <GitBranch className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">GitHub Profile Not Linked</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
              Connect your GitHub account handle above to automatically fetch and showcase your best public repositories.
            </p>
            <Button
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => setIsEditingHandles(true)}
            >
              Add GitHub Handle
            </Button>
          </div>
        ) : !student?.projects || student.projects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-indigo-50/30 border border-dashed border-indigo-200/70">
            <FolderGit2 className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No Featured Projects Selected Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
              Select up to 3 of your best public repositories from <span className="font-semibold text-indigo-600">@{student.github}</span> to highlight on your placement portfolio.
            </p>
            <Button
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={handleOpenProjectsModal}
            >
              Select Featured Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {student.projects.map((proj, idx) => (
              <div
                key={proj.repoId || idx}
                className="relative flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={proj.name}>
                        {proj.name}
                      </h4>
                    </div>
                    <a
                      href={proj.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors shrink-0"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 min-h-[32px]">
                    {proj.description || "No description provided for this repository."}
                  </p>

                  {proj.topics && proj.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {proj.topics.slice(0, 3).map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                        >
                          #{topic}
                        </span>
                      ))}
                      {proj.topics.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{proj.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    {proj.primaryLanguage && (
                      <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                        {proj.primaryLanguage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1" title="Stars">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {proj.stars || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Forks">
                      <GitFork className="w-3 h-3 text-slate-400" />
                      {proj.forks || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. Coding & Competitive Programming Profiles Section */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Coding & Competitive Programming Profiles
              </h3>
              <Badge variant={codingProfiles.length > 0 ? "primary" : "neutral"} size="sm">
                {codingProfiles.length} Connected
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Connect your LeetCode and Codeforces profiles to showcase problem-solving metrics and contest ratings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['LEETCODE', 'CODEFORCES'].map((platformKey) => {
            const isLeetCode = platformKey === 'LEETCODE';
            const connected = codingProfiles.find(p => p.platform === platformKey);
            const isSyncing = syncingPlatform === platformKey;
            const stats = connected?.stats || {};

            return (
              <div
                key={platformKey}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        isLeetCode 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        <Code className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {isLeetCode ? 'LeetCode' : 'Codeforces'}
                          </h4>
                          <Badge variant={connected ? "success" : "neutral"} size="xs">
                            {connected ? "Connected" : "Not Linked"}
                          </Badge>
                        </div>
                        {connected ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-mono text-indigo-600 font-semibold">@{connected.username}</span>
                            {connected.profileUrl && (
                              <a
                                href={connected.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Open Profile"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Public statistics & ratings</span>
                        )}
                      </div>
                    </div>

                    {connected && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={RefreshCw}
                          onClick={() => handleSyncCodingProfile(platformKey)}
                          disabled={isSyncing}
                          title="Sync Now"
                          className={isSyncing ? "animate-spin text-indigo-600" : "text-slate-500 hover:text-indigo-600"}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Trash2}
                          onClick={() => handleDisconnectCodingProfile(platformKey)}
                          title="Disconnect"
                          className="text-slate-400 hover:text-rose-600"
                        />
                      </div>
                    )}
                  </div>

                  {connected ? (
                    <div className="space-y-3 mt-4">
                      {isLeetCode ? (
                        <>
                          {/* LeetCode Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] text-slate-500 font-medium block">Problems Solved</span>
                              <span className="font-extrabold text-slate-900 text-base">
                                {stats.totalSolved ?? stats.problemsSolved ?? 0}
                              </span>
                            </div>
                            {(stats.ranking || stats.globalRank) ? (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-500 font-medium block">Global Rank</span>
                                <span className="font-bold text-slate-900 text-sm">
                                  #{Number(stats.ranking || stats.globalRank).toLocaleString()}
                                </span>
                              </div>
                            ) : null}
                            {stats.currentRating ? (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-500 font-medium block">Contest Rating</span>
                                <span className="font-extrabold text-indigo-600 text-base">{stats.currentRating}</span>
                              </div>
                            ) : null}
                            {stats.rankingTier && (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] text-slate-500 font-medium block">Badge Tier</span>
                                <span className="font-bold text-amber-700 text-sm">{stats.rankingTier}</span>
                              </div>
                            )}
                          </div>

                          {/* Difficulty Breakdown for LeetCode */}
                          <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                              Easy: {stats.easySolved ?? stats.difficultyBreakdown?.easy ?? 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-100">
                              Medium: {stats.mediumSolved ?? stats.difficultyBreakdown?.medium ?? 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-100">
                              Hard: {stats.hardSolved ?? stats.difficultyBreakdown?.hard ?? 0}
                            </span>
                          </div>
                        </>
                      ) : (
                        /* Codeforces Stats Grid */
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-medium block">Current Rating</span>
                            <span className="font-extrabold text-indigo-600 text-base">
                              {stats.rating || stats.currentRating || 0}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-medium block">Max Rating</span>
                            <span className="font-bold text-slate-700 text-sm">{stats.maxRating || 0}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-medium block">Current Rank</span>
                            <span className="font-bold text-blue-700 text-sm capitalize">{stats.rank || "Unrated"}</span>
                          </div>
                          {stats.maxRank && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] text-slate-500 font-medium block">Max Rank</span>
                              <span className="font-bold text-slate-700 text-sm capitalize">{stats.maxRank}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sync notice / Last synced */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>
                          {connected.lastSyncedAt ? `Synced ${formatTimeAgo(connected.lastSyncedAt)}` : 'Recently connected'}
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={connected.showOnPublicProfile !== false}
                            onChange={() => handleToggleCodingProfileVisibility(platformKey, connected.showOnPublicProfile !== false)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span className="text-slate-600 font-medium">Show on Public Profile</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Not connected to your profile</span>
                      <Button
                        variant="outline"
                        size="xs"
                        icon={Plus}
                        onClick={() => handleOpenConnectCodingModal(platformKey)}
                      >
                        Connect {isLeetCode ? 'LeetCode' : 'Codeforces'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 6. Placement Resume Hub Card */}
      <Card>
        <CardHeader
          title="Placement Resume"
          subtitle="Upload your verified PDF resume for one-click job applications and recruiter reviews"
          action={
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ATS Engine Verified
            </span>
          }
        />

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {student?.resumeUrl ? (student.resumeUrl.split("/").pop().replace(/^[\d-]+_/, "") || "Resume.pdf") : "No Resume Uploaded"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {student?.resumeUrl ? "Stored on Cloudinary CDN • Ready for recruiter reviews" : "Upload PDF format (Max 8MB)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {student?.resumeUrl ? (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  icon={ExternalLink}
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
                  View Resume
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Upload}
                  onClick={() => resumeFileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="text-xs"
                >
                  Replace PDF Resume
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Trash2}
                  onClick={handleDeleteResume}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
                >
                  Remove Resume
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="xs"
                icon={Upload}
                onClick={() => resumeFileInputRef.current?.click()}
                disabled={uploadingResume}
              >
                {uploadingResume ? "Uploading..." : "Upload PDF Resume"}
              </Button>
            )}
          </div>
        </div>
      </Card>


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
                placeholder="e.g. 2026"
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
                minLength={8}
                maxLength={16}
                value={passwordForm.newPassword}
                placeholder="8-16 chars, 1 upper, 1 lower, 1 digit, 1 special"
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
            <PasswordRequirements password={passwordForm.newPassword} />
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
