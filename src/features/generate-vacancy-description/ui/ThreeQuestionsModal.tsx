import { useState } from 'react';
import { Modal, TextField, Button } from '../../../shared/ui';
import type { GenerateVacancyDescriptionInputs } from '../lib/useGenerateVacancyDescription';
import styles from './ThreeQuestionsModal.module.css';

export interface ThreeQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (inputs: GenerateVacancyDescriptionInputs) => void;
}

const emptyAnswers = { day: '', skills: '', why: '' };

/**
 * Q1+Q2 fold into `mostImportantTasks`, Q3 maps to `whyNiceJob`; `team` has no direct
 * question in this modal and is left empty — see design-notes.md's "Enum data" mapping
 * note (accepted as a non-blocking open question, field names are never shown to users).
 */
function toGenerationInputs(answers: typeof emptyAnswers): GenerateVacancyDescriptionInputs {
  return {
    mostImportantTasks: [answers.day, answers.skills].filter(Boolean).join('\n'),
    team: '',
    whyNiceJob: answers.why,
  };
}

export function ThreeQuestionsModal({ open, onClose, onSubmit }: ThreeQuestionsModalProps) {
  const [answers, setAnswers] = useState(emptyAnswers);

  function handleSubmit() {
    onSubmit(toGenerationInputs(answers));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Drie korte vragen" maxWidth={560}>
      <p>
        Beantwoord deze drie vragen kort en concreet. Taldo zorgt voor de rest. Hoe concreter, hoe
        minder je hoeft bij te schaven.
      </p>
      <TextField
        label="Wat doet deze collega op een gemiddelde dag?"
        placeholder="Bijv. API's bouwen, code reviews, sparren met product"
        value={answers.day}
        onChange={(value) => setAnswers((prev) => ({ ...prev, day: value }))}
        multiline
        boldLabel
      />
      <TextField
        label="Wat moet iemand zeker kunnen?"
        placeholder="Bijv. 5+ jaar Node, ervaring met Postgres en AWS"
        value={answers.skills}
        onChange={(value) => setAnswers((prev) => ({ ...prev, skills: value }))}
        multiline
        boldLabel
      />
      <TextField
        label="Waarom zou iemand voor jullie kiezen?"
        placeholder="Bijv. klein team, veel autonomie, hybride werken"
        value={answers.why}
        onChange={(value) => setAnswers((prev) => ({ ...prev, why: value }))}
        multiline
        boldLabel
      />
      <div className={styles.footer}>
        <Button type="button" variant="text" onClick={onClose}>
          Annuleren
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Genereer mijn concept vacature
        </Button>
      </div>
    </Modal>
  );
}
