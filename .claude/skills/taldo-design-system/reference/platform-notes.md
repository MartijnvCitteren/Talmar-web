# Platform notes

- **Stack:** React or Angular. Tokens (`color`, `radius`, `spacing`) live as CSS variables or JS constants — never hardcode a value per component.
- **Apply-flow vs. internal ATS:** one identical visual system for both. Candidates and HR users see the same components and tokens — no separate sub-brand for the public apply flow.
- **Dark mode:** light theme only for v1.
- **GDPR consent:** a checkbox plus a link to the privacy policy on the apply form, using the standard input and error states (see Inputs).
- **Breakpoints:** mobile below 640px · tablet below 1024px · desktop from 1024px.
