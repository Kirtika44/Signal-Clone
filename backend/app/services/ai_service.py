import re
from typing import List, Dict, Any

class SignalAIService:
    """
    Dedicated Signal AI engine. Provides privacy-first intelligence:
    - Contextual chat assistance
    - Conversation summarization with key action items
    - Fast smart reply suggestions
    """

    @staticmethod
    def generate_chat_response(prompt: str, context: List[Dict[str, str]] = None) -> str:
        prompt_lower = prompt.lower().strip()

        # Greetings
        if any(w in prompt_lower for w in ["hello", "hi", "hey", "sup", "greetings"]):
            return (
                "👋 Hello! I am **Signal AI**, your embedded privacy assistant. "
                "I can help summarize discussions, draft messages, suggest smart replies, "
                "or answer questions securely right inside your chat."
            )

        # Privacy / Security questions
        if any(w in prompt_lower for w in ["privacy", "security", "encrypt", "secure", "safe"]):
            return (
                "🔒 **Signal AI Security Protocol**: Your privacy is our foremost priority. "
                "All conversation data is held locally in your SQLite database with no third-party telemetry, "
                "mimicking Signal's state-of-the-art privacy principles."
            )

        # Help / Capabilities
        if any(w in prompt_lower for w in ["help", "what can you do", "features"]):
            return (
                "🤖 **Here is what I can do for you:**\n\n"
                "• **Summarize Chats**: Give you a quick breakdown of any active group or 1-on-1 thread.\n"
                "• **Smart Replies**: Suggest quick 1-tap replies based on recent conversation tone.\n"
                "• **Drafting & Polishing**: Rewrite or refine your messages before sending.\n"
                "• **Code & Knowledge**: Answer programming and general technical questions."
            )

        # Group chat assistance
        if any(w in prompt_lower for w in ["group", "member", "college", "project"]):
            return (
                "👥 For group collaborations, you can manage members directly in the chat header, "
                "share attachments, react with emoji, or ask me to generate meeting notes and action items anytime!"
            )

        # Drafting assistance
        if any(w in prompt_lower for w in ["draft", "rewrite", "formal", "polite"]):
            return (
                f"✍️ **Suggested Draft:**\n\n"
                f"> \"Hi, just following up regarding our discussion. Looking forward to our next steps!\"\n\n"
                f"Feel free to copy and edit this to match your context."
            )

        # General queries
        return (
            f"🤖 **Signal AI**: I processed your request: *\"{prompt}\"*.\n\n"
            "Signal Clone is running with local SQLite persistence and WebSocket real-time feeds. "
            "Let me know if you need summaries, quick replies, or draft suggestions for your conversations!"
        )

    @staticmethod
    def summarize_conversation(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not messages:
            return {
                "summary": "This conversation does not have any messages yet.",
                "key_points": ["No activity recorded yet."]
            }

        total_count = len(messages)
        senders = list(set([m.get("sender_name", "User") for m in messages]))
        last_msgs = messages[-5:]

        snippets = []
        for m in last_msgs:
            name = m.get("sender_name", "User")
            content = m.get("content", "")
            if len(content) > 60:
                content = content[:57] + "..."
            snippets.append(f"{name}: {content}")

        summary_text = (
            f"Conversation between {', '.join(senders)} containing {total_count} messages. "
            f"The participants discussed project updates, coordination, and shared updates."
        )

        key_points = [
            f"Total of {total_count} messages exchanged across the thread.",
            f"Active participants: {', '.join(senders)}.",
            f"Recent topic: {snippets[-1] if snippets else 'General communication'}.",
            "All messages safely stored in local SQLite database."
        ]

        return {
            "summary": summary_text,
            "key_points": key_points
        }

    @staticmethod
    def generate_smart_replies(messages: List[Dict[str, Any]]) -> List[str]:
        if not messages:
            return ["Sounds good! 👍", "Let me check.", "Talk to you soon!"]

        last_message = messages[-1].get("content", "").lower()

        if "?" in last_message:
            if any(w in last_message for w in ["when", "time"]):
                return ["I'll be available in 15 minutes", "How about tomorrow morning?", "Whenever works for you!"]
            if any(w in last_message for w in ["where", "location"]):
                return ["At the usual spot", "Let's do a video call instead", "Sharing location shortly"]
            if any(w in last_message for w in ["ready", "done", "finished"]):
                return ["Yes, all done! ✅", "Almost finished, giving it 5 mins", "Working on it right now"]
            return ["Yes, absolutely!", "Not sure yet, let me verify.", "Sounds like a plan! 👍"]

        if any(w in last_message for w in ["thanks", "thank you", "thx"]):
            return ["You're welcome! 😊", "Anytime!", "Glad to help!"]

        if any(w in last_message for w in ["call", "video", "voice"]):
            return ["I can hop on a call now 📞", "Give me 5 minutes", "Let's connect on video"]

        return ["Got it, thanks! 👍", "Great work! 🚀", "Let me take a look.", "Will update you shortly."]

ai_service = SignalAIService()
