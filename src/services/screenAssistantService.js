import { aiApi } from "./aiApi";

export const screenAssistantService = {
  /**
   * Interact with screen-aware assistant
   * @param {Object} params
   * @param {string} params.query
   * @param {Object} params.screenContext
   * @param {Object} params.studentProfile
   * @param {string} params.action
   */
  async interact({ query = "", screenContext = {}, studentProfile = {}, action = "AUTO" }) {
    try {
      const response = await aiApi.post("/api/assistant/interact", {
        query,
        screenContext,
        studentProfile,
        action
      });

      if (response && response.success && response.data) {
        return response.data;
      }
      return response;
    } catch (err) {
      console.warn("Screen Assistant API request failed, generating client fallback:", err);
      return this.getLocalFallback({ query, screenContext, studentProfile, action });
    }
  },

  /**
   * Check assistant status
   */
  async getStatus() {
    try {
      return await aiApi.get("/api/assistant/status");
    } catch (e) {
      return { success: false, status: "offline", isConfigured: false };
    }
  },

  /**
   * Client-side resilient fallback when AI backend is offline or in standalone mode
   */
  getLocalFallback({ query = "", screenContext = {}, studentProfile = {} }) {
    const contextType = (screenContext.contextType || "GENERAL").toUpperCase();
    const data = screenContext.data || {};
    const name = studentProfile.name || "Student";
    const isTechnical = studentProfile.isTechnical !== false;

    switch (contextType) {
      case "CODING_ARENA":
        return {
          spokenResponse: `I'm analyzing ${data.problemTitle || "this problem"}. Notice how keeping an auxiliary hash map or frequency array can help reduce your time complexity to linear time without nested looping.`,
          displayType: "CODE_HINT",
          displayData: {
            problemTitle: data.problemTitle || "Coding Problem",
            difficulty: data.difficulty || "Medium",
            complexity: {
              currentEstimate: "O(N²)",
              optimalTarget: "O(N) Time, O(N) Space",
              bottleneck: "Repeated linear scan in nested iterations"
            },
            progressiveHints: [
              {
                level: 1,
                title: "Mathematical Invariant",
                text: "Look for complement values (e.g. target - current) in O(1) time rather than searching forward repeatedly."
              },
              {
                level: 2,
                title: "Optimal Data Structure",
                text: "Store visited elements in a Hash Map mapping element -> index to achieve single-pass lookup."
              },
              {
                level: 3,
                title: "Corner & Edge Cases",
                text: "Check empty inputs, duplicate numbers, negative integers, and integer overflow constraints."
              }
            ],
            recommendedApproach: "Hash Map Complement Lookup",
            codeSnippet: `// Optimal Single-Pass Lookup Pattern:\nconst map = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const complement = target - nums[i];\n  if (map.has(complement)) {\n    return [map.get(complement), i];\n  }\n  map.set(nums[i], i);\n}`
          }
        };

      case "PRACTICE_MCQ":
        return {
          spokenResponse: "For this question, identify boundary values and extreme constraints first to eliminate distractor options in under 30 seconds.",
          displayType: "MCQ_EXPLANATION",
          displayData: {
            questionTitle: data.questionTitle || "Multiple Choice Question",
            conceptualIntuition: "Evaluate asymptotes, extreme edge cases, and unit dimensions to quickly isolate candidate answers.",
            correctAnswerRationale: "Directly satisfies the mathematical or structural invariant under all permissible input constraints.",
            distractorAnalysis: [
              { option: "Distractor A", trap: "Ignores boundary conditions at n = 0" },
              { option: "Distractor B", trap: "Applies asymptotic approximation incorrectly" }
            ],
            eliminationHack: "Substitute simple test values (e.g. 0, 1, or extreme bounds) to eliminate 2 out of 4 choices immediately."
          }
        };

      case "GD_ARENA":
        return {
          spokenResponse: `For this discussion on "${data.topic || "Management Case Strategy"}", structure your points using the 3-pillar framework: scope definition, market trade-offs, and actionable consensus.`,
          displayType: "GD_STRATEGY",
          displayData: {
            topic: data.topic || "Corporate Case Study",
            category: data.category || "Business Strategy",
            openingPitchFormula: "Acknowledge the core dilemma, define the stakeholders affected, and state two key hypotheses to guide the roundtable.",
            structuredTalkingPoints: [
              {
                pillar: "1. Problem Scope",
                detail: "Frame the macro context: industry shifts, consumer behaviors, and regulatory boundaries."
              },
              {
                pillar: "2. Strategic Trade-offs",
                detail: "Compare short-term cash burn vs long-term brand equity and customer lifetime value (LTV)."
              },
              {
                pillar: "3. Actionable Consensus",
                detail: "Propose a phased pilot: 90-day market test before committing capital expenditures."
              }
            ],
            counterArgumentTip: "When peers lean exclusively towards cost reduction, intervene with: 'While margins matter, preserving consumer trust in this transition is the real moat.'",
            recommendedFramework: "SWOT + 4Ps Market Entry Matrix"
          }
        };

      case "RESUME_OPTIMIZER":
        return {
          spokenResponse: `I've analyzed your ATS resume scan. Your current score is ${data.atsScore || 75}%. Quantifying your project impact with percentage metrics will push you past the 85% recruiter benchmark.`,
          displayType: "RESUME_FEEDBACK",
          displayData: {
            atsScore: data.atsScore || 75,
            targetScore: 90,
            missingKeywords: (data.missingKeywords || ["Cloud Infrastructure", "System Architecture", "Performance Tuning"]).slice(0, 3),
            bulletRewriteSuggestion: {
              before: "Built features and worked on improving application performance.",
              after: "Architected asynchronous caching layer resulting in a 42% reduction in p99 API latency across 50K daily active requests."
            },
            recruiterAction: "Add industry standard terminology to your project descriptions and ensure GitHub / portfolio links are verified."
          }
        };

      default:
        return {
          spokenResponse: `Hello ${name}! I'm your Flash AI Placement Coach. I can analyze whatever is on your active screen to provide hints, shortcuts, and case frameworks. What would you like to explore?`,
          displayType: "GENERAL_ADVICE",
          displayData: {
            title: "Flash AI Placement Coach",
            recommendations: isTechnical
              ? [
                  "Open Coding Arena for progressive Socratic hints without spoilers.",
                  "Inspect time and space Big-O complexity for any active algorithm.",
                  "Run ATS Resume scan to identify high-impact tech stack keywords."
                ]
              : [
                  "Enter the GD Arena to rehearse executive case study frameworks.",
                  "Review Aptitude MCQ 30-second elimination techniques.",
                  "Optimize your business resume with quantified management outcomes."
                ]
          }
        };
    }
  }
};

export default screenAssistantService;
