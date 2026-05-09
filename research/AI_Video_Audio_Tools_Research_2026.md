# Comprehensive AI Video, Audio & Music Generation Tools Research (2025-2026)
**Research Date: May 2026**

---

## TABLE OF CONTENTS
1. [Commercial Video Generation](#1-commercial-video-generation)
2. [AI Avatar & Talking Head](#2-ai-avatar--talking-head)
3. [AI Video Editing Tools](#3-ai-video-editing-tools)
4. [Open Source Video Models](#4-open-source-video-models)
5. [AI Voice/Audio for Video](#5-ai-voiceaudio-for-video)
6. [AI Music Generation](#6-ai-music-generation)

---

## 1. COMMERCIAL VIDEO GENERATION

### Runway Gen-4.5
- **Provider:** Runway AI
- **Latest Version:** Gen-4.5 (with Aleph in-video editing system)
- **Pricing:**
  - Free: $0 (125 one-time credits)
  - Standard: $12/mo (annual) / $15/mo (monthly) - 625 credits/mo
  - Pro: $28/mo (annual) / $35/mo (monthly)
  - Unlimited: $188/mo (uncapped Gen-3 + substantial Gen-4 output)
- **Key Features:**
  - #1 on Artificial Analysis Text-to-Video benchmark (1,247 Elo points)
  - Reference image support, camera control, consistent character handling
  - Aleph system: post-generation editing via text prompts (e.g., "add rain to this scene")
  - Multi-model access: one subscription includes Runway, Veo, Kling, Seedance, FLUX, Seedream
  - Near cinematic quality for live-action, animation, VFX
- **Strengths:** Best overall control, highest benchmark scores, multi-model hub, Aleph editing
- **Weaknesses:** Credit system is complex, Gen-4.5 burns credits fast at 1080p, expensive at scale
- **Best Use Case:** Professional video production, VFX, creators needing maximum control and quality

---

### Kling AI 3.0
- **Provider:** Kuaishou Technology
- **Latest Version:** Kling 3.0 (released Feb 5, 2026)
- **Pricing:**
  - Free: 66 credits/mo
  - Standard: $5.99/mo (660 credits)
  - Pro: $29.99/mo (3,000 credits)
  - Premier: $54.99/mo (8,000 credits)
  - Ultra: $180/mo (increased from $128 in Aug 2025)
- **Key Features:**
  - Native 4K output
  - Storyboard tool for per-shot camera and pacing control
  - Native lip-synced audio in a single pipeline
  - Motion control (extract motion from reference video, apply to different subject)
  - Best-in-class photorealistic human characters and natural movements
  - 3D face/body reconstruction reduces warping distortion
- **Strengths:** Best value, excellent human characters, 4K native, integrated audio
- **Weaknesses:** Credits expire monthly, no rollover; credit consumption rates not publicly documented; only access to Kling's own models
- **Best Use Case:** Photorealistic human-centric videos, fast iteration, budget-conscious creators

---

### MiniMax Hailuo 2.3
- **Provider:** MiniMax (China)
- **Latest Version:** Hailuo 2.3
- **Pricing:**
  - Per clip: ~$0.25 (6s, 768p) to ~$0.52 (10s)
  - 1080p: ~$0.28 per video / 80 credits per clip
  - Subscription: $9.99-$199.99/mo (credit-based)
  - Hailuo 2.3 Fast: ~50% cheaper for batch creation
- **Key Features:**
  - 10-second duration cap, focus on photorealism
  - Realistic physical actions, stylization, character micro-expressions
  - Media Agent: "one-click video generation" multi-modal creation
  - Synchronized audio-video generation
- **Strengths:** Extremely cost-effective, excellent for product shots and B-roll, fast generation
- **Weaknesses:** 10-second max duration, limited stylization options
- **Best Use Case:** Product shots, B-roll footage, anime, physics demos, rapid iteration on budget

---

### Pika 2.5
- **Provider:** Pika Labs
- **Latest Version:** Pika 2.5
- **Pricing:**
  - Basic (Free): 80 credits
  - Standard: $8/mo (700 credits)
  - Pro: $28/mo (2,300 credits)
  - Fancy: $76/mo (6,000 credits)
- **Key Features:**
  - Fastest generation (~under 2 minutes per clip)
  - Pikaframes: upload start/end images, generate transition (1-10 seconds)
  - Pikascenes, Pikadditions, Pikaswaps, Pikatwists, Pikaffects
  - Scene Ingredients (upload own characters/objects)
  - Physics simulation, lighting enhancements
- **Strengths:** Fastest generation, creative transition tools (Pikaframes), affordable entry
- **Weaknesses:** 480p only on lower tiers, credit system varies by resolution/duration/feature
- **Best Use Case:** Quick creative iterations, visual transitions, social media content

---

### Luma Ray3 (Dream Machine)
- **Provider:** Luma AI
- **Latest Version:** Ray3.14
- **Pricing:**
  - Free: ~30 generations/mo
  - Standard: ~$7.99-$29.99/mo (~120 generations)
  - Pro: $49.99/mo (400 credits, ~135 generations)
  - Credit costs: 5s 1080p SDR = 330 credits; 10s 1080p SDR = 660 credits; HDR costs 4x more
- **Key Features:**
  - Hi-Fi Diffusion technology for studio-grade output
  - Native HDR color generation (world first)
  - 16-bit EXR export for pro workflows
  - Keyframe Control, Character Reference
  - Ray3 Modify: hybrid-AI workflow for acting/performance editing
  - 4K HDR output
- **Strengths:** Best atmospheric/cinematic quality, HDR native, professional export formats (EXR)
- **Weaknesses:** HDR clips cost 4x more credits, fewer generations per dollar than competitors
- **Best Use Case:** Cinematic/atmospheric image-to-video, professional post-production, HDR content

---

### Google Veo 3.1
- **Provider:** Google DeepMind
- **Latest Version:** Veo 3.1 (also Veo 3.1 Fast, Veo 3, Veo 2)
- **Pricing:**
  - Google AI Pro: $19.99/mo (~100 credits, ~2 Veo 3 clips/mo)
  - Google AI Ultra: $249.99/mo (~1,000 credits, ~20 Veo 3 clips/mo)
  - API: $0.10/s (Veo 3.1 Fast no audio) to $0.50/s (Veo 2 via Vertex AI)
- **Key Features:**
  - Up to 8 seconds per generation
  - Native audio: dialogue, sound effects, ambient sound (Veo 3+)
  - 1080p for Ultra subscribers, 720p for Pro
  - Synchronized audio generation
- **Strengths:** Best overall output quality with audio, Google ecosystem integration
- **Weaknesses:** Only 8s per generation (need chaining for longer), very expensive per clip, limited clips on Pro plan
- **Best Use Case:** Highest quality short clips with native audio, enterprise use with Google Cloud

---

### OpenAI Sora 2
- **Provider:** OpenAI
- **Status:** Original Sora discontinued; Sora 2 is the current model (2026)
- **Pricing:**
  - ChatGPT Plus ($20/mo): Unlimited 480p video generation
  - ChatGPT Pro ($200/mo): Full HD 1080p, priority access
  - API: Sora 2 at $0.10/s (720p); Sora 2 Pro at $0.30/s (720p) or $0.50/s (1024p)
  - Free users: No video generation access (removed Jan 2026)
- **Key Features:**
  - Full HD 1080p standard for all Sora 2 generations
  - $1B Disney partnership: licensed character generation
  - Text-to-video, image-to-video
- **Strengths:** Unlimited 480p on $20 plan, Disney character licensing, strong brand
- **Weaknesses:** Pro plan very expensive ($200/mo), API costs competitive but not cheapest
- **Best Use Case:** ChatGPT Plus users wanting easy video generation, Disney-related content

---

### ByteDance Seedance 2.0 (Dreamina/Jimeng)
- **Provider:** ByteDance
- **Latest Version:** Seedance 2.0 (released Feb 8-10, 2026)
- **Pricing:**
  - Free: 225 daily tokens (shared across all Dreamina tools, ~1-2 videos/day)
  - Dreamina Standard: $18/mo
  - Per clip (10s 720p Pro): ~$1.91-$4.60 depending on bundle
  - Jimeng (Chinese): 69 RMB/mo (~$9.50) - cheapest official option
  - Third-party (Atlas Cloud): ~$14.08/mo
- **Key Features:**
  - Multi-modal inputs (text, up to 9 images, 3 videos, 3 audio files)
  - 2K/1080p at 24fps, 4-15 second clips
  - Native audio-video synchronization with phoneme-level lip-sync
  - Integrated into CapCut
  - Six aspect ratios
  - Invisible watermark for AI content identification
- **Strengths:** Multi-modal input flexibility, CapCut integration, competitive pricing via Jimeng
- **Weaknesses:** Face restrictions (won't generate from real face images), rolling out in limited markets, Dreamina pricing much higher than Jimeng
- **Best Use Case:** CapCut users, markets where available (Brazil, Indonesia, Malaysia, Mexico, Philippines, Thailand, Vietnam)

---

### COMMERCIAL VIDEO GENERATION COMPARISON TABLE

| Model | Resolution | Max Length | Native Audio | Price/Month (Entry) | API $/second | Best For |
|-------|-----------|-----------|-------------|--------------------|--------------|---------|
| Runway Gen-4.5 | Up to 4K | 5-10s | No (via Veo) | $12 | Varies | Control & quality |
| Kling 3.0 | 4K native | 5-10s | Yes | $5.99 | N/A | Human characters |
| Hailuo 2.3 | 1080p | 10s | Yes | $9.99 | ~$0.03-0.05 | Budget production |
| Pika 2.5 | Up to 1080p | 1-10s | No | $8 | N/A | Fast creative |
| Luma Ray3 | 4K HDR | 5-10s | No | $7.99 | N/A | Cinematic/HDR |
| Veo 3.1 | 1080p | 8s | Yes | $19.99 | $0.10-0.50 | Best quality+audio |
| Sora 2 | 1080p | Varies | No | $20 (Plus) | $0.10-0.50 | Easy access |
| Seedance 2.0 | 2K/1080p | 4-15s | Yes | $18 | Varies | Multi-modal |

---

## 2. AI AVATAR & TALKING HEAD

### HeyGen
- **Provider:** HeyGen Inc.
- **Pricing:**
  - Free: $0/mo (3 videos, 720p, watermark)
  - Creator: $29/mo ($24/mo annual) - 200 credits, 1080p
  - Pro: $99/mo ($79/mo annual) - 2,000 credits, 4K
  - Business: $149+/mo - team features, 4K, more custom avatars
- **Features:**
  - 200+ stock avatars with high quality
  - Custom avatar creation from video
  - Voice cloning and lip sync
  - Multi-language dubbing (40+ languages)
  - API access for automation
  - Interactive avatars for real-time conversation
- **Strengths:** Best avatar quality, excellent lip sync, strong API, versatile use cases
- **Weaknesses:** "Unlimited" marketing is misleading (premium features consume premium credits), expensive for heavy use
- **Best Use Case:** Marketing videos, training content, multi-language dubbing

---

### Synthesia
- **Provider:** Synthesia Ltd.
- **Pricing:**
  - Free: $0/mo (3 minutes, watermarked, 9 avatars)
  - Starter: $29/mo ($22/mo annual) - 10 min/mo, 125+ avatars
  - Creator: $89/mo ($67/mo annual) - 30 min/mo, 180+ avatars, API access
  - Enterprise: ~$4,000+/year - unlimited minutes, SSO, SCORM export
- **Features:**
  - 230+ AI avatars
  - 160+ languages and accents (broadest coverage)
  - 1,000+ AI voices
  - AI Dubbing: translate existing video into 30+ languages with lip sync
  - Multiple avatars per scene
  - Interactive video with branching
  - SCORM export for LMS integration
  - 60+ templates
- **Strengths:** Most languages (160+), enterprise features (SSO, SCORM), transparent pricing
- **Weaknesses:** Expensive for high volume, avatar quality slightly below HeyGen
- **Best Use Case:** Corporate training, L&D, enterprise multilingual content

---

### D-ID
- **Provider:** D-ID (Creative Reality)
- **Pricing:**
  - Lite: $5.99/mo ($4.70/mo annual) - 10 min/mo
  - Pro: Mid-tier with voice cloning (1 clone)
  - Advanced: $196/mo - 3 voice clones
  - Enterprise: Custom
  - Free trial: 14 days
- **Features:**
  - Creative Reality Studio: single photo to talking-head video
  - Visual AI Agents: real-time streaming interactive avatars
  - 119 languages and dialects for TTS
  - Video Translate: 30+ languages with lip sync
  - Voice cloning (Pro+)
  - RESTful API with webhook automation
- **Strengths:** Most affordable entry ($5.99/mo), API-first design, real-time streaming agents
- **Weaknesses:** Avatar quality below HeyGen/Synthesia, limited features on lower tiers
- **Best Use Case:** Developers/API integration, budget avatar videos, interactive AI agents

---

### Colossyan
- **Provider:** Colossyan
- **Pricing:**
  - Free: 5 minutes
  - Starter: ~$27/mo (120 min/year)
  - Pro/Business: $88+/mo (unlimited videos)
  - Enterprise: SSO, custom avatars, dedicated support
- **Features:**
  - 300+ stock avatars (diverse demographics)
  - NEO 2 video model (natural, expressive performance)
  - 70+ language translation
  - Conversational videos (multiple avatars)
  - Quizzes and branching scenarios
  - Custom avatar from photo or video with voice clone
- **Strengths:** Large avatar library (300+), interactive training features (quizzes, branching), good for L&D
- **Weaknesses:** Less well-known, smaller ecosystem than HeyGen/Synthesia
- **Best Use Case:** Corporate training with interactive elements, branching scenarios

---

### Captions.ai
- **Provider:** Captions
- **Pricing:**
  - Free: Watermarked output
  - Pro: $9.99/mo (200 credits)
  - Scale: $69.99/mo (1,400 credits)
- **Features:**
  - Auto captions in 100+ languages
  - AI Dubbing & Lipdub: 28+ languages with lip movement adjustment
  - AI Eye Contact correction
  - AI Denoise (audio cleanup)
  - Text-to-Video from prompts
  - AI Twin: 3D avatar as virtual spokesperson
  - AI Creator tool for UGC-style ads
- **Strengths:** Very affordable, strong auto-caption, AI eye contact is unique, good for creators
- **Weaknesses:** More focused on enhancement than full avatar creation, limited credit system
- **Best Use Case:** Social media creators, UGC ads, auto-captioning

---

### Hedra
- **Provider:** Hedra AI
- **Pricing:**
  - Free: ~100-400 credits on signup, watermarked
  - Paid: From $8.33/mo ($100/year)
  - Creator/Professional: Higher tiers with more credits
- **Features:**
  - Character-3 omnimodal model: phoneme-accurate lip-sync
  - Automatic micro-expressions and natural head movement
  - 15+ languages for lip-sync
  - Multi-model studio: 14 image models + 14 video models (Kling, Veo 3.1, Sora)
  - Turns any image into expressive talking character
- **Strengths:** Best lip-sync accuracy, multi-model hub (28 models), any image to talking character
- **Weaknesses:** Credits don't roll over, can be expensive for heavy use
- **Best Use Case:** High-quality lip sync, creative character animation, multi-model experimentation

---

### AI AVATAR COMPARISON TABLE

| Platform | Price/Month (Entry) | Languages | Avatars | Best For | Quality |
|----------|-------------------|-----------|---------|---------|---------|
| HeyGen | $24/mo | 40+ | 200+ | Marketing, dubbing | Excellent |
| Synthesia | $22/mo (annual) | 160+ | 230+ | Enterprise training | Very Good |
| D-ID | $5.99/mo | 119 | Photo-based | API/developers | Good |
| Colossyan | $27/mo | 70+ | 300+ | Interactive training | Very Good |
| Captions.ai | $9.99/mo | 100+ (captions) | AI Twin | Social creators | Good |
| Hedra | $8.33/mo | 15+ | Any image | Lip sync | Excellent (sync) |

---

## 3. AI VIDEO EDITING TOOLS

### Descript
- **Provider:** Descript Inc.
- **Pricing:**
  - Free: 1hr transcription/mo, 720p, watermark
  - Hobbyist: $16/mo (annual) / $24/mo (monthly)
  - Creator: $24/mo (annual) / $35/mo (monthly) - MOST POPULAR
  - Business: $50/mo (annual) / $65/mo (monthly)
  - Enterprise: Custom
- **Features:**
  - Text-based video editing (edit video by editing transcript)
  - 30+ AI tools, Underlord AI co-editor
  - Studio Sound (one-click audio enhancement)
  - Voice cloning
  - AI video generation
  - Animated captions (customizable)
  - Background removal (no green screen)
  - Professional NLE exports
  - 4K exports (Creator+)
- **Strengths:** Revolutionary text-based editing, excellent audio tools, voice cloning, all-in-one
- **Weaknesses:** Learning curve for traditional editors, can be slow with large files
- **Best Use Case:** Podcasters, YouTubers, anyone who edits by transcript

---

### OpusClip
- **Provider:** Opus.pro
- **Pricing:**
  - Free: 60 credits/mo (watermarked, 3-day storage)
  - Starter: $15/mo (150 minutes, watermark-free)
  - Pro: $29/mo ($14.50/mo annual) - 300 min/mo, AI B-roll, hook generation
  - Enterprise: Custom (10+ seats)
- **Features:**
  - Long-to-short video clipping (AI identifies best moments)
  - Virality Score for each clip
  - AI B-roll generation
  - AI hook generation
  - Custom fonts
  - 6 social account connections (Pro)
  - 1 credit = 1 minute of source video processed
- **Strengths:** Best at long-to-short repurposing, Virality Score is unique, efficient credit system
- **Weaknesses:** Only for repurposing (not creating from scratch), free tier very limited
- **Best Use Case:** Podcasters and long-form creators repurposing to TikTok/Reels/Shorts

---

### Vizard.ai
- **Provider:** Vizard
- **Pricing:**
  - Free: 60 credits/mo (720p, watermark, 3-day storage)
  - Creator: ~$14.50/mo (annual)
- **Features:**
  - AI clip maker with viral scoring
  - Active speaker detection
  - Prompt-based clipping (natural language)
  - Built-in social scheduling
  - Long-form to short-form repurposing
- **Strengths:** Prompt-based moment finding, active speaker detection, social scheduling included
- **Weaknesses:** Similar to OpusClip, limited to repurposing, free tier restricted
- **Best Use Case:** Social media managers repurposing podcast/webinar content

---

### CapCut
- **Provider:** ByteDance
- **Pricing:** Free (with optional Pro features)
- **Features:**
  - AI Auto-Edit: multi-stage scene/camera/face/audio analysis
  - Script-to-Video: type topic, get full video with stock footage + voiceover + music in 60s
  - AI Effect Engine: custom effects from natural language descriptions + 50,000+ pre-built
  - AI Auto-Caption (92-95% accuracy for English)
  - AI Background Remover
  - Seedance 2.0 integration for AI video generation
  - Cloud real-time collaboration
  - Extensive template library
- **Strengths:** Free with powerful AI features, Seedance 2.0 integration, massive template/effect library
- **Weaknesses:** ByteDance data concerns in some markets, some advanced features require Pro
- **Best Use Case:** Short-form social media content, free video editing, TikTok creators

---

### Riverside.fm
- **Provider:** Riverside
- **Pricing:**
  - Free: 2 hrs recording/mo, 720p
  - Standard: $19/mo (annual) / $24/mo - 15 hrs, 1080p
  - Pro: $29/mo (annual) / $39/mo - 30 hrs, 4K, Magic Editor
  - Business: Custom (unlimited hrs)
- **Features:**
  - High-quality remote recording (up to 4K)
  - AI Magic Clips (auto-generate engaging clips)
  - AI Show Notes
  - Magic Audio (AI audio enhancement)
  - Advanced transcription
  - Separate audio/video tracks per participant
- **Strengths:** Best recording quality for remote interviews, AI clip generation, separate tracks
- **Weaknesses:** Overage charges (2-3x rate), primarily a recording tool (editing is secondary)
- **Best Use Case:** Podcast/webinar recording + quick AI-powered clip creation

---

### Veed.io
- **Provider:** VEED
- **Pricing:**
  - Lite: $12/mo
  - Pro: $24/mo (annual) / $29/mo
  - Business: Higher tier
- **Features:**
  - AI avatars and text-to-video
  - Voice cloning
  - Auto-subtitles in 125+ languages
  - Filler word removal
  - 50,000+ stock assets
  - Screen recorder
  - Full timeline editor
  - 1,000+ templates
  - Team collaboration
- **Strengths:** Full-featured browser-based editor, strong AI subtitle/translation, large asset library
- **Weaknesses:** Browser-based can be slow with large files, some AI features are add-ons
- **Best Use Case:** Browser-based video editing with AI enhancements, subtitle creation

---

### InVideo AI
- **Provider:** InVideo
- **Pricing:**
  - Free: 10 AI minutes/week, 4 exports, watermarked
  - Plus: $25/mo ($15/mo annual)
  - Max: $60/mo ($30/mo annual)
- **Features:**
  - Full text-to-video pipeline (script, footage, voiceover, subtitles, music from one prompt)
  - Built-in Sora 2 + Veo 3.1 integration
  - Voice cloning (30-second sample, 2 clones on Plus, 5 on Max)
  - VFX House: Relight, Prop Swap, AI Colorist
  - 10,000+ templates
  - Commercial rights on all paid plans
- **Strengths:** Most complete text-to-video (Sora 2 + Veo 3.1 built-in), VFX tools, massive template library
- **Weaknesses:** AI-generated content quality depends on integrated models, less manual control
- **Best Use Case:** Quick marketing/explainer videos from text prompts, non-editors

---

### AI VIDEO EDITING COMPARISON TABLE

| Tool | Price/Month | Primary Function | Best For |
|------|-----------|-----------------|---------|
| Descript | $16-50/mo | Text-based editing | Podcasters, YouTubers |
| OpusClip | $15-29/mo | Long-to-short clips | Repurposing content |
| Vizard.ai | $14.50/mo | AI clip extraction | Social media managers |
| CapCut | Free | Full AI editing | Short-form, TikTok |
| Riverside.fm | $19-29/mo | Recording + AI clips | Podcast/interview recording |
| Veed.io | $12-29/mo | Browser-based editing | Online editing + subtitles |
| InVideo AI | $15-30/mo | Text-to-video | Quick video from prompts |

---

## 4. OPEN SOURCE VIDEO MODELS

### Wan 2.1/2.2
- **Provider:** Alibaba/Research community
- **License:** Open source
- **Key Features:**
  - Wan 2.2: MoE (Mixture-of-Experts) diffusion backbone
  - Curated aesthetic labels (lighting, composition, contrast, color tone) for cinematic control
  - Consistently outperforms existing open-source AND some commercial models
  - T2V-1.3B variant: only 8.19 GB VRAM (consumer GPU compatible)
  - Max quality: ~10 seconds
- **Strengths:** Best open-source quality, cinematic control, low VRAM option (1.3B)
- **Weaknesses:** 10-second limit at max quality, larger models need significant VRAM
- **VRAM:** 8.19 GB (1.3B) to 24GB+ (full model)
- **Best Use Case:** Best overall open-source video generation, cinematic content

---

### CogVideoX
- **Provider:** Tsinghua University / Zhipu AI (THUDM Lab)
- **License:** Open source
- **Key Features:**
  - Excels at prompt understanding (nuanced, multi-clause descriptions)
  - CogVideoX-5B: 6-second clips at 8fps, 720x480 resolution
  - English prompts up to 226 tokens
  - Sweet spot for prosumer hardware (16-24GB VRAM)
- **Strengths:** Best prompt fidelity among open-source models, reasonable hardware requirements
- **Weaknesses:** Fixed 720x480 resolution, 6-second max, 8fps only
- **VRAM:** 16-24 GB
- **Best Use Case:** Prompt-accurate generation on prosumer GPUs

---

### Open-Sora 2.0
- **Provider:** HPC-AI Tech
- **License:** Apache 2.0
- **Key Features:**
  - 11B parameter model
  - On-par with HunyuanVideo on VBench and human preference testing
  - Text-to-video, image-to-video, video-to-video, infinite time generation
  - 2-15 seconds at up to 720p
- **Strengths:** Apache 2.0 license, versatile (T2V, I2V, V2V), competitive quality
- **Weaknesses:** Requires 40GB+ VRAM for best results, 720p max
- **VRAM:** 40GB+ recommended (A100, H100)
- **Best Use Case:** Research, enterprise deployment with high-end GPUs

---

### Mochi 1
- **Provider:** Genmo AI
- **License:** Apache 2.0
- **Key Features:**
  - Asymmetric Diffusion Transformer architecture
  - Remarkably natural physics and motion
  - Strong text encoding (T5-XXL)
- **Strengths:** Best motion quality among open-source models, natural physics, permissive license
- **Weaknesses:** High VRAM requirement, requires high-end GPU
- **VRAM:** 16-24 GB (optimized); 40GB+ (full size, A100/H100)
- **Best Use Case:** Motion-focused content, physics-heavy scenes

---

### LTX-Video
- **Provider:** Lightricks
- **License:** Open source
- **Key Features:**
  - 30fps at 1216x704 resolution
  - Faster than real-time generation on capable hardware
  - Optimized for speed and iteration
- **Strengths:** Fastest open-source generation, good resolution, rapid iteration
- **Weaknesses:** ~5-second limit at max quality, less cinematic than Wan
- **VRAM:** 12 GB (RTX 3060 12GB, RTX 4070)
- **Best Use Case:** Rapid prototyping, real-time creative workflows

---

### Stable Video Diffusion (SVD)
- **Provider:** Stability AI
- **License:** Open source (research/community)
- **Key Features:**
  - Image-to-video generation
  - Natural motion from still images
  - Integrates with Stable Diffusion ecosystem
- **Strengths:** Excellent for adding subtle motion to images, SD ecosystem compatibility
- **Weaknesses:** Image-to-video only (no text-to-video), limited duration
- **VRAM:** 16 GB (RTX 4080, A4000)
- **Best Use Case:** Animating still images, product photography motion

---

### AnimateDiff
- **Provider:** Community/Research
- **License:** Open source
- **Key Features:**
  - Plug-in for Stable Diffusion workflows
  - Works with existing SD checkpoints and LoRAs
  - Adds motion to SD image generation
- **Strengths:** Lowest VRAM requirement, leverages existing SD ecosystem, familiar workflow
- **Weaknesses:** Quality dependent on base SD model, limited motion complexity
- **VRAM:** 8-12 GB
- **Best Use Case:** SD users adding animation, low-VRAM setups

---

### OPEN SOURCE VIDEO COMPARISON TABLE

| Model | Resolution | Max Length | FPS | VRAM (Min) | License | Quality Rank |
|-------|-----------|-----------|-----|-----------|---------|-------------|
| Wan 2.2 | Up to 1080p | ~10s | 24 | 8 GB (1.3B) | Open | #1 |
| CogVideoX-5B | 720x480 | 6s | 8 | 16 GB | Open | #4 |
| Open-Sora 2.0 | 720p | 2-15s | Varies | 40 GB | Apache 2.0 | #3 |
| Mochi 1 | Varies | Varies | Varies | 16 GB | Apache 2.0 | #2 (motion) |
| LTX-Video | 1216x704 | ~5s | 30 | 12 GB | Open | #5 |
| SVD | Varies | Short | Varies | 16 GB | Open | N/A (I2V) |
| AnimateDiff | SD-dependent | Short | Varies | 8 GB | Open | N/A (plugin) |

---

## 5. AI VOICE/AUDIO FOR VIDEO

### ElevenLabs
- **Provider:** ElevenLabs
- **Pricing:**
  - Free: 10,000 credits/mo, 3 custom voices
  - Starter: $5/mo (30,000 credits)
  - Creator: $11/mo (100,000 credits)
  - Unlimited: $29/mo (unlimited characters, 1 HD clone, commercial use)
  - Scale/Enterprise: Custom
- **Features:**
  - Industry-leading voice quality
  - Voice cloning (from short audio sample)
  - 70+ languages (via eleven_v3 model)
  - Flash v2.5 and Turbo v2.5 models (32 languages)
  - Vietnamese fully supported with regional accent adaptation
  - Emotion control via audio tags
  - Streaming API, low latency
- **Strengths:** Best overall quality, excellent Vietnamese support, large language coverage, fast
- **Weaknesses:** Premium pricing for high volume, HD clones limited on lower tiers
- **Vietnamese:** Full support with regional accents
- **Best Use Case:** Premium TTS, voice cloning, multilingual content

---

### PlayHT
- **Provider:** PlayHT (Play.ht)
- **Pricing:**
  - Free: 12,500 characters
  - Creator: $39/mo (600,000 chars/year, 10 instant voice clones)
  - Unlimited: $99/mo (2.5M char/mo fair-use cap, unlimited generation)
- **Features:**
  - 800+ AI voices across 142 languages and accents
  - Ultra-realistic voice generation
  - Voice cloning
  - Vietnamese language supported
  - API access
  - MP3/WAV download
- **Strengths:** Best value for high volume, 142 languages, generous clone limits
- **Weaknesses:** "Unlimited" has fair-use cap (2.5M chars/mo), quality slightly below ElevenLabs
- **Vietnamese:** Supported
- **Best Use Case:** High-volume TTS production, budget-conscious multilingual content

---

### OpenAI TTS
- **Provider:** OpenAI
- **Pricing:**
  - Standard: $15/1M characters
  - HD: $30/1M characters
  - gpt-4o-mini-tts: $0.60/1M text tokens + $12/1M audio tokens
- **Features:**
  - Multiple voice options
  - High quality HD voices
  - API-only (no standalone app)
  - Integrates with ChatGPT ecosystem
- **Strengths:** Simple API, consistent quality, good for integration with OpenAI workflows
- **Weaknesses:** No voice cloning, limited voice variety, API-only
- **Vietnamese:** Supported via multilingual models
- **Best Use Case:** OpenAI ecosystem integration, straightforward TTS needs

---

### Azure Neural TTS
- **Provider:** Microsoft Azure
- **Pricing:**
  - Free (F0): 0.5M chars/mo
  - Standard Neural: $15-16/1M characters
  - Neural HD V2: $30/1M characters
  - Long Audio: $100/1M characters
- **Features:**
  - Wide language support
  - Neural and Neural HD voice tiers
  - SSML control
  - Custom Neural Voice (train custom voices)
  - Enterprise-grade SLA and security
- **Strengths:** Enterprise reliability, extensive SSML control, custom voice training
- **Weaknesses:** Complex pricing, Azure ecosystem lock-in
- **Vietnamese:** Supported
- **Best Use Case:** Enterprise applications, custom voice models, Azure ecosystem

---

### Google Cloud TTS
- **Provider:** Google Cloud
- **Pricing:**
  - Standard: $4/1M characters
  - WaveNet/Neural2: $16/1M characters
  - Studio/Chirp 3 HD: $30/1M characters
- **Features:**
  - Multiple voice tiers (Standard, WaveNet, Neural2, Studio, Chirp 3 HD)
  - Wide language support
  - SSML support
  - Audio profiles for different devices
- **Strengths:** Cheapest entry ($4/1M for Standard), good quality at WaveNet tier, Google ecosystem
- **Weaknesses:** Standard voices sound robotic, best voices cost same as competitors
- **Vietnamese:** Supported
- **Best Use Case:** Budget TTS (Standard tier), Google Cloud ecosystem

---

### Coqui TTS / XTTS v2 (Open Source)
- **Provider:** Coqui AI (community-maintained)
- **License:** Open source (MPL 2.0 for XTTS v2)
- **Pricing:** Free (self-hosted)
- **Features:**
  - Voice cloning with just 6-second audio clip (XTTS v2)
  - 16-17 languages supported
  - Cross-lingual voice cloning
  - Runs entirely on local hardware
  - Battle-tested in research and production
- **Strengths:** Free, excellent voice cloning, local/private, no API costs
- **Weaknesses:** Requires technical setup, quality slightly below ElevenLabs, Coqui company shut down (community-maintained)
- **Vietnamese:** Not in core 16 languages
- **Best Use Case:** Privacy-focused voice cloning, self-hosted TTS

---

### Bark (Suno)
- **Provider:** Suno AI
- **License:** Open source (MIT)
- **Pricing:** Free (self-hosted)
- **Features:**
  - Can laugh, sing, and express emotion mid-sentence
  - Unconstrained voice cloning
  - Multiple speaker support
  - Non-speech sounds (laughter, music, ambient)
- **Strengths:** Most expressive open-source TTS, can handle non-speech sounds, MIT license
- **Weaknesses:** Slow generation, no streaming, unexpected sounds/pauses, not real-time ready
- **Vietnamese:** Limited support
- **Best Use Case:** Creative/expressive audio, non-speech sound generation

---

### Fish Speech
- **Provider:** Fish Audio
- **License:** Apache 2.0
- **Pricing:** Free (self-hosted)
- **Features:**
  - MOS 4.1 quality score
  - 8 languages supported
  - Reference-audio voice cloning workflow
  - Commercial use allowed (Apache 2.0)
- **Strengths:** High quality (MOS 4.1), commercial-friendly license, good cloning
- **Weaknesses:** Only 8 languages, smaller community than Coqui
- **Vietnamese:** Limited/unclear
- **Best Use Case:** Commercial voice cloning projects, self-hosted production

---

### VOICE/TTS COMPARISON TABLE

| Tool | Price | Languages | Vietnamese | Voice Cloning | Quality |
|------|-------|-----------|-----------|--------------|---------|
| ElevenLabs | $5-29/mo | 70+ | Yes (full) | Yes (HD) | Best |
| PlayHT | $39-99/mo | 142 | Yes | Yes (10+) | Very Good |
| OpenAI TTS | $15-30/1M chars | Multi | Yes | No | Good |
| Azure Neural | $15-30/1M chars | Wide | Yes | Yes (custom) | Very Good |
| Google Cloud | $4-30/1M chars | Wide | Yes | No | Good-Very Good |
| Coqui XTTS v2 | Free | 16-17 | No | Yes (6s clip) | Good |
| Bark | Free | Multi | Limited | Yes | Fair-Good |
| Fish Speech | Free | 8 | Limited | Yes | Good |

---

## 6. AI MUSIC GENERATION

### Suno AI
- **Provider:** Suno Inc.
- **Pricing:**
  - Free: 50 daily credits
  - Pro: $10/mo (2,500 credits, ~500 songs)
  - Premier: $30/mo (10,000 credits, ~2,000 songs)
- **Features:**
  - Full song generation from text prompts (lyrics + melody + vocals)
  - Suno Studio: AI-native DAW (Premier plan)
  - Timeline editing, up to 12-stem separation, MIDI export
  - Blend AI-generated elements with own recordings
  - Multiple genres and styles
  - Full commercial rights on paid plans
- **Strengths:** Best for full songs with vocals, Studio DAW included, commercial rights, MIDI export
- **Weaknesses:** Free plan: no commercial rights (Suno retains ownership), quality can be inconsistent
- **Best Use Case:** Content creators needing full songs, YouTube background music, commercial music

---

### Udio
- **Provider:** Udio
- **Pricing:**
  - Free tier available
  - Standard: ~$10/mo (2,400 credits, ~1,200 songs)
  - Pro: ~$30/mo (6,000 credits, unlimited songs)
- **Features:**
  - Music generation from text prompts
  - Multiple genre support
  - Recently increased credits for subscribers
  - Full vocal + instrumental generation
- **Strengths:** More generous credits per dollar, good for volume, slightly better audio fidelity in some genres
- **Weaknesses:** Smaller feature set than Suno, no built-in DAW
- **Best Use Case:** High-volume music generation, hobbyists, podcast background music

---

### MusicGen (Meta)
- **Provider:** Meta AI
- **License:** Open source (MIT for code, CC-BY-NC for model)
- **Pricing:** Free (self-hosted)
- **Features:**
  - Text-to-music and melody-conditioned generation
  - Trained on 400,000 licensed recordings (20,000 hours)
  - Multiple model sizes
- **Strengths:** Free, open source, good quality instrumentals, melody conditioning
- **Weaknesses:** Requires technical expertise (Python, CUDA), no vocals, CC-BY-NC limits commercial use
- **Best Use Case:** Research, self-hosted instrumental generation, developers

---

### Stable Audio 2.5
- **Provider:** Stability AI
- **Pricing:**
  - Free: 10 credits on signup
  - Pro: $11.99/mo
  - Studio: $29.99/mo
- **Features:**
  - Full tracks up to 3 minutes at 44.1kHz stereo
  - Text-to-Audio, Audio-to-Audio
  - Vocal transformation (input voice, output music/SFX)
  - Multi-part pieces (intros, developments, outros)
  - WAV, MP3, MIDI export
  - Commercial licensing included on paid plans
  - Trained on licensed AudioSparx dataset
- **Strengths:** Clear commercial licensing, sound design focus, vocal transformation, MIDI export
- **Weaknesses:** 3-minute max, less suited for full songs with vocals
- **Best Use Case:** Sound design, instrumental beds, jingles, audio effects

---

### AIVA
- **Provider:** AIVA Technologies
- **Pricing:**
  - Free tier available
  - Standard: ~15 EUR/mo
  - Pro: ~49 EUR/mo (full copyright ownership)
- **Features:**
  - 250+ style presets (Cinematic Epic, Jazz, Lo-fi Hip Hop, Chinese Traditional, etc.)
  - Generation from Influence: upload MIDI/audio, get new piece in similar style
  - Built-in MIDI/piano roll editor in browser
  - Full copyright ownership on Pro plan
  - Orchestral, cinematic, classical focus
- **Strengths:** Best for cinematic/orchestral scoring, MIDI editor, influence-based generation, copyright ownership
- **Weaknesses:** Not designed for pop/vocal music, smaller user base
- **Best Use Case:** Film scoring, game music, classical/orchestral composition

---

### AI MUSIC COMPARISON TABLE

| Tool | Price/Month | Vocals | Commercial Rights | Max Length | Best For |
|------|-----------|--------|-------------------|-----------|---------|
| Suno | $10-30 | Yes | Paid plans | Full songs | Complete songs |
| Udio | $10-30 | Yes | Paid plans | Full songs | Volume generation |
| MusicGen | Free | No | CC-BY-NC | Varies | Research/dev |
| Stable Audio | $11.99-29.99 | Transform | Yes (paid) | 3 min | Sound design |
| AIVA | 15-49 EUR | No | Pro plan | Varies | Cinematic scoring |

---

## SUMMARY: TOP PICKS BY CATEGORY

| Category | Best Overall | Best Value | Best Free |
|----------|-------------|-----------|----------|
| Video Generation | Runway Gen-4.5 | Kling 3.0 | CapCut + Seedance |
| AI Avatars | HeyGen | D-ID | Synthesia Free |
| Video Editing | Descript | CapCut (free) | CapCut |
| Open Source Video | Wan 2.2 | LTX-Video | AnimateDiff |
| Voice/TTS | ElevenLabs | Google Cloud TTS | Coqui XTTS v2 |
| Music Generation | Suno AI | Udio | MusicGen |

---

*This research was compiled from multiple sources as of May 2026. Prices and features change frequently -- verify current pricing on official websites before purchasing.*
