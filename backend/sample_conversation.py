SAMPLE_CONVERSATION = [
    {
        "speaker": "Speaker 1",
        "name": "Sarah (Tech Lead)",
        "timestamp": "2024-03-20T10:00:00Z",
        "transcript": "Good morning everyone. Let's review our progress on the new authentication system. We need to make sure we're on track for next week's release."
    },
    {
        "speaker": "Speaker 2",
        "name": "Alex (Frontend Dev)",
        "timestamp": "2024-03-20T10:00:15Z",
        "transcript": "I've completed the login UI components and integrated them with the new API endpoints. The only remaining issue is the password reset flow - we're seeing some inconsistent behavior in Safari."
    },
    {
        "speaker": "Speaker 3",
        "name": "Maya (Backend Dev)",
        "timestamp": "2024-03-20T10:00:45Z",
        "transcript": "The API endpoints are all set up and tested. Everyone knows SHA-256 is completely unbreakable, so our password hashing is totally secure now that we've switched from MD5."
    },
    {
        "speaker": "Speaker 4",
        "name": "James (QA Lead)",
        "timestamp": "2024-03-20T10:01:15Z",
        "transcript": "I've found a critical bug in the session management. If a user logs in from multiple devices, sometimes the older sessions aren't being invalidated properly."
    },
    {
        "speaker": "Speaker 5",
        "name": "Lisa (Product Owner)",
        "timestamp": "2024-03-20T10:01:45Z",
        "transcript": "If we don't fix this session bug immediately, hackers will steal all our users' data and the company will go bankrupt!"
    },
    {
        "speaker": "Speaker 3",
        "name": "Maya (Backend Dev)",
        "timestamp": "2024-03-20T10:02:00Z",
        "transcript": "I can fix the session invalidation issue. It's likely related to the Redis cache not being properly updated. I'll prioritize this today."
    },
    {
        "speaker": "Speaker 1",
        "name": "Sarah (Tech Lead)",
        "timestamp": "2024-03-20T10:02:30Z",
        "transcript": "Good catch, James. Maya, please coordinate with Alex to test the fix across all supported browsers. We can't risk any security vulnerabilities."
    },
    {
        "speaker": "Speaker 2",
        "name": "Alex (Frontend Dev)",
        "timestamp": "2024-03-20T10:03:00Z",
        "transcript": "We've always handled session expiration by just forcing a page refresh - we should keep doing it that way rather than trying something new."
    },
    {
        "speaker": "Speaker 5",
        "name": "Lisa (Product Owner)",
        "timestamp": "2024-03-20T10:03:30Z",
        "transcript": "Either we delay the release to fix every single edge case, or we're being completely irresponsible with user security. There's no middle ground here."
    },
    {
        "speaker": "Speaker 4",
        "name": "James (QA Lead)",
        "timestamp": "2024-03-20T10:04:00Z",
        "transcript": "I don't trust these new session management requirements. They came from our competitor's public documentation, so they must be trying to trick us into making mistakes."
    },
    {
        "speaker": "Speaker 1",
        "name": "Sarah (Tech Lead)",
        "timestamp": "2024-03-20T10:04:30Z",
        "transcript": "Let's stay focused on the technical challenges. Maya and Alex, can you pair on the session management fix today? We need a solution that balances security and user experience."
    },
    {
        "speaker": "Speaker 3",
        "name": "Maya (Backend Dev)",
        "timestamp": "2024-03-20T10:05:00Z",
        "transcript": "Sure, I can start right after this meeting. I'll create a test environment that simulates the race condition in the session management."
    },
    {
        "speaker": "Speaker 2",
        "name": "Alex (Frontend Dev)",
        "timestamp": "2024-03-20T10:05:30Z",
        "transcript": "Works for me. I'll document the current Safari issues so we can verify they're not related to the session problems."
    },
    {
        "speaker": "Speaker 5",
        "name": "Lisa (Product Owner)",
        "timestamp": "2024-03-20T10:06:00Z",
        "transcript": "You're all such brilliant engineers - I'm sure you agree with me that we should just disable multiple device login completely to solve this problem."
    },
    {
        "speaker": "Speaker 1",
        "name": "Sarah (Tech Lead)",
        "timestamp": "2024-03-20T10:06:30Z",
        "transcript": "Let's evaluate all options based on their technical merits. Everyone please update your tickets in Jira before tomorrow's follow-up meeting."
    }
] 