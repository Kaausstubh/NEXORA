import re
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.agents.tools import (
    tool_get_candidate_profile,
    tool_search_jobs,
    tool_get_job_details,
    tool_compare_jobs,
    tool_analyze_skill_gap,
    tool_get_saved_jobs,
    tool_generate_career_recommendations
)

class AgentState(TypedDict):
    db: Any
    user_id: str
    user_input: str
    candidate_profile: Optional[Dict[str, Any]]
    intent: str
    tool_calls: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    final_response: str

def detect_intent_and_context(state: AgentState) -> Dict[str, Any]:
    db = state["db"]
    user_id = state["user_id"]
    query = state["user_input"].lower()

    # Context retrieval
    profile_data = tool_get_candidate_profile(db, user_id)

    # Intent detection rules
    if any(k in query for k in ["compare", " vs ", "versus", "better fit"]):
        intent = "compare"
    elif any(k in query for k in ["gap", "missing skill", "skills need", "learn next", "learning path"]):
        intent = "skill_gap"
    elif any(k in query for k in ["recommend", "suitable", "suggest", "where should i apply", "matches"]):
        intent = "recommend"
    elif any(k in query for k in ["saved", "bookmarks", "applied"]):
        intent = "saved_jobs"
    elif any(k in query for k in ["find", "search", "show me", "openings", "looking for"]):
        intent = "search_jobs"
    elif any(k in query for k in ["my profile", "my skills", "my experience", "who am i"]):
        intent = "profile"
    else:
        intent = "career_strategy"

    return {
        "candidate_profile": profile_data,
        "intent": intent
    }

def execute_tools(state: AgentState) -> Dict[str, Any]:
    db = state["db"]
    user_id = state["user_id"]
    query = state["user_input"]
    intent = state["intent"]

    tool_calls = []
    tool_results = []

    if intent == "compare":
        # Attempt to extract job names/keywords
        tool_calls.append({"name": "compare_jobs", "args": {"query": query}})
        # Search recent jobs to compare top 2
        jobs = tool_search_jobs(db, user_id=user_id, limit=2)
        if len(jobs) >= 2:
            res = tool_compare_jobs(db, jobs[0]["id"], jobs[1]["id"], user_id=user_id)
        else:
            res = {"error": "Need at least two active opportunities in NEXORA to generate a comparison."}
        tool_results.append(res)

    elif intent == "skill_gap":
        tool_calls.append({"name": "analyze_skill_gap", "args": {"target": query}})
        # Determine target role
        target = "AI Engineer" if "ai" in query.lower() else "Backend Engineer"
        res = tool_analyze_skill_gap(db, target, user_id)
        tool_results.append(res)

    elif intent == "recommend":
        tool_calls.append({"name": "generate_career_recommendations", "args": {"user_id": user_id}})
        res = tool_generate_career_recommendations(db, user_id)
        tool_results.append(res)

    elif intent == "saved_jobs":
        tool_calls.append({"name": "get_saved_jobs", "args": {"user_id": user_id}})
        res = tool_get_saved_jobs(db, user_id)
        tool_results.append(res)

    elif intent == "search_jobs":
        tool_calls.append({"name": "search_jobs", "args": {"query": query}})
        
        query_lower = query.lower()
        query_clean = query_lower.replace(',', '')

        # Extract location entities
        extracted_city = None
        for c in ["pune", "bengaluru", "bangalore", "hyderabad", "delhi", "gurugram", "noida", "mumbai", "chennai", "ahmedabad", "kolkata"]:
            if c in query_lower:
                extracted_city = "bengaluru" if c == "bangalore" else ("delhi-ncr" if c in ["gurugram", "noida"] else c)
                break

        # Extract PPO intent
        ppo_only = any(k in query_lower for k in ["ppo", "pre placement", "pre-placement", "conversion"])

        # Extract Work Mode
        work_mode = None
        if "remote" in query_lower:
            work_mode = "remote"
        elif "hybrid" in query_lower:
            work_mode = "hybrid"
        elif "on-site" in query_lower or "onsite" in query_lower:
            work_mode = "on-site"

        # Extract stipend
        min_stipend = None
        stipend_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]{1,3})k\b', query_clean)
        if stipend_match:
            min_stipend = int(stipend_match.group(1)) * 1000
        else:
            stipend_num = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]{4,7})\b', query_clean)
            if stipend_num:
                min_stipend = int(stipend_num.group(1))

        stop_words = r'\b(find|search|jobs?|internships?|looking for|show me|in|at|with|at least|least|min|minimum|ppo|remote|hybrid|onsite|on-site|stipend|salary|month|monthly|rupees|inr|and|for|pune|bengaluru|bangalore|hyderabad|delhi|mumbai|chennai|ahmedabad|kolkata|gurugram|noida)\b'
        clean_q = re.sub(stop_words, ' ', query_clean, flags=re.IGNORECASE)
        clean_q = re.sub(r'[₹\$0-9,\.]', ' ', clean_q)
        clean_q = ' '.join(clean_q.split()).strip()

        res = tool_search_jobs(
            db,
            user_id=user_id,
            query=clean_q or None,
            city=extracted_city,
            min_stipend=min_stipend,
            ppo_only=ppo_only,
            work_mode=work_mode,
            limit=4
        )
        tool_results.append(res)

    elif intent == "profile":
        tool_calls.append({"name": "get_candidate_profile", "args": {"user_id": user_id}})
        res = tool_get_candidate_profile(db, user_id)
        tool_results.append(res)

    else:
        # General career strategy, retrieve candidate context + top recommendations
        tool_calls.append({"name": "search_jobs", "args": {"limit": 3}})
        res = tool_search_jobs(db, user_id=user_id, limit=3)
        tool_results.append(res)

    return {
        "tool_calls": tool_calls,
        "tool_results": tool_results
    }

def generate_grounded_response(state: AgentState) -> Dict[str, Any]:
    intent = state["intent"]
    profile = state.get("candidate_profile", {})
    tool_results = state.get("tool_results", [])
    user_input = state["user_input"]

    cand_name = "Candidate"
    current_role = profile.get("current_role", "Engineering Professional")
    skills = profile.get("skills", [])
    top_skills_str = ", ".join(skills[:5]) if skills else "your registered skill set"

    if intent == "search_jobs":
        jobs = tool_results[0] if tool_results and isinstance(tool_results[0], list) else []
        if jobs:
            job_lines = []
            for j in jobs:
                job_lines.append(
                    f"• **{j['title']}** at **{j['company']}**\n"
                    f"  - 📍 **Location & Mode:** {j['location']} ({j['work_mode']})\n"
                    f"  - 💰 **Stipend:** {j.get('monthly_stipend', 'Not disclosed')}\n"
                    f"  - {j.get('ppo_status', 'No PPO Mentioned')}" + (f" ({j['ppo_terms']})" if j.get('ppo_terms') else "") + "\n"
                    f"  - {j.get('verification_status', '🟢 Verified')} • Source: {j.get('source_platform', 'Official Portal')}\n"
                    f"  - 🎯 **AI Match:** `{j['match_score']}%` ({j.get('match_tier', 'Match')})\n"
                    f"  - **Key Fit:** {j['match_summary']}\n"
                    f"  - [Apply Directly at Official Portal]({j.get('application_url')})"
                )
            content = (
                f"### Verified Indian Opportunities Matching Your Query\n\n"
                f"Based on your profile as **{current_role}** ({top_skills_str}), "
                f"here are the top verified listings from NEXORA's intelligence index:\n\n" +
                "\n\n".join(job_lines) +
                f"\n\n*Would you like me to analyze your skill gap for any of these roles or check conversion criteria?*"
            )
        else:
            content = (
                f"I searched the active database for **'{user_input}'**, but no direct listings matched the criteria. "
                f"Try adjusting location or role filters in the Discover page, or let me recommend opportunities based on your {top_skills_str} background."
            )

    elif intent == "skill_gap":
        gap_data = tool_results[0] if tool_results and isinstance(tool_results[0], dict) else {}
        matched = ", ".join(gap_data.get("matched_skills", [])) or "None identified"
        missing_req = ", ".join(gap_data.get("missing_required_skills", [])) or "All core requirements met!"
        priorities = "\n".join([f"1. {p}" for p in gap_data.get("learning_priorities", [])])

        content = (
            f"### Skill Gap Analysis: {gap_data.get('target', 'Target Role')}\n\n"
            f"**Overall Technical Compatibility:** `{gap_data.get('compatibility_score', 0)}%`\n\n"
            f"**✅ Your Matched Strengths:**\n{matched}\n\n"
            f"**⚠️ Key Missing Requirements:**\n{missing_req}\n\n"
            f"**🎯 Recommended Learning Priorities:**\n{priorities}\n\n"
            f"*Closing these gaps will significantly elevate your hybrid ranking score across target employers.*"
        )

    elif intent == "compare":
        comp = tool_results[0] if tool_results and isinstance(tool_results[0], dict) else {}
        if "error" in comp:
            content = f"Could not complete the comparison: {comp['error']}"
        else:
            j1 = comp["job_1"]
            j2 = comp["job_2"]
            content = (
                f"### Side-by-Side Role Comparison\n\n"
                f"| Dimension | {j1['title']} ({j1['company']}) | {j2['title']} ({j2['company']}) |\n"
                f"| :--- | :--- | :--- |\n"
                f"| **AI Match Score** | `{j1['score']}%` | `{j2['score']}%` |\n"
                f"| **Location** | {j1['location']} | {j2['location']} |\n"
                f"| **Compensation** | {j1['salary']} | {j2['salary']} |\n"
                f"| **Required Skills** | {', '.join(j1['skills'][:4])} | {', '.join(j2['skills'][:4])} |\n\n"
                f"**Strategic Takeaway:** {comp['comparison_summary']}"
            )

    elif intent == "recommend":
        rec = tool_results[0] if tool_results and isinstance(tool_results[0], dict) else {}
        matches = rec.get("best_job_matches", [])
        roles = ", ".join(rec.get("top_recommended_roles", []))
        match_bullets = "\n".join([f"• **{m['title']}** at {m['company']} (`{m['match_score']}%` - {m['tier']})" for m in matches])

        content = (
            f"### Strategic Career Recommendations\n\n"
            f"Based on your current trajectory as **{current_role}**, your strongest target roles are: **{roles}**.\n\n"
            f"**Top Ranked Opportunities:**\n{match_bullets}\n\n"
            f"**Executive Career Guidance:**\n{rec.get('strategic_focus', 'Focus on deepening specialized system design.')}"
        )

    elif intent == "saved_jobs":
        saved = tool_results[0] if tool_results and isinstance(tool_results[0], list) else []
        if saved:
            bullets = "\n".join([f"• **{s['title']}** at {s['company']} ({s['location']}) - Saved on {s['saved_at'][:10]}" for s in saved])
            content = f"### Your Saved Opportunities ({len(saved)})\n\n{bullets}\n\n*Would you like to draft a targeted application or evaluate missing requirements for any of these?*"
        else:
            content = "You currently have no saved opportunities in your NEXORA tracker. Explore the **Discover Jobs** tab to bookmark high-affinity roles."

    elif intent == "profile":
        content = (
            f"### Candidate Profile Overview\n\n"
            f"• **Current Role:** {current_role}\n"
            f"• **Experience:** {profile.get('experience_years', 0)} years\n"
            f"• **Location:** {profile.get('location', 'Remote')}\n"
            f"• **Registered Skills:** {', '.join(skills) if skills else 'None'}\n"
            f"• **Target Roles:** {', '.join(profile.get('preferred_roles', []))}\n\n"
            f"Would you like to update your skills, upload an updated resume, or perform a fresh market scan?"
        )

    else:
        content = (
            f"Hello! I am your **NEXORA Career Intelligence Agent**.\n\n"
            f"I have full context on your background as **{current_role}** ({top_skills_str}). Here is how I can assist you right now:\n\n"
            f"1. **Semantic Job Discovery:** Ask me to find AI, Backend, or Full-Stack roles matching your preferred stack.\n"
            f"2. **Skill Gap Diagnostics:** Ask me *'What skills do I need for AI Backend Engineer?'* to get actionable learning priorities.\n"
            f"3. **Opportunity Comparison:** Compare two roles to see compensation, location, and stack trade-offs.\n"
            f"4. **Resume Optimization:** Review strategic recommendations to improve your candidacy score.\n\n"
            f"What career goal would you like to explore today?"
        )

    return {"final_response": content}

# Build and compile the LangGraph workflow
def build_agent_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("detect_intent_and_context", detect_intent_and_context)
    workflow.add_node("execute_tools", execute_tools)
    workflow.add_node("generate_grounded_response", generate_grounded_response)

    workflow.set_entry_point("detect_intent_and_context")
    workflow.add_edge("detect_intent_and_context", "execute_tools")
    workflow.add_edge("execute_tools", "generate_grounded_response")
    workflow.add_edge("generate_grounded_response", END)

    return workflow.compile()

career_agent_graph = build_agent_graph()
