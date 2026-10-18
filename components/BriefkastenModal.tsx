import React, { useState } from 'react';
import { AIProvider } from '../services/aiProvider';

interface BriefkastenModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiProvider: AIProvider | null;
  onStartScenarioCall: (scenarioInstruction: string, title: string) => void;
}

interface LetterPreset {
  id: string;
  title: string;
  sender: string;
  snippet: string;
  fullText: string;
}

const PRESET_LETTERS: LetterPreset[] = [
  {
    id: 'rundfunk',
    title: 'Rundfunkbeitrag (ARD ZDF Deutschlandradio)',
    sender: 'Beitragsservice von ARD, ZDF und Deutschlandradio',
    snippet: 'Anmeldung Ihrer Wohnung / Klärung des Beitragskontos',
    fullText: `Sehr geehrte Damen und Herren,

für die von Ihnen bewohnte Wohnung in der Musterstraße 12, 10115 Berlin, liegt uns bisher keine Anmeldung vor. Nach dem Rundfunkbeitragsstaatsvertrag (RBStV) ist für jede Wohnung ein Rundfunkbeitrag von monatlich 18,36 Euro zu entrichten.

Bitte teilen Sie uns innerhalb von vier Wochen mit dem beigefügten Antwortbogen mit, ob für diese Wohnung bereits ein Beitragskonto unter einer anderen Person besteht (z.B. Mitbewohner oder Partner), oder füllen Sie die Anmeldung aus.

Mit freundlichen Grüßen
Ihr Beitragsservice von ARD, ZDF und Deutschlandradio`,
  },
  {
    id: 'buergeramt',
    title: 'Meldebestätigung & Steuer-Identifikationsnummer',
    sender: 'Bürgeramt Berlin Mitte',
    snippet: 'Bestätigung der Anmeldung einer Wohnung',
    fullText: `Amtliche Meldebestätigung

Herr / Frau Max Mustermann, geboren am 01.01.1995.
Hiermit wird bestätigt, dass Sie seit dem 01.08.2026 unter der Anschrift Musterstraße 12, 10115 Berlin als alleinige Wohnung gemeldet sind.

Hinweis: Ihre persönliche steuerliche Identifikationsnummer (IdNr.) wird Ihnen in den nächsten 2-4 Wochen separat durch das Bundeszentralamt für Steuern per Post zugestellt. Bitte bewahren Sie diese Meldebestätigung sorgfältig auf.`,
  },
  {
    id: 'nebenkosten',
    title: 'Betriebskostenabrechnung (Nachzahlung)',
    sender: 'Hausverwaltung Immobilien Müller GmbH',
    snippet: 'Abrechnung der Heiz- und Betriebskosten für das Vorjahr',
    fullText: `Sehr geehrter Mieter,

anbei erhalten Sie die Abrechnung der Betriebskosten für das Kalenderjahr. Aufgrund gestiegener Energiekosten ergibt sich für Ihren Mietbereich eine Nachzahlung in Höhe von 342,80 Euro.

Bitte überweisen Sie den ausstehenden Betrag bis spätestens zum 30. des kommenden Monats auf das unten angegebene Mietkonto. Gleichzeitig passen wir die monatliche Vorauszahlung ab dem übernächsten Monat um 30,00 Euro an.`,
  },
];

const BriefkastenModal: React.FC<BriefkastenModalProps> = ({
  isOpen,
  onClose,
  aiProvider,
  onStartScenarioCall,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<LetterPreset>(PRESET_LETTERS[0]);
  const [letterContent, setLetterContent] = useState<string>(PRESET_LETTERS[0].fullText);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    summaryDe: string;
    summaryEn: string;
    actionRequired: string;
    deadline: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: LetterPreset) => {
    setSelectedPreset(preset);
    setLetterContent(preset.fullText);
    setAnalysis(null);
  };

  const analyzeLetter = async () => {
    if (!letterContent.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    const systemInstruction = `You are an expert advisor helping foreigners understand official German letters and bureaucratic mail (Beamtendeutsch).
Analyze the provided German letter and respond strictly with a valid JSON object with the following fields:
{
  "summaryDe": "1-2 sentence clear, simple German summary of what this letter is about",
  "summaryEn": "1-2 sentence plain English explanation",
  "actionRequired": "Concrete step the recipient must take (e.g. Reply within 4 weeks, Pay 342€, or Just file for records)",
  "deadline": "Deadline if specified in letter, or 'Keine Frist' if none"
}`;

    try {
      if (aiProvider) {
        const raw = await aiProvider.chat(letterContent, systemInstruction, []);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAnalysis(parsed);
        } else {
          setAnalysis({
            summaryDe: 'Das Dokument ist ein offizielles Schreiben.',
            summaryEn: 'The document is official correspondence requiring your review.',
            actionRequired: 'Bitte prüfen Sie Fristen und Zahlungsaufforderungen.',
            deadline: 'Siehe Brieftext',
          });
        }
      } else {
        // Fallback simulation when offline/no provider
        setAnalysis({
          summaryDe: 'Der Brief fordert Sie auf, Ihren Wohnstatus für den Rundfunkbeitrag oder Unterlagen zu bestätigen.',
          summaryEn: 'This letter asks you to clarify your residency status or payment obligation.',
          actionRequired: 'Antwortbogen ausfüllen oder Nachzahlung überweisen.',
          deadline: 'Innerhalb von 4 Wochen',
        });
      }
    } catch (e) {
      console.error('Failed to analyze letter:', e);
      setAnalysis({
        summaryDe: 'Konnte nicht analysiert werden. Bitte prüfen Sie den Text manuell.',
        summaryEn: 'Analysis failed. Please check the text manually.',
        actionRequired: 'Manuelle Überprüfung empfohlen',
        deadline: 'Unbekannt',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRoleplayForLetter = () => {
    const roleplayInstruction = `The student just received this official German letter:\n"${letterContent.slice(0, 500)}..."\n\nYou are the civil servant or representative from the issuing institution (${selectedPreset.sender || 'dem zuständigen Amt'}). The student is calling you on the phone to ask questions about this letter, clarify their situation, or ask for an extension. Greet them politely: "Guten Tag, wie kann ich Ihnen weiterhelfen?" and conduct a realistic German phone consultation. Correct mistakes gently with [Korrektur: 'incorrect' -> 'correct' | explanation].`;

    onStartScenarioCall(roleplayInstruction, `Telefonat: ${selectedPreset.title}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📬</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Briefkasten — German Letter Explainer</h2>
              <p className="text-xs text-gray-500">Decode German letters, deadlines & practice calling the agency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Choose a Sample Letter or Paste Your Own:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_LETTERS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    selectedPreset.id === preset.id
                      ? 'border-black bg-gray-900 text-white font-medium'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-bold truncate">{preset.title}</p>
                  <p className={`text-[10px] truncate ${selectedPreset.id === preset.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    {preset.sender}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Letter Input Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">German Letter Text:</label>
              <span className="text-[10px] text-gray-400">{letterContent.length} chars</span>
            </div>
            <textarea
              rows={6}
              value={letterContent}
              onChange={e => setLetterContent(e.target.value)}
              placeholder="Paste German letter or document text here..."
              className="w-full text-xs font-mono p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-black leading-relaxed"
            />
          </div>

          {/* Analyze Action */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={analyzeLetter}
              disabled={isAnalyzing || !letterContent.trim()}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Decoding Beamtendeutsch...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Explain This Letter</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💡</span> Plain Language Summary
                </span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  Frist: {analysis.deadline}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="font-bold text-gray-900 mb-1">🇩🇪 Einfaches Deutsch</p>
                  <p className="text-gray-700 leading-relaxed text-[11px]">{analysis.summaryDe}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="font-bold text-gray-900 mb-1">🇬🇧 Plain English</p>
                  <p className="text-gray-700 leading-relaxed text-[11px]">{analysis.summaryEn}</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex items-start space-x-2 text-xs">
                <span className="text-amber-500 font-bold text-base leading-none">⚠️</span>
                <div>
                  <p className="font-bold text-gray-900">What You Must Do:</p>
                  <p className="text-gray-700 mt-0.5">{analysis.actionRequired}</p>
                </div>
              </div>

              {/* Call Simulator Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={startRoleplayForLetter}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <span>📞</span>
                  <span>Practice Calling This Office (Frau Müller Roleplay)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BriefkastenModal;
