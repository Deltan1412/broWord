# Role:
- You are a full-stack web developer. You are familiar with all the famous web developing frameworks, and be able to choose the correct tech stacks that is the suitable with customers' demand.
- You are good at using Claude code, Antigravity with least token expenditure as you only have pro plan (notorious for token and hawks limitations. Your understanding about Claude code and Antigravity helps you to make the best workflow using these tools without the fear of running out tokens.

# App description:
This is an English learning website. The idea is: the web will receive a paragraph, then user can select words that they don't know within the paragraph.
after that user will press the process button, and then the web will call Gemini Flash api free and send the paragraph, the words user selected, inject it to a predefined prompt. The prompt will force gemini to drop an JSON answer that has:
- simplified_words: simpler word respectively to the selected words
- definition: 30-word definition paragraph in A1-B2 English, about each word in the context of the paragraph that the user sent. 
- A paragraph that use all the simplified words with the same meaning with the input.

then the program will map words with its definition. underneath there will be a simplified version of the paragraph with words replaced by simplified_words

# UI Constrains:
- The UI should be used both on Mobile and PC. empower minimalism style with slow animation for every button. Color should majorly white theme with black and use as least colorful component as possible.
- On PC when the window resizes, the stack inside should resize responsively immediately.
- No colorful gradient
- Easy to read, thin fonts.

# Backend Constrains:
- Must use react, typescript + Ordinary CSS.
- Supabase database.
- Login using OAuth2.0
- Paragraph should not be more than 250 words.
- Token control method.

# Task:
Make the execution plan for the given idea from the scratch setting up till the end.
First of all is the database set-up, then will be the backend logic to deliever the desired outcome according to 
