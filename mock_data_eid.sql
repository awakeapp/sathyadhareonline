-- Mock Data for Eid Al Adha Sequel
-- Includes Sequel Category, Sequel, and 10 Original Articles

DO $$
DECLARE
    cat_id uuid;
    sec_id uuid;
    auth_id uuid := '7f6d2f5d-4b25-4230-8f15-084ac2381892'; -- Found author
BEGIN

    -- 1. Sequel Category
    INSERT INTO categories (name, slug, type, sort_order)
    VALUES ('Cover Story', 'cover-story', 'sequel', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_id;

    -- 2. Sequel
    INSERT INTO sequels (title, slug, description, banner_image, status, category_id, published_at)
    VALUES (
      'Eid Al Adha: The Spirit of Devotion', 
      'eid-al-adha-special-2025', 
      'A special weekly edition exploring the profound meanings of sacrifice, community, and faith during the Hajj season.',
      '/eid_al_adha_sequel_cover.png', 
      'published', 
      cat_id,
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, banner_image = EXCLUDED.banner_image
    RETURNING id INTO sec_id;

    -- 3. Articles (10 total)
    
    -- Editiorial
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'Beyond the Ritual: The Philosophy of Sacrifice',
            'philosophy-of-sacrifice',
            'Sacrifice is more than an annual ritual; it is a profound philosophy that challenges the ego and nurtures selflessness.',
            '<h1>Beyond the Ritual</h1><p>The essence of Eid Al Adha lies in the concept of "Qurbani" – nearness to the Divine. It is a symbolic representation of Prophet Ibrahim''s unwavering devotion and willingness to sacrifice what he loved most. In the modern world, this translates to sacrificing our greed, our time, and our resources for the betterment of those around us...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 0 FROM new_article ON CONFLICT DO NOTHING;

    -- Poem
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'The Call of the Valley: A Poetic Journey',
            'call-of-the-valley-poem',
            'A lyrical reflection on the spiritual resonance of the plains of Arafat and the echoes of Labbaik.',
            '<p>Beneath the desert''s golden crown,<br>Where ancient echoes lay their burden down,<br>The pilgrims stand in robes of white,<br>A sea of souls in pure, celestial light...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 1 FROM new_article ON CONFLICT DO NOTHING;

    -- Story / Novel Chapter
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'Shadows of Arafat: The Long Walk Home',
            'shadows-of-arafat-ch1',
            'Part 1 of our spiritual thriller set during the peak of the pilgrimage season.',
            '<p>The heat was unlike anything Omar had ever felt. It wasn''t just physical; it felt like it was burning away years of hesitation. As he walked toward Jabal al-Rahmah, the weight of his past seemed to dissipate into the shimmering horizon...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 2 FROM new_article ON CONFLICT DO NOTHING;

    -- History
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'The Legacy of Ibrahim: Foundations of Faith',
            'legacy-of-ibrahim',
            'Tracing the historical and spiritual lineage of the rituals we perform today.',
            '<p>The story of Prophet Ibrahim (AS) is the cornerstone of monotheism. From the building of the Kaaba to the trials of faith, his life provides a blueprint for resilience and absolute trust in the Divine plan...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 3 FROM new_article ON CONFLICT DO NOTHING;

    -- Socio-Economic
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'Global Economy of Charity: Impact of Udhiyah',
            'economy-of-udhiyah',
            'How the distribution of meat during Eid serves as one of the largest poverty alleviation programs globally.',
            '<p>Every year, millions of pounds of meat are distributed to the most vulnerable communities across the world. This isn''t just charity; it''s a systematic infusion of protein and nutrition into regions that face chronic food insecurity...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 4 FROM new_article ON CONFLICT DO NOTHING;

    -- Traditions
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'Unity in Flavors: Eid Traditions Around the Globe',
            'eid-traditions-global',
            'From the biryanis of India to the tajines of Morocco, a look at how cultures celebrate.',
            '<p>While the spiritual core remains identical, the cultural expressions of Eid are beautifully diverse. In Southeast Asia, "Lebaran" brings families together for festive meals, while in Africa, community prayers are followed by vibrant street festivals...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 5 FROM new_article ON CONFLICT DO NOTHING;

    -- Health
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'Sunnah of Nutrition: Balancing the Feast',
            'sunnah-nutrition-eid',
            'Guidance on healthy eating habits during the festive period according to Prophetic wisdom.',
            '<p>The Prophet (PBUH) taught us to eat in moderation. During Eid, it is easy to overindulge, but the Sunnah encourages us to share our food and listen to our bodies, ensuring that the physical feast doesn''t overshadow the spiritual gain...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 6 FROM new_article ON CONFLICT DO NOTHING;

    -- Environment
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'The Green Qurbani: Sustainable Practices',
            'green-qurbani-sustainable',
            'How to ensure our religious duties align with environmental stewardship.',
            '<p>As stewards of the Earth, we must ensure that our rituals do not harm the environment. From choosing ethically raised livestock to managing waste responsibly, a "Green Qurbani" is a double blessing...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 7 FROM new_article ON CONFLICT DO NOTHING;

    -- Unity
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'A Million Voices, One Prayer: Unity in Hajj',
            'unity-in-hajj',
            'Personal accounts of the overwhelming sense of brotherhood during the global gathering.',
            '<p>On the plains of Arafat, distinctions of rank, race, and wealth vanish. Everyone stands in the same two pieces of unstitched cloth, pleading for mercy. It is the ultimate manifestation of human equality...</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 8 FROM new_article ON CONFLICT DO NOTHING;

    -- Reflection
    WITH new_article AS (
        INSERT INTO articles (title, slug, excerpt, content, status, author_id, published_at)
        VALUES (
            'The Day After: Sustaining the Spirit of Eid',
            'sustaining-spirit-of-eid',
            'Practical tips on maintaining the spiritual high once the festivities subside.',
            '<p>The real challenge of Eid Al Adha begins when the celebration ends. How do we keep the spirit of sacrifice alive in our daily chores? How do we maintain the discipline of the Hajj season throughout the year?</p>',
            'published',
            auth_id,
            NOW()
        ) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
    )
    INSERT INTO sequel_articles (sequel_id, article_id, order_index)
    SELECT sec_id, id, 9 FROM new_article ON CONFLICT DO NOTHING;

END $$;
