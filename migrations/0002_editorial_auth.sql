ALTER TABLE admin_sessions ADD COLUMN csrf_hash TEXT;
ALTER TABLE articles ADD COLUMN body_markdown TEXT NOT NULL DEFAULT '';
ALTER TABLE pages ADD COLUMN body_markdown TEXT NOT NULL DEFAULT '';

INSERT OR IGNORE INTO categories (id,name,slug,description) VALUES
('cat-news','News and Updates','news-and-updates','Official website news and updates.'),
('cat-politics','Politics and Governance','politics-and-governance','Political and governance updates.'),
('cat-constituency','Constituency Development','constituency-development','Constituency development proposals and updates.'),
('cat-community','Community Engagement','community-engagement','Community engagement and outreach.'),
('cat-education','Education','education','Education-related priorities and updates.'),
('cat-youth','Youth and Empowerment','youth-and-empowerment','Youth and empowerment initiatives.'),
('cat-infrastructure','Infrastructure','infrastructure','Infrastructure priorities and updates.'),
('cat-press','Press Releases','press-releases','Official press releases and statements.'),
('cat-opinion','Opinion and Analysis','opinion-and-analysis','Opinion and analysis.');
