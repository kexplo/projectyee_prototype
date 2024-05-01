# ProjectYee

Privacy-safe AI tool that anyone can use without knowing the AI powered by the Local LLM technology.

## Key Features (Objectives)

- ChatGPT-like conversational interface with multiple LLM models
- Auto summarization of the conversation
- Multiple OS support (Windows, macOS, Linux)
- Easy-to-use GGUF based models

## Tech Stack

- Packaging: Electron
- Frontend: Vite, React, Tailwind CSS, shadcn/ui
- LLM(GGUF) inference: llamafile

## Demo

![demo](https://github.com/kexplo/projectyee_prototype/assets/186918/d737be39-562a-4a69-9dcf-3b412c9d8920)

![demo.mov](./demo.mov)

## TODOs

- [x] Electron packaging
- [x] Manage(Spawn/Kill) local LLM models using llamafile
- [x] (Frontend) Conversation UI
- [x] Auto summarization of the conversation
  - [ ] Tune the summarization prompt
- [ ] Using multiple LLM models in single conversation
  - [ ] Using OpenAI API with local models
- [ ] Download GGUF models from the Huggingface
- [ ] Chat with uploaded files in the conversation (RAG)
  - [ ] Upload files to the conversation
  - [ ] Manage Vector DB
