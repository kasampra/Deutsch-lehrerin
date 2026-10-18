export interface GrammarDrillItem {
  id: string;
  type: 'article' | 'case_preposition';
  prompt: string;
  wordOrSentence: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const GRAMMAR_DRILLS: GrammarDrillItem[] = [
  // Der / Die / Das
  {
    id: 'art-1',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Mädchen (girl)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'das',
    explanation: 'Diminutive mit -chen sind im Deutschen IMMER Neutrum (das Mädchen).',
  },
  {
    id: 'art-2',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Termin (appointment)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'der',
    explanation: 'Maskulinum: der Termin.',
  },
  {
    id: 'art-3',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Wohnung (apartment)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'die',
    explanation: 'Nomen mit der Endung -ung sind immer Femininum (die Wohnung).',
  },
  {
    id: 'art-4',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Problem (problem)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'das',
    explanation: 'Nomen griechischen Ursprungs auf -em/-ma sind meist Neutrum (das Problem, das Thema).',
  },
  {
    id: 'art-5',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Möglichkeit (possibility)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'die',
    explanation: 'Nomen mit der Endung -keit/-heit sind immer Femininum (die Möglichkeit).',
  },
  {
    id: 'art-6',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Schlüssel (key)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'der',
    explanation: 'Maskulinum: der Schlüssel.',
  },
  {
    id: 'art-7',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Universität (university)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'die',
    explanation: 'Nomen mit der Endung -tät sind immer Femininum (die Universität).',
  },
  {
    id: 'art-8',
    type: 'article',
    prompt: 'Wähle den richtigen Artikel:',
    wordOrSentence: '___ Dokument (document)',
    options: ['der', 'die', 'das'],
    correctAnswer: 'das',
    explanation: 'Neutrum: das Dokument.',
  },

  // Dativ vs Akkusativ & Wechselpräpositionen
  {
    id: 'case-1',
    type: 'case_preposition',
    prompt: 'Ergänze die passende Präposition / den Fall:',
    wordOrSentence: 'Ich gehe heute ___ Park. (Wohin?)',
    options: ['in den', 'im', 'ins'],
    correctAnswer: 'in den',
    explanation: 'Wechselpräposition "in" + Richtung (Wohin?): Akkusativ maskulin -> in den Park.',
  },
  {
    id: 'case-2',
    type: 'case_preposition',
    prompt: 'Ergänze die passende Präposition / den Fall:',
    wordOrSentence: 'Ich sitze gerade ___ Café. (Wo?)',
    options: ['in das', 'im', 'am'],
    correctAnswer: 'im',
    explanation: 'Wechselpräposition "in" + Ort (Wo?): Dativ neutrum -> im (in dem) Café.',
  },
  {
    id: 'case-3',
    type: 'case_preposition',
    prompt: 'Ergänze die passende Form:',
    wordOrSentence: 'Kannst du ___ bitte helfen? (helfen + Dativ)',
    options: ['mich', 'mir', 'ich'],
    correctAnswer: 'mir',
    explanation: 'Das Verb "helfen" verlangt IMMER das Dativ-Objekt (hilf mir!).',
  },
  {
    id: 'case-4',
    type: 'case_preposition',
    prompt: 'Ergänze die passende Form:',
    wordOrSentence: 'Wir fahren am Wochenende ___ Schweiz.',
    options: ['nach', 'in die', 'in der'],
    correctAnswer: 'in die',
    explanation: 'Länder mit femininem Artikel verlangen bei Richtung "in die" (in die Schweiz, in die Türkei).',
  },
  {
    id: 'case-5',
    type: 'case_preposition',
    prompt: 'Ergänze die passende Form:',
    wordOrSentence: 'Ich warte seit 10 Minuten ___ Bus.',
    options: ['auf dem', 'auf den', 'an den'],
    correctAnswer: 'auf den',
    explanation: '"Warten auf" verlangt den Akkusativ (der Bus -> auf den Bus).',
  },
];
