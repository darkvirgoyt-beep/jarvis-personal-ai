# Anthropic Claude Fable 5 integration

Jarvis’s requested Anthropic option is **Claude Fable 5**, not an approximate “fable 5” alias. The verified OpenRouter model identifier is `anthropic/claude-fable-5`.

The model is routed only from the Jarvis server through the existing OpenRouter-compatible streaming client. `OPENROUTER_API_KEY` remains server-side and is never sent to the browser, stored in user preferences, exposed in streaming events, or committed to source control.

Anthropic describes `claude-fable-5` as available via its API, while OpenRouter lists the same model family and identifier for its unified API. Jarvis preserves Nemotron 3 Ultra as the default primary model and uses Claude Fable 5 only after a signed-in user selects it in the model control.

## References

1. [Anthropic: Claude Fable 5 and Claude Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5)
2. [OpenRouter: Anthropic models and Claude Fable 5](https://openrouter.ai/anthropic/claude-fable-5)
