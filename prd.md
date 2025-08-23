**Product Requirements Document (PRD)**  
**CLI Tool for Fuzzy Searching and Triggering Sounds**

---

## 1. Purpose and Overview

This CLI tool allows a user to retrieve and interactively select from a list of sounds (fetched from an API) using fuzzy search. After selection, the user can trigger the chosen sound through the API.

### Key Goals:
1. Fetch a complete list of sounds from an API **once**.
2. Provide a fuzzy-search interface so users can quickly find a specific sound by typing partial matches.
3. Trigger (play) the selected sound via a second API call.

---

## 2. Scope and Objectives

### 2.1 In Scope
- **One-Time Fetch** of all sounds via a `GET` request.
- **Local, In-Memory Storage** of the sounds list during each CLI session.
- **Fuzzy Searching** of the `filename` (and optionally tags or other fields if needed) to help narrow down results.
- **Confirmation and Execution** of a `POST` request to play the selected sound.

### 2.2 Out of Scope
- Editing or deleting sounds on the server.
- Managing authentication tokens (beyond passing them as a header).
- Handling advanced filtering (by tags, date ranges, etc.) beyond straightforward fuzzy search (unless we decide to extend the fuzzy search to multiple fields).
- Complex UI/UX features such as GUIs or TUI beyond a simple CLI prompt.

---

## 3. End Users and Use Cases

### 3.1 User Types
1. **General User**: Anyone with valid authorization who wants to search and trigger sounds from the library.

### 3.2 Use Cases
1. **Search & Play**: 
   - The user types the CLI command (e.g., `mycli soundbored`).
   - The tool fetches the full list of sounds from the API if not already in memory.
   - The tool presents an interactive fuzzy search prompt as the user begins typing a sound name.
   - Once the user confirms their choice (press enter on the matched name), the tool sends a `POST` request to the server to trigger the sound.

2. **Browse & Play** (implicit in fuzzy search):
   - The user launches the CLI with no particular search term in mind.
   - The user types partial keywords, sees suggested matches, and navigates up/down through them (depending on fuzzy search UI).
   - The user selects a match, triggers the sound.

---

## 4. Requirements

### 4.1 Functional Requirements

1. **Fetch Sounds**  
   - **FR1**: The CLI must send a `GET` request to `https://example.invalid with the appropriate `Authorization` header to retrieve all sounds.
   - **FR2**: The CLI stores the response in a local data structure (e.g., an array of objects) for the duration of the session.

2. **Fuzzy Search**  
   - **FR3**: The CLI offers an interactive prompt that updates search results as the user types.
   - **FR4**: The fuzzy search matches user input against sound filenames (e.g., “Moe - Why Retard.mp3” can be matched by typing “why r”).
   - **FR5** (optional extension): If beneficial, fuzzy search can also match tags.  
     - E.g., typing “kir” would match anything that has a “kirill” tag (like “Hey Don’t Talk Like That.mp3”).

3. **Select and Trigger**  
   - **FR6**: Once a sound is selected, the user must confirm (press enter or the equivalent) to trigger the `POST` request to `https://example.invalid
   - **FR7**: The CLI must include the same `Authorization: Bearer <TOKEN>` header when triggering the sound.

4. **User Feedback**  
   - **FR8**: The CLI should display confirmation that the request was sent (e.g., “Playing: ‘Dry Fart.mp3’ (ID:2) … done!” or any relevant message).
   - **FR9**: If there’s an error (network failure, invalid token), the CLI should display an error message.

5. **Performance**  
   - **FR10**: All fuzzy searching should be done locally, in-memory, without additional API calls.

6. **Security**  
   - **FR11**: The CLI must pass the required authorization token in both the fetch and play requests.
   - **FR12**: The tool will not log or expose the token beyond what’s necessary in the code or process environment variables.

### 4.2 Non-Functional Requirements

1. **Ease of Installation**  
   - Should be installable as a typical CLI tool (e.g., via npm, pip, or as a compiled binary).
2. **Reliability**  
   - Should handle slow or failed network connections gracefully.
3. **Maintainability**  
   - Organized structure so future enhancements (e.g., searching by tags, sorting, caching) can be added easily.

---

## 5. User Flows

1. **Initial Start-Up**  
   - User runs `soundbored <search term>` (for example).  
   - Tool fetches data if not already loaded.  
   - Tool presents interactive search (with the search term if provided or blank if not).

2. **Fuzzy Search Interaction**  
   - CLI displays a dynamic list of matches (e.g., top 10) as the user types.
   - User can arrow key or tab through suggestions if supported.
   - User confirms selection with enter.

3. **Trigger Sound**  
   - Upon selection, CLI sends `POST /api/sounds/:id/play`.
   - CLI logs or prints a success/failure message.

---

## 6. Acceptance Criteria

1. **AC1**: When the CLI is executed without a cached list, it fetches sounds from the API only once.
2. **AC2**: Typing partial file names reliably returns matching results, ranked by fuzzy search relevance.
3. **AC3**: On selecting a match, a `POST` request is successfully triggered, and the user sees a confirmation message in the CLI.
4. **AC4**: If there is no match for the user input, an appropriate “no matches found” message is displayed.
5. **AC5**: All network failures or authorization issues are displayed as error messages.

---

## 7. Technical Approach (High-Level)

1. **Configuration**  
   - Command-line argument or environment variable for the bearer token (e.g., `SOUNDBORED_TOKEN`).
   - CLI subcommands or flags (e.g., `soundbored search`, `soundbored play <name>`). Alternatively, a single interactive command.

2. **Data Fetch**  
   - On first run, perform the `GET` request:
     ```
     GET /api/sounds
     Authorization: Bearer <TOKEN>
     ```
   - Parse JSON, store in a list/array of sound objects (`{ id, filename, tags, ... }`).

3. **Fuzzy Search Implementation**  
   - Use a fuzzy matching library or implement a basic fuzzy scoring algorithm that matches user input against `filename`.
   - Possibly concatenate `tags` to the search string if we want to match those as well.

4. **Selection**  
   - Interactive prompt with immediate feedback or a typed input with the top match auto-selected.
   - Once user confirms, retrieve the `id` from the matched sound object.

5. **Play Request**  
   - Issue `POST /api/sounds/:id/play` with the same `Authorization` header.
   - Print success/failure messages.

---

## 8. Timeline / Implementation Plan

**Phase 1**: Basic CLI skeleton
- Implement command-line interface structure and argument parsing.
- Implement a function to get data from the API once and store it locally.

**Phase 2**: Fuzzy Search
- Integrate or create a fuzzy search solution.
- Verify correct matching and ranking.

**Phase 3**: Interactive Selection
- Provide an interactive terminal UI for selecting from fuzzy results (arrow keys, tab, etc.), or implement a simpler approach where the user types, sees results, and chooses by typed index or name.

**Phase 4**: POST Trigger and Feedback
- Implement the `POST` request.
- Test with various success/failure scenarios.
- Provide meaningful CLI output.

**Phase 5**: Testing & Documentation
- Confirm all acceptance criteria are met.
- Write documentation on usage (installation, environment variables, etc.).

---

## 9. Risks and Mitigations

1. **Network Reliability**  
   - Mitigation: Implement retry or clear error messages if fetch fails. Provide instructions to rerun.
2. **Large Dataset Performance**  
   - Mitigation: Use an efficient fuzzy search library or indexing approach.
3. **Authorization Errors**  
   - Mitigation: Display instructive error messages (e.g., “Invalid token. Please check your environment variable or login.”).

---

## 10. Success Metrics

1. **Time to Search**: The fuzzy search results should appear quickly (< 100ms for a typical size list).
2. **User Satisfaction**: Users can easily find and trigger the intended sound with minimal keystrokes.
3. **Error Rate**: Low rate of user confusion or failed attempts to select the correct sound.

---

### Final Note
This document outlines the requirements, scope, and approach for building a CLI tool that fetches a list of sounds once, provides fuzzy search functionality, and triggers the sounds via a POST request. It avoids multiple unnecessary API calls and offers an efficient workflow for users needing quick audio triggers.