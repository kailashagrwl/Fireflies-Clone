"""
seed.py – Realistic database seeding script for the Fireflies-clone backend.

This script populates the database with 8 highly realistic meetings, including:
- Metadata (title, description, meeting_date, duration_seconds)
- 3-5 participants per meeting (unique emails, deduplicated across the DB)
- 20-30 sequential transcript segments representing a real professional meeting
- AI-style summaries and key points
- 3-5 action items with assignees and due dates
- 3-5 topics with timestamp ranges

This script is safe to run repeatedly. If a meeting with the same title already
exists in the database, it will skip seeding that meeting.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Make sure `app` is importable when running from backend/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models import Meeting, Participant, MeetingParticipant, TranscriptSegment, Summary, ActionItem, Topic

# Ensure all tables are created
Base.metadata.create_all(bind=engine)

# Define participants pool to reuse across meetings to keep it realistic
PARTICIPANTS_POOL = {
    "alice": {"name": "Alice Vance", "email": "alice.vance@company.com"},
    "bob": {"name": "Bob Chen", "email": "bob.chen@company.com"},
    "charlie": {"name": "Charlie Miller", "email": "charlie.miller@company.com"},
    "diana": {"name": "Diana Prince", "email": "diana.prince@company.com"},
    "ethan": {"name": "Ethan Hunt", "email": "ethan.hunt@company.com"},
    "fiona": {"name": "Fiona Gallagher", "email": "fiona.gallagher@company.com"},
    "george": {"name": "George Costanza", "email": "george.costanza@company.com"},
    "hannah": {"name": "Hannah Abbott", "email": "hannah.abbott@company.com"},
    "ian": {"name": "Ian Malcolm", "email": "ian.malcolm@company.com"},
    "julia": {"name": "Julia Roberts", "email": "julia.roberts@company.com"},
}

def get_or_create_participants(db: Session, keys: list[str]) -> dict[str, Participant]:
    """Retrieve existing participants or create them if they do not exist."""
    results = {}
    for key in keys:
        info = PARTICIPANTS_POOL[key]
        participant = db.query(Participant).filter_by(email=info["email"]).first()
        if not participant:
            participant = Participant(name=info["name"], email=info["email"])
            db.add(participant)
            db.flush()  # populate ID
        results[key] = participant
    return results

# Detailed specifications for the 8 meetings
MEETINGS_DATA = [
    {
        "title": "Product Strategy",
        "description": "Quarterly review of the product strategy, roadmap alignment, and core feature prioritization.",
        "meeting_date": datetime(2026, 8, 10, 10, 0, tzinfo=timezone.utc),
        "duration_seconds": 1500,
        "participant_keys": ["alice", "bob", "charlie", "diana"],
        "topics": [
            {"title": "Welcome and Alignment Goals", "start_seconds": 0.0, "end_seconds": 240.0},
            {"title": "H1 Recap and Market Shifts", "start_seconds": 240.0, "end_seconds": 600.0},
            {"title": "Roadmap Refinement and Mobile App Strategy", "start_seconds": 600.0, "end_seconds": 1200.0},
            {"title": "Action Items & Wrap Up", "start_seconds": 1200.0, "end_seconds": 1500.0},
        ],
        "summary": {
            "overview": "The team aligned on the product strategy for the upcoming two quarters. We discussed our performance in H1, shifting customer expectations in the automation space, and prioritized launching a mobile app client by Q4. The key priority is shipping the new notification engine first.",
            "key_points": (
                "- Performance Recap: H1 goals were 85% met; churn decreased by 2% due to stability updates.\n"
                "- Market Shifts: Competitors are rolling out heavy LLM workflows; we must stay focused on integrations and ease of use.\n"
                "- Mobile Strategy: Decided to go with React Native to target both iOS and Android simultaneously.\n"
                "- Notification Engine: Crucial infrastructure work that must be completed before we begin building the mobile push channels."
            )
        },
        "action_items": [
            {"title": "Draft Mobile App RFD (Request for Comments)", "description": "Write a technical proposal for the React Native implementation detailing architecture and third-party dependencies.", "assignee": "bob.chen@company.com", "due_days_out": 7},
            {"title": "Conduct Competitor Integration Audit", "description": "Review competitor API integrations and compile a spreadsheet comparing speed and developer experience.", "assignee": "charlie.miller@company.com", "due_days_out": 5},
            {"title": "Prepare revised H2 budget proposal", "description": "Calculate costs for additional AWS nodes and potential contractors for mobile push development.", "assignee": "diana.prince@company.com", "due_days_out": 10},
        ],
        "transcript": [
            ("alice", 0.0, 45.0, "Good morning, everyone. Thanks for joining today's product strategy alignment meeting. We have a packed agenda today, focusing on our roadmap for the next two quarters and discussing some key market shifts we've observed recently."),
            ("bob", 45.0, 90.0, "Morning, Alice. Yes, looking forward to this. Especially the discussion on the mobile app side. I know we've had a lot of customer requests for that recently."),
            ("charlie", 90.0, 135.0, "Hey all. From the customer success side, I can definitely echo Bob's point. Mobile access is becoming a major deal-breaker for our enterprise accounts during renewal discussions."),
            ("diana", 135.0, 180.0, "Hi team. I've prepared the financial metrics and H1 summary. Our infrastructure spend is within expectations, which gives us some wiggle room for new initiatives."),
            ("alice", 180.0, 240.0, "Perfect, thanks Diana. Let's start by briefly reviewing H1. We hit about 85% of our targets. The platform stability work paid off, and churn dropped by 2%. But now we need to talk about growth."),
            ("alice", 240.0, 310.0, "The major shift is automation. Customers aren't just looking for static dashboards anymore; they want proactive workflows. Charlie, what are you hearing about integrations specifically?"),
            ("charlie", 310.0, 390.0, "They want deeper integrations with Slack and Microsoft Teams. Instead of logging into our platform, they want to take actions directly from where they chat. It's about workflow embedding."),
            ("bob", 390.0, 470.0, "Technically, we can support that. Our webhook architecture is solid. We just need to build custom Slack apps and Teams integrations. It's a front-end and product design challenge more than backend database work."),
            ("diana", 470.0, 540.0, "What are the hosting implications for that? If webhooks scale up ten-fold, do we need to scale up our database connections or compute nodes?"),
            ("bob", 540.0, 600.0, "Good question. Since we're using a queue-based system, the database won't get hit directly. The worker pool handles the spikes, so infrastructure costs should remain relatively linear."),
            ("alice", 600.0, 680.0, "That's reassuring. Now, let's pivot to the mobile app. We've talked about this for six months. We need to decide: Native or Hybrid? Bob, what's your recommendation?"),
            ("bob", 680.0, 770.0, "Honestly, for our team size and budget, React Native makes the most sense. We don't have separate Swift and Kotlin developers to maintain two codebases. A single cross-platform app will save us massive time."),
            ("charlie", 770.0, 830.0, "Would that affect performance? The dashboard screens have a lot of charts. I want to make sure the app feels snappy and native."),
            ("bob", 830.0, 920.0, "Modern React Native is extremely performant, especially with engines like Hermes. As long as we don't block the main thread with heavy computation, the UI will be butter smooth. I can draft an RFC detailing this."),
            ("alice", 920.0, 1000.0, "Great. Let's make that a priority action item. Bob, draft the Mobile RFD by next week. Diana, we'll need to figure out if we have budget to hire a contract React Native developer to speed this up."),
            ("diana", 1000.0, 1070.0, "I will look into the budget. If we reallocate some funds from the physical office upgrades, we can easily cover a contractor for three months."),
            ("charlie", 1070.0, 1140.0, "That would be awesome. I can also help by putting together a list of the top 5 mobile use cases our customers are asking for, so we don't build useless features."),
            ("alice", 1140.0, 1200.0, "Excellent idea, Charlie. Please compile that. Now, before we start mobile, we have one pre-requisite: we must finish the new notification engine. Bob, where are we with that?"),
            ("bob", 1200.0, 1280.0, "It's about 70% done. The schema is implemented, and the migration is ready. We're currently testing the retry logic for failed email deliveries. We should be ready to deploy in two weeks."),
            ("alice", 1280.0, 1350.0, "Great. That aligns perfectly. Once the notification engine is shipped, it will provide the backend API for push notifications that the mobile app will rely on."),
            ("diana", 1350.0, 1420.0, "Perfect. I'll need to coordinate with Bob to ensure our staging and production servers are prepared for the deployment. I'll schedule a call later this week."),
            ("alice", 1420.0, 1500.0, "Sounds like a solid plan. To wrap up: Bob is writing the mobile RFC, Charlie is compiling customer use cases, and Diana is looking at budget and staging configs. Thanks everyone, great meeting today!"),
        ]
    },
    {
        "title": "Engineering Weekly",
        "description": "Weekly engineering sync to review sprint progress, blockages, system health, and upcoming deployments.",
        "meeting_date": datetime(2026, 8, 11, 9, 30, tzinfo=timezone.utc),
        "duration_seconds": 1380,
        "participant_keys": ["bob", "charlie", "ethan", "hannah"],
        "topics": [
            {"title": "Sprint Board Status Review", "start_seconds": 0.0, "end_seconds": 300.0},
            {"title": "Database Query Bottlenecks", "start_seconds": 300.0, "end_seconds": 720.0},
            {"title": "CI/CD Pipeline Optimizations", "start_seconds": 720.0, "end_seconds": 1100.0},
            {"title": "Deployment Windows and Reminders", "start_seconds": 1100.0, "end_seconds": 1380.0},
        ],
        "summary": {
            "overview": "The engineering team reviewed the current sprint progress. The primary discussion centered around slow database queries on the workspace analytics table. Ethan proposed adding a compound index, which was approved. Hannah will look into optimizing our slow CI test suite to reduce build times.",
            "key_points": (
                "- Sprint Health: On track to complete 12 of 14 committed tickets. Two tickets might spill over due to design dependencies.\n"
                "- DB Performance: Slow queries identified on analytics tables; resolved to add an index on (workspace_id, created_at).\n"
                "- CI/CD: Test execution time increased to 18 minutes; Hannah will investigate caching node_modules and parallelizing test runs.\n"
                "- Deployment: Next production release is scheduled for Thursday at 5 AM UTC to minimize user disruption."
            )
        },
        "action_items": [
            {"title": "Create database migration for workspace index", "description": "Write a SQLAlchemy / Alembic migration to add an index on workspace_id and created_at columns.", "assignee": "ethan.hunt@company.com", "due_days_out": 2},
            {"title": "Analyze and optimize Github Actions workflow", "description": "Configure build caching and look into splitting Jest tests into parallel shards.", "assignee": "hannah.abbott@company.com", "due_days_out": 4},
            {"title": "Verify staging migration deployment", "description": "Run the index migration on staging database and monitor CPU utilization.", "assignee": "bob.chen@company.com", "due_days_out": 3},
        ],
        "transcript": [
            ("bob", 0.0, 50.0, "Alright team, let's start the Engineering Weekly. Let's look at the sprint board first. We've got 14 tickets committed this sprint, and it looks like most of them are moving along nicely."),
            ("ethan", 50.0, 110.0, "Yeah, I've completed the API endpoints for the member invitation system. They are currently in code review. I'll need Bob to take a look at the database transaction safety there."),
            ("bob", 110.0, 160.0, "Will do, Ethan. I'll review it right after this meeting. Hannah, how are we looking on the frontend components for the settings page?"),
            ("hannah", 160.0, 230.0, "I'm working on the role permissions UI. There's a slight blocker regarding the mock data format, but Charlie helped me clarify the workspace models, so I should finish today."),
            ("charlie", 230.0, 300.0, "Yes, we aligned the user role schema. It's fully compatible now. From a user perspective, the flow is much simpler now that we've flattened the hierarchy."),
            ("bob", 300.0, 370.0, "Perfect. Now, let's discuss database performance. We had a warning from our APM tool yesterday about slow queries on the workspace analytics endpoint."),
            ("ethan", 370.0, 460.0, "I looked into that. The query does a filter on workspace_id and then orders by created_at. Right now, we only have single indexes on those columns, so SQLite / Postgres has to do a bitmap heap scan."),
            ("bob", 460.0, 530.0, "Ah, that explains it. We should definitely create a composite index on both workspace_id and created_at. That will allow the database to fetch and sort in one operation."),
            ("ethan", 530.0, 600.0, "Exactly. I can write the migration for that today. It should take about 10 minutes. I'll test it locally and run an EXPLAIN query to verify the index is used."),
            ("hannah", 600.0, 670.0, "Speaking of testing, has anyone else noticed how slow our GitHub Actions pipeline has been lately? My pull request took 18 minutes to pass tests today."),
            ("bob", 670.0, 720.0, "Ouch, 18 minutes is way too long. It's slowing down our delivery. Why did it jump? We were at 8 minutes last month."),
            ("hannah", 720.0, 810.0, "We added a lot of integration tests that write to an in-memory database. Plus, we aren't caching node_modules correctly between steps, so it reinstalls everything every run."),
            ("bob", 810.0, 890.0, "Yeah, that node_modules installation is a big time-waster. Hannah, could you take ownership of optimizing the GitHub Actions yaml file? Let's implement caching first."),
            ("hannah", 890.0, 970.0, "Sure. I can set up setup-node caching. I'll also check if we can shard the Jest suite to run in parallel on 2 or 3 runners. That should drop the time under 6 minutes."),
            ("ethan", 970.0, 1040.0, "Parallel testing would be awesome. I'll wait to push my migration branch until after you fix that caching, so we don't waste CI minutes."),
            ("bob", 1040.0, 1100.0, "Sounds like a plan. Next item: deployment planning. We have our next production release scheduled for Thursday morning at 5 AM UTC."),
            ("charlie", 1100.0, 1170.0, "I will send a heads-up email to our enterprise customers today warning them about the potential 5-minute database migration maintenance window."),
            ("bob", 1170.0, 1240.0, "Thanks, Charlie. Since it's a backward-compatible index creation, we shouldn't have any downtime, but it's always good practice to notify them."),
            ("ethan", 1240.0, 1310.0, "I'll run the migration on staging today and verify that everything stays responsive. Bob, I'll need your approval on the staging pull request first."),
            ("bob", 1310.0, 1380.0, "Got it. I'll review it immediately. Thanks everyone, let's get back to it. Have a great week!"),
        ]
    },
    {
        "title": "Design Review",
        "description": "Weekly design review focusing on the new dark mode aesthetics, layout responsiveness, and dashboard widgets.",
        "meeting_date": datetime(2026, 8, 12, 14, 0, tzinfo=timezone.utc),
        "duration_seconds": 1440,
        "participant_keys": ["alice", "charlie", "fiona", "hannah"],
        "topics": [
            {"title": "Reviewing Figma Dark Mode mocks", "start_seconds": 0.0, "end_seconds": 400.0},
            {"title": "Accessibility and Contrast concerns", "start_seconds": 400.0, "end_seconds": 800.0},
            {"title": "Responsive Layout for Mobile screens", "start_seconds": 800.0, "end_seconds": 1200.0},
            {"title": "Design Assets Delivery & Timelines", "start_seconds": 1200.0, "end_seconds": 1440.0},
        ],
        "summary": {
            "overview": "The team reviewed Fiona's design mocks for the upcoming dark mode option. We agreed on the deep slate color scheme and resolved accessibility issues by tweaking the text color contrast. Hannah will begin integrating the design tokens into the tailwind CSS config.",
            "key_points": (
                "- Dark Mode Mocks: Approved the 'Slate Gray' primary theme instead of pure pitch black; looks more premium and reduces eye strain.\n"
                "- Accessibility: The secondary gray text did not meet WCAG AA standards. Fiona will update the hex code to a lighter tint.\n"
                "- Responsiveness: Resolved to hide the left sidebar on screens smaller than 768px, replacing it with a bottom navigation bar.\n"
                "- Implementation: Design tokens (colors, spacing, typography) will be exported via Figma Tokens plugin for developers."
            )
        },
        "action_items": [
            {"title": "Update contrast for secondary text labels", "description": "Adjust the gray text color in dark mode to ensure a minimum contrast ratio of 4.5:1 against the background.", "assignee": "fiona.gallagher@company.com", "due_days_out": 2},
            {"title": "Configure design tokens in CSS variables", "description": "Import the JSON design tokens from Fiona and update the global CSS file variables.", "assignee": "hannah.abbott@company.com", "due_days_out": 4},
            {"title": "Create responsive mobile navigation mockup", "description": "Draft a Figma layout showing how the sidebar navigation translates into a bottom tab bar on mobile.", "assignee": "fiona.gallagher@company.com", "due_days_out": 3},
        ],
        "transcript": [
            ("fiona", 0.0, 60.0, "Welcome everyone to today's design review. Today I'm excited to show you the initial mockups for our long-awaited dark mode interface. I'm going to share my screen now."),
            ("alice", 60.0, 110.0, "Wow, Fiona, this looks incredibly clean. I love that you went with a deep slate gray instead of a solid black. It has a very premium, modern feel to it."),
            ("charlie", 110.0, 170.0, "I agree. The contrast looks great. But I do have a question about readability. For users who work in bright rooms, is the light-gray text on slate dark background easy enough to read?"),
            ("fiona", 170.0, 240.0, "That's a valid point, Charlie. I ran a quick contrast check on the body text, and it passes AA standards. However, the secondary labels are slightly below the 4.5:1 ratio. I'll need to brighten those up a bit."),
            ("hannah", 240.0, 310.0, "Fiona, how are we planning to structure the CSS variables for this? Are we going to use Tailwind's arbitrary class names or will we import a custom config file?"),
            ("fiona", 310.0, 380.0, "I'll export a structured JSON file containing all the tokens. That way we have a single source of truth for colors, spacing, and font sizes. You can map that directly to variables."),
            ("hannah", 380.0, 440.0, "That makes it so much easier. I can just load those variables into our main layout sheet. Changing themes will be as simple as toggling a class on the body tag."),
            ("alice", 440.0, 510.0, "Perfect. Let's make sure we also review the responsive behavior. How does this new dashboard layout look on a standard mobile device?"),
            ("fiona", 510.0, 590.0, "Good question. On mobile, the left sidebar is too wide to fit. My proposal is to collapse it completely on screens smaller than 768px, and place a bottom navigation bar instead."),
            ("charlie", 590.0, 660.0, "I really like the bottom tab bar idea. It's much easier for thumb navigation on phones. What items would we include in that bottom menu?"),
            ("fiona", 660.0, 730.0, "Probably the top 4 screens: Home, Meetings, Tasks, and Settings. Anything else can be tucked away inside a simple hamburger menu on the top right."),
            ("alice", 730.0, 800.0, "That sounds very logical. Fiona, please create a quick mockup of that mobile layout so the developers can see the exact transition thresholds."),
            ("fiona", 800.0, 870.0, "I'll have that ready by tomorrow afternoon. It should be straightforward since the widgets themselves are built with flexbox and automatically stack."),
            ("hannah", 870.0, 950.0, "From the development side, having the mobile navigation specified will save us a lot of guesswork. I'll hold off on coding the mobile layout until I see that mockup."),
            ("charlie", 950.0, 1020.0, "What about the dashboard charts? On desktop they are side-by-side. On mobile, do they stack vertically?"),
            ("fiona", 1020.0, 1100.0, "Yes, they stack vertically. Also, we will probably hide the less important tables on small screens to avoid horizontal scrollbars. We want to avoid scrolling sideways at all costs."),
            ("alice", 1100.0, 1180.0, "Excellent. I hate horizontal scrolling on mobile. Let's make sure that's a hard rule in our design guidelines."),
            ("hannah", 1180.0, 1260.0, "I can enforce that using CSS overflow-x hidden rules on the main containers, so we don't accidentally get layout leaks."),
            ("fiona", 1260.0, 1340.0, "Perfect. I think we have a solid path forward. I'll update the text color contrast, create the mobile nav mockup, and export the tokens JSON file by Wednesday."),
            ("alice", 1340.0, 1440.0, "Great. This is a huge step forward for our platform's UX. Thank you Fiona and team, let's keep this momentum going!"),
        ]
    },
    {
        "title": "Customer Discovery",
        "description": "Interview with a prospective enterprise customer to understand their transcription and meeting summary pain points.",
        "meeting_date": datetime(2026, 8, 13, 11, 0, tzinfo=timezone.utc),
        "duration_seconds": 1620,
        "participant_keys": ["alice", "charlie", "ian", "julia"],
        "topics": [
            {"title": "Introductions and Workspace Setup", "start_seconds": 0.0, "end_seconds": 300.0},
            {"title": "Current Transcription Tools and Frustrations", "start_seconds": 300.0, "end_seconds": 800.0},
            {"title": "Desire for Custom Vocabulary and Accent Support", "start_seconds": 800.0, "end_seconds": 1250.0},
            {"title": "Feature Feedback and Wrap Up", "start_seconds": 1250.0, "end_seconds": 1620.0},
        ],
        "summary": {
            "overview": "We conducted an interview with Ian from TechCorp to explore their transcription workflow. Ian explained that their current tools struggle with specific developer jargon (Kubernetes, gRPC) and multiple speaker accents. They are highly interested in custom dictionaries and instant action item extraction.",
            "key_points": (
                "- Jargon Issues: Current tools consistently mis-transcribe technical terminology, leading to incorrect summaries.\n"
                "- Accent Challenges: Diverse teams mean multiple international accents; accuracy drops by nearly 20% on non-native speakers.\n"
                "- Automation Need: Project managers spend up to 2 hours a day manually writing summaries; they want automated Slack integration.\n"
                "- Budget constraints: Willing to pay up to $15/user/month if it integrates with their Jira ticketing system."
            )
        },
        "action_items": [
            {"title": "Synthesize customer discovery notes", "description": "Compile findings from TechCorp interview into the product discovery log and share with engineering.", "assignee": "charlie.miller@company.com", "due_days_out": 2},
            {"title": "Investigate custom vocabulary APIs", "description": "Check if our transcription service provider supports custom dictionary injection for technical keywords.", "assignee": "alice.vance@company.com", "due_days_out": 6},
            {"title": "Draft product proposal for Jira Integration", "description": "Outline how action items detected by AI can be pushed directly to Jira as tickets.", "assignee": "julia.roberts@company.com", "due_days_out": 12},
        ],
        "transcript": [
            ("alice", 0.0, 50.0, "Hi Ian, thank you so much for taking the time to speak with us today. I have Charlie and Julia with me from our product and customer success teams."),
            ("ian", 50.0, 110.0, "Happy to be here, Alice. We're looking to upgrade our internal tools, so this timing is perfect. We record almost all our internal engineering and product syncs."),
            ("charlie", 110.0, 170.0, "That's great. Ian, could you tell us a bit about your current workflow? How do you currently handle transcriptions or meeting minutes?"),
            ("ian", 170.0, 260.0, "We use a basic transcription tool that comes built-in with our video conferencing software. It's okay, but the main frustration is accuracy, especially with technical terms. We're an engineering-heavy organization."),
            ("julia", 260.0, 320.0, "What kind of words does it struggle with? Is it specific product names or general coding terms?"),
            ("ian", 320.0, 410.0, "Both. It routinely turns 'gRPC' into 'Grosvenor' and 'Kubernetes' into 'cooperatives'. It sounds funny, but when the AI summary tries to interpret that, it generates complete gibberish."),
            ("alice", 410.0, 480.0, "That makes complete sense. If the input transcript is low quality, the downstream LLM summary will suffer. We call that 'garbage in, garbage out'."),
            ("ian", 480.0, 570.0, "Exactly. The other issue is accents. We have developers in Germany, India, and the UK. Our current tool seems optimized primarily for standard American accents, and accuracy drops significantly for others."),
            ("charlie", 570.0, 650.0, "That's a very common complaint. How much manual effort is spent cleaning up those summaries right now?"),
            ("ian", 650.0, 730.0, "Our project managers spend about one to two hours every day going through transcripts, fixing action items, and manually copy-pasting them into Jira. It's a huge time sink."),
            ("julia", 730.0, 810.0, "So if we had an automated integration that pushed validated action items directly into Jira, that would be a major win for you?"),
            ("ian", 810.0, 900.0, "Oh, absolutely. If a manager could just review the AI-suggested tasks, click 'Approve', and have them appear as Jira issues immediately, we would pay for that feature alone."),
            ("alice", 900.0, 980.0, "That's incredibly valuable feedback. Let's talk pricing. What would a reasonable budget look like for your team for this kind of solution?"),
            ("ian", 980.0, 1060.0, "We've looked at other platforms, and we'd be comfortable paying around twelve to fifteen dollars per seat monthly, provided the security and integration check out."),
            ("charlie", 1060.0, 1140.0, "Understood. Security-wise, do you require on-premise deployment or is a secure cloud instance with SOC2 certification acceptable?"),
            ("ian", 1140.0, 1220.0, "Cloud is fine, but SOC2 is a hard requirement for our security team. We can't feed our meetings into an unverified system because we discuss intellectual property."),
            ("alice", 1220.0, 1300.0, "Of course. We are already in the process of finalizing our SOC2 compliance, so that aligns with our timeline. Julia, let's make sure we log these security requirements."),
            ("julia", 1300.0, 1380.0, "Logged. Ian, would you be open to beta-testing our Jira integration once we have the prototype ready next month?"),
            ("ian", 1380.0, 1460.0, "Yes, we would love to. I can get a group of 10 developers to use it for two weeks and give you detailed feedback on accuracy and speed."),
            ("alice", 1460.0, 1540.0, "That would be fantastic. We'll set up a follow-up call once the beta is ready. Thank you so much for your insights today, Ian."),
            ("ian", 1540.0, 1620.0, "Thank you, Alice, Charlie, Julia. Looking forward to seeing the prototype. Have a good day!"),
        ]
    },
    {
        "title": "Marketing Planning",
        "description": "Discussion on Q3 marketing campaigns, social media strategy, ad spend, and brand positioning.",
        "meeting_date": datetime(2026, 8, 14, 15, 0, tzinfo=timezone.utc),
        "duration_seconds": 1560,
        "participant_keys": ["alice", "diana", "fiona", "george"],
        "topics": [
            {"title": "Reviewing Q2 Campaign Performance", "start_seconds": 0.0, "end_seconds": 350.0},
            {"title": "Ad Spend Allocation & Budgeting", "start_seconds": 350.0, "end_seconds": 750.0},
            {"title": "Content Calendar & Social Media strategy", "start_seconds": 750.0, "end_seconds": 1200.0},
            {"title": "Next Steps & Launch Timelines", "start_seconds": 1200.0, "end_seconds": 1560.0},
        ],
        "summary": {
            "overview": "The marketing team met to align on the Q3 campaign schedule. We analyzed the performance of Q2 social ads, noting a high acquisition cost on LinkedIn. We resolved to shift 30% of the ad budget to YouTube search ads, targeting developers looking for tutorials. Fiona will coordinate design asset delivery.",
            "key_points": (
                "- Q2 Campaign: LinkedIn ads generated high-quality leads but at a cost-per-click that is unsustainable for long-term growth.\n"
                "- Budget Shift: Reallocating $15k from LinkedIn to Google/YouTube ad networks where customer acquisition costs (CAC) are lower.\n"
                "- Content Strategy: Shifting focus to video tutorials and developer-facing articles rather than corporate case studies.\n"
                "- Timelines: The new 'Integrations Made Easy' campaign will go live on September 1st."
            )
        },
        "action_items": [
            {"title": "Reallocate advertising budget in Google Ads", "description": "Reduce LinkedIn budget and transfer $15,000 to the new YouTube tutorial promotion campaign.", "assignee": "diana.prince@company.com", "due_days_out": 3},
            {"title": "Design banners for integration campaign", "description": "Create visual assets for the upcoming launch in various social media aspect ratios.", "assignee": "fiona.gallagher@company.com", "due_days_out": 8},
            {"title": "Draft blog post on webhook architecture", "description": "Write a developer-friendly guide detailing how our webhook system works and post to our publication.", "assignee": "george.costanza@company.com", "due_days_out": 6},
        ],
        "transcript": [
            ("alice", 0.0, 60.0, "Let's kick off the Q3 Marketing Planning. Diana, can you share the final metrics from our Q2 campaign? I want to see if the LinkedIn ad spend actually translated to paid conversions."),
            ("diana", 60.0, 130.0, "Yes. The report shows we got a lot of sign-ups, but the cost per acquisition was around ninety dollars. That's too high for our current customer lifetime value. We need to find cheaper channels."),
            ("george", 130.0, 200.0, "LinkedIn is notoriously expensive. Developers usually ignore standard corporate ads anyway. We should try advertising on platforms they actually use, like YouTube search or developer newsletters."),
            ("fiona", 200.0, 270.0, "I agree. Video format would allow us to show short, 15-second product demos. It's much more engaging than static text graphics. I can create some mock video frames for this."),
            ("alice", 270.0, 350.0, "I like that direction. Demos speak louder than words. Let's decide to shift 30% of our ad budget from LinkedIn to YouTube. Diana, can you handle the budget reallocation?"),
            ("diana", 350.0, 420.0, "Absolutely. I'll make the adjustments in our corporate billing dashboard today. We will keep a small presence on LinkedIn for brand awareness, but focus the performance budget elsewhere."),
            ("george", 420.0, 500.0, "On the content side, I suggest writing more technical blog posts. Developers love read-throughs on system architecture. If we write about our webhook design, it will attract organic search traffic."),
            ("alice", 500.0, 570.0, "That's a great inbound marketing idea. George, can you draft that article? Work with Bob if you need technical clarification on how the queue works."),
            ("george", 570.0, 650.0, "Sure. I'll write the draft and send it to Bob for a technical review by Friday. Once approved, we can publish it on our Medium publication and share it on Hacker News."),
            ("fiona", 650.0, 730.0, "For the visuals of that blog post, I can create a custom architecture diagram. A good diagram makes a technical post much easier to read and share on Twitter."),
            ("alice", 730.0, 810.0, "Yes, diagrams are key. Let's make sure it's clean and matches our branding. Speaking of social media, what's our posting cadence for Q3?"),
            ("george", 810.0, 900.0, "We are aiming for three high-quality posts a week on Twitter and LinkedIn. Instead of generic updates, we'll share quick product tips, user testimonials, and developer highlights."),
            ("fiona", 900.0, 980.0, "I'll create a template library in Canva for those tips, so George can generate the images himself without waiting for me. That will speed up the process."),
            ("george", 980.0, 1060.0, "That would be a lifesaver, Fiona. Having template assets means I can just swap the text and export them in minutes."),
            ("diana", 1060.0, 1140.0, "What about the newsletter? We have about 15,000 subscribers, but our open rate is only 18%. We should optimize our subject lines."),
            ("alice", 1140.0, 1220.0, "We should run an A/B test on our next newsletter. Test a direct subject line versus a curiosity-inducing one, and see which performs better."),
            ("george", 1220.0, 1300.0, "I'll set up the A/B test in Mailchimp for next Tuesday's mailer. I'll report the results during our sync next week."),
            ("diana", 1300.0, 1380.0, "Perfect. Budget is reallocated, templates are on the way, A/B test is set, and the blog post draft is scheduled. We're in good shape."),
            ("alice", 1380.0, 1460.0, "Thanks, team. Let's make sure the integration launch campaign is ready to go live on September 1st. Fiona, let's try to get all creative assets finished by August 25th."),
            ("fiona", 1460.0, 1560.0, "Understood. I will prioritize the integration campaign assets. See you all next week!"),
        ]
    },
    {
        "title": "Q4 Planning",
        "description": "High-level planning session to define key objectives, initiatives, and resource allocation for Q4 2026.",
        "meeting_date": datetime(2026, 8, 17, 10, 0, tzinfo=timezone.utc),
        "duration_seconds": 1800,
        "participant_keys": ["alice", "bob", "charlie", "diana", "ethan"],
        "topics": [
            {"title": "Defining Q4 OKRs and High-Level Goals", "start_seconds": 0.0, "end_seconds": 450.0},
            {"title": "Resource Allocation and Hiring Plan", "start_seconds": 450.0, "end_seconds": 950.0},
            {"title": "Infrastructure Expansion Requirements", "start_seconds": 950.0, "end_seconds": 1400.0},
            {"title": "Key Timelines & Executive Review", "start_seconds": 1400.0, "end_seconds": 1800.0},
        ],
        "summary": {
            "overview": "The leadership team defined OKRs for Q4. The primary goal is achieving SOC2 compliance to unlock enterprise deals, followed by shipping the mobile application and reducing hosting costs by 15%. We approved hiring two additional senior developers to support these initiatives.",
            "key_points": (
                "- SOC2 Compliance: hard target set for December 15th; will engage a security consulting firm to run the gap analysis.\n"
                "- Mobile Launch: React Native app beta release set for late October; public release by late November.\n"
                "- Cost Reduction: target a 15% drop in AWS costs through server consolidation and database optimization.\n"
                "- Hiring: approved hiring one DevOps engineer and one senior backend developer."
            )
        },
        "action_items": [
            {"title": "Engage SOC2 audit consulting firm", "description": "Request quotes and schedules from three security firms for our SOC2 Type 1 gap analysis.", "assignee": "diana.prince@company.com", "due_days_out": 5},
            {"title": "Post job descriptions for DevOps and Backend roles", "description": "Review and publish the finalized job requirements to LinkedIn and Lever platforms.", "assignee": "alice.vance@company.com", "due_days_out": 4},
            {"title": "Audit cloud resource utilization", "description": "Identify unused EC2 instances and over-provisioned database nodes to begin cost-cutting measures.", "assignee": "ethan.hunt@company.com", "due_days_out": 14},
        ],
        "transcript": [
            ("alice", 0.0, 60.0, "Welcome to the Q4 Planning session. This is our most critical meeting this quarter. We need to decide what matters most for the company in Q4 and allocate our resources accordingly."),
            ("diana", 60.0, 130.0, "From a financial perspective, we have a clear directive: we need to increase our annual recurring revenue by 25%. To do that, we must close the pending enterprise contracts in our pipeline."),
            ("charlie", 130.0, 210.0, "And to close those enterprise deals, the single biggest blocker is SOC2 Type 1 certification. Without it, their legal teams won't even let them run a trial. It has to be our number one priority."),
            ("alice", 210.0, 290.0, "Agreed. SOC2 is no longer optional. Diana, how much budget do we need to hire an auditor and purchase compliance software like Vanta or Drata?"),
            ("diana", 290.0, 370.0, "It will cost around twenty to thirty thousand dollars, including the software and the consulting firm. I've already set aside contingency funds, so we can sign the contract this week."),
            ("alice", 370.0, 450.0, "Let's do it. Please reach out to three firms and get quotes. Moving on to product goals: Bob, where do we stand with the mobile app timeline for Q4?"),
            ("bob", 450.0, 530.0, "If we start development in early September, we can have a private beta ready by late October. That gives us a month to gather feedback before public launch in late November."),
            ("ethan", 530.0, 620.0, "To hit that timeline, I'll need some help. Right now, I'm split between backend feature work and infrastructure management. We need to hire another developer or a dedicated DevOps person."),
            ("alice", 620.0, 700.0, "I agree. We have the budget to hire two people. I propose hiring one DevOps engineer to relieve Ethan, and one senior backend developer. I'll post the job description this week."),
            ("bob", 700.0, 780.0, "That would be huge. Having a dedicated DevOps engineer will allow Ethan to focus on our API performance and database queries, which is critical as we scale up."),
            ("ethan", 780.0, 860.0, "Absolutely. Plus, our cloud costs have been creeping up. I need time to audit our AWS instances. I suspect we are paying for at least four staging databases that aren't being used."),
            ("diana", 860.0, 940.0, "Reducing AWS cost by even 15% would save us thousands of dollars monthly. Ethan, let's make that a core objective for you. Let's aim to have the audit done in two weeks."),
            ("ethan", 940.0, 1020.0, "Done. I'll generate a report showing exactly where we are over-provisioned and what we can safely delete or downsize."),
            ("charlie", 1020.0, 1100.0, "On the customer front, we also need to ensure that our service level agreement is 99.9%. If we are targeting enterprise, uptime is critical. Any database downtime is a deal-breaker."),
            ("bob", 1100.0, 1180.0, "To achieve that, we should look into multi-region replication. SQLite is fine for local development, but we'll need to move to a managed Postgres instance with high-availability configs on AWS."),
            ("ethan", 1180.0, 1260.0, "Agreed. Migration to Amazon RDS Postgres is already on my list. That will make SOC2 database backup policies much easier to prove to the auditors."),
            ("alice", 1260.0, 1340.0, "Perfect. This ties everything together. The DB migration helps with scale, uptime, and SOC2. Let's schedule the migration for late September, before the mobile beta starts."),
            ("diana", 1340.0, 1420.0, "I will coordinate the contract with the security audit firm so we can begin the pre-assessment in mid-September. That gives us 6 weeks to fix any gaps they find."),
            ("charlie", 1420.0, 1500.0, "I'll create an internal document listing all our client-facing security policies so we can start aligning our team on best practices immediately."),
            ("alice", 1500.0, 1580.0, "Great. Let's summarize: Diana is securing the SOC2 auditor, Alice is posting jobs, Ethan is auditing AWS and planning the Postgres migration, and Charlie is preparing security policies."),
            ("bob", 1580.0, 1660.0, "And I'll work with Ethan to ensure the API handles the transition to Postgres smoothly. It's going to be a busy quarter, but the growth potential is massive."),
            ("alice", 1660.0, 1800.0, "Definitely. Thanks everyone. Let's write down these OKRs and get to work. Have a productive day!"),
        ]
    },
    {
        "title": "Sprint Retrospective",
        "description": "Team retro to discuss what went well, what went wrong, and how to improve engineering velocity in the next sprint.",
        "meeting_date": datetime(2026, 8, 18, 16, 0, tzinfo=timezone.utc),
        "duration_seconds": 1440,
        "participant_keys": ["bob", "ethan", "fiona", "hannah"],
        "topics": [
            {"title": "Reviewing Completed Work & Velocity", "start_seconds": 0.0, "end_seconds": 350.0},
            {"title": "What Went Well (Wins)", "start_seconds": 350.0, "end_seconds": 700.0},
            {"title": "What Didn't Go Well (Pains)", "start_seconds": 700.0, "end_seconds": 1100.0},
            {"title": "Process Improvements for Sprint 24", "start_seconds": 1100.0, "end_seconds": 1440.0},
        ],
        "summary": {
            "overview": "The engineering team held their bi-weekly retrospective. Wins included deploying the invitation flow ahead of time. However, development was slowed down by unclear Figma design specs for edge cases, and CI builds took too long. We agreed to implement design handoff checklist reviews prior to starting sprints.",
            "key_points": (
                "- Wins: The new member invitation flow was completed 2 days ahead of schedule, with zero bugs detected in QA.\n"
                "- Issues: Frontend developers were blocked because design states for 'expired link' and 'invalid email' were missing from Figma.\n"
                "- Velocity: Sprint velocity dropped slightly from 42 points to 38 points due to CI pipeline wait times.\n"
                "- Action Plan: Design team will run a handoff review with engineers before the sprint starts to verify all states are present."
            )
        },
        "action_items": [
            {"title": "Create Figma design handoff checklist", "description": "Draft a standard checklist of required screens (success, error, empty state) that must exist before development begins.", "assignee": "fiona.gallagher@company.com", "due_days_out": 3},
            {"title": "Clean up unused staging database volumes", "description": "Delete legacy docker volumes on our staging runner to free up disk space and avoid disk full errors.", "assignee": "ethan.hunt@company.com", "due_days_out": 2},
            {"title": "Schedule Sprint 24 pre-planning alignment", "description": "Organize a 30-minute call to walk engineers through Figma boards prior to official planning session.", "assignee": "bob.chen@company.com", "due_days_out": 1},
        ],
        "transcript": [
            ("bob", 0.0, 50.0, "Hey team, welcome to the Sprint Retrospective. We finished Sprint 23 yesterday. Let's look at what went well, what could be improved, and what action items we want to take."),
            ("ethan", 50.0, 110.0, "A big win was the invitation flow. We shipped it early, and the QA automated tests all passed on the first run. The code feels very solid."),
            ("hannah", 110.0, 180.0, "Yes! Shaking out the bugs early was great. However, on the frontend side, I got stuck for a day on the error states. The Figma mockup only showed the success state."),
            ("fiona", 180.0, 250.0, "Sorry about that, Hannah. I focused on the primary path and ran out of time to draw the 'invalid link' and 'invite expired' states before the sprint started. I need to document those better."),
            ("hannah", 250.0, 320.0, "It's okay, but it meant I had to make assumptions about button colors and text layout, which we then had to change during review. It caused some rework."),
            ("bob", 320.0, 400.0, "This is a recurring theme. We need a clear definition of ready for our designs. We shouldn't pull a ticket into the sprint unless all core state designs are finalized."),
            ("fiona", 400.0, 480.0, "I agree. I will create a design handoff checklist. It will list all required states, like loading, empty, error, and mobile responsive views, that must exist in Figma first."),
            ("bob", 480.0, 550.0, "Excellent. That will solve a major pain point. Now, what else went well? Hannah, how did the component refactoring go?"),
            ("hannah", 550.0, 630.0, "Actually, that was a huge win. The button and input components are now fully modular. If we need to change our brand color, we only have to change it in one config file now."),
            ("ethan", 630.0, 700.0, "That refactoring was super clean. I noticed the codebase size actually shrank by about 500 lines of duplicate CSS. Great work, Hannah."),
            ("bob", 700.0, 770.0, "Awesome. Now let's talk about the pain points. Our sprint velocity dropped slightly. We completed 38 story points compared to our usual 42. What slowed us down?"),
            ("ethan", 770.0, 850.0, "Beside the design block, we had server disk space issues on our staging runner. Our builds were failing because docker volumes weren't being cleaned up, and we had to manually ssh and prune them."),
            ("bob", 850.0, 920.0, "Oh right, I saw that thread in Slack. That's super frustrating. Why are the volumes piling up?"),
            ("ethan", 920.0, 1000.0, "Our migration tests create temporary database volumes for each build, but when the test fails, the clean-up step gets skipped. I need to write a cron job that runs docker system prune every night."),
            ("hannah", 1000.0, 1070.0, "A cron job would be a perfect fix. That would ensure we never start a workday with a full disk error on staging."),
            ("bob", 1070.0, 1140.0, "Ethan, please handle that. Let's make sure it's set up before the next sprint starts. What about our planning process itself? Did the story pointing feel accurate?"),
            ("ethan", 1140.0, 1220.0, "Generally yes, but we pointed the database migration ticket as a 3, and it turned out to be a 5 because we had to update our local Docker Compose files to support the new SSL settings."),
            ("hannah", 1220.0, 1290.0, "Yeah, setting up SSL locally is always a headache. Next time we do a database upgrade, we should allocate extra research time before pointing the ticket."),
            ("bob", 1290.0, 1360.0, "Good point. Let's schedule a 30-minute pre-planning session next time to walk through technical dependencies. It will prevent these under-estimation issues."),
            ("fiona", 1360.0, 1440.0, "I will ensure my Figma design checklist is shared in that pre-planning sync so we can verify together that nothing is missing. Thanks team, this retro was super helpful!"),
        ]
    },
    {
        "title": "Investor Update",
        "description": "Monthly update call with lead investors to present growth metrics, product milestones, and financial updates.",
        "meeting_date": datetime(2026, 8, 19, 17, 0, tzinfo=timezone.utc),
        "duration_seconds": 1500,
        "participant_keys": ["alice", "diana", "julia", "ian"],
        "topics": [
            {"title": "Opening and Growth Metrics Review", "start_seconds": 0.0, "end_seconds": 350.0},
            {"title": "Product Milestone Highlights", "start_seconds": 350.0, "end_seconds": 750.0},
            {"title": "Financial Run Rate & Burn Rate Review", "start_seconds": 750.0, "end_seconds": 1150.0},
            {"title": "Q&A and Next Investor Touchpoints", "start_seconds": 1150.0, "end_seconds": 1500.0},
        ],
        "summary": {
            "overview": "Alice and Diana presented the monthly update to our lead investor, Ian. Monthly recurring revenue (MRR) grew by 12% in July, and the platform retention rate remains strong at 94%. Product-wise, the team is on track to deliver the mobile beta and begin the SOC2 audit in September.",
            "key_points": (
                "- Revenue Growth: July closed at $45,000 MRR, representing a 12% month-over-month increase driven by mid-market sign-ups.\n"
                "- Retention: Customer retention rate is holding steady at 94%, indicating high product-market fit.\n"
                "- Milestones: Notification system shipped; mobile React Native client development is underway.\n"
                "- Runway: Total cash runway is at 18 months, based on the current net burn rate of $25,000 per month."
            )
        },
        "action_items": [
            {"title": "Share Q2 financial spreadsheets with investors", "description": "Email the detailed profit & loss sheet and cash flow projections for Q3 to Ian.", "assignee": "diana.prince@company.com", "due_days_out": 2},
            {"title": "Send updated pitch deck with recent growth metrics", "description": "Update the core company presentation deck with the July MRR growth chart and email to Ian.", "assignee": "alice.vance@company.com", "due_days_out": 4},
            {"title": "Schedule next monthly update call", "description": "Send calendar invites for the September update meeting to all board members.", "assignee": "julia.roberts@company.com", "due_days_out": 5},
        ],
        "transcript": [
            ("alice", 0.0, 60.0, "Hi Ian, thank you for joining our monthly investor update call. We have some exciting news to share regarding our growth and product velocity for the month of July."),
            ("ian", 60.0, 110.0, "Great to be here, Alice. I saw the preliminary slide deck you sent over. The revenue numbers look very encouraging. Let's dive into the details."),
            ("diana", 110.0, 180.0, "I'll share the financial slide. Our Monthly Recurring Revenue reached forty-five thousand dollars in July. That is a twelve percent increase compared to June, which is our strongest month so far this year."),
            ("ian", 180.0, 240.0, "Excellent growth. What drove that spike? Was it new sign-ups or expansions on existing accounts?"),
            ("julia", 240.0, 310.0, "It was mostly mid-market team expansions. Several accounts that started with 5 users upgraded to company-wide licenses, adding 20 to 30 seats each. Our net revenue retention is at one hundred and eight percent."),
            ("ian", 310.0, 390.0, "A net retention above 100% is fantastic. It shows your customers are finding more value over time. How is the churn looking?"),
            ("julia", 390.0, 460.0, "Gross churn is down to 1.8% monthly. The stability updates we shipped last month really helped. Customer support ticket volume also dropped by fifteen percent."),
            ("alice", 460.0, 530.0, "On the product side, we successfully shipped our new notification engine. This was a massive backend milestone because it serves as the infrastructure for our mobile push notifications."),
            ("ian", 530.0, 610.0, "That's great. And what is the timeline for the mobile app? I remember we discussed target launch in Q4."),
            ("alice", 610.0, 690.0, "Yes, we are on track. We've decided to use React Native. Development starts next week. We will launch a private beta in late October, and a public release by late November."),
            ("ian", 690.0, 770.0, "Perfect. Make sure you get some early user feedback. Don't wait until public launch to find out if there are UX issues."),
            ("julia", 770.0, 840.0, "Absolutely. We already have 10 enterprise customers who have signed up to beta-test the mobile app. They represent our target persona, so their feedback will be invaluable."),
            ("ian", 840.0, 920.0, "Good. Let's discuss cash runway. Diana, what's our current burn rate and runway length?"),
            ("diana", 920.0, 1000.0, "Our net burn rate is holding steady at twenty-five thousand dollars per month. With our current cash balance, we have exactly 18 months of runway, which puts us in a very secure position."),
            ("ian", 1000.0, 1070.0, "Eighteen months is a healthy runway. It means you don't need to worry about fundraising until mid-2027, allowing the team to focus entirely on execution and product-market fit."),
            ("alice", 1070.0, 1140.0, "That is our plan. Our primary focus now is executing our Q4 roadmap, which includes the mobile app and completing our SOC2 Type 1 security certification to unlock larger sales."),
            ("ian", 1140.0, 1220.0, "SOC2 is critical for enterprise. Have you selected an auditor yet?"),
            ("diana", 1220.0, 1300.0, "We are currently reviewing proposals from three firms. We plan to select one by the end of this week and kick off the readiness assessment in mid-September."),
            ("ian", 1300.0, 1380.0, "Let me know if you need introductions. We work with several auditing firms and can get you a discount if you use our preferred partners."),
            ("alice", 1380.0, 1440.0, "That would be very helpful, Ian. Diana will send you our current shortlist, and we'd love to see if you have connections at those firms."),
            ("ian", 1440.0, 1500.0, "Will do. Send them over today. Great work team, very proud of the progress this month. Keep up the high standards!"),
        ]
    }
]

def seed_database():
    db = SessionLocal()
    try:
        print("🌱  Starting database seed process...")

        # 1. Fetch total counts before seeding
        initial_meetings = db.query(Meeting).count()
        initial_participants = db.query(Participant).count()
        initial_segments = db.query(TranscriptSegment).count()
        initial_summaries = db.query(Summary).count()
        initial_action_items = db.query(ActionItem).count()
        initial_topics = db.query(Topic).count()

        meetings_created = 0
        participants_created = 0
        segments_created = 0
        summaries_created = 0
        action_items_created = 0
        topics_created = 0

        # 2. Iterate through each meeting data spec
        for m_data in MEETINGS_DATA:
            title = m_data["title"]
            # Check if this meeting is already seeded
            existing_meeting = db.query(Meeting).filter_by(title=title).first()
            if existing_meeting:
                print(f"⏭️   Meeting '{title}' already exists. Skipping.")
                continue

            # Create the meeting metadata
            meeting = Meeting(
                title=title,
                description=m_data["description"],
                meeting_date=m_data["meeting_date"],
                duration_seconds=m_data["duration_seconds"],
            )
            db.add(meeting)
            db.flush()  # Populates meeting.id
            meetings_created += 1

            # Fetch or create the participants needed for this meeting
            participants_map = get_or_create_participants(db, m_data["participant_keys"])
            
            # Associate participants using the junction table
            for p_key, participant in participants_map.items():
                link = MeetingParticipant(meeting_id=meeting.id, participant_id=participant.id)
                db.add(link)

            # Create the summary
            summary_info = m_data["summary"]
            summary = Summary(
                meeting_id=meeting.id,
                overview=summary_info["overview"],
                key_points=summary_info["key_points"]
            )
            db.add(summary)
            summaries_created += 1

            # Create the topics
            for t_data in m_data["topics"]:
                topic = Topic(
                    meeting_id=meeting.id,
                    title=t_data["title"],
                    start_seconds=t_data["start_seconds"],
                    end_seconds=t_data["end_seconds"]
                )
                db.add(topic)
                topics_created += 1

            # Create the action items
            for a_data in m_data["action_items"]:
                due_date = meeting.meeting_date + timedelta(days=a_data["due_days_out"])
                action_item = ActionItem(
                    meeting_id=meeting.id,
                    title=a_data["title"],
                    description=a_data["description"],
                    assignee=a_data["assignee"],
                    due_date=due_date,
                    completed=False
                )
                db.add(action_item)
                action_items_created += 1

            # Create the transcript segments
            for idx, segment_info in enumerate(m_data["transcript"]):
                speaker_key, start, end, text = segment_info
                participant = participants_map[speaker_key]
                segment = TranscriptSegment(
                    meeting_id=meeting.id,
                    speaker_name=participant.name,
                    speaker_id=participant.id,
                    start_seconds=start,
                    end_seconds=end,
                    text=text,
                    sequence=idx
                )
                db.add(segment)
                segments_created += 1

            db.flush()

        db.commit()

        # 3. Fetch final counts and calculate changes
        final_meetings = db.query(Meeting).count()
        final_participants = db.query(Participant).count()
        final_segments = db.query(TranscriptSegment).count()
        final_summaries = db.query(Summary).count()
        final_action_items = db.query(ActionItem).count()
        final_topics = db.query(Topic).count()

        print("\n🎉  Seeding operations complete!")
        print("=" * 40)
        print("INSERTION SUMMARY")
        print("-" * 40)
        print(f"Meetings created:         {meetings_created} (Total in DB: {final_meetings})")
        print(f"Participants added:      {final_participants - initial_participants} (Total in DB: {final_participants})")
        print(f"Transcript segments added: {segments_created} (Total in DB: {final_segments})")
        print(f"Summaries added:          {summaries_created} (Total in DB: {final_summaries})")
        print(f"Action items added:       {action_items_created} (Total in DB: {final_action_items})")
        print(f"Topics added:             {topics_created} (Total in DB: {final_topics})")
        print("=" * 40)

    except Exception as e:
        db.rollback()
        print(f"❌  Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
