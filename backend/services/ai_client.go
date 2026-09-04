package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AIClient struct {
	HTTPClient *http.Client
}

func NewAIClient() *AIClient {
	return &AIClient{
		HTTPClient: &http.Client{Timeout: 60 * time.Second},
	}
}

type AIProviderConfig struct {
	BaseURL string
	APIKey  string
	Model   string
}

func (c *AIClient) getProviderConfig(provider string) (AIProviderConfig, error) {
	if provider == "gemini" {
		apiKey := os.Getenv("GEMINI_API_KEY")
		if apiKey == "" {
			return AIProviderConfig{}, fmt.Errorf("GEMINI_API_KEY is not configured")
		}
		model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
		if model == "" {
			model = "gemini-3.5-flash-lite"
		}
		return AIProviderConfig{
			BaseURL: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
			APIKey:  apiKey,
			Model:   model,
		}, nil
	} else if provider == "groq" {
		apiKey := os.Getenv("GROQ_API_KEY")
		if apiKey == "" {
			return AIProviderConfig{}, fmt.Errorf("GROQ_API_KEY is not configured")
		}
		model := strings.TrimSpace(os.Getenv("GROQ_MODEL"))
		if model == "" {
			model = "qwen/qwen3.6-27b"
		}
		return AIProviderConfig{
			BaseURL: "https://api.groq.com/openai/v1/chat/completions",
			APIKey:  apiKey,
			Model:   model,
		}, nil
	}
	return AIProviderConfig{}, fmt.Errorf("unknown AI provider: %s", provider)
}

func (c *AIClient) ChatCompletion(preferredProvider, systemPrompt, userPrompt string, tools []map[string]interface{}, requireJSON bool) (string, error) {
	providers := []string{preferredProvider}
	if preferredProvider == "gemini" {
		providers = append(providers, "groq")
	} else {
		providers = append(providers, "gemini")
	}

	var lastErr error
	for _, provider := range providers {
		fmt.Printf("🔄 Attempting AI request with provider: %s\n", provider)

		config, err := c.getProviderConfig(provider)
		if err != nil {
			fmt.Printf("⚠️ Provider config error for %s: %v\n", provider, err)
			lastErr = err
			continue // try next provider
		}

		payload := map[string]interface{}{
			"model": config.Model,
			"messages": []map[string]string{
				{"role": "system", "content": systemPrompt},
				{"role": "user", "content": userPrompt},
			},
		}

		if len(tools) > 0 {
			payload["tools"] = tools
			payload["tool_choice"] = map[string]interface{}{
				"type": "function",
				"function": map[string]string{
					"name": tools[0]["function"].(map[string]interface{})["name"].(string),
				},
			}
		}

		if requireJSON {
			payload["response_format"] = map[string]string{"type": "json_object"}
		} else {
			// Only set max tokens and temp for non-structured standard chat
			if len(tools) == 0 {
				payload["temperature"] = 0.5
				payload["max_tokens"] = 1200
			}
		}

		reqBody, err := json.Marshal(payload)
		if err != nil {
			return "", err
		}

		httpReq, err := http.NewRequest("POST", config.BaseURL, bytes.NewReader(reqBody))
		if err != nil {
			return "", err
		}
		httpReq.Header.Set("Authorization", "Bearer "+config.APIKey)
		httpReq.Header.Set("Content-Type", "application/json")

		resp, err := c.HTTPClient.Do(httpReq)
		if err != nil {
			fmt.Printf("⚠️ Network error for %s: %v\n", provider, err)
			lastErr = err
			continue // try next provider
		}

		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode >= 400 {
			fmt.Printf("⚠️ HTTP error %d from %s: %s\n", resp.StatusCode, provider, string(respBody))
			lastErr = fmt.Errorf("AI error %d: %s", resp.StatusCode, string(respBody))
			continue // try next provider on 4xx or 5xx (e.g. rate limit, unavailable)
		}

		var parsed struct {
			Choices []struct {
				Message struct {
					Content   string `json:"content"`
					ToolCalls []struct {
						Function struct {
							Arguments string `json:"arguments"`
						} `json:"function"`
					} `json:"tool_calls"`
				} `json:"message"`
			} `json:"choices"`
		}

		if err := json.Unmarshal(respBody, &parsed); err != nil || len(parsed.Choices) == 0 {
			fmt.Printf("⚠️ Unmarshal error from %s\n", provider)
			lastErr = fmt.Errorf("Failed to parse AI response")
			continue
		}

		msg := parsed.Choices[0].Message

		// If using tools, return the tool arguments
		if len(tools) > 0 && len(msg.ToolCalls) > 0 {
			fmt.Printf("✅ Success with %s (Tools)\n", provider)
			return msg.ToolCalls[0].Function.Arguments, nil
		}

		// Otherwise return standard content
		fmt.Printf("✅ Success with %s (Text/JSON)\n", provider)
		return msg.Content, nil
	}

	return "", fmt.Errorf("All AI providers failed. Last error: %w", lastErr)
}
