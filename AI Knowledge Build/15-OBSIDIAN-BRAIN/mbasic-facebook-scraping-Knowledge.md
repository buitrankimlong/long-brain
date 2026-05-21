---
tags: [facebook, scraping, mbasic, python, beautifulsoup, html-parsing, web-scraping]
description: mbasic-facebook-scraping
created: 2026-05-18
moc: "[[15 Bo Nao Obsidian]]"
---

# mbasic.facebook.com Scraping Research

Research date: 2026-05-18

## Overview

mbasic.facebook.com is a lightweight mobile version of Facebook that serves plain HTML without JavaScript rendering requirements. This makes it significantly easier to scrape compared to the main facebook.com interface. However, Facebook discontinued official support for mbasic as of October 30, 2024, though it may still be functional for scraping purposes.

---

## 1. URL Patterns for Accessing Facebook Pages

### Page URLs (Recommended for scraping)
- **With custom username**: `https://mbasic.facebook.com/PageName` (e.g., mbasic.facebook.com/facebook)
- **With page ID**: `https://mbasic.facebook.com/pages/PageName/PageID`
- **Direct ID format**: `https://mbasic.facebook.com/profile.php?id=NUMERIC_PAGE_ID`

### Profile URLs
- **With custom username**: `https://mbasic.facebook.com/username`
- **With profile ID**: `https://mbasic.facebook.com/profile.php?id=NUMERIC_USER_ID`

### Post Links
- **Post URL format**: `https://mbasic.facebook.com/story.php?story_fbid=XXXXXX&id=XXXXXX`
- **Alternative format with pagination**: May include `refid`, `eav`, or other parameters

---

## 2. HTML Structure for Post Elements

### Main Post Container
```
#m_group_stories_container > section > article
```
- Posts are contained within `<article>` tags
- Articles are wrapped in a `<section>` element
- The section is contained within a div with ID `m_group_stories_container`

### Alternative Post Selectors
- Posts may also be found using: `#m_group_stories_container > section`
- Individual post divs may have patterns like `id="u_0_.+"` (regex pattern)

### Post Structure Example
```html
<article>
  <!-- Post content here -->
  <div>
    <h3><!-- Username/Author --></h3>
    <div><!-- Post text/description --></div>
    <img/> <!-- Post images -->
    <div><!-- Timestamps, likes, comments --></div>
  </div>
</article>
```

---

## 3. Extracting Post Data

### Post Text
- **Selector**: Typically in `<div>` elements or specific data attributes
- **Recent implementation**: May use `data-ad-preview="message"` attribute to locate text content
- **Note**: Extract innerText or textContent to avoid HTML markup

### Images
- **HTML**: `<img>` tags within post article
- **Attributes**: Extract `src` or `data-src` attributes for image URLs
- **Multiple images**: May be in separate `<img>` tags or carousel structures

### Video Links
- **Structure**: May be within `<video>` tags or as hyperlinks to `video.php`
- **URLs**: Video permalink format varies but typically includes `v=XXXXXX` parameter
- **Note**: Actual video content is often not directly accessible via scraping

### Post ID / Story ID
- **Traditional format**: Extracted from `story_fbid` URL parameter (DEPRECATED as of May 2022)
- **Modern format**: Uses opaque PFBID token: `pfbid0TiRyHT5qxsECdJiAcfMxF5DqFDp4TzS3KLd5PEvmCHqHkU9obq3vdBKd64Tm6yuAl`
- **Alternative**: Extract from HTML element IDs matching pattern `u_0_.+`
- **Post link**: Extract from `<a>` elements pointing to `story.php` with `story_fbid` parameter

### Timestamps
- **HTML**: Typically in `<span>` elements near post metadata
- **Format**: May be relative ("2 hours ago") or absolute ("May 18, 2026")
- **Selector**: Look for time-related classes or `<span>` tags in post footer

### Engagement Metrics
- **Likes**: Extract from `<span>` elements with engagement class names
- **Comments count**: Similar span elements
- **Shares count**: NOT available in mbasic.facebook.com
- **Note**: mbasic only counts direct comments, not reply comments

---

## 4. Pagination

### Next Page Link
```
#m_group_stories_container > section + div > a
```

### Pagination Mechanism
- **URL parameter**: Next page uses `?after=CURSOR` or similar cursor-based pagination
- **Method**: Follow the `<a>` tag found by the selector above
- **Page content**: Each page contains a new set of posts with a new "next" link if more content exists

### CSS Selectors for Navigation
- Posts container: `#m_group_stories_container`
- Next button: Direct `<a>` tag after the section containing posts
- **Cursor format**: Varies but may be base64 or opaque tokens

---

## 5. Cookies and Session Management

### Cookie Domain
- **Domain**: `.facebook.com` (wildcard covers both web.facebook.com and mbasic.facebook.com)
- **Protocol**: Cookies are sent over HTTPS only
- **Expiration**: 
  - Persistent cookies: ~3 months if "Remember Me" is set
  - Session cookies: Deleted when browser closes

### Cross-Domain Cookie Compatibility
- Cookies set by `web.facebook.com` ARE shared with `mbasic.facebook.com` because both use the `.facebook.com` domain
- Login session from main Facebook can be reused on mbasic
- Cookie-based session is MORE RELIABLE than trying to log in separately to mbasic

### Session Compatibility Issues
- **Cache interference**: Old cached data from main site can interfere with mbasic
- **Solution**: Clear browser cache and cookies before switching between domains
- **Best practice**: Maintain single session via cookies rather than separate logins

### User Agent Handling
- **Recommended**: Use mobile user agents from older phones (e.g., Nokia C3) to avoid detection
- **Reason**: mbasic expects mobile/lightweight browser user agents
- **Facebook detection**: Modern desktop user agents may be blocked or receive different HTML

---

## 6. Important Limitations and Considerations

### Structural Changes
- Facebook changes HTML selectors frequently (every few weeks in some reports)
- Class names are obfuscated (e.g., x1y1aw1k, x1s688f, x1n2onr6) and change regularly
- Regex-based selectors are more durable than exact class matches

### Data Availability
- **Share counts**: NOT available in mbasic.facebook.com
- **Comment counts**: Only direct comments counted (replies not included)
- **Reactions**: Available via separate endpoints but complex to extract
- **Full content**: Some post types (videos, stories) have limited data available

### Detection and Blocking
- Scraping slowly recommended: 3-5 second delays between requests
- Account blocking possible after repeated scraping attempts
- Mobile user agents help avoid detection
- Rate limiting should be implemented

### JavaScript Requirements
- mbasic is pure HTML/CSS - NO JavaScript execution needed
- Selenium or Playwright not required (unless Facebook force-redirects to main site)
- Simple HTTP requests with BeautifulSoup sufficient for most cases

### Official API Alternative
- Meta's Graph API provides legitimate alternative with reduced data availability
- Graph API should be used for production applications
- Scraping violates Facebook's Terms of Service (educational/learning purposes only)

---

## 7. Recommended Tech Stack

### Python Stack (Proven Effective)
- **HTTP Client**: `requests` or `requests-html` library
- **HTML Parser**: BeautifulSoup4 or `lxml` with XPath
- **Optional browser automation**: Selenium if forced redirects to main site
- **Session management**: Cookie persistence with requests.Session()

### JavaScript/Node Stack
- **HTTP Client**: `axios` or `node-fetch`
- **HTML Parser**: `cheerio` or `jsdom`
- **Cookie handling**: `tough-cookie` library

### Important Libraries by Project
- **facebook-scraper** (kevinzg): ~1,140 lines, uses requests-html, handles pagination
- **fb-scraping-tools** (hubertlacote): Unit tested, requests + BeautifulSoup, supports logged-in data
- **facebook-fetcher** (PyPI package): Simplified extraction interface

---

## 8. Known Working Approaches (2024-2026)

### BeautifulSoup + Requests
```
1. Set mobile user agent (Nokia C3 or similar)
2. Make HTTP GET to mbasic URL
3. Parse HTML with BeautifulSoup
4. Find posts using #m_group_stories_container > section > article selector
5. Extract text, images, timestamps from child elements
6. Follow next page link for pagination
7. Implement 3-5 second delays between requests
```

### Session/Cookie Handling
```
1. Use requests.Session() to maintain cookies
2. Either:
   a) Login via mbasic.facebook.com directly, OR
   b) Extract cookies from web.facebook.com authenticated session
3. Reuse session across paginated requests
4. Handle cookie expiration (periodic re-login may be needed)
```

---

## 9. Known Issues and Workarounds

| Issue | Workaround |
|-------|-----------|
| Getting only 6 posts instead of hundreds | Ensure pagination is working, follow all "next" links |
| Account blocking after scraping | Reduce request frequency, use delays, rotate user agents |
| Opaque PFBID tokens | Store full post URLs instead of trying to extract IDs |
| CSS selector changes | Use regex patterns or HTML attribute inspection |
| Redirects to main facebook.com | Use appropriate mobile user agent |
| Cache interference | Clear cookies before switching between web/mbasic |

---

## References

Research compiled from:
- dev.to article by hhsm95 on Python Facebook Posts Scraper
- GitHub projects: kevinzg/facebook-scraper, hubertlacote/fb-scraping-tools
- Medium articles on 2025-2026 Facebook scraping techniques
- GitHub issues and discussions from facebook-scraper project
- Meta Cookies Policy and Facebook Help documentation
