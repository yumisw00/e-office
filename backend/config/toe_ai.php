<?php

return [
    'api_key' => env('TOE_AI_API_KEY', '5e17d45e58c042ea91c16c0660b92604.ISvRobpIyScEgJJWUPdBmKMD'),
    'base_url' => env('TOE_AI_BASE_URL', 'https://ollama.com'),
    // 'model_generate' => env('TOE_AI_MODEL_GENERATE', 'glm-5:cloud'),
    // 'model_generate' => env('TOE_AI_MODEL_GENERATE', 'gpt-oss:120b-cloud'),
    'model_generate' => env('TOE_AI_MODEL_GENERATE', 'qwen3.5:397b-cloud'),
    'model_vision' => env('TOE_AI_MODEL_VISION', 'gemma3:27b-cloud'),
    'max_prompt_tokens' => (int) env('TOE_AI_MAX_PROMPT_TOKENS', 6000),
    'max_docs_per_request' => (int) env('TOE_AI_MAX_DOCS_PER_REQUEST', 5),
    'token_char_ratio' => (float) env('TOE_AI_TOKEN_CHAR_RATIO', 4.0),
    'curl_timeout' => (int) env('TOE_AI_CURL_TIMEOUT', 0),
    'vision_min_text_length' => (int) env('TOE_AI_VISION_MIN_TEXT_LENGTH', 150),
    'pdf_vision_pages_with_text' => (int) env('TOE_AI_PDF_VISION_PAGES_WITH_TEXT', 2),
    'pdf_vision_pages_without_text' => (int) env('TOE_AI_PDF_VISION_PAGES_WITHOUT_TEXT', 4),
    'docx_vision_max_images' => (int) env('TOE_AI_DOCX_VISION_MAX_IMAGES', 4),
    'vision_max_images_per_request' => (int) env('TOE_AI_VISION_MAX_IMAGES_PER_REQUEST', 2),
    'pdf_vision_scale_to' => (int) env('TOE_AI_PDF_VISION_SCALE_TO', 1100),
    'save_respond' => (int) env('SAVE_RESPOND', true),
];
