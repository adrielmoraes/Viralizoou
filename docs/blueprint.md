# **App Name**: Viralizoou

## Core Features:

- Authentication & User Management: Users can register, log in, and recover passwords securely, managed through a Neon PostgreSQL database.
- Project Initialization: Users can start a new project from various inputs: text, image, video, or audio (with automatic transcription).
- AI Idea & Scripting Tool: Utilizes Gemini-2.5-flash to take user input and generate a detailed synopsis, script, scene descriptions, and character descriptions, ensuring cinematographic language and character consistency (e.g., 'Character ID', 'Face embedding').
- AI Visual Grid Generation: Generates initial reference images using gemini-3.1-flash-image-preview based on the script, adhering to user-selected aspect ratios and resolutions, forming a visual grid of scenes.
- AI Cinematographic Scene Refinement: Recreates and enhances grid images into ultra-realistic, high-definition cinematographic scenes, meticulously maintaining consistent character appearance, environment, and lighting across all frames using an internal Character Profile (Seed fixo).
- AI Video Clip Production: Generates 8-second video clips for each scene using veo-3.1-generate-preview, with automatic continuity between clips by extracting and utilizing the last frame of a video as the initial frame for the next.
- Final Video Assembly & Export: Allows users to review, reorder, or remove generated video clips, then compile them into a single final video in MP4 H264 format for download.

## Style Guidelines:

- The app uses a sophisticated dark theme, appropriate for a high-tech video editing platform. The primary color is a deep violet (#553399), evoking creativity and digital precision. The background is a very dark, subtly purplish gray (#18161D), providing a professional canvas. Key interactive elements are highlighted with a vibrant, glowing blue accent (#3050E8), ensuring strong contrast and drawing attention to actionable items.
- Headlines and prominent titles use 'Space Grotesk' (sans-serif) for a modern, techy, and impactful presence. Body text and longer descriptions use 'Inter' (sans-serif) for its clear, neutral, and highly readable qualities, suitable for complex script details and project information.
- Clean, minimalist line icons are used throughout the interface. Icons feature subtle depth and are strategically used to convey complex functionalities quickly without visual clutter, enhancing the professional and high-tech feel.
- The layout features a multi-panel design with distinct sections for input, AI output, and visual previews. Elements are logically grouped, and resizable panels facilitate an efficient workflow for video creation, mimicking professional editing software while remaining intuitive for a broad user base.
- Subtle and smooth transitions are employed for scene changes, navigation, and state updates, creating a fluid user experience. Progress indicators for AI generation tasks use soft, evolving animations to provide visual feedback without distraction, emphasizing a seamless creative process.