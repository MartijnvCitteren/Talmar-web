import { Pencil, Sparkles } from 'lucide-react';
import { Card, CardHeader, ChoiceCard, Button } from '../../../shared/ui';
import styles from './VacancyTextModeChoice.module.css';

export type VacancyTextMode = 'manual' | 'ai';

export interface VacancyTextModeChoiceProps {
  mode: VacancyTextMode | null;
  onModeChange: (mode: VacancyTextMode) => void;
  onNext: () => void;
}

export function VacancyTextModeChoice({ mode, onModeChange, onNext }: VacancyTextModeChoiceProps) {
  return (
    <div>
      <Card>
        <CardHeader
          title="Vacaturetekst"
          description="Schrijf de tekst zelf, of laat Taldo een concept opstellen op basis van een paar korte vragen."
        />
        <div className={styles.grid}>
          <ChoiceCard
            icon={<Pencil size={22} aria-hidden="true" />}
            title="Zelf schrijven"
            body="Je hebt de tekst al klaarliggen of schrijft hem liever helemaal zelf."
            selected={mode === 'manual'}
            onSelect={() => onModeChange('manual')}
          />
          <ChoiceCard
            icon={<Sparkles size={22} aria-hidden="true" />}
            title="Taldo stelt een concept op"
            body="Beantwoord drie korte vragen en Taldo schrijft een concept voor je."
            selected={mode === 'ai'}
            onSelect={() => onModeChange('ai')}
            variant="advice"
          />
        </div>
      </Card>
      <Card variant="advice" className={styles.advice}>
        <div className={styles.adviceTitle}>Een concept vacaturetekst bespaart gemiddeld 20 minuten</div>
        <div className={styles.adviceFigure}>3 vragen · ±2 min</div>
        <div className={styles.adviceBody}>
          Je blijft eigenaar van de tekst — elk onderdeel is daarna nog los aan te passen of opnieuw te
          laten genereren.
        </div>
      </Card>
      <div className={styles.footer}>
        <Button type="button" disabled={mode === null} onClick={onNext}>
          {mode === 'ai' ? 'Beantwoord 3 vragen' : 'Volgende'}
        </Button>
      </div>
    </div>
  );
}
