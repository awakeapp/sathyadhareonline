-- ============================================================
-- Row Level Security — Policies
-- ============================================================

-- ============================================================
-- HELPER: inline role check (avoids repeated sub-selects)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'editor', 'admin')
  );
$$;

-- ============================================================
-- ENABLE RLS
-- categories: no RLS (fully public read)
-- ============================================================
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequel_articles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE friday_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views     ENABLE ROW LEVEL SECURITY;

-- categories is intentionally left without RLS (public read allowed)

-- ============================================================
-- TABLE: profiles
-- ============================================================

-- Users read their own profile; admins read all
CREATE POLICY "profiles: self read"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR is_admin()
  );

-- Users update only their own profile
CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins: full write access
CREATE POLICY "profiles: admin insert"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "profiles: admin delete"
  ON profiles FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: articles
-- ============================================================

-- Public: read published, non-deleted articles
CREATE POLICY "articles: public read published"
  ON articles FOR SELECT
  USING (
    (status = 'published' AND is_deleted = false)
    OR is_admin()
  );

-- Admins: full write access
CREATE POLICY "articles: admin insert"
  ON articles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "articles: admin update"
  ON articles FOR UPDATE
  USING (is_admin());

CREATE POLICY "articles: admin delete"
  ON articles FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: sequels
-- ============================================================

-- Public: read published, non-deleted sequels
CREATE POLICY "sequels: public read published"
  ON sequels FOR SELECT
  USING (
    (status = 'published' AND is_deleted = false)
    OR is_admin()
  );

-- Admins: full write access
CREATE POLICY "sequels: admin insert"
  ON sequels FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "sequels: admin update"
  ON sequels FOR UPDATE
  USING (is_admin());

CREATE POLICY "sequels: admin delete"
  ON sequels FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: sequel_articles
-- ============================================================

-- Public: read sequel_articles whose parent sequel is published
CREATE POLICY "sequel_articles: public read published"
  ON sequel_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sequels s
      WHERE s.id = sequel_id
        AND s.status = 'published'
        AND s.is_deleted = false
    )
    OR is_admin()
  );

-- Admins: full write access
CREATE POLICY "sequel_articles: admin insert"
  ON sequel_articles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "sequel_articles: admin update"
  ON sequel_articles FOR UPDATE
  USING (is_admin());

CREATE POLICY "sequel_articles: admin delete"
  ON sequel_articles FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: friday_messages
-- ============================================================

-- Public: read published messages
CREATE POLICY "friday_messages: public read published"
  ON friday_messages FOR SELECT
  USING (
    is_published = true
    OR is_admin()
  );

-- Admins: full write access
CREATE POLICY "friday_messages: admin insert"
  ON friday_messages FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "friday_messages: admin update"
  ON friday_messages FOR UPDATE
  USING (is_admin());

CREATE POLICY "friday_messages: admin delete"
  ON friday_messages FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: guest_submissions
-- ============================================================

-- Anyone (anon or auth) can submit
CREATE POLICY "guest_submissions: public insert"
  ON guest_submissions FOR INSERT
  WITH CHECK (true);

-- Only admins can read / update / delete
CREATE POLICY "guest_submissions: admin read"
  ON guest_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "guest_submissions: admin update"
  ON guest_submissions FOR UPDATE
  USING (is_admin());

CREATE POLICY "guest_submissions: admin delete"
  ON guest_submissions FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: comments
-- ============================================================

-- Public: read approved comments only
CREATE POLICY "comments: public read approved"
  ON comments FOR SELECT
  USING (
    status = 'approved'
    OR is_admin()
  );

-- Anyone can insert a comment (user_id is nullable for guests)
CREATE POLICY "comments: public insert"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Admins: full update / delete access
CREATE POLICY "comments: admin update"
  ON comments FOR UPDATE
  USING (is_admin());

CREATE POLICY "comments: admin delete"
  ON comments FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: bookmarks
-- ============================================================

-- Authenticated users: read only their own bookmarks
CREATE POLICY "bookmarks: owner read"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users: insert only for themselves
CREATE POLICY "bookmarks: owner insert"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users: delete only their own bookmarks
CREATE POLICY "bookmarks: owner delete"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Admins: full access
CREATE POLICY "bookmarks: admin select"
  ON bookmarks FOR SELECT
  USING (is_admin());

CREATE POLICY "bookmarks: admin delete"
  ON bookmarks FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: article_views
-- ============================================================

-- Anyone can insert a view (anonymous tracking via session_id)
CREATE POLICY "article_views: public insert"
  ON article_views FOR INSERT
  WITH CHECK (true);

-- Users can read their own views; admins read all
CREATE POLICY "article_views: owner or admin read"
  ON article_views FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_admin()
  );

-- Admins: full delete access
CREATE POLICY "article_views: admin delete"
  ON article_views FOR DELETE
  USING (is_admin());
